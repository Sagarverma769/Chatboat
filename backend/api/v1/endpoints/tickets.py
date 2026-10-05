from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from api.deps import get_db, get_current_active_user, get_current_active_superuser
from app.models.ticket import SupportTicket
from app.schemas.ticket import TicketCreate, TicketResponse, TicketStatusUpdate

router = APIRouter(prefix="/tickets", tags=["Support Tickets"])

@router.post("/submit", response_model=TicketResponse)
async def submit_query(
    ticket_in: TicketCreate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    if not ticket_in.query_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query description cannot be empty."
        )
    
    new_ticket = SupportTicket(
        user_id=str(getattr(current_user, "id", "")),
        user_email=getattr(current_user, "email", None),
        query=ticket_in.query_text,
        bot_response=ticket_in.bot_response
    )
    db.add(new_ticket)
    await db.commit()
    await db.refresh(new_ticket)
    return new_ticket

@router.get("/admin/all", response_model=List[TicketResponse])
async def get_all_tickets(
    current_admin = Depends(get_current_active_superuser),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(SupportTicket))
    return result.scalars().all()

@router.patch("/admin/{ticket_id}/status", response_model=TicketResponse)
async def update_ticket_status(
    ticket_id: int,
    status_update: TicketStatusUpdate,
    current_admin = Depends(get_current_active_superuser),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket.status = status_update.status
    await db.commit()
    await db.refresh(ticket)
    return ticket

