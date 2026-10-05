import { NextResponse } from 'next/server';
import { metroGraph } from '@/engine/graph';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase().trim();

  const stations = metroGraph.getAllStations();

  if (q) {
    const filtered = stations.filter(
      s => s.name.toLowerCase().includes(q) || s.aliases.some(a => a.includes(q))
    );
    return NextResponse.json({ stations: filtered });
  }

  return NextResponse.json({ stations });
}
