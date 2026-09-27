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

function MainAppContent() {
  const { currentUser, activeTab } = useTahfidz();
  const [isAddHafalanModalOpen, setIsAddHafalanModalOpen] = useState(false);

  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
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

      <BottomNav />

      {/* Quiet Footer */}
      <footer className="hidden md:block py-6 border-t border-slate-200/80 bg-white text-center text-xs text-slate-400">
        <p>Tahfidz Tracker · Sistem Pencatatan & Evaluasi Hafalan Al-Qur'an Terpadu</p>
        <p className="mt-1 text-[11px] text-slate-400">بارك الله فيكم · Dibuat dengan penuh dedikasi untuk para penghafal Al-Qur'an</p>
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
