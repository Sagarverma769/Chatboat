import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    return NextResponse.json(
      { detail: 'Password reset email delivery is not configured. Contact your administrator.' },
      { status: 503 },
    );
  } catch {
    return NextResponse.json({ detail: 'Password reset request could not be processed.' }, { status: 400 });
  }
}
