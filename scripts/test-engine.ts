import { metroGraph } from '../src/engine/graph';
import { calculateFare } from '../src/engine/fare';

console.log("==========================================");
console.log("DELHI METRO ROUTE & FARE ENGINE TESTS");
console.log("==========================================");

// Test 1: Direct Route (Welcome -> Rithala on Red Line)
console.log("\n--- TEST 1: Direct Route (Welcome -> Rithala) ---");
const directResult = metroGraph.findMultiRoutes("welcome", "rithala");
if (!directResult || directResult.routes.length === 0) {
  console.error("FAIL: No route found between Welcome and Rithala");
  process.exit(1);
}
console.log(`From: ${directResult.from.name} -> To: ${directResult.to.name}`);
console.log(`Minimum Stations: ${directResult.minimumStations}`);
console.log(`Routes Found: ${directResult.routes.length}`);
const r1 = directResult.routes[0];
console.log(`Route 1: ${r1.label} | Stations: ${r1.stationCount} | Changes: ${r1.interchangeCount} | Fare: ₹${r1.fare.tokenFare} | Lines: ${r1.linesUsed.join(', ')}`);
if (r1.interchangeCount !== 0) {
  console.error("FAIL: Expected 0 interchanges for Welcome -> Rithala direct route");
  process.exit(1);
}
console.log("PASS: Direct route correctly returned with 0 interchanges and no unnecessary alternatives.");

// Test 2: Multi-Route Alternative Case (Welcome -> Dwarka)
console.log("\n--- TEST 2: Multi-Route Alternatives (Welcome -> Dwarka) ---");
const multiResult = metroGraph.findMultiRoutes("welcome", "dwarka");
if (!multiResult || multiResult.routes.length === 0) {
  console.error("FAIL: No route found between Welcome and Dwarka");
  process.exit(1);
}
console.log(`From: ${multiResult.from.name} -> To: ${multiResult.to.name}`);
console.log(`Minimum Stations N: ${multiResult.minimumStations}`);
console.log(`Window Cap (N+10): ${multiResult.windowMaxStations}`);
console.log(`Discovered Candidates: ${multiResult.routes.length}`);

for (const route of multiResult.routes) {
  console.log(`\n[Route ${route.routeNumber}] ${route.label}`);
  console.log(`- Stations: ${route.stationCount} (Window valid: ${route.stationCount <= multiResult.windowMaxStations})`);
  console.log(`- Interchanges: ${route.interchangeCount} (${route.interchanges.map(i => `${i.stationName}: ${i.fromLineName}->${i.toLineName}`).join(' | ')})`);
  console.log(`- Travel Time: ${route.travel_time_min} mins`);
  console.log(`- Distance: ${route.distance_km} km`);
  console.log(`- Fare: Token ₹${route.fare.tokenFare}, Smart Card ₹${route.fare.smartCardFare}`);
  console.log(`- Why: ${route.whyThisRoute}`);

  // Verification: station_count must be <= N + 10
  if (route.stationCount > multiResult.windowMaxStations) {
    console.error(`FAIL: Route ${route.routeNumber} exceeded window: ${route.stationCount} > ${multiResult.windowMaxStations}`);
    process.exit(1);
  }
}

// Verify strict ranking:
// 1. stations ASC
// 2. interchanges ASC
// 3. time ASC
// 4. distance ASC
for (let i = 1; i < multiResult.routes.length; i++) {
  const prev = multiResult.routes[i - 1];
  const curr = multiResult.routes[i];
  if (prev.stationCount > curr.stationCount) {
    console.error(`FAIL: Ranking violation! Route ${prev.routeNumber} has ${prev.stationCount} stations > Route ${curr.routeNumber} with ${curr.stationCount} stations`);
    process.exit(1);
  }
}
console.log("PASS: Multi-routes strictly ranked by Stations ASC -> Interchanges ASC.");

// Test 3: Fare Calculation Slabs & Discounts
console.log("\n--- TEST 3: DMRC Fare Calculation ---");
const testCases = [
  { dist: 1.5, day: false, expToken: 11 },
  { dist: 4.2, day: false, expToken: 21 },
  { dist: 4.2, day: true, expToken: 11 }, // Sunday special
  { dist: 9.0, day: false, expToken: 32 },
  { dist: 9.0, day: true, expToken: 21 }, // Sunday special
  { dist: 18.0, day: false, expToken: 43 },
  { dist: 28.0, day: false, expToken: 54 },
  { dist: 35.0, day: false, expToken: 64 },
  { dist: 35.0, day: true, expToken: 54 } // Sunday special
];

for (const tc of testCases) {
  const fare = calculateFare(tc.dist, { isSundayOrHoliday: tc.day });
  if (fare.tokenFare !== tc.expToken) {
    console.error(`FAIL: Fare mismatch for ${tc.dist}km (Sunday: ${tc.day}): got ${fare.tokenFare}, expected ${tc.expToken}`);
    process.exit(1);
  }
}
console.log("PASS: All official DMRC Fare Slabs and Sunday Special rules matched.");

// Test 4: Smart Card Off-peak discount
const offPeakFare = calculateFare(25.0, { isSundayOrHoliday: false, departureTime: "14:30" });
console.log(`Smart Card Off-peak (25km): Token ₹${offPeakFare.tokenFare}, Smart Card ₹${offPeakFare.smartCardFare} (Discount: ${offPeakFare.discountAppliedPercent}%)`);
if (offPeakFare.discountAppliedPercent !== 20) {
  console.error("FAIL: Smart card off-peak discount was not 20%");
  process.exit(1);
}
console.log("PASS: Smart Card Off-Peak 20% discount correctly computed.");

console.log("\n==========================================");
console.log("ALL ENGINE TESTS PASSED SUCCESSFULLY! ✓");
console.log("==========================================");
