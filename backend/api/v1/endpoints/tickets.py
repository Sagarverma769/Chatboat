from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from api.deps import get_db, get_current_active_user, get_current_active_superuser
from app.models.ticket import SupportTicket
from app.schemas.ticket import TicketCreate, TicketResponse, TicketStatusUpdate

router = APIRouter(prefix="/tickets", tags=["Support Tickets"])

@router.post("/submit", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def submit_query(
    ticket_in: TicketCreate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    new_ticket = SupportTicket(
        user_id=str(getattr(current_user, "id", "")),
        user_email=current_user.email,
        user_name=current_user.full_name or current_user.email.split("@", 1)[0],
        unit=ticket_in.unit or "General",
        location=ticket_in.location.strip(),
        device_ip=ticket_in.device_ip,
        assigned_member=ticket_in.assigned_member or "IT Admin",
        category=ticket_in.category or "Chatbot",
        priority=ticket_in.priority or "Medium",
        title=ticket_in.title.strip() if ticket_in.title else "Chatbot Query",
        query=ticket_in.description.strip(),
        status="Pending",
    )
    db.add(new_ticket)
    await db.commit()
    await db.refresh(new_ticket)
    return new_ticket


@router.get("/me", response_model=List[TicketResponse])
async def get_my_tickets(
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SupportTicket)
        .where(
            SupportTicket.user_id == str(current_user.id),
            SupportTicket.hidden_from_user.is_(False),
        )
        .order_by(SupportTicket.created_at.desc())
    )
    return result.scalars().all()

@router.get("/admin/all", response_model=List[TicketResponse])
async def get_all_tickets(
    current_admin = Depends(get_current_active_superuser),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(SupportTicket)
        .where(SupportTicket.hidden_from_admin.is_(False))
        .order_by(SupportTicket.created_at.desc())
    )
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
    
    update_data = status_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="At least one ticket field must be updated.")
    for field, value in update_data.items():
        setattr(ticket, field, value)
    await db.commit()
    await db.refresh(ticket)
    return ticket


@router.delete("/admin/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ticket(
    ticket_id: int,
    current_admin=Depends(get_current_active_superuser),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.hidden_from_admin = True
    await db.commit()


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_ticket(
    ticket_id: int,
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SupportTicket).where(
            SupportTicket.id == ticket_id,
            SupportTicket.user_id == str(current_user.id),
            SupportTicket.hidden_from_user.is_(False),
        )
    )
    ticket = result.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.hidden_from_user = True
    await db.commit()
