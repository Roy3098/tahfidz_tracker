import { HafalanEntry, AttendanceRecord } from '../types';
import { getSurahByNumber } from '../data/quranData';

export interface SetoranGrowthResult {
  growthLembar: number;      // Lembar yang telah genap diselesaikan (e.g. 0.5, 1, 1.5, 2)
  growthPages: number;       // Halaman full yang diselesaikan (e.g. 1, 2, 3)
  fractionalPages: number;   // Akumulasi halaman desimal (sebelum di-floor)
  growthJuz: number;         // Juz yang bertambah (1 hal = 0.05 juz, 1 lembar = 0.1 juz)
  recentCount: number;       // Jumlah setoran baru
  absensiCount: number;      // Jumlah setoran baru dari absensi
  lastDepositInfo: string;   // Keterangan setoran terakhir
  isCurrentPagePartial: boolean; // True jika ada sisa halaman yang belum genap
  pendingFraction: number;   // Bagian halaman yang masih belum genap (0 - 0.99)
}

/**
 * Logika perhitungan perkembangan setoran baru:
 * - Progres naik per halaman penuh Mushaf Rasm Utsmani Madinah (1 Lembar = 2 Halaman).
 * - Progres HANYA bertambah jika santri telah menyelesaikan 1 halaman penuh.
 * - Jika setoran pertama belum genap 1 halaman, progres belum bertambah (0 lembar).
 * - Ketika setoran kedua melengkapi hingga mencapai 1 halaman penuh (atau lebih),
 *   progres bertambah sesuai jumlah halaman penuh yang terselesaikan.
 * - Yang ditampilkan di antarmuka tetap dalam satuan LEMBAR (1 Halaman = 0.5 Lembar, 2 Halaman = 1 Lembar, dst).
 */
export function calculateStudentSetoranGrowth(
  studentId: string,
  studentHafalanList: HafalanEntry[] = [],
  attendanceHistory: AttendanceRecord[] = []
): SetoranGrowthResult {
  // 1. Kumpulkan seluruh setoran baru dari riwayat absensi
  const absensiSetoranBaru = attendanceHistory
    .filter(a => a.studentId === studentId && a.hafalanDeposit && a.hafalanDeposit.type === 'baru')
    .map(a => a.hafalanDeposit!);

  // 2. Kumpulkan juga setoran baru dari student.hafalanList (deduplikasi berdasarkan id)
  const existingIds = new Set(absensiSetoranBaru.map(d => d.id));
  const allSetoranBaru = [...absensiSetoranBaru];

  (studentHafalanList || []).forEach(h => {
    if (h.type === 'baru' && !existingIds.has(h.id)) {
      allSetoranBaru.push(h);
      existingIds.add(h.id);
    }
  });

  // Urutkan kronologis dari setoran terlama ke terbaru untuk akumulasi progres
  allSetoranBaru.sort((a, b) => (a.tanggal || '').localeCompare(b.tanggal || ''));

  // Hitung akumulasi halaman rill dari setiap setoran baru
  let cumulativePages = 0;
  allSetoranBaru.forEach(h => {
    if (h.category === 'juz') {
      cumulativePages += 20; // 1 juz = 20 halaman
    } else if (h.surahNumber) {
      const meta = getSurahByNumber(h.surahNumber);
      if (meta) {
        const totalPages = Math.max(1, meta.endPage - meta.startPage + 1);
        const startA = Math.max(1, h.ayatMulai || 1);
        const endA = Math.max(startA, h.ayatSelesai || meta.totalAyahs);
        const ayatCount = Math.max(1, endA - startA + 1);
        
        // Proporsi halaman berdasarkan jumlah ayat terhadap total halaman surah
        const pageSpan = (ayatCount * totalPages) / meta.totalAyahs;
        cumulativePages += pageSpan;
      } else if (typeof h.halaman === 'number' && h.halaman > 0) {
        cumulativePages += h.halaman;
      } else if (typeof h.lembar === 'number' && h.lembar > 0) {
        cumulativePages += h.lembar * 2;
      } else {
        cumulativePages += 1;
      }
    } else if (typeof h.halaman === 'number' && h.halaman > 0) {
      cumulativePages += h.halaman;
    } else if (typeof h.lembar === 'number' && h.lembar > 0) {
      cumulativePages += h.lembar * 2;
    } else {
      cumulativePages += 1;
    }
  });

  // Halaman full yang telah selesai:
  const completedFullPages = Math.floor(cumulativePages);

  // Yang ditampilkan tetap dalam satuan LEMBAR:
  // 1 Halaman = 0.5 Lembar, 2 Halaman = 1 Lembar, 3 Halaman = 1.5 Lembar, dst
  const growthLembar = completedFullPages * 0.5;
  const growthJuz = Number((growthLembar * 0.1).toFixed(2));
  
  const pendingFraction = Number((cumulativePages - completedFullPages).toFixed(2));
  const isCurrentPagePartial = pendingFraction > 0.05;

  // Keterangan setoran terakhir
  const lastDeposit = allSetoranBaru[allSetoranBaru.length - 1];
  const lastDepositInfo = lastDeposit 
    ? `${lastDeposit.surahName || `Juz ${lastDeposit.juz}`}${lastDeposit.ayatMulai ? ` (Ayat ${lastDeposit.ayatMulai}-${lastDeposit.ayatSelesai || ''})` : ''}`
    : 'Belum setor baru';

  return {
    growthLembar,
    growthPages: completedFullPages,
    fractionalPages: cumulativePages,
    growthJuz,
    recentCount: allSetoranBaru.length,
    absensiCount: absensiSetoranBaru.length,
    lastDepositInfo,
    isCurrentPagePartial,
    pendingFraction
  };
}
