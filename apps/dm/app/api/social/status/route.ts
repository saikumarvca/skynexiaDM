import { NextResponse } from 'next/server';
import { getSocialPlatformStatus } from '@/lib/social-publishing';

export async function GET() {
  const status = getSocialPlatformStatus();
  return NextResponse.json(status);
}
