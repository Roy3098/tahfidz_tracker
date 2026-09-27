import React, { useState } from 'react';
import { useTahfidz } from '../context/TahfidzContext';
import { Santri } from '../types';
import { X, Check, BookOpen, AlertCircle } from 'lucide-react';
import { ALL_SURAHS } from '../data/quranData';

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
  const [lastJuz, setLastJuz] = useState<number>(student.terakhirSetor?.juz || (student.totalJuzMemorized > 0 ? student.totalJuzMemorized : 1));
  const [lastSurah, setLastSurah] = useState<string>(student.terakhirSetor?.surah || 'Al-Baqarah');
  const [lastAyat, setLastAyat] = useState<string>(student.terakhirSetor?.ayat || 'Ayat 1-20');
  const [lastTanggal, setLastTanggal] = useState<string>(student.terakhirSetor?.tanggal || new Date().toISOString().split('T')[0]);

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updatedData: Partial<Santri> = {
      totalJuzMemorized: Math.max(0, Math.min(30, Number(totalJuz))),
      targetJuz: Math.max(1, Math.min(30, Number(targetJuz))),
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
    setSuccessMsg('Status hafalan santri berhasil diperbarui!');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-emerald-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Edit Capaian Hafalan
              </h3>
              <p className="text-xs text-slate-500">
                Santri: <span className="font-semibold text-slate-800">{student.nama}</span> ({student.kelasNama})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p>
              Admin/Guru dapat langsung mengubah jumlah capaian Juz santri dan status posisi hafalan tanpa harus menginput riwayat setoran terlebih dahulu.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Capaian Juz Saat Ini
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={totalJuz}
                  onChange={e => setTotalJuz(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                  Juz
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Rentang: 0 - 30 Juz</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Capaian Santri
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={targetJuz}
                  onChange={e => setTargetJuz(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                  Juz
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Target program halaqah</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Waktu Selesai (Bulan / Tahun)
            </label>
            <input
              type="text"
              value={targetSelesai}
              onChange={e => setTargetSelesai(e.target.value)}
              placeholder="Contoh: Desember 2026, Ramadhan 1448 H..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Toggle Keterangan Setoran / Posisi Terakhir */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span>Catatan Posisi / Setoran Terakhir</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={hasLastSetor}
                  onChange={e => setHasLastSetor(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span>Aktifkan status</span>
              </label>
            </div>

            {hasLastSetor && (
              <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Posisi Juz</label>
                    <select
                      value={lastJuz}
                      onChange={e => setLastJuz(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                        <option key={j} value={j}>Juz {j}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Surah</label>
                    <select
                      value={lastSurah}
                      onChange={e => setLastSurah(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs truncate"
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
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Rentang Ayat</label>
                    <input
                      type="text"
                      value={lastAyat}
                      onChange={e => setLastAyat(e.target.value)}
                      placeholder="Ayat 1-50 / Selesai"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tanggal</label>
                    <input
                      type="date"
                      value={lastTanggal}
                      onChange={e => setLastTanggal(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
