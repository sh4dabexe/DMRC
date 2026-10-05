'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Layers, 
  Search, 
  Eye, 
  EyeOff,
  Crosshair,
  MapPin
} from 'lucide-react';
import { Station, Line, MetroRoute } from '@/engine/types';
import linesData from '@/data/lines.json';

interface InteractiveMetroMapProps {
  stations: Station[];
  selectedRoute?: MetroRoute | null;
  onSelectStation?: (station: Station, type: 'from' | 'to') => void;
}

export const InteractiveMetroMap: React.FC<InteractiveMetroMapProps> = ({
  stations,
  selectedRoute,
  onSelectStation
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Pan and Zoom State
  const [scale, setScale] = useState(0.85);
  const [pan, setPan] = useState({ x: -100, y: -150 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Filter lines
  const [activeLineFilter, setActiveLineFilter] = useState<string | null>(null);

  // Hovered station tooltip
  const [hoveredStation, setHoveredStation] = useState<Station | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Map station lookup
  const stationMap = React.useMemo(() => {
    const map = new Map<string, Station>();
    for (const s of stations) {
      map.set(s.id, s);
    }
    return map;
  }, [stations]);

  // Group stations into line polylines
  const linePolylines = React.useMemo(() => {
    const polylines: Array<{ line: Line; points: Station[] }> = [];

    for (const line of linesData as Line[]) {
      if (line.id === 'interchange-walk') continue;
      // Get all stations on this line in coordinate order
      const lineStations = stations.filter(s => s.lines.includes(line.id));
      if (lineStations.length > 1) {
        polylines.push({ line, points: lineStations });
      }
    }
    return polylines;
  }, [stations]);

  // Handle Zoom In / Out / Reset
  const handleZoom = (delta: number) => {
    setScale(prev => Math.max(0.3, Math.min(2.5, prev + delta)));
  };

  const handleReset = () => {
    setScale(0.85);
    setPan({ x: -100, y: -150 });
  };

  // Fit route into viewport when selectedRoute changes
  useEffect(() => {
    if (selectedRoute && selectedRoute.stationSequence.length > 0) {
      const xs = selectedRoute.stationSequence.map(s => s.x);
      const ys = selectedRoute.stationSequence.map(s => s.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;

      // Center around midX, midY
      setPan({
        x: 350 - midX * 0.9,
        y: 250 - midY * 0.9
      });
      setScale(0.9);
    }
  }, [selectedRoute]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    handleZoom(zoomDelta);
  };

  // Active route station IDs set for quick styling
  const routeStationIds = React.useMemo(() => {
    if (!selectedRoute) return new Set<string>();
    return new Set(selectedRoute.stationSequence.map(s => s.id));
  }, [selectedRoute]);

  const routeLinesUsed = React.useMemo(() => {
    if (!selectedRoute) return new Set<string>();
    return new Set(selectedRoute.linesUsed);
  }, [selectedRoute]);

  return (
    <div className="relative w-full h-[520px] md:h-full min-h-[500px] bg-[#FAFBFB] rounded-2xl border border-[#E4E5E7] overflow-hidden flex flex-col select-none">
      {/* Map Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-neutral-200 shadow-sm">
          <span className="text-[11px] font-bold text-neutral-700 px-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Interactive Metro Map</span>
          </span>
        </div>

        {/* Zoom & Reset Controls */}
        <div className="pointer-events-auto flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-neutral-200 shadow-sm">
          <button
            type="button"
            onClick={() => handleZoom(0.15)}
            title="Zoom In"
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-700 hover:text-black transition-all"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(-0.15)}
            title="Zoom Out"
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-700 hover:text-black transition-all"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-neutral-200 mx-0.5" />
          <button
            type="button"
            onClick={handleReset}
            title="Reset View"
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-700 hover:text-black transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Line Filter Quick Pill Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-20 overflow-x-auto flex items-center gap-1.5 pointer-events-auto py-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveLineFilter(null)}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 border ${
            activeLineFilter === null
              ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
              : 'bg-white/90 backdrop-blur-md text-neutral-600 border-neutral-200 hover:bg-white'
          }`}
        >
          All Lines
        </button>

        {linesData.filter(l => l.id !== 'interchange-walk').map((line) => {
          const isFilterActive = activeLineFilter === line.id;
          return (
            <button
              key={line.id}
              type="button"
              onClick={() => setActiveLineFilter(isFilterActive ? null : line.id)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 border flex items-center gap-1.5 ${
                isFilterActive
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                  : 'bg-white/90 backdrop-blur-md text-neutral-700 border-neutral-200 hover:bg-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: line.color }} />
              <span>{line.name.replace('Line', '').trim()}</span>
            </button>
          );
        })}
      </div>

      {/* SVG Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className={`w-full h-full flex-1 cursor-${isDragging ? 'grabbing' : 'grab'} overflow-hidden relative`}
      >
        <svg
          ref={svgRef}
          viewBox="-200 -100 1600 1400"
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
          }}
        >
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background grid dots for modern engineering aesthetic */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1" fill="#E5E7EB" />
          </pattern>
          <rect x="-300" y="-200" width="2000" height="1800" fill="url(#grid)" />

          {/* Line Tracks */}
          {linePolylines.map(({ line, points }) => {
            const isLineMuted = selectedRoute
              ? !routeLinesUsed.has(line.id)
              : activeLineFilter !== null && activeLineFilter !== line.id;

            const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

            return (
              <g key={line.id} opacity={isLineMuted ? 0.18 : 1} className="transition-opacity duration-300">
                {/* Thick background line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={isLineMuted ? 3 : 5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* Active Highlighted Route Path with Pulsing Glow */}
          {selectedRoute && (
            <g>
              {selectedRoute.segments.map((seg, idx) => {
                const segD = seg.stations.map((s, i) => `${i === 0 ? 'M' : 'L'} ${s.x} ${s.y}`).join(' ');
                return (
                  <g key={idx}>
                    {/* Glow outline */}
                    <path
                      d={segD}
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth={10}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d={segD}
                      fill="none"
                      stroke={seg.lineColor}
                      strokeWidth={7}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#glow)"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* Station Markers */}
          {stations.map((station) => {
            const isRouteStation = routeStationIds.has(station.id);
            const isOrigin = selectedRoute && selectedRoute.stationSequence[0]?.id === station.id;
            const isDestination = selectedRoute && selectedRoute.stationSequence[selectedRoute.stationSequence.length - 1]?.id === station.id;
            const isInterchange = station.lines.length > 1;

            const isMuted = selectedRoute
              ? !isRouteStation
              : activeLineFilter !== null && !station.lines.includes(activeLineFilter);

            return (
              <g
                key={station.id}
                transform={`translate(${station.x}, ${station.y})`}
                opacity={isMuted ? 0.2 : 1}
                className="cursor-pointer transition-all duration-200 group"
                onClick={() => setHoveredStation(station)}
                onMouseEnter={(e) => {
                  setHoveredStation(station);
                  setTooltipPos({ x: station.x, y: station.y });
                }}
              >
                {/* Interchange Outer Ring */}
                {isInterchange && (
                  <circle
                    r={isOrigin || isDestination ? 9 : 6}
                    fill="#FFFFFF"
                    stroke="#171717"
                    strokeWidth={2}
                  />
                )}

                {/* Normal station circle */}
                <circle
                  r={isOrigin || isDestination ? 7 : isInterchange ? 4 : 3}
                  fill={isOrigin ? '#10B981' : isDestination ? '#EF4444' : isRouteStation ? '#171717' : '#FFFFFF'}
                  stroke={isOrigin ? '#065F46' : isDestination ? '#991B1B' : '#4B5563'}
                  strokeWidth={isRouteStation ? 2.5 : 1.5}
                />

                {/* Station Label on prominent / selected stations */}
                {(isRouteStation || isInterchange || scale > 1.2) && (
                  <text
                    x={8}
                    y={3}
                    fontSize={isOrigin || isDestination ? 12 : isInterchange ? 9 : 7}
                    fontWeight={isOrigin || isDestination || isRouteStation ? 'bold' : 'normal'}
                    fill={isOrigin ? '#065F46' : isDestination ? '#991B1B' : '#1F2937'}
                    className="pointer-events-none"
                    style={{ textShadow: '0 0 3px #FFFFFF, 0 0 3px #FFFFFF' }}
                  >
                    {station.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hovered Station Card Modal in Map View */}
        {hoveredStation && (
          <div className="absolute top-14 left-4 z-30 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-neutral-200 shadow-lg max-w-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="font-bold text-sm text-neutral-900">{hoveredStation.name}</span>
              <button
                type="button"
                onClick={() => setHoveredStation(null)}
                className="text-neutral-400 hover:text-black text-xs font-bold px-1"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap gap-1 mb-2.5">
              {hoveredStation.lines.map(lineId => {
                const l = linesData.find(x => x.id === lineId);
                return (
                  <span
                    key={lineId}
                    className="text-[10px] font-bold px-2 py-0.5 rounded text-white"
                    style={{ backgroundColor: l?.color || '#333' }}
                  >
                    {l?.name || lineId}
                  </span>
                );
              })}
            </div>

            {onSelectStation && (
              <div className="flex gap-2 pt-1 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => {
                    onSelectStation(hoveredStation, 'from');
                    setHoveredStation(null);
                  }}
                  className="flex-1 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-lg transition-all"
                >
                  Set Departure
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectStation(hoveredStation, 'to');
                    setHoveredStation(null);
                  }}
                  className="flex-1 py-1 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-all"
                >
                  Set Destination
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
