import React, { useState, useEffect } from 'react';
import { useTahfidz } from '../context/TahfidzContext';
import { Santri } from '../types';
import { X, Check, BookOpen, AlertCircle, Plus, Minus, Bookmark, Sparkles } from 'lucide-react';
import { ALL_SURAHS } from '../data/quranData';
import { parseHafalan } from '../utils/hafalanFormat';

interface DirectEditHafalanModalProps {
  isOpen: boolean;
  student: Santri;
  onClose: () => void;
}

export const DirectEditHafalanModal: React.FC<DirectEditHafalanModalProps> = ({
  isOpen,
  student,
  onClose
}) => {
  const { updateSantri } = useTahfidz();

  const [totalJuz, setTotalJuz] = useState<number>(student.totalJuzMemorized);
  const [targetJuz, setTargetJuz] = useState<number>(student.targetJuz);
  const [targetSelesai, setTargetSelesai] = useState<string>(student.targetSelesai || 'Desember 2026');
  
  // Setoran terakhir manual adjustment
  const [hasLastSetor, setHasLastSetor] = useState<boolean>(!!student.terakhirSetor);
  const [lastJuz, setLastJuz] = useState<number>(student.terakhirSetor?.juz || (student.totalJuzMemorized > 0 ? Math.max(1, Math.floor(student.totalJuzMemorized)) : 1));
  const [lastSurah, setLastSurah] = useState<string>(student.terakhirSetor?.surah || 'Al-Baqarah');
  const [lastAyat, setLastAyat] = useState<string>(student.terakhirSetor?.ayat || 'Ayat 1-20');
  const [lastTanggal, setLastTanggal] = useState<string>(student.terakhirSetor?.tanggal || new Date().toISOString().split('T')[0]);

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Mode input: 'decimal' or 'lembar'
  const [inputMode, setInputMode] = useState<'decimal' | 'lembar'>('lembar');

  // Breakdown of current totalJuz
  const breakdown = parseHafalan(totalJuz);

  useEffect(() => {
    setTotalJuz(student.totalJuzMemorized);
    setTargetJuz(student.targetJuz);
    setTargetSelesai(student.targetSelesai || 'Desember 2026');
  }, [student]);

  if (!isOpen) return null;

  // Handlers for Juz & Lembar stepper
  const handleUpdateJuzLembar = (newWholeJuz: number, newLembar: number) => {
    let w = Math.max(0, Math.min(30, newWholeJuz));
    let l = newLembar;

    if (l >= 10) {
      w = Math.min(30, w + Math.floor(l / 10));
      l = l % 10;
    } else if (l < 0) {
      if (w > 0) {
        w -= 1;
        l = 10 + l;
      } else {
        l = 0;
      }
    }

    if (w >= 30) {
      w = 30;
      l = 0;
    }

    const calculated = Math.round((w + l * 0.1) * 10) / 10;
    setTotalJuz(calculated);
  };

  const handleAddPreset = (deltaLembar: number) => {
    const currentLembarTotal = Math.round(totalJuz * 10);
    const newTotal = Math.max(0, Math.min(300, currentLembarTotal + deltaLembar));
    setTotalJuz(Math.round(newTotal) / 10);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const safeTotalJuz = Math.max(0, Math.min(30, Math.round(Number(totalJuz) * 10) / 10));
    const safeTargetJuz = Math.max(1, Math.min(30, Number(targetJuz)));

    const updatedData: Partial<Santri> = {
      totalJuzMemorized: safeTotalJuz,
      targetJuz: safeTargetJuz,
      targetSelesai: targetSelesai.trim() || undefined,
      terakhirSetor: hasLastSetor ? {
        juz: Number(lastJuz),
        surah: lastSurah.trim() || `Juz ${lastJuz}`,
        ayat: lastAyat.trim() || 'Selesai',
        tanggal: lastTanggal
      } : undefined
    };

    updateSantri(student.id, updatedData);
    setIsSaving(false);
    setSuccessMsg('Capaian hafalan santri berhasil diperbarui!');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] text-slate-800 dark:text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-emerald-50/70 dark:bg-emerald-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-tight truncate">
                Edit Capaian Hafalan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Santri: <strong className="text-slate-800 dark:text-slate-200">{student.nama}</strong> ({student.kelasNama})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Rincian Live Preview Banner */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border border-emerald-200/90 dark:border-emerald-800/80 rounded-2xl text-emerald-950 dark:text-emerald-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Format Capaian Terpilih:
              </span>
              <span className="text-base font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                {breakdown.decimalText} Juz
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60 text-slate-700 dark:text-slate-300">
              <span className="font-bold text-emerald-900 dark:text-emerald-200">
                {breakdown.lembarText}
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                {breakdown.halaman > 0 ? `${breakdown.halaman} Halaman Mushaf` : '0 Halaman'}
              </span>
            </div>
          </div>

          {/* Total Hafalan Editor */}
          <div className="space-y-3 bg-slate-50/80 dark:bg-slate-800/60 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Atur Total Hafalan Santri
              </label>
              
              {/* Mode switch */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-750 text-xs">
                <button
                  type="button"
                  onClick={() => setInputMode('lembar')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    inputMode === 'lembar' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  Hitung Juz & Lembar
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('decimal')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    inputMode === 'decimal' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  Input Desimal (1.2)
                </button>
              </div>
            </div>

            {inputMode === 'lembar' ? (
              /* Lembar & Juz Dual Steppers */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* Whole Juz Stepper */}
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Juz Penuh</span>
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateJuzLembar(breakdown.wholeJuz - 1, breakdown.lembar)}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        {breakdown.wholeJuz}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateJuzLembar(breakdown.wholeJuz + 1, breakdown.lembar)}
                        className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">Rentang: 0 - 30</span>
                  </div>

                  {/* Lembar Stepper */}
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                      Lembar Tambahan (0.1)
                    </span>
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateJuzLembar(breakdown.wholeJuz, breakdown.lembar - 1)}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                        {breakdown.lembar}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateJuzLembar(breakdown.wholeJuz, breakdown.lembar + 1)}
                        className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                      {breakdown.lembar * 2} Halaman
                    </span>
                  </div>
                </div>

                {/* Quick Lembar Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mr-1">Aksi Cepat:</span>
                  <button
                    type="button"
                    onClick={() => handleAddPreset(1)}
                    className="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer shadow-2xs"
                  >
                    +1 Lembar (+0.1)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPreset(2)}
                    className="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer shadow-2xs"
                  >
                    +2 Lembar (+0.2)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPreset(5)}
                    className="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer shadow-2xs"
                  >
                    +Setengah Juz (+0.5)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPreset(10)}
                    className="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer shadow-2xs"
                  >
                    +1 Juz (+1.0)
                  </button>
                </div>
              </div>
            ) : (
              /* Direct Decimal Input */
              <div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={30}
                    value={totalJuz}
                    onChange={e => setTotalJuz(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-bold text-emerald-700 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 font-semibold">
                    Juz
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  <span>Contoh: Masukkan 1.2 untuk 1 Juz 2 Lembar</span>
                  <span className="font-semibold text-emerald-800 dark:text-emerald-300">{breakdown.lembarText}</span>
                </div>
              </div>
            )}
          </div>

          {/* Target Santri & Waktu Selesai */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Capaian (Juz)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={30}
                  step="0.5"
                  value={targetJuz}
                  onChange={e => setTargetJuz(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 tabular-nums"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 font-semibold">
                  Juz
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Waktu Selesai
              </label>
              <input
                type="text"
                value={targetSelesai}
                onChange={e => setTargetSelesai(e.target.value)}
                placeholder="Contoh: Desember 2026..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Toggle Keterangan Setoran / Posisi Terakhir */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span>Catatan Setoran / Posisi Terakhir</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={hasLastSetor}
                  onChange={e => setHasLastSetor(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-700 focus:ring-emerald-500"
                />
                <span>Aktifkan status</span>
              </label>
            </div>

            {hasLastSetor && (
              <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Posisi Juz</label>
                    <select
                      value={lastJuz}
                      onChange={e => setLastJuz(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                    >
                      {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                        <option key={j} value={j}>Juz {j}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Surah</label>
                    <select
                      value={lastSurah}
                      onChange={e => setLastSurah(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 truncate"
                    >
                      {ALL_SURAHS.map(s => (
                        <option key={s.number} value={s.name}>
                          {s.number}. {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Rentang Ayat</label>
                    <input
                      type="text"
                      value={lastAyat}
                      onChange={e => setLastAyat(e.target.value)}
                      placeholder="Ayat 1-50 / 2 lembar"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Tanggal</label>
                    <input
                      type="date"
                      value={lastTanggal}
                      onChange={e => setLastTanggal(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {isSaving ? 'Menyimpan...' : 'Simpan Capaian'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
