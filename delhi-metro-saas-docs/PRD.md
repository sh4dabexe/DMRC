# Delhi Metro Multi-Route Planner SaaS --- PRD

## 1. Product Overview

A responsive Delhi-NCR Metro journey-planning SaaS that does more than
return a single shortest route.

The product finds the **least-station route first**, then discovers
**all meaningful alternative routes within a +10 station window**. These
routes are ranked by:

1.  Least stations
2.  Fewer interchanges
3.  Lower travel time
4.  Lower distance

The product must avoid meaningless routes with excessive detours, loops,
backtracking, or unnecessary line changes.

### Core example

For a journey such as:

**Welcome → Dwarka**

the product may return:

-   Route A --- shortest/least stations
-   Route B --- fewer interchanges
-   Route C --- another meaningful interchange combination

A route that is much longer than the shortest route is excluded even if
it has fewer interchanges.

For a direct journey such as **Welcome → Rithala**, the UI should show
the direct route rather than inventing unnecessary alternatives.

------------------------------------------------------------------------

## 2. Problem Statement

Most metro journey planners optimize primarily for a single shortest
route. In a network with many interchange possibilities, the shortest
route may require several line changes.

Users often prefer:

-   Slightly more stations
-   Similar travel time
-   Fewer interchanges
-   A simpler journey

The SaaS solves this by exposing meaningful alternatives instead of
forcing users to accept one mathematically shortest path.

------------------------------------------------------------------------

## 3. Goals

### Primary goals

-   Find accurate Delhi-NCR Metro routes.
-   Return the least-station route.
-   Discover all meaningful routes within the shortest-route +10 station
    window.
-   Prioritize routes with fewer interchanges after station count.
-   Explain every interchange clearly.
-   Calculate current fares by journey date, fare type, and applicable
    discount.
-   Show first/last metro information.
-   Show peak and non-peak periods.
-   Provide an interactive, zoomable metro map.
-   Work smoothly on mobile, tablet, and desktop.
-   Keep route calculation deterministic and independent of an LLM.

### Secondary goals

-   Natural-language journey input.
-   Saved trips.
-   Route sharing.
-   Route explanation.
-   Service status.
-   Future PWA/offline support.

------------------------------------------------------------------------

## 4. Non-Goals

-   Replacing official DMRC ticketing.
-   Guaranteeing live train arrival times unless a verified live data
    source is integrated.
-   Using Gemini as the source of truth for route calculations.
-   Generating arbitrary routes merely to increase the number of
    results.
-   Treating an old static metro-map PDF as the authoritative current
    network dataset.

------------------------------------------------------------------------

## 5. Target Users

-   Daily Delhi Metro commuters
-   Students
-   Office commuters
-   Tourists
-   Occasional metro users
-   Users who dislike multiple interchanges
-   Users comparing fastest vs simplest journeys

------------------------------------------------------------------------

## 6. Core Route Logic

### 6.1 Step 1 --- Find minimum-station route

Calculate:

`N = minimum number of station-to-station hops between source and destination`

This is the baseline.

### 6.2 Step 2 --- Create route eligibility window

Only candidate routes with:

`station_count <= N + 10`

are eligible.

Routes below N are impossible because N is the minimum.

### 6.3 Step 3 --- Generate candidate routes

Use a k-shortest / constrained-path strategy to discover multiple
distinct paths.

Recommended implementation:

-   Dijkstra for shortest baseline
-   Yen's K-shortest paths or a custom constrained path enumerator for
    alternatives
-   State-aware graph representation for line/interchange handling

### 6.4 Step 4 --- Validate candidates

Reject:

-   Cycles
-   Station loops
-   Backtracking
-   Excessive detours
-   Duplicate paths
-   Near-identical paths with no meaningful difference
-   Routes outside the +10 station window

### 6.5 Step 5 --- Rank

Final priority:

1.  **Least stations**
2.  **Fewer interchanges**
3.  **Lower travel time**
4.  **Lower distance**

This ordering is intentional.

A 28-station / 2-interchange route ranks above a 31-station /
1-interchange route because station count is the first priority.

### 6.6 Step 6 --- Present all meaningful routes

The UI should not artificially limit the user to only one route.

Display all meaningful candidates surviving the eligibility and quality
rules, subject to a configurable UI safety cap.

Recommended default:

-   Show up to 5 routes initially
-   Allow "Show more" if more high-quality candidates exist

------------------------------------------------------------------------

## 7. Route Labels

The system may automatically assign labels such as:

-   Least Stations
-   Fewer Interchanges
-   Balanced
-   Alternative
-   Direct
-   Fastest

Labels must describe actual route characteristics and must not override
the ranking order.

------------------------------------------------------------------------

## 8. Route Card

Each route card should show:

-   Route number
-   Label
-   Station count
-   Estimated travel time
-   Interchange count
-   Distance
-   Token/QR fare
-   Smart Card fare
-   Relevant fare condition
-   Lines used
-   Interchange stations
-   Expandable station sequence
-   "View full route"

Example:

``` text
Route 1
Least stations

28 stations
~45 min
2 interchanges
₹54 token

Pink Line → Blue Line

Welcome
↓
...
Rajouri Garden  [Interchange]
↓
...
Dwarka
```

------------------------------------------------------------------------

## 9. Fare Requirements

The fare engine must be data-driven.

### Current regular DMRC fare baseline

The current DMRC fare page lists:

  Distance      Mon--Sat   Sunday/National Holiday
  ----------- ---------- -------------------------
  0--2 km            ₹11                       ₹11
  2--5 km            ₹21                       ₹11
  5--12 km           ₹32                       ₹21
  12--21 km          ₹43                       ₹32
  21--32 km          ₹54                       ₹43
  \>32 km            ₹64                       ₹54

The official DMRC website states that special fares apply on Sundays and
national holidays and that the Sunday special fare is a single-journey
token fare based on the shortest route.

The fare table must be versioned because DMRC can revise fares.

### Smart Card

The product should support:

-   Normal smart-card fare
-   Weekday off-peak smart-card fare
-   Sunday/holiday smart-card fare

The discount rules must be stored as configurable policy data and
verified against the current DMRC journey/fare calculator before
production release.

### Important

Do not hard-code the old prototype formula:

`₹10 + ₹2/km`

The uploaded prototype currently uses that demo formula and caps it at
₹60; this must be replaced with the current fare slab engine.

------------------------------------------------------------------------

## 10. First & Last Metro

Users can search:

-   First metro from station
-   Last metro from station
-   Direction
-   Line
-   Day type

The UI must warn that exact first/last train times can vary by station,
direction, line, special service, maintenance, and holidays.

------------------------------------------------------------------------

## 11. Peak / Non-Peak

The system should classify the journey by departure/entry time.

The data layer should support configurable:

-   Peak windows
-   Off-peak windows
-   Weekday rules
-   Sunday/holiday rules
-   Special-event overrides

Do not infer exact station-level service times from a generic "6 AM--11
PM" statement.

------------------------------------------------------------------------

## 12. Interactive Map

Required:

-   Full metro network
-   Zoom in
-   Zoom out
-   Reset
-   Pan/drag
-   Station search
-   Line filters
-   Interchange markers
-   Terminal markers
-   Route highlighting
-   Source/destination highlighting
-   Fit route to screen

The uploaded reference project already has basic zoom, pan, station
search, and line-filter UI patterns that can be evolved into a proper
map component.

------------------------------------------------------------------------

## 13. AI / Gemini

Gemini is optional.

### Without Gemini

The complete core product works using:

-   Graph algorithms
-   Structured metro data
-   Deterministic fare engine
-   Timing data
-   UI logic

### Gemini may be used for

-   Natural-language station intent
-   "I want fewer changes" interpretation
-   Route explanation
-   FAQ generation
-   Conversational journey planning
-   Semantic station-name correction

Gemini must never be the authoritative source for:

-   Station connectivity
-   Fare
-   Timings
-   Interchange count
-   Route correctness

------------------------------------------------------------------------

## 14. Performance Requirements

-   Route result target: \<200 ms for normal queries after graph/data
    loading
-   Initial app shell should feel instant
-   Lazy-load heavy map assets
-   Cache static metro data
-   Avoid network requests for deterministic route calculation where
    possible
-   Smooth 60fps animations where device capability allows
-   No layout shifts during route rendering

------------------------------------------------------------------------

## 15. Responsive Requirements

### Mobile

-   Bottom-sheet route cards
-   Sticky source/destination planner
-   Collapsible map
-   Horizontal route-card carousel
-   Full-screen route details

### Tablet

-   Two-column layout

### Desktop

-   Left navigation
-   Central route planner/results
-   Right map/status column

------------------------------------------------------------------------

## 16. Success Metrics

-   Route calculation success rate
-   Route correctness
-   Number of meaningful alternatives found
-   Average route-result latency
-   Search-to-route completion rate
-   Mobile usability
-   Fare accuracy against DMRC
-   Timing accuracy against verified sources

------------------------------------------------------------------------

## 17. Source / Prototype Basis

The uploaded prototype is a client-side HTML/CSS/JavaScript project with
a C++ Dijkstra implementation. It currently provides shortest-route
calculation, distance, fare, line guidance, responsive UI, and a basic
metro map. The prototype's fare formula is intentionally treated as
obsolete for this SaaS.

The uploaded Metro PDF is a visual network map and is an older map ("As
on Dec 2021"); it should be treated as a reference artifact, not as the
final current network database.
