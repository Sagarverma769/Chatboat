import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/v1/users", {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch users" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Backend server not reachable" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("id");

    const res = await fetch(`http://127.0.0.1:8000/api/v1/users/${userId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to delete user" }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error contacting backend" }, { status: 500 });
  }
}