import React from 'react';
import { useTahfidz } from '../context/TahfidzContext';
import { BookOpen, LogOut, Cloud, RefreshCw, Moon, Sun } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, activeTab, setActiveTab, logout, cloudSyncStatus, darkMode, toggleDarkMode } = useTahfidz();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'hafalan', label: 'Hafalan' },
    { id: 'absensi', label: 'Absensi' },
    { id: 'tasmi', label: "Tasmi'" },
    ...(currentUser?.role !== 'parent' ? [{ id: 'kelolaData', label: 'Kelola Data' }] : [])
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single Brand Element */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className="flex items-center gap-2 sm:gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-lg p-0.5 sm:p-1 min-w-0 group"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 block leading-tight truncate">
                  Tahfidz Tracker
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block truncate">
                  Sistem Pencatatan Hafalan Al-Qur'an
                </span>
              </div>
            </button>

            {/* Cloud Real-Time Sync Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shrink-0">
              {cloudSyncStatus === 'synced' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Cloud className="w-3.5 h-3.5" />
                    Cloud Aktif
                  </span>
                </>
              ) : cloudSyncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="text-blue-700 dark:text-blue-400 font-semibold">Sinkronisasi...</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-slate-600 dark:text-slate-400">Lokal</span>
                </>
              )}
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3.5 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
                    isActive
                      ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/60 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/70'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Dark Mode, Profile & Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Dark Mode Toggle Button */}
            <button
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Malam'}
              title={darkMode ? 'Mode Malam Aktif (Klik untuk Mode Terang)' : 'Mode Terang Aktif (Klik untuk Mode Malam)'}
              className="p-2 sm:px-2.5 sm:py-2 text-xs font-medium rounded-xl border transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-100/90 hover:bg-slate-200/90 text-slate-700 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-amber-300 dark:border-slate-700 shadow-xs"
            >
              {darkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden xl:inline text-[11px] font-semibold text-slate-200">Terang</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-700" />
                  <span className="hidden xl:inline text-[11px] font-semibold text-slate-700">Malam</span>
                </>
              )}
            </button>

            {/* Profile badge */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 text-left border border-slate-200/70 dark:border-slate-700/80">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'TA'}
              </div>
              <div className="leading-tight hidden sm:block">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[110px] sm:max-w-[130px]">
                  {currentUser?.name}
                </div>
                <div className={`text-[10px] sm:text-[11px] font-semibold truncate ${currentUser?.role === 'super_admin' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                  {currentUser?.role === 'super_admin' ? '👑 Super Admin' : currentUser?.role === 'parent' ? `Wali ${currentUser.studentName || ''}` : currentUser?.role === 'admin' ? 'Administrator' : 'Ustadz / Guru'}
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              title="Keluar dari Akun"
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-white dark:hover:text-white bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 dark:hover:bg-rose-600 border border-rose-200/60 dark:border-rose-900/60 rounded-xl transition-all shadow-xs focus:outline-none"
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
