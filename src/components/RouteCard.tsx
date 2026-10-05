'use client';

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  TrainTrack, 
  ArrowRight, 
  Sparkles, 
  MapPin, 
  Clock, 
  CreditCard,
  Layers,
  CheckCircle2,
  Bookmark,
  Share2
} from 'lucide-react';
import { MetroRoute } from '@/engine/types';

interface RouteCardProps {
  route: MetroRoute;
  isSelected: boolean;
  onSelect: () => void;
  onSave?: (route: MetroRoute) => void;
  isSaved?: boolean;
}

export const RouteCard: React.FC<RouteCardProps> = ({
  route,
  isSelected,
  onSelect,
  onSave,
  isSaved = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getLabelBadgeStyle = (label: MetroRoute['label']) => {
    switch (label) {
      case 'Least Stations':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Fewer Interchanges':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Direct Route':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Fastest':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  return (
    <div 
      className={`rounded-2xl transition-all duration-200 border ${
        isSelected
          ? 'bg-white border-neutral-900 shadow-md ring-1 ring-neutral-900/10'
          : 'bg-white border-[#E4E5E7] hover:border-neutral-300 shadow-sm'
      }`}
    >
      {/* Card Header & Key Metrics */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-neutral-900">
              Route {route.routeNumber}
            </span>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getLabelBadgeStyle(route.label)}`}>
              {route.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {onSave && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSave(route);
                }}
                title={isSaved ? "Saved" : "Save trip"}
                className={`p-1.5 rounded-lg border text-xs transition-all ${
                  isSaved
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 fill-current" />
              </button>
            )}

            <button
              type="button"
              onClick={onSelect}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                isSelected
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {isSelected ? 'Highlighted on Map' : 'Select Route'}
            </button>
          </div>
        </div>

        {/* 4 Primary Metrics Strip */}
        <div className="grid grid-cols-4 gap-2 bg-neutral-50/80 rounded-xl p-3 border border-neutral-100 mb-3.5 text-center">
          <div>
            <div className="text-base sm:text-lg font-bold text-neutral-900">{route.stationCount}</div>
            <div className="text-[10px] sm:text-[11px] font-medium text-neutral-500 uppercase">Stations</div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-neutral-900">~{route.travel_time_min}</div>
            <div className="text-[10px] sm:text-[11px] font-medium text-neutral-500 uppercase">Mins</div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-neutral-900">{route.interchangeCount}</div>
            <div className="text-[10px] sm:text-[11px] font-medium text-neutral-500 uppercase">
              {route.interchangeCount === 1 ? 'Change' : 'Changes'}
            </div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-neutral-900">₹{route.fare.tokenFare}</div>
            <div className="text-[10px] sm:text-[11px] font-medium text-neutral-500 uppercase">
              (₹{route.fare.smartCardFare} Card)
            </div>
          </div>
        </div>

        {/* Line Flow Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {route.segments.map((seg, idx) => (
            <React.Fragment key={idx}>
              <div 
                className="px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                style={{ 
                  backgroundColor: seg.lineColor, 
                  color: seg.lineTextColor 
                }}
              >
                <span>{seg.lineName}</span>
                <span className="text-[10px] opacity-90">({seg.stationCount} stn)</span>
              </div>
              {idx < route.segments.length - 1 && (
                <ArrowRight className="w-3 h-3 text-neutral-400 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Why this route explanation pill */}
        <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-900 font-medium leading-relaxed">
            {route.whyThisRoute}
          </p>
        </div>

        {/* Interchange highlights if any */}
        {route.interchanges.length > 0 && (
          <div className="space-y-1 mb-2">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Interchange Hubs:
            </span>
            <div className="flex flex-wrap gap-2">
              {route.interchanges.map((inter, i) => (
                <div key={i} className="text-xs bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded-md font-medium border border-neutral-200">
                  <span className="font-semibold text-neutral-900">{inter.stationName}</span>
                  <span className="text-[10px] text-neutral-500 ml-1.5">
                    ({inter.fromLineName} → {inter.toLineName})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expand / Collapse station list */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between text-xs font-bold text-neutral-600 hover:text-black transition-colors"
        >
          <span>{isExpanded ? 'Hide Station Sequence' : `View Full Journey (${route.stationCount} Stations)`}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Station Sequence Timeline */}
      {isExpanded && (
        <div className="p-4 bg-neutral-50/80 border-t border-neutral-200 rounded-b-2xl animate-in fade-in duration-200">
          <div className="space-y-3">
            {route.segments.map((seg, segIdx) => (
              <div key={segIdx} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-3 h-3 rounded-full shrink-0" 
                    style={{ backgroundColor: seg.lineColor }} 
                  />
                  <span className="font-bold text-xs text-neutral-900">
                    {seg.lineName}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    ({seg.distance_km} km, ~{seg.travel_time_min} mins)
                  </span>
                </div>

                {/* Vertical stations timeline */}
                <div 
                  className="ml-1.5 pl-4 border-l-2 space-y-1.5 py-1"
                  style={{ borderColor: seg.lineColor }}
                >
                  {seg.stations.map((st, stIdx) => {
                    const isFirst = stIdx === 0;
                    const isLast = stIdx === seg.stations.length - 1;
                    const isInterchange = isLast && segIdx < route.segments.length - 1;

                    return (
                      <div key={st.id} className="flex items-center justify-between text-xs py-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isFirst || isLast ? 'bg-neutral-900 ring-2 ring-neutral-400' : 'bg-neutral-400'
                          }`} />
                          <span className={`${isFirst || isLast ? 'font-bold text-neutral-900' : 'text-neutral-600 font-medium'}`}>
                            {st.name}
                          </span>
                        </div>

                        {isInterchange && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                            Change Train Here
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
