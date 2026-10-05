# Delhi Metro Multi-Route Planner --- Design System

## 1. Design Direction

### Visual language

Minimalist, premium, calm and functional.

Reference direction:

-   Soft white / very light gray canvas
-   Rounded cards
-   Thin borders
-   Subtle shadows
-   Strong black typography
-   Metro-line colors used only as semantic accents
-   Large whitespace
-   Compact information hierarchy
-   Smooth micro-interactions

The provided reference dashboard inspired the overall composition:
persistent sidebar, large content workspace, modular cards, compact
analytics/status widgets and soft rounded surfaces.

------------------------------------------------------------------------

## 2. Brand Concept

Working product name:

# MetroFlow

Tagline:

**Plan smarter. Change less.**

Alternative:

**Delhi Metro, simplified.**

The brand should feel independent and modern rather than visually
copying DMRC branding.

------------------------------------------------------------------------

## 3. Color System

### Base

``` text
Background:       #F5F6F7
Surface:          #FFFFFF
Surface muted:    #F0F1F2
Border:           #E4E5E7
Text primary:     #171717
Text secondary:   #6B6B6B
Text muted:       #9A9A9A
Success:          #16803C
Warning:          #A86400
Danger:           #C93434
```

### Metro line colors

Use official/recognizable line colors where possible.

``` text
Red
Yellow
Blue
Green
Violet
Pink
Magenta
Grey
Orange / Airport Express
Aqua
Rapid Metro
```

Line colors must be used consistently in:

-   Route pills
-   Map paths
-   Interchange markers
-   Timeline indicators

Do not use line colors for large page backgrounds.

------------------------------------------------------------------------

## 4. Typography

Recommended:

-   Inter
-   Manrope
-   Geist

Typography hierarchy:

``` text
Page title:      32–40 px
Section title:   20–24 px
Card title:      16–18 px
Body:            14–16 px
Metadata:        12–14 px
```

Use medium/bold weights for route metrics.

------------------------------------------------------------------------

## 5. Desktop Layout

``` text
┌───────────────────────────────────────────────────────────────┐
│ Sidebar │ Header / Search                                    │
│         ├───────────────────────────────┬─────────────────────┤
│         │ Journey Planner               │ Metro Map           │
│         ├───────────────────────────────┤                     │
│         │ Route A │ Route B │ Route C    │                     │
│         ├───────────────────────────────┤ Metro Status        │
│         │ Journey Summary │ Why Route?   │ Quick Tools         │
└───────────────────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

## 6. Sidebar

Items:

-   Planner
-   Saved Trips
-   Metro Map
-   Fares
-   Timings
-   Settings

Bottom:

-   Help
-   Data freshness
-   Version

Active navigation item uses a dark pill.

------------------------------------------------------------------------

## 7. Header

Left:

**Plan your journey**

Subtitle:

"Find the best and alternative metro routes across Delhi-NCR"

Right:

-   Global station search
-   Notifications/service alerts
-   Profile/settings

------------------------------------------------------------------------

## 8. Journey Planner

Inputs:

``` text
From
Welcome

Swap

To
Dwarka
```

Secondary controls:

-   Date
-   Departure time
-   Journey preference

Primary button:

**Find routes →**

Do not expose technical algorithm settings to normal users.

------------------------------------------------------------------------

## 9. Route Results

Heading:

**3 meaningful routes**

Subheading:

"Alternative interchange options within the shortest-route range"

Filters:

-   Token
-   Card
-   Weekday
-   Sunday

### Route card structure

``` text
┌───────────────────────────────┐
│ [Least stations]      Route 1 │
│                               │
│ 28       ~45 min       2      │
│ stations             changes  │
│                               │
│ Pink Line → Blue Line         │
│                               │
│ Welcome                       │
│   │                           │
│ Rajouri Garden  Interchange   │
│   │                           │
│ Dwarka                        │
│                               │
│ View full route →             │
└───────────────────────────────┘
```

Route 1 should be visually emphasized because it is first by the agreed
ranking.

------------------------------------------------------------------------

## 10. Route Comparison

A comparison strip should make the differences immediately obvious:

``` text
Route     Stations   Changes   Time      Fare
A         28         2         45 min    ₹XX
B         31         1         46 min    ₹XX
C         25         3         48 min    ₹XX
```

The user should not need to open every card to understand the trade-off.

------------------------------------------------------------------------

## 11. Route Timeline

Each line segment is represented by a colored vertical rail.

Interchange:

``` text
● Pink Line
│
│ 12 stations
│
● Rajouri Garden
  CHANGE
  Pink → Blue
│
│ 16 stations
│
● Dwarka
```

Interchange cards should have clear "Change here" language.

------------------------------------------------------------------------

## 12. Metro Map Card

Right column:

-   Zoom +
-   Zoom -
-   Reset
-   Fullscreen
-   Fit route

The active route should be highlighted.

Other lines should become visually muted when a route is selected.

------------------------------------------------------------------------

## 13. Status Card

Show:

-   All lines operational / service alert
-   First metro
-   Last metro
-   Peak hours
-   Non-peak hours

Do not display generic operating hours as if they are station-specific.

------------------------------------------------------------------------

## 14. Quick Tools

Cards:

-   Open Metro Map
-   Fare Calculator
-   First & Last Metro
-   Saved Trips

------------------------------------------------------------------------

## 15. Mobile UI

Mobile order:

1.  Header
2.  Source/destination planner
3.  Route summary
4.  Horizontal route cards
5.  Map
6.  Journey details
7.  Status
8.  Quick tools

Use a bottom sheet for detailed route information.

------------------------------------------------------------------------

## 16. Motion Design

### Page

Fade + 8px upward motion.

### Route cards

Staggered reveal:

``` text
Route 1 → 0ms
Route 2 → 60ms
Route 3 → 120ms
```

### Route selection

-   Border transition
-   Slight elevation
-   Map route highlight
-   Timeline animation

### Map

Smooth zoom/pan.

### Rules

-   Prefer transform/opacity animations
-   Avoid animating layout-heavy properties
-   Respect `prefers-reduced-motion`
-   Never block route interaction for decorative animation

------------------------------------------------------------------------

## 17. Empty / Loading / Error States

### Loading

Skeleton route cards.

### No route

"Couldn't find a connected route between these stations."

### No alternatives

"Direct route found. No meaningful alternative route is available."

### Data stale

"Metro data was last verified on \[date\]."

### Service unavailable

"Live service information is temporarily unavailable. Route planning
still works using static network data."

------------------------------------------------------------------------

## 18. Accessibility

-   WCAG-oriented contrast
-   Keyboard navigation
-   Visible focus states
-   Screen-reader labels
-   Do not rely on line color alone
-   Interchange must have text/icon labels
-   Touch targets ≥44px
-   Reduced motion support

------------------------------------------------------------------------

## 19. Design Principle

The UI should answer three questions immediately:

1.  **How do I go?**
2.  **Where do I change?**
3.  **Why should I choose this route?**
