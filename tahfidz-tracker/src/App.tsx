import React, { useState } from 'react';
import { TahfidzProvider, useTahfidz } from './context/TahfidzContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { AuthScreen } from './components/AuthScreen';
import { DashboardView } from './components/DashboardView';
import { HafalanView } from './components/HafalanView';
import { AbsensiView } from './components/AbsensiView';
import { TasmiView } from './components/TasmiView';
import { KelolaDataView } from './components/KelolaDataView';
import { AddHafalanModal } from './components/AddHafalanModal';
import { Megaphone, AlertTriangle, ShieldCheck, Wrench, ArrowRight, X, Phone } from 'lucide-react';

function MainAppContent() {
  const { 
    currentUser, 
    activeTab, 
    systemSettings, 
    updateSystemSettings, 
    originalSuperAdminUser, 
    stopImpersonation,
    logout 
  } = useTahfidz();
  const [isAddHafalanModalOpen, setIsAddHafalanModalOpen] = useState(false);
  const [isAnnouncementDismissed, setIsAnnouncementDismissed] = useState(false);

  React.useEffect(() => {
    setIsAnnouncementDismissed(false);
  }, [
    systemSettings.broadcastAnnouncement?.active,
    systemSettings.broadcastAnnouncement?.message,
    systemSettings.broadcastAnnouncement?.type,
    systemSettings.broadcastAnnouncement?.updatedAt
  ]);

  if (!currentUser) {
    return <AuthScreen />;
  }

  // Maintenance mode screen for regular non-superadmin users
  if (systemSettings.maintenanceMode && currentUser.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-300">
            <Wrench className="w-8 h-8 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
              Maintenance Mode
            </span>
            <h1 className="text-xl sm:text-2xl font-bold mt-3 text-white">
              Sistem Dalam Pemeliharaan
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
              {systemSettings.schoolName || 'Sistem Tahfidz Tracker'} sedang melakukan pemeliharaan dan optimasi basis data berkala. Harap kembali beberapa saat lagi.
            </p>
          </div>

          <div className="pt-2 space-y-2.5">
            {systemSettings.helpdeskWhatsapp && (
              <a
                href={`https://wa.me/${systemSettings.helpdeskWhatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg"
              >
                <Phone className="w-4 h-4" />
                Hubungi Helpdesk Madrasah
              </a>
            )}
            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl text-xs font-medium transition-colors"
            >
              Kembali ke Halaman Login Petugas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <Navbar />

      {/* Super Admin Maintenance Active Banner */}
      {currentUser.role === 'super_admin' && systemSettings.maintenanceMode && (
        <div className="bg-amber-600 dark:bg-amber-700 text-white px-4 py-2 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-200" />
              <span>
                <strong>Mode Pemeliharaan Aktif:</strong> Pengguna biasa (guru & wali) saat ini tidak dapat mengakses aplikasi.
              </span>
            </div>
            <button
              onClick={() => updateSystemSettings({ maintenanceMode: false })}
              className="px-2.5 py-1 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-lg text-[11px] transition-colors shrink-0"
            >
              Nonaktifkan Mode
            </button>
          </div>
        </div>
      )}

      {/* Broadcast Announcement Banner */}
      {systemSettings.broadcastAnnouncement.active && systemSettings.broadcastAnnouncement.message && !isAnnouncementDismissed && (
        <div className={`px-4 py-3 border-b text-xs sm:text-sm transition-all ${
          systemSettings.broadcastAnnouncement.type === 'warning'
            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/80 text-rose-900 dark:text-rose-200'
            : systemSettings.broadcastAnnouncement.type === 'announcement'
            ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/80 text-amber-900 dark:text-amber-200'
            : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/80 text-emerald-900 dark:text-emerald-200'
        }`}>
          <div className="max-w-7xl mx-auto flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              <Megaphone className={`w-4 h-4 shrink-0 mt-0.5 ${
                systemSettings.broadcastAnnouncement.type === 'warning' ? 'text-rose-600 dark:text-rose-400' : systemSettings.broadcastAnnouncement.type === 'announcement' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`} />
              <div className="font-medium leading-relaxed whitespace-pre-line break-words min-w-0 flex-1">
                <strong className="mr-1.5 uppercase font-bold text-[11px] sm:text-xs tracking-wide">
                  {systemSettings.broadcastAnnouncement.type === 'warning' ? 'Peringatan' : systemSettings.broadcastAnnouncement.type === 'announcement' ? 'Pengumuman' : 'Informasi'}:
                </strong>
                <span>{systemSettings.broadcastAnnouncement.message}</span>
              </div>
            </div>
            <button
              onClick={() => setIsAnnouncementDismissed(true)}
              className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors shrink-0 mt-0.5 cursor-pointer"
              title="Tutup pengumuman"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-12">
        {activeTab === 'dashboard' && (
          <DashboardView onOpenAddHafalan={() => setIsAddHafalanModalOpen(true)} />
        )}
        {activeTab === 'hafalan' && (
          <HafalanView />
        )}
        {activeTab === 'absensi' && (
          <AbsensiView />
        )}
        {activeTab === 'tasmi' && (
          <TasmiView />
        )}
        {activeTab === 'kelolaData' && currentUser.role !== 'parent' && (
          <KelolaDataView />
        )}
      </main>

      {/* Global Add Hafalan Modal */}
      <AddHafalanModal
        isOpen={isAddHafalanModalOpen}
        onClose={() => setIsAddHafalanModalOpen(false)}
      />

      {/* Impersonation Floating Sticky Bar */}
      {originalSuperAdminUser && (
        <div className="fixed bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-2xl border border-amber-400/50 flex items-center gap-3 text-xs animate-in slide-in-from-bottom duration-200 max-w-lg w-[90%] sm:w-auto">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="truncate">
              Sedang simulasi sebagai: <strong>{currentUser.name}</strong> ({currentUser.role})
            </span>
          </div>
          <button
            onClick={stopImpersonation}
            className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-full text-[11px] shrink-0 transition-colors flex items-center gap-1 shadow-sm"
          >
            <span>Kembali ke Super Admin</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      <BottomNav />

      {/* Quiet Footer */}
      <footer className="hidden md:block py-6 border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 text-center text-xs text-slate-400 dark:text-slate-500 transition-colors">
        <p>{systemSettings.schoolName || 'Tahfidz Tracker'} · Sistem Pencatatan & Evaluasi Hafalan Al-Qur'an Terpadu</p>
        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">بارك الله فيكم · Dibuat dengan penuh dedikasi untuk para penghafal Al-Qur'an</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <TahfidzProvider>
      <MainAppContent />
    </TahfidzProvider>
  );
}
