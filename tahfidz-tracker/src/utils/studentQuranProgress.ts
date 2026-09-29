import { ALL_SURAHS, JUZ_MAPPING, getSurahByNumber, getSurahsForJuz } from '../data/quranData';
import { Santri, HafalanEntry } from '../types';
import { parseHafalan } from './hafalanFormat';

export interface MemorizedJuzInfo {
  juzNumber: number;
  name: string;
  status: 'lengkap' | 'sedang' | 'belum';
  lembar?: number;
  halaman?: number;
  surahs: {
    number: number;
    name: string;
    arabicName: string;
    totalAyahs: number;
  }[];
  entries: HafalanEntry[];
}

export interface MemorizedSurahInfo {
  number: number;
  name: string;
  arabicName: string;
  totalAyahs: number;
  revelation: 'Makkiyah' | 'Madaniyah';
  juzNumbers: number[];
  status: 'lengkap' | 'sebagian';
  ayatDetail?: string;
  lastDate?: string;
}

export interface StudentQuranProgress {
  completedJuzNumbers: number[];
  inProgressJuz?: {
    juzNumber: number;
    lembar: number;
    halaman: number;
  };
  all30Juz: MemorizedJuzInfo[];
  memorizedSurahs: MemorizedSurahInfo[];
  juzSummaryText: string;
  surahSummaryText: string;
  totalCompletedJuzCount: number;
  totalMemorizedSurahsCount: number;
}

// Inverted index: Surah to Juz
export const SURAH_TO_JUZ_MAP: Record<number, number[]> = {};
for (const [juzStr, data] of Object.entries(JUZ_MAPPING)) {
  const jNum = parseInt(juzStr, 10);
  for (const sNum of data.surahNumbers) {
    if (!SURAH_TO_JUZ_MAP[sNum]) {
      SURAH_TO_JUZ_MAP[sNum] = [];
    }
    if (!SURAH_TO_JUZ_MAP[sNum].includes(jNum)) {
      SURAH_TO_JUZ_MAP[sNum].push(jNum);
    }
  }
}

/**
 * Computes complete information on which Juz and which Surahs are memorized by a student.
 */
export function getStudentQuranProgress(student: Santri): StudentQuranProgress {
  const breakdown = parseHafalan(student.totalJuzMemorized);
  const completedJuzSet = new Set<number>();

  // 1. Explicit list if stored
  if (Array.isArray(student.memorizedJuzList)) {
    student.memorizedJuzList.forEach(num => {
      if (num >= 1 && num <= 30) completedJuzSet.add(num);
    });
  } else {
    // Sequential default based on wholeJuz
    for (let i = 1; i <= breakdown.wholeJuz && i <= 30; i++) {
      completedJuzSet.add(i);
    }
    // Also include any juz with full setoran in hafalanList
    student.hafalanList.forEach(entry => {
      if (entry.juz >= 1 && entry.juz <= 30) {
        if (entry.category === 'juz' && (entry.kualitas === 'A' || entry.kualitas === 'B')) {
          // If setoran says complete juz
          if (entry.surahName.toLowerCase().includes('lengkap') || !entry.ayatMulai) {
            completedJuzSet.add(entry.juz);
          }
        }
      }
    });
  }

  // 2. In-progress Juz (partial with lembar / halaman)
  let inProgressJuz: { juzNumber: number; lembar: number; halaman: number } | undefined;
  if (student.inProgressJuz && student.inProgressJuz.juzNumber >= 1 && student.inProgressJuz.juzNumber <= 30) {
    inProgressJuz = {
      juzNumber: student.inProgressJuz.juzNumber,
      lembar: student.inProgressJuz.lembar,
      halaman: student.inProgressJuz.halaman
    };
  } else if (breakdown.lembar > 0) {
    let candidateJuz = breakdown.wholeJuz + 1;
    // If student has terakhirSetor in another incomplete juz, use that
    if (student.terakhirSetor?.juz && !completedJuzSet.has(student.terakhirSetor.juz)) {
      candidateJuz = student.terakhirSetor.juz;
    } else if (completedJuzSet.has(candidateJuz)) {
      // Find the first non-completed juz
      for (let j = 1; j <= 30; j++) {
        if (!completedJuzSet.has(j)) {
          candidateJuz = j;
          break;
        }
      }
    }

    if (candidateJuz >= 1 && candidateJuz <= 30) {
      inProgressJuz = {
        juzNumber: candidateJuz,
        lembar: breakdown.lembar,
        halaman: breakdown.halaman
      };
    }
  }

  // 3. Build array for all 30 Juz
  const all30Juz: MemorizedJuzInfo[] = [];
  for (let j = 1; j <= 30; j++) {
    const isCompleted = completedJuzSet.has(j);
    const isProgress = inProgressJuz?.juzNumber === j;
    const entries = student.hafalanList.filter(h => h.juz === j);
    const mapping = JUZ_MAPPING[j];
    const surahsInJuz = (mapping?.surahNumbers || []).map(num => {
      const s = getSurahByNumber(num);
      return {
        number: num,
        name: s?.name || `Surah ${num}`,
        arabicName: s?.arabicName || '',
        totalAyahs: s?.totalAyahs || 0
      };
    });

    let status: 'lengkap' | 'sedang' | 'belum' = 'belum';
    let lembar = 0;
    let halaman = 0;

    if (isCompleted) {
      status = 'lengkap';
      lembar = 10;
      halaman = 20;
    } else if (isProgress && inProgressJuz) {
      status = 'sedang';
      lembar = inProgressJuz.lembar;
      halaman = inProgressJuz.halaman;
    } else if (entries.length > 0) {
      // Has partial setoran
      status = 'sedang';
      lembar = 2; // conservative estimate for individual surah deposit
      halaman = 4;
    }

    all30Juz.push({
      juzNumber: j,
      name: mapping?.name || `Juz ${j}`,
      status,
      lembar,
      halaman,
      surahs: surahsInJuz,
      entries
    });
  }

  // 4. Determine Memorized Surahs
  const memorizedSurahMap = new Map<number, MemorizedSurahInfo>();

  if (Array.isArray(student.memorizedSurahNumbers)) {
    // Explicit list defined by user/ustadz
    student.memorizedSurahNumbers.forEach(sNum => {
      const surah = getSurahByNumber(sNum);
      if (!surah) return;
      const juzOfSurah = SURAH_TO_JUZ_MAP[sNum] || [];
      const allJuzCovered = juzOfSurah.length > 0 && juzOfSurah.every(j => completedJuzSet.has(j));

      // Check if there are deposits in hafalanList
      const entry = student.hafalanList.find(h => 
        h.surahNumber === sNum || 
        (h.surahName && surah.name && (
          h.surahName.toLowerCase().includes(surah.name.toLowerCase()) ||
          surah.name.toLowerCase().includes(h.surahName.toLowerCase())
        ))
      );

      let ayatDetail = `Lengkap (${surah.totalAyahs} Ayat)`;
      if (entry?.ayatMulai && entry?.ayatSelesai && (entry.ayatMulai !== 1 || entry.ayatSelesai !== surah.totalAyahs)) {
        ayatDetail = `Ayat ${entry.ayatMulai}-${entry.ayatSelesai}`;
      }

      memorizedSurahMap.set(sNum, {
        number: sNum,
        name: surah.name,
        arabicName: surah.arabicName,
        totalAyahs: surah.totalAyahs,
        revelation: surah.revelation,
        juzNumbers: juzOfSurah,
        status: allJuzCovered || !entry?.ayatMulai ? 'lengkap' : 'sebagian',
        ayatDetail,
        lastDate: entry?.tanggal
      });
    });
  } else {
    // Automatic derivation from completed Juz
    completedJuzSet.forEach(juzNum => {
      const mapping = JUZ_MAPPING[juzNum];
      if (mapping) {
        mapping.surahNumbers.forEach(sNum => {
          const surah = getSurahByNumber(sNum);
          if (!surah) return;
          const juzOfSurah = SURAH_TO_JUZ_MAP[sNum] || [juzNum];
          // If all juz for this surah are completed, mark 'lengkap', otherwise 'sebagian'
          const allJuzCovered = juzOfSurah.every(j => completedJuzSet.has(j));

          memorizedSurahMap.set(sNum, {
            number: sNum,
            name: surah.name,
            arabicName: surah.arabicName,
            totalAyahs: surah.totalAyahs,
            revelation: surah.revelation,
            juzNumbers: juzOfSurah,
            status: allJuzCovered ? 'lengkap' : 'sebagian',
            ayatDetail: allJuzCovered ? `Lengkap (${surah.totalAyahs} Ayat)` : `Sebagian di Juz ${juzNum}`
          });
        });
      }
    });
  }

  // Always register surahs from student.hafalanList (especially 'baru' type or setoran) so that any new setoran immediately reflects in the Quran progress & Hafalan page
  student.hafalanList.forEach(entry => {
    let sNum = entry.surahNumber;
    if (!sNum && entry.surahName) {
      const match = ALL_SURAHS.find(s => 
        entry.surahName.toLowerCase().includes(s.name.toLowerCase()) ||
        s.name.toLowerCase().includes(entry.surahName.toLowerCase())
      );
      if (match) sNum = match.number;
    }

    if (sNum) {
      const surah = getSurahByNumber(sNum);
      if (surah) {
        const existing = memorizedSurahMap.get(sNum);
        const isFull = (entry.ayatMulai === 1 && entry.ayatSelesai === surah.totalAyahs) ||
          entry.surahName.toLowerCase().includes('lengkap') ||
          entry.category === 'surah';

        let ayatDetail = existing?.ayatDetail || '';
        if (entry.ayatMulai && entry.ayatSelesai) {
          ayatDetail = `Ayat ${entry.ayatMulai}-${entry.ayatSelesai}`;
        } else if (isFull) {
          ayatDetail = `Lengkap (${surah.totalAyahs} Ayat)`;
        }

        memorizedSurahMap.set(sNum, {
          number: sNum,
          name: surah.name,
          arabicName: surah.arabicName,
          totalAyahs: surah.totalAyahs,
          revelation: surah.revelation,
          juzNumbers: SURAH_TO_JUZ_MAP[sNum] || [entry.juz],
          status: isFull ? 'lengkap' : (existing?.status || 'sebagian'),
          ayatDetail: ayatDetail || (isFull ? `Lengkap (${surah.totalAyahs} Ayat)` : `Sebagian`),
          lastDate: entry.tanggal
        });
      }
    }
  });

  // Sort memorized surahs by surah number
  const memorizedSurahs = Array.from(memorizedSurapMapValues(memorizedSurahMap)).sort((a, b) => a.number - b.number);

  // 5. Generate formatted summary text for Juz
  const sortedCompletedJuz = Array.from(completedJuzSet).sort((a, b) => a - b);
  let juzSummaryText = '';

  if (sortedCompletedJuz.length === 0 && !inProgressJuz) {
    juzSummaryText = 'Belum ada juz yang selesai';
  } else {
    // Format continuous ranges, e.g. "Juz 1-14 (Penuh)"
    const ranges: string[] = [];
    let start = -1;
    let prev = -1;

    for (let i = 0; i < sortedCompletedJuz.length; i++) {
      const current = sortedCompletedJuz[i];
      if (start === -1) {
        start = current;
        prev = current;
      } else if (current === prev + 1) {
        prev = current;
      } else {
        ranges.push(start === prev ? `Juz ${start}` : `Juz ${start}–${prev}`);
        start = current;
        prev = current;
      }
    }
    if (start !== -1) {
      ranges.push(start === prev ? `Juz ${start}` : `Juz ${start}–${prev}`);
    }

    if (ranges.length > 0) {
      juzSummaryText = `${ranges.join(', ')} (Lengkap)`;
    }

    if (inProgressJuz) {
      const progressText = `Juz ${inProgressJuz.juzNumber} (${inProgressJuz.lembar} Lembar / ${inProgressJuz.halaman} Hal)`;
      juzSummaryText = juzSummaryText ? `${juzSummaryText} + ${progressText}` : progressText;
    }
  }

  // 6. Generate formatted summary text for Surahs
  let surahSummaryText = '';
  if (memorizedSurahs.length === 0) {
    surahSummaryText = 'Belum ada surat tersimpan';
  } else {
    const previewNames = memorizedSurahs.slice(0, 4).map(s => s.name);
    const remainingCount = memorizedSurahs.length - previewNames.length;
    surahSummaryText = `${memorizedSurahs.length} Surat: ${previewNames.join(', ')}${remainingCount > 0 ? ` +${remainingCount} lainnya` : ''}`;
  }

  return {
    completedJuzNumbers: sortedCompletedJuz,
    inProgressJuz,
    all30Juz,
    memorizedSurahs,
    juzSummaryText,
    surahSummaryText,
    totalCompletedJuzCount: sortedCompletedJuz.length,
    totalMemorizedSurahsCount: memorizedSurahs.length
  };
}

function memorizedSurapMapValues(map: Map<number, MemorizedSurahInfo>): MemorizedSurahInfo[] {
  return Array.from(map.values());
}
