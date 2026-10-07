import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  MessageCircle,
  FileText,
  Target,
  HeartHandshake
} from 'lucide-react';
import { Santri, HafalanEntry } from '../types';
import { useTahfidz } from '../context/TahfidzContext';
import { parseHafalan } from '../utils/hafalanFormat';
import { calculateStudentSetoranGrowth } from '../utils/growthCalculator';
import {
  getTodayWIB,
  shiftDateString,
  getCurrentYearMonthWIB,
  formatDateIsoId
} from '../utils/dateWIB';
import { usePersistedState } from '../utils/usePersistedState';

interface RangkumanBulananModalProps {
  student: Santri;
  isOpen: boolean;
  onClose: () => void;
}

interface StructuredMonthlyReport {
  predikatBulanIni: string;
  ringkasanUtama: string;
  poinCapaian: {
    judul: string;
    isi: string;
  }[];
  rekomendasiBulanDepan: string[];
  doaMotivasi: string;
  whatsappText: string;
}

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

export const RangkumanBulananModal: React.FC<RangkumanBulananModalProps> = ({
  student,
  isOpen,
  onClose
}) => {
  const { santriList, attendanceHistory, currentUser } = useTahfidz();
  const isParent = currentUser?.role === 'parent';

  const liveStudent = useMemo(
    () => santriList.find(s => s.id === student.id) || student,
    [santriList, student]
  );

  const todayIso = getTodayWIB();
  const currentYM = getCurrentYearMonthWIB();

  const [selectedPeriod, setSelectedPeriod] = usePersistedState<string>('tahfidz_filter_rangkuman_period', 'rolling_30');
  const [summaryStyle, setSummaryStyle] = usePersistedState<'ringkas' | 'wali' | 'evaluasi'>(
    'tahfidz_filter_rangkuman_style',
    () => (isParent ? 'wali' : 'ringkas')
  );
  const effectiveStyle: 'ringkas' | 'wali' | 'evaluasi' = isParent ? 'wali' : summaryStyle;
  const [report, setReport] = useState<StructuredMonthlyReport | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Pilihan periode 1 bulan
  const monthOptions = useMemo(() => {
    const opts: { value: string; label: string; startDate: string; endDate: string }[] = [];
    const start30 = shiftDateString(todayIso, -29);
    opts.push({
      value: 'rolling_30',
      label: `1 Bulan Terakhir (${formatDateIsoId(start30)} – ${formatDateIsoId(todayIso)})`,
      startDate: start30,
      endDate: todayIso
    });

    for (let offset = 0; offset < 6; offset++) {
      let mIdx = currentYM.monthIndex - offset;
      let yr = currentYM.year;
      while (mIdx < 0) {
        mIdx += 12;
        yr -= 1;
      }
      const mm = String(mIdx + 1).padStart(2, '0');
      const lastDay = new Date(Date.UTC(yr, mIdx + 1, 0)).getUTCDate();
      const startDate = `${yr}-${mm}-01`;
      const endDate = `${yr}-${mm}-${String(lastDay).padStart(2, '0')}`;
      opts.push({
        value: `${yr}-${mm}`,
        label: `Bulan ${MONTH_NAMES[mIdx]} ${yr}`,
        startDate,
        endDate
      });
    }
    return opts;
  }, [todayIso, currentYM.monthIndex, currentYM.year]);

  const activePeriodObj = useMemo(
    () => monthOptions.find(o => o.value === selectedPeriod) || monthOptions[0],
    [monthOptions, selectedPeriod]
  );

  // Hitung statistik capaian 1 bulan
  const monthlyData = useMemo(() => {
    const { startDate, endDate, label: periodLabel } = activePeriodObj;
    const breakdown = parseHafalan(liveStudent.totalJuzMemorized);
    const targetJuz = liveStudent.targetJuz || 30;
    const progressPct = Math.min(100, Math.round((breakdown.decimalJuz / targetJuz) * 100));

    const seenIds = new Set<string>();
    const deposits: HafalanEntry[] = [];

    (liveStudent.hafalanList || []).forEach(h => {
      if (!h.tanggal || h.tanggal < startDate || h.tanggal > endDate) return;
      if (h.category === 'juz' && h.id.startsWith('h-juz-')) return;
      seenIds.add(h.id);
      deposits.push(h);
    });

    (attendanceHistory || []).forEach(att => {
      if (att.studentId !== liveStudent.id || !att.hafalanDeposit) return;
      const depDate = att.hafalanDeposit.tanggal || att.tanggal || '';
      if (depDate < startDate || depDate > endDate) return;
      const depId = att.hafalanDeposit.id || `att-dep-${att.id}`;
      const mirrorId = `h-dep-${att.id}`;
      if (seenIds.has(depId) || seenIds.has(mirrorId)) return;
      seenIds.add(depId);
      deposits.push({
        ...att.hafalanDeposit,
        tanggal: depDate
      });
    });

    deposits.sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));

    const baruCount = deposits.filter(d => d.type === 'baru').length;
    const murojaCount = deposits.filter(d => d.type === 'muroja').length;
    const perbaikanCount = deposits.filter(d => d.type === 'perbaikan').length;

    const growth = calculateStudentSetoranGrowth(
      liveStudent.id,
      liveStudent.hafalanList,
      attendanceHistory,
      { startDate, endDate }
    );

    const qCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    deposits.forEach(d => {
      if (d.kualitas && qCounts[d.kualitas] !== undefined) {
        qCounts[d.kualitas] += 1;
      }
    });
    const qualityLabels: Record<string, string> = {
      A: 'A (Mumtaz / Sangat Baik)',
      B: 'B (Jayyid Jiddan / Baik)',
      C: 'C (Jayyid / Cukup)',
      D: 'D (Maqbul / Perlu Perbaikan)'
    };
    let topQ = 'A';
    let maxQ = -1;
    (['A', 'B', 'C', 'D'] as const).forEach(q => {
      if (qCounts[q] > maxQ) {
        maxQ = qCounts[q];
        topQ = q;
      }
    });
    const dominantQuality = deposits.length > 0 ? qualityLabels[topQ] : 'A (Mumtaz)';

    const attRecords = (attendanceHistory || []).filter(
      a => a.studentId === liveStudent.id && a.tanggal >= startDate && a.tanggal <= endDate
    );
    const onTimeCount = attRecords.filter(a => a.status === 'hadir_tepat').length;
    const lateCount = attRecords.filter(a => a.status === 'hadir_terlambat').length;
    const absentCount = attRecords.filter(a => a.status === 'tidak_hadir').length;
    const presentCount = onTimeCount + lateCount;
    const totalAttendanceSessions = attRecords.length;
    const attendancePct =
      totalAttendanceSessions > 0
        ? Math.round(((onTimeCount * 1.0 + lateCount * 0.8) / totalAttendanceSessions) * 100)
        : liveStudent.kehadiranPersen || 100;

    const depositItems = deposits.map(d => ({
      tanggal: d.tanggal,
      tanggalFormatted: formatDateIsoId(d.tanggal, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      type: d.type,
      juz: d.juz,
      surahName: d.surahName,
      ayatText: d.ayatMulai
        ? `Ayat ${d.ayatMulai}${d.ayatSelesai ? `-${d.ayatSelesai}` : ''}`
        : '',
      kualitas: d.kualitas,
      catatan: d.catatan
    }));

    const behaviorList = attRecords
      .map(a => a.catatanPerilaku)
      .filter((c): c is string => Boolean(c && c.trim()));
    const behaviorNotes =
      behaviorList.length > 0
        ? Array.from(new Set(behaviorList)).join(', ')
        : 'Tertib, fokus, dan menjaga adab dengan baik selama halaqah';

    const inProgressInfo = liveStudent.inProgressJuz
      ? `Juz ${liveStudent.inProgressJuz.juzNumber} Lembar ke-${liveStudent.inProgressJuz.lembar}${
          liveStudent.inProgressJuz.surahSedangDihafal
            ? ` (${liveStudent.inProgressJuz.surahSedangDihafal})`
            : ''
        }`
      : '';

    const lastDepositInfo = liveStudent.terakhirSetor
      ? `Juz ${liveStudent.terakhirSetor.juz} · ${liveStudent.terakhirSetor.surah} (${
          liveStudent.terakhirSetor.ayat
        }) pada ${formatDateIsoId(liveStudent.terakhirSetor.tanggal, {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })}`
      : '';

    return {
      periodLabel,
      startDate,
      endDate,
      breakdown,
      targetJuz,
      progressPct,
      deposits,
      depositItems,
      totalSetoran: deposits.length,
      baruCount,
      murojaCount,
      perbaikanCount,
      newLembar: growth.growthLembar,
      newPages: growth.growthPages,
      dominantQuality,
      topQ,
      attendancePct,
      presentCount,
      onTimeCount,
      lateCount,
      absentCount,
      totalAttendanceSessions,
      behaviorNotes,
      inProgressInfo,
      lastDepositInfo
    };
  }, [activePeriodObj, liveStudent, attendanceHistory]);

  // Fallback lokal terstruktur apabila request gagal
  const buildLocalStructuredReport = useCallback((): StructuredMonthlyReport => {
    const {
      periodLabel,
      breakdown,
      targetJuz,
      progressPct,
      totalSetoran,
      baruCount,
      murojaCount,
      perbaikanCount,
      newLembar,
      newPages,
      dominantQuality,
      attendancePct,
      presentCount,
      totalAttendanceSessions,
      behaviorNotes,
      depositItems,
      lastDepositInfo
    } = monthlyData;

    const surahBaruList = Array.from(
      new Set(
        depositItems
          .filter(i => i.type === 'baru')
          .map(i => `${i.surahName}${i.ayatText ? ` (${i.ayatText})` : ''}`)
      )
    )
      .slice(0, 3)
      .join(', ');

    const surahMurojaList = Array.from(
      new Set(
        depositItems
          .filter(i => i.type !== 'baru')
          .map(i => `${i.surahName}${i.ayatText ? ` (${i.ayatText})` : ''}`)
      )
    )
      .slice(0, 3)
      .join(', ');

    const predikatBulanIni =
      newLembar >= 2.5
        ? 'Mumtaz & Sangat Progresif'
        : totalSetoran > 0
        ? 'Istiqamah & Terjaga'
        : 'Perlu Pendampingan Setoran';

    const ringkasanUtama =
      effectiveStyle === 'wali'
        ? totalSetoran > 0
          ? `Alhamdulillah, perkembangan hafalan ananda ${liveStudent.nama} (${liveStudent.kelasNama} · ${liveStudent.kelompokNama}) selama ${periodLabel} berjalan dengan baik. Ananda berhasil menyelesaikan ${totalSetoran} kali setoran dengan tambahan hafalan baru +${newLembar} Lembar (${newPages} Halaman penuh) sehingga total hafalan kini mencapai ${breakdown.decimalText} Juz (${progressPct}% dari target ${targetJuz} Juz).`
          : `Assalamu'alaikum Ayah/Bunda, pada periode ${periodLabel} belum terdapat catatan setoran baru yang terinput untuk ananda ${liveStudent.nama}. Total hafalan ananda saat ini berada di ${breakdown.decimalText} Juz (${breakdown.lembarText}) atau ${progressPct}% dari target ${targetJuz} Juz.`
        : totalSetoran > 0
        ? `Selama ${periodLabel}, ${liveStudent.nama} menyelesaikan ${totalSetoran} kali setoran dan menambah +${newLembar} Lembar (${newPages} Halaman penuh) hafalan baru. Total capaian saat ini: ${breakdown.decimalText} Juz (${breakdown.lembarText}) atau ${progressPct}% dari target ${targetJuz} Juz.`
        : `Selama ${periodLabel}, belum ada riwayat setoran yang tercatat untuk ${liveStudent.nama}. Total capaian saat ini: ${breakdown.decimalText} Juz (${breakdown.lembarText}) dari target ${targetJuz} Juz (${progressPct}%).`;

    const sapaan = effectiveStyle === 'wali' ? `ananda ${liveStudent.nama}` : liveStudent.nama;
    const poinCapaian = [
      {
        judul: 'Capaian Hafalan Baru (Sabaq)',
        isi:
          baruCount > 0
            ? `${effectiveStyle === 'wali' ? `Alhamdulillah ${sapaan} berhasil menambah` : 'Bertambah'} +${newLembar} Lembar (${newPages} Halaman) dari ${baruCount}x setoran baru${
                surahBaruList ? ` pada materi: ${surahBaruList}` : ''
              }.`
            : lastDepositInfo
            ? `Belum ada penambahan halaman baru pada periode ini. Setoran terakhir: ${lastDepositInfo}.`
            : 'Belum ada setoran hafalan baru pada periode ini.'
      },
      {
        judul: "Pengulangan (Muroja'ah) & Kualitas Bacaan",
        isi:
          murojaCount > 0 || perbaikanCount > 0
            ? `Tercatat ${murojaCount}x Muroja'ah${
                perbaikanCount > 0 ? ` dan ${perbaikanCount}x Perbaikan` : ''
              }${surahMurojaList ? ` (${surahMurojaList})` : ''} dengan predikat kualitas ${dominantQuality}.`
            : `Predikat rata-rata bacaan adalah ${dominantQuality}. Perlu menambah frekuensi muroja'ah rutin agar hafalan tetap mutqin.`
      },
      {
        judul: 'Kehadiran & Adab di Halaqah',
        isi:
          totalAttendanceSessions > 0
            ? `Kehadiran ${attendancePct}% (${presentCount}/${totalAttendanceSessions} sesi). Adab & sikap: ${behaviorNotes}.`
            : `Tingkat kehadiran rata-rata ${attendancePct}%. Adab & sikap: ${behaviorNotes}.`
      }
    ];

    const sisaJuz = Math.max(0, Number((targetJuz - breakdown.decimalJuz).toFixed(2)));
    const rekomendasiBulanDepan =
      effectiveStyle === 'wali'
        ? [
            'Mohon dukungan Ayah/Bunda di rumah untuk menyimak bacaan ananda agar dapat mencapai target minimal 1 halaman penuh setiap sesi.',
            "Mendampingi ananda melakukan muroja'ah sekitar 10–15 menit bada Maghrib atau Subuh bersama keluarga.",
            sisaJuz > 0
              ? `Menjaga semangat dan keistiqamahan ananda untuk menuntaskan sisa ${sisaJuz} Juz menuju target ${targetJuz} Juz.`
              : `Alhamdulillah target ${targetJuz} Juz telah tercapai! Mohon doa dan dukungan untuk persiapan Tasmi' bil-ghoib ananda.`
          ]
        : [
            'Pertahankan target setoran hafalan baru minimal 1 halaman penuh (0.5 Lembar) setiap sesi.',
            "Rutin mengulang (muroja'ah) hafalan lama sebelum menambah ayat baru.",
            sisaJuz > 0
              ? `Fokus menuntaskan sisa ${sisaJuz} Juz lagi menuju target ${targetJuz} Juz.`
              : `Fokus pemantapan mutqin bil-ghoib untuk seluruh ${targetJuz} Juz.`
          ];

    const doaMotivasi =
      effectiveStyle === 'wali'
        ? `Jazakumullahu khairan katsiran kepada Ayah/Bunda atas kerja sama dan doanya. Semoga Allah SWT senantiasa memudahkan ananda ${liveStudent.nama} menjadi Hafidz/Hafidzah yang berakhlak mulia.`
        : `Semoga Allah SWT memudahkan lisan dan hati ${liveStudent.nama} dalam menghafal serta menjaga Al-Qur'an.`;

    const whatsappText = [
      `*LAPORAN RANGKUMAN HAFALAN 1 BULAN*`,
      `• *Nama Santri:* ${liveStudent.nama} (${liveStudent.kelasNama} · ${liveStudent.kelompokNama})`,
      `• *Periode:* ${periodLabel}`,
      `• *Status Evaluasi:* ${predikatBulanIni}`,
      `• *Total Hafalan:* ${breakdown.decimalText} / ${targetJuz} Juz (${progressPct}%)`,
      ``,
      `*Ringkasan:*`,
      ringkasanUtama,
      ``,
      `*Poin Evaluasi 1 Bulan:*`,
      ...poinCapaian.map(p => `• *${p.judul}:* ${p.isi}`),
      ``,
      `*Fokus & Saran Bulan Depan:*`,
      ...rekomendasiBulanDepan.map(r => `• ${r}`),
      ``,
      `_${doaMotivasi}_`
    ].join('\n');

    return {
      predikatBulanIni,
      ringkasanUtama,
      poinCapaian,
      rekomendasiBulanDepan,
      doaMotivasi,
      whatsappText
    };
  }, [monthlyData, liveStudent, effectiveStyle]);

  // Panggil generator server
  const generateAiSummary = useCallback(async () => {
    setIsLoadingAi(true);

    try {
      const response = await fetch('/api/gemini/monthly-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style: effectiveStyle,
          studentName: liveStudent.nama,
          kelasNama: liveStudent.kelasNama,
          kelompokNama: liveStudent.kelompokNama,
          gender: liveStudent.gender,
          periodLabel: monthlyData.periodLabel,
          totalJuzMemorized: monthlyData.breakdown.decimalText,
          lembarText: monthlyData.breakdown.lembarText,
          targetJuz: monthlyData.targetJuz,
          progressPct: monthlyData.progressPct,
          inProgressInfo: monthlyData.inProgressInfo,
          lastDepositInfo: monthlyData.lastDepositInfo,
          monthlyStats: {
            totalSetoran: monthlyData.totalSetoran,
            baruCount: monthlyData.baruCount,
            murojaCount: monthlyData.murojaCount,
            perbaikanCount: monthlyData.perbaikanCount,
            newLembar: monthlyData.newLembar,
            newPages: monthlyData.newPages,
            dominantQuality: monthlyData.dominantQuality,
            topQualityCode: monthlyData.topQ,
            attendancePct: monthlyData.attendancePct,
            presentCount: monthlyData.presentCount,
            onTimeCount: monthlyData.onTimeCount,
            lateCount: monthlyData.lateCount,
            absentCount: monthlyData.absentCount,
            totalAttendanceSessions: monthlyData.totalAttendanceSessions
          },
          depositItems: monthlyData.depositItems,
          behaviorNotes: monthlyData.behaviorNotes
        })
      });

      const data = await response.json();
      if (response.ok && data?.report && data.report.ringkasanUtama) {
        setReport(data.report);
      } else {
        setReport(buildLocalStructuredReport());
      }
    } catch {
      setReport(buildLocalStructuredReport());
    } finally {
      setIsLoadingAi(false);
    }
  }, [effectiveStyle, liveStudent, monthlyData, buildLocalStructuredReport]);

  useEffect(() => {
    if (isOpen) {
      generateAiSummary();
    }
  }, [isOpen, selectedPeriod, effectiveStyle, generateAiSummary]);

  if (!isOpen) return null;

  const activeReport = report || buildLocalStructuredReport();

  const handleCopySummary = () => {
    navigator.clipboard.writeText(activeReport.whatsappText.replace(/\*/g, '').replace(/_/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const rawPhone = (liveStudent.orangTuaPhone || '').replace(/\D/g, '');
    const waPhone = rawPhone.startsWith('0')
      ? `62${rawPhone.slice(1)}`
      : rawPhone.startsWith('62')
      ? rawPhone
      : '';
    const waUrl = waPhone
      ? `https://wa.me/${waPhone}?text=${encodeURIComponent(activeReport.whatsappText)}`
      : `https://wa.me/?text=${encodeURIComponent(activeReport.whatsappText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-4 py-3.5 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-amber-300 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base leading-tight truncate">
                Rangkuman Capaian 1 Bulan · {liveStudent.nama}
              </h3>
              <p className="text-[11px] text-emerald-100/90 truncate mt-0.5">
                {liveStudent.kelasNama} · {liveStudent.kelompokNama} · Generator Evaluasi Tahfidz
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bar Kontrol Generator: Pilihan Bulan, Gaya Bahasa & Tombol Generate */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="flex items-center gap-1.5 min-w-[180px] flex-1 sm:flex-initial">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <select
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {monthOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Pilihan Format Bahasa Rangkuman (Khusus Guru/Admin; Wali Santri otomatis Laporan Wali) */}
            {!isParent && (
              <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 dark:bg-slate-800 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setSummaryStyle('ringkas')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    summaryStyle === 'ringkas'
                      ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Poin Ringkas
                </button>
                <button
                  type="button"
                  onClick={() => setSummaryStyle('wali')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    summaryStyle === 'wali'
                      ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Laporan Wali
                </button>
                <button
                  type="button"
                  onClick={() => setSummaryStyle('evaluasi')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    summaryStyle === 'evaluasi'
                      ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Evaluasi Ustadz
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={generateAiSummary}
            disabled={isLoadingAi}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold transition-all cursor-pointer shrink-0 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAi ? 'animate-spin' : ''}`} />
            <span>{isLoadingAi ? 'Menyusun...' : 'Generate Ulang'}</span>
          </button>
        </div>

        {/* Body Content - Mudah Dibaca & Terstruktur */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* 4 Kartu Angka Utama */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/70">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                Hafalan Baru (1 Bln)
              </span>
              <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-400 tabular-nums block mt-0.5">
                +{monthlyData.newLembar} Lembar
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                {monthlyData.newPages} Halaman Penuh
              </span>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/70">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                Frekuensi Setoran
              </span>
              <span className="text-sm sm:text-base font-bold text-blue-700 dark:text-blue-400 tabular-nums block mt-0.5">
                {monthlyData.totalSetoran}x Setor
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                {monthlyData.baruCount} Baru · {monthlyData.murojaCount} Muroja'ah
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/70">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                Rata-Rata Kualitas
              </span>
              <span className="text-sm sm:text-base font-bold text-amber-700 dark:text-amber-400 block mt-0.5">
                Nilai {monthlyData.topQ}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                {monthlyData.topQ === 'A' ? 'Mumtaz (Sangat Baik)' : monthlyData.dominantQuality}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                Total Akumulasi
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums block mt-0.5">
                {monthlyData.breakdown.decimalText} / {monthlyData.targetJuz} Juz
              </span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block">
                {monthlyData.progressPct}% · Hadir {monthlyData.attendancePct}%
              </span>
            </div>
          </div>

          {isLoadingAi ? (
            <div className="py-10 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex flex-col items-center justify-center text-center space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Menyusun rangkuman capaian yang rapi & mudah dibaca...
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Menganalisis data setoran dan progres {liveStudent.nama}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Bagian 1: Ringkasan Utama & Status Evaluasi */}
              <div className="p-3.5 sm:p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/70 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 dark:from-slate-900 dark:via-slate-850 dark:to-emerald-950/30 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Ringkasan Utama Bulan Ini</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    Status: {activeReport.predikatBulanIni}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {activeReport.ringkasanUtama}
                </p>
              </div>

              {/* Bagian 2: 3 Poin Evaluasi Utama (Mudah Dipindai / Scannable) */}
              <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Poin Evaluasi Capaian 1 Bulan</span>
                </h4>

                <div className="grid grid-cols-1 gap-2">
                  {activeReport.poinCapaian.map((poin, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-2.5"
                    >
                      <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                          {poin.judul}
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                          {poin.isi}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bagian 3: Rekomendasi & Target Bulan Depan + Doa Motivasi */}
              <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Fokus & Rekomendasi Bulan Depan</span>
                </h4>

                <ul className="space-y-1.5">
                  {activeReport.rekomendasiBulanDepan.map((rek, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{rek}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-300 italic">
                  <HeartHandshake className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{activeReport.doaMotivasi}</span>
                </div>
              </div>
            </div>
          )}

          {/* Rincian Singkat Setoran dalam 1 Bulan */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Riwayat Setoran pada Periode Ini ({monthlyData.depositItems.length})</span>
              </span>
            </div>

            {monthlyData.depositItems.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500">
                Belum ada riwayat setoran yang tercatat pada periode {monthlyData.periodLabel}.
              </div>
            ) : (
              <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                {monthlyData.depositItems.map((dep, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block">
                        Juz {dep.juz} · {dep.surahName}
                        {dep.ayatText ? ` (${dep.ayatText})` : ''}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {dep.type === 'baru'
                          ? 'Hafalan Baru'
                          : dep.type === 'muroja'
                          ? "Muroja'ah"
                          : 'Perbaikan'}{' '}
                        · {dep.tanggalFormatted}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                      Nilai {dep.kualitas}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions: Salin, WhatsApp, Tutup */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              disabled={isLoadingAi}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Salin Rangkuman</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={isLoadingAi}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Kirim ke WhatsApp</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
