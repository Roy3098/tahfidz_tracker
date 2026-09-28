import React, { useState } from 'react';
import { 
  Printer, 
  X, 
  FileText, 
  Download, 
  Calendar, 
  Building2, 
  UserCheck, 
  Filter, 
  CheckCircle2,
  ExternalLink,
  Users
} from 'lucide-react';
import { Santri, Kelompok, User } from '../types';
import { generateMonthlyHafalanPdf } from '../utils/pdfReportGenerator';

interface CetakLaporanModalProps {
  isOpen: boolean;
  onClose: () => void;
  allSantri: Santri[];
  currentFilteredSantri: Santri[];
  groups: Kelompok[];
  currentUser?: User | null;
  activeGenderFilter: 'all' | 'santriwan' | 'santriwati';
  activeGroupFilter: string;
}

export const CetakLaporanModal: React.FC<CetakLaporanModalProps> = ({
  isOpen,
  onClose,
  allSantri,
  currentFilteredSantri,
  groups,
  currentUser,
  activeGenderFilter,
  activeGroupFilter
}) => {
  if (!isOpen) return null;

  // Month names in Indonesian
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const currentDate = new Date();
  const currentMonthIndex = currentDate.getMonth();

  // State
  const [selectedMonth, setSelectedMonth] = useState<string>(months[currentMonthIndex]);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [targetScope, setTargetScope] = useState<'current' | 'all' | 'santriwan' | 'santriwati' | 'custom_group'>('current');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.nama || 'Kelompok A');
  const [institutionName, setInstitutionName] = useState<string>('Pondok Pesantren & Rumah Tahfidz');
  const [teacherName, setTeacherName] = useState<string>(currentUser?.name || 'Ustadz Pembina');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Compute final student list based on selected scope
  const targetSantriList = React.useMemo(() => {
    switch (targetScope) {
      case 'current':
        return currentFilteredSantri.length > 0 ? currentFilteredSantri : allSantri;
      case 'all':
        return allSantri;
      case 'santriwan':
        return allSantri.filter(s => s.gender === 'santriwan');
      case 'santriwati':
        return allSantri.filter(s => s.gender === 'santriwati');
      case 'custom_group':
        return allSantri.filter(s => s.kelompokNama === selectedGroupId || s.kelompokId === selectedGroupId);
      default:
        return allSantri;
    }
  }, [targetScope, currentFilteredSantri, allSantri, selectedGroupId]);

  // Derive filter description for header
  const filterDescription = React.useMemo(() => {
    switch (targetScope) {
      case 'current':
        if (activeGroupFilter !== 'all') return `${activeGroupFilter} (${activeGenderFilter === 'all' ? 'Semua' : activeGenderFilter})`;
        if (activeGenderFilter !== 'all') return activeGenderFilter === 'santriwan' ? 'Semua Santriwan' : 'Semua Santriwati';
        return 'Semua Santri (Sesuai Filter Tampilan)';
      case 'all':
        return 'Seluruh Santri';
      case 'santriwan':
        return 'Khusus Santriwan (Putra)';
      case 'santriwati':
        return 'Khusus Santriwati (Putri)';
      case 'custom_group':
        return `Halaqah ${selectedGroupId}`;
      default:
        return 'Rekap Hafalan';
    }
  }, [targetScope, activeGroupFilter, activeGenderFilter, selectedGroupId]);

  // Metrics for preview
  const totalSantriCount = targetSantriList.length;
  const totalJuzMemorized = targetSantriList.reduce((acc, s) => acc + (s.totalJuzMemorized || 0), 0);
  const avgJuz = totalSantriCount > 0 ? (totalJuzMemorized / totalSantriCount).toFixed(1) : '0';

  const handleDownloadPdf = () => {
    if (targetSantriList.length === 0) return;
    setIsGenerating(true);
    setDownloadSuccess(false);

    try {
      const doc = generateMonthlyHafalanPdf({
        santriList: targetSantriList,
        institutionName,
        reportTitle: `REKAPITULASI HAFALAN SANTRI BULANAN`,
        monthName: selectedMonth,
        year: selectedYear,
        filterLabel: filterDescription,
        teacherName
      });

      const cleanMonth = selectedMonth.toLowerCase();
      const filename = `Laporan_Hafalan_${cleanMonth}_${selectedYear}_${Date.now().toString().slice(-4)}.pdf`;
      doc.save(filename);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Gagal mencetak PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenPrintPreview = () => {
    if (targetSantriList.length === 0) return;
    try {
      const doc = generateMonthlyHafalanPdf({
        santriList: targetSantriList,
        institutionName,
        reportTitle: `REKAPITULASI HAFALAN SANTRI BULANAN`,
        monthName: selectedMonth,
        year: selectedYear,
        filterLabel: filterDescription,
        teacherName
      });

      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error('Gagal membuka pratinjau PDF:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-white shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">
                Cetak Rekap Hafalan Bulanan
              </h3>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Unduh laporan berformat PDF resmi untuk arsip & wali santri
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          
          {/* Success Banner */}
          {downloadSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-xs sm:text-sm">Laporan Berhasil Diunduh!</p>
                <p className="text-[11px] text-emerald-700">Berkas PDF telah tersimpan di perangkat Anda.</p>
              </div>
            </div>
          )}

          {/* Cakupan Santri (Scope) */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cakupan Santri dalam Laporan</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetScope('current')}
                className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                  targetScope === 'current'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-500 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-[11px] text-slate-400">Filter Aktif</div>
                <div className="text-xs truncate font-semibold">Tampilan Saat Ini ({currentFilteredSantri.length})</div>
              </button>

              <button
                type="button"
                onClick={() => setTargetScope('all')}
                className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                  targetScope === 'all'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-500 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-[11px] text-slate-400">Semua</div>
                <div className="text-xs truncate font-semibold">Seluruh Santri ({allSantri.length})</div>
              </button>

              <button
                type="button"
                onClick={() => setTargetScope('santriwan')}
                className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                  targetScope === 'santriwan'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-500 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-[11px] text-slate-400">Gender</div>
                <div className="text-xs truncate font-semibold">Santriwan (Putra)</div>
              </button>

              <button
                type="button"
                onClick={() => setTargetScope('santriwati')}
                className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                  targetScope === 'santriwati'
                    ? 'border-rose-600 bg-rose-50/70 text-rose-900 ring-1 ring-rose-500 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-[11px] text-slate-400">Gender</div>
                <div className="text-xs truncate font-semibold">Santriwati (Putri)</div>
              </button>

              <button
                type="button"
                onClick={() => setTargetScope('custom_group')}
                className={`p-2.5 rounded-xl border text-left font-medium col-span-2 sm:col-span-2 transition-all ${
                  targetScope === 'custom_group'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-500 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-[11px] text-slate-400">Halaqah Spesifik</div>
                <div className="text-xs truncate font-semibold">Pilih Halaqah Tertentu</div>
              </button>
            </div>

            {targetScope === 'custom_group' && (
              <div className="mt-2 pt-2 border-t border-slate-100">
                <select
                  value={selectedGroupId}
                  onChange={e => setSelectedGroupId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.nama}>
                      {g.nama} (Pengajar: {g.pengajar})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Periode Laporan */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Bulan Pelaporan</span>
              </label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {months.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Tahun</span>
              </label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Header & Identitas Lembaga & Pembina */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Nama Lembaga / Pesantren</span>
              </label>
              <input
                type="text"
                value={institutionName}
                onChange={e => setInstitutionName(e.target.value)}
                placeholder="Nama Lembaga Tahfidz..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Nama Musyrif / Pembina (TTD)</span>
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={e => setTeacherName(e.target.value)}
                placeholder="Nama Pembina..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Ringkasan Dokumen Sebelum Cetak */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pratinjau Data Dokumen PDF:
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Jumlah Santri</span>
                <span className="text-sm sm:text-base font-bold text-slate-800">{totalSantriCount} Orang</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Total Capaian</span>
                <span className="text-sm sm:text-base font-bold text-emerald-700">{totalJuzMemorized.toFixed(1)} Juz</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Rata-Rata</span>
                <span className="text-sm sm:text-base font-bold text-blue-700">{avgJuz} Juz</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
              <FileText className="w-3 h-3 text-slate-400 shrink-0" />
              <span>
                Format tabel memuat: No, NIS, Nama, Halaqah, Target, Capaian Juz & Lembar, Progres %, dan Setoran Terakhir.
              </span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenPrintPreview}
              disabled={targetSantriList.length === 0}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-all disabled:opacity-50"
              title="Buka pratinjau di tab browser"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              <span>Pratinjau</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating || targetSantriList.length === 0}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Menyiapkan PDF...' : 'Unduh Laporan PDF'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
