import React, { useState } from 'react';
import { useTahfidz } from '../context/TahfidzContext';
import { 
  Plus, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  BookOpen, 
  CheckCircle2, 
  UserCheck, 
  Calendar,
  Layers,
  Sparkles,
  Trash2,
  MessageSquare,
  AlertTriangle,
  SlidersHorizontal,
  Bookmark,
  Hash,
  Check,
  Printer,
  Target,
  Award,
  FileText
} from 'lucide-react';
import { Santri, HafalanEntry } from '../types';
import { parseHafalan, formatRemainingTarget } from '../utils/hafalanFormat';
import { getStudentQuranProgress } from '../utils/studentQuranProgress';
import { EditHafalanModal } from './EditHafalanModal';
import { AddHafalanModal } from './AddHafalanModal';
import { EditSingleHafalanModal } from './EditSingleHafalanModal';
import { DirectEditHafalanModal } from './DirectEditHafalanModal';
import { StudentQuranDetailModal } from './StudentQuranDetailModal';
import { EditKeteranganHafalanModal } from './EditKeteranganHafalanModal';
import { CetakLaporanModal } from './CetakLaporanModal';

export const HafalanView: React.FC = () => {
  const { santriList, groups, currentUser, updateHafalanRecord, deleteHafalanRecord } = useTahfidz();

  const [genderFilter, setGenderFilter] = useState<'all' | 'santriwan' | 'santriwati'>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Expandable accordions state for setoran history
  const [expandedStudentIds, setExpandedStudentIds] = useState<Record<string, boolean>>({});

  // Expandable state for Keterangan Juz & Surat dropdown on cards
  const [expandedQuranDetailsIds, setExpandedQuranDetailsIds] = useState<Record<string, boolean>>({});

  // Modals state
  const [isCetakModalOpen, setIsCetakModalOpen] = useState(false);
  const [selectedStudentForQuranDetail, setSelectedStudentForQuranDetail] = useState<Santri | null>(null);
  const [selectedStudentForEditKeterangan, setSelectedStudentForEditKeterangan] = useState<Santri | null>(null);
  const [selectedStudentForDirectEdit, setSelectedStudentForDirectEdit] = useState<Santri | null>(null);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<Santri | null>(null);
  const [selectedStudentForAdd, setSelectedStudentForAdd] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<{ student: Santri; record: HafalanEntry } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setExpandedStudentIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleQuranDetails = (id: string) => {
    setExpandedQuranDetailsIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Filter students (Tanpa filter perjuz dan tanpa filter mode)
  const filteredStudents = santriList.filter(student => {
    if (genderFilter !== 'all' && student.gender !== genderFilter) return false;
    if (groupFilter !== 'all' && student.kelompokNama !== groupFilter && student.kelompokId !== groupFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = student.nama.toLowerCase().includes(q);
      const matchClass = student.kelasNama.toLowerCase().includes(q);
      const matchGroup = student.kelompokNama.toLowerCase().includes(q);
      const prog = getStudentQuranProgress(student);
      const matchSurah = prog.memorizedSurahs.some(s => s.name.toLowerCase().includes(q));
      if (!matchName && !matchClass && !matchGroup && !matchSurah) return false;
    }
    return true;
  });

  // Calculate comprehensive summary metrics for top progress card
  const summaryData = React.useMemo(() => {
    const totalSantri = santriList.length;
    const totalTargetJuz = santriList.reduce((acc, s) => acc + (s.targetJuz || 1), 0);
    const totalAchievedJuz = santriList.reduce((acc, s) => acc + (s.totalJuzMemorized || 0), 0);
    const totalProgressPercent = totalTargetJuz > 0 
      ? Math.min(100, Math.round((totalAchievedJuz / totalTargetJuz) * 100)) 
      : 0;
    
    const totalLembar = Math.round(totalAchievedJuz * 10);
    const totalHalaman = totalLembar * 2;
    const avgJuz = totalSantri > 0 ? (totalAchievedJuz / totalSantri).toFixed(1) : '0';

    const achievedCount = santriList.filter(s => (s.totalJuzMemorized || 0) >= (s.targetJuz || 1)).length;
    const inProgressCount = totalSantri - achievedCount;

    const santriwan = santriList.filter(s => s.gender === 'santriwan');
    const santriwati = santriList.filter(s => s.gender === 'santriwati');
    const totalJuzSantriwan = santriwan.reduce((acc, s) => acc + (s.totalJuzMemorized || 0), 0);
    const totalJuzSantriwati = santriwati.reduce((acc, s) => acc + (s.totalJuzMemorized || 0), 0);

    const isFilterActive = genderFilter !== 'all' || groupFilter !== 'all' || searchQuery.trim().length > 0;
    const filteredTargetJuz = filteredStudents.reduce((acc, s) => acc + (s.targetJuz || 1), 0);
    const filteredAchievedJuz = filteredStudents.reduce((acc, s) => acc + (s.totalJuzMemorized || 0), 0);
    const filteredProgressPercent = filteredTargetJuz > 0
      ? Math.min(100, Math.round((filteredAchievedJuz / filteredTargetJuz) * 100))
      : 0;

    return {
      totalSantri,
      totalTargetJuz,
      totalAchievedJuz,
      totalProgressPercent,
      totalLembar,
      totalHalaman,
      avgJuz,
      achievedCount,
      inProgressCount,
      santriwanCount: santriwan.length,
      santriwatiCount: santriwati.length,
      totalJuzSantriwan,
      totalJuzSantriwati,
      isFilterActive,
      filteredTargetJuz,
      filteredAchievedJuz,
      filteredProgressPercent
    };
  }, [santriList, filteredStudents, genderFilter, groupFilter, searchQuery]);

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4 text-emerald-700" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              Data Hafalan Santri
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitoring capaian detail desimal (1.2 Juz) dan hitungan lembar/halaman Al-Qur'an
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Cetak Laporan PDF */}
          <button
            onClick={() => setIsCetakModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 active:scale-[0.98] rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-all"
            title="Cetak Rekap Hafalan Bulanan PDF"
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            <span>Cetak Laporan</span>
          </button>

          {currentUser?.role !== 'parent' && (
            <button
              onClick={() => {
                setSelectedStudentForAdd(santriList[0]?.id || null);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Hafalan</span>
            </button>
          )}
        </div>
      </div>

      {/* SUMMARY CARD DENGAN PROGRESS BAR VISUAL TARGET JUZ TOTAL */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-4 sm:p-6 shadow-md border border-emerald-700/50 relative overflow-hidden">
        {/* Decorative backdrop shapes */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-8 bottom-3 text-white/5 font-arabic text-7xl select-none pointer-events-none hidden md:block">
          الْقُرْآن
        </div>

        <div className="relative z-10 space-y-4 sm:space-y-5">
          {/* Card Top Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-inner">
                <Target className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base sm:text-lg tracking-tight text-white">
                    Ringkasan Capaian Hafalan Santri
                  </h3>
                  <span className="text-[10px] font-semibold bg-emerald-400/20 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                    {summaryData.totalSantri} Santri
                  </span>
                </div>
                <p className="text-xs text-emerald-100/80 mt-0.5">
                  Progres akumulasi seluruh hafalan terhadap total target lembaga ({summaryData.totalTargetJuz} Juz)
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCetakModalOpen(true)}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700/60 hover:bg-emerald-700 text-white border border-emerald-500/40 rounded-xl text-xs font-semibold transition-all shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-200" />
              <span>Unduh Rekap PDF</span>
            </button>
          </div>

          {/* Visual Progress Bar Section */}
          <div className="bg-black/20 backdrop-blur-xs p-3.5 sm:p-5 rounded-2xl border border-white/10 space-y-3">
            {/* Numbers & Ratio Row */}
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="text-[11px] sm:text-xs text-emerald-200/90 font-medium block">
                  Total Capaian Hafalan:
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums">
                    {summaryData.totalAchievedJuz.toFixed(1)}
                  </span>
                  <span className="text-sm sm:text-base text-emerald-200/90 font-medium">
                    / {summaryData.totalTargetJuz} Juz Total Target
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-400/20 border border-emerald-400/30 text-emerald-200 font-bold text-sm sm:text-base">
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>{summaryData.totalProgressPercent}% Tercapai</span>
                </div>
                <span className="text-[11px] text-emerald-100/70 block mt-1">
                  {summaryData.totalLembar} Lembar ({summaryData.totalHalaman} Halaman)
                </span>
              </div>
            </div>

            {/* Visual Progress Bar Track */}
            <div className="space-y-1.5">
              <div className="w-full bg-white/15 rounded-full h-4 sm:h-5 p-0.5 overflow-hidden shadow-inner relative">
                <div 
                  className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300 h-full rounded-full transition-all duration-700 relative overflow-hidden flex items-center justify-end pr-2"
                  style={{ width: `${Math.max(4, summaryData.totalProgressPercent)}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  {summaryData.totalProgressPercent >= 12 && (
                    <span className="text-[10px] font-bold text-emerald-950 tabular-nums">
                      {summaryData.totalProgressPercent}%
                    </span>
                  )}
                </div>
              </div>

              {/* Milestone Markers */}
              <div className="flex justify-between text-[10px] text-emerald-200/70 font-semibold px-0.5">
                <span>0 Juz</span>
                <span>25% ({Math.round(summaryData.totalTargetJuz * 0.25)} Juz)</span>
                <span>50% ({Math.round(summaryData.totalTargetJuz * 0.5)} Juz)</span>
                <span>75% ({Math.round(summaryData.totalTargetJuz * 0.75)} Juz)</span>
                <span>100% ({summaryData.totalTargetJuz} Juz)</span>
              </div>
            </div>

            {/* Filtered Subset notice if active */}
            {summaryData.isFilterActive && (
              <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-200/90">
                <span>
                  Filter Aktif ({filteredStudents.length} santri): <strong>{summaryData.filteredAchievedJuz.toFixed(1)} Juz</strong> ({summaryData.filteredProgressPercent}% target kelompok)
                </span>
                <button 
                  type="button"
                  onClick={() => { setGenderFilter('all'); setGroupFilter('all'); setSearchQuery(''); }}
                  className="text-[11px] text-emerald-300 hover:text-white font-semibold underline"
                >
                  Tampilkan Semua ({summaryData.totalSantri})
                </button>
              </div>
            )}
          </div>

          {/* 4 Mini KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
              <span className="text-[11px] text-emerald-200/80 font-medium block">Target Tuntas</span>
              <span className="text-base sm:text-lg font-bold text-white tabular-nums">
                {summaryData.achievedCount} <span className="text-xs font-normal text-emerald-200">/ {summaryData.totalSantri} Santri</span>
              </span>
              <span className="text-[10px] text-emerald-300 font-medium block mt-0.5">
                {summaryData.totalSantri > 0 ? Math.round((summaryData.achievedCount / summaryData.totalSantri) * 100) : 0}% santri tuntas target
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
              <span className="text-[11px] text-emerald-200/80 font-medium block">Rata-Rata Capaian</span>
              <span className="text-base sm:text-lg font-bold text-white tabular-nums">
                {summaryData.avgJuz} <span className="text-xs font-normal text-emerald-200">Juz/Santri</span>
              </span>
              <span className="text-[10px] text-emerald-300 font-medium block mt-0.5">
                ~{Math.round(Number(summaryData.avgJuz) * 10)} Lembar / santri
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
              <span className="text-[11px] text-emerald-200/80 font-medium block">Santriwan (Putra)</span>
              <span className="text-base sm:text-lg font-bold text-white tabular-nums">
                {summaryData.totalJuzSantriwan.toFixed(1)} <span className="text-xs font-normal text-emerald-200">Juz</span>
              </span>
              <span className="text-[10px] text-blue-200 font-medium block mt-0.5">
                {summaryData.santriwanCount} santriwan aktif
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
              <span className="text-[11px] text-emerald-200/80 font-medium block">Santriwati (Putri)</span>
              <span className="text-base sm:text-lg font-bold text-white tabular-nums">
                {summaryData.totalJuzSantriwati.toFixed(1)} <span className="text-xs font-normal text-emerald-200">Juz</span>
              </span>
              <span className="text-[10px] text-rose-200 font-medium block mt-0.5">
                {summaryData.santriwatiCount} santriwati aktif
              </span>
            </div>
          </div>

          {/* Kotak Panduan Penjelasan Ramah Guru & Orang Tua */}
          <div className="bg-emerald-950/50 backdrop-blur-xs border border-emerald-500/30 rounded-2xl p-3.5 text-xs text-emerald-100 space-y-2">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
              <div className="space-y-1 text-left">
                <p className="font-medium leading-relaxed">
                  <strong>Ringkasan untuk Guru & Wali Santri:</strong> Akumulasi hafalan seluruh santri saat ini telah mencapai <strong className="text-white font-bold">{summaryData.totalAchievedJuz.toFixed(1)} Juz</strong> (setara <strong>{summaryData.totalLembar} lembar</strong> atau <strong>{summaryData.totalHalaman} halaman</strong> Al-Qur'an mushaf standar) dari target gabungan lembaga <strong>{summaryData.totalTargetJuz} Juz</strong>.
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-emerald-200/90 pt-1 border-t border-emerald-800/60">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    <strong>{summaryData.achievedCount} Santri</strong> tuntas target penuh
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-300 inline-block" />
                    <strong>{summaryData.inProgressCount} Santri</strong> aktif menambah hafalan
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-300 inline-block" />
                    Rata-rata capaian: <strong>{summaryData.avgJuz} Juz / santri</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar - Rapi, Bersih & Responsif */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        
        {/* Row 1: Search Input & Category/Gender Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama santri, kelas, halaqah, atau surat..."
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Gender Filter Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs shrink-0 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setGenderFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                genderFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({santriList.length})
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('santriwan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                genderFilter === 'santriwan'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Santriwan
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('santriwati')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                genderFilter === 'santriwati'
                  ? 'bg-white text-rose-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Santriwati
            </button>
          </div>
        </div>

        {/* Row 2: Halaqah Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none pt-2 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 font-semibold mr-1 shrink-0">Halaqah:</span>
          <button
            type="button"
            onClick={() => setGroupFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              groupFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Halaqah
          </button>
          {groups.map(grp => (
            <button
              key={grp.id}
              type="button"
              onClick={() => setGroupFilter(grp.nama)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                groupFilter === grp.nama
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {grp.nama}
            </button>
          ))}
        </div>

        {/* Notice Info on Quran Scale */}
        <div className="px-3 py-2 bg-emerald-50/70 border border-emerald-200/70 rounded-xl text-[11px] text-emerald-950 flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>
              <strong>Rujukan Standar Al-Qur'an:</strong> 1 Juz = 10 Lembar = 20 Halaman (0.1 Juz = 1 Lembar / 2 Halaman).
            </span>
          </div>
          <span className="text-emerald-700 font-semibold hidden md:inline">
            1.2 Juz = 1 Juz 2 Lembar (4 Halaman)
          </span>
        </div>

      </div>

      {/* Student Cards List */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8">
          <p className="text-slate-500 text-sm">Tidak ada santri yang sesuai dengan filter pencarian.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {filteredStudents.map(student => {
            const isExpanded = !!expandedStudentIds[student.id];
            const isMale = student.gender === 'santriwan';
            const breakdown = parseHafalan(student.totalJuzMemorized);
            const quranProgress = getStudentQuranProgress(student);
            const targetJuzNum = student.targetJuz || 1;
            const targetPercent = Math.min(100, Math.round((breakdown.decimalJuz / targetJuzNum) * 100));
            const quranPercent = Math.round((breakdown.decimalJuz / 30) * 100);

            return (
              <div 
                key={student.id} 
                className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Responsive for Mobile */}
                  <div className="flex items-start justify-between gap-2.5 mb-3">
                    
                    {/* Left: Avatar & Identity */}
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 shadow-xs ${
                        isMale ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {student.nama.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate">
                          {student.nama}
                        </h3>
                        <div className="text-[11px] sm:text-xs text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span>{student.kelasNama}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{student.kelompokNama}</span>
                          <span aria-hidden="true">·</span>
                          <span className={isMale ? 'text-blue-600 font-medium' : 'text-rose-600 font-medium'}>
                            {isMale ? 'Santriwan' : 'Santriwati'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Hafalan Decimal & Lembar Display with Edit Trigger */}
                    <div className="text-right shrink-0">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="text-right leading-tight">
                          <span className="text-base sm:text-lg font-bold text-emerald-700 tabular-nums block">
                            {breakdown.decimalText} Juz
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-800 block -mt-0.5">
                            {breakdown.lembarText}
                          </span>
                        </div>

                        {currentUser?.role !== 'parent' && (
                          <button
                            type="button"
                            onClick={() => setSelectedStudentForDirectEdit(student)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors ml-0.5"
                            title="Edit Capaian Hafalan (Bisa input desimal atau lembar)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block mt-0.5">
                        {quranPercent}% dari 30 Juz
                      </span>
                    </div>
                  </div>

                  {/* Detailed Progress Bar Container */}
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 mb-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-700">
                      <span className="font-medium text-slate-600">
                        Target {student.targetJuz} Juz
                      </span>
                      <div className="flex items-center gap-1 text-right">
                        <span className="font-bold text-emerald-800 tabular-nums">
                          {breakdown.decimalText} / {student.targetJuz} Juz
                        </span>
                        <span className="text-[11px] text-slate-500 font-semibold">
                          ({targetPercent}%)
                        </span>
                      </div>
                    </div>

                    {/* Visual Bar */}
                    <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${targetPercent}%` }} 
                      />
                    </div>

                    {/* Subtext: Sisa lembar and halaman info */}
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 pt-0.5">
                      <span>Rincian: {breakdown.detailText}</span>
                      <span className="text-emerald-700 font-medium truncate ml-1">
                        {formatRemainingTarget(breakdown.decimalJuz, student.targetJuz)}
                      </span>
                    </div>
                  </div>

                  {/* Sub-Details: Setoran Terakhir & Target Waktu */}
                  <div className="text-xs text-slate-600 space-y-1.5 py-2.5 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 text-[11px] shrink-0">Setoran Terakhir:</span>
                      <span className="font-semibold text-slate-800 text-[11px] sm:text-xs truncate text-right">
                        {student.terakhirSetor 
                          ? `Juz ${student.terakhirSetor.juz} - ${student.terakhirSetor.surah} (${student.terakhirSetor.ayat})`
                          : 'Belum ada setoran'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 text-[11px] shrink-0">Target Selesai:</span>
                      <span className="font-medium text-slate-800 text-[11px] sm:text-xs text-right">
                        {student.targetSelesai || 'Desember 2026'}
                      </span>
                    </div>
                  </div>

                  {/* Keterangan Juz & Surat yang Dihafal (Dropdown / Tampilan Simpel) */}
                  <div className="border border-emerald-200/90 bg-emerald-50/40 rounded-xl overflow-hidden my-2.5 transition-all">
                    {/* Dropdown Header Toggle & Edit Trigger */}
                    <div className="flex items-center justify-between p-2.5 sm:p-3 hover:bg-emerald-100/40 transition-colors gap-2">
                      <button
                        type="button"
                        onClick={() => toggleQuranDetails(student.id)}
                        className="flex items-center gap-2.5 text-left min-w-0 flex-1 group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-200 transition-colors">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                              Keterangan Juz & Surat
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200/80">
                              {quranProgress.totalCompletedJuzCount} Juz · {quranProgress.totalMemorizedSurahsCount} Surat
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                            {student.keteranganHafalan || quranProgress.juzSummaryText}
                          </p>
                        </div>

                        <div className="p-1 text-slate-400 group-hover:text-emerald-700 transition-colors shrink-0">
                          {expandedQuranDetailsIds[student.id] ? (
                            <ChevronUp className="w-4 h-4 text-emerald-700" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </button>

                      {/* Dedicated Edit Button */}
                      {currentUser?.role !== 'parent' && (
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForEditKeterangan(student)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-300 shadow-2xs hover:border-emerald-400 transition-all active:scale-95 shrink-0"
                          title="Edit Keterangan Juz & Surat yang Dihafal"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                      )}
                    </div>

                    {/* Expanded Dropdown Content */}
                    {expandedQuranDetailsIds[student.id] && (
                      <div className="p-3 pt-2 border-t border-emerald-200/70 bg-white/80 space-y-2.5 animate-in fade-in duration-150 text-xs">
                        
                        {/* Custom Note if exists */}
                        {student.keteranganHafalan && (
                          <div className="p-2 bg-emerald-50/80 rounded-lg border border-emerald-200 text-[11px] text-emerald-950 font-medium flex items-start gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{student.keteranganHafalan}</span>
                          </div>
                        )}

                        {/* Rincian Juz */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600 font-semibold flex items-center gap-1">
                              <Layers className="w-3 h-3 text-emerald-600" />
                              <span>Juz Selesai ({quranProgress.totalCompletedJuzCount}):</span>
                            </span>
                            <span className="text-emerald-800 font-semibold text-[10px] truncate max-w-[55%] text-right">
                              {quranProgress.juzSummaryText}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            {quranProgress.completedJuzNumbers.map(jNum => (
                              <span
                                key={`juz-badge-${jNum}`}
                                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200"
                              >
                                <span>Juz {jNum}</span>
                                <Check className="w-2.5 h-2.5 stroke-[3] text-emerald-700" />
                              </span>
                            ))}

                            {quranProgress.inProgressJuz && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300"
                              >
                                <span>Juz {quranProgress.inProgressJuz.juzNumber}</span>
                                <span className="text-[9px] font-semibold text-amber-800">
                                  ({quranProgress.inProgressJuz.lembar} lbr / {quranProgress.inProgressJuz.halaman} hal)
                                </span>
                              </span>
                            )}

                            {quranProgress.completedJuzNumbers.length === 0 && !quranProgress.inProgressJuz && (
                              <span className="text-[10px] text-slate-400 italic">Belum ada juz yang ditandai selesai</span>
                            )}
                          </div>
                        </div>

                        {/* Rincian Surat */}
                        <div className="space-y-1 pt-1.5 border-t border-slate-100">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600 font-semibold flex items-center gap-1">
                              <Bookmark className="w-3 h-3 text-emerald-600" />
                              <span>Surat yang Dihafal ({quranProgress.totalMemorizedSurahsCount}):</span>
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            {quranProgress.memorizedSurahs.slice(0, 8).map(s => (
                              <span
                                key={`surah-badge-${s.number}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white text-slate-800 text-[10px] font-medium border border-slate-200 shadow-2xs"
                              >
                                <span className="text-[9px] font-bold text-emerald-700">#{s.number}</span>
                                <span>{s.name}</span>
                              </span>
                            ))}

                            {quranProgress.memorizedSurahs.length > 8 && (
                              <button
                                type="button"
                                onClick={() => setSelectedStudentForQuranDetail(student)}
                                className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200 shadow-2xs"
                              >
                                +{quranProgress.memorizedSurahs.length - 8} Surat lagi...
                              </button>
                            )}

                            {quranProgress.memorizedSurahs.length === 0 && (
                              <span className="text-[10px] text-slate-400 italic">Belum ada surat yang ditandai</span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setSelectedStudentForQuranDetail(student)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Lihat Peta Lengkap 30 Juz</span>
                          </button>

                          {currentUser?.role !== 'parent' && (
                            <button
                              type="button"
                              onClick={() => setSelectedStudentForEditKeterangan(student)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100/90 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-3 h-3 text-emerald-700" />
                              <span>Edit Keterangan Juz & Surat</span>
                            </button>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                </div>

                {/* Accordion Toggle: Hafalan Tersimpan */}
                <div className="pt-2.5 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleAccordion(student.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 transition-colors py-1"
                    >
                      <span>Hafalan Tersimpan ({student.hafalanList.length})</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-emerald-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>

                    <div className="flex items-center gap-1">
                      {currentUser?.role !== 'parent' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedStudentForAdd(student.id);
                              setIsAddModalOpen(true);
                            }}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Setor Hafalan Baru"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedStudentForEdit(student)}
                            className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Kelola & Rincian Hafalan"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded List Container */}
                  {isExpanded && (
                    <div className="mt-2.5 space-y-2 max-h-64 overflow-y-auto pr-1 animate-in fade-in duration-150">
                      {student.hafalanList.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-3 text-center bg-slate-50 rounded-xl">
                          Belum ada riwayat setoran tersimpan.
                        </p>
                      ) : (
                        student.hafalanList.map(h => (
                          <div 
                            key={h.id} 
                            className="p-2.5 sm:p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl text-xs space-y-1.5 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 text-xs flex flex-wrap items-center gap-1.5">
                                  <span>Juz {h.juz} · {h.surahName}</span>
                                  {h.ayatMulai && h.ayatSelesai ? (
                                    <span className="font-normal text-slate-500">
                                      (Ayat {h.ayatMulai}-{h.ayatSelesai})
                                    </span>
                                  ) : null}
                                </div>
                                <div className="text-[10px] sm:text-[11px] text-slate-500 flex flex-wrap items-center gap-1 mt-0.5">
                                  <span className="capitalize font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
                                    {h.type === 'baru' ? 'Hafalan Baru' : h.type === 'muroja' ? "Muroja'ah" : 'Perbaikan'}
                                  </span>
                                  <span>·</span>
                                  <span>{h.tanggal}</span>
                                  {h.ustadzName && <span>· Ustadz: {h.ustadzName}</span>}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <span className={`text-[10px] uppercase font-bold px-1.5 sm:px-2 py-0.5 rounded-md ${
                                  h.kualitas === 'A' ? 'bg-emerald-100 text-emerald-800' :
                                  h.kualitas === 'B' ? 'bg-blue-100 text-blue-800' :
                                  h.kualitas === 'C' ? 'bg-amber-100 text-amber-800' :
                                  'bg-rose-100 text-rose-800'
                                }`}>
                                  Nilai {h.kualitas}
                                </span>

                                {currentUser?.role !== 'parent' && (
                                  <div className="flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => setEditingTarget({ student, record: h })}
                                      className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                      title="Edit Catatan Hafalan Ini"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>

                                    {confirmDeleteId === h.id ? (
                                      <div className="flex items-center gap-1 bg-red-50 p-0.5 rounded-md border border-red-200">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            deleteHafalanRecord(student.id, h.id);
                                            setConfirmDeleteId(null);
                                          }}
                                          className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[9px] font-bold"
                                        >
                                          Hapus
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setConfirmDeleteId(null)}
                                          className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px]"
                                        >
                                          Batal
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setConfirmDeleteId(h.id)}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="Hapus Catatan Hafalan"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Catatan Ustadz */}
                            {h.catatan && (
                              <div className="p-2 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-950 flex items-start gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-semibold text-amber-900">Catatan: </span>
                                  <span className="italic">"{h.catatan}"</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Student Quran 30 Juz & Surah Detail Modal */}
      {selectedStudentForQuranDetail && (
        <StudentQuranDetailModal
          student={selectedStudentForQuranDetail}
          isOpen={!!selectedStudentForQuranDetail}
          onClose={() => setSelectedStudentForQuranDetail(null)}
          onOpenEditKeterangan={() => setSelectedStudentForEditKeterangan(selectedStudentForQuranDetail)}
        />
      )}

      {/* Edit Keterangan Juz & Surat yang Dihafal Modal */}
      {selectedStudentForEditKeterangan && (
        <EditKeteranganHafalanModal
          student={selectedStudentForEditKeterangan}
          isOpen={!!selectedStudentForEditKeterangan}
          onClose={() => setSelectedStudentForEditKeterangan(null)}
        />
      )}

      {/* Edit Hafalan Modal */}
      {selectedStudentForEdit && (
        <EditHafalanModal
          student={selectedStudentForEdit}
          isOpen={!!selectedStudentForEdit}
          onClose={() => setSelectedStudentForEdit(null)}
        />
      )}

      {/* Direct Edit Hafalan Modal (Bisa Desimal & Lembar) */}
      {selectedStudentForDirectEdit && (
        <DirectEditHafalanModal
          student={selectedStudentForDirectEdit}
          isOpen={!!selectedStudentForDirectEdit}
          onClose={() => setSelectedStudentForDirectEdit(null)}
        />
      )}

      {/* Add Hafalan Modal */}
      {isAddModalOpen && (
        <AddHafalanModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setSelectedStudentForAdd(null);
          }}
          preselectedStudentId={selectedStudentForAdd || undefined}
        />
      )}

      {/* Edit Single Hafalan Modal */}
      {editingTarget && (
        <EditSingleHafalanModal
          isOpen={!!editingTarget}
          student={editingTarget.student}
          record={editingTarget.record}
          onClose={() => setEditingTarget(null)}
          onSave={(data) => {
            updateHafalanRecord(editingTarget.student.id, editingTarget.record.id, data);
            setEditingTarget(null);
          }}
          onDelete={() => {
            deleteHafalanRecord(editingTarget.student.id, editingTarget.record.id);
            setEditingTarget(null);
          }}
        />
      )}

      {/* Cetak Rekap Hafalan Bulanan PDF Modal */}
      {isCetakModalOpen && (
        <CetakLaporanModal
          isOpen={isCetakModalOpen}
          onClose={() => setIsCetakModalOpen(false)}
          allSantri={santriList}
          currentFilteredSantri={filteredStudents}
          groups={groups}
          currentUser={currentUser}
          activeGenderFilter={genderFilter}
          activeGroupFilter={groupFilter}
        />
      )}

    </div>
  );
};
