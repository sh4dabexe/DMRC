import faresData from '../data/fares.json';
import { FareBreakdown } from './types';

export function calculateFare(
  distanceKm: number,
  options: {
    isSundayOrHoliday?: boolean;
    departureTime?: string; // HH:MM
    isAirportExpress?: boolean;
    airportDistanceKm?: number;
  } = {}
): FareBreakdown {
  const isSunday = !!options.isSundayOrHoliday;
  const time = options.departureTime || "10:00";

  // Check off-peak window:
  // Weekday off-peak: 05:30-08:00, 12:00-17:00, 21:00-23:59
  let isOffPeak = false;
  if (!isSunday) {
    const [h, m] = time.split(":").map(Number);
    const minutes = h * 60 + (m || 0);
    const isMorningOffPeak = minutes >= (5 * 60 + 30) && minutes < (8 * 60);
    const isMiddayOffPeak = minutes >= (12 * 60) && minutes < (17 * 60);
    const isNightOffPeak = minutes >= (21 * 60) && minutes <= (24 * 60);
    isOffPeak = isMorningOffPeak || isMiddayOffPeak || isNightOffPeak;
  }

  let tokenFare = 0;
  let slabApplied = "";

  const airportKm = options.airportDistanceKm || 0;
  const regularKm = Math.max(0, distanceKm - airportKm);

  // If the route has an Airport Express (Orange Line) component
  if (options.isAirportExpress || airportKm > 0) {
    let airportToken = 60;
    const targetAirportKm = airportKm > 0 ? airportKm : distanceKm;

    for (const slab of faresData.airportExpressSlabs) {
      if (targetAirportKm >= slab.minKm && targetAirportKm < slab.maxKm) {
        airportToken = isSunday ? slab.sundayFare : slab.weekdayFare;
        break;
      }
    }

    if (regularKm > 0) {
      // Combined journey: regular network fare + airport express fare
      let regularToken = 64;
      if (regularKm <= 2) regularToken = 11;
      else if (regularKm <= 5) regularToken = isSunday ? 11 : 21;
      else if (regularKm <= 12) regularToken = isSunday ? 21 : 32;
      else if (regularKm <= 21) regularToken = isSunday ? 32 : 43;
      else if (regularKm <= 32) regularToken = isSunday ? 43 : 54;
      else regularToken = isSunday ? 54 : 64;

      tokenFare = regularToken + airportToken;
      slabApplied = `Regular ${regularKm.toFixed(1)}km (₹${regularToken}) + Airport ${targetAirportKm.toFixed(1)}km (₹${airportToken})`;
    } else {
      // Pure Airport Express journey
      tokenFare = airportToken;
      slabApplied = `Airport Express (${targetAirportKm.toFixed(1)} km)`;
    }
  } else {
    // Pure Regular Metro journey:
    // Core DMRC Rule: Always calculate price on the basis of minimum distance
    if (distanceKm <= 2) {
      tokenFare = 11;
      slabApplied = "0 to 2 km";
    } else if (distanceKm <= 5) {
      tokenFare = isSunday ? 11 : 21;
      slabApplied = "2 to 5 km";
    } else if (distanceKm <= 12) {
      tokenFare = isSunday ? 21 : 32;
      slabApplied = "5 to 12 km";
    } else if (distanceKm <= 21) {
      tokenFare = isSunday ? 32 : 43;
      slabApplied = "12 to 21 km";
    } else if (distanceKm <= 32) {
      tokenFare = isSunday ? 43 : 54;
      slabApplied = "21 to 32 km";
    } else {
      tokenFare = isSunday ? 54 : 64;
      slabApplied = "Beyond 32 km";
    }
  }

  // Calculate Smart Card Fare:
  // Normal smart card: 10% discount
  // Weekday off-peak: additional 10% discount (20% total)
  let discountPercent = faresData.smartCard.baseDiscountPercent;
  if (!isSunday && isOffPeak) {
    discountPercent += faresData.smartCard.offPeakAdditionalDiscountPercent;
  }

  // DMRC applies discount and rounds to nearest whole Rupee
  const smartCardFare = Math.round(tokenFare * (1 - discountPercent / 100));

  return {
    tokenFare,
    smartCardFare,
    isSundayOrHoliday: isSunday,
    isOffPeak,
    discountAppliedPercent: discountPercent,
    currency: "₹",
    slabApplied
  };
}
