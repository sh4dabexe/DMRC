import faresData from '../data/fares.json';
import { FareBreakdown } from './types';

export function calculateFare(
  distanceKm: number,
  options: {
    isSundayOrHoliday?: boolean;
    departureTime?: string; // HH:MM
    isAirportExpress?: boolean;
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

  // Find slab
  let tokenFare = 64;
  let slabApplied = "> 32 km";

  for (const slab of faresData.slabs) {
    if (distanceKm >= slab.minKm && distanceKm < slab.maxKm) {
      tokenFare = isSunday ? slab.sundayFare : slab.weekdayFare;
      slabApplied = `${slab.minKm}-${slab.maxKm === 999 ? '32+' : slab.maxKm} km`;
      break;
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
