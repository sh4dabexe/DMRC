'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { JourneyPlanner } from '@/components/JourneyPlanner';
import { RouteCard } from '@/components/RouteCard';
import { RouteComparisonStrip } from '@/components/RouteComparisonStrip';
import { InteractiveMetroMap } from '@/components/InteractiveMetroMap';
import { FareCalculatorModal } from '@/components/FareCalculatorModal';
import { TimingsModal } from '@/components/TimingsModal';
import { SavedTripsModal } from '@/components/SavedTripsModal';
import { AiAssistantModal } from '@/components/AiAssistantModal';
import { Station, MetroRoute, RouteQueryResult } from '@/engine/types';
import { 
  Sparkles, 
  Map as MapIcon, 
  Navigation, 
  CreditCard, 
  Clock, 
  Bookmark, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Share2,
  Check,
  Info
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'planner' | 'map' | 'fares' | 'timings' | 'saved'>('planner');
  const [stations, setStations] = useState<Station[]>([]);
  const [queryResult, setQueryResult] = useState<RouteQueryResult | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-1');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Modals
  const [showFareModal, setShowFareModal] = useState(false);
  const [showTimingsModal, setShowTimingsModal] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // Saved Trips in localStorage
  const [savedTrips, setSavedTrips] = useState<any[]>([]);

  // Load initial stations
  useEffect(() => {
    fetch('/api/stations')
      .then(res => res.json())
      .then(data => {
        if (data.stations) {
          setStations(data.stations);
          // Check query parameters for shareable links
          const params = new URLSearchParams(window.location.search);
          const urlFrom = params.get('from') || 'welcome';
          const urlTo = params.get('to') || 'dwarka';
          const urlSun = params.get('isSunday') === 'true';
          const urlTime = params.get('time') || '10:00';
          handleSearch(urlFrom, urlTo, { isSunday: urlSun, time: urlTime });
        }
      })
      .catch(err => {
        console.error("Failed to load stations:", err);
      });

    try {
      const stored = localStorage.getItem('metroflow_saved_trips');
      if (stored) {
        setSavedTrips(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Storage access failed:", e);
    }
  }, []);

  const handleSearch = async (fromId: string, toId: string, options: { isSunday: boolean; time: string }) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // Update browser URL without reload
      const newUrl = `/?from=${encodeURIComponent(fromId)}&to=${encodeURIComponent(toId)}&isSunday=${options.isSunday}&time=${encodeURIComponent(options.time)}`;
      window.history.replaceState({}, '', newUrl);

      const url = `/api/routes?from=${encodeURIComponent(fromId)}&to=${encodeURIComponent(toId)}&isSunday=${options.isSunday}&time=${encodeURIComponent(options.time)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to calculate routes.');
        setQueryResult(null);
      } else {
        setQueryResult(data);
        if (data.routes && data.routes.length > 0) {
          setSelectedRouteId(data.routes[0].id);
        }
      }
    } catch (err: any) {
      setErrorMsg('Network error calculating route.');
      setQueryResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleSaveTrip = (route: MetroRoute) => {
    if (!queryResult) return;
    const newTrip = {
      id: `${queryResult.from.id}-${queryResult.to.id}-${Date.now()}`,
      fromName: queryResult.from.name,
      toName: queryResult.to.name,
      fromId: queryResult.from.id,
      toId: queryResult.to.id,
      route,
      savedAt: new Date().toLocaleDateString()
    };
    const updated = [newTrip, ...savedTrips.filter(t => !(t.fromId === newTrip.fromId && t.toId === newTrip.toId))];
    setSavedTrips(updated);
    try {
      localStorage.setItem('metroflow_saved_trips', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleRemoveTrip = (id: string) => {
    const updated = savedTrips.filter(t => t.id !== id);
    setSavedTrips(updated);
    try {
      localStorage.setItem('metroflow_saved_trips', JSON.stringify(updated));
    } catch (e) {}
  };

  const selectedRoute = queryResult?.routes.find(r => r.id === selectedRouteId) || queryResult?.routes[0] || null;

  return (
    <div className="flex h-screen bg-[#F5F6F7] text-neutral-900 overflow-hidden font-sans">
      {/* Sidebar for Desktop */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'fares') setShowFareModal(true);
          else if (tab === 'timings') setShowTimingsModal(true);
          else if (tab === 'saved') setShowSavedModal(true);
          else setActiveTab(tab);
        }}
        savedTripsCount={savedTrips.length}
        onOpenAiAssistant={() => setShowAiModal(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />

        {/* Content Workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto h-full flex flex-col gap-6">
            
            {/* Top Workspace Grid: Left Column Planner & Results / Right Column Interactive Map */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column (Planner + Multi-Route Cards) - 7 cols */}
              <div className="lg:col-span-7 space-y-5">
                <JourneyPlanner
                  stations={stations}
                  onSearch={handleSearch}
                  isLoading={isLoading}
                />

                {errorMsg && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold">
                    {errorMsg}
                  </div>
                )}

                {/* Search Results Section */}
                {queryResult && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Header info badge with Share Button */}
                    <div className="bg-white rounded-2xl border border-[#E4E5E7] p-4 flex items-center justify-between shadow-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-neutral-900">
                            {queryResult.from.name}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                          <span className="font-bold text-sm text-neutral-900">
                            {queryResult.to.name}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {queryResult.routes.length === 1 
                            ? 'Direct Route Found (0 Interchanges)' 
                            : `${queryResult.routes.length} Meaningful Routes (Baseline ${queryResult.minimumStations} stations, within +10 window)`
                          }
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold text-neutral-700 flex items-center gap-1.5 transition-all"
                          title="Share route link"
                        >
                          {copiedLink ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Link Copied!</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5 text-neutral-500" />
                              <span className="hidden sm:inline">Share</span>
                            </>
                          )}
                        </button>

                        <div className="text-right pl-2 border-l border-neutral-100">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                            Shortest
                          </span>
                          <span className="text-sm font-extrabold text-neutral-900">
                            {queryResult.minimumStations} stn
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Trade-off Comparison Strip */}
                    <RouteComparisonStrip
                      routes={queryResult.routes}
                      selectedRouteId={selectedRouteId}
                      onSelectRoute={setSelectedRouteId}
                    />

                    {/* Route Cards List */}
                    <div className="space-y-3.5">
                      {queryResult.routes.map((route) => {
                        const isSaved = savedTrips.some(
                          t => t.fromId === queryResult.from.id && t.toId === queryResult.to.id
                        );
                        return (
                          <RouteCard
                            key={route.id}
                            route={route}
                            isSelected={route.id === selectedRouteId}
                            onSelect={() => setSelectedRouteId(route.id)}
                            onSave={handleSaveTrip}
                            isSaved={isSaved}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column (Interactive Metro Map + Status) - 5 cols */}
              <div className="lg:col-span-5 space-y-5 sticky top-4">
                <div className="h-[460px] md:h-[580px] w-full">
                  <InteractiveMetroMap
                    stations={stations}
                    selectedRoute={selectedRoute}
                    onSelectStation={(st, type) => {
                      if (type === 'from') {
                        handleSearch(st.id, queryResult?.to.id || 'dwarka', { isSunday: false, time: '10:00' });
                      } else {
                        handleSearch(queryResult?.from.id || 'welcome', st.id, { isSunday: false, time: '10:00' });
                      }
                    }}
                  />
                </div>

                {/* Quick Status and Tools Card */}
                <div className="bg-white rounded-2xl border border-[#E4E5E7] p-4.5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-bold text-xs text-neutral-900">DMRC Network Status</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-medium">Verified Operational</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setShowFareModal(true)}
                      className="p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 flex items-center gap-2 transition-all font-semibold text-neutral-800 text-left"
                    >
                      <CreditCard className="w-4 h-4 text-neutral-500 shrink-0" />
                      <div>
                        <div>Fare Slab Calculator</div>
                        <div className="text-[10px] text-neutral-400 font-normal">Token & Smart Card</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowTimingsModal(true)}
                      className="p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 flex items-center gap-2 transition-all font-semibold text-neutral-800 text-left"
                    >
                      <Clock className="w-4 h-4 text-neutral-500 shrink-0" />
                      <div>
                        <div>First & Last Metro</div>
                        <div className="text-[10px] text-neutral-400 font-normal">Service windows</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-3 py-2 flex items-center justify-around z-40">
          <button
            type="button"
            onClick={() => setActiveTab('planner')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
              activeTab === 'planner' ? 'text-black' : 'text-neutral-500'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>Planner</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            className="flex flex-col items-center gap-1 text-[10px] font-semibold text-purple-700"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Helper</span>
          </button>
          <button
            type="button"
            onClick={() => setShowFareModal(true)}
            className="flex flex-col items-center gap-1 text-[10px] font-semibold text-neutral-500 hover:text-black"
          >
            <CreditCard className="w-4 h-4" />
            <span>Fares</span>
          </button>
          <button
            type="button"
            onClick={() => setShowTimingsModal(true)}
            className="flex flex-col items-center gap-1 text-[10px] font-semibold text-neutral-500 hover:text-black"
          >
            <Clock className="w-4 h-4" />
            <span>Timings</span>
          </button>
          <button
            type="button"
            onClick={() => setShowSavedModal(true)}
            className="flex flex-col items-center gap-1 text-[10px] font-semibold text-neutral-500 hover:text-black"
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <FareCalculatorModal
        isOpen={showFareModal}
        onClose={() => setShowFareModal(false)}
      />

      <TimingsModal
        isOpen={showTimingsModal}
        onClose={() => setShowTimingsModal(false)}
        stations={stations}
      />

      <SavedTripsModal
        isOpen={showSavedModal}
        onClose={() => setShowSavedModal(false)}
        savedTrips={savedTrips}
        onRemoveTrip={handleRemoveTrip}
        onLoadTrip={(fromId, toId) => handleSearch(fromId, toId, { isSunday: false, time: '10:00' })}
      />

      <AiAssistantModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onApplyRoute={(fromId, toId) => handleSearch(fromId, toId, { isSunday: false, time: '10:00' })}
      />
    </div>
  );
}
