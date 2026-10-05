'use client';

import React from 'react';
import { 
  Navigation, 
  Map as MapIcon, 
  CreditCard, 
  Clock, 
  Bookmark, 
  Sparkles,
  Info,
  TrainFront
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'planner' | 'map' | 'fares' | 'timings' | 'saved';
  setActiveTab: (tab: 'planner' | 'map' | 'fares' | 'timings' | 'saved') => void;
  savedTripsCount: number;
  onOpenAiAssistant?: () => void;
}

interface NavItem {
  id: 'planner' | 'map' | 'fares' | 'timings' | 'saved';
  label: string;
  icon: any;
  badge?: number | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  savedTripsCount,
  onOpenAiAssistant
}) => {
  const navItems: NavItem[] = [
    { id: 'planner', label: 'Route Planner', icon: Navigation },
    { id: 'map', label: 'Interactive Map', icon: MapIcon },
    { id: 'fares', label: 'Fare Calculator', icon: CreditCard },
    { id: 'timings', label: 'First & Last Train', icon: Clock },
    { id: 'saved', label: 'Saved Trips', icon: Bookmark, badge: savedTripsCount > 0 ? savedTripsCount : null },
  ];

  return (
    <aside className="w-64 border-r border-[#E4E5E7] bg-white flex flex-col justify-between h-screen shrink-0 sticky top-0 hidden md:flex">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-[#E4E5E7] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-black to-neutral-800 flex items-center justify-center text-white shadow-sm">
              <TrainFront className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-neutral-900 tracking-tight">MetroFlow</span>
                <span className="text-[10px] uppercase font-semibold bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded border border-neutral-200">
                  DMRC
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 font-medium">Plan smarter. Change less.</p>
            </div>
          </div>
        </div>

        {/* AI Assistant Quick Banner */}
        {onOpenAiAssistant && (
          <div className="px-3 pt-3">
            <button
              type="button"
              onClick={onOpenAiAssistant}
              className="w-full p-2.5 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border border-purple-200/80 flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-950">AI Journey Helper</div>
                  <div className="text-[10px] text-purple-700 font-medium">Hinglish / Natural intent</div>
                </div>
              </div>
              <span className="text-xs text-purple-400 group-hover:text-purple-700 transition-colors">→</span>
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-sm font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white text-black' : 'bg-neutral-200 text-neutral-800'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Verification Status */}
      <div className="p-4 border-t border-[#E4E5E7] bg-neutral-50/50 space-y-3">
        <div className="p-3 rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Network Operational</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            Official DMRC 2026 Fare Slabs & Timing verified
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-400 font-medium px-1">
          <span>v2026.10.1</span>
          <div className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            <span>Multi-Route SaaS</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
