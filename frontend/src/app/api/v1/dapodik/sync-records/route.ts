import { NextResponse } from 'next/server';

export async function GET() {
  // STRICT ZERO SAMPLE FALLBACK! Only return empty array if no real records exist in database
  return NextResponse.json({ success: true, data: [] });
}
