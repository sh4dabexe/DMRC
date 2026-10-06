'use client';

import React, { useEffect, useState } from 'react';
import { Clock, ShieldCheck, Zap } from 'lucide-react';

interface HeaderProps {
  activeTab: 'planner' | 'map' | 'fares' | 'timings' | 'saved';
  setActiveTab: (tab: 'planner' | 'map' | 'fares' | 'timings' | 'saved') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [isPeak, setIsPeak] = useState<boolean>(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      const h = now.getHours();
      const peak = (h >= 8 && h < 12) || (h >= 17 && h < 21);
      setIsPeak(peak);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-[#E4E5E7] bg-white sticky top-0 z-30 px-4 md:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile Brand indicator */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-sm">
            MF
          </div>
          <div>
            <h1 className="font-bold text-sm text-neutral-900 leading-none">MetroFlow</h1>
            <span className="text-[10px] text-neutral-500 font-medium">Delhi-NCR</span>
          </div>
        </div>

        <div className="hidden md:block">
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
            {activeTab === 'planner' && 'Delhi Metro Journey Planner'}
            {activeTab === 'map' && 'Interactive Network Map'}
            {activeTab === 'fares' && 'Official DMRC Fare Slabs'}
            {activeTab === 'timings' && 'First & Last Metro Services'}
            {activeTab === 'saved' && 'Saved Commute Routes'}
          </h2>
          <p className="text-xs text-neutral-500 font-medium">
            {activeTab === 'map' 
              ? 'Explore 280+ stations, filter lines, search routes, or view official high-res schematics' 
              : 'Discover least-station paths & alternative interchange options'
            }
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Peak/Off-peak Badge */}
        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
          isPeak 
            ? 'bg-amber-50 text-amber-800 border-amber-200' 
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {isPeak ? <Zap className="w-3.5 h-3.5 text-amber-600" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
          <span>{isPeak ? 'Peak Hours Active' : 'Off-Peak Fare Eligible'}</span>
        </div>

        {/* Live Clock */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-100 border border-neutral-200 rounded-full text-xs font-medium text-neutral-700">
          <Clock className="w-3.5 h-3.5 text-neutral-500" />
          <span>{timeStr || '10:00 AM'}</span>
        </div>
      </div>
    </header>
  );
};
