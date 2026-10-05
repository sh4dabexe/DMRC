import serviceRulesData from '../data/service_rules.json';

export interface RouteTimingDetails {
  totalTravelTimeMin: number;
  pureTrainTimeMin: number;
  totalInterchangeTimeMin: number;
  waitBufferMin: number;
  isPeakHour: boolean;
  peakLabel: string | null;
  firstTrainEstimated: string;
  lastTrainEstimated: string;
}

export function calculateTiming(
  pureTrainMinutes: number,
  interchangesCount: number,
  transferWalkingMinutes: number,
  departureTime: string = "10:00"
): RouteTimingDetails {
  const waitBufferMin = interchangesCount * 3; // ~3 mins average headway wait per line change
  const totalInterchangeTimeMin = transferWalkingMinutes + waitBufferMin;
  const totalTravelTimeMin = Math.round(pureTrainMinutes + totalInterchangeTimeMin);

  // Peak hour check
  const [h, m] = departureTime.split(":").map(Number);
  const minutes = h * 60 + (m || 0);

  let isPeakHour = false;
  let peakLabel: string | null = null;

  for (const peak of serviceRulesData.peakHours) {
    const [startH, startM] = peak.start.split(":").map(Number);
    const [endH, endM] = peak.end.split(":").map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    if (minutes >= startMin && minutes < endMin) {
      isPeakHour = true;
      peakLabel = peak.label;
      break;
    }
  }

  return {
    totalTravelTimeMin,
    pureTrainTimeMin: Math.round(pureTrainMinutes),
    totalInterchangeTimeMin,
    waitBufferMin,
    isPeakHour,
    peakLabel,
    firstTrainEstimated: serviceRulesData.operationalHours.firstTrainDefault,
    lastTrainEstimated: serviceRulesData.operationalHours.lastTrainDefault
  };
}
