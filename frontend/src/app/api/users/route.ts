import { NextRequest, NextResponse } from "next/server";
import { backendRequest } from "@/lib/backend-api";

type BackendUser = {
  id: string;
  email: string;
  full_name?: string | null;
  created_at?: string | null;
  is_superuser: boolean;
};

function mapUser(user: BackendUser) {
  return {
    id: user.id,
    name: user.full_name || user.email.split("@")[0],
    email: user.email,
    registeredAt: user.created_at || null,
    isAdmin: user.is_superuser,
    isProtected: false,
  };
}

export async function GET(req: NextRequest) {
  const response = await backendRequest(req, "/users/?skip=0&limit=100");
  if (!response.ok) return response;

  try {
    const users = await response.json() as BackendUser[];
    return NextResponse.json(users.map(mapUser));
  } catch {
    return NextResponse.json({ detail: "The account service returned invalid data." }, { status: 502 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, isAdmin } = await req.json();
    if (typeof id !== "string" || typeof isAdmin !== "boolean") {
      return NextResponse.json({ detail: "User ID and admin status are required." }, { status: 400 });
    }
    return backendRequest(req, `/users/${encodeURIComponent(id)}`, { is_superuser: isAdmin });
  } catch {
    return NextResponse.json({ detail: "The user update request is invalid." }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ detail: "User ID is required." }, { status: 400 });
  return backendRequest(req, `/users/${encodeURIComponent(id)}`);
}