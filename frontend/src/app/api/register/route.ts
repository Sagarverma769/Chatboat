import { NextRequest, NextResponse } from "next/server";
import { backendRequest } from "@/lib/backend-api";

export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name } = await req.json();
    if (!email || !password || !full_name) {
      return NextResponse.json({ detail: "Name, email, and password are required." }, { status: 400 });
    }

    return backendRequest(req, "/auth/register", { email, password, full_name });
  } catch {
    return NextResponse.json({ detail: "Registration request could not be processed." }, { status: 400 });
  }
}