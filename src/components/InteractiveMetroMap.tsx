'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download,
  Layers, 
  FileText,
  MapPin,
  Sparkles,
  Maximize2
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

  // View Mode: 'vector' (SVG interactive route map) vs 'pdf' (Official DMRC Schematic Map from Metro.pdf)
  const [viewMode, setViewMode] = useState<'vector' | 'pdf'>('vector');

  // Vector Map Pan & Zoom
  const [scale, setScale] = useState(0.85);
  const [pan, setPan] = useState({ x: -100, y: -150 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // PDF Map Pan & Zoom
  const [pdfScale, setPdfScale] = useState(1);
  const [pdfPan, setPdfPan] = useState({ x: 0, y: 0 });
  const [isPdfDragging, setIsPdfDragging] = useState(false);
  const [pdfDragStart, setPdfDragStart] = useState({ x: 0, y: 0 });

  // Filter lines in vector mode
  const [activeLineFilter, setActiveLineFilter] = useState<string | null>(null);

  // Hovered station tooltip
  const [hoveredStation, setHoveredStation] = useState<Station | null>(null);

  // Map station lookup
  const stationMap = React.useMemo(() => {
    const map = new Map<string, Station>();
    for (const s of stations) {
      map.set(s.id, s);
    }
    return map;
  }, [stations]);

  // Group stations into line polylines in EXACT sequential order using line.stationIds
  const linePolylines = React.useMemo(() => {
    const polylines: Array<{ line: Line; points: Station[] }> = [];

    for (const line of linesData as (Line & { stationIds?: string[] })[]) {
      if (line.id === 'interchange-walk') continue;
      
      let orderedStations: Station[] = [];
      if (line.stationIds && line.stationIds.length > 0) {
        orderedStations = line.stationIds
          .map(id => stationMap.get(id))
          .filter(Boolean) as Station[];
      } else {
        orderedStations = stations.filter(s => s.lines.includes(line.id));
      }

      if (orderedStations.length > 1) {
        polylines.push({ line, points: orderedStations });
      }
    }
    return polylines;
  }, [stations, stationMap]);

  // Handle Zoom In / Out / Reset
  const handleZoom = (delta: number) => {
    if (viewMode === 'vector') {
      setScale(prev => Math.max(0.35, Math.min(2.8, prev + delta)));
    } else {
      setPdfScale(prev => Math.max(0.5, Math.min(4.0, prev + delta)));
    }
  };

  const handleReset = () => {
    if (viewMode === 'vector') {
      setScale(0.85);
      setPan({ x: -100, y: -150 });
    } else {
      setPdfScale(1);
      setPdfPan({ x: 0, y: 0 });
    }
  };

  // Fit route into viewport when selectedRoute changes in vector mode
  useEffect(() => {
    if (viewMode === 'vector' && selectedRoute && selectedRoute.stationSequence.length > 0) {
      const xs = selectedRoute.stationSequence.map(s => s.x);
      const ys = selectedRoute.stationSequence.map(s => s.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;

      setPan({
        x: 320 - midX * 0.85,
        y: 240 - midY * 0.85
      });
      setScale(0.85);
    }
  }, [selectedRoute, viewMode]);

  // Mouse pan handlers for vector map
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
    const zoomDelta = e.deltaY < 0 ? 0.12 : -0.12;
    handleZoom(zoomDelta);
  };

  // Mouse pan handlers for PDF Map
  const handlePdfMouseDown = (e: React.MouseEvent) => {
    setIsPdfDragging(true);
    setPdfDragStart({ x: e.clientX - pdfPan.x, y: e.clientY - pdfPan.y });
  };

  const handlePdfMouseMove = (e: React.MouseEvent) => {
    if (isPdfDragging) {
      setPdfPan({
        x: e.clientX - pdfDragStart.x,
        y: e.clientY - pdfDragStart.y
      });
    }
  };

  const handlePdfMouseUp = () => {
    setIsPdfDragging(false);
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
    <div className="relative w-full h-[540px] md:h-full min-h-[520px] bg-[#FAFBFB] rounded-2xl border border-[#E4E5E7] overflow-hidden flex flex-col select-none">
      {/* Top Map Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none gap-2">
        {/* View Mode Switcher */}
        <div className="pointer-events-auto flex items-center bg-white/95 backdrop-blur-md p-1 rounded-xl border border-neutral-200 shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode('vector')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'vector'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Route Map</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('pdf')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'pdf'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Official DMRC Map</span>
          </button>
        </div>

        {/* Zoom & Action Controls */}
        <div className="pointer-events-auto flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-neutral-200 shadow-sm">
          <button
            type="button"
            onClick={() => handleZoom(viewMode === 'vector' ? 0.15 : 0.25)}
            title="Zoom In"
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-700 hover:text-black transition-all"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(viewMode === 'vector' ? -0.15 : -0.25)}
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
          {viewMode === 'pdf' && (
            <>
              <div className="h-4 w-px bg-neutral-200 mx-0.5" />
              <a
                href="/metro-map.pdf"
                download="Delhi_Metro_Network_Map.pdf"
                title="Download Official DMRC PDF"
                className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-700 hover:text-black transition-all flex items-center"
              >
                <Download className="w-4 h-4" />
              </a>
            </>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: Interactive SVG Vector Route Map */}
      {viewMode === 'vector' && (
        <>
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
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background grid dots */}
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="#E5E7EB" />
              </pattern>
              <rect x="-300" y="-200" width="2000" height="1800" fill="url(#grid)" />

              {/* Yamuna River Stylized Line */}
              <path
                d="M 620 100 Q 640 350, 675 565 T 710 800 T 730 1100"
                fill="none"
                stroke="#BAE6FD"
                strokeWidth={14}
                strokeLinecap="round"
                opacity={0.65}
              />
              <text x="690" y="850" fill="#0284C7" fontSize="11" fontWeight="bold" opacity={0.5} transform="rotate(75, 690, 850)">
                Yamuna River
              </text>

              {/* Sequential Line Tracks (Clean, continuous lines without criss-cross) */}
              {linePolylines.map(({ line, points }) => {
                const isLineMuted = selectedRoute
                  ? !routeLinesUsed.has(line.id)
                  : activeLineFilter !== null && activeLineFilter !== line.id;

                const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                return (
                  <g key={line.id} opacity={isLineMuted ? 0.18 : 1} className="transition-opacity duration-300">
                    {/* Outline casing for subway style */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth={isLineMuted ? 4 : 7}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Core Line Track */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={line.color}
                      strokeWidth={isLineMuted ? 2.5 : 5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                );
              })}

              {/* Active Selected Route Glowing Overlay */}
              {selectedRoute && (
                <g>
                  {selectedRoute.segments.map((seg, idx) => {
                    const segD = seg.stations.map((s, i) => `${i === 0 ? 'M' : 'L'} ${s.x} ${s.y}`).join(' ');
                    return (
                      <g key={idx}>
                        <path
                          d={segD}
                          fill="none"
                          stroke="#FFFFFF"
                          strokeWidth={12}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d={segD}
                          fill="none"
                          stroke={seg.lineColor}
                          strokeWidth={8}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#glow)"
                        />
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Station Dots & Interchange Markers */}
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
                    opacity={isMuted ? 0.22 : 1}
                    className="cursor-pointer transition-all duration-200 group"
                    onClick={() => setHoveredStation(station)}
                    onMouseEnter={() => setHoveredStation(station)}
                  >
                    {/* Interchange Outer Concentric Ring */}
                    {isInterchange && (
                      <circle
                        r={isOrigin || isDestination ? 10 : 7}
                        fill="#FFFFFF"
                        stroke="#171717"
                        strokeWidth={2}
                      />
                    )}

                    {/* Normal Station Dot */}
                    <circle
                      r={isOrigin || isDestination ? 7.5 : isInterchange ? 4.5 : 3.5}
                      fill={isOrigin ? '#10B981' : isDestination ? '#EF4444' : isRouteStation ? '#171717' : '#FFFFFF'}
                      stroke={isOrigin ? '#065F46' : isDestination ? '#991B1B' : '#374151'}
                      strokeWidth={isRouteStation ? 2.5 : 1.5}
                    />

                    {/* Station Labels */}
                    {(isRouteStation || isInterchange || scale > 1.25) && (
                      <text
                        x={9}
                        y={3.5}
                        fontSize={isOrigin || isDestination ? 12 : isInterchange ? 9.5 : 7.5}
                        fontWeight={isOrigin || isDestination || isRouteStation ? 'bold' : 'normal'}
                        fill={isOrigin ? '#065F46' : isDestination ? '#991B1B' : '#1F2937'}
                        className="pointer-events-none select-none"
                        style={{ textShadow: '0 0 3px #FFFFFF, 0 0 3px #FFFFFF' }}
                      >
                        {station.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hovered Station Tooltip Modal */}
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
        </>
      )}

      {/* VIEW MODE 2: Official DMRC Network Map (Metro.pdf) */}
      {viewMode === 'pdf' && (
        <div
          onMouseDown={handlePdfMouseDown}
          onMouseMove={handlePdfMouseMove}
          onMouseUp={handlePdfMouseUp}
          onWheel={(e) => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.15 : -0.15;
            handleZoom(delta);
          }}
          className={`w-full h-full flex-1 cursor-${isPdfDragging ? 'grabbing' : 'grab'} overflow-hidden relative bg-neutral-100 flex items-center justify-center`}
        >
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-100"
            style={{
              transform: `translate(${pdfPan.x}px, ${pdfPan.y}px) scale(${pdfScale})`,
              transformOrigin: 'center center'
            }}
          >
            <img
              src="/metro-map.webp"
              alt="Official Delhi-NCR Metro Network Map"
              className="max-w-none w-[1100px] md:w-[1400px] h-auto object-contain shadow-2xl rounded-xl"
              draggable={false}
            />
          </div>

          {/* DMRC Official attribution watermark */}
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-200 shadow-sm text-xs font-semibold text-neutral-700 pointer-events-none">
            Official DMRC Network Map • Drag to Pan • Scroll to Zoom
          </div>
        </div>
      )}
    </div>
  );
};
