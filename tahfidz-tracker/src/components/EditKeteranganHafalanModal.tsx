import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Check, 
  BookOpen, 
  Layers, 
  Bookmark, 
  Search, 
  Sparkles, 
  RotateCcw, 
  CheckSquare, 
  Square, 
  SlidersHorizontal,
  Info,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Santri } from '../types';
import { ALL_SURAHS, JUZ_MAPPING } from '../data/quranData';
import { getStudentQuranProgress, SURAH_TO_JUZ_MAP } from '../utils/studentQuranProgress';
import { useTahfidz } from '../context/TahfidzContext';

interface EditKeteranganHafalanModalProps {
  isOpen: boolean;
  student: Santri;
  onClose: () => void;
}

export const EditKeteranganHafalanModal: React.FC<EditKeteranganHafalanModalProps> = ({
  isOpen,
  student,
  onClose
}) => {
  const { updateSantri } = useTahfidz();

  const [activeTab, setActiveTab] = useState<'juz' | 'surah' | 'notes'>('juz');

  // Progress computed initially
  const initialProgress = useMemo(() => getStudentQuranProgress(student), [student]);

  // Selected completed Juz numbers
  const [selectedJuz, setSelectedJuz] = useState<number[]>([]);

  // In-progress partial Juz state
  const [hasInProgressJuz, setHasInProgressJuz] = useState<boolean>(false);
  const [inProgressJuzNumber, setInProgressJuzNumber] = useState<number>(1);
  const [inProgressLembar, setInProgressLembar] = useState<number>(2);

  // Selected memorized Surahs
  const [selectedSurahs, setSelectedSurahs] = useState<number[]>([]);
  const [surahSearch, setSurahSearch] = useState<string>('');
  const [surahFilterTab, setSurahFilterTab] = useState<'all' | 'selected' | 'unselected'>('all');

  // Custom notes
  const [keteranganHafalan, setKeteranganHafalan] = useState<string>('');

  // Option to auto-sync totalJuzMemorized
  const [autoSyncTotalJuz, setAutoSyncTotalJuz] = useState<boolean>(true);

  // Status message
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize form state when student or modal opens
  useEffect(() => {
    if (!isOpen) return;

    const prog = getStudentQuranProgress(student);

    // Initial selected Juz
    if (Array.isArray(student.memorizedJuzList)) {
      setSelectedJuz([...student.memorizedJuzList]);
    } else {
      setSelectedJuz([...prog.completedJuzNumbers]);
    }

    // In-progress juz
    if (student.inProgressJuz && student.inProgressJuz.juzNumber >= 1) {
      setHasInProgressJuz(true);
      setInProgressJuzNumber(student.inProgressJuz.juzNumber);
      setInProgressLembar(student.inProgressJuz.lembar || 2);
    } else if (prog.inProgressJuz) {
      setHasInProgressJuz(true);
      setInProgressJuzNumber(prog.inProgressJuz.juzNumber);
      setInProgressLembar(prog.inProgressJuz.lembar);
    } else {
      setHasInProgressJuz(false);
      // Default to next uncompleted juz
      const nextUncompleted = Array.from({ length: 30 }, (_, i) => i + 1).find(j => !prog.completedJuzNumbers.includes(j)) || 1;
      setInProgressJuzNumber(nextUncompleted);
      setInProgressLembar(2);
    }

    // Initial selected Surahs
    if (Array.isArray(student.memorizedSurahNumbers)) {
      setSelectedSurahs([...student.memorizedSurahNumbers]);
    } else {
      setSelectedSurahs(prog.memorizedSurahs.map(s => s.number));
    }

    setKeteranganHafalan(student.keteranganHafalan || '');
    setSurahSearch('');
    setSurahFilterTab('all');
    setSaveSuccess(false);
  }, [isOpen, student]);

  if (!isOpen) return null;

  // Toggle single Juz completion
  const handleToggleJuz = (juzNum: number) => {
    setSelectedJuz(prev => {
      if (prev.includes(juzNum)) {
        return prev.filter(n => n !== juzNum).sort((a, b) => a - b);
      } else {
        return [...prev, juzNum].sort((a, b) => a - b);
      }
    });
  };

  // Quick Juz helper actions
  const selectJuzAmma = () => {
    setSelectedJuz(prev => Array.from(new Set([...prev, 30])).sort((a, b) => a - b));
  };

  const selectJuzTabarak = () => {
    setSelectedJuz(prev => Array.from(new Set([...prev, 29, 30])).sort((a, b) => a - b));
  };

  const selectJuzRange = (start: number, end: number) => {
    const range = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    setSelectedJuz(prev => Array.from(new Set([...prev, ...range])).sort((a, b) => a - b));
  };

  const selectAllJuz = () => {
    setSelectedJuz(Array.from({ length: 30 }, (_, i) => i + 1));
  };

  const clearAllJuz = () => {
    setSelectedJuz([]);
  };

  // Surah toggle
  const handleToggleSurah = (surahNum: number) => {
    setSelectedSurahs(prev => {
      if (prev.includes(surahNum)) {
        return prev.filter(n => n !== surahNum).sort((a, b) => a - b);
      } else {
        return [...prev, surahNum].sort((a, b) => a - b);
      }
    });
  };

  // Sync Surahs from chosen Juz
  const handleSyncSurahsFromJuz = () => {
    const surahNumbersFromSelectedJuz = new Set<number>();
    selectedJuz.forEach(jNum => {
      const mapping = JUZ_MAPPING[jNum];
      if (mapping) {
        mapping.surahNumbers.forEach(sNum => surahNumbersFromSelectedJuz.add(sNum));
      }
    });

    // Merge with any current selections
    const merged = Array.from(new Set([...selectedSurahs, ...surahNumbersFromSelectedJuz])).sort((a, b) => a - b);
    setSelectedSurahs(merged);
  };

  // Select Juz 'Amma Surahs (78 - 114)
  const selectJuzAmmaSurahs = () => {
    const ammaSurahs = Array.from({ length: 37 }, (_, i) => 78 + i);
    setSelectedSurahs(prev => Array.from(new Set([...prev, ...ammaSurahs])).sort((a, b) => a - b));
  };

  // Select Popular Surahs
  const selectPopularSurahs = () => {
    // Al-Kahf (18), As-Sajdah (32), Yasin (36), Ar-Rahman (55), Al-Waqi'ah (56), Al-Mulk (67), Al-Insan (76)
    const popular = [18, 32, 36, 55, 56, 67, 76];
    setSelectedSurahs(prev => Array.from(new Set([...prev, ...popular])).sort((a, b) => a - b));
  };

  const selectAllSurahs = () => {
    setSelectedSurahs(Array.from({ length: 114 }, (_, i) => i + 1));
  };

  const clearAllSurahs = () => {
    setSelectedSurahs([]);
  };

  // Filtered surahs for tab 2
  const filteredSurahs = ALL_SURAHS.filter(s => {
    const isSelected = selectedSurahs.includes(s.number);
    if (surahFilterTab === 'selected' && !isSelected) return false;
    if (surahFilterTab === 'unselected' && isSelected) return false;

    if (surahSearch.trim()) {
      const q = surahSearch.toLowerCase().trim();
      const matchName = s.name.toLowerCase().includes(q);
      const matchNumber = String(s.number).includes(q);
      const matchArabic = s.arabicName.includes(q);
      return matchName || matchNumber || matchArabic;
    }
    return true;
  });

  // Calculate synchronized total Juz
  const calculatedTotalJuz = useMemo(() => {
    const whole = selectedJuz.length;
    const partial = hasInProgressJuz ? inProgressLembar / 10 : 0;
    return Number((whole + partial).toFixed(1));
  }, [selectedJuz, hasInProgressJuz, inProgressLembar]);

  // Handle Save
  const handleSave = () => {
    const finalSelectedJuz = [...selectedJuz].sort((a, b) => a - b);
    const finalSelectedSurahs = [...selectedSurahs].sort((a, b) => a - b);

    const updatePayload: Partial<Santri> = {
      memorizedJuzList: finalSelectedJuz,
      memorizedSurahNumbers: finalSelectedSurahs,
      keteranganHafalan: keteranganHafalan.trim(),
      inProgressJuz: hasInProgressJuz ? {
        juzNumber: inProgressJuzNumber,
        lembar: inProgressLembar,
        halaman: inProgressLembar * 2
      } : undefined
    };

    if (autoSyncTotalJuz) {
      updatePayload.totalJuzMemorized = calculatedTotalJuz;
    }

    updateSantri(student.id, updatePayload);
    setSaveSuccess(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
              student.gender === 'santriwan' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {student.nama.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-tight truncate">
                  Edit Keterangan Juz & Surat
                </h3>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Santri: <strong className="text-slate-700">{student.nama}</strong> ({student.kelasNama} · {student.kelompokNama})
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

        {/* Tab Navigation */}
        <div className="flex items-center px-4 sm:px-6 border-b border-slate-200 bg-white shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('juz')}
            className={`py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'juz'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Pilih Juz yang Dihafal</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
              {selectedJuz.length} Juz
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('surah')}
            className={`py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'surah'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Pilih Surat yang Dihafal</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
              {selectedSurahs.length} Surat
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'notes'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Catatan Keterangan</span>
            {keteranganHafalan.trim() && (
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
            )}
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50">
          
          {/* TAB 1: PILIH JUZ */}
          {activeTab === 'juz' && (
            <div className="space-y-4">
              
              {/* Top Quick Actions Bar */}
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pilihan Cepat Juz:</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={selectAllJuz}
                      className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                    >
                      Pilih Semua (30 Juz)
                    </button>
                    <button
                      type="button"
                      onClick={clearAllJuz}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={selectJuzAmma}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      selectedJuz.includes(30)
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    + Juz 30 ('Amma)
                  </button>

                  <button
                    type="button"
                    onClick={selectJuzTabarak}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      selectedJuz.includes(29) && selectedJuz.includes(30)
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    + Juz 29 & 30
                  </button>

                  <button
                    type="button"
                    onClick={() => selectJuzRange(1, 5)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                  >
                    + Juz 1 s/d 5
                  </button>

                  <button
                    type="button"
                    onClick={() => selectJuzRange(1, 10)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                  >
                    + Juz 1 s/d 10
                  </button>

                  <button
                    type="button"
                    onClick={() => selectJuzRange(1, 15)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                  >
                    + Juz 1 s/d 15
                  </button>
                </div>
              </div>

              {/* 30-Juz Interactive Checkbox Grid */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Klik Juz untuk Menandai Tuntas / Mutqin (1–30)
                  </h4>
                  <span className="text-xs font-semibold text-emerald-800">
                    {selectedJuz.length} dari 30 Juz Selesai
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-2.5">
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(jNum => {
                    const isSelected = selectedJuz.includes(jNum);
                    const mapping = JUZ_MAPPING[jNum];

                    return (
                      <button
                        key={`select-juz-${jNum}`}
                        type="button"
                        onClick={() => handleToggleJuz(jNum)}
                        className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between active:scale-[0.98] ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className={`text-xs font-extrabold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            Juz {jNum}
                          </span>
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-white/20 text-white' : 'border border-slate-300 text-transparent'
                          }`}>
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        </div>

                        <div className={`text-[10px] mt-1 truncate ${isSelected ? 'text-emerald-100 font-medium' : 'text-slate-400'}`}>
                          {jNum === 30 ? "Juz 'Amma" : jNum === 29 ? 'Tabarak' : mapping?.name || `Juz ke-${jNum}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* In-Progress Partial Juz Section */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasInProgressJuz}
                      onChange={e => setHasInProgressJuz(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      Ada Juz yang Sedang Berjalan (Sebagian Lembar)?
                    </span>
                  </label>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    Contoh: Santri sedang menyetor di pertengahan Juz
                  </span>
                </div>

                {hasInProgressJuz && (
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Pilih Nomor Juz Sedang Berjalan:
                      </label>
                      <select
                        value={inProgressJuzNumber}
                        onChange={e => setInProgressJuzNumber(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      >
                        {Array.from({ length: 30 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>
                            Juz {num} {num === 30 ? "('Amma)" : ''} {selectedJuz.includes(num) ? '(Sudah ditandai tuntas)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Jumlah Capaian Lembar:
                        </label>
                        <span className="text-xs font-bold text-emerald-700">
                          {inProgressLembar} Lembar ({inProgressLembar * 2} Halaman)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="1"
                          max="9"
                          value={inProgressLembar}
                          onChange={e => setInProgressLembar(parseInt(e.target.value, 10))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                        <span className="text-xs font-bold text-slate-700 w-8 text-right">
                          {inProgressLembar}/10
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        *1 Juz = 10 Lembar = 20 Halaman. Nilai desimal: {(inProgressLembar / 10).toFixed(1)} Juz.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Synchronization Preview Card */}
              <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Total Capaian yang Terhitung:</span>
                    <span className="text-sm font-extrabold text-emerald-800 ml-1">
                      {calculatedTotalJuz} Juz
                    </span>
                    <span className="text-emerald-700 font-semibold">
                      ({selectedJuz.length} Juz Lengkap {hasInProgressJuz ? `+ ${inProgressLembar} Lembar` : ''})
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none pt-0.5">
                    <input
                      type="checkbox"
                      checked={autoSyncTotalJuz}
                      onChange={e => setAutoSyncTotalJuz(e.target.checked)}
                      className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500 border-emerald-300"
                    />
                    <span className="text-slate-700 font-medium text-[11px]">
                      Perbarui angka total capaian santri secara otomatis sesuai pilihan ini
                    </span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleSyncSurahsFromJuz}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs transition-colors shadow-2xs shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sinkronkan Surat dari Juz Terpilih</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: PILIH SURAT */}
          {activeTab === 'surah' && (
            <div className="space-y-4">
              
              {/* Surah Action Bar & Shortcuts */}
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  
                  {/* Search Surah */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={surahSearch}
                      onChange={e => setSurahSearch(e.target.value)}
                      placeholder="Cari nama surat (misal: Al-Kahf, Yasin, An-Naba, 18)..."
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                    {surahSearch && (
                      <button
                        type="button"
                        onClick={() => setSurahSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filter Status Buttons */}
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl text-xs shrink-0">
                    <button
                      type="button"
                      onClick={() => setSurahFilterTab('all')}
                      className={`px-2.5 py-1.5 rounded-lg font-semibold text-[11px] transition-all ${
                        surahFilterTab === 'all'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Semua (114)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSurahFilterTab('selected')}
                      className={`px-2.5 py-1.5 rounded-lg font-semibold text-[11px] transition-all ${
                        surahFilterTab === 'selected'
                          ? 'bg-white text-emerald-800 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Dipilih ({selectedSurahs.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSurahFilterTab('unselected')}
                      className={`px-2.5 py-1.5 rounded-lg font-semibold text-[11px] transition-all ${
                        surahFilterTab === 'unselected'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Belum ({114 - selectedSurahs.length})
                    </button>
                  </div>
                </div>

                {/* Quick Pre-sets */}
                <div className="flex items-center justify-between flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 mr-1">Pilihan Cepat:</span>
                    <button
                      type="button"
                      onClick={handleSyncSurahsFromJuz}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 transition-colors"
                      title="Tambahkan semua surat yang ada dalam Juz terpilih"
                    >
                      ⚡ Dari {selectedJuz.length} Juz Terpilih
                    </button>
                    <button
                      type="button"
                      onClick={selectJuzAmmaSurahs}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    >
                      Juz 'Amma (78-114)
                    </button>
                    <button
                      type="button"
                      onClick={selectPopularSurahs}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    >
                      Surat Pilihan
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={selectAllSurahs}
                      className="px-2 py-1 text-[10px] font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={clearAllSurahs}
                      className="px-2 py-1 text-[10px] font-semibold text-rose-600 hover:text-rose-800"
                    >
                      Batal Semua
                    </button>
                  </div>
                </div>
              </div>

              {/* Surah List Grid */}
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                <div className="text-xs text-slate-500 font-semibold px-1">
                  Menampilkan {filteredSurahs.length} Surat · Klik surat untuk mencentang/menghapus
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[48vh] overflow-y-auto pr-1">
                  {filteredSurahs.map(surah => {
                    const isSelected = selectedSurahs.includes(surah.number);
                    const juzNumbers = SURAH_TO_JUZ_MAP[surah.number] || [];

                    return (
                      <button
                        key={surah.number}
                        type="button"
                        onClick={() => handleToggleSurah(surah.number)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 active:scale-[0.99] ${
                          isSelected
                            ? 'bg-emerald-50/90 border-emerald-300 shadow-2xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {surah.number}
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-bold text-slate-900 text-xs truncate leading-tight">
                              {surah.name}
                            </h5>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {surah.totalAyahs} Ayat · Juz {juzNumbers.join(', ')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-arabic text-sm text-slate-700 hidden sm:inline">
                            {surah.arabicName}
                          </span>
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'border border-slate-300 text-transparent'
                          }`}>
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: CATATAN KETERANGAN */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Catatan Keterangan Hafalan Santri
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Catatan ini akan tampil langsung di kartu santri dan mempermudah pemantauan evaluasi ustadz & wali santri.
                  </p>
                </div>

                <textarea
                  value={keteranganHafalan}
                  onChange={e => setKeteranganHafalan(e.target.value)}
                  rows={4}
                  placeholder="Contoh: Sudah tuntas mutqin Juz 30 dan Juz 29. Sedang ziyadah Juz 1 sampai halaman 8 untuk persiapan Tasmi..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
                />

                {/* Suggestions Pills */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400">Contoh Cepat:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Mutqin Juz 30 & 29, persiapan tasmi 2 Juz',
                      'Lancar Juz 1–5, sedang muroja\'ah berkala',
                      'Tuntas Juz \'Amma lengkap dengan tajwid matang',
                      'Sedang ziyadah Juz 1 halaman 1–10'
                    ].map(snippet => (
                      <button
                        key={snippet}
                        type="button"
                        onClick={() => setKeteranganHafalan(snippet)}
                        className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        + "{snippet}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/70 text-xs space-y-1.5">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Ringkasan yang Akan Disimpan:</span>
                </div>
                <p className="text-emerald-950 font-medium">
                  • <strong>{selectedJuz.length} Juz Selesai</strong> {selectedJuz.length > 0 ? `(${selectedJuz.join(', ')})` : '(Belum ada)'}
                </p>
                {hasInProgressJuz && (
                  <p className="text-emerald-950 font-medium">
                    • <strong>Juz {inProgressJuzNumber} Sedang Berjalan</strong> ({inProgressLembar} Lembar / {inProgressLembar * 2} Halaman)
                  </p>
                )}
                <p className="text-emerald-950 font-medium">
                  • <strong>{selectedSurahs.length} Surat Dihafal</strong>
                </p>
                {autoSyncTotalJuz && (
                  <p className="text-emerald-950 font-medium">
                    • Total Capaian Santri: <strong>{calculatedTotalJuz} Juz</strong>
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Terpilih: <strong className="text-emerald-800">{selectedJuz.length} Juz</strong> & <strong className="text-emerald-800">{selectedSurahs.length} Surat</strong>
            {hasInProgressJuz && <span className="ml-1 text-slate-500">(+Juz {inProgressJuzNumber} sedang berjalan)</span>}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{saveSuccess ? 'Tersimpan!' : 'Simpan Keterangan'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
