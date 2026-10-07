import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  X, 
  Save, 
  Award, 
  Layers, 
  ChevronDown,
  ChevronUp,
  Calendar
} from 'lucide-react';
import { AttendanceRecord, HafalanQuality, HafalanType, Santri, HafalanEntry } from '../types';
import {
  ALL_SURAHS,
  getSurahsForJuz,
  calculateUtsmaniHalamanDanLembar,
  getAyahCountForOnePage,
  resolveSurahMeta
} from '../data/quranData';
import { parseHafalan } from '../utils/hafalanFormat';

interface PencatatanSetoranModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  student: Santri | null;
  onSave: (
    attendanceId: string,
    hafalan: Omit<HafalanEntry, 'id' | 'studentId' | 'studentName' | 'ustadzName'> & { 
      tanggal?: string; 
      lembar?: number; 
      halaman?: number; 
    },
    catatanPerilaku?: string
  ) => void;
}

export const PencatatanSetoranModal: React.FC<PencatatanSetoranModalProps> = ({
  isOpen,
  onClose,
  record,
  student,
  onSave
}) => {
  const [hafalanType, setHafalanType] = useState<HafalanType>('baru');
  const [juz, setJuz] = useState<number>(1);
  const [surahNumber, setSurahNumber] = useState<number>(1);
  const [surahSampaiNumber, setSurahSampaiNumber] = useState<number>(1);
  const [murojaahMode, setMurojaahMode] = useState<'surah_range' | 'single_surah'>('surah_range');
  const [ayatMulai, setAyatMulai] = useState<number>(1);
  const [ayatSelesai, setAyatSelesai] = useState<number>(7);
  const [kualitas, setKualitas] = useState<HafalanQuality>('A');
  const [catatan, setCatatan] = useState<string>('');
  const [isMushafDetailOpen, setIsMushafDetailOpen] = useState<boolean>(false);

  useEffect(() => {
    if (record) {
      const existing = record.hafalanDeposit;
      const resolvedExistingSurah = existing ? resolveSurahMeta(existing.surahNumber, existing.surahName, existing.juz) : undefined;
      const defaultJuz = existing?.juz || student?.inProgressJuz?.juzNumber || (student?.totalJuzMemorized ? Math.min(30, Math.floor(student.totalJuzMemorized) + 1) : 1);
      const surahsInJuz = getSurahsForJuz(defaultJuz);
      const defaultSurah = resolvedExistingSurah?.number || existing?.surahNumber || student?.inProgressJuz?.surahNumber || surahsInJuz[0]?.number || 1;
      const surahMeta = ALL_SURAHS.find(s => s.number === defaultSurah);
      const onePageAyahs = surahMeta ? getAyahCountForOnePage(surahMeta) : 7;

      setHafalanType(existing?.type || 'baru');
      setJuz(defaultJuz);
      setSurahNumber(defaultSurah);
      setSurahSampaiNumber(existing?.surahSampaiNumber || defaultSurah);
      setMurojaahMode('surah_range');
      setAyatMulai(existing?.ayatMulai || 1);
      setAyatSelesai(existing?.ayatSelesai || onePageAyahs);
      setKualitas(existing?.kualitas || 'A');
      setCatatan(existing?.catatan || '');
      setIsMushafDetailOpen(false);
    }
  }, [record, student, isOpen]);

  if (!isOpen || !record) return null;

  const surahsForDraftJuz = getSurahsForJuz(juz);
  const isMurojaahRange = hafalanType === 'muroja' && murojaahMode === 'surah_range';

  // Perhitungan Data Halaman & Lembar Mushaf Utsmani secara Realtime & Otomatis
  const utsmaniData = calculateUtsmaniHalamanDanLembar({
    surahNumber,
    ayatMulai,
    ayatSelesai,
    surahSampaiNumber: isMurojaahRange ? surahSampaiNumber : undefined
  });

  const handleJuzChange = (newJuz: number) => {
    setJuz(newJuz);
    const surahs = getSurahsForJuz(newJuz);
    const firstSurah = surahs[0]?.number || 1;
    const lastSurah = surahs[surahs.length - 1]?.number || firstSurah;
    const meta = ALL_SURAHS.find(s => s.number === firstSurah);

    setSurahNumber(firstSurah);
    setSurahSampaiNumber(lastSurah);
    setAyatMulai(1);
    setAyatSelesai(
      hafalanType === 'baru' && meta
        ? getAyahCountForOnePage(meta)
        : (meta?.totalAyahs || 7)
    );
  };

  const handleSurahChange = (newNum: number) => {
    setSurahNumber(newNum);
    const meta = ALL_SURAHS.find(s => s.number === newNum);
    setAyatMulai(1);
    setAyatSelesai(
      hafalanType === 'baru' && meta
        ? getAyahCountForOnePage(meta)
        : (meta?.totalAyahs || 7)
    );
    if (surahSampaiNumber < newNum) {
      setSurahSampaiNumber(newNum);
    }
  };

  const activeSurahMeta = ALL_SURAHS.find(s => s.number === surahNumber);
  const ayahsPerOnePage = activeSurahMeta ? getAyahCountForOnePage(activeSurahMeta) : 7;

  const handleSetHalfPage = () => {
    if (!activeSurahMeta) return;
    const halfCount = Math.max(1, Math.floor(ayahsPerOnePage / 2));
    setAyatMulai(1);
    setAyatSelesai(Math.min(activeSurahMeta.totalAyahs, halfCount));
  };

  const handleSetOneFullPage = () => {
    if (!activeSurahMeta) return;
    const start = Math.max(1, ayatMulai || 1);
    const end = Math.min(activeSurahMeta.totalAyahs, start + ayahsPerOnePage - 1);
    setAyatMulai(start);
    setAyatSelesai(end);
  };

  const handleSetTwoFullPages = () => {
    if (!activeSurahMeta) return;
    const start = Math.max(1, ayatMulai || 1);
    const end = Math.min(activeSurahMeta.totalAyahs, start + ayahsPerOnePage * 2 - 1);
    setAyatMulai(start);
    setAyatSelesai(end);
  };

  const handleSetFullSurah = () => {
    if (!activeSurahMeta) return;
    setAyatMulai(1);
    setAyatSelesai(activeSurahMeta.totalAyahs);
  };

  const handleSave = () => {
    const surahMeta = ALL_SURAHS.find(s => s.number === surahNumber);
    const surahSampaiMeta = ALL_SURAHS.find(s => s.number === surahSampaiNumber);

    let finalSurahName = surahMeta ? surahMeta.name : `Surah ${surahNumber}`;
    if (isMurojaahRange && surahSampaiMeta) {
      if (surahSampaiMeta.number !== surahNumber) {
        finalSurahName = `${surahMeta?.name || `Surah ${surahNumber}`} s/d ${surahSampaiMeta.name}`;
      }
    }

    // Menggunakan data lembar & halaman hasil kalkulasi otomatis Mushaf Utsmani
    const effectiveLembar = utsmaniData.totalLembar;
    const effectiveHalaman = utsmaniData.totalHalaman;

    onSave(
      record.id,
      {
        type: hafalanType,
        category: 'surah',
        juz: isMurojaahRange ? juz : (utsmaniData.juzEstimate || juz),
        surahNumber,
        surahName: finalSurahName,
        ayatMulai,
        ayatSelesai,
        lembar: effectiveLembar,
        halaman: effectiveHalaman,
        kualitas,
        catatan: catatan.trim(),
        tanggal: record.tanggal
      }
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 w-full max-w-xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-150 max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-white shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">
                Pencatatan Setoran Hafalan Sesi Ini
              </h3>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Input setoran santri di halaqah & sinkronkan langsung ke dashboard
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          
          {/* Info Santri & Sesi Card (Dirapihkan) */}
          {(() => {
            const breakdown = student ? parseHafalan(student.totalJuzMemorized) : null;
            return (
              <div className="p-3.5 sm:p-4 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/70 space-y-2.5 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {record.studentName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider block">
                        Santri yang Menyetor
                      </span>
                      <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 block truncate">
                        {record.studentName}
                      </span>
                      {student && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                          {student.kelompokNama} · {student.kelasNama}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 border border-emerald-200/80 dark:border-emerald-800 text-[11px] self-start sm:self-center shrink-0 shadow-2xs">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{record.sessionName} · {record.tanggal}</span>
                  </div>
                </div>

                {student && breakdown && (
                  <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span>Capaian Saat Ini:</span>
                      <strong className="text-emerald-800 dark:text-emerald-300 font-bold">
                        {breakdown.decimalText} Juz ({breakdown.lembarText})
                      </strong>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span>Target Hafalan:</span>
                      <strong className="text-slate-900 dark:text-slate-100 font-bold">
                        {student.targetJuz} Juz
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Jenis Setoran Tabs */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Jenis Setoran Hafalan:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { key: 'baru', label: 'Hafalan Baru (Ziyadah)' },
                  { key: 'muroja', label: "Muroja'ah" },
                  { key: 'perbaikan', label: 'Perbaikan / Tahsin' }
                ] as const
              ).map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setHafalanType(item.key)}
                  className={`p-2.5 rounded-xl border text-center font-semibold text-xs transition-all cursor-pointer ${
                    hafalanType === item.key
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs font-bold'
                      : 'border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Opsi Khusus Muroja'ah Format */}
          {hafalanType === 'muroja' && (
            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Format Muroja'ah:</span>
              </span>
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs">
                <button
                  type="button"
                  onClick={() => setMurojaahMode('surah_range')}
                  className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                    murojaahMode === 'surah_range'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700'
                  }`}
                >
                  Dari Surat A s/d Surat B
                </button>
                <button
                  type="button"
                  onClick={() => setMurojaahMode('single_surah')}
                  className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                    murojaahMode === 'single_surah'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700'
                  }`}
                >
                  Satu Surat & Ayat
                </button>
              </div>
            </div>
          )}

          {/* Form Input Detail Hafalan: Juz, Surat, Ayat */}
          {isMurojaahRange ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Pilih Juz Acuan:
                </label>
                <select
                  value={juz}
                  onChange={e => handleJuzChange(Number(e.target.value))}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                    <option key={j} value={j}>Juz {j}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                {/* Dari Surat A */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-emerald-950 dark:text-emerald-200">
                    Dari Surat (Surat A):
                  </label>
                  <select
                    value={surahNumber}
                    onChange={e => handleSurahChange(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-slate-100 truncate focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <optgroup label={`Surah di Juz ${juz}`}>
                      {surahsForDraftJuz.map(s => (
                        <option key={`start-juz-${s.number}`} value={s.number}>
                          {s.number}. {s.name} ({s.totalAyahs} ayat)
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Seluruh Surah Al-Qur'an (1 - 114)">
                      {ALL_SURAHS.map(s => (
                        <option key={`start-all-${s.number}`} value={s.number}>
                          {s.number}. {s.name} ({s.totalAyahs} ayat)
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">Mulai Ayat:</span>
                    <input
                      type="number"
                      min={1}
                      value={ayatMulai}
                      onChange={e => setAyatMulai(Number(e.target.value))}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Sampai Surat B */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-emerald-950 dark:text-emerald-200">
                    Sampai Surat (Surat B):
                  </label>
                  <select
                    value={surahSampaiNumber}
                    onChange={e => {
                      const newEnd = Number(e.target.value);
                      const meta = ALL_SURAHS.find(s => s.number === newEnd);
                      setSurahSampaiNumber(newEnd);
                      setAyatSelesai(meta?.totalAyahs || 7);
                    }}
                    className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-slate-100 truncate focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <optgroup label={`Surah di Juz ${juz}`}>
                      {surahsForDraftJuz.map(s => (
                        <option key={`end-juz-${s.number}`} value={s.number}>
                          {s.number}. {s.name} ({s.totalAyahs} ayat)
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Seluruh Surah Al-Qur'an (1 - 114)">
                      {ALL_SURAHS.map(s => (
                        <option key={`end-all-${s.number}`} value={s.number}>
                          {s.number}. {s.name} ({s.totalAyahs} ayat)
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">Sampai Ayat:</span>
                    <input
                      type="number"
                      min={1}
                      value={ayatSelesai}
                      onChange={e => setAyatSelesai(Number(e.target.value))}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Standar View: Juz, Surah, Ayat */
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Pilih Juz:
                  </label>
                  <select
                    value={juz}
                    onChange={e => handleJuzChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                      <option key={j} value={j}>Juz {j}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Pilih Surah:
                  </label>
                  <select
                    value={surahNumber}
                    onChange={e => handleSurahChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 truncate"
                  >
                    <optgroup label={`Surah di Juz ${juz}`}>
                      {surahsForDraftJuz.map(s => (
                        <option key={s.number} value={s.number}>
                          {s.number}. {s.name} ({s.totalAyahs} ayat)
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Seluruh Surah Al-Qur'an (1 - 114)">
                      {ALL_SURAHS.map(s => (
                        <option key={`all-${s.number}`} value={s.number}>
                          {s.number}. {s.name} ({s.totalAyahs} ayat)
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Ayat Range + Quick Page Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Rentang Ayat Setoran:
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={handleSetHalfPage}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                      title="Pilih setengah halaman (belum genap 1 halaman penuh)"
                    >
                      ½ Hal.
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAyatMulai(1);
                        if (activeSurahMeta) {
                          setAyatSelesai(Math.min(activeSurahMeta.totalAyahs, ayahsPerOnePage));
                        }
                      }}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                      title="Pilih ayat setara 1 halaman penuh (+0.5 Lembar)"
                    >
                      1 Hal. (+0.5 Lbr)
                    </button>
                    <button
                      type="button"
                      onClick={handleSetTwoFullPages}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors cursor-pointer"
                      title="Pilih ayat setara 2 halaman penuh (+1 Lembar)"
                    >
                      2 Hal. (+1 Lbr)
                    </button>
                    <button
                      type="button"
                      onClick={handleSetFullSurah}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Pilih seluruh ayat dalam surah ini"
                    >
                      1 Surah ({activeSurahMeta?.totalAyahs || 0} ayat)
                    </button>
                  </div>
                </div>

                {record.hafalanDeposit && record.hafalanDeposit.type === 'baru' && (
                  <div className="p-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/70 flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-blue-800 dark:text-blue-300 font-medium truncate">
                      Tercatat: <strong>{record.hafalanDeposit.surahName} Ayat {record.hafalanDeposit.ayatMulai}-{record.hafalanDeposit.ayatSelesai}</strong>
                    </span>
                    {activeSurahMeta && (record.hafalanDeposit.ayatSelesai || 0) < activeSurahMeta.totalAyahs && (
                      <button
                        type="button"
                        onClick={() => {
                          const prevStart = record.hafalanDeposit?.ayatMulai || 1;
                          const prevEnd = record.hafalanDeposit?.ayatSelesai || 1;
                          const nextTarget = Math.min(
                            activeSurahMeta.totalAyahs,
                            Math.max(prevEnd + 1, prevStart + ayahsPerOnePage - 1)
                          );
                          setAyatMulai(prevStart);
                          setAyatSelesai(nextTarget);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] shrink-0 transition-colors cursor-pointer"
                      >
                        + Genapkan 1 Halaman
                      </button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Mulai Ayat:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={activeSurahMeta?.totalAyahs || 286}
                      value={ayatMulai}
                      onChange={e => setAyatMulai(Number(e.target.value))}
                      placeholder="1"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Sampai Ayat:
                    </label>
                    <input
                      type="number"
                      min={ayatMulai}
                      max={activeSurahMeta?.totalAyahs || 286}
                      value={ayatSelesai}
                      onChange={e => setAyatSelesai(Number(e.target.value))}
                      placeholder="Akhir"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DATA HALAMAN & LEMBAR MUSHAF UTSMANI - DISEMBUNYIKAN DENGAN DROPDOWN */}
          <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-blue-50/80 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/40 rounded-2xl border border-emerald-200/90 dark:border-emerald-800/80 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsMushafDetailOpen(prev => !prev)}
              className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-2 text-left hover:bg-emerald-100/40 dark:hover:bg-emerald-900/20 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Keterangan Mushaf Rasm Utsmani Madinah
                    </h4>
                  </div>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium block truncate">
                    {utsmaniData.halamanMulai === utsmaniData.halamanSelesai
                      ? `Hal. ${utsmaniData.halamanMulai}`
                      : `Hal. ${utsmaniData.halamanMulai} - ${utsmaniData.halamanSelesai}`}{' '}
                    {utsmaniData.isPartialPage
                      ? `(${Math.round(utsmaniData.exactPages * 100)}% Hal · Belum genap 1 halaman penuh)`
                      : `(${utsmaniData.completedFullPages} Hal. Penuh · +${utsmaniData.totalLembar} Lembar)`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold text-xs border shadow-2xs ${
                  utsmaniData.isPartialPage
                    ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                    : 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                }`}>
                  <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{utsmaniData.isPartialPage ? `Tabungan ${Math.round(utsmaniData.exactPages * 100)}% Hal` : `+${utsmaniData.totalLembar} Lbr`}</span>
                </span>
                <div className="w-7 h-7 rounded-lg bg-white/80 dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                  {isMushafDetailOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </button>

            {isMushafDetailOpen && (
              <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60 space-y-2.5 animate-in fade-in duration-150">
                {/* 3 Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1.5 text-xs">
                  <div className="bg-white/80 dark:bg-slate-850/80 p-2.5 rounded-xl border border-emerald-200/70 dark:border-emerald-800/60 shadow-2xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                      Halaman Mushaf:
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm block">
                      {utsmaniData.halamanMulai === utsmaniData.halamanSelesai
                        ? `Hal. ${utsmaniData.halamanMulai}`
                        : `Hal. ${utsmaniData.halamanMulai} - ${utsmaniData.halamanSelesai}`}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">
                      {utsmaniData.totalHalaman} Halaman
                    </span>
                  </div>

                  <div className="bg-white/80 dark:bg-slate-850/80 p-2.5 rounded-xl border border-emerald-200/70 dark:border-emerald-800/60 shadow-2xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                      Jumlah Lembar Fisik:
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm block">
                      {utsmaniData.totalLembar} Lembar
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium block mt-0.5">
                      {utsmaniData.lembarMulai === utsmaniData.lembarSelesai
                        ? `Lembar ke-${utsmaniData.lembarMulai}`
                        : `Lembar ${utsmaniData.lembarMulai} - ${utsmaniData.lembarSelesai}`} (dari 302)
                    </span>
                  </div>

                  <div className="bg-white/80 dark:bg-slate-850/80 p-2.5 rounded-xl border border-emerald-200/70 dark:border-emerald-800/60 shadow-2xs col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                      Cakupan Juz Utsmani:
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm block">
                      Juz {utsmaniData.juzEstimate || juz}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                      Standar Madinah 604 Hal
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed pt-0.5">
                  💡 <em>Standar Mushaf Rasm Utsmani: 1 Lembar = 2 Halaman (0.1 Juz). Progres capaian dan peringkat santri di dasbor bertambah secara otomatis sesuai lembar Al-Qur'an ini.</em>
                </p>
              </div>
            )}
          </div>

          {/* Nilai Setoran & Catatan Ustadz */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Nilai Kualitas:</span>
              </label>
              <select
                value={kualitas}
                onChange={e => setKualitas(e.target.value as HafalanQuality)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="A">Nilai A (Mumtaz - Sangat Lancar)</option>
                <option value="B">Nilai B (Jayyid - Lancar)</option>
                <option value="C">Nilai C (Maqbul - Cukup)</option>
                <option value="D">Nilai D (Ulang / Perlu Bimbingan)</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Catatan Tajwid / Hafalan (Opsional):
              </label>
              <input
                type="text"
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                placeholder="Contoh: Makhraj huruf tertib, perhatikan hukum mad jaiz..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Setoran Hafalan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
