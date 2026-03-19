import { NextResponse } from 'next/server';

const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || '0';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    { buildId: BUILD_ID },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache' } }
  );
}
