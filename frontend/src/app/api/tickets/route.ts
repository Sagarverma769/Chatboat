import { NextRequest, NextResponse } from 'next/server';

export interface ITTicket {
  id: string;
  unit: 'Unit A' | 'Unit B' | 'Unit H';
  location: string;        // e.g. "Room 102, Quality Lab"
  userName: string;
  userEmail: string;
  deviceIp?: string;       // e.g. "192.168.1.45"
  assignedMember: string;  // e.g. "Sagar", "Virender", "Ashwani", "Unassigned"
  category: 'Hardware' | 'Software' | 'Network' | 'Printer' | 'Access';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Remote Connected' | 'Resolved';
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory ticket storage for real-time demo across tabs
let ticketsRegistry: ITTicket[] = [
  {
    id: 'TCK-1001',
    unit: 'Unit A',
    location: 'Building 1 - Room 204 (Accounts Office)',
    userName: 'Ramesh Sharma',
    userEmail: 'ramesh@indsphinx.com',
    deviceIp: '192.168.10.42',
    assignedMember: 'Sagar',
    category: 'Software',
    priority: 'High',
    title: 'ERP Client Crashing on Startup',
    description: 'Unable to open invoice generator module. Error code 0x800412.',
    status: 'In Progress',
    createdAt: '26-09-2026 10:15 AM',
    updatedAt: '26-09-2026 10:45 AM'
  },
  {
    id: 'TCK-1002',
    unit: 'Unit B',
    location: 'Shop Floor 2 - Inspection Room',
    userName: 'Pooja Verma',
    userEmail: 'pooja@indsphinx.com',
    deviceIp: '192.168.20.15',
    assignedMember: 'Virender',
    category: 'Printer',
    priority: 'Medium',
    title: 'Barcode Label Printer Offline',
    description: 'Network thermal printer stopped printing batches. Needs IP reset or paper tray check.',
    status: 'Pending',
    createdAt: '26-09-2026 11:00 AM',
    updatedAt: '26-09-2026 11:00 AM'
  },
  {
    id: 'TCK-1003',
    unit: 'Unit H',
    location: 'Design Cell - Room 301',
    userName: 'Amit Singh',
    userEmail: 'amit@indsphinx.com',
    deviceIp: '192.168.30.88',
    assignedMember: 'Ashwani',
    category: 'Hardware',
    priority: 'Critical',
    title: 'Workstation Display and RAM Beep',
    description: 'CAD Workstation giving 3 continuous beeps on boot. Physical check needed.',
    status: 'Pending',
    createdAt: '26-09-2026 11:20 AM',
    updatedAt: '26-09-2026 11:20 AM'
  }
];

// GET: Retrieve tickets with strict user email or admin access
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const unitFilter = searchParams.get('unit');
  const userEmail = searchParams.get('email');
  const isAdmin = searchParams.get('admin') === 'true';

  let results = [...ticketsRegistry];

  // If user requests their tickets, strictly filter by their email
  if (userEmail) {
    results = results.filter(t => t.userEmail.toLowerCase() === userEmail.trim().toLowerCase());
  } else if (!isAdmin) {
    // If not admin and no email specified, do not leak other users' tickets
    results = [];
  }

  if (unitFilter && unitFilter !== 'All') {
    results = results.filter(t => t.unit.toLowerCase() === unitFilter.toLowerCase());
  }

  return NextResponse.json({ tickets: results });
}

// POST: Raise a new IT support ticket
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.unit || !data.location || !data.userName || !data.title || !data.description) {
      return NextResponse.json(
        { error: 'Please fill in Unit, Location/Room, Name, Title, and Description.' },
        { status: 400 }
      );
    }

    const newTicket: ITTicket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      unit: data.unit,
      location: data.location.trim(),
      userName: data.userName.trim(),
      userEmail: (data.userEmail || 'user@indsphinx.com').trim().toLowerCase(),
      deviceIp: (data.deviceIp || '').trim(),
      assignedMember: data.assignedMember || 'Any Available Specialist',
      category: data.category || 'Software',
      priority: data.priority || 'Medium',
      title: data.title.trim(),
      description: data.description.trim(),
      status: 'Pending',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }),
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
    };

    ticketsRegistry.unshift(newTicket);

    return NextResponse.json({ ticket: newTicket, message: 'Ticket raised successfully' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}

// PATCH: Update ticket status, resolution, or assigned IT member
export async function PATCH(req: NextRequest) {
  try {
    const { id, status, assignedMember, resolutionNotes } = await req.json();

    const ticketIndex = ticketsRegistry.findIndex(t => t.id === id);
    if (ticketIndex === -1) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (status) ticketsRegistry[ticketIndex].status = status;
    if (assignedMember) ticketsRegistry[ticketIndex].assignedMember = assignedMember;
    if (resolutionNotes !== undefined) ticketsRegistry[ticketIndex].resolutionNotes = resolutionNotes;
    ticketsRegistry[ticketIndex].updatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return NextResponse.json({ ticket: ticketsRegistry[ticketIndex], message: 'Ticket updated' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}

// DELETE: Remove a ticket from registry
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 });
    }

    const initialLength = ticketsRegistry.length;
    ticketsRegistry = ticketsRegistry.filter(t => t.id !== id);

    if (ticketsRegistry.length === initialLength) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Ticket ${id} removed successfully` });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 });
  }
}
