# MetroFlow — Delhi Metro Multi-Route Planner SaaS

> **Plan smarter. Change less.**  
> An intelligent journey planner and alternative-route discovery engine for the Delhi-NCR Metro network.

---

## 🚇 Product Highlights

- **Multi-Route Discovery**: Calculates the baseline minimum-station route ($N$), then finds all meaningful alternative paths within a **$+10$ station window** ($N \to N+10$).
- **Strict Deterministic Priority**:
  1. **Least Stations**
  2. **Fewer Interchanges**
  3. **Lower Travel Time**
  4. **Lower Distance**
- **Direct Route Optimization**: For direct lines (e.g. *Welcome → Rithala*), returns the direct route without inventing synthetic detours.
- **Official DMRC Fare Slab Engine**:
  - Distance Slabs: $0\text{--}2\,\text{km}$ (₹11), $2\text{--}5\,\text{km}$ (₹21 / ₹11 Sun), $5\text{--}12\,\text{km}$ (₹32 / ₹21 Sun), $12\text{--}21\,\text{km}$ (₹43 / ₹32 Sun), $21\text{--}32\,\text{km}$ (₹54 / ₹43 Sun), $>32\,\text{km}$ (₹64 / ₹54 Sun).
  - Smart Card: 10% standard discount, additional 10% weekday off-peak discount (20% total savings).
- **Interactive SVG Metro Map**:
  - Full vector network visualization across 12 lines and 261 stations.
  - Smooth pan, drag, zoom in/out, reset, route path illumination, and line filter pills.
- **Station Service Timings**:
  - First and last train timing guides and rush hour peak/off-peak windows.
- **Saved Trips**:
  - Bookmarking routes in local storage for instant 1-click recalculation.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Engine**: Zero-dependency deterministic graph and slab algorithms

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Verified Engine Tests
```bash
npm run test:engine
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 📁 Project Architecture

```
├── delhi-metro-saas-docs/  # Official PRD, Plan, Design, Flow, and Data specs
├── scripts/
│   ├── generate-metro-data.mjs # Network builder (261 stations, 12 lines, 27 interchanges)
│   └── test-engine.ts          # Algorithmic test suite for multi-route & fare logic
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── fares/route.ts      # Fare slab policy endpoint
│   │   │   ├── routes/route.ts     # Multi-route pathfinding endpoint
│   │   │   └── stations/route.ts   # Station directory & autocomplete
│   │   ├── globals.css             # MetroFlow color tokens and styles
│   │   ├── layout.tsx              # SEO metadata and layout
│   │   └── page.tsx                # Main responsive SaaS dashboard
│   ├── components/
│   │   ├── FareCalculatorModal.tsx # Interactive fare slab visualizer
│   │   ├── Header.tsx              # Live time and peak-window badge
│   │   ├── InteractiveMetroMap.tsx # Zoomable/draggable SVG metro map
│   │   ├── JourneyPlanner.tsx      # Origin/Destination search & swap
│   │   ├── RouteCard.tsx           # Route metric card & station sequence
│   │   ├── RouteComparisonStrip.tsx# Instant trade-off comparison table
│   │   ├── SavedTripsModal.tsx     # Commute bookmark manager
│   │   ├── Sidebar.tsx             # Navigation drawer
│   │   └── TimingsModal.tsx        # Service schedule & rush hour modal
│   ├── data/                       # Canonical JSON datasets
│   └── engine/
│       ├── fare.ts                 # DMRC fare calculation engine
│       ├── graph.ts                # Graph traversal & K-candidate pathfinder
│       ├── timing.ts               # Travel duration & transfer walking time
│       └── types.ts                # TypeScript domain models
```

---

## 📄 License

MIT
