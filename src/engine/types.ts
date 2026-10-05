export interface Station {
  id: string;
  name: string;
  aliases: string[];
  lines: string[];
  x: number;
  y: number;
  zone: string;
  active: boolean;
}

export interface Line {
  id: string;
  name: string;
  color: string;
  textColor: string;
  operator: string;
  active: boolean;
  description: string;
}

export interface Connection {
  from: string;
  to: string;
  line: string;
  distance_km: number;
  travel_time_min: number;
  bidirectional: boolean;
}

export interface Interchange {
  station: string;
  stationName: string;
  lines: string[];
  transfer_time_min: number;
  walk_distance_m: number;
}

export interface RouteSegment {
  lineId: string;
  lineName: string;
  lineColor: string;
  lineTextColor: string;
  fromStationId: string;
  fromStationName: string;
  toStationId: string;
  toStationName: string;
  stations: Station[];
  stationCount: number;
  distance_km: number;
  travel_time_min: number;
}

export interface InterchangePoint {
  stationId: string;
  stationName: string;
  fromLineId: string;
  fromLineName: string;
  toLineId: string;
  toLineName: string;
  transferTimeMin: number;
}

export interface FareBreakdown {
  tokenFare: number;
  smartCardFare: number;
  isSundayOrHoliday: boolean;
  isOffPeak: boolean;
  discountAppliedPercent: number;
  currency: string;
  slabApplied: string;
}

export interface MetroRoute {
  id: string;
  routeNumber: number;
  label: "Least Stations" | "Fewer Interchanges" | "Direct Route" | "Fastest" | "Alternative";
  stationCount: number;
  interchangeCount: number;
  distance_km: number;
  travel_time_min: number;
  fare: FareBreakdown;
  linesUsed: string[];
  interchanges: InterchangePoint[];
  segments: RouteSegment[];
  stationSequence: Station[];
  whyThisRoute: string;
}

export interface RouteQueryResult {
  from: Station;
  to: Station;
  minimumStations: number;
  windowMaxStations: number;
  routes: MetroRoute[];
  calculatedAt: string;
}
