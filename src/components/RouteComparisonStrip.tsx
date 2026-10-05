'use client';

import React from 'react';
import { MetroRoute } from '@/engine/types';
import { Check } from 'lucide-react';

interface RouteComparisonStripProps {
  routes: MetroRoute[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
}

export const RouteComparisonStrip: React.FC<RouteComparisonStripProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute
}) => {
  if (routes.length <= 1) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#E4E5E7] p-4 shadow-xs">
      <div className="flex items-center justify-between mb-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          Instant Trade-off Comparison
        </h4>
        <span className="text-[11px] text-neutral-400">Click to compare & highlight</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-neutral-100 text-[11px] text-neutral-400 uppercase font-semibold">
              <th className="pb-2">Option</th>
              <th className="pb-2">Badge</th>
              <th className="pb-2 text-center">Stations</th>
              <th className="pb-2 text-center">Changes</th>
              <th className="pb-2 text-center">ETA</th>
              <th className="pb-2 text-right">Fare</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {routes.map((r) => {
              const isSelected = r.id === selectedRouteId;
              return (
                <tr
                  key={r.id}
                  onClick={() => onSelectRoute(r.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-neutral-50 font-bold text-neutral-900'
                      : 'hover:bg-neutral-50/60 text-neutral-600'
                  }`}
                >
                  <td className="py-2.5 flex items-center gap-1.5">
                    {isSelected && <Check className="w-3.5 h-3.5 text-neutral-900 shrink-0" />}
                    <span>Route {r.routeNumber}</span>
                  </td>
                  <td className="py-2.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                      {r.label}
                    </span>
                  </td>
                  <td className="py-2.5 text-center font-semibold text-neutral-900">
                    {r.stationCount}
                  </td>
                  <td className="py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.interchangeCount === 0 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : r.interchangeCount <= 1 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-neutral-100 text-neutral-700'
                    }`}>
                      {r.interchangeCount} {r.interchangeCount === 1 ? 'change' : 'changes'}
                    </span>
                  </td>
                  <td className="py-2.5 text-center font-medium">
                    ~{r.travel_time_min}m
                  </td>
                  <td className="py-2.5 text-right font-bold text-neutral-900">
                    ₹{r.fare.tokenFare}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
