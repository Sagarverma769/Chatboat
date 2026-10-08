import { NextRequest, NextResponse } from 'next/server';
import { backendRequest } from '@/lib/backend-api';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    return backendRequest(req, '/auth/login', { email, password });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
