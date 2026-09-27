import React, { useState } from 'react';
import { useTahfidz } from '../context/TahfidzContext';
import { ALL_SURAHS, getSurahsForJuz } from '../data/quranData';
import { 
  Calendar, 
  Clock, 
  Check, 
  AlertTriangle, 
  X, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Save, 
  CalendarCheck,
  History,
  CheckCircle2,
  Trash2,
  Users,
  Search,
  Filter,
  CheckCheck,
  ArrowRight
} from 'lucide-react';
import { AttendanceStatus, HafalanQuality, HafalanType } from '../types';

export const AbsensiView: React.FC = () => {
  const { 
    currentUser, 
    santriList, 
    sessions, 
    groups, 
    saveBulkAttendance, 
    attendanceHistory,
    deleteAttendanceRecord
  } = useTahfidz();

  const isParent = currentUser?.role === 'parent';
  const child = isParent ? santriList.find(s => s.id === currentUser.studentId) || santriList[0] : null;

  // Selected session (default to first active session)
  const [selectedSessionKey, setSelectedSessionKey] = useState<string>(sessions[0]?.key || 'pagi');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Attendance state per student: { studentId: { status, keterangan, showHafalan, type, juz, surahNumber, ayatMulai, ayatSelesai, kualitas, catatan } }
  interface StudentAttendanceDraft {
    status: AttendanceStatus;
    keterangan?: string;
    showHafalan: boolean;
    hafalanType: HafalanType;
    juz: number;
    surahNumber: number;
    surahSampaiNumber?: number;
    murojaahMode?: 'surah_range' | 'single_surah';
    ayatMulai: number;
    ayatSelesai: number;
    kualitas: HafalanQuality;
    catatan: string;
  }

  const [attendanceDrafts, setAttendanceDrafts] = useState<Record<string, StudentAttendanceDraft>>(() => {
    const initial: Record<string, StudentAttendanceDraft> = {};
    santriList.forEach(s => {
      initial[s.id] = {
        status: 'hadir_tepat',
        showHafalan: false,
        hafalanType: 'baru',
        juz: 1,
        surahNumber: 1,
        surahSampaiNumber: 1,
        murojaahMode: 'surah_range',
        ayatMulai: 1,
        ayatSelesai: 7,
        kualitas: 'A',
        catatan: ''
      };
    });
    return initial;
  });

  const [historyFilterPeriod, setHistoryFilterPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [historyFilterGroup, setHistoryFilterGroup] = useState<string>('all');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const [singleSavedId, setSingleSavedId] = useState<string | null>(null);
  const [confirmDeleteAttId, setConfirmDeleteAttId] = useState<string | null>(null);
  const [submittedSessions, setSubmittedSessions] = useState<string[]>([]);

  const activeSessionObj = sessions.find(s => s.key === selectedSessionKey) || sessions[0];
  const selectedGroupObj = groups.find(g => g.id === selectedGroup || g.nama === selectedGroup);
  const currentSessionKey = `${attendanceDate}_${selectedSessionKey}_${selectedGroup}`;
  const isCurrentSessionSubmitted = submittedSessions.includes(currentSessionKey);

  // Filter students by halaqah and search keyword
  const visibleStudents = santriList.filter(s => {
    // 1. Filter by kelompok
    if (selectedGroup !== 'all') {
      const match = selectedGroupObj
        ? (s.kelompokId === selectedGroupObj.id || s.kelompokNama === selectedGroupObj.nama)
        : (s.kelompokId === selectedGroup || s.kelompokNama === selectedGroup);
      if (!match) return false;
    }

    // 2. Filter by search query
    if (searchStudent.trim()) {
      const query = searchStudent.toLowerCase();
      const matchName = s.nama.toLowerCase().includes(query);
      const matchKelas = s.kelasNama.toLowerCase().includes(query);
      if (!matchName && !matchKelas) return false;
    }

    return true;
  });

  // Mark all currently visible students with a status
  const markAllVisible = (status: AttendanceStatus) => {
    setAttendanceDrafts(prev => {
      const next = { ...prev };
      visibleStudents.forEach(s => {
        next[s.id] = {
          ...(next[s.id] || {
            showHafalan: false,
            hafalanType: 'baru',
            juz: 1,
            surahNumber: 1,
            surahSampaiNumber: 1,
            murojaahMode: 'surah_range',
            ayatMulai: 1,
            ayatSelesai: 7,
            kualitas: 'A',
            catatan: ''
          }),
          status,
          ...(status === 'tidak_hadir' ? { showHafalan: false } : {})
        };
      });
      return next;
    });
  };

  const updateDraft = (studentId: string, partial: Partial<StudentAttendanceDraft>) => {
    setAttendanceDrafts(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {
          status: 'hadir_tepat',
          showHafalan: false,
          hafalanType: 'baru',
          juz: 1,
          surahNumber: 1,
          surahSampaiNumber: 1,
          murojaahMode: 'surah_range',
          ayatMulai: 1,
          ayatSelesai: 7,
          kualitas: 'A',
          catatan: ''
        }),
        ...partial
      }
    }));
  };

  // Helper to build attendance record payload
  const createRecordPayload = (student: typeof santriList[0]) => {
    const draft = attendanceDrafts[student.id] || {
      status: 'hadir_tepat',
      showHafalan: false,
      hafalanType: 'baru',
      juz: 1,
      surahNumber: 1,
      surahSampaiNumber: 1,
      murojaahMode: 'surah_range',
      ayatMulai: 1,
      ayatSelesai: 7,
      kualitas: 'A',
      catatan: ''
    };

    const isMurojaahRange = draft.hafalanType === 'muroja' && (draft.murojaahMode || 'surah_range') === 'surah_range';
    const surahMeta = ALL_SURAHS.find(s => s.number === draft.surahNumber);
    const surahSampaiMeta = ALL_SURAHS.find(s => s.number === (draft.surahSampaiNumber || draft.surahNumber));

    let finalSurahName = surahMeta ? surahMeta.name : `Surah ${draft.surahNumber}`;
    if (isMurojaahRange && surahSampaiMeta) {
      if (surahSampaiMeta.number !== (surahMeta?.number || 1)) {
        finalSurahName = `${surahMeta ? surahMeta.name : `Surah ${draft.surahNumber}`} s/d ${surahSampaiMeta.name}`;
      } else {
        finalSurahName = surahMeta ? surahMeta.name : `Surah ${draft.surahNumber}`;
      }
    }

    return {
      studentId: student.id,
      studentName: student.nama,
      kelompokId: student.kelompokId,
      sessionKey: selectedSessionKey,
      sessionName: activeSessionObj ? activeSessionObj.nama : 'Sesi Tahfidz',
      tanggal: attendanceDate,
      status: draft.status,
      keterangan: draft.keterangan,
      hafalan: draft.showHafalan && draft.status !== 'tidak_hadir' ? {
        type: draft.hafalanType,
        category: 'surah' as const,
        juz: draft.juz,
        surahNumber: draft.surahNumber,
        surahName: finalSurahName,
        ayatMulai: draft.ayatMulai,
        ayatSelesai: draft.ayatSelesai,
        kualitas: draft.kualitas,
        catatan: draft.catatan,
        tanggal: attendanceDate
      } : undefined
    };
  };

  const handleSaveSingleStudent = (student: typeof santriList[0]) => {
    const payload = createRecordPayload(student);
    saveBulkAttendance([payload]);
    setSingleSavedId(student.id);
    setTimeout(() => setSingleSavedId(null), 2500);
  };

  const handleSaveAll = () => {
    const recordsToSave = visibleStudents.map(student => createRecordPayload(student));

    saveBulkAttendance(recordsToSave);
    setSubmittedSessions(prev => Array.from(new Set([...prev, currentSessionKey])));
    setSaveSuccessMessage(`Seluruh absensi & setoran berhasil disimpan untuk ${recordsToSave.length} santri!`);
    setTimeout(() => setSaveSuccessMessage(''), 4000);
  };

  // Filter history records by period and kelompok
  const filteredHistory = attendanceHistory.filter(record => {
    // 1. Period filter
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (historyFilterPeriod === 'today') {
      if (record.tanggal !== todayStr) return false;
    } else if (historyFilterPeriod === 'week') {
      const recDate = new Date(record.tanggal);
      const diffTime = now.getTime() - recDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);
      if (diffDays < 0 || diffDays > 7) return false;
    } else if (historyFilterPeriod === 'month') {
      const recDate = new Date(record.tanggal);
      const diffTime = now.getTime() - recDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);
      if (diffDays < 0 || diffDays > 30) return false;
    }

    // 2. Group filter in history
    if (historyFilterGroup !== 'all') {
      const targetGroup = groups.find(g => g.id === historyFilterGroup || g.nama === historyFilterGroup);
      const targetId = targetGroup?.id || historyFilterGroup;
      const targetName = targetGroup?.nama || historyFilterGroup;
      const student = santriList.find(s => s.id === record.studentId);
      
      const matchesGroup = record.kelompokId === targetId ||
                           record.kelompokId === targetName ||
                           (student && (student.kelompokId === targetId || student.kelompokNama === targetName));
      if (!matchesGroup) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Absensi & Halaqah Harian
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan kehadiran sesi dan setoran langsung santri
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={attendanceDate}
            onChange={e => setAttendanceDate(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* PARENT VIEW (if logged in as parent) */}
      {isParent && child ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Riwayat Kehadiran: {child.nama}
              </h3>
              <p className="text-xs text-slate-500">
                Tingkat kehadiran: <strong className="text-emerald-700 font-bold">{child.kehadiranPersen}%</strong> (Sangat Baik)
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold">
              Wali Santri
            </span>
          </div>

          <div className="space-y-3">
            {attendanceHistory
              .filter(a => a.studentId === child.id)
              .slice(0, 10)
              .map(record => (
                <div 
                  key={record.id}
                  className="flex items-start justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80"
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-900">
                      {record.tanggal} · {record.sessionName}
                    </div>
                    {record.hafalanDeposit && (
                      <p className="text-xs text-emerald-700 font-medium mt-1">
                        📖 Menyetor: Juz {record.hafalanDeposit.juz} {record.hafalanDeposit.surahName} (Nilai {record.hafalanDeposit.kualitas})
                      </p>
                    )}
                    {record.keterangan && (
                      <p className="text-xs text-slate-500 italic mt-0.5">
                        Keterangan: {record.keterangan}
                      </p>
                    )}
                  </div>

                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    record.status === 'hadir_tepat'
                      ? 'bg-emerald-100 text-emerald-800'
                      : record.status === 'hadir_terlambat'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {record.status === 'hadir_tepat' ? 'Hadir Tepat Waktu' : record.status === 'hadir_terlambat' ? 'Terlambat' : 'Tidak Hadir'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      ) : (
        /* GURU / ADMIN VIEW */
        <>
          {/* Sesi Selection Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">
                Pilih Sesi Halaqah
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {sessions.map(sesi => {
                  const isSelected = selectedSessionKey === sesi.key;
                  return (
                    <button
                      key={sesi.id}
                      onClick={() => setSelectedSessionKey(sesi.key)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{sesi.nama}</span>
                        <Clock className={`w-4 h-4 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                      </div>
                      <span className="text-xs text-slate-500 font-normal block mt-1">
                        {sesi.jamMulai} - {sesi.jamSelesai} WIB
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter Halaqah / Kelompok */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <Filter className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Filter Halaqah:</span>
                </div>
                {selectedGroup !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedGroup('all')}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium underline"
                  >
                    Reset Filter (Semua Halaqah)
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedGroup('all')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                    selectedGroup === 'all'
                      ? 'bg-emerald-700 text-white font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Semua Halaqah</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    selectedGroup === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {santriList.length}
                  </span>
                </button>

                {groups.map(grp => {
                  const isSelected = selectedGroup === grp.id || selectedGroup === grp.nama;
                  const count = santriList.filter(s => s.kelompokId === grp.id || s.kelompokNama === grp.nama).length;

                  return (
                    <button
                      key={grp.id}
                      type="button"
                      onClick={() => setSelectedGroup(grp.id)}
                      className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-700 text-white font-bold shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{grp.nama}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Halaqah Info Banner */}
              {selectedGroup !== 'all' && selectedGroupObj && (
                <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-emerald-950 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      {selectedGroupObj.nama}
                    </span>
                    <span className="text-emerald-700">· Pengajar: <strong className="font-semibold text-emerald-900">{selectedGroupObj.pengajar}</strong></span>
                    <span className="text-emerald-700">· Terdaftar: <strong className="font-semibold text-emerald-900">{visibleStudents.length} santri</strong></span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    Filter aktif
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Student Attendance Section: Either Input Form or Completed State */}
          {isCurrentSessionSubmitted ? (
            <div className="bg-white rounded-2xl border border-emerald-200/90 p-6 sm:p-8 shadow-xs text-center space-y-4 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1.5 max-w-lg mx-auto">
                <h3 className="text-xl font-bold text-slate-900">
                  Absensi & Setoran Berhasil Disimpan
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Data kehadiran dan setoran santri telah berhasil dicatat untuk sesi <strong className="text-slate-800">{activeSessionObj?.nama}</strong> tanggal <strong className="text-slate-800">{attendanceDate}</strong> ({selectedGroupObj ? selectedGroupObj.nama : 'Seluruh Halaqah'}). Daftar santri telah ditutup.
                </p>
              </div>

              <div className="inline-flex flex-wrap items-center justify-center gap-2 p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-xs text-emerald-950">
                <span className="flex items-center gap-1 font-semibold">
                  <CalendarCheck className="w-4 h-4 text-emerald-600" />
                  {attendanceDate}
                </span>
                <span>•</span>
                <span className="font-semibold">{activeSessionObj?.nama}</span>
                <span>•</span>
                <span className="font-semibold">{selectedGroupObj ? selectedGroupObj.nama : 'Seluruh Halaqah'}</span>
                <span>•</span>
                <span className="font-bold text-emerald-800">{visibleStudents.length} Santri Tersimpan</span>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('riwayat-absensi');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
                >
                  <History className="w-4 h-4" />
                  Lihat Riwayat Absensi
                </button>
                <button
                  type="button"
                  onClick={() => setSubmittedSessions(prev => prev.filter(k => k !== currentSessionKey))}
                  className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-all shadow-xs"
                >
                  Buka / Edit Kembali Daftar Santri
                </button>
              </div>
            </div>
          ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Daftar Santri ({visibleStudents.length})
                </h3>
                <span className="text-xs text-slate-500">
                  {activeSessionObj ? activeSessionObj.nama : 'Sesi'} · {attendanceDate}
                  {selectedGroupObj ? ` · ${selectedGroupObj.nama}` : ' · Seluruh Halaqah'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchStudent}
                    onChange={e => setSearchStudent(e.target.value)}
                    placeholder="Cari santri..."
                    className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 w-36 sm:w-48"
                  />
                </div>

                <button
                  onClick={handleSaveAll}
                  disabled={visibleStudents.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Simpan Seluruh Absensi & Setoran
                </button>
              </div>
            </div>

            {/* Quick Batch Action for Filtered Students */}
            {visibleStudents.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                  Tandai Sekaligus ({visibleStudents.length} Santri):
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => markAllVisible('hadir_tepat')}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <Check className="w-3 h-3 text-emerald-600" />
                    Semua Tepat Waktu
                  </button>
                  <button
                    type="button"
                    onClick={() => markAllVisible('hadir_terlambat')}
                    className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-700 hover:text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <Clock className="w-3 h-3 text-amber-600" />
                    Semua Terlambat
                  </button>
                  <button
                    type="button"
                    onClick={() => markAllVisible('tidak_hadir')}
                    className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <X className="w-3 h-3 text-rose-600" />
                    Semua Tidak Hadir
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {visibleStudents.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <Users className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-slate-700 font-semibold text-sm">
                    {searchStudent.trim() 
                      ? 'Tidak ada santri yang cocok dengan pencarian.'
                      : `Tidak ada santri di ${selectedGroupObj ? selectedGroupObj.nama : 'halaqah ini'}.`
                    }
                  </p>
                  <p className="text-slate-400 text-xs">
                    {searchStudent.trim()
                      ? 'Coba gunakan kata kunci lain.'
                      : 'Pilih halaqah lain atau kelola santri di menu Kelola Data.'
                    }
                  </p>
                  {(selectedGroup !== 'all' || searchStudent.trim()) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGroup('all');
                        setSearchStudent('');
                      }}
                      className="mt-2 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs"
                    >
                      Tampilkan Seluruh Santri
                    </button>
                  )}
                </div>
              ) : (
                visibleStudents.map(student => {
                const draft = attendanceDrafts[student.id] || {
                  status: 'hadir_tepat',
                  showHafalan: false,
                  hafalanType: 'baru',
                  juz: 1,
                  surahNumber: 1,
                  surahSampaiNumber: 1,
                  murojaahMode: 'surah_range',
                  ayatMulai: 1,
                  ayatSelesai: 7,
                  kualitas: 'A',
                  catatan: ''
                };

                const surahsForJuz = getSurahsForJuz(draft.juz);
                const isMurojaahRange = draft.hafalanType === 'muroja' && (draft.murojaahMode || 'surah_range') === 'surah_range';

                return (
                  <div
                    key={student.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 hover:border-slate-300 transition-all space-y-3"
                  >
                    {/* Top row: Avatar, Name, Status Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {student.nama.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-tight">
                            {student.nama}
                          </h4>
                          <span className="text-xs text-slate-500">
                            {student.kelompokNama} · {student.kelasNama}
                          </span>
                        </div>
                      </div>

                      {/* Attendance 3-button status toggle */}
                      <div className="flex items-center gap-1.5 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => updateDraft(student.id, { status: 'hadir_tepat' })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            draft.status === 'hadir_tepat'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Tepat Waktu
                        </button>
                        <button
                          type="button"
                          onClick={() => updateDraft(student.id, { status: 'hadir_terlambat' })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            draft.status === 'hadir_terlambat'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Terlambat
                        </button>
                        <button
                          type="button"
                          onClick={() => updateDraft(student.id, { status: 'tidak_hadir', showHafalan: false })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            draft.status === 'tidak_hadir'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Tidak Hadir
                        </button>
                      </div>
                    </div>

                    {/* Absent reason input */}
                    {draft.status === 'tidak_hadir' && (
                      <div className="pt-2">
                        <input
                          type="text"
                          value={draft.keterangan || ''}
                          onChange={e => updateDraft(student.id, { keterangan: e.target.value })}
                          placeholder="Alasan tidak hadir (Sakit flu, Izin keluar kota, etc.)..."
                          className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    )}

                    {/* Inline Hafalan Logging Toggle Button (when present) */}
                    {draft.status !== 'tidak_hadir' && (
                      <div className="pt-2 border-t border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => updateDraft(student.id, { showHafalan: !draft.showHafalan })}
                          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                            draft.showHafalan ? 'text-emerald-700' : 'text-slate-600 hover:text-emerald-700'
                          }`}
                        >
                          <BookOpen className="w-4 h-4 text-emerald-600" />
                          <span>Pencatatan Setoran Hafalan Sesi Ini (Opsional)</span>
                          {draft.showHafalan ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {/* Inline Form Accordion */}
                        {draft.showHafalan && (
                          <div className="mt-3 p-3.5 bg-white rounded-xl border border-emerald-200/80 space-y-3 animate-in fade-in duration-150">
                            
                            {/* Hafalan Type Selection */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-slate-500 font-medium">Jenis:</span>
                              {(['baru', 'muroja', 'perbaikan'] as const).map(ht => (
                                <button
                                  key={ht}
                                  type="button"
                                  onClick={() => {
                                    const surahs = getSurahsForJuz(draft.juz);
                                    const firstNum = surahs[0]?.number || 1;
                                    const lastNum = surahs[surahs.length - 1]?.number || firstNum;
                                    updateDraft(student.id, { 
                                      hafalanType: ht,
                                      ...(ht === 'muroja' ? {
                                        murojaahMode: draft.murojaahMode || 'surah_range',
                                        surahSampaiNumber: draft.surahSampaiNumber || lastNum
                                      } : {})
                                    });
                                  }}
                                  className={`px-2.5 py-1 text-xs rounded-md font-medium capitalize transition-colors ${
                                    draft.hafalanType === ht
                                      ? 'bg-emerald-100 text-emerald-800 font-bold'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {ht === 'baru' ? 'Hafalan Baru' : ht === 'muroja' ? "Muroja'ah" : 'Perbaikan'}
                                </button>
                              ))}
                            </div>

                            {/* Opsi Khusus Muroja'ah: Dari Surat A s/d Surat B */}
                            {draft.hafalanType === 'muroja' && (
                              <div className="p-2.5 bg-emerald-50/80 border border-emerald-200/90 rounded-xl space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                                    <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                                    Pilihan Format Muroja'ah:
                                  </span>
                                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-emerald-200 text-xs">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const surahs = getSurahsForJuz(draft.juz);
                                        const lastNum = surahs[surahs.length - 1]?.number || draft.surahNumber;
                                        updateDraft(student.id, { 
                                          murojaahMode: 'surah_range',
                                          surahSampaiNumber: draft.surahSampaiNumber || lastNum
                                        });
                                      }}
                                      className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all flex items-center gap-1 ${
                                        (draft.murojaahMode || 'surah_range') === 'surah_range'
                                          ? 'bg-emerald-700 text-white shadow-xs'
                                          : 'text-slate-600 hover:text-emerald-800'
                                      }`}
                                    >
                                      <span>Dari Surat A s/d Surat B</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateDraft(student.id, { murojaahMode: 'single_surah' })}
                                      className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all ${
                                        draft.murojaahMode === 'single_surah'
                                          ? 'bg-emerald-700 text-white shadow-xs'
                                          : 'text-slate-600 hover:text-emerald-800'
                                      }`}
                                    >
                                      Satu Surat & Rentang Ayat
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Form Input Detail Hafalan */}
                            {isMurojaahRange ? (
                              /* TAMPILAN MUROJA'AH: DARI SURAT A SAMPAI SURAT B */
                              <div className="space-y-2.5">
                                {/* Pilihan Juz Acuan */}
                                <div className="flex items-center gap-2">
                                  <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                                    Juz Acuan:
                                  </label>
                                  <select
                                    value={draft.juz}
                                    onChange={e => {
                                      const newJuz = Number(e.target.value);
                                      const surahs = getSurahsForJuz(newJuz);
                                      const firstSurah = surahs[0]?.number || 1;
                                      const lastSurah = surahs[surahs.length - 1]?.number || firstSurah;
                                      const lastSurahMeta = ALL_SURAHS.find(s => s.number === lastSurah);
                                      updateDraft(student.id, {
                                        juz: newJuz,
                                        surahNumber: firstSurah,
                                        surahSampaiNumber: lastSurah,
                                        ayatMulai: 1,
                                        ayatSelesai: lastSurahMeta?.totalAyahs || 7
                                      });
                                    }}
                                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                                  >
                                    {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                                      <option key={j} value={j}>Juz {j}</option>
                                    ))}
                                  </select>
                                  <span className="text-[11px] text-slate-400">
                                    (Surah dalam Juz {draft.juz} tampil di urutan atas pilihan)
                                  </span>
                                </div>

                                {/* Opsi Dari Surat A sampai Surat B */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                  {/* Dari Surat A */}
                                  <div className="space-y-1.5">
                                    <label className="block text-[11px] font-bold text-emerald-950">
                                      Dari Surat (Surat A):
                                    </label>
                                    <select
                                      value={draft.surahNumber}
                                      onChange={e => {
                                        const newNum = Number(e.target.value);
                                        const currentEnd = draft.surahSampaiNumber || newNum;
                                        const endNum = currentEnd < newNum ? newNum : currentEnd;
                                        const endMeta = ALL_SURAHS.find(s => s.number === endNum);
                                        updateDraft(student.id, {
                                          surahNumber: newNum,
                                          surahSampaiNumber: endNum,
                                          ayatMulai: 1,
                                          ayatSelesai: endMeta?.totalAyahs || 7
                                        });
                                      }}
                                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs truncate"
                                    >
                                      <optgroup label={`Surah di Juz ${draft.juz}`}>
                                        {surahsForJuz.map(s => (
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
                                      <span className="text-[10px] text-slate-500 whitespace-nowrap">Mulai Ayat:</span>
                                      <input
                                        type="number"
                                        min={1}
                                        value={draft.ayatMulai}
                                        onChange={e => updateDraft(student.id, { ayatMulai: Number(e.target.value) })}
                                        className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-md text-xs"
                                        placeholder="1"
                                      />
                                    </div>
                                  </div>

                                  {/* Sampai Surat B */}
                                  <div className="space-y-1.5">
                                    <label className="block text-[11px] font-bold text-emerald-950">
                                      Sampai Surat (Surat B):
                                    </label>
                                    <select
                                      value={draft.surahSampaiNumber || draft.surahNumber}
                                      onChange={e => {
                                        const newEndNum = Number(e.target.value);
                                        const endMeta = ALL_SURAHS.find(s => s.number === newEndNum);
                                        updateDraft(student.id, {
                                          surahSampaiNumber: newEndNum,
                                          ayatSelesai: endMeta?.totalAyahs || 7
                                        });
                                      }}
                                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs truncate"
                                    >
                                      <optgroup label={`Surah di Juz ${draft.juz}`}>
                                        {surahsForJuz.map(s => (
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
                                      <span className="text-[10px] text-slate-500 whitespace-nowrap">Sampai Ayat:</span>
                                      <input
                                        type="number"
                                        min={1}
                                        value={draft.ayatSelesai}
                                        onChange={e => updateDraft(student.id, { ayatSelesai: Number(e.target.value) })}
                                        className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-md text-xs"
                                        placeholder="Akhir"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Preview Rentang Muroja'ah */}
                                {(() => {
                                  const sA = ALL_SURAHS.find(s => s.number === draft.surahNumber);
                                  const sB = ALL_SURAHS.find(s => s.number === (draft.surahSampaiNumber || draft.surahNumber));
                                  return (
                                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-1 text-[11px] text-emerald-950">
                                      <div className="flex items-center gap-1.5 font-semibold">
                                        <span className="px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 text-[10px] font-bold">Ringkasan</span>
                                        <span>Surah {sA?.name} (Ayat {draft.ayatMulai})</span>
                                        <ArrowRight className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                        <span>Surah {sB?.name} (Ayat {draft.ayatSelesai})</span>
                                      </div>
                                      <span className="text-[10px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                                        Juz {draft.juz}
                                      </span>
                                    </div>
                                  );
                                })()}

                                {/* Kualitas Nilai & Catatan */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <div>
                                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                                      Nilai Muroja'ah
                                    </label>
                                    <select
                                      value={draft.kualitas}
                                      onChange={e => updateDraft(student.id, { kualitas: e.target.value as HafalanQuality })}
                                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                                    >
                                      <option value="A">Nilai: A (Mumtaz)</option>
                                      <option value="B">Nilai: B (Jayyid)</option>
                                      <option value="C">Nilai: C (Maqbul)</option>
                                      <option value="D">Nilai: D (Ulang)</option>
                                    </select>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                                      Catatan Ustadz (Opsional)
                                    </label>
                                    <input
                                      type="text"
                                      value={draft.catatan}
                                      onChange={e => updateDraft(student.id, { catatan: e.target.value })}
                                      placeholder="Catatan muroja'ah santri..."
                                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* TAMPILAN STANDAR (HAFALAN BARU / PERBAIKAN / PER SURAT) */
                              <div className="space-y-2">
                                {/* Juz & Surah */}
                                <div className="grid grid-cols-2 gap-2">
                                  <select
                                    value={draft.juz}
                                    onChange={e => {
                                      const newJuz = Number(e.target.value);
                                      const surahs = getSurahsForJuz(newJuz);
                                      const firstSurah = surahs[0]?.number || 1;
                                      const sMeta = ALL_SURAHS.find(s => s.number === firstSurah);
                                      updateDraft(student.id, {
                                        juz: newJuz,
                                        surahNumber: firstSurah,
                                        surahSampaiNumber: firstSurah,
                                        ayatMulai: 1,
                                        ayatSelesai: sMeta?.totalAyahs || 7
                                      });
                                    }}
                                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                                  >
                                    {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                                      <option key={j} value={j}>Juz {j}</option>
                                    ))}
                                  </select>

                                  <select
                                    value={draft.surahNumber}
                                    onChange={e => {
                                      const newNum = Number(e.target.value);
                                      const sMeta = ALL_SURAHS.find(s => s.number === newNum);
                                      updateDraft(student.id, { 
                                        surahNumber: newNum,
                                        surahSampaiNumber: newNum,
                                        ayatMulai: 1,
                                        ayatSelesai: sMeta?.totalAyahs || 7
                                      });
                                    }}
                                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs truncate"
                                  >
                                    {surahsForJuz.map(s => (
                                      <option key={s.number} value={s.number}>
                                        {s.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Ayat Range & Kualitas */}
                                <div className="grid grid-cols-3 gap-2">
                                  <input
                                    type="number"
                                    min={1}
                                    value={draft.ayatMulai}
                                    onChange={e => updateDraft(student.id, { ayatMulai: Number(e.target.value) })}
                                    placeholder="Ayat mulai"
                                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                                  />
                                  <input
                                    type="number"
                                    min={draft.ayatMulai}
                                    value={draft.ayatSelesai}
                                    onChange={e => updateDraft(student.id, { ayatSelesai: Number(e.target.value) })}
                                    placeholder="Ayat selesai"
                                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                                  />
                                  <select
                                    value={draft.kualitas}
                                    onChange={e => updateDraft(student.id, { kualitas: e.target.value as HafalanQuality })}
                                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                                  >
                                    <option value="A">Nilai: A (Mumtaz)</option>
                                    <option value="B">Nilai: B (Jayyid)</option>
                                    <option value="C">Nilai: C (Maqbul)</option>
                                    <option value="D">Nilai: D (Ulang)</option>
                                  </select>
                                </div>

                                {/* Catatan */}
                                <input
                                  type="text"
                                  value={draft.catatan}
                                  onChange={e => updateDraft(student.id, { catatan: e.target.value })}
                                  placeholder="Catatan ustadz..."
                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                                />
                              </div>
                            )}

                            {/* Tombol Simpan Setoran Santri Ini */}
                            <div className="pt-2 border-t border-emerald-100 flex items-center justify-between">
                              <span className="text-[11px] text-emerald-800 font-medium">
                                Simpan hafalan ini langsung ke database:
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSaveSingleStudent(student)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs ${
                                  singleSavedId === student.id
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                }`}
                              >
                                {singleSavedId === student.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Tersimpan!</span>
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Simpan Setoran Santri Ini</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSaveAll}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-colors"
              >
                <Save className="w-4 h-4" />
                Simpan Seluruh Absensi & Setoran
              </button>
            </div>
          </div>
          )}

          {/* Riwayat Absensi */}
          <div id="riwayat-absensi" className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 scroll-mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Riwayat Absensi Terakhir ({filteredHistory.length})
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Halaqah filter in history */}
                <select
                  value={historyFilterGroup}
                  onChange={e => setHistoryFilterGroup(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Semua Halaqah</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.nama}</option>
                  ))}
                </select>

                {/* Period filter buttons */}
                <div className="flex items-center gap-1 text-xs">
                  {([
                    { key: 'today', label: 'Hari Ini' },
                    { key: 'week', label: 'Minggu Ini' },
                    { key: 'month', label: 'Bulan Ini' },
                    { key: 'all', label: 'Semua' }
                  ] as const).map(p => (
                    <button
                      key={p.key}
                      onClick={() => setHistoryFilterPeriod(p.key)}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                        historyFilterPeriod === p.key
                          ? 'bg-slate-900 text-white font-semibold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Belum ada data absensi pada periode atau halaqah ini.
                </div>
              ) : (
                filteredHistory.map(rec => {
                  const studentData = santriList.find(s => s.id === rec.studentId);
                  const groupName = studentData?.kelompokNama || groups.find(g => g.id === rec.kelompokId)?.nama;

                  return (
                    <div 
                      key={rec.id}
                      className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{rec.studentName}</span>
                          {groupName && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px] font-medium">
                              {groupName}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {rec.tanggal} · {rec.sessionName}
                          {rec.hafalanDeposit && (
                            <span className="text-emerald-700 font-semibold ml-1">
                              · Setor Juz {rec.hafalanDeposit.juz} {rec.hafalanDeposit.surahName} (Nilai {rec.hafalanDeposit.kualitas})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                          rec.status === 'hadir_tepat'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'hadir_terlambat'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {rec.status === 'hadir_tepat' ? 'Tepat Waktu' : rec.status === 'hadir_terlambat' ? 'Terlambat' : 'Tidak Hadir'}
                        </span>

                        {!isParent && (
                          confirmDeleteAttId === rec.id ? (
                            <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                              <span className="text-[10px] text-red-700 font-semibold px-1">Hapus?</span>
                              <button
                                type="button"
                                onClick={() => {
                                  deleteAttendanceRecord(rec.id);
                                  setConfirmDeleteAttId(null);
                                }}
                                className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold"
                              >
                                Ya
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteAttId(null)}
                                className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px]"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteAttId(rec.id)}
                              title="Hapus Catatan Absensi"
                              className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
};
