import { NextResponse } from 'next/server';
import metadataData from '@/data/metadata.json';
import linesData from '@/data/lines.json';

export async function GET() {
  const activeLines = linesData.filter(l => l.active && l.id !== 'interchange-walk');

  return NextResponse.json({
    status: "All lines operational",
    networkState: "normal",
    verifiedAt: metadataData.verifiedAt,
    version: metadataData.version,
    source: metadataData.source,
    stats: {
      totalStations: metadataData.stationCount,
      totalLines: activeLines.length,
      totalInterchanges: metadataData.interchangesCount
    },
    lines: activeLines.map(l => ({
      id: l.id,
      name: l.name,
      color: l.color,
      status: "Normal Service"
    }))
  });
}
