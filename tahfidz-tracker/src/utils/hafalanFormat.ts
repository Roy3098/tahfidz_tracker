/**
 * Helper utility for Al-Qur'an hafalan conversion between Decimal Juz and Lembar/Halaman.
 * 
 * Standar Mushaf Rasm Utsmani (Madinah standard):
 * - 1 Juz = 20 Halaman
 * - 1 Lembar = 2 Halaman
 * - 1 Juz = 10 Lembar
 * 
 * Konversi desimal:
 * - 0.1 Juz = 1 Lembar (2 Halaman)
 * - 0.2 Juz = 2 Lembar (4 Halaman)
 * - 0.5 Juz = 5 Lembar (10 Halaman / Setengah Juz)
 * - 1.2 Juz = 1 Juz + 2 Lembar (4 Halaman)
 */

export interface HafalanBreakdown {
  decimalJuz: number;       // e.g. 1.2
  decimalText: string;      // e.g. "1.2"
  wholeJuz: number;         // e.g. 1
  lembar: number;           // e.g. 2
  halaman: number;          // e.g. 4
  lembarText: string;       // e.g. "1 Juz 2 Lembar"
  compactText: string;      // e.g. "1.2 Juz"
  dualText: string;         // e.g. "1.2 Juz · 1 Juz 2 Lembar"
  detailText: string;       // e.g. "1 Juz 2 Lembar (4 Halaman)"
}

export function parseHafalan(value: number | string | undefined | null): HafalanBreakdown {
  const num = typeof value === 'number' ? value : parseFloat(String(value || 0)) || 0;
  const clamped = Math.max(0, Math.min(30, num));
  
  // Round to 1 decimal place
  const decimalJuz = Math.round(clamped * 10) / 10;
  const decimalText = decimalJuz.toFixed(1);
  
  let wholeJuz = Math.floor(decimalJuz);
  let lembar = Math.round((decimalJuz - wholeJuz) * 10);
  
  if (lembar >= 10) {
    wholeJuz += 1;
    lembar = 0;
  }
  
  const halaman = lembar * 2;
  
  let lembarText = '';
  if (wholeJuz === 0 && lembar === 0) {
    lembarText = '0 Juz';
  } else if (wholeJuz === 0) {
    lembarText = `${lembar} Lembar`;
  } else if (lembar === 0) {
    lembarText = `${wholeJuz} Juz Penuh`;
  } else {
    lembarText = `${wholeJuz} Juz ${lembar} Lembar`;
  }
  
  let detailText = '';
  if (wholeJuz === 0 && lembar === 0) {
    detailText = 'Belum ada hafalan tercatat';
  } else if (wholeJuz === 0) {
    detailText = `${lembar} Lembar (${halaman} Halaman)`;
  } else if (lembar === 0) {
    detailText = `${wholeJuz} Juz Penuh (${wholeJuz * 10} Lembar / ${wholeJuz * 20} Halaman)`;
  } else {
    detailText = `${wholeJuz} Juz ${lembar} Lembar (${halaman} Halaman)`;
  }

  const compactText = `${decimalText} Juz`;
  const dualText = `${decimalText} Juz · ${lembarText}`;

  return {
    decimalJuz,
    decimalText,
    wholeJuz,
    lembar,
    halaman,
    lembarText,
    compactText,
    dualText,
    detailText
  };
}

export function formatRemainingTarget(currentJuz: number, targetJuz: number): string {
  const remaining = Math.max(0, Math.round((targetJuz - currentJuz) * 10) / 10);
  if (remaining <= 0) {
    return 'Target tercapai! Alhamdulillah';
  }
  const breakdown = parseHafalan(remaining);
  return `Sisa ${breakdown.decimalText} Juz (${breakdown.lembarText})`;
}
