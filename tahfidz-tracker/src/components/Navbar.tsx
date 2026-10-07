import React, { useState, useRef, useEffect } from 'react';
import { useTahfidz } from '../context/TahfidzContext';
import { BookOpen, LogOut, Cloud, RefreshCw, Moon, Sun, User, Edit3, ChevronDown, Key, Users, Check } from 'lucide-react';
import { ProfileModal } from './ProfileModal';

export const Navbar: React.FC = () => {
  const { 
    currentUser, 
    activeTab, 
    setActiveTab, 
    logout, 
    cloudSyncStatus, 
    darkMode, 
    toggleDarkMode,
    switchParentActiveChild,
    parentChildren,
    systemSettings
  } = useTahfidz();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'view' | 'edit'>('view');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openProfile = (tab: 'view' | 'edit' = 'view') => {
    setProfileModalTab(tab);
    setIsProfileModalOpen(true);
    setIsDropdownOpen(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'hafalan', label: 'Hafalan' },
    { id: 'absensi', label: 'Absensi' },
    { id: 'tasmi', label: "Tasmi'" },
    ...(currentUser?.role !== 'parent' ? [{ id: 'kelolaData', label: 'Kelola Data' }] : [])
  ];

  return (
    <>
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
              <div className="min-w-0 max-w-[160px] sm:max-w-[260px] lg:max-w-[320px]">
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 block leading-tight truncate">
                  {systemSettings?.schoolName || 'Tahfidz Tracker'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block truncate">
                  {systemSettings?.academicYear
                    ? `T.A. ${systemSettings.academicYear} · Tahfidz Tracker`
                    : "Sistem Pencatatan Hafalan Al-Qur'an"}
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
            {/* Quick Child Switcher Pill for Parent with 2 or more children */}
            {currentUser?.role === 'parent' && parentChildren.length > 1 && (
              <div className="flex items-center gap-1 bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 rounded-xl px-2 py-1 shadow-2xs">
                <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 hidden sm:inline" />
                <span className="text-[10px] font-bold text-teal-900 dark:text-teal-200 hidden md:inline">Ananda:</span>
                <select
                  value={currentUser.studentId || ''}
                  onChange={e => switchParentActiveChild(e.target.value)}
                  className="bg-transparent text-teal-900 dark:text-teal-200 font-bold text-xs outline-none cursor-pointer max-w-[110px] sm:max-w-[150px] truncate"
                  title="Pilih santri ananda yang sedang dipantau"
                >
                  {parentChildren.map(c => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {c.nama} ({c.kelasNama})
                    </option>
                  ))}
                </select>
              </div>
            )}

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

            {/* Profile Dropdown & Badge */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-left border border-slate-200/70 dark:border-slate-700/80 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs cursor-pointer group"
                aria-expanded={isDropdownOpen}
                aria-label="Menu Profil Pengguna"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                  {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'TA'}
                </div>
                <div className="leading-tight hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[100px] sm:max-w-[120px]">
                    {currentUser?.name}
                  </div>
                  <div className={`text-[10px] sm:text-[11px] font-semibold truncate ${currentUser?.role === 'super_admin' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                    {currentUser?.role === 'super_admin' ? '👑 Super Admin' : currentUser?.role === 'parent' ? `Wali ${currentUser.studentName || ''}` : currentUser?.role === 'admin' ? 'Administrator' : 'Ustadz / Guru'}
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* User Header Preview */}
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {currentUser?.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {currentUser?.username ? `@${currentUser.username}` : currentUser?.email}
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                      {currentUser?.role === 'super_admin' ? '👑 Super Admin' : currentUser?.role === 'parent' ? '👨‍👩‍👧 Wali Santri' : currentUser?.role === 'admin' ? '🏛️ Administrator' : '🎓 Guru / Ustadz'}
                    </span>
                    {systemSettings?.schoolName && (
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                        <div className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                          {systemSettings.schoolName}
                        </div>
                        {systemSettings.schoolLeader && (
                          <div className="truncate">Mudir: {systemSettings.schoolLeader}</div>
                        )}
                        {systemSettings.academicYear && (
                          <div className="truncate">T.A: {systemSettings.academicYear}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Menu Links */}
                  <div className="p-1 space-y-0.5">
                    {/* Multi-Children Selector inside Menu */}
                    {currentUser?.role === 'parent' && parentChildren.length > 1 && (
                      <div className="p-2 bg-teal-50/70 dark:bg-teal-950/40 rounded-xl mb-1.5 border border-teal-200/60 dark:border-teal-800/60">
                        <div className="text-[10px] font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                            <span>Pilih Ananda ({parentChildren.length})</span>
                          </span>
                          <span className="text-[9px] font-medium text-teal-600 dark:text-teal-400">Ganti fokus</span>
                        </div>
                        <div className="space-y-1">
                          {parentChildren.map(c => {
                            const isCurrent = c.id === currentUser.studentId;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  switchParentActiveChild(c.id);
                                  setIsDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                  isCurrent
                                    ? 'bg-teal-600 text-white shadow-2xs font-bold'
                                    : 'hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <span className="truncate">{c.nama} ({c.kelasNama})</span>
                                {isCurrent && <Check className="w-3.5 h-3.5 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => openProfile('view')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                    >
                      <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <div>Lihat Profil</div>
                        <span className="text-[10px] text-slate-400 block font-normal">Informasi akun & santri</span>
                      </div>
                    </button>

                    <button
                      onClick={() => openProfile('edit')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                    >
                      <Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <div>
                        <div>Edit Profil</div>
                        <span className="text-[10px] text-slate-400 block font-normal">Ubah nama, kontak & sandi</span>
                      </div>
                    </button>
                  </div>

                  {/* Logout item inside dropdown */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1 p-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar dari Akun</span>
                    </button>
                  </div>
                </div>
              )}
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

    {/* Profile Modal - rendered outside header to avoid sticky/backdrop-blur clipping */}
    <ProfileModal
      isOpen={isProfileModalOpen}
      onClose={() => setIsProfileModalOpen(false)}
      initialTab={profileModalTab}
    />
  </>
  );
};
