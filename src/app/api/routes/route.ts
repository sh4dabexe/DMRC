import { NextResponse } from 'next/server';
import { metroGraph } from '@/engine/graph';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from')?.trim();
  const to = searchParams.get('to')?.trim();
  const isSundayOrHoliday = searchParams.get('isSunday') === 'true';
  const departureTime = searchParams.get('time') || '10:00';

  if (!from || !to) {
    return NextResponse.json(
      { error: 'Both "from" and "to" station IDs are required.' },
      { status: 400 }
    );
  }

  const result = metroGraph.findMultiRoutes(from, to, {
    isSundayOrHoliday,
    departureTime,
    maxResults: 5
  });

  if (!result) {
    return NextResponse.json(
      { error: 'Invalid station specified.' },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}
