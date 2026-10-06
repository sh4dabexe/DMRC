'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download,
  Layers, 
  FileText, 
  MapPin, 
  Maximize2, 
  Minimize2,
  Search,
  X,
  Navigation,
  ArrowRight,
  Info,
  Compass,
  Check
} from 'lucide-react';
import { Station, Line, MetroRoute } from '@/engine/types';
import linesData from '@/data/lines.json';

interface InteractiveMetroMapProps {
  stations: Station[];
  selectedRoute?: MetroRoute | null;
  onSelectStation?: (station: Station, type: 'from' | 'to') => void;
  isFullView?: boolean;
  initialFromId?: string;
  initialToId?: string;
  onPlanTrip?: (fromId: string, toId: string) => void;
  onOpenPlanner?: () => void;
  onExpandFullMap?: () => void;
}

export const InteractiveMetroMap: React.FC<InteractiveMetroMapProps> = ({
  stations,
  selectedRoute,
  onSelectStation,
  isFullView = false,
  initialFromId = '',
  initialToId = '',
  onPlanTrip,
  onOpenPlanner,
  onExpandFullMap
}) => {
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // View Mode: 'vector' (SVG interactive route map) vs 'pdf' (Official DMRC Schematic Map)
  const [viewMode, setViewMode] = useState<'vector' | 'pdf'>('vector');

  // Vector Map Pan & Zoom
  const defaultScale = isFullView ? 1.35 : 1.25;
  const [scale, setScale] = useState(defaultScale);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // PDF Map Pan & Zoom
  const [pdfScale, setPdfScale] = useState(isFullView ? 1.15 : 1.0);
  const [pdfPan, setPdfPan] = useState({ x: 0, y: 0 });
  const [isPdfDragging, setIsPdfDragging] = useState(false);
  const [pdfDragStart, setPdfDragStart] = useState({ x: 0, y: 0 });

  // Filter lines in vector mode
  const [activeLineFilter, setActiveLineFilter] = useState<string | null>(null);

  // Hovered / Selected station
  const [hoveredStation, setHoveredStation] = useState<Station | null>(null);
  const [focusedStationId, setFocusedStationId] = useState<string | null>(null);

  // Search station in map
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Legend visibility
  const [showLegend, setShowLegend] = useState(false);

  // Staged departure and destination for map routing
  const [mapFromId, setMapFromId] = useState<string>(initialFromId);
  const [mapToId, setMapToId] = useState<string>(initialToId);

  useEffect(() => {
    if (initialFromId) setMapFromId(initialFromId);
    if (initialToId) setMapToId(initialToId);
  }, [initialFromId, initialToId]);

  // Map station lookup
  const stationMap = useMemo(() => {
    const map = new Map<string, Station>();
    for (const s of stations) {
      map.set(s.id, s);
    }
    return map;
  }, [stations]);

  // Group stations into line polylines in EXACT sequential order using line.stationIds
  const linePolylines = useMemo(() => {
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

  // Search matching stations
  const matchingStations = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return stations.filter(s => 
      s.name.toLowerCase().includes(q) ||
      s.aliases?.some(a => a.toLowerCase().includes(q))
    ).slice(0, 7);
  }, [stations, searchQuery]);

  // Zoom handlers
  const handleZoom = (delta: number) => {
    if (viewMode === 'vector') {
      setScale(prev => Math.max(0.45, Math.min(3.6, prev + delta)));
    } else {
      setPdfScale(prev => Math.max(0.5, Math.min(4.5, prev + delta)));
    }
  };

  const handleReset = () => {
    if (viewMode === 'vector') {
      setScale(defaultScale);
      setPan({ x: 0, y: 0 });
      setFocusedStationId(null);
    } else {
      setPdfScale(isFullView ? 1.15 : 1.0);
      setPdfPan({ x: 0, y: 0 });
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!mapWrapperRef.current) return;
    if (!document.fullscreenElement) {
      mapWrapperRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Center on station
  const focusOnStation = (station: Station) => {
    const container = containerRef.current;
    const width = container?.clientWidth || 800;
    const height = container?.clientHeight || 600;
    const coordScale = Math.min(width / 1350, height / 1200);
    const targetScale = isFullView ? 2.1 : 1.8;

    const dx = -(station.x - 625) * coordScale * targetScale;
    const dy = -(station.y - 650) * coordScale * targetScale;

    setPan({ x: Math.round(dx), y: Math.round(dy) });
    setScale(targetScale);
    setHoveredStation(station);
    setFocusedStationId(station.id);
    setIsSearchOpen(false);
  };

  // Fit route into viewport smoothly centered when selectedRoute changes in vector mode
  const fitRoute = () => {
    if (selectedRoute && selectedRoute.stationSequence.length > 0) {
      const xs = selectedRoute.stationSequence.map(s => s.x);
      const ys = selectedRoute.stationSequence.map(s => s.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;

      const container = containerRef.current;
      const width = container?.clientWidth || 700;
      const height = container?.clientHeight || 650;
      const coordScale = Math.min(width / 1350, height / 1200);

      const targetScale = isFullView ? 1.5 : 1.35;
      const dx = -(midX - 625) * coordScale * targetScale;
      const dy = -(midY - 650) * coordScale * targetScale;

      setPan({
        x: Math.round(dx),
        y: Math.round(dy)
      });
      setScale(targetScale);
    }
  };

  useEffect(() => {
    if (viewMode === 'vector' && selectedRoute && selectedRoute.stationSequence.length > 0) {
      fitRoute();
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

  // Non-passive wheel listeners to zoom map without scrolling outer page
  useEffect(() => {
    const el = containerRef.current;
    if (!el || viewMode !== 'vector') return;

    const onVectorWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const zoomDelta = e.deltaY < 0 ? 0.14 : -0.14;
      setScale(prev => Math.max(0.4, Math.min(3.5, prev + zoomDelta)));
    };

    el.addEventListener('wheel', onVectorWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onVectorWheel);
    };
  }, [viewMode]);

  useEffect(() => {
    const el = pdfContainerRef.current;
    if (!el || viewMode !== 'pdf') return;

    const onPdfWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const zoomDelta = e.deltaY < 0 ? 0.18 : -0.18;
      setPdfScale(prev => Math.max(0.5, Math.min(4.5, prev + zoomDelta)));
    };

    el.addEventListener('wheel', onPdfWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onPdfWheel);
    };
  }, [viewMode]);

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
  const routeStationIds = useMemo(() => {
    if (!selectedRoute) return new Set<string>();
    return new Set(selectedRoute.stationSequence.map(s => s.id));
  }, [selectedRoute]);

  const routeLinesUsed = useMemo(() => {
    if (!selectedRoute) return new Set<string>();
    return new Set(selectedRoute.linesUsed);
  }, [selectedRoute]);

  const fromStation = mapFromId ? stationMap.get(mapFromId) : null;
  const toStation = mapToId ? stationMap.get(mapToId) : null;

  return (
    <div 
      ref={mapWrapperRef}
      className={`relative w-full ${isFullView ? 'h-full flex-1 min-h-[550px]' : 'h-full min-h-[500px]'} bg-[#FAFBFB] rounded-2xl border border-[#E4E5E7] overflow-hidden flex flex-col select-none shadow-xs`}
    >
      {/* Top Map Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none gap-2 flex-wrap sm:flex-nowrap">
        
        {/* Left: View Mode Switcher & Station Search */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white/95 backdrop-blur-md p-1 rounded-xl border border-neutral-200 shadow-sm">
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
              <span>Interactive Map</span>
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

          {/* Station Quick Search (Especially useful in Full View!) */}
          {viewMode === 'vector' && (
            <div className="relative">
              <div className="flex items-center bg-white/95 backdrop-blur-md rounded-xl border border-neutral-200 shadow-sm px-2.5 py-1.5 w-48 md:w-64">
                <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0 mr-1.5" />
                <input
                  type="text"
                  placeholder="Find station on map..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-full text-xs bg-transparent border-none outline-none text-neutral-800 placeholder-neutral-400 font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    className="text-neutral-400 hover:text-black ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Search dropdown results */}
              {isSearchOpen && matchingStations.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white/95 backdrop-blur-md rounded-xl border border-neutral-200 shadow-xl overflow-hidden z-40 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-1">
                    {matchingStations.map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => focusOnStation(st)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-100 flex items-center justify-between text-xs transition-colors group"
                      >
                        <div>
                          <div className="font-semibold text-neutral-900 group-hover:text-black">{st.name}</div>
                          <div className="flex gap-1 mt-0.5">
                            {st.lines.map(lId => {
                              const line = linesData.find(l => l.id === lId);
                              return (
                                <span
                                  key={lId}
                                  className="text-[9px] font-bold px-1.5 py-0.2 rounded text-white"
                                  style={{ backgroundColor: line?.color || '#555' }}
                                >
                                  {line?.name.replace('Line', '').trim()}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Zoom & Action Controls */}
        <div className="pointer-events-auto flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-neutral-200 shadow-sm">
          {/* Zoom controls */}
          <button
            type="button"
            onClick={() => handleZoom(viewMode === 'vector' ? 0.2 : 0.25)}
            title="Zoom In"
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-700 hover:text-black transition-all"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(viewMode === 'vector' ? -0.2 : -0.25)}
            title="Zoom Out"
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-700 hover:text-black transition-all"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <div className="h-4 w-px bg-neutral-200 mx-0.5" />

          {/* Reset View */}
          <button
            type="button"
            onClick={handleReset}
            title="Reset to Full Network"
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-700 hover:text-black transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Fit Route Button (if route exists in vector mode) */}
          {viewMode === 'vector' && selectedRoute && (
            <button
              type="button"
              onClick={fitRoute}
              title="Focus on Active Route"
              className="p-1.5 rounded-lg hover:bg-neutral-100 text-emerald-700 hover:text-emerald-900 transition-all"
            >
              <Compass className="w-4 h-4" />
            </button>
          )}

          {/* Legend toggle */}
          {viewMode === 'vector' && (
            <button
              type="button"
              onClick={() => setShowLegend(prev => !prev)}
              title="Toggle Metro Legend"
              className={`p-1.5 rounded-lg transition-all ${
                showLegend 
                  ? 'bg-neutral-900 text-white' 
                  : 'hover:bg-neutral-100 text-neutral-700 hover:text-black'
              }`}
            >
              <Info className="w-4 h-4" />
            </button>
          )}

          {/* Expand to Full Map (when in compact view) */}
          {!isFullView && onExpandFullMap && (
            <button
              type="button"
              onClick={onExpandFullMap}
              title="Expand to Full Map View"
              className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-700 hover:text-black transition-all"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          {/* Fullscreen toggle (in full view) */}
          {isFullView && (
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-700 hover:text-black transition-all"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          {/* Download Official PDF */}
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
              All Lines (12)
            </button>

            {linesData.filter(l => l.id !== 'interchange-walk').map((line) => {
              const isFilterActive = activeLineFilter === line.id;
              return (
                <button
                  key={line.id}
                  type="button"
                  onClick={() => setActiveLineFilter(isFilterActive ? null : line.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 border flex items-center gap-1.5 ${
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
            className={`w-full h-full flex-1 cursor-${isDragging ? 'grabbing' : 'grab'} overflow-hidden relative overscroll-contain touch-none`}
            style={{ overscrollBehavior: 'contain', touchAction: 'none' }}
          >
            <svg
              ref={svgRef}
              viewBox="-50 50 1350 1200"
              className="w-full h-full"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                transformOrigin: 'center center',
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
              <rect x="-600" y="-400" width="2800" height="2600" fill="url(#grid)" />

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
                const isFocused = focusedStationId === station.id;

                const isMuted = selectedRoute
                  ? !isRouteStation
                  : activeLineFilter !== null && !station.lines.includes(activeLineFilter);

                return (
                  <g
                    key={station.id}
                    transform={`translate(${station.x}, ${station.y})`}
                    opacity={isMuted ? 0.22 : 1}
                    className="cursor-pointer transition-all duration-200 group"
                    onClick={() => {
                      setHoveredStation(station);
                      setFocusedStationId(station.id);
                    }}
                    onMouseEnter={() => setHoveredStation(station)}
                  >
                    {/* Focused Station Beacon */}
                    {isFocused && (
                      <>
                        <circle
                          r={16}
                          fill="none"
                          stroke="#2563EB"
                          strokeWidth={2}
                          className="animate-ping"
                          opacity={0.65}
                        />
                        <circle
                          r={13}
                          fill="#3B82F6"
                          fillOpacity={0.2}
                          stroke="#2563EB"
                          strokeWidth={2}
                        />
                      </>
                    )}

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
                    {(isRouteStation || isInterchange || isFocused || scale > 1.25) && (
                      <text
                        x={9}
                        y={3.5}
                        fontSize={isOrigin || isDestination ? 12 : isInterchange ? 9.5 : 7.5}
                        fontWeight={isOrigin || isDestination || isRouteStation || isFocused ? 'bold' : 'normal'}
                        fill={isOrigin ? '#065F46' : isDestination ? '#991B1B' : isFocused ? '#1D4ED8' : '#1F2937'}
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

            {/* Hovered Station Info Card Modal / Popover */}
            {hoveredStation && (
              <div className="absolute top-16 left-4 z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-neutral-200 shadow-xl max-w-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-neutral-600" />
                    <span className="font-bold text-sm text-neutral-900">{hoveredStation.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setHoveredStation(null);
                      setFocusedStationId(null);
                    }}
                    className="text-neutral-400 hover:text-black text-xs font-bold p-1 rounded-lg hover:bg-neutral-100"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {hoveredStation.lines.map(lineId => {
                    const l = linesData.find(x => x.id === lineId);
                    return (
                      <span
                        key={lineId}
                        className="text-[10px] font-bold px-2 py-0.5 rounded text-white shadow-xs"
                        style={{ backgroundColor: l?.color || '#333' }}
                      >
                        {l?.name || lineId}
                      </span>
                    );
                  })}
                  {hoveredStation.lines.length > 1 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                      Interchange Station
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 pt-1 border-t border-neutral-100">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMapFromId(hoveredStation.id);
                        onSelectStation?.(hoveredStation, 'from');
                      }}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                        mapFromId === hoveredStation.id
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                      }`}
                    >
                      {mapFromId === hoveredStation.id ? '✓ Departure Set' : 'Set as Departure'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMapToId(hoveredStation.id);
                        onSelectStation?.(hoveredStation, 'to');
                      }}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                        mapToId === hoveredStation.id
                          ? 'bg-blue-50 border-blue-300 text-blue-800'
                          : 'bg-neutral-900 hover:bg-black border-neutral-900 text-white'
                      }`}
                    >
                      {mapToId === hoveredStation.id ? '✓ Destination Set' : 'Set as Destination'}
                    </button>
                  </div>

                  {/* If both departure and destination are set, show Plan Journey button */}
                  {mapFromId && mapToId && mapFromId !== mapToId && (
                    <button
                      type="button"
                      onClick={() => {
                        onPlanTrip?.(mapFromId, mapToId);
                      }}
                      className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all mt-2"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Plan Journey from {stationMap.get(mapFromId)?.name.split(' ')[0]} ➔ {stationMap.get(mapToId)?.name.split(' ')[0]}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Metro Map Legend Drawer / Overlay */}
            {showLegend && (
              <div className="absolute top-16 right-4 z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-neutral-200 shadow-xl max-w-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-neutral-100">
                  <span className="font-bold text-xs text-neutral-900 uppercase tracking-wider">Network Legend</span>
                  <button
                    type="button"
                    onClick={() => setShowLegend(false)}
                    className="text-neutral-400 hover:text-black text-xs font-bold p-1 rounded-lg hover:bg-neutral-100"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-black bg-white flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-black" />
                    </span>
                    <span className="text-neutral-700">Interchange Station</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full border border-neutral-600 bg-white" />
                    <span className="text-neutral-700">Regular Station</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-4 h-1.5 rounded bg-sky-300" />
                    <span className="text-neutral-700">Yamuna River</span>
                  </div>

                  <div className="pt-2 border-t border-neutral-100">
                    <div className="font-semibold text-[11px] text-neutral-500 mb-1.5">Metro Lines (12)</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {linesData.filter(l => l.id !== 'interchange-walk').map(l => (
                        <div key={l.id} className="flex items-center gap-1.5 text-[11px] text-neutral-700">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                          <span className="truncate">{l.name.replace('Line', '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Active Selected Route Float Bar (in full view) */}
            {isFullView && selectedRoute && (
              <div className="absolute bottom-14 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto z-20 pointer-events-auto">
                <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-neutral-200 shadow-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                        <span>{selectedRoute.stationSequence[0]?.name}</span>
                        <ArrowRight className="w-3 h-3 text-neutral-400" />
                        <span>{selectedRoute.stationSequence[selectedRoute.stationSequence.length - 1]?.name}</span>
                      </div>
                      <div className="text-[11px] text-neutral-500 font-medium">
                        {selectedRoute.stationCount} stations • {selectedRoute.interchangeCount} transfer{selectedRoute.interchangeCount === 1 ? '' : 's'} • ₹{selectedRoute.fare.tokenFare} • ~{selectedRoute.travel_time_min} mins
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={fitRoute}
                      className="px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold text-neutral-700 transition-all"
                    >
                      Focus
                    </button>
                    {onOpenPlanner && (
                      <button
                        type="button"
                        onClick={onOpenPlanner}
                        className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-xs font-bold text-white transition-all flex items-center gap-1"
                      >
                        <span>Directions</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* VIEW MODE 2: Official DMRC Network Map (Metro.pdf / webp) */}
      {viewMode === 'pdf' && (
        <div
          ref={pdfContainerRef}
          onMouseDown={handlePdfMouseDown}
          onMouseMove={handlePdfMouseMove}
          onMouseUp={handlePdfMouseUp}
          className={`w-full h-full flex-1 cursor-${isPdfDragging ? 'grabbing' : 'grab'} overflow-hidden relative bg-neutral-100 flex items-center justify-center overscroll-contain touch-none`}
          style={{ overscrollBehavior: 'contain', touchAction: 'none' }}
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
              className="max-w-none w-[1100px] md:w-[1500px] h-auto object-contain shadow-2xl rounded-xl"
              draggable={false}
            />
          </div>

          {/* DMRC Official attribution watermark & instructions */}
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-neutral-200 shadow-sm text-xs font-semibold text-neutral-700 pointer-events-none flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Official DMRC Network Map • Drag to Pan • Scroll to Zoom</span>
          </div>
        </div>
      )}
    </div>
  );
};
