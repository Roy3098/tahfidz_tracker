import React, { useState } from 'react';
import { useTahfidz } from '../context/TahfidzContext';
import { ALL_SURAHS, getSurahsForJuz } from '../data/quranData';
import { X, Plus, Trash2, CheckCircle2, BookOpen, Calendar, Award, Edit3, Check, Bookmark, Sparkles } from 'lucide-react';
import { Santri, HafalanQuality, HafalanType, HafalanEntry } from '../types';
import { parseHafalan } from '../utils/hafalanFormat';

interface EditHafalanModalProps {
  student: Santri;
  isOpen: boolean;
  onClose: () => void;
}

export const EditHafalanModal: React.FC<EditHafalanModalProps> = ({
  student,
  isOpen,
  onClose
}) => {
  const { addHafalanRecord, updateHafalanRecord, deleteHafalanRecord, updateSantri } = useTahfidz();

  const [activeFormTab, setActiveFormTab] = useState<'juz' | 'surah' | 'ayat'>('surah');
  const [juz, setJuz] = useState<number>(1);
  const [surahNumber, setSurahNumber] = useState<number>(1);
  const [ayatMulai, setAyatMulai] = useState<number>(1);
  const [ayatSelesai, setAyatSelesai] = useState<number>(7);
  const [kualitas, setKualitas] = useState<HafalanQuality>('A');
  const [type, setType] = useState<HafalanType>('baru');
  const [catatan, setCatatan] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  // State for direct total juz editing
  const [isEditingTotalJuz, setIsEditingTotalJuz] = useState(false);
  const [draftTotalJuz, setDraftTotalJuz] = useState<number>(student.totalJuzMemorized);
  const [draftTargetJuz, setDraftTargetJuz] = useState<number>(student.targetJuz);

  // State for editing existing record inline
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editRecordDraft, setEditRecordDraft] = useState<Partial<HafalanEntry>>({});
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);

  if (!isOpen) return null;

  const availableSurahs = getSurahsForJuz(juz);
  const currentSurah = ALL_SURAHS.find(s => s.number === surahNumber);

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();

    let surahName = currentSurah ? currentSurah.name : `Surah ${surahNumber}`;
    if (activeFormTab === 'juz') {
      surahName = `Juz ${juz} Lengkap`;
    }

    addHafalanRecord({
      studentId: student.id,
      studentName: student.nama,
      type,
      category: activeFormTab,
      juz,
      surahNumber: activeFormTab !== 'juz' ? surahNumber : undefined,
      surahName,
      ayatMulai: activeFormTab !== 'juz' ? ayatMulai : undefined,
      ayatSelesai: activeFormTab !== 'juz' ? ayatSelesai : undefined,
      kualitas,
      catatan,
      tanggal
    });

    setCatatan('');
  };

  const progressPercent = Math.round((student.totalJuzMemorized / student.targetJuz) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center font-bold text-sm">
              {student.nama.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg">
                Kelola Hafalan - {student.nama}
              </h3>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {student.kelasNama} · {student.kelompokNama} · Target: {student.targetJuz} Juz
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Summary Metric Cards */}
          {(() => {
            const currentBreakdown = parseHafalan(student.totalJuzMemorized);
            const draftBreakdown = parseHafalan(draftTotalJuz);

            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-center">
                  <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 p-3 sm:p-3.5 rounded-2xl relative group">
                    <span className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 block tabular-nums">
                      {currentBreakdown.decimalText} Juz
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block">
                      {currentBreakdown.lembarText}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                      {currentBreakdown.halaman > 0 ? `(${currentBreakdown.halaman} Halaman)` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftTotalJuz(student.totalJuzMemorized);
                        setDraftTargetJuz(student.targetJuz);
                        setIsEditingTotalJuz(true);
                      }}
                      className="mt-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 underline flex items-center justify-center gap-1 mx-auto"
                      title="Edit capaian Juz langsung tanpa riwayat setoran"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Ubah Capaian</span>
                    </button>
                  </div>

                  <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 p-3 sm:p-3.5 rounded-2xl flex flex-col justify-center">
                    <span className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400 block tabular-nums">
                      {student.hafalanList.length}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Riwayat Setoran</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5">Sesi Terdaftar</span>
                  </div>

                  <div className="bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800 p-3 sm:p-3.5 rounded-2xl flex flex-col justify-center">
                    <span className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-400 block tabular-nums">
                      {progressPercent}%
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Progress Target</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5">Dari {student.targetJuz} Juz</span>
                  </div>
                </div>

                {/* Direct Juz & Target Editor Form (Tanpa Harus Setoran) */}
                {isEditingTotalJuz && (
                  <div className="p-4 bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-2xl space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                        Edit Langsung Capaian Juz Santri (Desimal / Lembar)
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingTotalJuz(false)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            Total Capaian Juz (Bisa Desimal):
                          </label>
                          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                            {draftBreakdown.lembarText}
                          </span>
                        </div>
                        <input
                          type="number"
                          step="0.1"
                          min={0}
                          max={30}
                          value={draftTotalJuz}
                          onChange={e => setDraftTotalJuz(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-emerald-800 dark:text-emerald-300"
                        />
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                          Contoh: 1.2 = 1 Juz 2 Lembar (4 Hal)
                        </span>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Target Capaian (Juz):
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min={1}
                          max={30}
                          value={draftTargetJuz}
                          onChange={e => setDraftTargetJuz(Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditingTotalJuz(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const safeJuz = Math.max(0, Math.min(30, Math.round(Number(draftTotalJuz) * 10) / 10));
                          updateSantri(student.id, {
                            totalJuzMemorized: safeJuz,
                            targetJuz: Math.max(1, Math.min(30, Number(draftTargetJuz)))
                          });
                          setIsEditingTotalJuz(false);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Simpan Perubahan
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {/* Form: Tambah Catatan Hafalan Baru */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Input Setoran Baru
              </h4>

              {/* Segmented controls for category */}
              <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-700/70 rounded-lg text-xs">
                {(['juz', 'surah', 'ayat'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveFormTab(cat)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors capitalize ${
                      activeFormTab === cat
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {cat === 'juz' ? 'Juz Penuh' : cat === 'surah' ? 'Per Surah' : 'Rentang Ayat'}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddEntry} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Juz
                  </label>
                  <select
                    value={juz}
                    onChange={e => setJuz(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                      <option key={j} value={j}>Juz {j}</option>
                    ))}
                  </select>
                </div>

                {activeFormTab !== 'juz' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Surah
                    </label>
                    <select
                      value={surahNumber}
                      onChange={e => setSurahNumber(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                    >
                      {availableSurahs.map(s => (
                        <option key={s.number} value={s.number}>
                          {s.number}. {s.name} ({s.arabicName}) - {s.totalAyahs} ayat
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {activeFormTab !== 'juz' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ayat Mulai</label>
                    <input
                      type="number"
                      min={1}
                      max={currentSurah?.totalAyahs || 286}
                      value={ayatMulai}
                      onChange={e => setAyatMulai(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ayat Selesai</label>
                    <input
                      type="number"
                      min={ayatMulai}
                      max={currentSurah?.totalAyahs || 286}
                      value={ayatSelesai}
                      onChange={e => setAyatSelesai(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as HafalanType)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="baru">Hafalan Baru</option>
                    <option value="muroja">Muroja'ah</option>
                    <option value="perbaikan">Perbaikan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kualitas</label>
                  <select
                    value={kualitas}
                    onChange={e => setKualitas(e.target.value as HafalanQuality)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="A">A - Sangat Baik</option>
                    <option value="B">B - Baik</option>
                    <option value="C">C - Cukup</option>
                    <option value="D">D - Kurang</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={e => setTanggal(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Catatan</label>
                <input
                  type="text"
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  placeholder="Catatan kelancaran, tajwid..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tambahkan ke Daftar Riwayat
              </button>
            </form>
          </div>

          {/* List of Existing Records */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-3">
              Riwayat Setoran Tersimpan ({student.hafalanList.length})
            </h4>

            {student.hafalanList.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                Belum ada catatan setoran tersimpan.
              </div>
            ) : (
              <div className="space-y-2.5">
                {student.hafalanList.map(item => {
                  const isEditing = editingRecordId === item.id;

                  if (isEditing) {
                    const currentEditJuz = editRecordDraft.juz ?? item.juz;
                    const surahsInJuz = getSurahsForJuz(currentEditJuz);

                    return (
                      <div
                        key={item.id}
                        className="p-4 bg-emerald-50/50 dark:bg-emerald-950/40 border-2 border-emerald-500/60 dark:border-emerald-600 rounded-xl space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                            Edit Setoran Hafalan
                          </span>
                          <button
                            onClick={() => {
                              setEditingRecordId(null);
                              setEditRecordDraft({});
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Juz</label>
                            <select
                              value={currentEditJuz}
                              onChange={e => {
                                const newJuz = Number(e.target.value);
                                const surahs = getSurahsForJuz(newJuz);
                                setEditRecordDraft(prev => ({
                                  ...prev,
                                  juz: newJuz,
                                  surahNumber: surahs[0]?.number || 1,
                                  surahName: surahs[0]?.name || `Surah 1`
                                }));
                              }}
                              className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                            >
                              {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                                <option key={j} value={j}>Juz {j}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Surah</label>
                            <select
                              value={editRecordDraft.surahNumber ?? item.surahNumber ?? 1}
                              onChange={e => {
                                const sNum = Number(e.target.value);
                                const sObj = ALL_SURAHS.find(s => s.number === sNum);
                                setEditRecordDraft(prev => ({
                                  ...prev,
                                  surahNumber: sNum,
                                  surahName: sObj?.name || `Surah ${sNum}`
                                }));
                              }}
                              className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 truncate"
                            >
                              {surahsInJuz.map(s => (
                                <option key={s.number} value={s.number}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Ayat Mulai</label>
                            <input
                              type="number"
                              min={1}
                              value={editRecordDraft.ayatMulai ?? item.ayatMulai ?? 1}
                              onChange={e => setEditRecordDraft(prev => ({ ...prev, ayatMulai: Number(e.target.value) }))}
                              className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Ayat Selesai</label>
                            <input
                              type="number"
                              min={1}
                              value={editRecordDraft.ayatSelesai ?? item.ayatSelesai ?? 7}
                              onChange={e => setEditRecordDraft(prev => ({ ...prev, ayatSelesai: Number(e.target.value) }))}
                              className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Nilai Kualitas</label>
                            <select
                              value={editRecordDraft.kualitas ?? item.kualitas}
                              onChange={e => setEditRecordDraft(prev => ({ ...prev, kualitas: e.target.value as HafalanQuality }))}
                              className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100"
                            >
                              <option value="A">A - Mumtaz</option>
                              <option value="B">B - Jayyid</option>
                              <option value="C">C - Maqbul</option>
                              <option value="D">D - Rosib</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Jenis Setoran</label>
                            <select
                              value={editRecordDraft.type ?? item.type}
                              onChange={e => setEditRecordDraft(prev => ({ ...prev, type: e.target.value as HafalanType }))}
                              className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                            >
                              <option value="baru">Hafalan Baru</option>
                              <option value="muroja">Muroja'ah</option>
                              <option value="perbaikan">Perbaikan</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Tanggal</label>
                            <input
                              type="date"
                              value={editRecordDraft.tanggal ?? item.tanggal}
                              onChange={e => setEditRecordDraft(prev => ({ ...prev, tanggal: e.target.value }))}
                              className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Catatan</label>
                          <input
                            type="text"
                            value={editRecordDraft.catatan ?? item.catatan ?? ''}
                            onChange={e => setEditRecordDraft(prev => ({ ...prev, catatan: e.target.value }))}
                            placeholder="Catatan ustadz..."
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRecordId(null);
                              setEditRecordDraft({});
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateHafalanRecord(student.id, item.id, editRecordDraft);
                              setEditingRecordId(null);
                              setEditRecordDraft({});
                            }}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Simpan Perubahan
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-3.5 bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            Juz {item.juz} · {item.surahName}
                          </span>
                          {item.ayatMulai && item.ayatSelesai && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              (Ayat {item.ayatMulai}-{item.ayatSelesai})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Nilai: <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{item.kualitas}</strong></span>
                          <span>·</span>
                          <span className="capitalize">{item.type}</span>
                          <span>·</span>
                          <span>{item.tanggal}</span>
                        </div>

                        {item.catatan && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic">
                            "{item.catatan}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingRecordId(item.id);
                            setEditRecordDraft({
                              juz: item.juz,
                              surahNumber: item.surahNumber,
                              surahName: item.surahName,
                              ayatMulai: item.ayatMulai,
                              ayatSelesai: item.ayatSelesai,
                              kualitas: item.kualitas,
                              type: item.type,
                              catatan: item.catatan,
                              tanggal: item.tanggal
                            });
                          }}
                          title="Edit Catatan"
                          className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {deletingRecordId === item.id ? (
                          <div className="flex items-center gap-1 bg-red-50 dark:bg-rose-950/60 p-1 rounded-lg border border-red-200 dark:border-rose-800">
                            <span className="text-[10px] text-red-700 dark:text-rose-300 font-semibold px-1">Hapus?</span>
                            <button
                              type="button"
                              onClick={() => {
                                deleteHafalanRecord(student.id, item.id);
                                setDeletingRecordId(null);
                              }}
                              className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold"
                            >
                              Ya
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingRecordId(null)}
                              className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-[10px]"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingRecordId(item.id)}
                            title="Hapus Catatan"
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-rose-950/50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
};
