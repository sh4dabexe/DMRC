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
      for (const slab of faresData.slabs) {
        if (regularKm >= slab.minKm && regularKm < slab.maxKm) {
          regularToken = isSunday ? slab.sundayFare : slab.weekdayFare;
          break;
        }
      }
      tokenFare = regularToken + airportToken;
      slabApplied = `Regular ${regularKm.toFixed(1)}km (₹${regularToken}) + Airport ${targetAirportKm.toFixed(1)}km (₹${airportToken})`;
    } else {
      // Pure Airport Express journey
      tokenFare = airportToken;
      slabApplied = `Airport Express (${targetAirportKm.toFixed(1)} km)`;
    }
  } else {
    // Pure Regular Metro journey:
    // Fare is FIXED between origin and destination based on the shortest network distance slab!
    tokenFare = 64;
    slabApplied = "> 32 km";

    for (const slab of faresData.slabs) {
      if (distanceKm >= slab.minKm && distanceKm < slab.maxKm) {
        tokenFare = isSunday ? slab.sundayFare : slab.weekdayFare;
        slabApplied = `${slab.minKm}-${slab.maxKm === 999 ? '32+' : slab.maxKm} km`;
        break;
      }
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
