'use client';

import React, { useState } from 'react';
import { Clock, Search, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { Station } from '@/engine/types';
import linesData from '@/data/lines.json';

interface TimingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations: Station[];
}

export const TimingsModal: React.FC<TimingsModalProps> = ({ isOpen, onClose, stations }) => {
  const [search, setSearch] = useState('');
  const [selectedStation, setSelectedStation] = useState<Station | null>(stations[0] || null);

  if (!isOpen) return null;

  const filtered = stations.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[#E4E5E7] shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">First & Last Train Timings</h3>
              <p className="text-xs text-neutral-500">Verified service schedules and peak windows</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Station */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search station to inspect service timings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {search && (
          <div className="bg-white border border-neutral-200 rounded-xl max-h-36 overflow-y-auto divide-y divide-neutral-100">
            {filtered.map(st => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setSelectedStation(st);
                  setSearch('');
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 font-medium text-neutral-800"
              >
                {st.name}
              </button>
            ))}
          </div>
        )}

        {/* Selected Station Timing Details */}
        {selectedStation && (
          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-neutral-900">{selectedStation.name}</h4>
                <span className="text-[11px] text-neutral-500 capitalize">{selectedStation.zone} Region</span>
              </div>
              <div className="flex gap-1">
                {selectedStation.lines.map(lineId => {
                  const l = linesData.find(x => x.id === lineId);
                  return (
                    <span
                      key={lineId}
                      className="text-[10px] font-bold px-2 py-0.5 rounded text-white"
                      style={{ backgroundColor: l?.color || '#333' }}
                    >
                      {l?.name.replace('Line', '').trim() || lineId}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-white p-3 rounded-xl border border-neutral-200 text-center">
                <span className="text-[10px] uppercase font-bold text-neutral-400">First Metro</span>
                <div className="text-xl font-bold text-neutral-900 mt-1">~ 05:30 AM</div>
                <span className="text-[10px] text-neutral-500">Sunday starts at 06:00 AM</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-neutral-200 text-center">
                <span className="text-[10px] uppercase font-bold text-neutral-400">Last Metro</span>
                <div className="text-xl font-bold text-neutral-900 mt-1">~ 11:15 PM</div>
                <span className="text-[10px] text-neutral-500">Varies slightly by line/terminal</span>
              </div>
            </div>
          </div>
        )}

        {/* Peak Hours Windows */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            DMRC Rush Hour Periods
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl border border-neutral-200 bg-neutral-50">
              <span className="font-bold text-neutral-900 block">Morning Peak</span>
              <span className="text-neutral-500 text-[11px]">08:00 AM – 12:00 PM</span>
            </div>
            <div className="p-2.5 rounded-xl border border-neutral-200 bg-neutral-50">
              <span className="font-bold text-neutral-900 block">Evening Peak</span>
              <span className="text-neutral-500 text-[11px]">05:00 PM – 09:00 PM</span>
            </div>
          </div>
        </div>

        {/* Warning according to PRD section 10 */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p>
            Exact first and last train arrival times vary by terminal direction, special maintenance blocks, and national holidays.
          </p>
        </div>
      </div>
    </div>
  );
};
