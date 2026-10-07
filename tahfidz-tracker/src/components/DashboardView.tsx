import React from 'react';
import { useTahfidz } from '../context/TahfidzContext';
import { 
  Trophy, 
  Rocket, 
  Award, 
  History, 
  PlusCircle, 
  CalendarCheck, 
  BookOpen, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  ChevronRight,
  Flame,
  Sparkles,
  Bookmark,
  Clock,
  MessageCircle,
  FileText
} from 'lucide-react';
import { parseHafalan } from '../utils/hafalanFormat';
import { calculateStudentSetoranGrowth } from '../utils/growthCalculator';
import { useTodayWIB, formatDateIsoId, getWeekDaysWIB } from '../utils/dateWIB';
import { FeatureHint } from './FeatureHint';
import { KirimPesanWAModal } from './KirimPesanWAModal';

interface DashboardViewProps {
  onOpenAddHafalan: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenAddHafalan }) => {
  const { 
    currentUser, 
    santriList, 
    attendanceHistory, 
    tasmiList, 
    setActiveTab, 
    groups, 
    classes,
    switchParentActiveChild,
    parentChildren,
    systemSettings
  } = useTahfidz();

  const [isWaModalOpen, setIsWaModalOpen] = React.useState(false);

  const isParent = currentUser?.role === 'parent';
  const child = isParent ? santriList.find(s => s.id === currentUser.studentId) || santriList[0] : null;

  // Format today's date & current week (Senin - Ahad) in Indonesian timezone (Asia/Jakarta / WIB)
  const todayIso = useTodayWIB();
  const todayDate = formatDateIsoId(todayIso, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const currentWeek = React.useMemo(() => getWeekDaysWIB(0, todayIso), [todayIso]);
  const weekStartIso = currentWeek.days[0].dateIso;
  const weekEndIso = currentWeek.days[6].dateIso;
  const weekRangeLabel = `${currentWeek.days[0].dateLabel} - ${currentWeek.days[6].dateLabel}`;

  // Current Month range (YYYY-MM-01 to YYYY-MM-31) in WIB
  const monthStartIso = `${todayIso.slice(0, 7)}-01`;
  const monthEndIso = `${todayIso.slice(0, 7)}-31`;
  const monthRangeLabel = formatDateIsoId(todayIso, { month: 'long', year: 'numeric' });

  const fastestCfg = systemSettings?.fastestHafalanConfig || {
    defaultPeriod: 'weekly' as const,
    allowUserSwitchPeriod: true,
    weeklyTargetLembar: 2.5,
    monthlyTargetLembar: 10,
    topCount: 5,
    minAttendanceTargetPct: 100,
    achievementBadgeLabel: 'Mumtaz Progresif'
  };

  const [fastestPeriod, setFastestPeriod] = React.useState<'weekly' | 'monthly'>(
    fastestCfg.defaultPeriod || 'weekly'
  );

  React.useEffect(() => {
    if (fastestCfg.defaultPeriod) {
      setFastestPeriod(fastestCfg.defaultPeriod);
    }
  }, [fastestCfg.defaultPeriod]);

  // Child setoran today (if role is parent)
  const childSetoranToday = React.useMemo(() => {
    if (!child) return null;
    
    // Check in child's hafalanList
    const fromHafalan = (child.hafalanList || []).find(h => h.tanggal === todayIso);
    if (fromHafalan) return fromHafalan;
    
    // Check in attendanceHistory for today with hafalanDeposit
    const fromAtt = attendanceHistory.find(
      a => a.studentId === child.id && a.tanggal === todayIso && a.hafalanDeposit
    );
    if (fromAtt?.hafalanDeposit) return fromAtt.hafalanDeposit;

    // If student's terakhirSetor is today
    if (child.terakhirSetor?.tanggal === todayIso) {
      return {
        id: 'ts-today',
        studentId: child.id,
        studentName: child.nama,
        type: 'baru' as const,
        category: 'surah' as const,
        juz: child.terakhirSetor.juz,
        surahName: child.terakhirSetor.surah,
        catatan: child.terakhirSetor.ayat,
        kualitas: 'A' as const,
        tanggal: todayIso
      };
    }

    return null;
  }, [child, todayIso, attendanceHistory]);

  // Child's latest deposit (for reference if not deposited today)
  const childLatestDeposit = React.useMemo(() => {
    if (!child) return null;
    const sorted = [...(child.hafalanList || [])].sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
    if (sorted[0]) return sorted[0];
    if (child.terakhirSetor) {
      return {
        id: 'ts-latest',
        studentId: child.id,
        studentName: child.nama,
        type: 'baru' as const,
        category: 'surah' as const,
        juz: child.terakhirSetor.juz,
        surahName: child.terakhirSetor.surah,
        catatan: child.terakhirSetor.ayat,
        kualitas: 'A' as const,
        tanggal: child.terakhirSetor.tanggal
      };
    }
    return null;
  }, [child]);

  // Calculate metrics
  const totalSantri = santriList.length;
  const totalJuzAll = santriList.reduce((acc, s) => acc + s.totalJuzMemorized, 0);
  const avgJuz = (totalJuzAll / (totalSantri || 1)).toFixed(1);
  const tasmiDoneCount = tasmiList.filter(t => t.status === 'selesai').length;
  const tasmiScheduledCount = tasmiList.filter(t => t.status === 'terjadwal').length;

  // Realtime Helper 1: calculate student's accurate attendance rate strictly from attendanceHistory
  const getStudentRealtimeAttendance = (
    student: typeof santriList[0],
    dateRange?: { startDate: string; endDate: string }
  ) => {
    const studentRecords = attendanceHistory.filter(r => {
      if (r.studentId !== student.id) return false;
      if (dateRange && (r.tanggal < dateRange.startDate || r.tanggal > dateRange.endDate)) {
        return false;
      }
      return true;
    });
    
    if (studentRecords.length === 0) {
      return {
        attendancePct: 0,
        totalSessions: 0,
        presentSessions: 0,
        onTimeSessions: 0,
        lateSessions: 0,
        absentSessions: 0,
        sessionBreakdownText: '0 sesi input'
      };
    }

    const onTime = studentRecords.filter(r => r.status === 'hadir_tepat').length;
    const late = studentRecords.filter(r => r.status === 'hadir_terlambat').length;
    const absent = studentRecords.filter(r => r.status === 'tidak_hadir').length;
    const present = onTime + late;
    const total = studentRecords.length;

    // Count session types attended (e.g. Sesi Pagi, Sesi Sore)
    const sessionCounts: Record<string, number> = {};
    studentRecords.forEach(r => {
      if (r.status !== 'tidak_hadir') {
        const sName = r.sessionName ? r.sessionName.replace('Sesi ', '') : 'Pagi';
        sessionCounts[sName] = (sessionCounts[sName] || 0) + 1;
      }
    });

    const sessionBreakdownText = Object.entries(sessionCounts)
      .map(([name, count]) => `${name} (${count}x)`)
      .join(', ') || 'Belum hadir';

    // Direct calculation based strictly on input attendance records
    const finalPct = total > 0 ? Math.round(((onTime * 1.0 + late * 0.8) / total) * 100) : 0;

    return {
      attendancePct: finalPct,
      totalSessions: total,
      presentSessions: present,
      onTimeSessions: onTime,
      lateSessions: late,
      absentSessions: absent,
      sessionBreakdownText
    };
  };

  // Realtime Helper 2: calculate student's growth taken strictly from setoran hafalan baru in active period (Per Pekan atau Per Bulan WIB)
  // Progres naik per halaman penuh Mushaf Rasm Utsmani (1 Lembar = 2 Halaman), ditampilkan dalam satuan Lembar.
  const activeStartDateIso = fastestPeriod === 'monthly' ? monthStartIso : weekStartIso;
  const activeEndDateIso = fastestPeriod === 'monthly' ? monthEndIso : weekEndIso;

  const getStudentRealtimeGrowth = (student: typeof santriList[0]) => {
    return calculateStudentSetoranGrowth(student.id, student.hafalanList, attendanceHistory, {
      startDate: activeStartDateIso,
      endDate: activeEndDateIso
    });
  };

  // Real-time Leaderboards: 5 Santri Hafalan Terbanyak (Akumulasi Juz, Lembar, dan Halaman)
  const topHafalan = [...santriList]
    .sort((a, b) => {
      if (b.totalJuzMemorized !== a.totalJuzMemorized) {
        return b.totalJuzMemorized - a.totalJuzMemorized;
      }
      if (b.hafalanList.length !== a.hafalanList.length) {
        return b.hafalanList.length - a.hafalanList.length;
      }
      return (b.weeklyGrowthJuz || 0) - (a.weeklyGrowthJuz || 0);
    })
    .slice(0, 5);

  const topGrowthAll = santriList
    .map(student => {
      const stats = getStudentRealtimeGrowth(student);
      return {
        ...student,
        realtimeLembar: stats.growthLembar,
        realtimePages: stats.growthPages,
        fractionalPages: stats.fractionalPages,
        realtimeGrowth: stats.growthJuz,
        isCurrentPagePartial: stats.isCurrentPagePartial,
        pendingFraction: stats.pendingFraction,
        recentSetoranCount: stats.recentCount,
        absensiSetoranCount: stats.absensiCount,
        lastDepositInfo: stats.lastDepositInfo,
        lastDepositDate: stats.lastDepositDate,
        lastDepositTimestamp: stats.lastDepositTimestamp
      };
    })
    .sort((a, b) => {
      // 1. Prioritaskan santri yang telah genap menyelesaikan >= 1 halaman penuh (realtimeLembar > 0)
      if ((b.realtimeLembar > 0) !== (a.realtimeLembar > 0)) {
        return b.realtimeLembar > 0 ? 1 : -1;
      }
      // 2. Urutkan berdasarkan jumlah lembar penuh tertinggi
      if (b.realtimeLembar !== a.realtimeLembar) {
        return b.realtimeLembar - a.realtimeLembar;
      }
      // 3. Prioritaskan santri yang sudah memiliki setoran baru aktif (termasuk tabungan parsial)
      if ((b.recentSetoranCount > 0) !== (a.recentSetoranCount > 0)) {
        return b.recentSetoranCount > 0 ? 1 : -1;
      }
      // 4. Urutkan berdasarkan akumulasi halaman desimal (termasuk tabungan halaman berjalan)
      if (b.fractionalPages !== a.fractionalPages) {
        return b.fractionalPages - a.fractionalPages;
      }
      // 5. Jika capaian lembar sama, prioritaskan yang paling baru menyetor (real-time)
      if (b.lastDepositTimestamp !== a.lastDepositTimestamp) {
        return (b.lastDepositTimestamp || '').localeCompare(a.lastDepositTimestamp || '');
      }
      if (b.lastDepositDate !== a.lastDepositDate) {
        return (b.lastDepositDate || '').localeCompare(a.lastDepositDate || '');
      }
      if (b.recentSetoranCount !== a.recentSetoranCount) {
        return b.recentSetoranCount - a.recentSetoranCount;
      }
      return b.totalJuzMemorized - a.totalJuzMemorized;
    });

  const fastestTopCount = Math.max(3, Math.min(10, Number(fastestCfg.topCount) || 5));
  const activeGrowthStudents = topGrowthAll.filter(s => s.recentSetoranCount > 0);
  const topGrowth = activeGrowthStudents.slice(0, fastestTopCount);

  // Target 5 Hafalan Tercepat sesuai periode (Per Pekan atau Per Bulan) yang diatur Super Admin
  const ACTIVE_TARGET_LEMBAR =
    fastestPeriod === 'monthly'
      ? Math.max(0.5, Number(fastestCfg.monthlyTargetLembar) || 10)
      : Math.max(0.5, Number(fastestCfg.weeklyTargetLembar) || 2.5);
  const ACTIVE_TARGET_PAGES = Math.round(ACTIVE_TARGET_LEMBAR * 2);
  const MIN_ATTENDANCE_TARGET_PCT = Math.max(50, Math.min(100, Number(fastestCfg.minAttendanceTargetPct) || 100));

  const topAttendance = santriList
    .map(student => {
      const stats = getStudentRealtimeAttendance(student, {
        startDate: weekStartIso,
        endDate: weekEndIso
      });
      return {
        ...student,
        realtimeAttendancePct: stats.attendancePct,
        presentSessions: stats.presentSessions,
        totalSessions: stats.totalSessions,
        onTimeSessions: stats.onTimeSessions,
        sessionBreakdownText: stats.sessionBreakdownText
      };
    })
    .sort((a, b) => {
      // Prioritize students who actually have sessions recorded in this week
      if ((b.totalSessions > 0) !== (a.totalSessions > 0)) {
        return b.totalSessions > 0 ? 1 : -1;
      }
      if (b.realtimeAttendancePct !== a.realtimeAttendancePct) {
        return b.realtimeAttendancePct - a.realtimeAttendancePct;
      }
      if (b.presentSessions !== a.presentSessions) {
        return b.presentSessions - a.presentSessions;
      }
      if (b.onTimeSessions !== a.onTimeSessions) {
        return b.onTimeSessions - a.onTimeSessions;
      }
      return b.totalJuzMemorized - a.totalJuzMemorized;
    })
    .slice(0, 10);

  // Recalculate average attendance dynamically from real-time values
  const avgAttendance = Math.round(
    santriList.reduce((acc, s) => acc + getStudentRealtimeAttendance(s).attendancePct, 0) / (totalSantri || 1)
  );

  // Helper to format relative time or date in Indonesia timezone (WIB)
  const formatActivityTime = (dateStr?: string) => {
    if (!dateStr) return 'Baru saja';
    try {
      if (dateStr === todayIso) return 'Hari ini';
      return formatDateIsoId(dateStr, { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  // REAL LIVE Recent activity aggregated directly from database: hafalanList + attendanceHistory + tasmiList
  interface LiveActivity {
    id: string;
    title: string;
    desc: string;
    tag: string;
    type: 'hafalan' | 'absensi' | 'tasmi';
    time: string;
    sortKey: string;
  }

  const liveActivities: LiveActivity[] = [];

  // 1. Collect from Santri Hafalan records in database
  santriList.forEach(student => {
    (student.hafalanList || []).forEach(h => {
      const typeLabel = h.type === 'baru' ? 'Hafalan Baru' : h.type === 'muroja' ? "Muroja'ah" : 'Perbaikan';
      const ayatText = h.ayatMulai && h.ayatSelesai ? ` ayat ${h.ayatMulai}-${h.ayatSelesai}` : '';
      liveActivities.push({
        id: `haf-${h.id}`,
        title: `${student.nama} setor hafalan`,
        desc: `Juz ${h.juz} - ${h.surahName}${ayatText} · Predikat ${h.kualitas}`,
        tag: typeLabel,
        type: 'hafalan',
        time: formatActivityTime(h.tanggal),
        sortKey: h.tanggal || ''
      });
    });
  });

  // 2. Collect from Attendance records in database
  attendanceHistory.slice(0, 20).forEach(att => {
    const statusLabel = 
      att.status === 'hadir_tepat' ? 'Hadir Tepat Waktu' :
      att.status === 'hadir_terlambat' ? 'Hadir Terlambat' : 'Tidak Hadir';

    liveActivities.push({
      id: `att-${att.id}`,
      title: `${att.studentName} absensi ${att.sessionName}`,
      desc: `${statusLabel}${att.keterangan ? ` (${att.keterangan})` : ''}`,
      tag: 'Kehadiran',
      type: 'absensi',
      time: formatActivityTime(att.tanggal),
      sortKey: att.timestamp || att.tanggal || ''
    });
  });

  // 3. Collect from Tasmi records in database
  tasmiList.forEach(tsm => {
    if (tsm.status === 'selesai') {
      liveActivities.push({
        id: `tsm-${tsm.id}`,
        title: `${tsm.studentName} tuntas Ujian Tasmi'`,
        desc: `${tsm.targetJuzText} · Predikat Nilai ${tsm.nilai || 'Mumtaz'}`,
        tag: "Tasmi' Selesai",
        type: 'tasmi',
        time: formatActivityTime(tsm.tanggal),
        sortKey: tsm.tanggal || ''
      });
    } else if (tsm.status === 'terjadwal') {
      liveActivities.push({
        id: `tsm-${tsm.id}`,
        title: `Jadwal Tasmi': ${tsm.studentName}`,
        desc: `${tsm.targetJuzText} dijadwalkan pada ${tsm.tanggal || ''} ${tsm.waktu || ''} WIB`,
        tag: "Tasmi' Terjadwal",
        type: 'tasmi',
        time: formatActivityTime(tsm.tanggal),
        sortKey: tsm.tanggal || ''
      });
    }
  });

  // Sort newest first and pick top 6
  liveActivities.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  const recentActivities = liveActivities.slice(0, 6);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-4 sm:p-7 sm:p-8 shadow-md">
        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>{systemSettings?.schoolName || 'Tahfidz Tracker'}</span>
            {systemSettings?.academicYear && (
              <>
                <span>·</span>
                <span>T.A. {systemSettings.academicYear}</span>
              </>
            )}
            <span>·</span>
            <span>{todayDate}</span>
            <span>·</span>
            <span>{totalSantri} Santri Terdaftar</span>
          </div>

          <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-white mb-2 leading-tight">
            Assalamu'alaikum, {currentUser?.name || 'Asatidz'}
          </h2>

          <div className="mb-4 sm:mb-5 space-y-1.5">
            <div className="font-arabic text-lg sm:text-2xl text-emerald-100 font-medium tracking-wide" dir="rtl">
              خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
            </div>
            <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
              "Sebaik-baik kalian adalah orang yang belajar Al-Qur'an dan mengajarkannya." <span className="text-emerald-200/80 font-medium">(HR. Bukhari)</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            {isParent ? (
              <>
                {/* Informasi Setoran Hari Ini untuk Orang Tua */}
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-xs border border-white/20 text-white shadow-xs">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${childSetoranToday ? 'bg-emerald-400 text-emerald-950 font-bold' : 'bg-white/20 text-white'}`}>
                    {childSetoranToday ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 text-left">
                    <span className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider block">
                      Setoran Hari Ini ({todayDate.split(',')[0]}):
                    </span>
                    <span className="text-xs font-bold text-white block truncate">
                      {childSetoranToday 
                        ? `${childSetoranToday.surahName} · Nilai ${childSetoranToday.kualitas}` 
                        : 'Belum ada setoran hari ini'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('hafalan')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-semibold text-xs sm:text-sm hover:bg-emerald-50 active:scale-[0.98] transition-all shadow-xs"
                >
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  <span>Detail Hafalan Ananda</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onOpenAddHafalan}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-semibold text-xs sm:text-sm hover:bg-emerald-50 active:scale-[0.98] transition-all shadow-xs"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-700" />
                  <span>Setor Hafalan Baru</span>
                </button>
                <button
                  onClick={() => setActiveTab('absensi')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/60 hover:bg-emerald-600 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm border border-emerald-400/40 transition-all"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Absensi Sesi Hari Ini</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Decorative backdrop shapes */}
        <div className="absolute -right-8 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-12 top-6 text-white/10 hidden md:block select-none pointer-events-none font-arabic text-8xl">
          ﷽
        </div>
      </div>

      {/* PARENT SPECIFIC HIGHLIGHT CARD (if role is parent) */}
      {isParent && child && (() => {
        const childBreakdown = parseHafalan(child.totalJuzMemorized);
        const sisaJuz = Math.max(0, child.targetJuz - childBreakdown.decimalJuz).toFixed(1);
        const progressPct = Math.min(100, Math.round((childBreakdown.decimalJuz / child.targetJuz) * 100));

        return (
          <div className="p-4 sm:p-6 bg-gradient-to-br from-amber-50/80 via-white to-emerald-50/80 dark:from-slate-900 dark:via-slate-850 dark:to-emerald-950/60 border border-emerald-200/90 dark:border-emerald-800/60 rounded-3xl shadow-xs space-y-4 transition-colors">
            
            {/* MULTI-CHILD SELECTOR (Jika Wali Mendaftarkan 2 Anak atau Lebih) */}
            {parentChildren.length > 1 && (
              <div className="bg-white/90 dark:bg-slate-800/90 p-3 rounded-2xl border border-teal-200/80 dark:border-teal-800/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Pilih Ananda yang Ingin Dipantau ({parentChildren.length} Santri):</span>
                  </span>
                  <span className="text-[10px] text-teal-700 dark:text-teal-300 font-semibold bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                    Akun Multianak
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {parentChildren.map(c => {
                    const isCurrent = c.id === child.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => switchParentActiveChild(c.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isCurrent
                            ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-teal-500 shadow-xs font-bold ring-2 ring-teal-400/40'
                            : 'bg-slate-50 dark:bg-slate-850 hover:bg-teal-50/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs truncate">{c.nama}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[9px] font-bold">
                                Aktif
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] block truncate mt-0.5 ${isCurrent ? 'text-teal-100' : 'text-slate-400'}`}>
                            {c.kelasNama} · {c.totalJuzMemorized} / {c.targetJuz} Juz
                          </span>
                        </div>
                        {isCurrent ? (
                          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Header Ananda */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                  {child.nama.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg leading-tight">
                      Perkembangan Ananda {child.nama}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Wali Santri
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {child.kelasNama} · {child.kelompokNama} · Target: {child.targetJuz} Juz
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('hafalan')}
                className="self-start sm:self-auto text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/80 px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 transition-all"
              >
                <span>Lihat Buku Hafalan Lengkap</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* KOTAK INFORMASI SETORAN HARI INI */}
            <div className={`p-4 rounded-2xl border transition-all ${
              childSetoranToday 
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-200' 
                : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 text-amber-950 dark:text-amber-200'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    childSetoranToday ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {childSetoranToday ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {childSetoranToday ? 'Alhamdulillah, Sudah Setor Hari Ini' : 'Belum Ada Setoran Hari Ini'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        ({todayDate})
                      </span>
                    </div>

                    {childSetoranToday ? (
                      <div className="mt-1 space-y-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Juz {childSetoranToday.juz} · {childSetoranToday.surahName}
                          {childSetoranToday.ayatMulai && childSetoranToday.ayatSelesai ? ` (Ayat ${childSetoranToday.ayatMulai} - ${childSetoranToday.ayatSelesai})` : ''}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 font-semibold text-emerald-800 dark:text-emerald-300">
                            Predikat: Nilai {childSetoranToday.kualitas}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-slate-700 dark:text-slate-300">
                            {childSetoranToday.type === 'baru' ? 'Hafalan Baru' : 'Muroja\'ah'}
                          </span>
                          {childSetoranToday.catatan && (
                            <span className="italic text-slate-500 dark:text-slate-400">
                              "{childSetoranToday.catatan}"
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                        <p>
                          Ananda belum melakukan setoran pada tanggal ini. Setoran biasanya dicatat saat sesi halaqah berlangsung.
                        </p>
                        <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Bookmark className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>
                            Setoran terakhir ananda: <strong>{childLatestDeposit ? `${childLatestDeposit.surahName} (Tanggal: ${childLatestDeposit.tanggal})` : 'Belum ada'}</strong>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Ringkasan Capaian Mudah Dibaca Orang Tua */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
              <div className="bg-white dark:bg-slate-800/90 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Total Capaian Hafalan</span>
                <span className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums block mt-0.5">
                  {childBreakdown.decimalText} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Juz</span>
                </span>
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold block mt-1 bg-emerald-50 dark:bg-emerald-950/70 py-0.5 rounded-md">
                  {childBreakdown.lembarText}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-800/90 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Target Juz Total</span>
                <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums block mt-0.5">
                  {progressPct}%
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                  Dari target {child.targetJuz} Juz (Sisa {sisaJuz} Juz)
                </span>
              </div>

              <div className="bg-white dark:bg-slate-800/90 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Tingkat Kehadiran</span>
                <span className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400 tabular-nums block mt-0.5">
                  {child.kehadiranPersen}%
                </span>
                <span className="text-[10px] text-blue-700 dark:text-blue-300 font-semibold block mt-1 bg-blue-50 dark:bg-blue-950/70 py-0.5 rounded-md">
                  Sangat Aktif & Rajin
                </span>
              </div>

              <div className="bg-white dark:bg-slate-800/90 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Halaqah & Pembina</span>
                <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 block mt-1 truncate">
                  {child.kelompokNama}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                  {child.kelasNama}
                </span>
              </div>
            </div>

            {/* Visual Progress Bar Ananda Menuju Target */}
            <div className="bg-white dark:bg-slate-800/90 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Progres Menuju Target {child.targetJuz} Juz Al-Qur'an:
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {childBreakdown.decimalText} dari {child.targetJuz} Juz ({progressPct}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
                <span>Mulai</span>
                <span>{sisaJuz === '0.0' ? '🎉 Target Tercapai!' : `Sisa ${sisaJuz} Juz lagi`}</span>
                <span>Target: {child.targetJuz} Juz</span>
              </div>
            </div>

            {/* Patokan Perkembangan Halaman / Lembar Qur'an & Surat Sedang Dihafal */}
            <div className="bg-white dark:bg-slate-800/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Patokan Perkembangan Halaman & Lembar Al-Qur'an
                      </h4>
                      <FeatureHint
                        title="Standar Mushaf Rasm Utsmani"
                        content="Standar Mushaf Rasm Utsmani Madinah: 1 Juz = 20 Halaman = 10 Lembar. 1 Lembar = 2 Halaman. Setiap 1 Halaman penuh = 0.5 Lembar = 0.05 Juz."
                        align="left"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Standar Mushaf Rasm Utsmani Madinah (1 Juz = 10 Lembar)</span>
                  </div>
                </div>

                {/* Tombol Kirim Pesan WA ke Guru */}
                <button
                  type="button"
                  onClick={() => setIsWaModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all shrink-0 self-start sm:self-auto cursor-pointer"
                  title="Hubungi Guru Pembina via WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white/20" />
                  <span>Tanya Guru via WhatsApp</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 space-y-1">
                  <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                    Total Capaian Halaman
                  </span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {childBreakdown.lembarText} ({childBreakdown.halaman} Halaman)
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Akumulasi: {childBreakdown.decimalText} Juz penuh dan lembar berjalan
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Sedang Berjalan Dihafal
                  </span>
                  {child.inProgressJuz ? (
                    <div>
                      <p className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">
                        Juz {child.inProgressJuz.juzNumber} · Lembar ke-{child.inProgressJuz.lembar} (Halaman {child.inProgressJuz.halaman})
                      </p>
                      {child.inProgressJuz.surahSedangDihafal && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          Surat: <strong className="text-slate-800 dark:text-slate-200">{child.inProgressJuz.surahSedangDihafal}</strong> {child.inProgressJuz.ayatDetail || ''}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {child.terakhirSetor ? `Terakhir setor: Juz ${child.terakhirSetor.juz} (${child.terakhirSetor.surah})` : 'Mengikuti jadwal halaqah'}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        Patokan lembar dapat disesuaikan oleh guru di menu Hafalan
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        );
      })()}

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Santri Aktif</span>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{totalSantri}</span>
            <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">100% aktif halaqah</span>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Rata-Rata Hafalan</span>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{avgJuz} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Juz</span></span>
            <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">+1.2 Juz bln ini</span>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Rata-Rata Hadir</span>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{avgAttendance}%</span>
            <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">Sangat disiplin</span>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Tasmi' Bulan Ini</span>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{tasmiDoneCount} / {tasmiList.length}</span>
            <span className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-medium block mt-0.5">{tasmiScheduledCount} siap diuji</span>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* 3 Top Leaderboard Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Leaderboard 1: 5 Santri Hafalan Terbanyak */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                  5 Santri Hafalan Terbanyak
                </h3>
                <FeatureHint title="5 Santri Hafalan Terbanyak" content="Peringkat 5 santri dengan akumulasi juz, lembar, dan halaman hafalan mutqin tertinggi berdasarkan rujukan Mushaf Madinah." align="left" />
              </div>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">30 Juz</span>
          </div>

          <div className="space-y-3">
            {topHafalan.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">Belum ada data santri</p>
            ) : (
              topHafalan.map((student, idx) => {
              const b = parseHafalan(student.totalJuzMemorized);
              const pct = Math.round((b.decimalJuz / 30) * 100);
              const rankColor = 
                idx === 0 ? 'bg-amber-500 text-white' :
                idx === 1 ? 'bg-slate-400 dark:bg-slate-600 text-white' :
                idx === 2 ? 'bg-amber-700 text-white' :
                'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';

              return (
                <div key={student.id} className="flex items-center gap-2.5 sm:gap-3">
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${rankColor}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="min-w-0 pr-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block">{student.nama}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block">{student.kelasNama} · {student.kelompokNama}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{b.decimalText} Juz</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal ml-1">({pct}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-emerald-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                      {b.detailText}
                    </span>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>

        {/* Leaderboard 2: 5 Hafalan Tercepat (Update Per Pekan / Per Bulan, Tersinkron Super Admin) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
            <div className="flex items-start gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Rocket className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight">
                    {fastestTopCount} Hafalan Tercepat
                  </h3>
                  <FeatureHint
                    title={`${fastestTopCount} Hafalan Tercepat (${fastestPeriod === 'monthly' ? 'Per Bulan' : 'Per Pekan'})`}
                    content={`Update otomatis ${
                      fastestPeriod === 'monthly'
                        ? `setiap bulan (${monthRangeLabel}) dengan target bulanan ${ACTIVE_TARGET_LEMBAR} Lembar (${ACTIVE_TARGET_PAGES} Halaman)`
                        : `setiap pekan (Senin–Ahad WIB) dengan target mingguan ${ACTIVE_TARGET_LEMBAR} Lembar (${ACTIVE_TARGET_PAGES} Halaman)`
                    }. Progres dihitung murni dari Setoran Hafalan Baru berdasarkan standar Mushaf Rasm Utsmani (1 Lembar = 2 Halaman).`}
                    align="left"
                  />
                </div>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium block mt-0.5">
                  {fastestPeriod === 'monthly'
                    ? `Bulan Ini (${monthRangeLabel})`
                    : `Pekan Ini (${weekRangeLabel})`}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {(fastestCfg.allowUserSwitchPeriod !== false || currentUser?.role === 'super_admin') && (
                <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200/70 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setFastestPeriod('weekly')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      fastestPeriod === 'weekly'
                        ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Per Pekan
                  </button>
                  <button
                    type="button"
                    onClick={() => setFastestPeriod('monthly')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      fastestPeriod === 'monthly'
                        ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Per Bulan
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  Target: {ACTIVE_TARGET_LEMBAR} Lembar
                </span>
                {currentUser?.role === 'super_admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem('tahfidz_kelola_tab_v1', JSON.stringify('superadmin'));
                      localStorage.setItem('tahfidz_superadmin_section_v1', JSON.stringify('leaderboard'));
                      setActiveTab('kelolaData');
                    }}
                    className="text-[10px] font-bold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
                    title="Kelola target 5 Hafalan Tercepat di Super Admin"
                  >
                    Atur
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {topGrowth.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">
                Belum ada setoran baru {fastestPeriod === 'monthly' ? 'bulan ini' : 'pekan ini'}
              </p>
            ) : (
              topGrowth.map((student, idx) => {
                const isPartialOnly = student.realtimeLembar === 0 && student.isCurrentPagePartial;
                const targetPct = Math.min(100, Math.round((student.realtimeLembar / ACTIVE_TARGET_LEMBAR) * 100));
                const growthPct = isPartialOnly
                  ? Math.max(6, Math.round(student.pendingFraction * 20))
                  : Math.min(100, Math.max(8, targetPct));
                const isTargetAchieved = student.realtimeLembar >= ACTIVE_TARGET_LEMBAR;
                const rankColor = 
                  idx === 0 ? 'bg-blue-600 text-white shadow-xs' :
                  idx === 1 ? 'bg-blue-500 text-white' :
                  idx === 2 ? 'bg-sky-500 text-white' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';

                return (
                  <div key={student.id} className="flex items-center gap-2.5 sm:gap-3">
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${rankColor}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block">
                              {student.nama}
                            </span>
                            {isTargetAchieved && fastestCfg.achievementBadgeLabel && (
                              <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                                ★ {fastestCfg.achievementBadgeLabel}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block">
                            {student.kelasNama} · {student.kelompokNama}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`font-bold tabular-nums ${
                            isPartialOnly
                              ? 'text-amber-600 dark:text-amber-400'
                              : isTargetAchieved
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-blue-700 dark:text-blue-400'
                          }`}>
                            +{student.realtimeLembar} Lembar
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal ml-1">
                            ({targetPct}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`${
                            isPartialOnly
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                              : isTargetAchieved
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                              : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                          } h-full rounded-full transition-all duration-500`} 
                          style={{ width: `${growthPct}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Leaderboard 3: 10 Santri Paling Rajin (Update Per Pekan) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight">
                      10 Santri Paling Rajin
                    </h3>
                    <FeatureHint title="Santri Paling Rajin" content="Update otomatis setiap pekan (Senin–Ahad WIB) berdasarkan rekap kehadiran tepat waktu sesi halaqah pada pekan berjalan." align="left" />
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Pekan Ini ({weekRangeLabel})
                  </span>
                </div>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium shrink-0">{MIN_ATTENDANCE_TARGET_PCT}% Target</span>
            </div>

            <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1">
              {topAttendance.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">Belum ada data presensi</p>
              ) : (
                topAttendance.map((student, idx) => {
                const rankBadge = 
                  idx === 0 ? 'bg-emerald-600 text-white font-bold' :
                  idx === 1 ? 'bg-emerald-500 text-white font-bold' :
                  idx === 2 ? 'bg-teal-500 text-white font-bold' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';

                const barColor = 
                  student.realtimeAttendancePct >= 95 ? 'bg-emerald-500' :
                  student.realtimeAttendancePct >= 90 ? 'bg-teal-500' :
                  student.realtimeAttendancePct >= 80 ? 'bg-cyan-500' : 'bg-amber-500';

                return (
                  <div key={student.id} className="py-0.5">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] shrink-0 ${rankBadge}`}>
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {student.nama}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate hidden sm:inline">
                          ({student.kelompokNama})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {student.totalSessions > 0 ? (
                          <>
                            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium tabular-nums">
                              {student.presentSessions}/{student.totalSessions} sesi
                            </span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums w-10 text-right">
                              {student.realtimeAttendancePct}%
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                              0 sesi input
                            </span>
                            <span className="font-semibold text-slate-400 dark:text-slate-500 tabular-nums w-10 text-right">
                              -
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Visual Bar Chart */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${student.totalSessions > 0 ? barColor : 'bg-slate-200 dark:bg-slate-700'}`} 
                        style={{ width: `${student.totalSessions > 0 ? student.realtimeAttendancePct : 0}%` }} 
                        title={student.totalSessions > 0 ? `Kehadiran: ${student.realtimeAttendancePct}% (${student.presentSessions}/${student.totalSessions} sesi tercatat)` : 'Belum ada absensi yang diinput untuk santri ini'}
                      />
                    </div>
                    {student.totalSessions > 0 && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-1">
                        Sesi: <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">{student.sessionBreakdownText}</strong>
                      </span>
                    )}
                  </div>
                );
              }))}
            </div>
          </div>
        </div>

      </div>

      {/* Live Recent Activity Feed */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              Aktivitas Terbaru
            </h3>
          </div>
          <button 
            onClick={() => setActiveTab('hafalan')}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300"
          >
            Lihat Semua
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recentActivities.length === 0 ? (
            <div className="col-span-2 text-center py-6 text-slate-400 dark:text-slate-500 text-xs">
              Belum ada riwayat aktivitas terbaru yang tercatat.
            </div>
          ) : (
            recentActivities.map(act => {
              const isHafalan = act.type === 'hafalan';
              const isAbsensi = act.type === 'absensi';
              const iconColor = isHafalan 
                ? 'bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400' 
                : isAbsensi 
                ? 'bg-teal-100/90 dark:bg-teal-950/80 text-teal-700 dark:text-teal-400' 
                : 'bg-amber-100/90 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400';

              const tagColor = isHafalan
                ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/60 dark:border-emerald-800/60'
                : isAbsensi
                ? 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border-teal-200/60 dark:border-teal-800/60'
                : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200/60 dark:border-amber-800/60';

              return (
                <div 
                  key={act.id} 
                  className="flex items-start gap-3 p-3.5 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100/70 dark:hover:bg-slate-800/90 rounded-xl border border-slate-200/60 dark:border-slate-700/60 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${iconColor}`}>
                    {isHafalan ? <BookOpen className="w-4 h-4" /> : isAbsensi ? <CalendarCheck className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {act.title}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap tabular-nums">
                        {act.time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1">
                      {act.desc}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md border ${tagColor}`}>
                        {act.tag}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Kirim Pesan WhatsApp Modal for Parent */}
      {isParent && child && (
        <KirimPesanWAModal
          isOpen={isWaModalOpen}
          onClose={() => setIsWaModalOpen(false)}
          student={child}
          defaultCategory="tanya_hafalan"
        />
      )}

    </div>
  );
};
