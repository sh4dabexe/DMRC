'use client';

import React from 'react';
import { Bookmark, Trash2, ArrowRight, X, ExternalLink } from 'lucide-react';
import { MetroRoute } from '@/engine/types';

interface SavedTripItem {
  id: string;
  fromName: string;
  toName: string;
  fromId: string;
  toId: string;
  route: MetroRoute;
  savedAt: string;
}

interface SavedTripsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedTrips: SavedTripItem[];
  onRemoveTrip: (id: string) => void;
  onLoadTrip: (fromId: string, toId: string) => void;
}

export const SavedTripsModal: React.FC<SavedTripsModalProps> = ({
  isOpen,
  onClose,
  savedTrips,
  onRemoveTrip,
  onLoadTrip
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[#E4E5E7] shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
              <Bookmark className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">Saved Trips</h3>
              <p className="text-xs text-neutral-500">Your bookmarked journeys for 1-click recalculation</p>
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

        {savedTrips.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-neutral-100 mx-auto flex items-center justify-center text-neutral-400">
              <Bookmark className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-neutral-800">No saved trips yet</p>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              Click the bookmark icon on any route card in your search results to save it here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {savedTrips.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-neutral-50 hover:bg-neutral-100/70 border border-neutral-200 rounded-2xl flex items-center justify-between transition-all"
              >
                <div 
                  className="cursor-pointer space-y-1 flex-1"
                  onClick={() => {
                    onLoadTrip(item.fromId, item.toId);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-neutral-900">
                    <span>{item.fromName}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{item.toName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                    <span>{item.route.stationCount} stations</span>
                    <span>•</span>
                    <span>{item.route.interchangeCount} changes</span>
                    <span>•</span>
                    <span className="font-semibold text-neutral-800">₹{item.route.fare.tokenFare}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    type="button"
                    onClick={() => {
                      onLoadTrip(item.fromId, item.toId);
                      onClose();
                    }}
                    className="p-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold"
                    title="Plan this trip"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveTrip(item.id)}
                    className="p-2 rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete saved trip"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
