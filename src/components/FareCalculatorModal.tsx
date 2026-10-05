'use client';

import React, { useState } from 'react';
import { CreditCard, Calendar, Clock, Check, Sparkles, X } from 'lucide-react';
import faresData from '@/data/fares.json';
import { calculateFare } from '@/engine/fare';

interface FareCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FareCalculatorModal: React.FC<FareCalculatorModalProps> = ({ isOpen, onClose }) => {
  const [distanceKm, setDistanceKm] = useState(18);
  const [isSunday, setIsSunday] = useState(false);
  const [departureTime, setDepartureTime] = useState('14:00');

  if (!isOpen) return null;

  const fareResult = calculateFare(distanceKm, {
    isSundayOrHoliday: isSunday,
    departureTime
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[#E4E5E7] shadow-xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">DMRC Official Fare Engine</h3>
              <p className="text-xs text-neutral-500">Distance-based slabs and Smart Card policies</p>
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

        {/* Distance Slider Input */}
        <div className="space-y-2 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-neutral-600">Journey Distance</span>
            <span className="font-bold text-base text-neutral-900">{distanceKm} km</span>
          </div>
          <input
            type="range"
            min="1"
            max="45"
            step="0.5"
            value={distanceKm}
            onChange={(e) => setDistanceKm(Number(e.target.value))}
            className="w-full accent-black cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-400">
            <span>0 km</span>
            <span>12 km</span>
            <span>21 km</span>
            <span>32 km</span>
            <span>45+ km</span>
          </div>
        </div>

        {/* Day & Time Options */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setIsSunday(!isSunday)}
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
              isSunday ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-neutral-50 border-neutral-200 text-neutral-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{isSunday ? 'Sunday Special' : 'Monday - Saturday'}</span>
            </div>
            {isSunday && <Check className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center gap-2 p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700">
            <Clock className="w-4 h-4 text-neutral-500" />
            <span className="text-neutral-500">Time:</span>
            <input
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="bg-transparent text-xs font-semibold text-neutral-900 focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Calculated Results Box */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-neutral-900 text-white space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400">Token / QR Fare</span>
            <div className="text-2xl font-black">₹{fareResult.tokenFare}</div>
            <p className="text-[11px] text-neutral-400">Slab: {fareResult.slabApplied}</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-700">Smart Card Fare</span>
              <span className="text-[10px] font-bold bg-emerald-200/70 text-emerald-800 px-1.5 py-0.5 rounded">
                Save {fareResult.discountAppliedPercent}%
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-950">₹{fareResult.smartCardFare}</div>
            <p className="text-[11px] text-emerald-700">
              {fareResult.isOffPeak ? 'Weekday Off-Peak (20% off)' : 'Standard Discount (10% off)'}
            </p>
          </div>
        </div>

        {/* Official Slabs Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Distance and Day-Based Fare Slabs
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Minimum Distance Rule
            </span>
          </div>
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-100 text-neutral-700 font-semibold text-[11px]">
                <tr>
                  <th className="py-2 px-3">Distance Slab</th>
                  <th className="py-2 px-3">Monday to Saturday Fare</th>
                  <th className="py-2 px-3">Sunday & National Holiday Fare</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                <tr className="hover:bg-neutral-50/50">
                  <td className="py-2 px-3 font-medium text-neutral-800">0 to 2 km</td>
                  <td className="py-2 px-3 font-bold text-neutral-900">₹11</td>
                  <td className="py-2 px-3 text-emerald-700 font-semibold">₹11</td>
                </tr>
                <tr className="hover:bg-neutral-50/50">
                  <td className="py-2 px-3 font-medium text-neutral-800">2 to 5 km</td>
                  <td className="py-2 px-3 font-bold text-neutral-900">₹21</td>
                  <td className="py-2 px-3 text-emerald-700 font-semibold">₹11</td>
                </tr>
                <tr className="hover:bg-neutral-50/50">
                  <td className="py-2 px-3 font-medium text-neutral-800">5 to 12 km</td>
                  <td className="py-2 px-3 font-bold text-neutral-900">₹32</td>
                  <td className="py-2 px-3 text-emerald-700 font-semibold">₹21</td>
                </tr>
                <tr className="hover:bg-neutral-50/50">
                  <td className="py-2 px-3 font-medium text-neutral-800">12 to 21 km</td>
                  <td className="py-2 px-3 font-bold text-neutral-900">₹43</td>
                  <td className="py-2 px-3 text-emerald-700 font-semibold">₹32</td>
                </tr>
                <tr className="hover:bg-neutral-50/50">
                  <td className="py-2 px-3 font-medium text-neutral-800">21 to 32 km</td>
                  <td className="py-2 px-3 font-bold text-neutral-900">₹54</td>
                  <td className="py-2 px-3 text-emerald-700 font-semibold">₹43</td>
                </tr>
                <tr className="hover:bg-neutral-50/50">
                  <td className="py-2 px-3 font-medium text-neutral-800">Beyond 32 km</td>
                  <td className="py-2 px-3 font-bold text-neutral-900">₹64</td>
                  <td className="py-2 px-3 text-emerald-700 font-semibold">₹54</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-neutral-500 italic">
            * DMRC Rule: Journey fare is always calculated on the basis of minimum distance between stations.
          </p>
        </div>
      </div>
    </div>
  );
};
