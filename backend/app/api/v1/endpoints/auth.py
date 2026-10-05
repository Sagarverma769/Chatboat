import random
import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, EmailStr

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, VerifyOTPRequest, ResetPasswordRequest
from app.core.security import get_password_hash, verify_password, create_access_token

router = APIRouter()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed. This email is already registered."
        )
    
    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        is_active=True
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.post("/login")
async def login_step1(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalars().first()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password."
        )
    
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account.")
        
    # Generate 6-digit OTP valid for 5 minutes
    otp_code = f"{random.randint(100000, 999999)}"
    user.mfa_otp = otp_code
    user.mfa_otp_expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    await db.commit()
    
    # SIMULATED MAIL SENDER: Print OTP to terminal console
    print(f"\n==========================================")
    print(f"[EMAIL SERVICE] 2FA OTP for {user.email}: {otp_code}")
    print(f"==========================================\n")
    
    return {
        "mfa_required": True,
        "message": f"OTP sent to {user.email}. Please verify to complete login.",
        "email": user.email
    }

@router.post("/verify-otp")
async def verify_otp(data: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalars().first()
    
    if not user or not user.mfa_otp:
        raise HTTPException(status_code=400, detail="Invalid OTP request.")
        
    if datetime.utcnow() > user.mfa_otp_expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired. Please log in again.")
        
    if user.mfa_otp != data.otp:
        raise HTTPException(status_code=400, detail="Invalid 6-digit OTP code.")
        
    # Clear OTP after successful check
    user.mfa_otp = None
    user.mfa_otp_expires_at = None
    await db.commit()
    
    access_token = create_access_token(subject=user.email)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalars().first()
    
    # Requirement: Return error if email does not exist
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This email address does not exist in our records."
        )
        
    # Generate unique reset token valid for 15 minutes
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires_at = datetime.utcnow() + timedelta(minutes=15)
    await db.commit()
    
    reset_link = f"http://localhost:3000/reset-password?token={token}"
    
    # SIMULATED MAIL SENDER: Print reset link to terminal console
    print(f"\n==========================================")
    print(f"[EMAIL SERVICE] Password Reset Link for {user.email}:")
    print(f"{reset_link}")
    print(f"==========================================\n")
    
    return {"message": f"Password reset link has been sent to {user.email}."}

@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.reset_token == data.token))
    user = result.scalars().first()
    
    if not user or not user.reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
        
    if datetime.utcnow() > user.reset_token_expires_at:
        raise HTTPException(status_code=400, detail="Reset token has expired.")
        
    # Update password in backend database
    user.hashed_password = get_password_hash(data.new_password)
    user.reset_token = None
    user.reset_token_expires_at = None
    await db.commit()
    
    return {"message": "Password updated successfully! You can now log in with your new password."}
