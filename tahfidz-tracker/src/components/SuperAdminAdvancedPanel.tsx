import React, { useState, useMemo, useEffect } from 'react';
import { useTahfidz } from '../context/TahfidzContext';
import { calculateStudentSetoranGrowth } from '../utils/growthCalculator';
import { useTodayWIB, formatDateIsoId, getWeekDaysWIB } from '../utils/dateWIB';
import {
  Rocket,
  Trophy,
  Target,
  Check,
  Copy,
  Megaphone,
  Users,
  GraduationCap,
  RefreshCw,
  Download,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Sliders,
  Layers,
  Award,
} from 'lucide-react';

interface SuperAdminAdvancedPanelProps {
  mode: 'leaderboard' | 'bulk_ops';
  onShowFeedback: (msg: string, type?: 'success' | 'error') => void;
}

export const SuperAdminAdvancedPanel: React.FC<SuperAdminAdvancedPanelProps> = ({
  mode,
  onShowFeedback,
}) => {
  const {
    santriList,
    classes,
    groups,
    attendanceHistory,
    systemSettings,
    updateSystemSettings,
    bulkUpdateSantriTarget,
    bulkTransferSantri,
    recalculateDatabaseIntegrity,
  } = useTahfidz();

  const todayIso = useTodayWIB();
  const currentWeek = useMemo(() => getWeekDaysWIB(0, todayIso), [todayIso]);
  const weekStartIso = currentWeek.days[0].dateIso;
  const weekEndIso = currentWeek.days[6].dateIso;
  const weekRangeLabel = `${currentWeek.days[0].dateLabel} - ${currentWeek.days[6].dateLabel}`;

  const monthStartIso = `${todayIso.slice(0, 7)}-01`;
  const monthEndIso = `${todayIso.slice(0, 7)}-31`;
  const monthRangeLabel = formatDateIsoId(todayIso, { month: 'long', year: 'numeric' });

  // ============================================================================
  // STATE UNTUK KELOLA TARGET 5 HAFALAN TERCEPAT (PEKANAN & BULANAN)
  // ============================================================================
  const cfg = systemSettings?.fastestHafalanConfig || {
    defaultPeriod: 'weekly' as const,
    allowUserSwitchPeriod: true,
    weeklyTargetLembar: 2.5,
    monthlyTargetLembar: 10,
    topCount: 5,
    minAttendanceTargetPct: 100,
    achievementBadgeLabel: 'Mumtaz Progresif',
  };

  const [defaultPeriod, setDefaultPeriod] = useState<'weekly' | 'monthly'>(cfg.defaultPeriod || 'weekly');
  const [allowUserSwitchPeriod, setAllowUserSwitchPeriod] = useState<boolean>(
    cfg.allowUserSwitchPeriod !== false
  );
  const [weeklyTargetLembar, setWeeklyTargetLembar] = useState<number>(
    Number(cfg.weeklyTargetLembar) || 2.5
  );
  const [monthlyTargetLembar, setMonthlyTargetLembar] = useState<number>(
    Number(cfg.monthlyTargetLembar) || 10
  );
  const [topCount, setTopCount] = useState<number>(Number(cfg.topCount) || 5);
  const [minAttendanceTargetPct, setMinAttendanceTargetPct] = useState<number>(
    Number(cfg.minAttendanceTargetPct) || 100
  );
  const [achievementBadgeLabel, setAchievementBadgeLabel] = useState<string>(
    cfg.achievementBadgeLabel || 'Mumtaz Progresif'
  );
  const [isSavingLeaderboardCfg, setIsSavingLeaderboardCfg] = useState(false);
  const [previewTab, setPreviewTab] = useState<'weekly' | 'monthly'>(cfg.defaultPeriod || 'weekly');
  const [copiedWaReport, setCopiedWaReport] = useState(false);

  useEffect(() => {
    const latest = systemSettings?.fastestHafalanConfig;
    if (latest) {
      setDefaultPeriod(latest.defaultPeriod || 'weekly');
      setAllowUserSwitchPeriod(latest.allowUserSwitchPeriod !== false);
      setWeeklyTargetLembar(Number(latest.weeklyTargetLembar) || 2.5);
      setMonthlyTargetLembar(Number(latest.monthlyTargetLembar) || 10);
      setTopCount(Number(latest.topCount) || 5);
      setMinAttendanceTargetPct(Number(latest.minAttendanceTargetPct) || 100);
      setAchievementBadgeLabel(latest.achievementBadgeLabel || 'Mumtaz Progresif');
    }
  }, [systemSettings?.fastestHafalanConfig]);

  // Hitung peringkat nyata Pekan Ini & Bulan Ini untuk pratinjau langsung Super Admin
  const computeLeaderboardForRange = (startDate: string, endDate: string, limitCount: number) => {
    return santriList
      .map(student => {
        const stats = calculateStudentSetoranGrowth(
          student.id,
          student.hafalanList,
          attendanceHistory,
          { startDate, endDate }
        );
        return {
          ...student,
          realtimeLembar: stats.growthLembar,
          realtimePages: stats.growthPages,
          fractionalPages: stats.fractionalPages,
          isCurrentPagePartial: stats.isCurrentPagePartial,
          pendingFraction: stats.pendingFraction,
          recentSetoranCount: stats.recentCount,
          lastDepositDate: stats.lastDepositDate,
          lastDepositTimestamp: stats.lastDepositTimestamp,
        };
      })
      .filter(s => s.recentSetoranCount > 0)
      .sort((a, b) => {
        if ((b.realtimeLembar > 0) !== (a.realtimeLembar > 0)) {
          return b.realtimeLembar > 0 ? 1 : -1;
        }
        if (b.realtimeLembar !== a.realtimeLembar) {
          return b.realtimeLembar - a.realtimeLembar;
        }
        if (b.fractionalPages !== a.fractionalPages) {
          return b.fractionalPages - a.fractionalPages;
        }
        return b.totalJuzMemorized - a.totalJuzMemorized;
      })
      .slice(0, limitCount);
  };

  const weeklyTopList = useMemo(
    () => computeLeaderboardForRange(weekStartIso, weekEndIso, topCount),
    [santriList, attendanceHistory, weekStartIso, weekEndIso, topCount]
  );

  const monthlyTopList = useMemo(
    () => computeLeaderboardForRange(monthStartIso, monthEndIso, topCount),
    [santriList, attendanceHistory, monthStartIso, monthEndIso, topCount]
  );

  const activePreviewList = previewTab === 'monthly' ? monthlyTopList : weeklyTopList;
  const activePreviewTarget = previewTab === 'monthly' ? monthlyTargetLembar : weeklyTargetLembar;

  const handleSaveLeaderboardSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLeaderboardCfg(true);
    try {
      await updateSystemSettings({
        targetWeeklySetoran: Math.round(weeklyTargetLembar * 2),
        fastestHafalanConfig: {
          defaultPeriod,
          allowUserSwitchPeriod,
          weeklyTargetLembar: Math.max(0.5, Number(weeklyTargetLembar) || 2.5),
          monthlyTargetLembar: Math.max(1, Number(monthlyTargetLembar) || 10),
          topCount: Math.max(3, Math.min(10, Number(topCount) || 5)),
          minAttendanceTargetPct: Math.max(50, Math.min(100, Number(minAttendanceTargetPct) || 100)),
          achievementBadgeLabel: achievementBadgeLabel.trim() || 'Mumtaz Progresif',
        },
      });
      onShowFeedback(
        `Pengaturan target ${topCount} Hafalan Tercepat (${
          defaultPeriod === 'monthly' ? 'Bulanan' : 'Pekanan'
        }) berhasil disimpan dan disinkronkan ke seluruh akun!`
      );
    } finally {
      setIsSavingLeaderboardCfg(false);
    }
  };

  const handleBroadcastTopFastest = async () => {
    const list = activePreviewList;
    const periodTitle =
      previewTab === 'monthly' ? `Bulan Ini (${monthRangeLabel})` : `Pekan Ini (${weekRangeLabel})`;
    if (list.length === 0) {
      onShowFeedback(
        `Belum ada data setoran baru pada periode ${periodTitle} untuk disiarkan.`,
        'error'
      );
      return;
    }

    const summaryNames = list
      .map((s, i) => `${i + 1}. ${s.nama} (+${s.realtimeLembar} Lembar)`)
      .join(' · ');
    const message = `Apresiasi ${topCount} Hafalan Tercepat ${periodTitle} (Target ${activePreviewTarget} Lembar): ${summaryNames}. Barakallahu fiikum!`;

    await updateSystemSettings({
      broadcastAnnouncement: {
        active: true,
        type: 'announcement',
        message,
      },
    });
    onShowFeedback('Daftar Hafalan Tercepat berhasil disiarkan ke spanduk pengumuman atas!');
  };

  const handleCopyWhatsappLeaderboard = () => {
    const list = activePreviewList;
    const periodTitle =
      previewTab === 'monthly' ? `Bulan Ini (${monthRangeLabel})` : `Pekan Ini (${weekRangeLabel})`;
    const lines = [
      `*APRESIASI ${topCount} HAFALAN TERCEPAT — ${(systemSettings?.schoolName || 'TAHFIDZ TRACKER').toUpperCase()}*`,
      `Periode: *${periodTitle}*`,
      `Target Capaian: *${activePreviewTarget} Lembar (${Math.round(activePreviewTarget * 2)} Halaman Mushaf Utsmani)*`,
      ``,
      ...(list.length === 0
        ? ['_Belum ada catatan setoran baru pada periode ini._']
        : list.map((s, idx) => {
            const pct = Math.min(100, Math.round((s.realtimeLembar / activePreviewTarget) * 100));
            return `${idx + 1}. *${s.nama}* (${s.kelasNama} · ${s.kelompokNama}) — *+${s.realtimeLembar} Lembar* (${pct}% dari target)`;
          })),
      ``,
      `_Semoga menjadi motivasi bagi seluruh santri untuk senantiasa istiqamah bersama Al-Qur'an._`,
    ].join('\n');

    navigator.clipboard.writeText(lines);
    setCopiedWaReport(true);
    setTimeout(() => setCopiedWaReport(false), 2000);
    onShowFeedback('Teks apresiasi Hafalan Tercepat berhasil disalin untuk WhatsApp!');
  };

  // ============================================================================
  // STATE UNTUK OPERASI MASSAL & AUDIT DATABASE (BULK OPS)
  // ============================================================================
  const [bulkTargetScope, setBulkTargetScope] = useState<'all' | 'kelas' | 'kelompok'>('kelas');
  const [bulkTargetFilterId, setBulkTargetFilterId] = useState<string>(classes[0]?.id || '');
  const [bulkTargetJuzValue, setBulkTargetJuzValue] = useState<number>(15);
  const [isRunningBulkTarget, setIsRunningBulkTarget] = useState(false);

  const [transferSourceClassFilter, setTransferSourceClassFilter] = useState<string>('all');
  const [selectedTransferStudentIds, setSelectedTransferStudentIds] = useState<string[]>([]);
  const [transferTargetClassId, setTransferTargetClassId] = useState<string>('');
  const [transferTargetGroupId, setTransferTargetGroupId] = useState<string>('');
  const [isRunningTransfer, setIsRunningTransfer] = useState(false);
  const [isRunningIntegrity, setIsRunningIntegrity] = useState(false);

  const filteredTransferStudents = useMemo(() => {
    if (transferSourceClassFilter === 'all') return santriList;
    return santriList.filter(
      s => s.kelasId === transferSourceClassFilter || s.kelasNama === transferSourceClassFilter
    );
  }, [santriList, transferSourceClassFilter]);

  const handleExportMasterCsv = () => {
    const headers = [
      'ID Santri',
      'Nama Santri',
      'Gender',
      'Kelas',
      'Kelompok Halaqah',
      'Total Hafalan (Juz)',
      'Target (Juz)',
      'Capaian Pekan Ini (Lembar)',
      'Capaian Bulan Ini (Lembar)',
      'Kehadiran (%)',
      'Nama Wali Santri',
      'No. WA Wali',
    ];

    const rows = santriList.map(s => {
      const wStats = calculateStudentSetoranGrowth(s.id, s.hafalanList, attendanceHistory, {
        startDate: weekStartIso,
        endDate: weekEndIso,
      });
      const mStats = calculateStudentSetoranGrowth(s.id, s.hafalanList, attendanceHistory, {
        startDate: monthStartIso,
        endDate: monthEndIso,
      });
      return [
        s.id,
        `"${(s.nama || '').replace(/"/g, '""')}"`,
        s.gender,
        `"${(s.kelasNama || '').replace(/"/g, '""')}"`,
        `"${(s.kelompokNama || '').replace(/"/g, '""')}"`,
        s.totalJuzMemorized,
        s.targetJuz,
        wStats.growthLembar,
        mStats.growthLembar,
        s.kehadiranPersen,
        `"${(s.orangTuaNama || '-').replace(/"/g, '""')}"`,
        `"${s.orangTuaPhone || '-'}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rekap_Master_Santri_${todayIso}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onShowFeedback('Laporan Master Santri (.CSV / Excel) berhasil diunduh!');
  };

  if (mode === 'leaderboard') {
    return (
      <div className="space-y-6 animate-in fade-in duration-150">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <Rocket className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span>Kelola Target & Peringkat "5 Hafalan Tercepat" (Per Pekan & Per Bulan)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Atur standar target lembar hafalan baru per pekan maupun per bulan serta mode tampilan papan peringkat di seluruh akun.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl self-start sm:self-center">
              Tersinkron Real-time ke Semua Akun
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Konfigurasi Target (Kiri - 7 Kolom) */}
            <form onSubmit={handleSaveLeaderboardSettings} className="lg:col-span-7 space-y-5">
              {/* Pilihan Periode Default */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  1. Mode Periode Utama Papan "Hafalan Tercepat" di Dashboard
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDefaultPeriod('weekly');
                      setPreviewTab('weekly');
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      defaultPeriod === 'weekly'
                        ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-slate-900 dark:text-white ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm">📅 Per Pekan (Mingguan)</span>
                      {defaultPeriod === 'weekly' && (
                        <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Dihitung dari Senin s.d. Ahad pekan berjalan ({weekRangeLabel}). Cocok untuk pemantauan halaqah rutin.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDefaultPeriod('monthly');
                      setPreviewTab('monthly');
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      defaultPeriod === 'monthly'
                        ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-slate-900 dark:text-white ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm">🗓️ Per Bulan (Bulanan)</span>
                      {defaultPeriod === 'monthly' && (
                        <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Dihitung dari tanggal 1 s.d. akhir bulan berjalan ({monthRangeLabel}). Cocok untuk evaluasi rapor bulanan.
                    </p>
                  </button>
                </div>
              </div>

              {/* Opsi Beralih Tab bagi Pengguna */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div>
                  <label
                    htmlFor="allowSwitchPeriodToggle"
                    className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer block"
                  >
                    Izinkan Pengguna Beralih Tab "Per Pekan / Per Bulan" di Dashboard
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Jika dinonaktifkan, seluruh guru dan wali hanya melihat periode utama yang dipilih Super Admin di atas.
                  </span>
                </div>
                <input
                  id="allowSwitchPeriodToggle"
                  type="checkbox"
                  checked={allowUserSwitchPeriod}
                  onChange={e => setAllowUserSwitchPeriod(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 shrink-0 cursor-pointer"
                />
              </div>

              {/* Target Lembar Per Pekan & Per Bulan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Target Per Pekan */}
                <div className="p-4 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      2. Target Tercepat Per Pekan (Lembar)
                    </label>
                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">
                      = {Math.round(weeklyTargetLembar * 2)} Hal ({Number((weeklyTargetLembar / 10).toFixed(2))} Juz)
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    min={0.5}
                    max={30}
                    value={weeklyTargetLembar}
                    onChange={e => setWeeklyTargetLembar(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[1, 1.5, 2, 2.5, 3, 5].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setWeeklyTargetLembar(preset)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          weeklyTargetLembar === preset
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                        }`}
                      >
                        {preset} Lembar
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Per Bulan */}
                <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      3. Target Tercepat Per Bulan (Lembar)
                    </label>
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                      = {Math.round(monthlyTargetLembar * 2)} Hal ({Number((monthlyTargetLembar / 10).toFixed(2))} Juz)
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    min={1}
                    max={100}
                    value={monthlyTargetLembar}
                    onChange={e => setMonthlyTargetLembar(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[5, 7.5, 10, 12.5, 15, 20].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setMonthlyTargetLembar(preset)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          monthlyTargetLembar === preset
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                        }`}
                      >
                        {preset} Lembar
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pengaturan Tambahan Papan Peringkat */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah Santri Ditampilkan
                  </label>
                  <select
                    value={topCount}
                    onChange={e => setTopCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value={3}>Top 3 Santri Tercepat</option>
                    <option value={5}>Top 5 Santri Tercepat</option>
                    <option value={10}>Top 10 Santri Tercepat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Kehadiran Rajin (%)
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={minAttendanceTargetPct}
                    onChange={e => setMinAttendanceTargetPct(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Label Predikat Tercapai
                  </label>
                  <input
                    type="text"
                    value={achievementBadgeLabel}
                    onChange={e => setAchievementBadgeLabel(e.target.value)}
                    placeholder="Mumtaz Progresif"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={isSavingLeaderboardCfg}
                  className="py-2.5 px-6 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isSavingLeaderboardCfg
                      ? 'Menyimpan & Menyinkronkan...'
                      : 'Simpan & Sinkronkan Target ke Semua Akun'}
                  </span>
                </button>
              </div>
            </form>

            {/* Live Preview & Siaran Apresiasi (Kanan - 5 Kolom) */}
            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                      Pratinjau Langsung Peringkat
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {topCount} Hafalan Tercepat ({previewTab === 'monthly' ? 'Bulan Ini' : 'Pekan Ini'})
                    </h4>
                  </div>

                  <div className="inline-flex p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('weekly')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        previewTab === 'weekly'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Pekan Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('monthly')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        previewTab === 'monthly'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Bulan Ini
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200/70 dark:border-slate-800">
                  <span>
                    Periode: <strong>{previewTab === 'monthly' ? monthRangeLabel : weekRangeLabel}</strong>
                  </span>
                  <span>
                    Target: <strong>{activePreviewTarget} Lembar</strong>
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  {activePreviewList.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Belum ada setoran hafalan baru tercatat pada periode ini.
                    </div>
                  ) : (
                    activePreviewList.map((student, idx) => {
                      const pct = Math.min(
                        100,
                        Math.round((student.realtimeLembar / Math.max(0.5, activePreviewTarget)) * 100)
                      );
                      const achieved = student.realtimeLembar >= activePreviewTarget;
                      return (
                        <div
                          key={student.id}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex items-center gap-2.5"
                        >
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              idx === 0
                                ? 'bg-amber-500 text-slate-950'
                                : idx === 1
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-900 dark:text-white truncate">
                                {student.nama}
                              </span>
                              <span
                                className={`font-bold tabular-nums shrink-0 ${
                                  achieved
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-blue-600 dark:text-blue-400'
                                }`}
                              >
                                +{student.realtimeLembar} Lembar ({pct}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full rounded-full ${
                                  achieved ? 'bg-emerald-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.max(8, pct)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Aksi Cepat Apresiasi Super Admin */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Tindakan Cepat Apresiasi Super Admin:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleBroadcastTopFastest}
                    className="py-2 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Megaphone className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                    <span>Siarkan ke Pengumuman Atas</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyWhatsappLeaderboard}
                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedWaReport ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWaReport ? 'Tersalin!' : 'Salin Apresiasi WA'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MODE: OPERASI MASSAL & ALAT SUPER ADMIN (BULK OPS)
  // ============================================================================
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Penyesuaian Target Juz Massal */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Penetapan Target Juz Massal (Bulk Target Juz)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ubah target total hafalan Juz seluruh santri dalam satu kelas atau satu kelompok halaqah sekaligus.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cakupan Santri
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'kelas' as const, label: 'Per Rombel Kelas' },
                  { id: 'kelompok' as const, label: 'Per Halaqah' },
                  { id: 'all' as const, label: 'Seluruh Santri' },
                ].map(sc => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      setBulkTargetScope(sc.id);
                      if (sc.id === 'kelas') setBulkTargetFilterId(classes[0]?.id || '');
                      if (sc.id === 'kelompok') setBulkTargetFilterId(groups[0]?.id || '');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      bulkTargetScope === sc.id
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            </div>

            {bulkTargetScope === 'kelas' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Rombel Kelas
                </label>
                <select
                  value={bulkTargetFilterId}
                  onChange={e => setBulkTargetFilterId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nama} ({c.tingkat})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {bulkTargetScope === 'kelompok' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Kelompok Halaqah
                </label>
                <select
                  value={bulkTargetFilterId}
                  onChange={e => setBulkTargetFilterId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none"
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.nama} (Musyrif: {g.pengajar})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Hafalan Baru (Juz)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={bulkTargetJuzValue}
                  onChange={e => setBulkTargetJuzValue(Number(e.target.value))}
                  className="w-28 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none"
                />
                <div className="flex flex-wrap gap-1.5">
                  {[5, 10, 15, 20, 30].map(j => (
                    <button
                      key={j}
                      type="button"
                      onClick={() => setBulkTargetJuzValue(j)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                        bulkTargetJuzValue === j
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {j} Juz
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isRunningBulkTarget}
              onClick={async () => {
                setIsRunningBulkTarget(true);
                try {
                  const res = await bulkUpdateSantriTarget(
                    bulkTargetScope,
                    bulkTargetFilterId,
                    bulkTargetJuzValue
                  );
                  onShowFeedback(res.message);
                } finally {
                  setIsRunningBulkTarget(false);
                }
              }}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
            >
              {isRunningBulkTarget
                ? 'Memperbarui Target Santri...'
                : `Terapkan Target ${bulkTargetJuzValue} Juz Secara Massal`}
            </button>
          </div>
        </div>

        {/* Card 2: Audit Integritas Database & Ekspor Master CSV */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Audit Integritas Database & Ekspor Master Excel (.CSV)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Selaraskan ulang relasi nama kelas, kelompok halaqah, dan persentase kehadiran santri secara otomatis.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                <span className="text-slate-400 block text-[11px]">Total Santri Terindeks</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {santriList.length} Santri
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                <span className="text-slate-400 block text-[11px]">Total Rekaman Presensi</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {attendanceHistory.length} Sesi
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              disabled={isRunningIntegrity}
              onClick={async () => {
                setIsRunningIntegrity(true);
                try {
                  const res = await recalculateDatabaseIntegrity();
                  onShowFeedback(res.message);
                } finally {
                  setIsRunningIntegrity(false);
                }
              }}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningIntegrity ? 'animate-spin' : ''}`} />
              <span>
                {isRunningIntegrity
                  ? 'Menyinkronkan Integritas...'
                  : 'Jalankan Audit & Sinkronisasi Integritas Database'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleExportMasterCsv}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Rekap Master Seluruh Santri (.CSV / Excel)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Card 3: Mutasi / Kenaikan Kelas & Rotasi Halaqah Massal */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Mutasi Kenaikan Kelas & Rotasi Halaqah Massal</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pilih beberapa santri sekaligus untuk dipindahkan ke Rombel Kelas baru dan/atau Kelompok Halaqah baru.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={transferSourceClassFilter}
              onChange={e => {
                setTransferSourceClassFilter(e.target.value);
                setSelectedTransferStudentIds([]);
              }}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="all">Semua Kelas ({santriList.length} Santri)</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  Filter Kelas: {c.nama}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                if (selectedTransferStudentIds.length === filteredTransferStudents.length) {
                  setSelectedTransferStudentIds([]);
                } else {
                  setSelectedTransferStudentIds(filteredTransferStudents.map(s => s.id));
                }
              }}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
            >
              {selectedTransferStudentIds.length === filteredTransferStudents.length &&
              filteredTransferStudents.length > 0
                ? 'Batal Pilih Semua'
                : 'Pilih Semua'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
          {filteredTransferStudents.map(s => {
            const checked = selectedTransferStudentIds.includes(s.id);
            return (
              <label
                key={s.id}
                className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 cursor-pointer transition-all ${
                  checked
                    ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    setSelectedTransferStudentIds(prev =>
                      prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                    );
                  }}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div className="min-w-0">
                  <div className="text-slate-900 dark:text-white truncate">{s.nama}</div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {s.kelasNama} · {s.kelompokNama}
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kelas Tujuan Baru (Opsional)
            </label>
            <select
              value={transferTargetClassId}
              onChange={e => setTransferTargetClassId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none"
            >
              <option value="">-- Tetap di Kelas Saat Ini --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  Pindah ke: {c.nama} ({c.tingkat})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Halaqah Tujuan Baru (Opsional)
            </label>
            <select
              value={transferTargetGroupId}
              onChange={e => setTransferTargetGroupId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none"
            >
              <option value="">-- Tetap di Halaqah Saat Ini --</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  Pindah ke: {g.nama} ({g.pengajar})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={
              isRunningTransfer ||
              selectedTransferStudentIds.length === 0 ||
              (!transferTargetClassId && !transferTargetGroupId)
            }
            onClick={async () => {
              setIsRunningTransfer(true);
              try {
                const res = await bulkTransferSantri(
                  selectedTransferStudentIds,
                  transferTargetClassId || undefined,
                  transferTargetGroupId || undefined
                );
                onShowFeedback(res.message);
                setSelectedTransferStudentIds([]);
              } finally {
                setIsRunningTransfer(false);
              }
            }}
            className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            {isRunningTransfer
              ? 'Memindahkan...'
              : `Mutasi ${selectedTransferStudentIds.length} Santri Terpilih`}
          </button>
        </div>
      </div>
    </div>
  );
};
