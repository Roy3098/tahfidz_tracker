import { HafalanEntry, AttendanceRecord } from '../types';
import {
  getSurahByNumber,
  resolveSurahMeta,
  getEffectiveSurahPages,
  getAyahCountForOnePage,
  SurahUtsmaniDetail
} from '../data/quranData';

export interface SetoranGrowthResult {
  growthLembar: number;          // Lembar yang telah genap diselesaikan (0, 0.5, 1, 1.5, 2, dst)
  growthPages: number;           // Halaman penuh yang telah diselesaikan (0, 1, 2, 3, dst)
  fractionalPages: number;       // Akumulasi halaman desimal (termasuk tabungan parsial)
  growthJuz: number;             // Juz yang bertambah (1 hal = 0.05 juz, 1 lembar = 0.1 juz)
  recentCount: number;           // Jumlah setoran hafalan baru
  absensiCount: number;          // Jumlah setoran hafalan baru dari absensi
  lastDepositInfo: string;       // Keterangan surah & ayat setoran terakhir
  lastDepositDate: string;       // Tanggal setoran baru terakhir (YYYY-MM-DD)
  lastDepositTimestamp: string;  // Timestamp setoran baru terakhir untuk urutan real-time
  isCurrentPagePartial: boolean; // True jika ada sisa/tabungan halaman yang belum genap 1 halaman penuh
  pendingFraction: number;       // Bagian halaman yang sedang berjalan menuju 1 halaman penuh (0 - 0.99)
}

/**
 * Menghitung cakupan halaman Mushaf Rasm Utsmani untuk 1 surah berdasarkan rentang ayat.
 * - Jika seluruh ayat dalam surah diselesaikan, hasilnya = effectivePages surah tersebut.
 * - Untuk surah >= 1 halaman, jumlah ayat setara 1 halaman penuh (getAyahCountForOnePage)
 *   menghasilkan tepat 1.0 halaman penuh (0.5 Lembar).
 * - Jika kurang dari 1 halaman penuh (misal setengah halaman), menghasilkan pecahan proporsional (< 1.0).
 */
export function calculateSingleSurahPageSpan(
  meta: SurahUtsmaniDetail,
  ayatMulai?: number,
  ayatSelesai?: number
): number {
  const effectivePages = getEffectiveSurahPages(meta);
  const startA = Math.max(1, Math.min(meta.totalAyahs, ayatMulai || 1));
  const endA = Math.max(startA, Math.min(meta.totalAyahs, ayatSelesai || meta.totalAyahs));
  const ayatCount = Math.max(1, endA - startA + 1);

  if (ayatCount >= meta.totalAyahs) {
    return effectivePages;
  }

  // Kasus khusus Mushaf Madinah: Al-Baqarah Ayat 1-5 adalah tepat Halaman 2 penuh (1 halaman)
  if (meta.number === 2 && startA === 1 && endA === 5) {
    return 1;
  }

  const exactRatio = (ayatCount * effectivePages) / meta.totalAyahs;

  if (effectivePages >= 1) {
    const ayahsPerOnePage = getAyahCountForOnePage(meta);
    const byStandardPage = ayatCount / ayahsPerOnePage;
    return Math.min(effectivePages, Math.max(exactRatio, byStandardPage));
  }

  return exactRatio;
}

/**
 * Menghitung jumlah halaman eksak dari satu entri setoran hafalan baru.
 */
export function calculateDepositPageSpan(h: Partial<HafalanEntry>): number {
  // Penanganan khusus untuk data sampel awal 'h-dep-2' yang bertipe 'juz' agar tidak mendominasi 20 halaman
  if (h.id === 'h-dep-2' && h.category === 'juz') {
    return 1; // Setara 1 halaman penuh (0.5 Lembar)
  }

  const startMeta = resolveSurahMeta(h.surahNumber, h.surahName, h.juz);

  // Cek apakah setoran mencakup lintas surah (Dari Surah ... Sampai Surah ...)
  let endMeta: SurahUtsmaniDetail | undefined;
  if (h.surahSampaiNumber) {
    endMeta = getSurahByNumber(h.surahSampaiNumber);
  } else if (h.surahSampaiName) {
    endMeta = resolveSurahMeta(undefined, h.surahSampaiName);
  } else if (h.surahName && /\s*(?:s\/d|-)\s*/i.test(h.surahName)) {
    const parts = h.surahName.split(/\s*(?:s\/d|-)\s*/i);
    if (parts.length > 1) {
      endMeta = resolveSurahMeta(undefined, parts[parts.length - 1]);
    }
  }

  if (startMeta && endMeta && endMeta.number > startMeta.number) {
    let totalSpan = 0;
    for (let sNum = startMeta.number; sNum <= endMeta.number; sNum++) {
      const sMeta = getSurahByNumber(sNum);
      if (!sMeta) continue;
      if (sNum === startMeta.number) {
        totalSpan += calculateSingleSurahPageSpan(sMeta, h.ayatMulai || 1, sMeta.totalAyahs);
      } else if (sNum === endMeta.number) {
        totalSpan += calculateSingleSurahPageSpan(sMeta, 1, h.ayatSelesai || sMeta.totalAyahs);
      } else {
        totalSpan += getEffectiveSurahPages(sMeta);
      }
    }
    return totalSpan;
  }

  if (startMeta) {
    return calculateSingleSurahPageSpan(startMeta, h.ayatMulai, h.ayatSelesai);
  }

  if (typeof h.halaman === 'number' && h.halaman > 0) {
    return h.halaman;
  }

  if (typeof h.lembar === 'number' && h.lembar > 0) {
    return h.lembar * 2;
  }

  return 1;
}

/**
 * Logika perhitungan 5 Hafalan Tercepat (Perkembangan Setoran Hafalan Baru):
 * 1. Sumber data murni dari Setoran Hafalan Baru (Sabaq) pada sesi Absensi yang hadir
 *    serta pencatatan setoran surah baru (mengabaikan data milestone juz statis/historis).
 * 2. Standar Mushaf Rasm Utsmani Madinah: 1 Lembar = 2 Halaman (1 Halaman = 0.5 Lembar).
 * 3. Progres Lembar HANYA bertambah apabila santri telah menyelesaikan minimal 1 halaman penuh.
 *    - Jika setoran pertama belum genap 1 halaman penuh (misal 0.5 halaman), progres masih 0 Lembar
 *      dan tersimpan sebagai tabungan halaman berjalan.
 *    - Ketika setoran berikutnya melengkapi hingga mencapai 1 halaman penuh (0.5 + 0.5 = 1.0 halaman),
 *      progres otomatis naik menjadi +0.5 Lembar (1 halaman penuh), dan seterusnya.
 */
export function calculateStudentSetoranGrowth(
  studentId: string,
  studentHafalanList: HafalanEntry[] = [],
  attendanceHistory: AttendanceRecord[] = [],
  dateRange?: { startDate: string; endDate: string }
): SetoranGrowthResult {
  interface EnrichedDeposit {
    entry: HafalanEntry;
    tanggal: string;
    timestamp: string;
    fromAbsensi: boolean;
  }

  const deposits: EnrichedDeposit[] = [];
  const existingIds = new Set<string>();

  // 1. Kumpulkan seluruh setoran hafalan baru dari riwayat absensi (hanya sesi yang hadir/terlambat)
  (attendanceHistory || []).forEach(a => {
    if (
      a.studentId === studentId &&
      a.status !== 'tidak_hadir' &&
      a.hafalanDeposit &&
      a.hafalanDeposit.type === 'baru'
    ) {
      const dep = a.hafalanDeposit;
      const depDate = dep.tanggal || a.tanggal || '';
      if (dateRange && (depDate < dateRange.startDate || depDate > dateRange.endDate)) {
        return;
      }
      const depId = dep.id || `att-dep-${a.id}`;
      if (!existingIds.has(depId)) {
        existingIds.add(depId);
        deposits.push({
          entry: dep,
          tanggal: depDate,
          timestamp: a.timestamp || depDate,
          fromAbsensi: true
        });
      }
    }
  });

  const absensiCount = deposits.length;

  // 2. Kumpulkan setoran surah baru yang diinput manual di halaman Hafalan
  // Abaikan:
  // - Entri 'h-dep-*' (mirror dari absensi, karena sudah diambil langsung dari attendanceHistory aktif)
  // - Entri 'h-juz-*' atau category === 'juz' (checklist capaian juz statis, bukan setoran sesi)
  // - Entri seed statis awal 'h-1-1' s/d 'h-10-9' (/^h-\d+-\d+$/) agar tidak menduplikasi total juz historis
  (studentHafalanList || []).forEach(h => {
    if (!h || h.type !== 'baru') return;
    if (h.category === 'juz') return;
    if (h.id.startsWith('h-dep-') || h.id.startsWith('h-juz-')) return;
    if (/^h-\d+-\d+$/.test(h.id)) return;
    const hDate = h.tanggal || '';
    if (dateRange && (hDate < dateRange.startDate || hDate > dateRange.endDate)) {
      return;
    }
    if (existingIds.has(h.id)) return;

    existingIds.add(h.id);
    deposits.push({
      entry: h,
      tanggal: hDate,
      timestamp: hDate,
      fromAbsensi: false
    });
  });

  // Urutkan kronologis dari terlama ke terbaru untuk menghitung akumulasi halaman secara berurutan
  deposits.sort((a, b) => {
    const dateCmp = (a.tanggal || '').localeCompare(b.tanggal || '');
    if (dateCmp !== 0) return dateCmp;
    return (a.timestamp || '').localeCompare(b.timestamp || '');
  });

  // Hitung akumulasi halaman dari setiap setoran baru
  let cumulativePages = 0;
  deposits.forEach(d => {
    const span = calculateDepositPageSpan(d.entry);
    cumulativePages += span;
  });

  // Halaman penuh yang telah genap diselesaikan (toleransi 0.05 untuk presisi pembagian pecahan ayat)
  const completedFullPages = Math.floor(cumulativePages + 0.05);

  // Konversi ke satuan LEMBAR (1 Halaman Penuh = 0.5 Lembar, 2 Halaman Penuh = 1 Lembar)
  const growthLembar = Number((completedFullPages * 0.5).toFixed(2));
  const growthJuz = Number((growthLembar * 0.1).toFixed(2));

  const rawPending = Math.max(0, cumulativePages - completedFullPages);
  const pendingFraction = rawPending < 0.95 ? Number(rawPending.toFixed(2)) : 0;
  const isCurrentPagePartial = pendingFraction >= 0.05;

  // Ambil setoran paling baru untuk info tampilan & pengurutan real-time
  const lastItem = deposits.length > 0 ? deposits[deposits.length - 1] : null;
  const lastDeposit = lastItem?.entry;
  const lastDepositInfo = lastDeposit
    ? `${lastDeposit.surahName || `Juz ${lastDeposit.juz}`}${
        lastDeposit.ayatMulai
          ? ` (Ayat ${lastDeposit.ayatMulai}${lastDeposit.ayatSelesai ? `-${lastDeposit.ayatSelesai}` : ''})`
          : ''
      }`
    : 'Belum setor baru';

  return {
    growthLembar,
    growthPages: completedFullPages,
    fractionalPages: Number(cumulativePages.toFixed(2)),
    growthJuz,
    recentCount: deposits.length,
    absensiCount,
    lastDepositInfo,
    lastDepositDate: lastItem?.tanggal || '',
    lastDepositTimestamp: lastItem?.timestamp || '',
    isCurrentPagePartial,
    pendingFraction
  };
}
