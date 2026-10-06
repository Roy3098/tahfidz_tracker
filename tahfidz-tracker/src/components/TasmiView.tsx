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
  Sparkles,
  Video,
  PlayCircle,
  ExternalLink,
  Users,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TasmiRecord } from '../types';
import { getTodayWIB } from '../utils/dateWIB';

export const TasmiView: React.FC = () => {
  const { 
    currentUser, 
    tasmiList, 
    santriList, 
    scheduleTasmi, 
    updateTasmiSchedule, 
    updateTasmiResult, 
    cancelTasmi,
    deleteTasmi,
    parentChildren,
    switchParentActiveChild
  } = useTahfidz();

  const isParent = currentUser?.role === 'parent';
  const child = isParent ? santriList.find(s => s.id === currentUser.studentId) || santriList[0] : null;
  const [parentTasmiChildId, setParentTasmiChildId] = useState<string>('all');
  const parentChildIds = new Set(parentChildren.map(c => c.id));

  const [statusFilter, setStatusFilter] = useState<'all' | 'belum' | 'terjadwal' | 'selesai'>('all');

  // New Schedule Modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedStudentForSchedule, setSelectedStudentForSchedule] = useState<string>(santriList[0]?.id || '');
  const [scheduleDate, setScheduleDate] = useState(() => getTodayWIB());
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [scheduleTarget, setScheduleTarget] = useState('Juz 1-10 Bil Ghoib');

  // Edit Schedule Modal state
  const [editingTasmiSchedule, setEditingTasmiSchedule] = useState<TasmiRecord | null>(null);
  const [editScheduleDate, setEditScheduleDate] = useState('');
  const [editScheduleTime, setEditScheduleTime] = useState('');
  const [editScheduleTarget, setEditScheduleTarget] = useState('');

  // Result modal state
  const [selectedTasmiForResult, setSelectedTasmiForResult] = useState<TasmiRecord | null>(null);
  const [resultGrade, setResultGrade] = useState<TasmiRecord['nilai']>('A');
  const [resultNotes, setResultNotes] = useState('Hafalan lancar, tajwid dan waqaf-ibtida sangat baik.');
  const [resultVideoUrl, setResultVideoUrl] = useState('');
  const [confirmDeleteTasmiId, setConfirmDeleteTasmiId] = useState<string | null>(null);

  // Stats calculation
  const completedCount = tasmiList.filter(t => t.status === 'selesai').length;
  const pendingCount = tasmiList.filter(t => t.status !== 'selesai').length;

  const filteredList = tasmiList.filter(item => {
    if (isParent) {
      if (parentTasmiChildId === 'all') {
        if (!parentChildIds.has(item.studentId)) return false;
      } else {
        if (item.studentId !== parentTasmiChildId) return false;
      }
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
      '',
      scheduleTarget
    );
    setIsScheduleModalOpen(false);
  };

  const handleConfirmResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTasmiForResult) return;

    updateTasmiResult(selectedTasmiForResult.id, resultGrade, resultNotes, resultVideoUrl);

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
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Tasmi' Bulanan (Ujian Bil Ghoib)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ujian hafalan sekali duduk untuk menguji kemutqinan santri
          </p>
        </div>

        {currentUser?.role !== 'parent' && (
          <button
            onClick={() => handleOpenScheduleModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-colors self-start sm:self-auto active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Jadwalkan Tasmi'
          </button>
        )}
      </div>

      {/* 2 Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-5 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Sudah Tasmi'</span>
            <div className="text-xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5 sm:mt-1">
              {completedCount}
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block truncate">Lulus Mumtaz/Jayyid</span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/60">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-5 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Belum / Terjadwal</span>
            <div className="text-xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 tabular-nums mt-0.5 sm:mt-1">
              {pendingCount}
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block truncate">Santri siap diuji</span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/60 dark:border-amber-800/60">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      {!isParent && (
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs border border-slate-200/60 dark:border-slate-700/60">
          {(['all', 'selesai', 'terjadwal', 'belum'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors capitalize text-center cursor-pointer ${
                statusFilter === tab
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab === 'all' ? 'Semua Status' : tab === 'selesai' ? "Sudah Tasmi'" : tab === 'terjadwal' ? 'Terjadwal' : 'Belum Dijadwalkan'}
            </button>
          ))}
        </div>
      )}

      {/* Multi-Child Selector for Parent */}
      {isParent && parentChildren.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
          <span className="text-xs font-bold text-teal-800 dark:text-teal-300 px-2.5 flex items-center gap-1.5 shrink-0">
            <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Pilih Ananda ({parentChildren.length}):</span>
          </span>
          <button
            type="button"
            onClick={() => setParentTasmiChildId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              parentTasmiChildId === 'all'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-600'
            }`}
          >
            Semua Ananda ({parentChildren.length})
          </button>
          {parentChildren.map(c => {
            const isSelected = parentTasmiChildId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setParentTasmiChildId(c.id);
                  switchParentActiveChild(c.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-600'
                }`}
              >
                <span>{c.nama}</span>
                <span className="text-[10px] opacity-80">({c.kelasNama})</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Tasmi List Cards */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 text-slate-400 dark:text-slate-500 text-xs">
            Tidak ada santri pada kategori status ini.
          </div>
        ) : (
          filteredList.map(record => {
            const isCompleted = record.status === 'selesai';
            const isScheduled = record.status === 'terjadwal';

            return (
              <div
                key={record.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/70'
                    : isScheduled
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/70'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 mb-3">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 border ${
                      isCompleted 
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                        : isScheduled 
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}>
                      {record.studentName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight truncate">
                        {record.studentName}
                      </h4>
                      <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span>{record.kelompokNama}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-emerald-800 dark:text-emerald-300">{record.targetJuzText}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="self-start sm:self-auto">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border ${
                      isCompleted
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : isScheduled
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
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
                <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 mb-3 space-y-1.5">
                  {isCompleted ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Nilai Kelulusan:</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                          {record.nilai} {record.nilai === 'A' ? '(Mumtaz)' : record.nilai === 'B+' ? '(Jayyid Jiddan)' : record.nilai === 'B' ? '(Jayyid)' : record.nilai === 'C' ? '(Maqbul)' : '(Rosib)'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Target Ujian:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{record.targetJuzText}</span>
                      </div>
                      {record.catatan && (
                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-750">
                          <span className="text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">Catatan Evaluasi:</span>
                          <span className="text-slate-700 dark:text-slate-300 italic">"{record.catatan}"</span>
                        </div>
                      )}
                    </>
                  ) : isScheduled ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Target Ujian:</span>
                        <span className="font-semibold text-emerald-800 dark:text-emerald-300">{record.targetJuzText}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Jadwal Pelaksanaan:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{record.tanggal} · {record.waktu}</span>
                      </div>
                      {record.catatan && (
                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-750">
                          <span className="text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">Keterangan:</span>
                          <span className="text-slate-700 dark:text-slate-300 italic">"{record.catatan}"</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Target Ujian:</span>
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300">{record.targetJuzText}</span>
                    </div>
                  )}

                  {/* Video Dokumentasi Rekaman Tasmi' (YouTube / Google Drive) */}
                  {record.videoUrl && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-750 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                        <Video className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Video Dokumentasi Tasmi:</span>
                      </div>
                      <a
                        href={record.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all border border-rose-200/80 dark:border-rose-800 shadow-2xs active:scale-95"
                        title="Tonton video rekaman ujian tasmi ananda"
                      >
                        <PlayCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        <span>Tonton Video Dokumentasi</span>
                        <ExternalLink className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Actions for teacher */}
                {!isParent && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100/80 dark:border-slate-800">
                    {isCompleted && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedTasmiForResult(record);
                            setResultGrade(record.nilai || 'A');
                            setResultNotes(record.catatan || '');
                            setResultVideoUrl(record.videoUrl || '');
                          }}
                          className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit Hasil Tasmi'
                        </button>
                        {confirmDeleteTasmiId === record.id ? (
                          <div className="flex items-center gap-1 bg-red-50 dark:bg-rose-950/60 p-1 rounded-lg border border-red-200 dark:border-rose-800 ml-auto">
                            <span className="text-[10px] text-red-700 dark:text-rose-300 font-semibold px-1">Hapus?</span>
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
                              className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-[10px]"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteTasmiId(record.id)}
                            title="Hapus Rekor Ujian"
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-rose-950/50 transition-colors ml-auto"
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
                            setResultVideoUrl(record.videoUrl || '');
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
                            setEditScheduleTarget(record.targetJuzText || 'Juz 1-10 Bil Ghoib');
                          }}
                          className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit Jadwal
                        </button>
                        <button
                          onClick={() => cancelTasmi(record.id)}
                          className="px-3 py-1.5 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg text-xs font-medium transition-colors"
                        >
                          Batalkan Jadwal
                        </button>
                        {confirmDeleteTasmiId === record.id ? (
                          <div className="flex items-center gap-1 bg-red-50 dark:bg-rose-950/60 p-1 rounded-lg border border-red-200 dark:border-rose-800 ml-auto">
                            <span className="text-[10px] text-red-700 dark:text-rose-300 font-semibold px-1">Hapus?</span>
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
                              className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-[10px]"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteTasmiId(record.id)}
                            title="Hapus Jadwal"
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-rose-950/50 transition-colors ml-auto"
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
                          <div className="flex items-center gap-1 bg-red-50 dark:bg-rose-950/60 p-1 rounded-lg border border-red-200 dark:border-rose-800 ml-auto">
                            <span className="text-[10px] text-red-700 dark:text-rose-300 font-semibold px-1">Hapus?</span>
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
                              className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-[10px]"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteTasmiId(record.id)}
                            title="Hapus Data"
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-rose-950/50 transition-colors ml-auto"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Jadwalkan Ujian Tasmi'</h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSchedule} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Santri</label>
                <select
                  value={selectedStudentForSchedule}
                  onChange={e => setSelectedStudentForSchedule(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Waktu</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Hafalan yang Diuji</label>
                <input
                  type="text"
                  value={scheduleTarget}
                  onChange={e => setScheduleTarget(e.target.value)}
                  placeholder="Contoh: Juz 1-10 Bil Ghoib Sekali Duduk"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Hasil Ujian Tasmi'</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{selectedTasmiForResult.studentName}</p>
              </div>
              <button
                onClick={() => setSelectedTasmiForResult(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmResult} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Predikat Nilai</label>
                <select
                  value={resultGrade}
                  onChange={e => setResultGrade(e.target.value as TasmiRecord['nilai'])}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="A">A - Mumtaz (Sangat Baik / Sempurna)</option>
                  <option value="B+">B+ - Jayyid Jiddan (Baik Sekali)</option>
                  <option value="B">B - Jayyid (Baik)</option>
                  <option value="C">C - Maqbul (Cukup)</option>
                  <option value="D">D - Rosib (Perlu Diulang)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Catatan Evaluasi</label>
                <textarea
                  value={resultNotes}
                  onChange={e => setResultNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Catatan mengenai kelancaran, mad, waqaf..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>Link Video Dokumentasi Tasmi (YouTube / Google Drive)</span>
                </label>
                <input
                  type="url"
                  value={resultVideoUrl}
                  onChange={e => setResultVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... atau Google Drive (Opsional)"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Tautan video rekaman tasmi ini dapat diputar langsung oleh orang tua di sistem.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedTasmiForResult(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Edit Jadwal Ujian Tasmi'</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{editingTasmiSchedule.studentName}</p>
              </div>
              <button
                onClick={() => setEditingTasmiSchedule(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
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
                  editingTasmiSchedule.penguji || '',
                  editScheduleTarget
                );
                setEditingTasmiSchedule(null);
              }} 
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={editScheduleDate}
                    onChange={e => setEditScheduleDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Waktu</label>
                  <input
                    type="time"
                    value={editScheduleTime}
                    onChange={e => setEditScheduleTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Hafalan yang Diuji</label>
                <input
                  type="text"
                  value={editScheduleTarget}
                  onChange={e => setEditScheduleTarget(e.target.value)}
                  placeholder="Contoh: Juz 1-10 Bil Ghoib Sekali Duduk"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTasmiSchedule(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
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
