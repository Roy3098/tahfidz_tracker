import React, { useState } from 'react';
import { useTahfidz } from '../context/TahfidzContext';
import { 
  Award, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Plus, 
  Edit3, 
  Trash2,
  X, 
  Check, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TasmiRecord } from '../types';

export const TasmiView: React.FC = () => {
  const { 
    currentUser, 
    tasmiList, 
    santriList, 
    scheduleTasmi, 
    updateTasmiSchedule, 
    updateTasmiResult, 
    cancelTasmi,
    deleteTasmi
  } = useTahfidz();

  const isParent = currentUser?.role === 'parent';
  const child = isParent ? santriList.find(s => s.id === currentUser.studentId) || santriList[0] : null;

  const [statusFilter, setStatusFilter] = useState<'all' | 'belum' | 'terjadwal' | 'selesai'>('all');

  // New Schedule Modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedStudentForSchedule, setSelectedStudentForSchedule] = useState<string>(santriList[0]?.id || '');
  const [scheduleDate, setScheduleDate] = useState('2026-09-28');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [scheduleExaminer, setScheduleExaminer] = useState('Ustadz Ahmad');
  const [scheduleTarget, setScheduleTarget] = useState('Juz 1-10 Bil Ghoib');

  // Edit Schedule Modal state
  const [editingTasmiSchedule, setEditingTasmiSchedule] = useState<TasmiRecord | null>(null);
  const [editScheduleDate, setEditScheduleDate] = useState('');
  const [editScheduleTime, setEditScheduleTime] = useState('');
  const [editScheduleExaminer, setEditScheduleExaminer] = useState('');
  const [editScheduleTarget, setEditScheduleTarget] = useState('');

  // Result modal state
  const [selectedTasmiForResult, setSelectedTasmiForResult] = useState<TasmiRecord | null>(null);
  const [resultGrade, setResultGrade] = useState<TasmiRecord['nilai']>('A');
  const [resultNotes, setResultNotes] = useState('Hafalan lancar, tajwid dan waqaf-ibtida sangat baik.');
  const [confirmDeleteTasmiId, setConfirmDeleteTasmiId] = useState<string | null>(null);

  // Stats calculation
  const completedCount = tasmiList.filter(t => t.status === 'selesai').length;
  const pendingCount = tasmiList.filter(t => t.status !== 'selesai').length;

  const filteredList = tasmiList.filter(item => {
    if (isParent && child) {
      return item.studentId === child.id;
    }
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    return true;
  });

  const handleOpenScheduleModal = (preselectedStudentName?: string) => {
    if (preselectedStudentName) {
      const s = santriList.find(st => st.nama === preselectedStudentName);
      if (s) {
        setSelectedStudentForSchedule(s.id);
        setScheduleTarget(`Juz 1-${s.totalJuzMemorized || 5} Bil Ghoib`);
      }
    }
    setIsScheduleModalOpen(true);
  };

  const handleConfirmSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    scheduleTasmi(
      selectedStudentForSchedule,
      scheduleDate,
      `${scheduleTime} WIB`,
      scheduleExaminer,
      scheduleTarget
    );
    setIsScheduleModalOpen(false);
  };

  const handleConfirmResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTasmiForResult) return;

    updateTasmiResult(selectedTasmiForResult.id, resultGrade, resultNotes);

    if (resultGrade === 'A' || resultGrade === 'B+') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    setSelectedTasmiForResult(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Tasmi' Bulanan (Ujian Bil Ghoib)
          </h2>
          <p className="text-xs text-slate-500">
            Ujian hafalan sekali duduk untuk menguji kemutqinan santri
          </p>
        </div>

        {currentUser?.role !== 'parent' && (
          <button
            onClick={() => handleOpenScheduleModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Jadwalkan Tasmi'
          </button>
        )}
      </div>

      {/* 2 Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Sudah Tasmi'</span>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-700 tabular-nums mt-1">
              {completedCount}
            </div>
            <span className="text-[11px] text-slate-500">Lulus Ujian Mumtaz/Jayyid</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Belum / Terjadwal</span>
            <div className="text-2xl sm:text-3xl font-bold text-amber-600 tabular-nums mt-1">
              {pendingCount}
            </div>
            <span className="text-[11px] text-slate-500">Santri siap diuji</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      {!isParent && (
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit text-xs">
          {(['all', 'selesai', 'terjadwal', 'belum'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors capitalize ${
                statusFilter === tab
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'all' ? 'Semua Status' : tab === 'selesai' ? 'Sudah Tasmi' : tab === 'terjadwal' ? 'Terjadwal' : 'Belum Dijadwalkan'}
            </button>
          ))}
        </div>
      )}

      {/* Tasmi List Cards */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 p-8 text-slate-400 text-xs">
            Tidak ada santri pada kategori status ini.
          </div>
        ) : (
          filteredList.map(record => {
            const isCompleted = record.status === 'selesai';
            const isScheduled = record.status === 'terjadwal';

            return (
              <div
                key={record.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : isScheduled
                    ? 'bg-amber-50/40 border-amber-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      isCompleted 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : isScheduled 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {record.studentName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base leading-tight">
                        {record.studentName}
                      </h4>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>{record.kelompokNama}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-emerald-800">{record.targetJuzText}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="self-start sm:self-auto">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : isScheduled
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isCompleted ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          Selesai ({record.tanggal})
                        </>
                      ) : isScheduled ? (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          Terjadwal: {record.tanggal} {record.waktu}
                        </>
                      ) : (
                        <>
                          <Calendar className="w-3.5 h-3.5" />
                          Belum Dijadwalkan
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Details info */}
                <div className="text-xs text-slate-600 bg-white/70 p-3 rounded-xl border border-slate-200/60 mb-3 space-y-1">
                  {isCompleted && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Nilai Kelulusan:</span>
                        <span className="font-bold text-emerald-700 text-sm">{record.nilai} (Mumtaz)</span>
                      </div>
                      {record.catatan && (
                        <div className="pt-1 border-t border-slate-100">
                          <span className="text-slate-500 block mb-0.5">Catatan Penguji:</span>
                          <span className="text-slate-700 italic">"{record.catatan}"</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Actions for teacher */}
                {!isParent && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100/80">
                    {isCompleted && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedTasmiForResult(record);
                            setResultGrade(record.nilai || 'A');
                            setResultNotes(record.catatan || '');
                          }}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit Hasil Tasmi'
                        </button>
                        {confirmDeleteTasmiId === record.id ? (
                          <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200 ml-auto">
                            <span className="text-[10px] text-red-700 font-semibold px-1">Hapus?</span>
                            <button
                              type="button"
                              onClick={() => {
                                deleteTasmi(record.id);
                                setConfirmDeleteTasmiId(null);
                              }}
                              className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold"
                            >
                              Ya
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteTasmiId(null)}
                              className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px]"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteTasmiId(record.id)}
                            title="Hapus Rekor Ujian"
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors ml-auto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}

                    {isScheduled && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedTasmiForResult(record);
                            setResultGrade('A');
                            setResultNotes('Hafalan lancar dan tajwid baik.');
                          }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <Award className="w-3.5 h-3.5" />
                          Input Nilai & Kelulusan
                        </button>
                        <button
                          onClick={() => {
                            setEditingTasmiSchedule(record);
                            setEditScheduleDate(record.tanggal || '2026-09-28');
                            setEditScheduleTime((record.waktu || '09:00 WIB').replace(' WIB', ''));
                            setEditScheduleExaminer(record.penguji || 'Ustadz Ahmad');
                            setEditScheduleTarget(record.targetJuzText || 'Juz 1-10 Bil Ghoib');
                          }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit Jadwal
                        </button>
                        <button
                          onClick={() => cancelTasmi(record.id)}
                          className="px-3 py-1.5 text-amber-700 hover:bg-amber-50 rounded-lg text-xs font-medium transition-colors"
                        >
                          Batalkan Jadwal
                        </button>
                        {confirmDeleteTasmiId === record.id ? (
                          <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200 ml-auto">
                            <span className="text-[10px] text-red-700 font-semibold px-1">Hapus?</span>
                            <button
                              type="button"
                              onClick={() => {
                                deleteTasmi(record.id);
                                setConfirmDeleteTasmiId(null);
                              }}
                              className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold"
                            >
                              Ya
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteTasmiId(null)}
                              className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px]"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteTasmiId(record.id)}
                            title="Hapus Jadwal"
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors ml-auto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}

                    {!isCompleted && !isScheduled && (
                      <>
                        <button
                          onClick={() => handleOpenScheduleModal(record.studentName)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Jadwalkan Tasmi'
                        </button>
                        {confirmDeleteTasmiId === record.id ? (
                          <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200 ml-auto">
                            <span className="text-[10px] text-red-700 font-semibold px-1">Hapus?</span>
                            <button
                              type="button"
                              onClick={() => {
                                deleteTasmi(record.id);
                                setConfirmDeleteTasmiId(null);
                              }}
                              className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold"
                            >
                              Ya
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteTasmiId(null)}
                              className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px]"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteTasmiId(record.id)}
                            title="Hapus Data"
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors ml-auto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Schedule Tasmi Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Jadwalkan Ujian Tasmi'</h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSchedule} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Santri</label>
                <select
                  value={selectedStudentForSchedule}
                  onChange={e => setSelectedStudentForSchedule(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm"
                >
                  {santriList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.totalJuzMemorized} Juz)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Waktu</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Hafalan yang Diuji</label>
                <input
                  type="text"
                  value={scheduleTarget}
                  onChange={e => setScheduleTarget(e.target.value)}
                  placeholder="Contoh: Juz 1-10 Bil Ghoib Sekali Duduk"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Jadwalkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Input Result Modal */}
      {selectedTasmiForResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Hasil Ujian Tasmi'</h3>
                <p className="text-xs text-slate-500">{selectedTasmiForResult.studentName}</p>
              </div>
              <button
                onClick={() => setSelectedTasmiForResult(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmResult} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Predikat Nilai</label>
                <select
                  value={resultGrade}
                  onChange={e => setResultGrade(e.target.value as TasmiRecord['nilai'])}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold"
                >
                  <option value="A">A - Mumtaz (Sangat Baik / Sempurna)</option>
                  <option value="B+">B+ - Jayyid Jiddan (Baik Sekali)</option>
                  <option value="B">B - Jayyid (Baik)</option>
                  <option value="C">C - Maqbul (Cukup)</option>
                  <option value="D">D - Rosib (Perlu Diulang)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Evaluasi Penguji</label>
                <textarea
                  value={resultNotes}
                  onChange={e => setResultNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  placeholder="Catatan mengenai kelancaran, mad, waqaf..."
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTasmiForResult(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Simpan & Sahkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {editingTasmiSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Edit Jadwal Ujian Tasmi'</h3>
                <p className="text-xs text-slate-500">{editingTasmiSchedule.studentName}</p>
              </div>
              <button
                onClick={() => setEditingTasmiSchedule(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                updateTasmiSchedule(
                  editingTasmiSchedule.id,
                  editScheduleDate,
                  `${editScheduleTime} WIB`,
                  editScheduleExaminer,
                  editScheduleTarget
                );
                setEditingTasmiSchedule(null);
              }} 
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={editScheduleDate}
                    onChange={e => setEditScheduleDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Waktu</label>
                  <input
                    type="time"
                    value={editScheduleTime}
                    onChange={e => setEditScheduleTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Penguji (Asatidz)</label>
                <select
                  value={editScheduleExaminer}
                  onChange={e => setEditScheduleExaminer(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                >
                  <option value="Ustadz Ahmad">Ustadz Ahmad</option>
                  <option value="Ustadzah Fatimah">Ustadzah Fatimah</option>
                  <option value="Ustadz Yusuf">Ustadz Yusuf</option>
                  <option value="Ustadzah Khadijah">Ustadzah Khadijah</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Hafalan yang Diuji</label>
                <input
                  type="text"
                  value={editScheduleTarget}
                  onChange={e => setEditScheduleTarget(e.target.value)}
                  placeholder="Contoh: Juz 1-10 Bil Ghoib Sekali Duduk"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTasmiSchedule(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
