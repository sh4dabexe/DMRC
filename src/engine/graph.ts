import stationsData from '../data/stations.json';
import linesData from '../data/lines.json';
import connectionsData from '../data/connections.json';
import interchangesData from '../data/interchanges.json';
import { calculateFare } from './fare';
import { calculateTiming } from './timing';
import {
  Station,
  Line,
  Connection,
  Interchange,
  MetroRoute,
  RouteSegment,
  InterchangePoint,
  RouteQueryResult
} from './types';

interface Edge {
  to: string;
  line: string;
  distance_km: number;
  travel_time_min: number;
}

export class MetroGraph {
  private stations: Map<string, Station> = new Map();
  private lines: Map<string, Line> = new Map();
  private interchanges: Map<string, Interchange> = new Map();
  private adjacency: Map<string, Edge[]> = new Map();

  constructor() {
    this.initData();
  }

  private initData() {
    for (const s of stationsData as Station[]) {
      this.stations.set(s.id, s);
      this.adjacency.set(s.id, []);
    }

    for (const l of linesData as Line[]) {
      this.lines.set(l.id, l);
    }

    for (const inter of interchangesData as Interchange[]) {
      this.interchanges.set(inter.station, inter);
    }

    for (const conn of connectionsData as Connection[]) {
      this.addEdge(conn.from, conn.to, conn.line, conn.distance_km, conn.travel_time_min);
      if (conn.bidirectional) {
        this.addEdge(conn.to, conn.from, conn.line, conn.distance_km, conn.travel_time_min);
      }
    }
  }

  private addEdge(from: string, to: string, line: string, distance_km: number, travel_time_min: number) {
    if (!this.adjacency.has(from)) {
      this.adjacency.set(from, []);
    }
    // Avoid exact duplicate edges
    const edges = this.adjacency.get(from)!;
    const exists = edges.some(e => e.to === to && e.line === line);
    if (!exists) {
      edges.push({ to, line, distance_km, travel_time_min });
    }
  }

  public getAllStations(): Station[] {
    return Array.from(this.stations.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  public getStation(id: string): Station | undefined {
    return this.stations.get(id);
  }

  public getLine(id: string): Line | undefined {
    return this.lines.get(id);
  }

  public getLineSafe(id: string): Line {
    const l = this.lines.get(id);
    if (l) return l;
    return {
      id,
      name: id.replace(/-/g, ' ').toUpperCase(),
      color: "#6B7280",
      textColor: "#FFFFFF",
      operator: "DMRC",
      active: true,
      description: "Connector"
    };
  }

  public getAllLines(): Line[] {
    return Array.from(this.lines.values());
  }

  /**
   * Breadth-First Search to find exact minimum station count N (hops + 1).
   */
  public findMinimumStationCount(fromId: string, toId: string): number | null {
    if (fromId === toId) return 1;
    if (!this.stations.has(fromId) || !this.stations.has(toId)) return null;

    const queue: Array<{ id: string; hops: number }> = [{ id: fromId, hops: 1 }];
    const visited = new Set<string>([fromId]);

    while (queue.length > 0) {
      const { id, hops } = queue.shift()!;
      if (id === toId) {
        return hops;
      }

      const edges = this.adjacency.get(id) || [];
      for (const edge of edges) {
        if (!visited.has(edge.to)) {
          visited.add(edge.to);
          queue.push({ id: edge.to, hops: hops + 1 });
        }
      }
    }

    return null;
  }

  /**
   * Generates candidate routes within the [N, N + 10] window.
   */
  public findMultiRoutes(
    fromId: string,
    toId: string,
    options: {
      isSundayOrHoliday?: boolean;
      departureTime?: string;
      maxResults?: number;
    } = {}
  ): RouteQueryResult | null {
    const fromStation = this.stations.get(fromId);
    const toStation = this.stations.get(toId);

    if (!fromStation || !toStation) {
      return null;
    }

    if (fromId === toId) {
      return {
        from: fromStation,
        to: toStation,
        minimumStations: 1,
        windowMaxStations: 11,
        routes: [],
        calculatedAt: new Date().toISOString()
      };
    }

    const N = this.findMinimumStationCount(fromId, toId);
    if (!N) {
      return {
        from: fromStation,
        to: toStation,
        minimumStations: 0,
        windowMaxStations: 0,
        routes: [],
        calculatedAt: new Date().toISOString()
      };
    }

    const windowMaxStations = N + 10;

    // Constrained DFS/Branch-and-Bound to discover distinct candidate paths
    interface PathCandidate {
      path: string[];
      lines: string[];
      edgeDistances: number[];
      edgeTimes: number[];
      interchangeCount: number;
      totalDistance: number;
      pureTrainTime: number;
    }

    const rawCandidates: PathCandidate[] = [];
    const maxSearchCandidates = 200;

    // DFS with branch pruning:
    // state: current station, current line, visited stations array, lines used, edge distances, edge times, interchange count, total dist, train time
    const dfs = (
      current: string,
      currentLine: string | null,
      visited: string[],
      linesUsed: string[],
      edgeDists: number[],
      edgeTimes: number[],
      changes: number,
      totalDist: number,
      totalTime: number
    ) => {
      if (rawCandidates.length >= maxSearchCandidates) return;
      const currentStationCount = visited.length;

      // PRD Hard Rule: station_count <= N + 10
      if (currentStationCount > windowMaxStations) return;

      if (current === toId) {
        rawCandidates.push({
          path: [...visited],
          lines: [...linesUsed],
          edgeDistances: [...edgeDists],
          edgeTimes: [...edgeTimes],
          interchangeCount: changes,
          totalDistance: totalDist,
          pureTrainTime: totalTime
        });
        return;
      }

      const edges = this.adjacency.get(current) || [];
      // Prioritize edges staying on the same line to find lower interchange paths first
      const sortedEdges = [...edges].sort((a, b) => {
        if (currentLine) {
          if (a.line === currentLine && b.line !== currentLine) return -1;
          if (b.line === currentLine && a.line !== currentLine) return 1;
        }
        return a.travel_time_min - b.travel_time_min;
      });

      for (const edge of sortedEdges) {
        // Hard Rule: Reject cycles / repeated stations / loops
        if (visited.includes(edge.to)) continue;

        const nextChanges = currentLine && currentLine !== edge.line ? changes + 1 : changes;

        // Prune excessive interchanges (no commuter takes > 3 interchanges in Delhi)
        if (nextChanges > 3) continue;

        dfs(
          edge.to,
          edge.line,
          [...visited, edge.to],
          [...linesUsed, edge.line],
          [...edgeDists, edge.distance_km],
          [...edgeTimes, edge.travel_time_min],
          nextChanges,
          totalDist + edge.distance_km,
          totalTime + edge.travel_time_min
        );
      }
    };

    dfs(fromId, null, [fromId], [], [], [], 0, 0, 0);

    // Filter and Deduplicate candidates
    // Group candidates by their distinctive interchange key: e.g. "red->pink->blue via rajouri-garden"
    const uniqueCandidates: PathCandidate[] = [];
    const seenSignatures = new Set<string>();

    for (const cand of rawCandidates) {
      // Build a signature of line transitions
      const transitions: string[] = [];
      for (let i = 0; i < cand.lines.length; i++) {
        if (i === 0 || cand.lines[i] !== cand.lines[i - 1]) {
          transitions.push(`${cand.lines[i]}@${cand.path[i]}`);
        }
      }
      const signature = `${transitions.join('->')}::stations:${cand.path.length}`;

      if (!seenSignatures.has(signature)) {
        seenSignatures.add(signature);
        uniqueCandidates.push(cand);
      }
    }

    // Step 5: Official PRD Ranking Priority
    // 1. Least stations (ASC)
    // 2. Fewer interchanges (ASC)
    // 3. Lower travel time (ASC)
    // 4. Lower distance (ASC)
    uniqueCandidates.sort((a, b) => {
      if (a.path.length !== b.path.length) {
        return a.path.length - b.path.length;
      }
      if (a.interchangeCount !== b.interchangeCount) {
        return a.interchangeCount - b.interchangeCount;
      }
      if (a.pureTrainTime !== b.pureTrainTime) {
        return a.pureTrainTime - b.pureTrainTime;
      }
      return a.totalDistance - b.totalDistance;
    });

    // Check if there is a direct route (0 interchanges)
    const directRoute = uniqueCandidates.find(c => c.interchangeCount === 0);
    let selectedCandidates: PathCandidate[] = [];

    if (directRoute && directRoute.path.length === N) {
      // PRD Direct Route Rule: "For a direct journey such as Welcome → Rithala,
      // the UI should show the direct route rather than inventing unnecessary alternatives."
      selectedCandidates = [directRoute];
    } else {
      // Select top diverse candidates up to limit
      const maxResults = options.maxResults || 5;
      selectedCandidates = uniqueCandidates.slice(0, maxResults);
    }

    // Convert candidates to rich MetroRoute objects
    const routes: MetroRoute[] = selectedCandidates.map((cand, idx) => {
      const stationSequence = cand.path.map(id => this.stations.get(id)!);

      // Build Segments & Interchanges
      const segments: RouteSegment[] = [];
      const interchangesList: InterchangePoint[] = [];

      let currentSegmentStations: Station[] = [stationSequence[0]];
      let currentSegLineId = cand.lines[0];
      let currentSegDist = 0;
      let currentSegTime = 0;
      let totalWalkMin = 0;

      for (let i = 0; i < cand.lines.length; i++) {
        const nextLineId = cand.lines[i];
        const nextStation = stationSequence[i + 1];
        const dist = cand.edgeDistances[i];
        const tTime = cand.edgeTimes[i];

        if (nextLineId !== currentSegLineId) {
          // Interchange at stationSequence[i]
          const interStation = stationSequence[i];
          const fromLine = this.getLineSafe(currentSegLineId);
          const toLine = this.getLineSafe(nextLineId);
          const interInfo = this.interchanges.get(interStation.id);
          const walkTime = interInfo ? interInfo.transfer_time_min : 4;
          totalWalkMin += walkTime;

          interchangesList.push({
            stationId: interStation.id,
            stationName: interStation.name,
            fromLineId: fromLine.id,
            fromLineName: fromLine.name,
            toLineId: toLine.id,
            toLineName: toLine.name,
            transferTimeMin: walkTime
          });

          // Finalize current segment
          const lineObj = this.getLineSafe(currentSegLineId);
          segments.push({
            lineId: lineObj.id,
            lineName: lineObj.name,
            lineColor: lineObj.color,
            lineTextColor: lineObj.textColor,
            fromStationId: currentSegmentStations[0].id,
            fromStationName: currentSegmentStations[0].name,
            toStationId: interStation.id,
            toStationName: interStation.name,
            stations: currentSegmentStations,
            stationCount: currentSegmentStations.length,
            distance_km: Number(currentSegDist.toFixed(1)),
            travel_time_min: currentSegTime
          });

          // Start new segment
          currentSegLineId = nextLineId;
          currentSegmentStations = [interStation, nextStation];
          currentSegDist = dist;
          currentSegTime = tTime;
        } else {
          currentSegmentStations.push(nextStation);
          currentSegDist += dist;
          currentSegTime += tTime;
        }
      }

      // Finalize last segment
      if (currentSegmentStations.length > 0) {
        const lineObj = this.getLineSafe(currentSegLineId);
        segments.push({
          lineId: lineObj.id,
          lineName: lineObj.name,
          lineColor: lineObj.color,
          lineTextColor: lineObj.textColor,
          fromStationId: currentSegmentStations[0].id,
          fromStationName: currentSegmentStations[0].name,
          toStationId: currentSegmentStations[currentSegmentStations.length - 1].id,
          toStationName: currentSegmentStations[currentSegmentStations.length - 1].name,
          stations: currentSegmentStations,
          stationCount: currentSegmentStations.length,
          distance_km: Number(currentSegDist.toFixed(1)),
          travel_time_min: currentSegTime
        });
      }

      // Unique lines used
      const linesUsed = Array.from(new Set(cand.lines));

      // Calculate Fare
      const fare = calculateFare(cand.totalDistance, {
        isSundayOrHoliday: options.isSundayOrHoliday,
        departureTime: options.departureTime
      });

      // Calculate Timing
      const timing = calculateTiming(
        cand.pureTrainTime,
        cand.interchangeCount,
        totalWalkMin,
        options.departureTime
      );

      // Determine Label
      let label: MetroRoute["label"] = "Alternative";
      if (cand.interchangeCount === 0) {
        label = "Direct Route";
      } else if (idx === 0) {
        label = "Least Stations";
      } else if (
        cand.interchangeCount < selectedCandidates[0].interchangeCount &&
        cand.path.length <= selectedCandidates[0].path.length + 3
      ) {
        label = "Fewer Interchanges";
      } else if (cand.pureTrainTime < selectedCandidates[0].pureTrainTime) {
        label = "Fastest";
      }

      // Generate "Why This Route?" Explanation
      let whyThisRoute = "";
      if (label === "Direct Route") {
        whyThisRoute = `Direct, continuous journey on the ${segments[0]?.lineName || ''} with zero interchanges and minimum stations.`;
      } else if (idx === 0) {
        whyThisRoute = `This route has the lowest station count (${cand.path.length} stations) across the network. Ranked #1 by least stations.`;
      } else if (label === "Fewer Interchanges") {
        whyThisRoute = `Trade off: Adds only ${cand.path.length - N} station(s) but reduces transfers down to ${cand.interchangeCount} change(s).`;
      } else {
        whyThisRoute = `Alternative corridor through ${interchangesList.map(i => i.stationName).join(', ')} (${cand.path.length} stations, ${cand.interchangeCount} interchange(s)).`;
      }

      return {
        id: `route-${idx + 1}`,
        routeNumber: idx + 1,
        label,
        stationCount: cand.path.length,
        interchangeCount: cand.interchangeCount,
        distance_km: Number(cand.totalDistance.toFixed(1)),
        travel_time_min: timing.totalTravelTimeMin,
        fare,
        linesUsed,
        interchanges: interchangesList,
        segments,
        stationSequence,
        whyThisRoute
      };
    });

    return {
      from: fromStation,
      to: toStation,
      minimumStations: N,
      windowMaxStations,
      routes,
      calculatedAt: new Date().toISOString()
    };
  }
}

// Singleton instance
export const metroGraph = new MetroGraph();
