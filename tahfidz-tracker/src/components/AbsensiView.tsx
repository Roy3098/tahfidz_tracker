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
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Award,
  Sparkles,
  BarChart2,
  Edit3,
  Plus,
  Smile,
  MessageSquare
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, HafalanQuality, HafalanType } from '../types';
import { AbsensiWeeklyView } from './AbsensiWeeklyView';
import { AbsensiMonthlyView } from './AbsensiMonthlyView';

export const BEHAVIOR_PRESETS = [
  '🌟 Sangat Fokus & Tertib',
  '📖 Aktif Menyimak',
  '✨ Adab Sangat Baik',
  '😴 Mengantuk / Kurang Fit',
  '💬 Kurang Fokus',
  '🔄 Perlu Dimotivasi'
];

export const AbsensiView: React.FC = () => {
  const { 
    currentUser, 
    santriList, 
    sessions, 
    groups, 
    saveBulkAttendance, 
    saveAttendanceSetoran,
    updateAttendancePerilaku,
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

  // Attendance state per student: status, absent keterangan, and catatan perilaku
  interface StudentAttendanceDraft {
    status: AttendanceStatus;
    keterangan?: string;
    catatanPerilaku?: string;
  }

  const [attendanceDrafts, setAttendanceDrafts] = useState<Record<string, StudentAttendanceDraft>>(() => {
    const initial: Record<string, StudentAttendanceDraft> = {};
    santriList.forEach(s => {
      initial[s.id] = {
        status: 'hadir_tepat',
        keterangan: '',
        catatanPerilaku: ''
      };
    });
    return initial;
  });

  // State for recording setoran hafalan from Riwayat Absensi
  interface HistorySetoranDraft {
    hafalanType: HafalanType;
    juz: number;
    surahNumber: number;
    surahSampaiNumber?: number;
    murojaahMode?: 'surah_range' | 'single_surah';
    ayatMulai: number;
    ayatSelesai: number;
    kualitas: HafalanQuality;
    catatan: string;
    catatanPerilaku?: string;
  }

  const [historySetoranDrafts, setHistorySetoranDrafts] = useState<Record<string, HistorySetoranDraft>>({});
  const [activeRecordForSetoranId, setActiveRecordForSetoranId] = useState<string | null>(null);
  const [showRecordedStudents, setShowRecordedStudents] = useState<boolean>(false);
  const [editingPerilakuRecId, setEditingPerilakuRecId] = useState<string | null>(null);
  const [editingPerilakuText, setEditingPerilakuText] = useState<string>('');

  // Main Period Filter: Per Hari, Per Minggu, Per Bulan
  const [periodFilterMode, setPeriodFilterMode] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

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

  // Check if a student is already recorded in attendanceHistory for the selected session and date
  const isStudentRecordedInCurrentSession = (studentId: string) => {
    return attendanceHistory.some(
      a => a.studentId === studentId && 
           a.tanggal === attendanceDate && 
           a.sessionKey === selectedSessionKey
    );
  };

  // Only show students who have not yet been marked for this session on this day
  const unrecordedStudents = visibleStudents.filter(s => !isStudentRecordedInCurrentSession(s.id));
  const recordedStudents = visibleStudents.filter(s => isStudentRecordedInCurrentSession(s.id));

  // Mark all unrecorded students with a status
  const markAllVisible = (status: AttendanceStatus) => {
    setAttendanceDrafts(prev => {
      const next = { ...prev };
      unrecordedStudents.forEach(s => {
        next[s.id] = {
          ...(next[s.id] || { status: 'hadir_tepat', keterangan: '', catatanPerilaku: '' }),
          status
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
          keterangan: '',
          catatanPerilaku: ''
        }),
        ...partial
      }
    }));
  };

  // Helper to build attendance record payload
  const createRecordPayload = (student: typeof santriList[0]) => {
    const draft = attendanceDrafts[student.id] || {
      status: 'hadir_tepat',
      keterangan: '',
      catatanPerilaku: ''
    };

    return {
      studentId: student.id,
      studentName: student.nama,
      kelompokId: student.kelompokId,
      sessionKey: selectedSessionKey,
      sessionName: activeSessionObj ? activeSessionObj.nama : 'Sesi Tahfidz',
      tanggal: attendanceDate,
      status: draft.status,
      keterangan: draft.keterangan || '',
      catatanPerilaku: draft.catatanPerilaku || ''
    };
  };

  const handleSaveSingleStudent = (student: typeof santriList[0]) => {
    const payload = createRecordPayload(student);
    saveBulkAttendance([payload]);
    setSingleSavedId(student.id);
    setSaveSuccessMessage(`Absensi ${student.nama} berhasil dicatat!`);
    setTimeout(() => {
      setSingleSavedId(null);
      setSaveSuccessMessage('');
    }, 2500);
  };

  const handleSaveAll = () => {
    if (unrecordedStudents.length === 0) return;
    const recordsToSave = unrecordedStudents.map(student => createRecordPayload(student));

    saveBulkAttendance(recordsToSave);
    setSubmittedSessions(prev => Array.from(new Set([...prev, currentSessionKey])));
    setSaveSuccessMessage(`Seluruh absensi berhasil disimpan untuk ${recordsToSave.length} santri!`);
    setTimeout(() => setSaveSuccessMessage(''), 4000);
  };

  // Riwayat Absensi setoran handlers
  const openSetoranForm = (rec: AttendanceRecord) => {
    if (activeRecordForSetoranId === rec.id) {
      setActiveRecordForSetoranId(null);
      return;
    }

    const existingHafalan = rec.hafalanDeposit;
    const defaultJuz = existingHafalan?.juz || 1;
    const surahsInJuz = getSurahsForJuz(defaultJuz);
    const defaultSurahNum = existingHafalan?.surahNumber || surahsInJuz[0]?.number || 1;
    const surahMeta = ALL_SURAHS.find(s => s.number === defaultSurahNum);

    setHistorySetoranDrafts(prev => ({
      ...prev,
      [rec.id]: {
        hafalanType: existingHafalan?.type || 'baru',
        juz: defaultJuz,
        surahNumber: defaultSurahNum,
        surahSampaiNumber: existingHafalan?.surahNumber || surahsInJuz[surahsInJuz.length - 1]?.number || defaultSurahNum,
        murojaahMode: 'surah_range',
        ayatMulai: existingHafalan?.ayatMulai || 1,
        ayatSelesai: existingHafalan?.ayatSelesai || surahMeta?.totalAyahs || 7,
        kualitas: existingHafalan?.kualitas || 'A',
        catatan: existingHafalan?.catatan || '',
        catatanPerilaku: rec.catatanPerilaku || ''
      }
    }));

    setActiveRecordForSetoranId(rec.id);
  };

  const updateHistorySetoranDraft = (recordId: string, partial: Partial<HistorySetoranDraft>) => {
    setHistorySetoranDrafts(prev => ({
      ...prev,
      [recordId]: {
        ...(prev[recordId] || {
          hafalanType: 'baru',
          juz: 1,
          surahNumber: 1,
          surahSampaiNumber: 1,
          murojaahMode: 'surah_range',
          ayatMulai: 1,
          ayatSelesai: 7,
          kualitas: 'A',
          catatan: '',
          catatanPerilaku: ''
        }),
        ...partial
      }
    }));
  };

  const handleSaveHistorySetoran = (rec: AttendanceRecord) => {
    const draft = historySetoranDrafts[rec.id];
    if (!draft) return;

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

    saveAttendanceSetoran(
      rec.id,
      {
        type: draft.hafalanType,
        category: 'surah',
        juz: draft.juz,
        surahNumber: draft.surahNumber,
        surahName: finalSurahName,
        ayatMulai: draft.ayatMulai,
        ayatSelesai: draft.ayatSelesai,
        kualitas: draft.kualitas,
        catatan: draft.catatan,
        tanggal: rec.tanggal
      },
      draft.catatanPerilaku
    );

    setActiveRecordForSetoranId(null);
    setSaveSuccessMessage(`Setoran untuk ${rec.studentName} berhasil disimpan & langsung tersinkron ke halaman hafalan!`);
    setTimeout(() => setSaveSuccessMessage(''), 4500);
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

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Daily Summary metrics for attendanceDate
  const dailySummary = React.useMemo(() => {
    const recordsToday = attendanceHistory.filter(a => a.tanggal === attendanceDate);
    const onTime = recordsToday.filter(a => a.status === 'hadir_tepat').length;
    const late = recordsToday.filter(a => a.status === 'hadir_terlambat').length;
    const absent = recordsToday.filter(a => a.status === 'tidak_hadir').length;
    const total = recordsToday.length;
    const setoranCount = recordsToday.filter(a => !!a.hafalanDeposit).length;
    return {
      totalRecorded: total,
      onTime,
      late,
      absent,
      setoranCount,
      pctHadir: total > 0 ? Math.round(((onTime + late) / total) * 100) : 0
    };
  }, [attendanceHistory, attendanceDate]);

  // Weekly data computation (7 days)
  const weekData = React.useMemo(() => {
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + (weekOffset * 7));
    
    // Find Monday
    const day = targetDate.getDay();
    const diffToMonday = targetDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(targetDate);
    monday.setDate(diffToMonday);

    const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const fullDayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];
    const days: {
      dateIso: string;
      dayName: string;
      fullDayName: string;
      dateLabel: string;
      fullFormatted: string;
    }[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        dateIso: d.toISOString().split('T')[0],
        dayName: dayNames[i],
        fullDayName: fullDayNames[i],
        dateLabel: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        fullFormatted: d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      });
    }

    const weekStartStr = days[0].dateLabel;
    const weekEndStr = `${days[6].dateLabel} ${monday.getFullYear()}`;
    const weekLabel = `${days[0].fullDayName}, ${days[0].dateLabel} - ${days[6].fullDayName}, ${days[6].dateLabel} ${monday.getFullYear()}`;

    const isoDatesSet = new Set(days.map(d => d.dateIso));
    const weekRecords = attendanceHistory.filter(r => isoDatesSet.has(r.tanggal));
    const totalWeekSessions = weekRecords.length;
    const onTime = weekRecords.filter(r => r.status === 'hadir_tepat').length;
    const late = weekRecords.filter(r => r.status === 'hadir_terlambat').length;
    const absent = weekRecords.filter(r => r.status === 'tidak_hadir').length;
    const weekAttendancePct = totalWeekSessions > 0 ? Math.round(((onTime + late * 0.8) / totalWeekSessions) * 100) : 95;
    const setoranWeekCount = weekRecords.filter(r => !!r.hafalanDeposit).length;

    return {
      days,
      weekStartStr,
      weekEndStr,
      weekLabel,
      weekRecords,
      totalWeekSessions,
      onTime,
      late,
      absent,
      weekAttendancePct,
      setoranWeekCount
    };
  }, [attendanceHistory, weekOffset]);

  // Monthly data computation
  const monthData = React.useMemo(() => {
    const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    const monthRecords = attendanceHistory.filter(r => r.tanggal.startsWith(monthPrefix));
    const totalRecorded = monthRecords.length;
    const onTime = monthRecords.filter(r => r.status === 'hadir_tepat').length;
    const late = monthRecords.filter(r => r.status === 'hadir_terlambat').length;
    const absent = monthRecords.filter(r => r.status === 'tidak_hadir').length;
    const monthAttendancePct = totalRecorded > 0 ? Math.round(((onTime + late * 0.8) / totalRecorded) * 100) : 95;
    const setoranCount = monthRecords.filter(r => !!r.hafalanDeposit).length;

    return {
      monthName: monthNames[selectedMonth],
      year: selectedYear,
      monthRecords,
      totalRecorded,
      onTime,
      late,
      absent,
      monthAttendancePct,
      setoranCount
    };
  }, [attendanceHistory, selectedMonth, selectedYear]);

  // Helpers for weekly and monthly student statistics
  const getStudentDayRecord = (studentId: string, dateIso: string) => {
    return attendanceHistory.find(a => a.studentId === studentId && a.tanggal === dateIso);
  };

  const getStudentWeekStats = (student: typeof santriList[0]) => {
    const records = weekData.days
      .map(d => getStudentDayRecord(student.id, d.dateIso))
      .filter(Boolean) as typeof attendanceHistory;
    const onTime = records.filter(r => r.status === 'hadir_tepat').length;
    const late = records.filter(r => r.status === 'hadir_terlambat').length;
    const absent = records.filter(r => r.status === 'tidak_hadir').length;
    const total = records.length;
    const effectivePresent = onTime + late;
    const pct = total > 0 ? Math.round(((onTime + late * 0.8) / total) * 100) : (student.kehadiranPersen || 95);
    const deposits = records.filter(r => !!r.hafalanDeposit).length;
    return {
      records,
      onTime,
      late,
      absent,
      total,
      effectivePresent,
      pct,
      deposits
    };
  };

  const getStudentMonthStats = (student: typeof santriList[0]) => {
    const records = monthData.monthRecords.filter(r => r.studentId === student.id);
    const onTime = records.filter(r => r.status === 'hadir_tepat').length;
    const late = records.filter(r => r.status === 'hadir_terlambat').length;
    const absent = records.filter(r => r.status === 'tidak_hadir').length;
    const total = records.length;
    const deposits = records.filter(r => !!r.hafalanDeposit).length;
    const pct = total > 0 ? Math.round(((onTime + late * 0.8) / total) * 100) : (student.kehadiranPersen || 95);
    const predikat = pct >= 90 ? 'Mumtaz (A)' : pct >= 75 ? 'Jayyid (B)' : 'Perlu Pembinaan';
    return {
      records,
      onTime,
      late,
      absent,
      total,
      deposits,
      pct,
      predikat
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Absensi & Halaqah
          </h2>
          <p className="text-xs text-slate-500">
            Monitoring kehadiran halaqah santri harian, mingguan, dan bulanan
          </p>
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* FILTER PERIODE ABSENSI: Per Hari, Per Minggu, Per Bulan */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setPeriodFilterMode('harian')}
            className={`px-3 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              periodFilterMode === 'harian'
                ? 'bg-white text-emerald-800 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Per Hari (Harian)</span>
          </button>

          <button
            type="button"
            onClick={() => setPeriodFilterMode('mingguan')}
            className={`px-3 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              periodFilterMode === 'mingguan'
                ? 'bg-white text-teal-800 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4 text-teal-600" />
            <span>Per Minggu (Mingguan)</span>
          </button>

          <button
            type="button"
            onClick={() => setPeriodFilterMode('bulanan')}
            className={`px-3 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              periodFilterMode === 'bulanan'
                ? 'bg-white text-blue-800 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-blue-600" />
            <span>Per Bulan (Bulanan)</span>
          </button>
        </div>

        {/* Dynamic Period Controller Navigator */}
        <div className="flex items-center gap-2">
          {periodFilterMode === 'harian' && (
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  const d = new Date(attendanceDate);
                  d.setDate(d.getDate() - 1);
                  setAttendanceDate(d.toISOString().split('T')[0]);
                }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Hari Kemarin"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={attendanceDate}
                onChange={e => setAttendanceDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />

              <button
                type="button"
                onClick={() => {
                  const d = new Date(attendanceDate);
                  d.setDate(d.getDate() + 1);
                  setAttendanceDate(d.toISOString().split('T')[0]);
                }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Hari Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setAttendanceDate(new Date().toISOString().split('T')[0])}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold transition-colors shrink-0"
              >
                Hari Ini
              </button>
            </div>
          )}

          {periodFilterMode === 'mingguan' && (
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setWeekOffset(prev => prev - 1)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Pekan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-bold text-slate-800 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl whitespace-nowrap">
                {weekData.weekStartStr} - {weekData.weekEndStr}
              </span>

              <button
                type="button"
                onClick={() => setWeekOffset(prev => prev + 1)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Pekan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {weekOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => setWeekOffset(0)}
                  className="px-2.5 py-1.5 rounded-xl bg-teal-100 hover:bg-teal-200 text-teal-800 text-xs font-bold transition-colors shrink-0"
                >
                  Pekan Ini
                </button>
              )}
            </div>
          )}

          {periodFilterMode === 'bulanan' && (
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
              >
                {monthNames.map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* RENDER VIEW BERDASARKAN FILTER PERIODE */}
      {periodFilterMode === 'mingguan' ? (
        <AbsensiWeeklyView 
          isParent={isParent}
          child={child}
          santriList={santriList}
          groups={groups}
          attendanceHistory={attendanceHistory}
          weekData={weekData}
        />
      ) : periodFilterMode === 'bulanan' ? (
        <AbsensiMonthlyView
          isParent={isParent}
          child={child}
          santriList={santriList}
          groups={groups}
          attendanceHistory={attendanceHistory}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          monthData={monthData}
        />
      ) : (
        /* HARIAN (PER HARI) VIEW */
        <>
          {/* Daily 4 KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block font-medium">Santri Ditampilkan</span>
                <span className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">{visibleStudents.length}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Sesi: {activeSessionObj?.nama}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block font-medium">Hadir Tepat Waktu</span>
                <span className="text-xl sm:text-2xl font-bold text-emerald-700 tabular-nums">
                  {dailySummary.onTime} <span className="text-xs font-normal text-slate-400">santri</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                  {dailySummary.pctHadir}% kehadiran hari ini
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block font-medium">Hadir Terlambat</span>
                <span className="text-xl sm:text-2xl font-bold text-amber-700 tabular-nums">
                  {dailySummary.late} <span className="text-xs font-normal text-slate-400">santri</span>
                </span>
                <span className="text-[10px] text-amber-600 block mt-0.5">
                  {dailySummary.absent} tidak hadir
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block font-medium">Setoran Hari Ini</span>
                <span className="text-xl sm:text-2xl font-bold text-purple-700 tabular-nums">
                  {dailySummary.setoranCount} <span className="text-xs font-normal text-slate-400">kali</span>
                </span>
                <span className="text-[10px] text-purple-600 font-semibold block mt-0.5">
                  Tercatat di sistem
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* PARENT VIEW (if logged in as parent) */}
          {isParent && child ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Riwayat Kehadiran Harian: {child.nama}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tanggal terpilih: <strong>{attendanceDate}</strong> · Tingkat kehadiran umum: <strong className="text-emerald-700 font-bold">{child.kehadiranPersen}%</strong>
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
                        {record.catatanPerilaku && (
                          <p className="text-xs text-amber-800 font-medium mt-1 flex items-center gap-1.5 bg-amber-50/80 px-2 py-0.5 rounded-md border border-amber-200/60">
                            <Smile className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span><strong>Catatan Perilaku Halaqah:</strong> {record.catatanPerilaku}</span>
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

          {/* Student Attendance Section: Unrecorded Students List or All Recorded State */}
          {unrecordedStudents.length === 0 && visibleStudents.length > 0 ? (
            <div className="bg-white rounded-2xl border border-emerald-200/90 p-6 sm:p-8 shadow-xs text-center space-y-4 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1.5 max-w-lg mx-auto">
                <h3 className="text-xl font-bold text-slate-900">
                  Seluruh Santri Sudah Diabsen di Sesi Ini
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Sebanyak <strong className="text-slate-900">{recordedStudents.length} santri</strong> telah berhasil tercatat kehadirannya untuk sesi <strong className="text-emerald-800">{activeSessionObj?.nama}</strong> pada tanggal <strong className="text-slate-900">{attendanceDate}</strong> ({selectedGroupObj ? selectedGroupObj.nama : 'Seluruh Halaqah'}). Santri yang sudah diabsen tidak ditampilkan lagi di form input sesi ini.
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
                <span className="font-bold text-emerald-800">{recordedStudents.length} Santri Tercatat</span>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('riwayat-absensi');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 active:scale-95"
                >
                  <History className="w-4 h-4" />
                  <span>Lihat & Catat Setoran di Riwayat Absensi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecordedStudents(prev => !prev)}
                  className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-all shadow-xs"
                >
                  {showRecordedStudents ? 'Tutup Daftar Santri Terabsen' : `Lihat Santri yang Sudah Diabsen (${recordedStudents.length})`}
                </button>
              </div>

              {/* Collapsible View of Already Recorded Students in this Session */}
              {showRecordedStudents && (
                <div className="mt-4 pt-4 border-t border-emerald-200/60 max-w-2xl mx-auto space-y-2 text-left animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                    <span>Santri Sudah Diabsen ({recordedStudents.length}):</span>
                    <span className="text-[11px] text-slate-400 font-normal">Klik tombol hapus jika ingin mengabsen ulang</span>
                  </div>
                  {recordedStudents.map(student => {
                    const rec = attendanceHistory.find(
                      a => a.studentId === student.id && a.tanggal === attendanceDate && a.sessionKey === selectedSessionKey
                    );
                    return (
                      <div 
                        key={student.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{student.nama}</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px] font-medium">
                              {student.kelompokNama}
                            </span>
                          </div>
                          {rec?.catatanPerilaku && (
                            <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                              ⭐ {rec.catatanPerilaku}
                            </p>
                          )}
                          {rec?.hafalanDeposit && (
                            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                              📖 Setor: Juz {rec.hafalanDeposit.juz} {rec.hafalanDeposit.surahName} (Nilai {rec.hafalanDeposit.kualitas})
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            rec?.status === 'hadir_tepat'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rec?.status === 'hadir_terlambat'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {rec?.status === 'hadir_tepat' ? 'Tepat Waktu' : rec?.status === 'hadir_terlambat' ? 'Terlambat' : 'Tidak Hadir'}
                          </span>

                          {rec && (
                            <button
                              type="button"
                              onClick={() => {
                                deleteAttendanceRecord(rec.id);
                                setSaveSuccessMessage(`Absensi ${student.nama} dibatalkan untuk diabsen ulang.`);
                                setTimeout(() => setSaveSuccessMessage(''), 3000);
                              }}
                              title="Batalkan / Absen Ulang"
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">
                      Daftar Input Absensi Santri ({unrecordedStudents.length})
                    </h3>
                    {recordedStudents.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {recordedStudents.length} Santri Sudah Diabsen
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {activeSessionObj ? activeSessionObj.nama : 'Sesi'} · {attendanceDate}
                    {selectedGroupObj ? ` · ${selectedGroupObj.nama}` : ' · Seluruh Halaqah'}
                    <span className="text-emerald-700 font-medium"> · Tersisa {unrecordedStudents.length} belum diabsen</span>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative w-full sm:w-48">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchStudent}
                      onChange={e => setSearchStudent(e.target.value)}
                      placeholder="Cari santri..."
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    onClick={handleSaveAll}
                    disabled={unrecordedStudents.length === 0}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-[0.98]"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Seluruh Absensi ({unrecordedStudents.length})</span>
                  </button>
                </div>
              </div>

              {/* Quick Batch Action for Unrecorded Students */}
              {unrecordedStudents.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
                  <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                    <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Tandai Sekaligus ({unrecordedStudents.length} Santri Belum Diabsen):</span>
                  </span>
                  <div className="grid grid-cols-3 sm:flex items-center gap-1.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => markAllVisible('hadir_tepat')}
                      className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-xs text-center"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600 hidden sm:inline" />
                      <span>Tepat Waktu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => markAllVisible('hadir_terlambat')}
                      className="px-2.5 py-1.5 bg-white hover:bg-amber-50 text-amber-700 hover:text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-xs text-center"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-600 hidden sm:inline" />
                      <span>Terlambat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => markAllVisible('tidak_hadir')}
                      className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-xs text-center"
                    >
                      <X className="w-3.5 h-3.5 text-rose-600 hidden sm:inline" />
                      <span>Tidak Hadir</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Students Attendance Cards List */}
              <div className="space-y-3">
                {unrecordedStudents.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <Users className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-slate-700 font-semibold text-sm">
                      {searchStudent.trim() 
                        ? 'Tidak ada santri yang cocok dengan pencarian.'
                        : `Tidak ada santri yang belum diabsen di ${selectedGroupObj ? selectedGroupObj.nama : 'halaqah ini'}.`
                      }
                    </p>
                    <p className="text-slate-400 text-xs">
                      {searchStudent.trim()
                        ? 'Coba gunakan kata kunci lain.'
                        : 'Semua santri yang terfilter telah diabsen pada sesi ini.'
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
                  unrecordedStudents.map(student => {
                    const draft = attendanceDrafts[student.id] || {
                      status: 'hadir_tepat',
                      keterangan: '',
                      catatanPerilaku: ''
                    };

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
                          <div className="grid grid-cols-3 sm:flex items-center gap-1.5 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => updateDraft(student.id, { status: 'hadir_tepat' })}
                              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-center ${
                                draft.status === 'hadir_tepat'
                                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              Tepat Waktu
                            </button>
                            <button
                              type="button"
                              onClick={() => updateDraft(student.id, { status: 'hadir_terlambat' })}
                              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-center ${
                                draft.status === 'hadir_terlambat'
                                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              Terlambat
                            </button>
                            <button
                              type="button"
                              onClick={() => updateDraft(student.id, { status: 'tidak_hadir' })}
                              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-center ${
                                draft.status === 'tidak_hadir'
                                  ? 'bg-rose-600 text-white shadow-xs font-bold'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              Tidak Hadir
                            </button>
                          </div>
                        </div>

                        {/* Absent reason input */}
                        {draft.status === 'tidak_hadir' && (
                          <div className="pt-1">
                            <input
                              type="text"
                              value={draft.keterangan || ''}
                              onChange={e => updateDraft(student.id, { keterangan: e.target.value })}
                              placeholder="Alasan tidak hadir (Sakit, Izin keluar kota, etc.)..."
                              className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                          </div>
                        )}

                        {/* Catatan Perilaku Selama di Halaqah */}
                        {draft.status !== 'tidak_hadir' && (
                          <div className="pt-2 border-t border-slate-200/60 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                                <Smile className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Catatan Perilaku Selama di Halaqah:</span>
                              </span>
                              <span className="text-[10px] text-slate-400">Pilih cepat atau ketik sendiri</span>
                            </div>

                            {/* Preset chips for behavior notes */}
                            <div className="flex flex-wrap items-center gap-1">
                              {BEHAVIOR_PRESETS.map((preset, pIdx) => {
                                const isSelected = draft.catatanPerilaku?.includes(preset);
                                return (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        const next = draft.catatanPerilaku
                                          ?.replace(preset, '')
                                          .replace(/^[,\s]+|[,\s]+$/g, '')
                                          .replace(/,\s*,/g, ',');
                                        updateDraft(student.id, { catatanPerilaku: next || '' });
                                      } else {
                                        const next = draft.catatanPerilaku 
                                          ? `${draft.catatanPerilaku}, ${preset}`
                                          : preset;
                                        updateDraft(student.id, { catatanPerilaku: next });
                                      }
                                    }}
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors border ${
                                      isSelected
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {preset}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Custom Note input */}
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={draft.catatanPerilaku || ''}
                                onChange={e => updateDraft(student.id, { catatanPerilaku: e.target.value })}
                                placeholder="Catatan perilaku/adab santri selama halaqah (opsional)..."
                                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                              {draft.catatanPerilaku && (
                                <button
                                  type="button"
                                  onClick={() => updateDraft(student.id, { catatanPerilaku: '' })}
                                  className="text-[11px] text-slate-400 hover:text-slate-600 px-1"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Save single student button */}
                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">
                            Setelah disimpan, santri ini akan dipindahkan ke riwayat absensi.
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSaveSingleStudent(student)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs ${
                              singleSavedId === student.id
                                ? 'bg-emerald-600 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
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
                                <span>Simpan Absen {student.nama}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {unrecordedStudents.length > 0 && (
                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={handleSaveAll}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-colors active:scale-98"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Seluruh Absensi ({unrecordedStudents.length} Santri)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Riwayat Absensi */}
          <div id="riwayat-absensi" className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 scroll-mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Riwayat Absensi & Catatan Setoran ({filteredHistory.length})
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

            <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Belum ada data absensi pada periode atau halaqah ini.
                </div>
              ) : (
                filteredHistory.map(rec => {
                  const studentData = santriList.find(s => s.id === rec.studentId);
                  const groupName = studentData?.kelompokNama || groups.find(g => g.id === rec.kelompokId)?.nama;
                  const isSetoranOpen = activeRecordForSetoranId === rec.id;
                  const setoranDraft = historySetoranDrafts[rec.id];
                  const surahsForDraftJuz = setoranDraft ? getSurahsForJuz(setoranDraft.juz) : [];
                  const isMurojaahRange = setoranDraft?.hafalanType === 'muroja' && (setoranDraft.murojaahMode || 'surah_range') === 'surah_range';

                  return (
                    <div 
                      key={rec.id}
                      className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3 hover:border-slate-300 transition-all"
                    >
                      {/* Row 1: Student info, date/session, attendance status, delete */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{rec.studentName}</span>
                            {groupName && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-medium">
                                {groupName}
                              </span>
                            )}
                            <span className="text-slate-400 text-xs hidden sm:inline">·</span>
                            <span className="text-xs text-slate-500">
                              {rec.tanggal} · {rec.sessionName}
                            </span>
                          </div>

                          {rec.keterangan && (
                            <p className="text-xs text-rose-700 italic mt-0.5">
                              Alasan tidak hadir: {rec.keterangan}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
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
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {/* Row 2: Catatan Perilaku Selama di Halaqah */}
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-start gap-2">
                          <Smile className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-700">Catatan Perilaku di Halaqah: </span>
                            {rec.catatanPerilaku ? (
                              <span className="text-slate-900 font-medium">"{rec.catatanPerilaku}"</span>
                            ) : (
                              <span className="text-slate-400 italic">Belum ada catatan perilaku</span>
                            )}
                          </div>
                        </div>

                        {!isParent && (
                          <button
                            type="button"
                            onClick={() => {
                              if (editingPerilakuRecId === rec.id) {
                                setEditingPerilakuRecId(null);
                              } else {
                                setEditingPerilakuRecId(rec.id);
                                setEditingPerilakuText(rec.catatanPerilaku || '');
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold self-start sm:self-center shrink-0"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{editingPerilakuRecId === rec.id ? 'Tutup' : 'Ubah Catatan'}</span>
                          </button>
                        )}
                      </div>

                      {/* Inline Quick Editor for Catatan Perilaku */}
                      {editingPerilakuRecId === rec.id && (
                        <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-2 text-xs animate-in fade-in">
                          <span className="font-bold text-emerald-950 block">Ubah Catatan Perilaku: {rec.studentName}</span>
                          <div className="flex flex-wrap gap-1">
                            {BEHAVIOR_PRESETS.map((p, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setEditingPerilakuText(prev => prev ? `${prev}, ${p}` : p);
                                }}
                                className="px-2 py-0.5 bg-white text-slate-700 border border-slate-200 rounded-md text-[10px] hover:bg-slate-100"
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingPerilakuText}
                              onChange={e => setEditingPerilakuText(e.target.value)}
                              placeholder="Ketik catatan perilaku santri..."
                              className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                updateAttendancePerilaku(rec.id, editingPerilakuText);
                                setEditingPerilakuRecId(null);
                                setSaveSuccessMessage(`Catatan perilaku ${rec.studentName} berhasil diperbarui!`);
                                setTimeout(() => setSaveSuccessMessage(''), 2500);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs"
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPerilakuRecId(null)}
                              className="px-2.5 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Row 3: Pencatatan Setoran Hafalan Sesi Ini (Dipindahkan ke Riwayat Absensi) */}
                      {rec.status !== 'tidak_hadir' && !isParent && (
                        <div className="pt-2 border-t border-slate-200/60 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            {rec.hafalanDeposit ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100/90 text-emerald-900 border border-emerald-300 text-xs font-semibold">
                                  <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>
                                    Setoran: Juz {rec.hafalanDeposit.juz} {rec.hafalanDeposit.surahName} (Nilai {rec.hafalanDeposit.kualitas})
                                    {rec.hafalanDeposit.type === 'baru' ? ' · Hafalan Baru' : rec.hafalanDeposit.type === 'muroja' ? " · Muroja'ah" : ' · Perbaikan'}
                                  </span>
                                </span>
                                {rec.hafalanDeposit.catatan && (
                                  <span className="text-[11px] text-slate-500 italic">
                                    "{rec.hafalanDeposit.catatan}"
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500 italic">
                                Belum ada setoran hafalan dicatat untuk sesi ini.
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => openSetoranForm(rec)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-center ${
                                isSetoranOpen
                                  ? 'bg-slate-800 text-white'
                                  : rec.hafalanDeposit
                                  ? 'bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>
                                {isSetoranOpen
                                  ? 'Tutup Form Setoran'
                                  : rec.hafalanDeposit
                                  ? 'Edit Setoran Hafalan Sesi Ini'
                                  : 'Pencatatan Setoran Hafalan Sesi Ini'}
                              </span>
                              {isSetoranOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          {/* Accordion: Form Pencatatan Setoran Hafalan Sesi Ini */}
                          {isSetoranOpen && setoranDraft && (
                            <div className="p-4 bg-white rounded-xl border border-emerald-300 shadow-sm space-y-3.5 animate-in fade-in duration-150 text-xs">
                              <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                  <BookOpen className="w-4 h-4 text-emerald-600" />
                                  <span>Pencatatan Setoran Hafalan Sesi Ini: <strong>{rec.studentName}</strong></span>
                                </span>
                                <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  {rec.sessionName} · {rec.tanggal}
                                </span>
                              </div>

                              {/* Hafalan Type Selection */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-slate-600 font-semibold">Jenis Setoran:</span>
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
                                    onClick={() => {
                                      const surahs = getSurahsForJuz(setoranDraft.juz);
                                      const firstNum = surahs[0]?.number || 1;
                                      const lastNum = surahs[surahs.length - 1]?.number || firstNum;
                                      updateHistorySetoranDraft(rec.id, { 
                                        hafalanType: item.key,
                                        ...(item.key === 'muroja' ? {
                                          murojaahMode: setoranDraft.murojaahMode || 'surah_range',
                                          surahSampaiNumber: setoranDraft.surahSampaiNumber || lastNum
                                        } : {})
                                      });
                                    }}
                                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                                      setoranDraft.hafalanType === item.key
                                        ? 'bg-emerald-600 text-white shadow-xs font-bold'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>

                              {/* Opsi Khusus Muroja'ah: Dari Surat A s/d Surat B */}
                              {setoranDraft.hafalanType === 'muroja' && (
                                <div className="p-3 bg-emerald-50/80 border border-emerald-200/90 rounded-xl space-y-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                                      <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                                      Pilihan Format Muroja'ah:
                                    </span>
                                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-emerald-200 text-xs">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const surahs = getSurahsForJuz(setoranDraft.juz);
                                          const lastNum = surahs[surahs.length - 1]?.number || setoranDraft.surahNumber;
                                          updateHistorySetoranDraft(rec.id, { 
                                            murojaahMode: 'surah_range',
                                            surahSampaiNumber: setoranDraft.surahSampaiNumber || lastNum
                                          });
                                        }}
                                        className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all flex items-center gap-1 ${
                                          (setoranDraft.murojaahMode || 'surah_range') === 'surah_range'
                                            ? 'bg-emerald-700 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-emerald-800'
                                        }`}
                                      >
                                        <span>Dari Surat A s/d Surat B</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => updateHistorySetoranDraft(rec.id, { murojaahMode: 'single_surah' })}
                                        className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all ${
                                          setoranDraft.murojaahMode === 'single_surah'
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
                                      value={setoranDraft.juz}
                                      onChange={e => {
                                        const newJuz = Number(e.target.value);
                                        const surahs = getSurahsForJuz(newJuz);
                                        const firstSurah = surahs[0]?.number || 1;
                                        const lastSurah = surahs[surahs.length - 1]?.number || firstSurah;
                                        const lastSurahMeta = ALL_SURAHS.find(s => s.number === lastSurah);
                                        updateHistorySetoranDraft(rec.id, {
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
                                      (Surah dalam Juz {setoranDraft.juz} tampil di urutan atas)
                                    </span>
                                  </div>

                                  {/* Dari Surat A sampai Surat B */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    {/* Dari Surat A */}
                                    <div className="space-y-1.5">
                                      <label className="block text-[11px] font-bold text-emerald-950">
                                        Dari Surat (Surat A):
                                      </label>
                                      <select
                                        value={setoranDraft.surahNumber}
                                        onChange={e => {
                                          const newNum = Number(e.target.value);
                                          const currentEnd = setoranDraft.surahSampaiNumber || newNum;
                                          const endNum = currentEnd < newNum ? newNum : currentEnd;
                                          const endMeta = ALL_SURAHS.find(s => s.number === endNum);
                                          updateHistorySetoranDraft(rec.id, {
                                            surahNumber: newNum,
                                            surahSampaiNumber: endNum,
                                            ayatMulai: 1,
                                            ayatSelesai: endMeta?.totalAyahs || 7
                                          });
                                        }}
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs truncate"
                                      >
                                        <optgroup label={`Surah di Juz ${setoranDraft.juz}`}>
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
                                        <span className="text-[10px] text-slate-500 whitespace-nowrap">Mulai Ayat:</span>
                                        <input
                                          type="number"
                                          min={1}
                                          value={setoranDraft.ayatMulai}
                                          onChange={e => updateHistorySetoranDraft(rec.id, { ayatMulai: Number(e.target.value) })}
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
                                        value={setoranDraft.surahSampaiNumber || setoranDraft.surahNumber}
                                        onChange={e => {
                                          const newEndNum = Number(e.target.value);
                                          const endMeta = ALL_SURAHS.find(s => s.number === newEndNum);
                                          updateHistorySetoranDraft(rec.id, {
                                            surahSampaiNumber: newEndNum,
                                            ayatSelesai: endMeta?.totalAyahs || 7
                                          });
                                        }}
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs truncate"
                                      >
                                        <optgroup label={`Surah di Juz ${setoranDraft.juz}`}>
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
                                        <span className="text-[10px] text-slate-500 whitespace-nowrap">Sampai Ayat:</span>
                                        <input
                                          type="number"
                                          min={1}
                                          value={setoranDraft.ayatSelesai}
                                          onChange={e => updateHistorySetoranDraft(rec.id, { ayatSelesai: Number(e.target.value) })}
                                          className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-md text-xs"
                                          placeholder="Akhir"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Preview Rentang Muroja'ah */}
                                  {(() => {
                                    const sA = ALL_SURAHS.find(s => s.number === setoranDraft.surahNumber);
                                    const sB = ALL_SURAHS.find(s => s.number === (setoranDraft.surahSampaiNumber || setoranDraft.surahNumber));
                                    return (
                                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-1 text-[11px] text-emerald-950">
                                        <div className="flex items-center gap-1.5 font-semibold">
                                          <span className="px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 text-[10px] font-bold">Ringkasan</span>
                                          <span>Surah {sA?.name} (Ayat {setoranDraft.ayatMulai})</span>
                                          <ArrowRight className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                          <span>Surah {sB?.name} (Ayat {setoranDraft.ayatSelesai})</span>
                                        </div>
                                        <span className="text-[10px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                                          Juz {setoranDraft.juz}
                                        </span>
                                      </div>
                                    );
                                  })()}
                                </div>
                              ) : (
                                /* TAMPILAN STANDAR (HAFALAN BARU / PERBAIKAN / PER SURAT) */
                                <div className="space-y-2.5">
                                  {/* Juz & Surah */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                        Pilih Juz:
                                      </label>
                                      <select
                                        value={setoranDraft.juz}
                                        onChange={e => {
                                          const newJuz = Number(e.target.value);
                                          const surahs = getSurahsForJuz(newJuz);
                                          const firstSurah = surahs[0]?.number || 1;
                                          const sMeta = ALL_SURAHS.find(s => s.number === firstSurah);
                                          updateHistorySetoranDraft(rec.id, {
                                            juz: newJuz,
                                            surahNumber: firstSurah,
                                            surahSampaiNumber: firstSurah,
                                            ayatMulai: 1,
                                            ayatSelesai: sMeta?.totalAyahs || 7
                                          });
                                        }}
                                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                                      >
                                        {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                                          <option key={j} value={j}>Juz {j}</option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                        Pilih Surah:
                                      </label>
                                      <select
                                        value={setoranDraft.surahNumber}
                                        onChange={e => {
                                          const newNum = Number(e.target.value);
                                          const sMeta = ALL_SURAHS.find(s => s.number === newNum);
                                          updateHistorySetoranDraft(rec.id, { 
                                            surahNumber: newNum,
                                            surahSampaiNumber: newNum,
                                            ayatMulai: 1,
                                            ayatSelesai: sMeta?.totalAyahs || 7
                                          });
                                        }}
                                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs truncate"
                                      >
                                        <optgroup label={`Surah di Juz ${setoranDraft.juz}`}>
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

                                  {/* Ayat Range */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                        Ayat Mulai:
                                      </label>
                                      <input
                                        type="number"
                                        min={1}
                                        value={setoranDraft.ayatMulai}
                                        onChange={e => updateHistorySetoranDraft(rec.id, { ayatMulai: Number(e.target.value) })}
                                        placeholder="1"
                                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                        Sampai Ayat:
                                      </label>
                                      <input
                                        type="number"
                                        min={setoranDraft.ayatMulai}
                                        value={setoranDraft.ayatSelesai}
                                        onChange={e => updateHistorySetoranDraft(rec.id, { ayatSelesai: Number(e.target.value) })}
                                        placeholder="Akhir"
                                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Nilai Setoran & Catatan Ustadz */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Nilai Kualitas Setoran:
                                  </label>
                                  <select
                                    value={setoranDraft.kualitas}
                                    onChange={e => updateHistorySetoranDraft(rec.id, { kualitas: e.target.value as HafalanQuality })}
                                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                                  >
                                    <option value="A">Nilai: A (Mumtaz - Sangat Lancar)</option>
                                    <option value="B">Nilai: B (Jayyid - Lancar)</option>
                                    <option value="C">Nilai: C (Maqbul - Cukup)</option>
                                    <option value="D">Nilai: D (Ulang / Perlu Bimbingan)</option>
                                  </select>
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Catatan Hafalan / Tajwid (Opsional):
                                  </label>
                                  <input
                                    type="text"
                                    value={setoranDraft.catatan}
                                    onChange={e => updateHistorySetoranDraft(rec.id, { catatan: e.target.value })}
                                    placeholder="Catatan ustadz untuk setoran ini..."
                                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                                  />
                                </div>
                              </div>

                              {/* Catatan Perilaku Selama di Halaqah in Setoran Form */}
                              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                                <label className="block text-[11px] font-semibold text-slate-700">
                                  Catatan Perilaku Selama di Halaqah:
                                </label>
                                <div className="flex flex-wrap gap-1">
                                  {BEHAVIOR_PRESETS.map((bp, bidx) => (
                                    <button
                                      key={bidx}
                                      type="button"
                                      onClick={() => {
                                        const currentVal = setoranDraft.catatanPerilaku || '';
                                        const next = currentVal ? `${currentVal}, ${bp}` : bp;
                                        updateHistorySetoranDraft(rec.id, { catatanPerilaku: next });
                                      }}
                                      className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-md text-[10px] border border-slate-200"
                                    >
                                      {bp}
                                    </button>
                                  ))}
                                </div>
                                <input
                                  type="text"
                                  value={setoranDraft.catatanPerilaku || ''}
                                  onChange={e => updateHistorySetoranDraft(rec.id, { catatanPerilaku: e.target.value })}
                                  placeholder="Catatan perilaku/adab santri..."
                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                                />
                              </div>

                              {/* Tombol Simpan Setoran */}
                              <div className="pt-2 border-t border-emerald-100 flex flex-wrap items-center justify-between gap-2">
                                <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Tersinkron otomatis ke Halaman Hafalan santri</span>
                                </span>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setActiveRecordForSetoranId(null)}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveHistorySetoran(rec)}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5 active:scale-95"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Simpan Setoran Hafalan</span>
                                  </button>
                                </div>
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
          </div>
        </>
      )}
        </>
      )}

    </div>
  );
};
