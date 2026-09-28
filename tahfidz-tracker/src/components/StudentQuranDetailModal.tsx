import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  BookOpen, 
  Sparkles, 
  Search, 
  Layers, 
  Bookmark, 
  Calendar, 
  Check, 
  AlertCircle,
  Clock,
  Filter
} from 'lucide-react';
import { Santri } from '../types';
import { parseHafalan } from '../utils/hafalanFormat';
import { getStudentQuranProgress, MemorizedJuzInfo } from '../utils/studentQuranProgress';
import { ALL_SURAHS, JUZ_MAPPING } from '../data/quranData';
import { useTahfidz } from '../context/TahfidzContext';

interface StudentQuranDetailModalProps {
  student: Santri;
  isOpen: boolean;
  onClose: () => void;
  onOpenEditKeterangan?: () => void;
}

export const StudentQuranDetailModal: React.FC<StudentQuranDetailModalProps> = ({
  student,
  isOpen,
  onClose,
  onOpenEditKeterangan
}) => {
  const { updateSantri, currentUser } = useTahfidz();
  const [activeTab, setActiveTab] = useState<'juz' | 'surah'>('juz');
  const [surahSearch, setSurahSearch] = useState('');
  const [surahFilter, setSurahFilter] = useState<'all' | 'memorized' | 'unmemorized'>('memorized');
  const [selectedJuzForDetail, setSelectedJuzForDetail] = useState<MemorizedJuzInfo | null>(null);

  if (!isOpen) return null;

  const progress = getStudentQuranProgress(student);
  const breakdown = parseHafalan(student.totalJuzMemorized);
  const canEdit = currentUser?.role !== 'parent';

  // Toggle completed state for a Juz
  const handleToggleJuz = (juzNumber: number) => {
    if (!canEdit) return;

    let currentList = student.memorizedJuzList;
    if (!currentList) {
      // Initialize with computed list
      currentList = [...progress.completedJuzNumbers];
    }

    let newList: number[];
    if (currentList.includes(juzNumber)) {
      newList = currentList.filter(n => n !== juzNumber);
    } else {
      newList = [...currentList, juzNumber].sort((a, b) => a - b);
    }

    // Keep totalJuzMemorized aligned if whole numbers
    const newTotal = newList.length;
    updateSantri(student.id, {
      memorizedJuzList: newList,
      // If student previously had pure whole numbers or wants auto-sync
      totalJuzMemorized: student.totalJuzMemorized % 1 === 0 ? newTotal : student.totalJuzMemorized
    });
  };

  // Filter surahs
  const filteredSurahs = ALL_SURAHS.filter(s => {
    const isMemorized = progress.memorizedSurahs.some(ms => ms.number === s.number);
    if (surahFilter === 'memorized' && !isMemorized) return false;
    if (surahFilter === 'unmemorized' && isMemorized) return false;

    if (surahSearch.trim()) {
      const q = surahSearch.toLowerCase().trim();
      const matchName = s.name.toLowerCase().includes(q);
      const matchNumber = String(s.number).includes(q);
      const matchArabic = s.arabicName.includes(q);
      return matchName || matchNumber || matchArabic;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200/80 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
              student.gender === 'santriwan' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {student.nama.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-tight truncate">
                  Keterangan Hafalan: {student.nama}
                </h3>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {student.kelasNama} · {student.kelompokNama} · Target: {student.targetJuz} Juz
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlights Banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-4 sm:px-6 py-3.5 shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-4 sm:gap-6">
            <div>
              <div className="text-[10px] sm:text-[11px] text-emerald-200 font-medium uppercase tracking-wider">
                Total Capaian
              </div>
              <div className="text-lg sm:text-xl font-extrabold flex items-baseline gap-1.5">
                <span>{breakdown.decimalText} Juz</span>
                <span className="text-xs font-semibold text-emerald-200">({breakdown.lembarText})</span>
              </div>
            </div>

            <div className="h-8 w-px bg-emerald-700/60" />

            <div>
              <div className="text-[10px] sm:text-[11px] text-emerald-200 font-medium uppercase tracking-wider">
                Juz Selesai
              </div>
              <div className="text-base sm:text-lg font-bold text-white">
                {progress.totalCompletedJuzCount} <span className="text-xs font-normal text-emerald-200">dari 30 Juz</span>
              </div>
            </div>

            <div className="h-8 w-px bg-emerald-700/60 hidden sm:block" />

            <div className="hidden sm:block">
              <div className="text-[10px] sm:text-[11px] text-emerald-200 font-medium uppercase tracking-wider">
                Surat Dihafal
              </div>
              <div className="text-base sm:text-lg font-bold text-white">
                {progress.totalMemorizedSurahsCount} <span className="text-xs font-normal text-emerald-200">Surat</span>
              </div>
            </div>
          </div>

          {/* Sisa & Progress */}
          <div className="text-right text-xs bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-700/40">
            <span className="text-emerald-200 block text-[10px]">Kemajuan Target 30 Juz:</span>
            <span className="font-bold text-white">
              {Math.round((breakdown.decimalJuz / 30) * 100)}% Al-Qur'an
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-3 pb-2 border-b border-slate-200/80 bg-white shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => setActiveTab('juz')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'juz'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Peta 30 Juz Al-Qur'an</span>
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold">
                {progress.totalCompletedJuzCount}/30
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('surah')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'surah'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Rincian Surat</span>
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold">
                {progress.totalMemorizedSurahsCount}
              </span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 hidden md:block">
            {canEdit ? '💡 Klik pada kartu Juz untuk menandai status' : 'Mode tampilan santri & orang tua'}
          </div>
        </div>

        {/* Tab 1 Content: PETA 30 JUZ */}
        {activeTab === 'juz' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            
            {/* Status Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold text-slate-700">Keterangan:</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600 inline-block" />
                  <span className="font-medium text-slate-800">Selesai / Mutqin (10 Lembar)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500 inline-block" />
                  <span className="font-medium text-slate-800">Sedang Dihafal (Sebagian Lembar)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300 inline-block" />
                  <span className="text-slate-500">Belum Dihafal</span>
                </span>
              </div>

              {canEdit && (
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  Ustadz dapat mengklik kartu juz untuk mengubah status
                </span>
              )}
            </div>

            {/* Quick summary text */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl text-xs text-emerald-950 flex items-start gap-2">
              <Bookmark className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-emerald-900">Rangkuman Juz: </span>
                <span>{progress.juzSummaryText}</span>
              </div>
            </div>

            {/* 30 Juz Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3">
              {progress.all30Juz.map(j => {
                const isComplete = j.status === 'lengkap';
                const isSedang = j.status === 'sedang';

                return (
                  <div
                    key={j.juzNumber}
                    onClick={() => {
                      if (canEdit) {
                        handleToggleJuz(j.juzNumber);
                      } else {
                        setSelectedJuzForDetail(j);
                      }
                    }}
                    className={`p-3 rounded-2xl border transition-all text-left relative group select-none ${
                      canEdit ? 'cursor-pointer hover:shadow-md' : 'cursor-default'
                    } ${
                      isComplete
                        ? 'bg-emerald-50/90 border-emerald-300/90 text-emerald-950 hover:bg-emerald-100/80 shadow-xs'
                        : isSedang
                        ? 'bg-amber-50/90 border-amber-300/90 text-amber-950 hover:bg-amber-100/80 shadow-xs'
                        : 'bg-white border-slate-200/90 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {/* Top indicator & Juz Number */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-bold text-xs sm:text-sm">
                        Juz {j.juzNumber}
                      </span>
                      <div className="flex items-center gap-1">
                        {isComplete && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        {isSedang && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 leading-none">
                            {j.lembar} lbr
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Text */}
                    <div className="text-[11px] mb-1">
                      {isComplete ? (
                        <span className="font-semibold text-emerald-700">10 Lembar (Penuh)</span>
                      ) : isSedang ? (
                        <span className="font-semibold text-amber-800">{j.lembar} Lembar ({j.halaman} Hal)</span>
                      ) : (
                        <span className="text-slate-400">Belum dihafal</span>
                      )}
                    </div>

                    {/* Surah List in this Juz */}
                    <div className="text-[10px] text-slate-500 truncate pt-1 border-t border-slate-200/60">
                      {j.surahs.map(s => s.name).join(', ')}
                    </div>

                    {/* Quick action hint on hover for Ustaz */}
                    {canEdit && (
                      <div className="absolute inset-0 bg-emerald-900/10 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                        <span className="bg-white/95 px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-800 shadow-xs">
                          {isComplete ? 'Batalkan Lengkap' : 'Tandai Lengkap'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* Tab 2 Content: RINCIAN SURAT */}
        {activeTab === 'surah' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={surahSearch}
                  onChange={e => setSurahSearch(e.target.value)}
                  placeholder="Cari surat (contoh: Al-Baqarah, Yasin, Al-Mulk, 36)..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                {surahSearch && (
                  <button
                    type="button"
                    onClick={() => setSurahSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Surah Filter Chips */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setSurahFilter('memorized')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    surahFilter === 'memorized'
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sudah Dihafal ({progress.totalMemorizedSurahsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setSurahFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    surahFilter === 'all'
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua 114 Surat
                </button>
                <button
                  type="button"
                  onClick={() => setSurahFilter('unmemorized')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    surahFilter === 'unmemorized'
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Belum ({114 - progress.totalMemorizedSurahsCount})
                </button>
              </div>
            </div>

            {/* Surah Cards Grid */}
            {filteredSurahs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl">
                Tidak ada surat yang sesuai dengan filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredSurahs.map(surah => {
                  const memorizedInfo = progress.memorizedSurahs.find(ms => ms.number === surah.number);
                  const isMemorized = !!memorizedInfo;
                  const isLengkap = memorizedInfo?.status === 'lengkap';

                  return (
                    <div
                      key={surah.number}
                      className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                        isMemorized
                          ? isLengkap
                            ? 'bg-emerald-50/80 border-emerald-200/90 shadow-2xs'
                            : 'bg-amber-50/70 border-amber-200/90 shadow-2xs'
                          : 'bg-white border-slate-200/80 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isMemorized
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {surah.number}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm leading-tight">
                              {surah.name}
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              {surah.totalAyahs} Ayat · {surah.revelation}
                            </p>
                          </div>
                        </div>

                        <span className="font-arabic text-lg text-emerald-950 shrink-0">
                          {surah.arabicName}
                        </span>
                      </div>

                      {/* Memorization Status Bar */}
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        {isMemorized ? (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-semibold text-emerald-900 text-[11px]">
                              {memorizedInfo.ayatDetail || 'Hafal'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Belum disetor</span>
                        )}

                        {memorizedInfo?.lastDate && (
                          <span className="text-[10px] text-slate-400">
                            {memorizedInfo.lastDate}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200/80 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Total tercatat: <strong className="text-slate-800">{progress.totalCompletedJuzCount} Juz Selesai</strong> & <strong className="text-slate-800">{progress.totalMemorizedSurahsCount} Surat</strong>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && onOpenEditKeterangan && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEditKeterangan();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center gap-1.5"
              >
                <span>Edit Keterangan</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 sm:px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
