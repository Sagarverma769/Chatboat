from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from db.base import Base

class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=True)
    user_email = Column(String, nullable=True)
    query = Column(Text, nullable=False)
    bot_response = Column(Text, nullable=True)
    status = Column(String, default="Open")
    created_at = Column(DateTime, default=datetime.utcnow)

