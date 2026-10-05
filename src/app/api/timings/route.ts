import { NextResponse } from 'next/server';
import { metroGraph } from '@/engine/graph';
import serviceRulesData from '@/data/service_rules.json';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stationId = searchParams.get('station')?.toLowerCase().trim();

  if (!stationId) {
    return NextResponse.json(
      { error: 'Station query parameter is required.' },
      { status: 400 }
    );
  }

  const station = metroGraph.getStation(stationId);
  if (!station) {
    return NextResponse.json(
      { error: 'Station not found.' },
      { status: 404 }
    );
  }

  const stationLines = station.lines.map(lineId => metroGraph.getLineSafe(lineId));

  return NextResponse.json({
    station: {
      id: station.id,
      name: station.name,
      zone: station.zone,
      lines: stationLines
    },
    timings: {
      firstTrain: serviceRulesData.operationalHours.firstTrainDefault,
      firstTrainSunday: serviceRulesData.operationalHours.sundayFirstTrainDefault,
      lastTrain: serviceRulesData.operationalHours.lastTrainDefault,
      peakHours: serviceRulesData.peakHours
    },
    notice: "Exact first and last train timings can vary by terminal direction and service blocks."
  });
}
