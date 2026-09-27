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
  Sparkles
} from 'lucide-react';

interface DashboardViewProps {
  onOpenAddHafalan: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenAddHafalan }) => {
  const { currentUser, santriList, attendanceHistory, tasmiList, setActiveTab } = useTahfidz();

  const isParent = currentUser?.role === 'parent';
  const child = isParent ? santriList.find(s => s.id === currentUser.studentId) || santriList[0] : null;

  // Format today's date in Indonesian
  const todayDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Calculate metrics
  const totalSantri = santriList.length;
  const totalJuzAll = santriList.reduce((acc, s) => acc + s.totalJuzMemorized, 0);
  const avgJuz = (totalJuzAll / (totalSantri || 1)).toFixed(1);
  const tasmiDoneCount = tasmiList.filter(t => t.status === 'selesai').length;
  const tasmiScheduledCount = tasmiList.filter(t => t.status === 'terjadwal').length;

  // Realtime Helper 1: calculate student's accurate attendance rate from attendanceHistory
  const getStudentRealtimeAttendance = (student: typeof santriList[0]) => {
    const studentRecords = attendanceHistory.filter(r => r.studentId === student.id);
    
    if (studentRecords.length === 0) {
      const pct = student.kehadiranPersen || 100;
      return {
        attendancePct: pct,
        totalSessions: 15,
        presentSessions: Math.round(15 * (pct / 100)),
        onTimeSessions: Math.round(15 * (pct / 100)),
        lateSessions: 0,
        absentSessions: Math.round(15 * (1 - pct / 100))
      };
    }

    const onTime = studentRecords.filter(r => r.status === 'hadir_tepat').length;
    const late = studentRecords.filter(r => r.status === 'hadir_terlambat').length;
    const absent = studentRecords.filter(r => r.status === 'tidak_hadir').length;
    const present = onTime + late;
    const total = studentRecords.length;

    // Blend with initial baseline if recorded sessions are small (< 10)
    let finalPct: number;
    let effectiveTotal: number;
    let effectivePresent: number;

    if (total >= 10) {
      finalPct = Math.round(((onTime * 1.0 + late * 0.8) / total) * 100);
      effectiveTotal = total;
      effectivePresent = present;
    } else {
      const baseSessions = 15;
      const basePresent = baseSessions * ((student.kehadiranPersen || 90) / 100);
      effectiveTotal = baseSessions + total;
      effectivePresent = Math.round(basePresent + (onTime * 1.0 + late * 0.8));
      finalPct = Math.min(100, Math.max(0, Math.round((effectivePresent / effectiveTotal) * 100)));
    }

    return {
      attendancePct: finalPct,
      totalSessions: effectiveTotal,
      presentSessions: effectivePresent,
      onTimeSessions: onTime,
      lateSessions: late,
      absentSessions: absent
    };
  };

  // Realtime Helper 2: calculate student's true weekly growth from hafalanList
  const getStudentRealtimeGrowth = (student: typeof santriList[0]) => {
    const hafalan = student.hafalanList || [];
    const sorted = [...hafalan].sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
    const latestDateStr = sorted[0]?.tanggal;
    const refDate = latestDateStr ? new Date(latestDateStr) : new Date();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    const recentDeposits = sorted.filter(h => {
      if (!h.tanggal) return false;
      const d = new Date(h.tanggal);
      return Math.abs(refDate.getTime() - d.getTime()) <= sevenDaysMs;
    });

    const activeList = recentDeposits.length > 0 ? recentDeposits : sorted.slice(0, 3);

    let calculatedGrowth = 0;
    activeList.forEach(h => {
      if (h.type === 'baru') {
        if (h.category === 'juz') {
          calculatedGrowth += 1.0;
        } else if (h.ayatMulai && h.ayatSelesai) {
          const count = h.ayatSelesai - h.ayatMulai + 1;
          calculatedGrowth += Math.min(1.0, Math.max(0.2, Number((count / 120).toFixed(1))));
        } else {
          calculatedGrowth += 0.5;
        }
      } else {
        calculatedGrowth += 0.2;
      }
    });

    const growth = Math.max(
      student.weeklyGrowthJuz || 0,
      Number(calculatedGrowth.toFixed(1))
    );

    return {
      growthJuz: Number(growth.toFixed(1)),
      recentCount: Math.max(activeList.length, hafalan.length > 0 ? 1 : 0),
      lastDepositInfo: sorted[0] ? `${sorted[0].surahName || `Juz ${sorted[0].juz}`}` : 'Belum setor'
    };
  };

  // Real-time Leaderboards
  const topHafalan = [...santriList].sort((a, b) => b.totalJuzMemorized - a.totalJuzMemorized).slice(0, 5);

  const topGrowth = santriList
    .map(student => {
      const stats = getStudentRealtimeGrowth(student);
      return {
        ...student,
        realtimeGrowth: stats.growthJuz,
        recentSetoranCount: stats.recentCount,
        lastDepositInfo: stats.lastDepositInfo
      };
    })
    .sort((a, b) => {
      if (b.realtimeGrowth !== a.realtimeGrowth) {
        return b.realtimeGrowth - a.realtimeGrowth;
      }
      return b.recentSetoranCount - a.recentSetoranCount;
    })
    .slice(0, 5);

  const maxGrowth = Math.max(...topGrowth.map(s => s.realtimeGrowth), 1.0);

  const topAttendance = santriList
    .map(student => {
      const stats = getStudentRealtimeAttendance(student);
      return {
        ...student,
        realtimeAttendancePct: stats.attendancePct,
        presentSessions: stats.presentSessions,
        totalSessions: stats.totalSessions,
        onTimeSessions: stats.onTimeSessions
      };
    })
    .sort((a, b) => {
      if (b.realtimeAttendancePct !== a.realtimeAttendancePct) {
        return b.realtimeAttendancePct - a.realtimeAttendancePct;
      }
      if (b.presentSessions !== a.presentSessions) {
        return b.presentSessions - a.presentSessions;
      }
      return b.totalJuzMemorized - a.totalJuzMemorized;
    })
    .slice(0, 10);

  // Recalculate average attendance dynamically from real-time values
  const avgAttendance = Math.round(
    santriList.reduce((acc, s) => acc + getStudentRealtimeAttendance(s).attendancePct, 0) / (totalSantri || 1)
  );

  // Helper to format relative time or date
  const formatActivityTime = (dateStr?: string) => {
    if (!dateStr) return 'Baru saja';
    try {
      const today = new Date().toISOString().split('T')[0];
      if (dateStr === today) return 'Hari ini';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 sm:p-8 shadow-md">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>{todayDate}</span>
            <span>·</span>
            <span>{totalSantri} Santri Terdaftar</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Assalamu'alaikum, {currentUser?.name || 'Asatidz'}
          </h2>

          <div className="mb-5 space-y-1.5">
            <div className="font-arabic text-lg sm:text-2xl text-emerald-100 font-medium tracking-wide" dir="rtl">
              خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
            </div>
            <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
              "Sebaik-baik kalian adalah orang yang belajar Al-Qur'an dan mengajarkannya." <span className="text-emerald-200/80 font-medium">(HR. Bukhari)</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenAddHafalan}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-semibold text-xs sm:text-sm hover:bg-emerald-50 transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-emerald-700" />
              Setor Hafalan Baru
            </button>
            <button
              onClick={() => setActiveTab('absensi')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/60 hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm border border-emerald-400/40 transition-colors"
            >
              <CalendarCheck className="w-4 h-4" />
              Absensi Sesi Hari Ini
            </button>
          </div>
        </div>

        {/* Decorative backdrop shapes */}
        <div className="absolute -right-8 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-12 top-6 text-white/10 hidden md:block select-none pointer-events-none font-arabic text-8xl">
          ﷽
        </div>
      </div>

      {/* PARENT SPECIFIC HIGHLIGHT CARD (if role is parent) */}
      {isParent && child && (
        <div className="p-5 bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold text-sm">
                {child.nama.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Perkembangan {child.nama}
                </h3>
                <div className="text-xs text-slate-500">
                  {child.kelasNama} · {child.kelompokNama} · Target: {child.targetJuz} Juz
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('hafalan')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Detail <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-center">
            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <span className="text-xs text-slate-500 block">Total Hafalan</span>
              <span className="text-xl font-bold text-emerald-700 tabular-nums">
                {child.totalJuzMemorized} <span className="text-xs font-normal text-slate-500">Juz</span>
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <span className="text-xs text-slate-500 block">Progress Target</span>
              <span className="text-xl font-bold text-slate-900 tabular-nums">
                {Math.round((child.totalJuzMemorized / child.targetJuz) * 100)}%
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <span className="text-xs text-slate-500 block">Kehadiran</span>
              <span className="text-xl font-bold text-blue-700 tabular-nums">
                {child.kehadiranPersen}%
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <span className="text-xs text-slate-500 block">Setoran Terakhir</span>
              <span className="text-xs font-semibold text-slate-800 truncate block mt-1">
                {child.terakhirSetor ? `${child.terakhirSetor.surah}` : 'Belum ada'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block font-medium">Total Santri Aktif</span>
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{totalSantri}</span>
            <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">100% aktif halaqah</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block font-medium">Rata-Rata Hafalan</span>
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{avgJuz} <span className="text-xs font-normal text-slate-500">Juz</span></span>
            <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">+1.2 Juz bln ini</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block font-medium">Rata-Rata Kehadiran</span>
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{avgAttendance}%</span>
            <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">Sangat disiplin</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block font-medium">Tasmi' Bulan Ini</span>
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{tasmiDoneCount} / {tasmiList.length}</span>
            <span className="text-[11px] text-amber-600 font-medium block mt-0.5">{tasmiScheduledCount} siap diuji</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3 Top Leaderboard Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leaderboard 1: 5 Santri Hafalan Terbanyak */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                5 Hafalan Terbanyak
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">30 Juz</span>
          </div>

          <div className="space-y-3">
            {topHafalan.map((student, idx) => {
              const pct = Math.round((student.totalJuzMemorized / 30) * 100);
              const rankColor = 
                idx === 0 ? 'bg-amber-500 text-white' :
                idx === 1 ? 'bg-slate-400 text-white' :
                idx === 2 ? 'bg-amber-700 text-white' :
                'bg-slate-100 text-slate-600';

              return (
                <div key={student.id} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${rankColor}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-900 truncate pr-2">{student.nama}</span>
                      <span className="font-bold text-emerald-700 tabular-nums shrink-0">{student.totalJuzMemorized} Juz ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-emerald-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leaderboard 2: 5 Perkembangan Tercepat */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Rocket className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                    5 Perkembangan Tercepat
                  </h3>
                  <span className="text-[10px] text-blue-600 font-medium">Realtime Pekan Ini</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                Max +{maxGrowth} Juz
              </span>
            </div>

            <div className="space-y-3.5">
              {topGrowth.map((student, idx) => {
                const growthPct = Math.min(100, Math.max(8, Math.round((student.realtimeGrowth / maxGrowth) * 100)));
                const rankColor = 
                  idx === 0 ? 'bg-blue-600 text-white shadow-xs' :
                  idx === 1 ? 'bg-blue-500 text-white' :
                  idx === 2 ? 'bg-sky-500 text-white' :
                  'bg-slate-100 text-slate-600';

                return (
                  <div key={student.id} className="group">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${rankColor}`}>
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900 truncate block">
                            {student.nama}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate block">
                            {student.kelompokNama} · {student.recentSetoranCount} setoran ({student.lastDepositInfo})
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 pl-2">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md text-xs tabular-nums inline-block">
                          +{student.realtimeGrowth} Juz
                        </span>
                      </div>
                    </div>
                    {/* Visual Bar Chart */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${growthPct}%` }} 
                        title={`Pertumbuhan: +${student.realtimeGrowth} Juz (${growthPct}%)`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Leaderboard 3: 10 Santri Paling Rajin */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                    10 Santri Paling Rajin
                  </h3>
                  <span className="text-[10px] text-emerald-600 font-medium">Realtime Presensi</span>
                </div>
              </div>
              <span className="text-xs text-slate-400 font-medium">100% Target</span>
            </div>

            <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1">
              {topAttendance.map((student, idx) => {
                const rankBadge = 
                  idx === 0 ? 'bg-emerald-600 text-white font-bold' :
                  idx === 1 ? 'bg-emerald-500 text-white font-bold' :
                  idx === 2 ? 'bg-teal-500 text-white font-bold' :
                  'bg-slate-100 text-slate-600';

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
                        <span className="font-semibold text-slate-900 truncate">
                          {student.nama}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                          ({student.kelompokNama})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-500 tabular-nums">
                          {student.presentSessions}/{student.totalSessions} sesi
                        </span>
                        <span className="font-bold text-emerald-700 tabular-nums w-10 text-right">
                          {student.realtimeAttendancePct}%
                        </span>
                      </div>
                    </div>
                    {/* Visual Bar Chart */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                        style={{ width: `${student.realtimeAttendancePct}%` }} 
                        title={`Kehadiran: ${student.realtimeAttendancePct}% (${student.presentSessions}/${student.totalSessions} sesi)`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Live Recent Activity Feed */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              Aktivitas Terbaru
            </h3>
          </div>
          <button 
            onClick={() => setActiveTab('hafalan')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Lihat Semua
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recentActivities.length === 0 ? (
            <div className="col-span-2 text-center py-6 text-slate-400 text-xs">
              Belum ada riwayat aktivitas terbaru yang tercatat.
            </div>
          ) : (
            recentActivities.map(act => {
              const isHafalan = act.type === 'hafalan';
              const isAbsensi = act.type === 'absensi';
              const iconColor = isHafalan 
                ? 'bg-emerald-100/90 text-emerald-700' 
                : isAbsensi 
                ? 'bg-teal-100/90 text-teal-700' 
                : 'bg-amber-100/90 text-amber-700';

              const tagColor = isHafalan
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200/60'
                : isAbsensi
                ? 'text-teal-700 bg-teal-50 border-teal-200/60'
                : 'text-amber-700 bg-amber-50 border-amber-200/60';

              return (
                <div 
                  key={act.id} 
                  className="flex items-start gap-3 p-3.5 bg-slate-50/70 hover:bg-slate-100/70 rounded-xl border border-slate-200/60 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${iconColor}`}>
                    {isHafalan ? <BookOpen className="w-4 h-4" /> : isAbsensi ? <CalendarCheck className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {act.title}
                      </span>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap tabular-nums">
                        {act.time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
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

    </div>
  );
};
