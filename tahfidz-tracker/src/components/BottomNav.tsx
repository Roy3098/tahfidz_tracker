import React from 'react';
import { useTahfidz } from '../context/TahfidzContext';
import { LayoutDashboard, BookMarked, CalendarCheck, Award, Settings } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentUser, activeTab, setActiveTab } = useTahfidz();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'hafalan', label: 'Hafalan', icon: BookMarked },
    { id: 'absensi', label: 'Absensi', icon: CalendarCheck },
    { id: 'tasmi', label: "Tasmi'", icon: Award },
    ...(currentUser?.role !== 'parent' ? [{ id: 'kelolaData', label: 'Kelola', icon: Settings }] : [])
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around">
        {tabs.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-emerald-100/80 text-emerald-700' : 'text-slate-500'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] tracking-tight mt-0.5 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
