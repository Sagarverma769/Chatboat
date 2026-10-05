from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TicketCreate(BaseModel):
    query_text: str

class TicketResponse(BaseModel):
    id: int
    user_name: str
    user_email: str
    query_text: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class TicketStatusUpdate(BaseModel):
    status: str