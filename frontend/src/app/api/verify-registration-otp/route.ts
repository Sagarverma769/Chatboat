import { NextRequest } from 'next/server';
import { backendRequest } from '@/lib/backend-api';

export async function POST(req: NextRequest) {
  return backendRequest(req, '/auth/verify-registration-otp');
}
