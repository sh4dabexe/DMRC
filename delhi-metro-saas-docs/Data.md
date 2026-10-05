# Delhi Metro Multi-Route Planner --- Data Specification

## 1. Data Philosophy

The application must use **structured, versioned data**.

The metro graph, fares, timings and service rules must not be embedded
directly inside UI code.

Recommended data layout:

``` text
data/
├── stations.json
├── lines.json
├── connections.json
├── interchanges.json
├── fares.json
├── timings.json
├── holidays.json
├── service_rules.json
└── metadata.json
```

------------------------------------------------------------------------

## 2. Station Schema

``` json
{
  "id": "welcome",
  "name": "Welcome",
  "aliases": [],
  "lines": ["red", "pink"],
  "latitude": null,
  "longitude": null,
  "zone": null,
  "active": true
}
```

Fields:

-   `id`
-   `name`
-   `aliases`
-   `lines`
-   `latitude`
-   `longitude`
-   `zone`
-   `active`

Coordinates should be sourced from a reliable dataset rather than
manually guessed from the old PDF.

------------------------------------------------------------------------

## 3. Line Schema

``` json
{
  "id": "blue",
  "name": "Blue Line",
  "color": "#",
  "operator": "DMRC",
  "active": true
}
```

Support:

-   Regular DMRC lines
-   Airport Express
-   Other connected NCR systems only when their ticketing/interchange
    rules are explicitly modeled

------------------------------------------------------------------------

## 4. Connection Schema

A connection represents one adjacent station hop.

``` json
{
  "from": "welcome",
  "to": "seelampur",
  "line": "red",
  "distance_km": 1.2,
  "travel_time_min": 2,
  "bidirectional": true
}
```

Required fields:

-   from
-   to
-   line
-   distance_km
-   travel_time_min
-   bidirectional

Optional:

-   platform
-   accessibility
-   operational_status
-   segment_id

------------------------------------------------------------------------

## 5. Interchange Schema

``` json
{
  "station": "rajouri-garden",
  "lines": ["blue", "pink"],
  "transfer_time_min": 3,
  "walk_distance_m": null
}
```

The route engine must distinguish:

### Same-line movement

No interchange penalty.

### Line change

One interchange.

### Interchange walking time

Added to estimated journey time where reliable data exists.

------------------------------------------------------------------------

## 6. Route Object

Internal route representation:

``` json
{
  "id": "route-1",
  "stations": [],
  "segments": [],
  "station_count": 28,
  "interchanges": 2,
  "distance_km": 21.4,
  "travel_time_min": 45,
  "fare": {
    "token": 54,
    "smart_card": 49
  }
}
```

------------------------------------------------------------------------

## 7. Route Eligibility

Let:

`minimum_stations = N`

A candidate route is eligible when:

``` text
candidate.station_count <= N + 10
```

Then validate:

``` text
no loop
no backtracking
no duplicate
reasonable travel time
reasonable distance
meaningfully different interchange pattern/path
```

------------------------------------------------------------------------

## 8. Route Ranking

Sort key:

``` text
(
  station_count ASC,
  interchange_count ASC,
  travel_time_min ASC,
  distance_km ASC
)
```

This is the official product ranking order.

### Important

Do not change the ranking to prioritize interchange count first.

The product requirement explicitly prioritizes:

1.  Least stations
2.  Fewer interchanges
3.  Lower travel time
4.  Lower distance

------------------------------------------------------------------------

## 9. Fare Data

### Current DMRC regular fare table

The current official DMRC fare page lists:

  Distance      Mon--Sat Token   Sunday / National Holiday
  ----------- ---------------- ---------------------------
  0--2 km                  ₹11                         ₹11
  2--5 km                  ₹21                         ₹11
  5--12 km                 ₹32                         ₹21
  12--21 km                ₹43                         ₹32
  21--32 km                ₹54                         ₹43
  \>32 km                  ₹64                         ₹54

Effective fare data should be stored as a version:

``` json
{
  "effective_from": "2025-08-25",
  "source": "DMRC",
  "type": "regular"
}
```

### Smart Card

Store discount policy separately:

``` json
{
  "normal_discount_percent": 10,
  "weekday_offpeak_additional_discount_percent": 10
}
```

The exact current smart-card calculation and rounding must be verified
against the live DMRC journey/fare calculator before release.

### Sunday

Sunday/national-holiday special token fares must be stored separately.

Do not calculate Sunday fare by applying an arbitrary percentage to
weekday fare.

------------------------------------------------------------------------

## 10. Fare Calculation

Fare is based on **distance/fare rules**, not simply station count.

``` text
distance
    ↓
fare slab
    ↓
day type
    ↓
ticket type
    ↓
discount policy
    ↓
rounding
    ↓
final fare
```

Airport Express must have its own fare model.

The official DMRC website warns that journeys involving Airport Express
can have different fares depending on interchange and recommends using
the Journey Planner for the exact fare.

------------------------------------------------------------------------

## 11. Fare Types

Supported UI types:

``` text
Token / QR
Smart Card
```

Future:

``` text
NCMC
MJQRT
Tourist Card
Airport Express
Integrated NCR journey
```

Each should be modeled independently.

------------------------------------------------------------------------

## 12. Timing Data

Station-level timing schema:

``` json
{
  "station": "welcome",
  "line": "red",
  "direction": "rithala",
  "first_train": "05:30",
  "last_train": "23:45"
}
```

But exact values must come from verified operational data.

Never generate random timings.

The uploaded prototype currently estimates journey time as roughly:

`stations × 2 minutes + 10 minute buffer`

This is acceptable only as a temporary prototype heuristic. Production
should use segment travel time + interchange time + wait-time modeling.

------------------------------------------------------------------------

## 13. Peak / Off-Peak Data

Recommended configuration:

``` json
{
  "weekday": {
    "peak": [],
    "off_peak": []
  },
  "sunday": {
    "peak": [],
    "off_peak": []
  }
}
```

Known DMRC smart-card off-peak policy has historically used:

-   Start of revenue service to 08:00
-   12:00--17:00
-   21:00 to closing

The final production values must be validated against the latest DMRC
policy.

------------------------------------------------------------------------

## 14. Holiday Data

``` json
{
  "date": "2026-01-26",
  "type": "national_holiday",
  "fare_profile": "sunday_special"
}
```

Do not hard-code "Sunday" logic only. National holidays can use special
fare rules.

------------------------------------------------------------------------

## 15. Data Versioning

Every dataset should have:

``` json
{
  "version": "2026.10.1",
  "verified_at": "2026-10-05",
  "source": "DMRC",
  "notes": ""
}
```

When DMRC changes a line, fare, station or service rule:

1.  Add a new dataset version.
2.  Preserve previous version.
3.  Run route regression tests.
4.  Run fare regression tests.
5.  Publish the new version.

------------------------------------------------------------------------

## 16. Source Notes

### Uploaded project

The supplied project uses:

-   JavaScript graph logic
-   C++ Dijkstra
-   Station edges with line/distance data
-   Basic fare formula
-   Basic route visualization

Its current fare implementation is obsolete for the new SaaS.

### Uploaded map

The supplied Metro PDF is a visual Delhi-NCR network map and visibly
identifies itself as an older "As on Dec 2021" map. It should not be
used as the sole current network source.

### Current official DMRC fare source

Use the official DMRC fare page as the primary fare reference during
data refresh.

### Current official network source

Use the official DMRC present-network information and interactive map
for current line/extension verification.

------------------------------------------------------------------------

## 17. Data Integrity Rule

Never invent:

-   Stations
-   Connections
-   Fare values
-   First/last train times
-   Platform numbers
-   Live service status

If data is unknown, expose:

`Not available`

rather than generating a plausible value.
