from typing import Literal, Optional

from datetime import datetime
from pydantic import AliasChoices, BaseModel, ConfigDict, Field


TicketUnit = Optional[str]
TicketCategory = Optional[str]
TicketPriority = Optional[str]
TicketStatus = Literal["Pending", "In Progress", "Remote Connected", "Resolved"]


class TicketCreate(BaseModel):
    unit: Optional[str] = "General"
    location: str = Field(min_length=1, max_length=255)
    assigned_member: Optional[str] = Field(default="IT Admin", max_length=255)
    category: Optional[str] = "Chatbot"
    priority: Optional[str] = "Medium"
    title: Optional[str] = "Chatbot Query"
    description: str = Field(min_length=1)
    device_ip: Optional[str] = Field(default=None, max_length=64)
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None

class TicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    unit: Optional[str] = None
    location: Optional[str] = None
    device_ip: Optional[str] = None
    assigned_member: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    title: Optional[str] = None
    description: str = Field(validation_alias=AliasChoices("description", "query"))
    status: str
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class TicketStatusUpdate(BaseModel):
    status: Optional[TicketStatus] = None
    assigned_member: Optional[str] = Field(default=None, max_length=255)
    resolution_notes: Optional[str] = None