import React, { useState, useEffect } from 'react';
import { useTahfidz } from '../context/TahfidzContext';
import { ALL_SURAHS, getSurahsForJuz, calculateUtsmaniHalamanDanLembar, getUtsmaniPage } from '../data/quranData';
import { X, CheckCircle, BookOpen, AlertCircle, Bookmark, Layers, CheckCircle2, Clock } from 'lucide-react';
import { HafalanQuality, HafalanType } from '../types';
import { parseHafalan } from '../utils/hafalanFormat';

interface AddHafalanModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedStudentId?: string;
}

export const AddHafalanModal: React.FC<AddHafalanModalProps> = ({
  isOpen,
  onClose,
  preselectedStudentId
}) => {
  const { santriList, addHafalanRecord } = useTahfidz();

  const [studentId, setStudentId] = useState(preselectedStudentId || santriList[0]?.id || '');
  const [juz, setJuz] = useState<number>(1);
  const [surahNumber, setSurahNumber] = useState<number>(1);
  const [ayatMulai, setAyatMulai] = useState<number>(1);
  const [ayatSelesai, setAyatSelesai] = useState<number>(7);
  const [targetHalaman, setTargetHalaman] = useState<number>(1);
  const [kualitas, setKualitas] = useState<HafalanQuality>('A');
  const [type, setType] = useState<HafalanType>('baru');
  const [catatan, setCatatan] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Update studentId when preselectedStudentId changes
  useEffect(() => {
    if (preselectedStudentId) {
      setStudentId(preselectedStudentId);
    }
  }, [preselectedStudentId]);

  // When Juz changes, get available surahs for that Juz
  const availableSurahs = getSurahsForJuz(juz);

  useEffect(() => {
    if (availableSurahs.length > 0) {
      setSurahNumber(availableSurahs[0].number);
    }
  }, [juz]);

  // When surah changes, update default ayat range and sync target halaman
  useEffect(() => {
    const s = ALL_SURAHS.find(surah => surah.number === surahNumber);
    if (s) {
      setAyatMulai(1);
      const totalPages = Math.max(1, s.endPage - s.startPage + 1);
      const ayahsPerPage = Math.max(1, Math.round(s.totalAyahs / totalPages));
      setAyatSelesai(Math.min(s.totalAyahs, ayahsPerPage));
      setTargetHalaman(s.startPage);
    }
  }, [surahNumber]);

  // Synchronize Halaman & Lembar Standar Mushaf Rasm Utsmani
  const currentSurah = ALL_SURAHS.find(s => s.number === surahNumber);
  const utsmaniData = calculateUtsmaniHalamanDanLembar({
    surahNumber,
    ayatMulai,
    ayatSelesai
  });

  // Calculate page fraction to know if santri completed 1 full page or partial
  const totalPagesInSurah = currentSurah ? Math.max(1, currentSurah.endPage - currentSurah.startPage + 1) : 1;
  const ayatCount = Math.max(1, ayatSelesai - ayatMulai + 1);
  const pageFraction = currentSurah ? Number(((ayatCount * totalPagesInSurah) / currentSurah.totalAyahs).toFixed(2)) : 1;
  const isFullPageOrMore = pageFraction >= 0.95 || (utsmaniData.halamanSelesai - utsmaniData.halamanMulai >= 1);

  if (!isOpen) return null;

  const selectedStudent = santriList.find(s => s.id === studentId);
  const studentBreakdown = selectedStudent ? parseHafalan(selectedStudent.totalJuzMemorized) : null;

  // Handler to set exactly 1 full page for current surah
  const handleSetOneFullPage = () => {
    if (!currentSurah) return;
    const totalPages = Math.max(1, currentSurah.endPage - currentSurah.startPage + 1);
    const ayahsPerPage = Math.max(1, Math.round(currentSurah.totalAyahs / totalPages));
    setAyatMulai(1);
    setAyatSelesai(Math.min(currentSurah.totalAyahs, ayahsPerPage));
  };

  // Handler to set full surah
  const handleSetFullSurah = () => {
    if (!currentSurah) return;
    setAyatMulai(1);
    setAyatSelesai(currentSurah.totalAyahs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !selectedStudent) {
      setErrorMessage('Pilih santri terlebih dahulu.');
      return;
    }

    addHafalanRecord({
      studentId,
      studentName: selectedStudent.nama,
      type,
      category: 'surah',
      juz: utsmaniData.juzEstimate || juz,
      surahNumber,
      surahName: currentSurah ? currentSurah.name : `Surah ${surahNumber}`,
      ayatMulai,
      ayatSelesai,
      halaman: utsmaniData.totalHalaman,
      lembar: utsmaniData.totalLembar,
      kualitas,
      catatan: catatan.trim(),
      tanggal
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] text-slate-800 dark:text-slate-100 transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight">Tambah Setoran Hafalan</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Pencatatan hafalan santri rujukan Al-Qur'an</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Santri Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Santri
              </label>
              {studentBreakdown && (
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <Bookmark className="w-3 h-3" />
                  Total: {studentBreakdown.decimalText} Juz ({studentBreakdown.lembarText})
                </span>
              )}
            </div>
            <select
              value={studentId}
              onChange={e => {
                setStudentId(e.target.value);
                setErrorMessage(null);
              }}
              className="w-full px-3 sm:px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              {santriList.map(s => {
                const b = parseHafalan(s.totalJuzMemorized);
                return (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.kelasNama} · {b.decimalText} Juz / {b.lembarText})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Jenis Hafalan & Tanggal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Jenis Hafalan
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as HafalanType)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="baru">Hafalan Baru (Ziyadah)</option>
                <option value="muroja">Muroja'ah (Pengulangan)</option>
                <option value="perbaikan">Perbaikan Tajwid</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tanggal Setoran
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={e => setTanggal(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Juz & Surah Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Juz
              </label>
              <select
                value={juz}
                onChange={e => setJuz(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                  <option key={j} value={j}>
                    Juz {j} {j === 30 ? "('Amma)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Surah
              </label>
              <select
                value={surahNumber}
                onChange={e => setSurahNumber(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {availableSurahs.map(s => (
                  <option key={s.number} value={s.number}>
                    {s.number}. {s.name} ({s.arabicName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ayat Range with Quick Shortcuts */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5 flex-wrap gap-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Rentang Ayat</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSetOneFullPage}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                  title="Otomatis pilih ayat setara 1 halaman penuh di surah ini"
                >
                  Setoran 1 Hal. Penuh
                </button>
                <button
                  type="button"
                  onClick={handleSetFullSurah}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors"
                  title="Pilih seluruh ayat dalam surah ini"
                >
                  Seluruh Surah ({currentSurah?.totalAyahs || 0} ayat)
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  min={1}
                  max={currentSurah?.totalAyahs || 286}
                  value={ayatMulai}
                  onChange={e => setAyatMulai(Number(e.target.value))}
                  placeholder="Mulai ayat"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  required
                />
              </div>
              <div>
                <input
                  type="number"
                  min={ayatMulai}
                  max={currentSurah?.totalAyahs || 286}
                  value={ayatSelesai}
                  onChange={e => setAyatSelesai(Number(e.target.value))}
                  placeholder="Sampai ayat"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  required
                />
              </div>
            </div>
          </div>

          {/* SINKRONISASI MUSHAF RASM UTSMANI: HALAMAN, LEMBAR, DAN STATUS KELENGKAPAN */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-blue-50/80 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/40 rounded-2xl border border-emerald-200/90 dark:border-emerald-800/80 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Mushaf Rasm Utsmani Madinah
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300 dark:border-emerald-700">
                      Tersinkron Otomatis
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {currentSurah?.name} (Ayat {ayatMulai} - {ayatSelesai})
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                  <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>+{utsmaniData.totalLembar} Lembar (+{(utsmaniData.totalLembar * 0.1).toFixed(1)} Juz)</span>
                </span>
              </div>
            </div>

            {/* Grid Detail Halaman & Lembar */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-emerald-200/70 dark:border-emerald-800/60">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                  Halaman Mushaf:
                </span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm block">
                  {utsmaniData.halamanMulai === utsmaniData.halamanSelesai
                    ? `Hal. ${utsmaniData.halamanMulai}`
                    : `Hal. ${utsmaniData.halamanMulai} - ${utsmaniData.halamanSelesai}`}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block">
                  Cakupan: ~{pageFraction} Halaman
                </span>
              </div>

              <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-emerald-200/70 dark:border-emerald-800/60">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                  Lembar Mushaf:
                </span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm block">
                  Lembar ke-{utsmaniData.lembarMulai}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block">
                  1 Lembar = 2 Halaman
                </span>
              </div>
            </div>

            {/* Indicator: Apakah sudah genap 1 halaman baru atau belum? */}
            <div className={`p-2.5 rounded-xl border flex items-start gap-2 text-xs ${
              isFullPageOrMore
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
            }`}>
              {isFullPageOrMore ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="leading-tight">
                {isFullPageOrMore ? (
                  <>
                    <strong className="block font-bold">
                      ✓ Sudah 1 Halaman Penuh Baru ({utsmaniData.totalHalaman} Halaman · {utsmaniData.totalLembar} Lembar)
                    </strong>
                    <span className="text-[11px] opacity-90">
                      Progres total hafalan santri akan bertambah +{utsmaniData.totalLembar} Lembar (+{(utsmaniData.totalHalaman * 0.05).toFixed(2)} Juz).
                    </span>
                  </>
                ) : (
                  <>
                    <strong className="block font-bold">
                      ⏳ Belum Genap 1 Halaman ({Math.round(pageFraction * 100)}% dari 1 Halaman)
                    </strong>
                    <span className="text-[11px] opacity-90">
                      Setoran tersimpan. Progres baru akan bertambah setelah santri menyelesaikan genap 1 halaman penuh.
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Kualitas Hafalan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Kualitas Hafalan
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: 'A' as HafalanQuality, label: 'A - Sangat Baik', desc: 'Lancar & tajwid' },
                { val: 'B' as HafalanQuality, label: 'B - Baik', desc: '1-2 kesalahan' },
                { val: 'C' as HafalanQuality, label: 'C - Cukup', desc: 'Perlu pengulangan' },
                { val: 'D' as HafalanQuality, label: 'D - Kurang', desc: 'Perlu bimbingan' }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setKualitas(opt.val)}
                  className={`p-2 rounded-xl text-center border transition-all ${
                    kualitas === opt.val
                      ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className="text-sm font-bold">{opt.val}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Catatan Asatidz */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Catatan Ustadz/Ustadzah (Opsional)
            </label>
            <textarea
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              rows={2}
              placeholder="Contoh: Makhraj huruf 'Ain sangat bersih, pertahankan ritme tartil."
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-1.5 active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              Simpan Setoran
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
