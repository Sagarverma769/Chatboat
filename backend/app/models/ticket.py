from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
try:
    from db.base import Base  # when running from backend/ root
except ImportError:
    from backend.db.base import Base  # fallback for alternate run paths


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=True)
    user_email = Column(String, nullable=False)
    user_name = Column(String, nullable=True)
    unit = Column(String, nullable=True)
    location = Column(String, nullable=True)
    device_ip = Column(String, nullable=True)
    assigned_member = Column(String, nullable=False, default="Any Available IT Specialist")
    category = Column(String, nullable=False, default="Software")
    priority = Column(String, nullable=False, default="Medium")
    title = Column(String, nullable=True)
    query = Column(Text, nullable=False)
    bot_response = Column(Text, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    status = Column(String, default="Pending", nullable=False)
    hidden_from_admin = Column(Boolean, default=False, nullable=False, server_default="false")
    hidden_from_user = Column(Boolean, default=False, nullable=False, server_default="false")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
