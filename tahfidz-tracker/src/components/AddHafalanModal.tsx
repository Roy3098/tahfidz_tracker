import React, { useState, useEffect } from 'react';
import { useTahfidz } from '../context/TahfidzContext';
import { ALL_SURAHS, getSurahsForJuz } from '../data/quranData';
import { X, CheckCircle, BookOpen } from 'lucide-react';
import { HafalanQuality, HafalanType } from '../types';

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
  const [kualitas, setKualitas] = useState<HafalanQuality>('A');
  const [type, setType] = useState<HafalanType>('baru');
  const [catatan, setCatatan] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

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

  // When surah changes, update default ayat range
  useEffect(() => {
    const s = ALL_SURAHS.find(surah => surah.number === surahNumber);
    if (s) {
      setAyatMulai(1);
      setAyatSelesai(Math.min(s.totalAyahs, 20));
    }
  }, [surahNumber]);

  if (!isOpen) return null;

  const currentSurah = ALL_SURAHS.find(s => s.number === surahNumber);
  const selectedStudent = santriList.find(s => s.id === studentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !selectedStudent) {
      alert('Pilih santri terlebih dahulu.');
      return;
    }

    addHafalanRecord({
      studentId,
      studentName: selectedStudent.nama,
      type,
      category: 'surah',
      juz,
      surahNumber,
      surahName: currentSurah ? currentSurah.name : `Surah ${surahNumber}`,
      ayatMulai,
      ayatSelesai,
      kualitas,
      catatan,
      tanggal
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Tambah Setoran Hafalan</h3>
              <p className="text-xs text-slate-500">Pencatatan hafalan santri dengan rujukan Al-Qur'an</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Santri Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Santri
            </label>
            <select
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              {santriList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nama} ({s.kelasNama} - {s.kelompokNama})
                </option>
              ))}
            </select>
          </div>

          {/* Jenis Hafalan & Tanggal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jenis Hafalan
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as HafalanType)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="baru">Hafalan Baru (Ziyadah)</option>
                <option value="muroja">Muroja'ah (Pengulangan)</option>
                <option value="perbaikan">Perbaikan Tajwid</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tanggal Setoran
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={e => setTanggal(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Juz & Surah Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Juz
              </label>
              <select
                value={juz}
                onChange={e => setJuz(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                  <option key={j} value={j}>
                    Juz {j} {j === 30 ? "('Amma)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Surah
              </label>
              <select
                value={surahNumber}
                onChange={e => setSurahNumber(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {availableSurahs.map(s => (
                  <option key={s.number} value={s.number}>
                    {s.number}. {s.name} ({s.arabicName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ayat Range */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span className="font-semibold text-slate-700">Rentang Ayat</span>
              <span>Total di surah ini: {currentSurah?.totalAyahs || 0} ayat</span>
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
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Kualitas Hafalan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <div className="text-sm font-bold">{opt.val}</div>
                  <div className="text-[10px] text-slate-500 leading-tight">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Catatan Asatidz */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan Ustadz/Ustadzah (Opsional)
            </label>
            <textarea
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              rows={2}
              placeholder="Contoh: Makhraj huruf 'Ain sangat bersih, pertahankan ritme tartil."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-medium text-xs sm:text-sm hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-md transition-colors flex items-center justify-center gap-1.5"
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
