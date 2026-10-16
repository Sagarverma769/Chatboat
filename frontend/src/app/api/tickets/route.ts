import { NextRequest, NextResponse } from 'next/server';
import { backendRequest } from '@/lib/backend-api';

type BackendTicket = {
  id: number;
  unit?: string | null;
  location?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  assigned_member?: string | null;
  category?: string | null;
  priority?: string | null;
  title?: string | null;
  description?: string | null;
  status: string;
  resolution_notes?: string | null;
  created_at: string;
  updated_at?: string | null;
};

function mapTicket(ticket: BackendTicket) {
  return {
    id: String(ticket.id),
    unit: ticket.unit || "General",
    location: ticket.location || "Not recorded",
    userName: ticket.user_name || ticket.user_email || "Unknown user",
    userEmail: ticket.user_email || "",
    assignedMember: ticket.assigned_member || "IT Admin",
    category: ticket.category || "Chatbot",
    priority: ticket.priority || "Medium",
    title: ticket.title || "Chatbot Query",
    description: ticket.description || "",
    status: ticket.status,
    resolutionNotes: ticket.resolution_notes || undefined,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at || ticket.created_at,
  };
}

export async function GET(req: NextRequest) {
  const isAdmin = new URL(req.url).searchParams.get('admin') === 'true';
  const response = await backendRequest(req, isAdmin ? '/tickets/admin/all' : '/tickets/me');
  if (!response.ok) return response;

  try {
    const tickets = await response.json() as BackendTicket[];
    return NextResponse.json({ tickets: tickets.map(mapTicket) });
  } catch {
    return NextResponse.json({ detail: 'The ticket service returned invalid data.' }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const response = await backendRequest(req, '/tickets/submit', {
      unit: data.unit || "General",
      location: data.location,
      assigned_member: data.assignedMember || "IT Admin",
      category: data.category || "Chatbot",
      priority: data.priority || "Medium",
      title: "Chatbot Query",
      description: data.description,
    });
    if (!response.ok) return response;
    const ticket = await response.json() as BackendTicket;
    return NextResponse.json({ ticket: mapTicket(ticket) }, { status: response.status });
  } catch {
    return NextResponse.json({ detail: 'Failed to submit ticket to the backend.' }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status, assignedMember, resolutionNotes } = await req.json();
    if (!id) return NextResponse.json({ detail: 'Ticket ID is required.' }, { status: 400 });
    const response = await backendRequest(req, `/tickets/admin/${encodeURIComponent(String(id))}/status`, {
      status,
      assigned_member: assignedMember,
      resolution_notes: resolutionNotes,
    });
    if (!response.ok) return response;
    return NextResponse.json({ ticket: mapTicket(await response.json() as BackendTicket) });
  } catch {
    return NextResponse.json({ detail: 'Failed to update the backend ticket.' }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ detail: 'Ticket ID is required.' }, { status: 400 });
  const path = searchParams.get('admin') === 'true'
    ? `/tickets/admin/${encodeURIComponent(id)}`
    : `/tickets/${encodeURIComponent(id)}`;
  return backendRequest(req, path);
}
