'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowUpDown, 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  Sparkles,
  Check,
  ChevronDown
} from 'lucide-react';
import { Station } from '@/engine/types';

interface JourneyPlannerProps {
  stations: Station[];
  onSearch: (fromId: string, toId: string, options: { isSunday: boolean; time: string }) => void;
  isLoading: boolean;
  initialFrom?: string;
  initialTo?: string;
}

export const JourneyPlanner: React.FC<JourneyPlannerProps> = ({
  stations,
  onSearch,
  isLoading,
  initialFrom = 'welcome',
  initialTo = 'dwarka'
}) => {
  const [fromStation, setFromStation] = useState<Station | null>(null);
  const [toStation, setToStation] = useState<Station | null>(null);

  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');

  const [showFromMenu, setShowFromMenu] = useState(false);
  const [showToMenu, setShowToMenu] = useState(false);

  const [isSunday, setIsSunday] = useState(false);
  const [time, setTime] = useState('10:00');

  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stations.length > 0) {
      const defaultFrom = stations.find(s => s.id === initialFrom) || stations[0];
      const defaultTo = stations.find(s => s.id === initialTo) || stations[1];
      setFromStation(defaultFrom);
      setFromQuery(defaultFrom.name);
      setToStation(defaultTo);
      setToQuery(defaultTo.name);
    }
  }, [stations, initialFrom, initialTo]);

  // Click outside to dismiss menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) {
        setShowFromMenu(false);
      }
      if (toRef.current && !toRef.current.contains(e.target as Node)) {
        setShowToMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwap = () => {
    const prevFrom = fromStation;
    const prevFromQuery = fromQuery;
    setFromStation(toStation);
    setFromQuery(toQuery);
    setToStation(prevFrom);
    setToQuery(prevFromQuery);
  };

  const handleFindRoutes = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fromStation || !toStation) return;
    onSearch(fromStation.id, toStation.id, { isSunday, time });
  };

  const filteredFrom = stations.filter(s => 
    s.name.toLowerCase().includes(fromQuery.toLowerCase()) || 
    s.aliases.some(a => a.includes(fromQuery.toLowerCase()))
  ).slice(0, 8);

  const filteredTo = stations.filter(s => 
    s.name.toLowerCase().includes(toQuery.toLowerCase()) || 
    s.aliases.some(a => a.includes(toQuery.toLowerCase()))
  ).slice(0, 8);

  const popularRoutes = [
    { label: "Welcome → Dwarka", from: "welcome", to: "dwarka" },
    { label: "Welcome → Rithala", from: "welcome", to: "rithala" },
    { label: "Kashmere Gate → Millennium City", from: "kashmere-gate", to: "millennium-city-centre-gurugram" },
    { label: "Rajiv Chowk → Noida Sec 52", from: "rajiv-chowk", to: "noida-sector-52" },
    { label: "New Delhi → Airport T-3", from: "new-delhi", to: "airport-t-3" }
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E4E5E7] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-base text-neutral-900">Plan Journey</h3>
          <p className="text-xs text-neutral-500">Multi-route comparison with +10 station window</p>
        </div>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          Fast Routing Engine
        </span>
      </div>

      <form onSubmit={handleFindRoutes} className="space-y-4">
        {/* Stations Input Section with Swap */}
        <div className="relative space-y-2">
          {/* Source Input */}
          <div ref={fromRef} className="relative">
            <label className="text-[11px] font-bold uppercase text-neutral-500 tracking-wider mb-1 block">
              Origin Station
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={fromQuery}
                onChange={(e) => {
                  setFromQuery(e.target.value);
                  setShowFromMenu(true);
                }}
                onFocus={() => setShowFromMenu(true)}
                placeholder="Search departure station..."
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white text-sm font-semibold text-neutral-900 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              />
            </div>

            {/* From Dropdown Autocomplete */}
            {showFromMenu && filteredFrom.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
                {filteredFrom.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setFromStation(st);
                      setFromQuery(st.name);
                      setShowFromMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-neutral-100 flex items-center justify-between border-b border-neutral-100 last:border-b-0"
                  >
                    <div>
                      <span className="font-semibold text-neutral-900">{st.name}</span>
                      <span className="text-[10px] text-neutral-500 ml-2 capitalize">({st.zone})</span>
                    </div>
                    <div className="flex gap-1">
                      {st.lines.map(line => (
                        <span key={line} className="w-2.5 h-2.5 rounded-full" style={{
                          backgroundColor: line === 'red' ? '#E21836' : line === 'yellow' ? '#FFC600' : line === 'blue' ? '#0072CE' : line === 'pink' ? '#E55393' : line === 'violet' ? '#7B2382' : line === 'magenta' ? '#9A1F6E' : line === 'green' ? '#009A44' : '#888'
                        }} />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="absolute right-4 top-[50%] -translate-y-[50%] z-10">
            <button
              type="button"
              onClick={handleSwap}
              title="Swap stations"
              className="w-8 h-8 rounded-full bg-white border border-neutral-200 hover:border-neutral-400 shadow-sm flex items-center justify-center text-neutral-700 hover:text-black transition-all hover:scale-105 active:scale-95"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* Destination Input */}
          <div ref={toRef} className="relative">
            <label className="text-[11px] font-bold uppercase text-neutral-500 tracking-wider mb-1 block">
              Destination Station
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-red-600">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={toQuery}
                onChange={(e) => {
                  setToQuery(e.target.value);
                  setShowToMenu(true);
                }}
                onFocus={() => setShowToMenu(true)}
                placeholder="Search destination station..."
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white text-sm font-semibold text-neutral-900 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              />
            </div>

            {/* To Dropdown Autocomplete */}
            {showToMenu && filteredTo.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
                {filteredTo.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setToStation(st);
                      setToQuery(st.name);
                      setShowToMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-neutral-100 flex items-center justify-between border-b border-neutral-100 last:border-b-0"
                  >
                    <div>
                      <span className="font-semibold text-neutral-900">{st.name}</span>
                      <span className="text-[10px] text-neutral-500 ml-2 capitalize">({st.zone})</span>
                    </div>
                    <div className="flex gap-1">
                      {st.lines.map(line => (
                        <span key={line} className="w-2.5 h-2.5 rounded-full" style={{
                          backgroundColor: line === 'red' ? '#E21836' : line === 'yellow' ? '#FFC600' : line === 'blue' ? '#0072CE' : line === 'pink' ? '#E55393' : line === 'violet' ? '#7B2382' : line === 'magenta' ? '#9A1F6E' : line === 'green' ? '#009A44' : '#888'
                        }} />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Secondary controls: Sunday/Holiday & Time */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Day / Sunday Toggle */}
          <button
            type="button"
            onClick={() => setIsSunday(!isSunday)}
            className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
              isSunday
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              <span>{isSunday ? 'Sunday Special Fare' : 'Mon - Sat Standard'}</span>
            </div>
            {isSunday && <Check className="w-3.5 h-3.5 text-amber-700" />}
          </button>

          {/* Time Picker */}
          <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700">
            <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <span className="text-neutral-500">Depart:</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-transparent text-xs font-semibold text-neutral-900 focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Primary CTA Button */}
        <button
          type="submit"
          disabled={isLoading || !fromStation || !toStation || fromStation.id === toStation.id}
          className="w-full py-3 bg-neutral-900 hover:bg-black text-white font-bold text-sm rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Find Multi-Routes</span>
              <span className="text-xs font-normal opacity-80">→</span>
            </>
          )}
        </button>

        {fromStation && toStation && fromStation.id === toStation.id && (
          <p className="text-xs text-amber-600 text-center font-medium">
            Origin and destination stations are the same. Please choose different stations.
          </p>
        )}
      </form>

      {/* Quick Common Journeys */}
      <div className="mt-4 pt-3.5 border-t border-neutral-100">
        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
          Popular Commutes
        </span>
        <div className="flex flex-wrap gap-1.5">
          {popularRoutes.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                const sFrom = stations.find(s => s.id === p.from);
                const sTo = stations.find(s => s.id === p.to);
                if (sFrom && sTo) {
                  setFromStation(sFrom);
                  setFromQuery(sFrom.name);
                  setToStation(sTo);
                  setToQuery(sTo.name);
                  onSearch(sFrom.id, sTo.id, { isSunday, time });
                }
              }}
              className="text-[11px] font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2.5 py-1 rounded-lg transition-all"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
