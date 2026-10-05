# Delhi Metro Multi-Route Planner --- Implementation Plan

## 1. Recommended Stack

### Frontend

Recommended:

-   Next.js
-   TypeScript
-   Tailwind CSS
-   Framer Motion / Motion
-   shadcn/ui or custom components
-   Lucide icons

### Routing Engine

For MVP:

-   TypeScript graph engine

For larger scale:

-   Node.js route service
-   Redis/cache if required

### Data

-   JSON for initial static network data
-   PostgreSQL for production/versioned data
-   PostGIS if geographic station/map queries become important

### Hosting

-   Vercel for frontend
-   Serverless/edge API where appropriate
-   Managed PostgreSQL

Gemini is optional.

------------------------------------------------------------------------

## 2. Phase 0 --- Data Audit

Before coding the production route engine:

-   Extract station names from the current official network source.
-   Build canonical station IDs.
-   Build line sequences.
-   Identify all interchanges.
-   Verify extensions.
-   Verify Airport Express separately.
-   Record data source and verification date.

Output:

``` text
stations.json
lines.json
connections.json
interchanges.json
```

------------------------------------------------------------------------

## 3. Phase 1 --- Graph Engine

Implement:

### Basic graph

``` text
Station
  ↓
Edges
  ↓
Line + distance + travel time
```

### Algorithms

1.  Shortest station path
2.  Shortest distance path
3.  K-shortest path
4.  Interchange counting
5.  Route deduplication
6.  Route validation

------------------------------------------------------------------------

## 4. Phase 2 --- Multi-Route Engine

### Algorithm

``` text
source, destination
        ↓
find minimum station count N
        ↓
candidate window N → N+10
        ↓
generate K candidate paths
        ↓
validate paths
        ↓
remove duplicates
        ↓
calculate:
  stations
  interchanges
  distance
  travel time
        ↓
sort by:
  stations ASC
  interchanges ASC
  time ASC
  distance ASC
        ↓
return meaningful routes
```

### Candidate generation

Do not stop at the first shortest route.

Generate enough K-shortest candidates to cover the +10 station window.

Use an adaptive K value rather than a fixed tiny number.

------------------------------------------------------------------------

## 5. Phase 3 --- Route Quality Engine

Each candidate gets quality checks.

### Hard filters

Reject:

-   Loop
-   Repeated station
-   Backtracking
-   Station count \> N+10
-   Invalid line transition
-   Inactive station
-   Closed segment

### Soft checks

Measure:

-   Detour ratio
-   Travel-time penalty
-   Number of line changes
-   Difference from existing candidate

------------------------------------------------------------------------

## 6. Phase 4 --- Fare Engine

Build:

``` text
FareEngine
 ├── TokenFare
 ├── SmartCardFare
 ├── SundayFare
 ├── HolidayFare
 ├── OffPeakFare
 └── AirportExpressFare
```

Never place fare logic inside React components.

Use versioned fare configuration.

------------------------------------------------------------------------

## 7. Phase 5 --- Timing Engine

Build:

``` text
TimingEngine
 ├── FirstTrain
 ├── LastTrain
 ├── ServiceWindow
 ├── PeakPeriod
 └── OffPeakPeriod
```

Journey ETA:

``` text
segment travel time
+ interchange walking time
+ expected waiting time
```

For an initial static MVP:

``` text
estimated_time =
  sum(segment travel times)
  + interchange_time
  + configured wait buffer
```

------------------------------------------------------------------------

## 8. Phase 6 --- API

Suggested endpoints:

``` text
GET /api/stations
GET /api/stations/search?q=
GET /api/routes?from=&to=&date=&time=
GET /api/fares?from=&to=&date=&ticket=
GET /api/timings?station=&line=
GET /api/map
GET /api/status
```

Route response:

``` json
{
  "from": "welcome",
  "to": "dwarka",
  "minimum_stations": 28,
  "routes": []
}
```

------------------------------------------------------------------------

## 9. Phase 7 --- Frontend

Build screens:

1.  Planner
2.  Route results
3.  Full route
4.  Metro map
5.  Fare calculator
6.  First/last metro
7.  Service status
8.  Saved trips
9.  Settings

------------------------------------------------------------------------

## 10. Phase 8 --- Animation

Implement:

-   Page transitions
-   Route card reveal
-   Expand/collapse
-   Map route drawing
-   Station highlight
-   Interchange pulse
-   Loading skeleton

Use reduced-motion support.

------------------------------------------------------------------------

## 11. Phase 9 --- Gemini Integration

Only after deterministic functionality works.

### Gemini input

``` text
User:
"Welcome se Dwarka jana hai,
change kam karna hai."
```

Gemini output:

``` json
{
  "source": "Welcome",
  "destination": "Dwarka",
  "preference": "minimum_interchange"
}
```

The routing engine then calculates the result.

Gemini should not directly generate station paths.

------------------------------------------------------------------------

## 12. Phase 10 --- Testing

### Unit tests

-   Station lookup
-   Edge creation
-   Interchange detection
-   Fare slabs
-   Date classification
-   Ranking

### Route tests

Examples:

-   Direct route
-   One interchange
-   Multiple alternatives
-   Same-line endpoints
-   Terminal stations
-   Airport Express
-   NCR boundary cases

### Critical test

``` text
Minimum route = N

All returned routes:
station_count <= N + 10
```

And:

``` text
Returned routes are sorted by:
stations
→ interchanges
→ time
→ distance
```

------------------------------------------------------------------------

## 13. Regression Tests

Every data update must rerun:

-   Known station-to-station routes
-   Interchange routes
-   Fare matrix
-   First/last train samples
-   Direct-route cases

------------------------------------------------------------------------

## 14. Performance Plan

### Static data

Cache aggressively.

### Graph

Load once per server instance.

### Route query

Avoid database round trips during graph traversal where possible.

### Map

Lazy-load heavy assets.

### Client

Virtualize long station lists.

------------------------------------------------------------------------

## 15. Security

-   Validate all station IDs
-   Rate-limit public APIs
-   Sanitize search input
-   Never expose private API keys
-   Gemini key must remain server-side
-   Add bot protection if public traffic grows

------------------------------------------------------------------------

## 16. Deployment

### MVP

``` text
GitHub
  ↓
Vercel
  ↓
Next.js
  ↓
Route API
  ↓
Static JSON
```

### Production

``` text
Next.js
   ↓
API
   ↓
Routing Service
   ↓
PostgreSQL
   ↓
Versioned Metro Data
```

------------------------------------------------------------------------

## 17. Development Order

Recommended order:

``` text
1. Data
2. Graph
3. Shortest route
4. Multi-route
5. Ranking
6. Fare
7. Timing
8. API
9. UI
10. Map
11. Animation
12. Gemini
13. Testing
14. Deployment
```

Do not start with the visual UI and postpone data correctness.

------------------------------------------------------------------------

## 18. MVP Definition

MVP is complete when:

-   User can choose two stations.
-   Correct route is returned.
-   Minimum-station route is correct.
-   All meaningful routes within +10 station window are returned.
-   Ranking follows the agreed priority.
-   Interchanges are correct.
-   Current regular fare is calculated.
-   Sunday/holiday fare is supported.
-   Basic first/last metro data works.
-   Map is interactive.
-   UI works on mobile and desktop.
