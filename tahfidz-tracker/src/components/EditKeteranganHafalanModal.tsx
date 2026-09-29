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
  const [inProgressHalaman, setInProgressHalaman] = useState<number>(4);
  const [inProgressSurahNumber, setInProgressSurahNumber] = useState<number>(1);
  const [inProgressSurahName, setInProgressSurahName] = useState<string>('Al-Fatihah');
  const [inProgressAyatMulai, setInProgressAyatMulai] = useState<string>('');
  const [inProgressAyatSelesai, setInProgressAyatSelesai] = useState<string>('');

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

    // In-progress juz & surah
    if (student.inProgressJuz && student.inProgressJuz.juzNumber >= 1) {
      setHasInProgressJuz(true);
      setInProgressJuzNumber(student.inProgressJuz.juzNumber);
      const l = student.inProgressJuz.lembar || 2;
      setInProgressLembar(l);
      setInProgressHalaman(student.inProgressJuz.halaman || l * 2);
      setInProgressSurahNumber(student.inProgressJuz.surahNumber || 1);
      setInProgressSurahName(student.inProgressJuz.surahSedangDihafal || ALL_SURAHS.find(s => s.number === (student.inProgressJuz?.surahNumber || 1))?.name || 'Al-Fatihah');
      if (student.inProgressJuz.ayatDetail) {
        const m = student.inProgressJuz.ayatDetail.match(/(\d+)(?:\s*-\s*(\d+))?/);
        if (m) {
          setInProgressAyatMulai(m[1] || '');
          setInProgressAyatSelesai(m[2] || '');
        }
      } else {
        setInProgressAyatMulai('');
        setInProgressAyatSelesai('');
      }
    } else if (prog.inProgressJuz) {
      setHasInProgressJuz(true);
      setInProgressJuzNumber(prog.inProgressJuz.juzNumber);
      const l = prog.inProgressJuz.lembar || 2;
      setInProgressLembar(l);
      setInProgressHalaman(prog.inProgressJuz.halaman || l * 2);
      const surahsInJuz = JUZ_MAPPING[prog.inProgressJuz.juzNumber]?.surahNumbers || [1];
      const sNum = surahsInJuz[0] || 1;
      setInProgressSurahNumber(sNum);
      setInProgressSurahName(ALL_SURAHS.find(s => s.number === sNum)?.name || 'Al-Fatihah');
      setInProgressAyatMulai('');
      setInProgressAyatSelesai('');
    } else {
      setHasInProgressJuz(false);
      // Default to next uncompleted juz
      const nextUncompleted = Array.from({ length: 30 }, (_, i) => i + 1).find(j => !prog.completedJuzNumbers.includes(j)) || 1;
      setInProgressJuzNumber(nextUncompleted);
      setInProgressLembar(2);
      setInProgressHalaman(4);
      const surahsInJuz = JUZ_MAPPING[nextUncompleted]?.surahNumbers || [1];
      const sNum = surahsInJuz[0] || 1;
      setInProgressSurahNumber(sNum);
      setInProgressSurahName(ALL_SURAHS.find(s => s.number === sNum)?.name || 'Al-Fatihah');
      setInProgressAyatMulai('');
      setInProgressAyatSelesai('');
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
        halaman: inProgressHalaman || inProgressLembar * 2,
        surahNumber: inProgressSurahNumber,
        surahSedangDihafal: inProgressSurahName || ALL_SURAHS.find(s => s.number === inProgressSurahNumber)?.name || '',
        ayatDetail: inProgressAyatMulai ? `Ayat ${inProgressAyatMulai}${inProgressAyatSelesai ? `-${inProgressAyatSelesai}` : ''}` : undefined
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
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
              student.gender === 'santriwan' ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900' : 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
            }`}>
              {student.nama.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg leading-tight truncate">
                  Edit Keterangan Juz & Surat
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Santri: <strong className="text-slate-700 dark:text-slate-200">{student.nama}</strong> ({student.kelasNama} · {student.kelompokNama})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors shrink-0 ml-2 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('juz')}
            className={`py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'juz'
                ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Pilih Juz yang Dihafal</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {selectedJuz.length} Juz
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('surah')}
            className={`py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'surah'
                ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Pilih Surat yang Dihafal</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {selectedSurahs.length} Surat
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`py-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'notes'
                ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Catatan Keterangan</span>
            {keteranganHafalan.trim() && (
              <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            )}
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50 dark:bg-slate-950/40">
          
          {/* TAB 1: PILIH JUZ */}
          {activeTab === 'juz' && (
            <div className="space-y-4">
              
              {/* Top Quick Actions Bar */}
              <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-750 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Pilihan Cepat Juz:</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={selectAllJuz}
                      className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                    >
                      Pilih Semua (30 Juz)
                    </button>
                    <button
                      type="button"
                      onClick={clearAllJuz}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={selectJuzAmma}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selectedJuz.includes(30)
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                    }`}
                  >
                    + Juz 30 ('Amma)
                  </button>

                  <button
                    type="button"
                    onClick={selectJuzTabarak}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selectedJuz.includes(29) && selectedJuz.includes(30)
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                    }`}
                  >
                    + Juz 29 & 30
                  </button>

                  <button
                    type="button"
                    onClick={() => selectJuzRange(1, 5)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 transition-all cursor-pointer"
                  >
                    + Juz 1 s/d 5
                  </button>

                  <button
                    type="button"
                    onClick={() => selectJuzRange(1, 10)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 transition-all cursor-pointer"
                  >
                    + Juz 1 s/d 10
                  </button>

                  <button
                    type="button"
                    onClick={() => selectJuzRange(1, 15)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 transition-all cursor-pointer"
                  >
                    + Juz 1 s/d 15
                  </button>
                </div>
              </div>

              {/* 30-Juz Interactive Checkbox Grid */}
              <div className="bg-white dark:bg-slate-850 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-750 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Klik Juz untuk Menandai Tuntas / Mutqin (1–30)
                  </h4>
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
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
                        className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between active:scale-[0.98] cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                            : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className={`text-xs font-extrabold ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                            Juz {jNum}
                          </span>
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-white/20 text-white' : 'border border-slate-300 dark:border-slate-600 text-transparent'
                          }`}>
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        </div>

                        <div className={`text-[10px] mt-1 truncate ${isSelected ? 'text-emerald-100 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                          {jNum === 30 ? "Juz 'Amma" : jNum === 29 ? 'Tabarak' : mapping?.name || `Juz ke-${jNum}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* In-Progress Partial Juz Section */}
              <div className="bg-white dark:bg-slate-850 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-750 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasInProgressJuz}
                      onChange={e => setHasInProgressJuz(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      Ada Juz yang Sedang Berjalan (Sebagian Lembar)?
                    </span>
                  </label>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                    Contoh: Santri sedang menyetor di pertengahan Juz
                  </span>
                </div>

                {hasInProgressJuz && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Nomor Juz yang Sedang Berjalan:
                        </label>
                        <select
                          value={inProgressJuzNumber}
                          onChange={e => {
                            const newJuz = parseInt(e.target.value, 10);
                            setInProgressJuzNumber(newJuz);
                            const surahsInJuz = JUZ_MAPPING[newJuz]?.surahNumbers || [];
                            if (surahsInJuz.length > 0 && !surahsInJuz.includes(inProgressSurahNumber)) {
                              setInProgressSurahNumber(surahsInJuz[0]);
                              const sObj = ALL_SURAHS.find(s => s.number === surahsInJuz[0]);
                              if (sObj) setInProgressSurahName(sObj.name);
                            }
                          }}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800"
                        >
                          {Array.from({ length: 30 }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>
                              Juz {num} {num === 30 ? "('Amma)" : ''} {selectedJuz.includes(num) ? '(Sudah ditandai tuntas)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Surat yang sedang dihafal */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Surat yang Sedang Dihafal Saat Ini:
                        </label>
                        <select
                          value={inProgressSurahNumber}
                          onChange={e => {
                            const sNum = parseInt(e.target.value, 10);
                            setInProgressSurahNumber(sNum);
                            const sObj = ALL_SURAHS.find(s => s.number === sNum);
                            if (sObj) setInProgressSurahName(sObj.name);
                          }}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800"
                        >
                          {ALL_SURAHS.map(s => (
                            <option key={s.number} value={s.number}>
                              No. {s.number} - {s.name} ({s.arabicName}) · {s.totalAyahs} Ayat
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Ayat Mulai & Selesai */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-slate-50/80 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Detail Ayat yang Sedang Dihafal (Opsional):
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            placeholder="Ayat mulai (mis. 1)"
                            value={inProgressAyatMulai}
                            onChange={e => setInProgressAyatMulai(e.target.value)}
                            className="w-1/2 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100"
                          />
                          <span className="text-xs text-slate-400">s/d</span>
                          <input
                            type="number"
                            min="1"
                            placeholder="Ayat selesai (mis. 20)"
                            value={inProgressAyatSelesai}
                            onChange={e => setInProgressAyatSelesai(e.target.value)}
                            className="w-1/2 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                          Contoh: Sedang menghafal Ayat 1 - 20 pada surat di atas.
                        </p>
                      </div>

                      {/* Patokan Halaman & Lembar Qur'an */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Patokan Halaman & Lembar Qur'an:</span>
                          </label>
                          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            Lembar {inProgressLembar} ({inProgressLembar * 2} Hal.)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="1"
                            max="9"
                            value={inProgressLembar}
                            onChange={e => {
                              const val = parseInt(e.target.value, 10);
                              setInProgressLembar(val);
                              setInProgressHalaman(val * 2);
                            }}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                          />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-8 text-right">
                            {inProgressLembar}/10
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          <span>Standar Madinah: 1 Juz = 10 Lembar (20 Hal.)</span>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">+{ (inProgressLembar / 10).toFixed(1) } Juz</span>
                        </div>
                      </div>
                    </div>

                    {/* Preview box */}
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                      <span>
                        Status Berjalan: <strong>Juz {inProgressJuzNumber}</strong> · Lembar ke-<strong>{inProgressLembar}</strong> (Halaman {inProgressLembar * 2} dari 20) · Surat <strong>{inProgressSurahName}</strong> {inProgressAyatMulai ? `(Ayat ${inProgressAyatMulai}${inProgressAyatSelesai ? `-${inProgressAyatSelesai}` : ''})` : ''}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Synchronization Preview Card */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5 flex-wrap">
                    <Info className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    <span>Total Capaian yang Terhitung:</span>
                    <span className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300 ml-1">
                      {calculatedTotalJuz} Juz
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                      ({selectedJuz.length} Juz Lengkap {hasInProgressJuz ? `+ ${inProgressLembar} Lembar` : ''})
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none pt-0.5">
                    <input
                      type="checkbox"
                      checked={autoSyncTotalJuz}
                      onChange={e => setAutoSyncTotalJuz(e.target.checked)}
                      className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500 border-emerald-300 dark:border-emerald-700 cursor-pointer"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                      Perbarui angka total capaian santri secara otomatis sesuai pilihan ini
                    </span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleSyncSurahsFromJuz}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs transition-colors shadow-2xs shrink-0 cursor-pointer"
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
              <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-750 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  
                  {/* Search Surah */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={surahSearch}
                      onChange={e => setSurahSearch(e.target.value)}
                      placeholder="Cari nama surat (misal: Al-Kahf, Yasin, An-Naba, 18)..."
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800"
                    />
                    {surahSearch && (
                      <button
                        type="button"
                        onClick={() => setSurahSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filter Status Buttons */}
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs shrink-0">
                    <button
                      type="button"
                      onClick={() => setSurahFilterTab('all')}
                      className={`px-2.5 py-1.5 rounded-lg font-semibold text-[11px] transition-all cursor-pointer ${
                        surahFilterTab === 'all'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      Semua (114)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSurahFilterTab('selected')}
                      className={`px-2.5 py-1.5 rounded-lg font-semibold text-[11px] transition-all cursor-pointer ${
                        surahFilterTab === 'selected'
                          ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      Dipilih ({selectedSurahs.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSurahFilterTab('unselected')}
                      className={`px-2.5 py-1.5 rounded-lg font-semibold text-[11px] transition-all cursor-pointer ${
                        surahFilterTab === 'unselected'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      Belum ({114 - selectedSurahs.length})
                    </button>
                  </div>
                </div>

                {/* Quick Pre-sets */}
                <div className="flex items-center justify-between flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mr-1">Pilihan Cepat:</span>
                    <button
                      type="button"
                      onClick={handleSyncSurahsFromJuz}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                      title="Tambahkan semua surat yang ada dalam Juz terpilih"
                    >
                      ⚡ Dari {selectedJuz.length} Juz Terpilih
                    </button>
                    <button
                      type="button"
                      onClick={selectJuzAmmaSurahs}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                    >
                      Juz 'Amma (78-114)
                    </button>
                    <button
                      type="button"
                      onClick={selectPopularSurahs}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                    >
                      Surat Pilihan
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={selectAllSurahs}
                      className="px-2 py-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <button
                      type="button"
                      onClick={clearAllSurahs}
                      className="px-2 py-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-800 cursor-pointer"
                    >
                      Batal Semua
                    </button>
                  </div>
                </div>
              </div>

              {/* Surah List Grid */}
              <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-750 shadow-2xs space-y-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold px-1">
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
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 active:scale-[0.99] cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 shadow-2xs'
                            : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                            {surah.number}
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate leading-tight">
                              {surah.name}
                            </h5>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                              {surah.totalAyahs} Ayat · Juz {juzNumbers.join(', ')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-arabic text-sm text-slate-700 dark:text-slate-300 hidden sm:inline">
                            {surah.arabicName}
                          </span>
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'border border-slate-300 dark:border-slate-600 text-transparent'
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
              <div className="bg-white dark:bg-slate-850 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-750 shadow-2xs space-y-3">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Catatan Keterangan Hafalan Santri
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Catatan ini akan tampil langsung di kartu santri dan mempermudah pemantauan evaluasi ustadz & wali santri.
                  </p>
                </div>

                <textarea
                  value={keteranganHafalan}
                  onChange={e => setKeteranganHafalan(e.target.value)}
                  rows={4}
                  placeholder="Contoh: Sudah tuntas mutqin Juz 30 dan Juz 29. Sedang ziyadah Juz 1 sampai halaman 8 untuk persiapan Tasmi..."
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 resize-none"
                />

                {/* Suggestions Pills */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Contoh Cepat:</span>
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
                        className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                      >
                        + "{snippet}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200/70 dark:border-emerald-800 text-xs space-y-1.5">
                <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span>Ringkasan yang Akan Disimpan:</span>
                </div>
                <p className="text-emerald-950 dark:text-emerald-200 font-medium">
                  • <strong>{selectedJuz.length} Juz Selesai</strong> {selectedJuz.length > 0 ? `(${selectedJuz.join(', ')})` : '(Belum ada)'}
                </p>
                {hasInProgressJuz && (
                  <p className="text-emerald-950 dark:text-emerald-200 font-medium">
                    • <strong>Juz {inProgressJuzNumber} Sedang Berjalan</strong> ({inProgressLembar} Lembar / {inProgressLembar * 2} Halaman)
                  </p>
                )}
                <p className="text-emerald-950 dark:text-emerald-200 font-medium">
                  • <strong>{selectedSurahs.length} Surat Dihafal</strong>
                </p>
                {autoSyncTotalJuz && (
                  <p className="text-emerald-950 dark:text-emerald-200 font-medium">
                    • Total Capaian Santri: <strong>{calculatedTotalJuz} Juz</strong>
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Terpilih: <strong className="text-emerald-800 dark:text-emerald-300">{selectedJuz.length} Juz</strong> & <strong className="text-emerald-800 dark:text-emerald-300">{selectedSurahs.length} Surat</strong>
            {hasInProgressJuz && <span className="ml-1 text-slate-500 dark:text-slate-400">(+Juz {inProgressJuzNumber} sedang berjalan)</span>}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
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
