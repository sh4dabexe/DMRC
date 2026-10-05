# Delhi Metro Multi-Route Planner --- System Flow

## 1. High-Level Flow

``` text
User opens SaaS
       ↓
Enter source + destination
       ↓
Select date/time
       ↓
Select ticket type
       ↓
Find Routes
       ↓
Validate stations
       ↓
Load current metro graph
       ↓
Find minimum-station route
       ↓
N = minimum station count
       ↓
Create N → N+10 candidate window
       ↓
Generate multiple candidate paths
       ↓
Validate paths
       ↓
Remove loops / duplicates / bad detours
       ↓
Calculate route metrics
       ↓
Rank routes
       ↓
Calculate fare
       ↓
Calculate timing
       ↓
Render Route A / B / C...
       ↓
User expands a route
       ↓
Show full journey + map
```

------------------------------------------------------------------------

## 2. Search Flow

``` text
Type "Welcome"
      ↓
Station autocomplete
      ↓
Select Welcome

Type "Dwarka"
      ↓
Station autocomplete
      ↓
Select Dwarka
```

The user should never need to know internal station IDs.

------------------------------------------------------------------------

## 3. Route Engine Flow

``` text
SOURCE
  ↓
DESTINATION
  ↓
Shortest station-path algorithm
  ↓
minimum_stations = N
  ↓
Generate candidates
  ↓
candidate.station_count <= N + 10
  ↓
Path validation
  ├── no repeated station
  ├── no loop
  ├── no illegal line change
  ├── no excessive backtracking
  └── no duplicate route
  ↓
Metrics
  ├── stations
  ├── interchanges
  ├── distance
  └── travel time
  ↓
SORT
  1. stations ASC
  2. interchanges ASC
  3. travel time ASC
  4. distance ASC
  ↓
DISPLAY
```

------------------------------------------------------------------------

## 4. Route Ranking Example

``` text
Minimum route = 25 stations

Eligible range:
25 → 35 stations

Candidates:

Route A
25 stations
3 changes

Route B
27 stations
2 changes

Route C
28 stations
2 changes

Route D
31 stations
1 change

Route E
35 stations
3 changes

Route F
41 stations
1 change
```

Result:

``` text
Route A → #1
Route B → #2
Route C → #3
Route D → #4
Route E → #5
Route F → excluded
```

Reason:

The product's priority is station count first, then interchange count.

------------------------------------------------------------------------

## 5. Direct Route Flow

``` text
Welcome
   ↓
Rithala

Minimum route:
N stations

Candidate generation
   ↓
No meaningful alternatives
   ↓
Show:

DIRECT ROUTE
0 interchanges
Least stations
```

The system must not invent alternatives just because the route engine
can mathematically find longer paths.

------------------------------------------------------------------------

## 6. Interchange Detection

``` text
Station sequence
      ↓
Read line for each segment
      ↓
Compare current line vs previous line
      ↓
Different?
  ├── No → continue
  └── Yes
       ↓
     interchange++
       ↓
     mark station
       ↓
     calculate transfer time
```

Example:

``` text
Pink Line
   ↓
Rajouri Garden
   ↓
Blue Line
```

Rajouri Garden is marked:

**Interchange: Pink → Blue**

------------------------------------------------------------------------

## 7. Fare Flow

``` text
Route selected
    ↓
Determine fare distance
    ↓
Determine travel date
    ↓
Monday–Saturday?
   ├── Yes
   │    ↓
   │  Peak / Off-peak
   │
   └── Sunday/Holiday
        ↓
      Special fare
    ↓
Ticket type
    ├── Token / QR
    └── Smart Card
    ↓
Apply versioned fare policy
    ↓
Round according to policy
    ↓
Display final fare
```

------------------------------------------------------------------------

## 8. Timing Flow

``` text
Selected station
      ↓
Selected line
      ↓
Direction
      ↓
Date type
      ↓
First train / last train
      ↓
Service availability
```

Journey ETA:

``` text
Segment times
      +
Interchange time
      +
Expected wait
      ↓
Estimated journey duration
```

------------------------------------------------------------------------

## 9. Map Flow

``` text
Route selected
      ↓
Get station coordinates
      ↓
Get route segments
      ↓
Render complete metro map
      ↓
Mute unrelated lines
      ↓
Highlight selected route
      ↓
Highlight source
      ↓
Highlight destination
      ↓
Highlight interchanges
```

Controls:

``` text
+
-
Reset
Fit Route
Fullscreen
```

------------------------------------------------------------------------

## 10. "Why This Route?" Flow

After ranking:

``` text
Route metrics
      ↓
Generate deterministic explanation
```

Example:

> "This route uses 28 stations and 2 interchanges. It ranks first
> because it has the fewest stations among the meaningful routes."

Gemini can optionally rewrite this explanation naturally, but the facts
must come from the route engine.

------------------------------------------------------------------------

## 11. Gemini Flow

``` text
User natural-language request
        ↓
Gemini
        ↓
Structured intent
        ↓
{
  source,
  destination,
  preference
}
        ↓
Deterministic route engine
        ↓
Routes
        ↓
Optional Gemini explanation
        ↓
UI
```

If Gemini fails:

``` text
Normal station search
        ↓
Deterministic route engine
        ↓
App continues normally
```

------------------------------------------------------------------------

## 12. Service Status Flow

``` text
Open app
   ↓
Fetch service status
   ↓
Live source available?
   ├── Yes → show live status
   └── No → show last verified status/data timestamp
```

Never fabricate live status.

------------------------------------------------------------------------

## 13. Error Flow

### Invalid station

``` text
Search
 ↓
No station
 ↓
Show suggestions / error
```

### Same station

``` text
Source == Destination
 ↓
Show:
"You are already at your destination."
```

### No route

``` text
No valid path
 ↓
"No connected route found."
```

### Stale data

``` text
Data version old
 ↓
Show freshness warning
```

------------------------------------------------------------------------

## 14. Mobile Flow

``` text
Open
 ↓
Planner
 ↓
Find routes
 ↓
Route cards
 ↓
Tap Route
 ↓
Bottom-sheet details
 ↓
Open map
 ↓
Fit route
```

------------------------------------------------------------------------

## 15. Complete Product Flow

``` text
                 ┌───────────────┐
                 │     USER      │
                 └───────┬───────┘
                         ↓
                Source / Destination
                         ↓
                    Date / Time
                         ↓
                   Ticket Type
                         ↓
                ┌─────────────────┐
                │ ROUTE ENGINE    │
                ├─────────────────┤
                │ Shortest Path   │
                │ K-Shortest      │
                │ +10 Window      │
                │ Validation      │
                │ Ranking         │
                └────────┬────────┘
                         ↓
                ┌─────────────────┐
                │ FARE ENGINE     │
                └────────┬────────┘
                         ↓
                ┌─────────────────┐
                │ TIMING ENGINE   │
                └────────┬────────┘
                         ↓
                ┌─────────────────┐
                │   UI RESULTS    │
                ├─────────────────┤
                │ Route A         │
                │ Route B         │
                │ Route C         │
                │ Map             │
                │ Fare            │
                │ Timing          │
                └─────────────────┘
```

------------------------------------------------------------------------

## 16. Core Product Rule

The central rule of the SaaS is:

> **Find the least-station route first. Then show all meaningful routes
> within +10 stations, ranked by least stations → fewer interchanges →
> lower travel time → lower distance.**

This rule must remain consistent across the route engine, API, UI, tests
and documentation.
