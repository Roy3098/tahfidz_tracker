import React from 'react';
import { useTahfidz } from '../context/TahfidzContext';
import { BookOpen, LogOut, Cloud, RefreshCw } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, activeTab, setActiveTab, logout, cloudSyncStatus } = useTahfidz();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'hafalan', label: 'Hafalan' },
    { id: 'absensi', label: 'Absensi' },
    { id: 'tasmi', label: "Tasmi'" },
    ...(currentUser?.role !== 'parent' ? [{ id: 'kelolaData', label: 'Kelola Data' }] : [])
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single Brand Element */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className="flex items-center gap-2 sm:gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-lg p-0.5 sm:p-1 min-w-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-xs shrink-0">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 block leading-tight truncate">
                  Tahfidz Tracker
                </span>
                <span className="text-xs text-slate-500 font-medium hidden sm:block truncate">
                  Sistem Pencatatan Hafalan Al-Quran
                </span>
              </div>
            </button>

            {/* Cloud Real-Time Sync Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-slate-50 shrink-0">
              {cloudSyncStatus === 'synced' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <Cloud className="w-3.5 h-3.5" />
                    Cloud Aktif
                  </span>
                </>
              ) : cloudSyncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  <span className="text-blue-700 font-semibold">Sinkronisasi...</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-slate-600">Lokal</span>
                </>
              )}
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-emerald-800 bg-emerald-50/80 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Profile & Logout */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Profile badge */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-100/90 text-left border border-slate-200/60">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'TA'}
              </div>
              <div className="leading-tight hidden sm:block">
                <div className="text-xs font-semibold text-slate-900 truncate max-w-[120px] sm:max-w-[140px]">
                  {currentUser?.name}
                </div>
                <div className="text-[10px] sm:text-[11px] font-medium text-emerald-700 capitalize truncate">
                  {currentUser?.role === 'parent' ? `Wali ${currentUser.studentName || ''}` : currentUser?.role === 'admin' ? 'Administrator' : 'Ustadz / Guru'}
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              title="Keluar dari Akun"
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 text-xs font-semibold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-xl transition-all shadow-xs focus:outline-none"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
