import hashlib
import hmac
import logging
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from api.deps import get_db
from core.config import settings
from core.email import send_login_otp, send_registration_otp
from core.security import create_access_token, get_password_hash, verify_password
from models.pending_registration import PendingRegistration
from models.user import User
from schemas.user import Token, UserCreate, VerifyOTPRequest

router = APIRouter()
logger = logging.getLogger(__name__)
OTP_TTL_MINUTES = 5
MAX_OTP_ATTEMPTS = 5


def _hash_otp(email: str, otp: str) -> str:
    return hmac.new(
        settings.SECRET_KEY.encode(),
        f"{email}:{otp}".encode(),
        hashlib.sha256,
    ).hexdigest()


def _clear_login_otp(user: User) -> None:
    user.mfa_otp_hash = None
    user.mfa_otp_expires_at = None
    user.mfa_otp_attempts = 0


def _is_initial_admin(email: str) -> bool:
    configured_email = (settings.FIRST_SUPERUSER_EMAIL or "").strip().lower()
    return bool(configured_email) and email.strip().lower() == configured_email


@router.post("/register")
async def register_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Start email verification for a new registration."""
    clean_email = str(user_in.email).lower().strip()
    result = await db.execute(select(User).where(User.email == clean_email))
    existing_user = result.scalars().first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists in the system.",
        )

    result = await db.execute(
        select(PendingRegistration).where(PendingRegistration.email == clean_email)
    )
    pending = result.scalars().first()
    otp_code = f"{secrets.randbelow(1_000_000):06d}"
    if pending is None:
        pending = PendingRegistration(
            email=clean_email,
            hashed_password=get_password_hash(user_in.password),
            full_name=user_in.full_name,
            otp_hash=_hash_otp(clean_email, otp_code),
            otp_expires_at=datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES),
            otp_attempts=0,
        )
        db.add(pending)
    else:
        pending.hashed_password = get_password_hash(user_in.password)
        pending.full_name = user_in.full_name
        pending.otp_hash = _hash_otp(clean_email, otp_code)
        pending.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES)
        pending.otp_attempts = 0
    await db.commit()

    try:
        await send_registration_otp(clean_email, otp_code)
    except (OSError, RuntimeError, smtplib.SMTPException) as exc:
        await db.delete(pending)
        await db.commit()
        logger.error("Registration OTP email delivery failed for account %s.", clean_email)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to send the verification code. Please check the email address and try again.",
        ) from exc

    return {
        "mfa_required": True,
        "message": "A verification code was sent to your email address.",
    }


@router.post("/verify-registration-otp", response_model=Token)
async def verify_registration_otp(
    data: VerifyOTPRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    clean_email = str(data.email).strip().lower()
    result = await db.execute(
        select(PendingRegistration)
        .where(PendingRegistration.email == clean_email)
        .with_for_update()
    )
    pending = result.scalars().first()
    if pending is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration verification request not found. Please sign up again.",
        )

    expires_at = pending.otp_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) >= expires_at:
        await db.delete(pending)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code expired. Please sign up again.",
        )

    if pending.otp_attempts >= MAX_OTP_ATTEMPTS:
        await db.delete(pending)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many incorrect codes. Please sign up again.",
        )

    if not hmac.compare_digest(pending.otp_hash, _hash_otp(clean_email, data.otp)):
        pending.otp_attempts += 1
        if pending.otp_attempts >= MAX_OTP_ATTEMPTS:
            await db.delete(pending)
            detail = "Too many incorrect codes. Please sign up again."
        else:
            detail = "Invalid verification code."
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        )

    result = await db.execute(select(User).where(User.email == clean_email))
    if result.scalars().first():
        await db.delete(pending)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists in the system.",
        )

    user = User(
        email=clean_email,
        hashed_password=pending.hashed_password,
        full_name=pending.full_name,
        is_active=True,
        is_superuser=_is_initial_admin(clean_email),
        is_verified=True,
    )
    db.add(user)
    await db.delete(pending)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(subject=str(user.id))
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.full_name or clean_email.split("@")[0],
            "role": "admin" if user.is_superuser else "user",
            "is_superuser": user.is_superuser,
        },
    }


@router.post("/login")
async def login(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Validate credentials and send a one-time login verification code."""
    username = None
    password = None

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            body = await request.json()
            username = body.get("username") or body.get("email")
            password = body.get("password")
        except Exception:
            pass
    else:
        try:
            form = await request.form()
            username = form.get("username") or form.get("email")
            password = form.get("password")
        except Exception:
            pass

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )

    clean_email = str(username).strip().lower()
    result = await db.execute(select(User).where(User.email == clean_email))
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email address is not registered. Please sign up first.",
        )

    if not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )

    if user.is_superuser or _is_initial_admin(clean_email):
        user.is_superuser = True
        _clear_login_otp(user)
        await db.commit()
        access_token = create_access_token(subject=str(user.id))
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": user.full_name or clean_email.split("@")[0],
                "role": "admin",
                "is_superuser": True,
            },
        }

    otp_code = f"{secrets.randbelow(1_000_000):06d}"
    user.mfa_otp_hash = _hash_otp(clean_email, otp_code)
    user.mfa_otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES)
    user.mfa_otp_attempts = 0
    await db.commit()

    try:
        await send_login_otp(user.email, otp_code)
    except (OSError, RuntimeError, smtplib.SMTPException) as exc:
        _clear_login_otp(user)
        await db.commit()
        logger.error("Login OTP email delivery failed for account %s.", user.email)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to send the verification code. Please try again later.",
        ) from exc

    return {
        "mfa_required": True,
        "message": "A verification code was sent to your email address.",
    }


@router.post("/verify-otp", response_model=Token)
async def verify_login_otp(
    data: VerifyOTPRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    clean_email = str(data.email).strip().lower()
    result = await db.execute(
        select(User).where(User.email == clean_email).with_for_update()
    )
    user = result.scalars().first()

    if not user or not user.mfa_otp_hash or not user.mfa_otp_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code. Please log in again.",
        )

    if not user.is_active:
        _clear_login_otp(user)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account.",
        )

    expires_at = user.mfa_otp_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) >= expires_at:
        _clear_login_otp(user)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code expired. Please log in again.",
        )

    if user.mfa_otp_attempts >= MAX_OTP_ATTEMPTS:
        _clear_login_otp(user)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many incorrect codes. Please log in again.",
        )

    if not hmac.compare_digest(user.mfa_otp_hash, _hash_otp(clean_email, data.otp)):
        user.mfa_otp_attempts += 1
        if user.mfa_otp_attempts >= MAX_OTP_ATTEMPTS:
            _clear_login_otp(user)
            detail = "Too many incorrect codes. Please log in again."
        else:
            detail = "Invalid verification code."
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        )

    _clear_login_otp(user)
    await db.commit()

    role = "admin" if user.is_superuser else "user"
    access_token = create_access_token(subject=str(user.id))
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.full_name or clean_email.split("@")[0],
            "role": role,
            "is_superuser": user.is_superuser,
        }
    }
