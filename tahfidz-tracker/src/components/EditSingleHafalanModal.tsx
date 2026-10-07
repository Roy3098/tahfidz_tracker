import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  BookOpen, 
  Trash2, 
  Calendar, 
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { Santri, HafalanEntry, HafalanQuality, HafalanType } from '../types';
import { ALL_SURAHS, getSurahsForJuz } from '../data/quranData';
import { getTodayWIB } from '../utils/dateWIB';

interface EditSingleHafalanModalProps {
  isOpen: boolean;
  student: Santri;
  record: HafalanEntry;
  onClose: () => void;
  onSave: (updatedData: Partial<HafalanEntry>) => void;
  onDelete: () => void;
}

export const EditSingleHafalanModal: React.FC<EditSingleHafalanModalProps> = ({
  isOpen,
  student,
  record,
  onClose,
  onSave,
  onDelete
}) => {
  if (!isOpen) return null;

  // Determine initial state
  const isMurojaahRangeInitial = record.type === 'muroja' && record.surahName.includes(' s/d ');

  // Parse surah names if it was a range
  let initialSurahA = record.surahNumber || 1;
  let initialSurahB = record.surahNumber || 1;

  if (isMurojaahRangeInitial) {
    const parts = record.surahName.split(' s/d ');
    if (parts.length === 2) {
      const matchA = ALL_SURAHS.find(s => s.name.toLowerCase() === parts[0].trim().toLowerCase());
      const matchB = ALL_SURAHS.find(s => s.name.toLowerCase() === parts[1].trim().toLowerCase());
      if (matchA) initialSurahA = matchA.number;
      if (matchB) initialSurahB = matchB.number;
    }
  }

  const [juz, setJuz] = useState<number>(record.juz || 1);
  const [type, setType] = useState<HafalanType>(record.type || 'baru');
  const [murojaahMode, setMurojaahMode] = useState<'surah_range' | 'single_surah'>(
    isMurojaahRangeInitial ? 'surah_range' : 'single_surah'
  );
  const [surahNumber, setSurahNumber] = useState<number>(initialSurahA);
  const [surahSampaiNumber, setSurahSampaiNumber] = useState<number>(initialSurahB);
  const [ayatMulai, setAyatMulai] = useState<number>(record.ayatMulai || 1);
  const [ayatSelesai, setAyatSelesai] = useState<number>(record.ayatSelesai || 7);
  const [kualitas, setKualitas] = useState<HafalanQuality>(record.kualitas || 'A');
  const [tanggal, setTanggal] = useState<string>(record.tanggal || getTodayWIB());
  const [catatan, setCatatan] = useState<string>(record.catatan || '');
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  const surahsInJuz = getSurahsForJuz(juz);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalSurahName = '';
    const sMetaA = ALL_SURAHS.find(s => s.number === surahNumber);
    const sMetaB = ALL_SURAHS.find(s => s.number === surahSampaiNumber);

    if (type === 'muroja' && murojaahMode === 'surah_range') {
      const nameA = sMetaA?.name || `Surah ${surahNumber}`;
      const nameB = sMetaB?.name || `Surah ${surahSampaiNumber}`;
      if (surahNumber !== surahSampaiNumber) {
        finalSurahName = `${nameA} s/d ${nameB}`;
      } else {
        finalSurahName = nameA;
      }
    } else {
      finalSurahName = sMetaA?.name || `Surah ${surahNumber}`;
    }

    onSave({
      juz,
      type,
      surahNumber,
      surahName: finalSurahName,
      ayatMulai: Number(ayatMulai),
      ayatSelesai: Number(ayatSelesai),
      kualitas,
      tanggal,
      catatan: catatan.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 border border-emerald-200 dark:border-emerald-800">
              {student.nama.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">
                Edit Catatan Hafalan
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                Santri: <strong className="text-slate-800 dark:text-slate-200">{student.nama}</strong> ({student.kelasNama})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1">
          
          {/* Jenis Setoran */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Jenis Setoran
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
              {(['baru', 'muroja', 'perbaikan'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    type === t
                      ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {t === 'baru' ? 'Hafalan Baru' : t === 'muroja' ? "Muroja'ah" : 'Perbaikan'}
                </button>
              ))}
            </div>
          </div>

          {/* Format Muroja'ah jika memilih Muroja'ah */}
          {type === 'muroja' && (
            <div className="p-2.5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  Format Muroja'ah:
                </span>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setMurojaahMode('surah_range')}
                    className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                      murojaahMode === 'surah_range'
                        ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-300'
                    }`}
                  >
                    Dari Surat A s/d Surat B
                  </button>
                  <button
                    type="button"
                    onClick={() => setMurojaahMode('single_surah')}
                    className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                      murojaahMode === 'single_surah'
                        ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-300'
                    }`}
                  >
                    Satu Surat & Ayat
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Juz Acuan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Juz
            </label>
            <select
              value={juz}
              onChange={e => {
                const newJuz = Number(e.target.value);
                const sInJuz = getSurahsForJuz(newJuz);
                setJuz(newJuz);
                if (sInJuz[0]) {
                  setSurahNumber(sInJuz[0].number);
                  setSurahSampaiNumber(sInJuz[sInJuz.length - 1]?.number || sInJuz[0].number);
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
            >
              {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                <option key={j} value={j}>Juz {j}</option>
              ))}
            </select>
          </div>

          {/* Surah Inputs */}
          {type === 'muroja' && murojaahMode === 'surah_range' ? (
            <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-950 dark:text-emerald-300 mb-1">
                    Dari Surat (Surat A):
                  </label>
                  <select
                    value={surahNumber}
                    onChange={e => setSurahNumber(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                  >
                    <optgroup label={`Surah di Juz ${juz}`}>
                      {surahsInJuz.map(s => (
                        <option key={`edit-start-${s.number}`} value={s.number}>
                          {s.number}. {s.name} ({s.totalAyahs} ayat)
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Seluruh Surah Al-Qur'an (1 - 114)">
                      {ALL_SURAHS.map(s => (
                        <option key={`edit-all-start-${s.number}`} value={s.number}>
                          {s.number}. {s.name} ({s.totalAyahs} ayat)
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-950 dark:text-emerald-300 mb-1">
                    Sampai Surat (Surat B):
                  </label>
                  <select
                    value={surahSampaiNumber}
                    onChange={e => setSurahSampaiNumber(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                  >
                    <optgroup label={`Surah di Juz ${juz}`}>
                      {surahsInJuz.map(s => (
                        <option key={`edit-end-${s.number}`} value={s.number}>
                          {s.number}. {s.name} ({s.totalAyahs} ayat)
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Seluruh Surah Al-Qur'an (1 - 114)">
                      {ALL_SURAHS.map(s => (
                        <option key={`edit-all-end-${s.number}`} value={s.number}>
                          {s.number}. {s.name} ({s.totalAyahs} ayat)
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Rentang Ayat */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">Mulai Ayat</label>
                  <input
                    type="number"
                    min={1}
                    value={ayatMulai}
                    onChange={e => setAyatMulai(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">Sampai Ayat</label>
                  <input
                    type="number"
                    min={1}
                    value={ayatSelesai}
                    onChange={e => setAyatSelesai(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              {/* Preview Ringkasan */}
              {(() => {
                const sA = ALL_SURAHS.find(s => s.number === surahNumber);
                const sB = ALL_SURAHS.find(s => s.number === surahSampaiNumber);
                return (
                  <div className="p-2 bg-emerald-100/70 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-between text-[11px] text-emerald-950 dark:text-emerald-200 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span>{sA?.name} (Ayat {ayatMulai})</span>
                      <ArrowRight className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                      <span>{sB?.name} (Ayat {ayatSelesai})</span>
                    </div>
                    <span className="text-[10px] text-emerald-800 dark:text-emerald-300">Juz {juz}</span>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Surah
                </label>
                <select
                  value={surahNumber}
                  onChange={e => {
                    const sNum = Number(e.target.value);
                    const sMeta = ALL_SURAHS.find(s => s.number === sNum);
                    setSurahNumber(sNum);
                    setSurahSampaiNumber(sNum);
                    if (sMeta) {
                      setAyatMulai(1);
                      setAyatSelesai(sMeta.totalAyahs);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
                >
                  <optgroup label={`Surah di Juz ${juz}`}>
                    {surahsInJuz.map(s => (
                      <option key={`single-${s.number}`} value={s.number}>
                        {s.number}. {s.name} ({s.totalAyahs} ayat)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Seluruh Surah Al-Qur'an (1 - 114)">
                    {ALL_SURAHS.map(s => (
                      <option key={`single-all-${s.number}`} value={s.number}>
                        {s.number}. {s.name} ({s.totalAyahs} ayat)
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ayat Mulai</label>
                  <input
                    type="number"
                    min={1}
                    value={ayatMulai}
                    onChange={e => setAyatMulai(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ayat Selesai</label>
                  <input
                    type="number"
                    min={1}
                    value={ayatSelesai}
                    onChange={e => setAyatSelesai(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Kualitas & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nilai Kualitas
              </label>
              <select
                value={kualitas}
                onChange={e => setKualitas(e.target.value as HafalanQuality)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100"
              >
                <option value="A">Nilai: A (Mumtaz)</option>
                <option value="B">Nilai: B (Jayyid)</option>
                <option value="C">Nilai: C (Maqbul)</option>
                <option value="D">Nilai: D (Ulang / Rosib)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Setoran
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={e => setTanggal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100"
                required
              />
            </div>
          </div>

          {/* Catatan Ustadz */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Ustadz (Kelancaran, Tajwid, Evaluasi)
            </label>
            <textarea
              rows={2}
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              placeholder="Contoh: Makharijul huruf sangat fasih, waqaf dan ibtida tepat..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Delete confirmation section */}
          {confirmDelete && (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-xl flex items-center justify-between gap-2 text-xs">
              <div className="flex items-start gap-1.5 text-red-800 dark:text-red-300 font-medium">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <span>
                  {record.type === 'baru'
                    ? 'Hapus riwayat Hafalan Baru ini? Capaian hafalan santri akan ikut dikurangi.'
                    : `Hapus riwayat ${record.type === 'muroja' ? "Muroja'ah" : 'Perbaikan'} ini? Capaian hafalan tidak akan berkurang.`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onDelete();
                    onClose();
                  }}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                >
                  Ya, Hapus
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            {!confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Simpan Perubahan
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
