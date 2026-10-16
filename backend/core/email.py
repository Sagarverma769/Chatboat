import asyncio
import logging
import smtplib
from email.message import EmailMessage

from core.config import settings

logger = logging.getLogger(__name__)


def _send_email(message: EmailMessage) -> None:
    host = settings.SMTP_HOST
    username = settings.SMTP_USERNAME
    password = settings.SMTP_PASSWORD
    sender = settings.SMTP_FROM_EMAIL
    if not host or not username or not password or not sender:
        raise RuntimeError("SMTP configuration is incomplete.")

    message["From"] = sender
    with smtplib.SMTP(host, settings.SMTP_PORT, timeout=20) as server:
        server.starttls()
        server.login(username, password)
        server.send_message(message)


async def _send_otp_email(recipient: str, otp: str, purpose: str) -> None:
    message = EmailMessage()
    message["Subject"] = f"Your {purpose} verification code"
    message["To"] = recipient
    message.set_content(
        f"Your {purpose} verification code is {otp}.\n\n"
        "This code expires in 5 minutes. If you did not request it, "
        "you can ignore this email."
    )

    try:
        await asyncio.to_thread(_send_email, message)
    except (OSError, RuntimeError, smtplib.SMTPException):
        logger.exception("Unable to send %s verification email.", purpose)
        raise


async def send_login_otp(recipient: str, otp: str) -> None:
    await _send_otp_email(recipient, otp, "login")


async def send_registration_otp(recipient: str, otp: str) -> None:
    await _send_otp_email(recipient, otp, "registration")
