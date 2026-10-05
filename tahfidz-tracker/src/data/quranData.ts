export interface SurahMeta {
  number: number;
  name: string;
  arabicName: string;
  totalAyahs: number;
  startAyahInJuz?: number;
  endAyahInJuz?: number;
  startPage?: number;
  endPage?: number;
}

export interface JuzMeta {
  juzNumber: number;
  name: string;
  surahs: SurahMeta[];
}

export interface SurahUtsmaniDetail {
  number: number;
  name: string;
  arabicName: string;
  totalAyahs: number;
  revelation: 'Makkiyah' | 'Madaniyah';
  startPage: number;
  endPage: number;
}

// All 114 Surahs of the Holy Quran with Mushaf Madinah / Utsmani standard page mapping (604 pages, 302 lembar)
export const ALL_SURAHS: SurahUtsmaniDetail[] = [
  { number: 1, name: "Al-Fatihah", arabicName: "الفاتحة", totalAyahs: 7, revelation: "Makkiyah", startPage: 1, endPage: 1 },
  { number: 2, name: "Al-Baqarah", arabicName: "البقرة", totalAyahs: 286, revelation: "Madaniyah", startPage: 2, endPage: 49 },
  { number: 3, name: "Ali 'Imran", arabicName: "آل عمران", totalAyahs: 200, revelation: "Madaniyah", startPage: 50, endPage: 76 },
  { number: 4, name: "An-Nisa'", arabicName: "النساء", totalAyahs: 176, revelation: "Madaniyah", startPage: 77, endPage: 106 },
  { number: 5, name: "Al-Ma'idah", arabicName: "المائدة", totalAyahs: 120, revelation: "Madaniyah", startPage: 106, endPage: 127 },
  { number: 6, name: "Al-An'am", arabicName: "الأنعام", totalAyahs: 165, revelation: "Makkiyah", startPage: 128, endPage: 150 },
  { number: 7, name: "Al-A'raf", arabicName: "الأعراف", totalAyahs: 206, revelation: "Makkiyah", startPage: 151, endPage: 176 },
  { number: 8, name: "Al-Anfal", arabicName: "الأنفال", totalAyahs: 75, revelation: "Madaniyah", startPage: 177, endPage: 186 },
  { number: 9, name: "At-Taubah", arabicName: "التوبة", totalAyahs: 129, revelation: "Madaniyah", startPage: 187, endPage: 207 },
  { number: 10, name: "Yunus", arabicName: "يونس", totalAyahs: 109, revelation: "Makkiyah", startPage: 208, endPage: 221 },
  { number: 11, name: "Hud", arabicName: "هود", totalAyahs: 123, revelation: "Makkiyah", startPage: 221, endPage: 235 },
  { number: 12, name: "Yusuf", arabicName: "يوسف", totalAyahs: 111, revelation: "Makkiyah", startPage: 235, endPage: 248 },
  { number: 13, name: "Ar-Ra'd", arabicName: "الرعد", totalAyahs: 43, revelation: "Madaniyah", startPage: 249, endPage: 255 },
  { number: 14, name: "Ibrahim", arabicName: "إبراهيم", totalAyahs: 52, revelation: "Makkiyah", startPage: 255, endPage: 261 },
  { number: 15, name: "Al-Hijr", arabicName: "الحجر", totalAyahs: 99, revelation: "Makkiyah", startPage: 262, endPage: 267 },
  { number: 16, name: "An-Nahl", arabicName: "النحل", totalAyahs: 128, revelation: "Makkiyah", startPage: 267, endPage: 281 },
  { number: 17, name: "Al-Isra'", arabicName: "الإسراء", totalAyahs: 111, revelation: "Makkiyah", startPage: 282, endPage: 293 },
  { number: 18, name: "Al-Kahf", arabicName: "الكهف", totalAyahs: 110, revelation: "Makkiyah", startPage: 293, endPage: 304 },
  { number: 19, name: "Maryam", arabicName: "مريم", totalAyahs: 98, revelation: "Makkiyah", startPage: 305, endPage: 312 },
  { number: 20, name: "Taha", arabicName: "طه", totalAyahs: 135, revelation: "Makkiyah", startPage: 312, endPage: 321 },
  { number: 21, name: "Al-Anbiya'", arabicName: "الأنبياء", totalAyahs: 112, revelation: "Makkiyah", startPage: 322, endPage: 331 },
  { number: 22, name: "Al-Hajj", arabicName: "الحج", totalAyahs: 78, revelation: "Madaniyah", startPage: 332, endPage: 341 },
  { number: 23, name: "Al-Mu'minun", arabicName: "المؤمنون", totalAyahs: 118, revelation: "Makkiyah", startPage: 342, endPage: 349 },
  { number: 24, name: "An-Nur", arabicName: "النور", totalAyahs: 64, revelation: "Madaniyah", startPage: 350, endPage: 359 },
  { number: 25, name: "Al-Furqan", arabicName: "الفرقان", totalAyahs: 77, revelation: "Makkiyah", startPage: 359, endPage: 366 },
  { number: 26, name: "Asy-Syu'ara'", arabicName: "الشعراء", totalAyahs: 227, revelation: "Makkiyah", startPage: 367, endPage: 376 },
  { number: 27, name: "An-Naml", arabicName: "النمل", totalAyahs: 93, revelation: "Makkiyah", startPage: 377, endPage: 385 },
  { number: 28, name: "Al-Qasas", arabicName: "القصص", totalAyahs: 88, revelation: "Makkiyah", startPage: 385, endPage: 396 },
  { number: 29, name: "Al-'Ankabut", arabicName: "العنكبوت", totalAyahs: 69, revelation: "Makkiyah", startPage: 396, endPage: 404 },
  { number: 30, name: "Ar-Rum", arabicName: "الروم", totalAyahs: 60, revelation: "Makkiyah", startPage: 404, endPage: 410 },
  { number: 31, name: "Luqman", arabicName: "لقمان", totalAyahs: 34, revelation: "Makkiyah", startPage: 411, endPage: 414 },
  { number: 32, name: "As-Sajdah", arabicName: "السجدة", totalAyahs: 30, revelation: "Makkiyah", startPage: 415, endPage: 417 },
  { number: 33, name: "Al-Ahzab", arabicName: "الأحزاب", totalAyahs: 73, revelation: "Madaniyah", startPage: 418, endPage: 427 },
  { number: 34, name: "Saba'", arabicName: "سبأ", totalAyahs: 54, revelation: "Makkiyah", startPage: 428, endPage: 434 },
  { number: 35, name: "Fatir", arabicName: "فاطر", totalAyahs: 45, revelation: "Makkiyah", startPage: 434, endPage: 440 },
  { number: 36, name: "Yasin", arabicName: "يس", totalAyahs: 83, revelation: "Makkiyah", startPage: 440, endPage: 445 },
  { number: 37, name: "As-Saffat", arabicName: "الصافات", totalAyahs: 182, revelation: "Makkiyah", startPage: 446, endPage: 452 },
  { number: 38, name: "Sad", arabicName: "ص", totalAyahs: 88, revelation: "Makkiyah", startPage: 453, endPage: 458 },
  { number: 39, name: "Az-Zumar", arabicName: "الزmer", totalAyahs: 75, revelation: "Makkiyah", startPage: 458, endPage: 467 },
  { number: 40, name: "Ghafir", arabicName: "غافر", totalAyahs: 85, revelation: "Makkiyah", startPage: 467, endPage: 476 },
  { number: 41, name: "Fussilat", arabicName: "فصلت", totalAyahs: 54, revelation: "Makkiyah", startPage: 477, endPage: 482 },
  { number: 42, name: "Asy-Syura", arabicName: "الشورى", totalAyahs: 53, revelation: "Makkiyah", startPage: 483, endPage: 489 },
  { number: 43, name: "Az-Zukhruf", arabicName: "الزخرف", totalAyahs: 89, revelation: "Makkiyah", startPage: 489, endPage: 495 },
  { number: 44, name: "Ad-Dukhan", arabicName: "الدخان", totalAyahs: 59, revelation: "Makkiyah", startPage: 496, endPage: 498 },
  { number: 45, name: "Al-Jatsiyah", arabicName: "الجاثية", totalAyahs: 37, revelation: "Makkiyah", startPage: 499, endPage: 502 },
  { number: 46, name: "Al-Ahqaf", arabicName: "الأحقاف", totalAyahs: 35, revelation: "Makkiyah", startPage: 502, endPage: 506 },
  { number: 47, name: "Muhammad", arabicName: "محمد", totalAyahs: 38, revelation: "Madaniyah", startPage: 507, endPage: 510 },
  { number: 48, name: "Al-Fath", arabicName: "الفتح", totalAyahs: 29, revelation: "Madaniyah", startPage: 511, endPage: 515 },
  { number: 49, name: "Al-Hujurat", arabicName: "الحجرات", totalAyahs: 18, revelation: "Madaniyah", startPage: 515, endPage: 517 },
  { number: 50, name: "Qaf", arabicName: "ق", totalAyahs: 45, revelation: "Makkiyah", startPage: 518, endPage: 520 },
  { number: 51, name: "Adz-Dzariyat", arabicName: "الذاريات", totalAyahs: 60, revelation: "Makkiyah", startPage: 520, endPage: 523 },
  { number: 52, name: "At-Tur", arabicName: "الطور", totalAyahs: 49, revelation: "Makkiyah", startPage: 523, endPage: 525 },
  { number: 53, name: "An-Najm", arabicName: "النجم", totalAyahs: 62, revelation: "Makkiyah", startPage: 526, endPage: 528 },
  { number: 54, name: "Al-Qamar", arabicName: "القمر", totalAyahs: 55, revelation: "Makkiyah", startPage: 528, endPage: 531 },
  { number: 55, name: "Ar-Rahman", arabicName: "الرحمن", totalAyahs: 78, revelation: "Madaniyah", startPage: 531, endPage: 534 },
  { number: 56, name: "Al-Waqi'ah", arabicName: "الواقعة", totalAyahs: 96, revelation: "Makkiyah", startPage: 534, endPage: 537 },
  { number: 57, name: "Al-Hadid", arabicName: "الحديد", totalAyahs: 29, revelation: "Madaniyah", startPage: 537, endPage: 541 },
  { number: 58, name: "Al-Mujadilah", arabicName: "المجادلة", totalAyahs: 22, revelation: "Madaniyah", startPage: 542, endPage: 545 },
  { number: 59, name: "Al-Hasyr", arabicName: "الحشر", totalAyahs: 24, revelation: "Madaniyah", startPage: 545, endPage: 548 },
  { number: 60, name: "Al-Mumtahanah", arabicName: "الممتحنة", totalAyahs: 13, revelation: "Madaniyah", startPage: 549, endPage: 551 },
  { number: 61, name: "As-Saff", arabicName: "الصف", totalAyahs: 14, revelation: "Madaniyah", startPage: 551, endPage: 552 },
  { number: 62, name: "Al-Jumu'ah", arabicName: "الجمعة", totalAyahs: 11, revelation: "Madaniyah", startPage: 553, endPage: 554 },
  { number: 63, name: "Al-Munafiqun", arabicName: "المنافقون", totalAyahs: 11, revelation: "Madaniyah", startPage: 554, endPage: 555 },
  { number: 64, name: "At-Taghabun", arabicName: "التغابن", totalAyahs: 18, revelation: "Madaniyah", startPage: 556, endPage: 557 },
  { number: 65, name: "At-Talaq", arabicName: "الطلاق", totalAyahs: 12, revelation: "Madaniyah", startPage: 558, endPage: 559 },
  { number: 66, name: "At-Tahrim", arabicName: "التحريم", totalAyahs: 12, revelation: "Madaniyah", startPage: 560, endPage: 561 },
  { number: 67, name: "Al-Mulk", arabicName: "الملك", totalAyahs: 30, revelation: "Makkiyah", startPage: 562, endPage: 564 },
  { number: 68, name: "Al-Qalam", arabicName: "القلم", totalAyahs: 52, revelation: "Makkiyah", startPage: 564, endPage: 566 },
  { number: 69, name: "Al-Haqqah", arabicName: "الحاقة", totalAyahs: 52, revelation: "Makkiyah", startPage: 566, endPage: 568 },
  { number: 70, name: "Al-Ma'arij", arabicName: "المعارج", totalAyahs: 44, revelation: "Makkiyah", startPage: 568, endPage: 570 },
  { number: 71, name: "Nuh", arabicName: "نوح", totalAyahs: 28, revelation: "Makkiyah", startPage: 570, endPage: 571 },
  { number: 72, name: "Al-Jinn", arabicName: "الجن", totalAyahs: 28, revelation: "Makkiyah", startPage: 572, endPage: 573 },
  { number: 73, name: "Al-Muzzammil", arabicName: "المزمل", totalAyahs: 20, revelation: "Makkiyah", startPage: 574, endPage: 575 },
  { number: 74, name: "Al-Muddatsir", arabicName: "المدثر", totalAyahs: 56, revelation: "Makkiyah", startPage: 575, endPage: 577 },
  { number: 75, name: "Al-Qiyamah", arabicName: "القيامة", totalAyahs: 40, revelation: "Makkiyah", startPage: 577, endPage: 578 },
  { number: 76, name: "Al-Insan", arabicName: "الإنسان", totalAyahs: 31, revelation: "Madaniyah", startPage: 578, endPage: 580 },
  { number: 77, name: "Al-Mursalat", arabicName: "المرسلات", totalAyahs: 50, revelation: "Makkiyah", startPage: 580, endPage: 581 },
  { number: 78, name: "An-Naba'", arabicName: "النبأ", totalAyahs: 40, revelation: "Makkiyah", startPage: 582, endPage: 583 },
  { number: 79, name: "An-Nazi'at", arabicName: "النازعات", totalAyahs: 46, revelation: "Makkiyah", startPage: 583, endPage: 584 },
  { number: 80, name: "'Abasa", arabicName: "عبس", totalAyahs: 42, revelation: "Makkiyah", startPage: 585, endPage: 586 },
  { number: 81, name: "At-Takwir", arabicName: "التكوير", totalAyahs: 29, revelation: "Makkiyah", startPage: 586, endPage: 586 },
  { number: 82, name: "Al-Infitar", arabicName: "الانفطار", totalAyahs: 19, revelation: "Makkiyah", startPage: 587, endPage: 587 },
  { number: 83, name: "Al-Muthaffifin", arabicName: "المطففين", totalAyahs: 36, revelation: "Makkiyah", startPage: 587, endPage: 589 },
  { number: 84, name: "Al-Insyiqaq", arabicName: "الانشقاق", totalAyahs: 25, revelation: "Makkiyah", startPage: 589, endPage: 590 },
  { number: 85, name: "Al-Buruj", arabicName: "البروج", totalAyahs: 22, revelation: "Makkiyah", startPage: 590, endPage: 590 },
  { number: 86, name: "At-Tariq", arabicName: "الطارق", totalAyahs: 17, revelation: "Makkiyah", startPage: 591, endPage: 591 },
  { number: 87, name: "Al-A'la", arabicName: "الأعلى", totalAyahs: 19, revelation: "Makkiyah", startPage: 591, endPage: 592 },
  { number: 88, name: "Al-Ghasyiyah", arabicName: "الغاشية", totalAyahs: 26, revelation: "Makkiyah", startPage: 592, endPage: 593 },
  { number: 89, name: "Al-Fajr", arabicName: "الفجر", totalAyahs: 30, revelation: "Makkiyah", startPage: 593, endPage: 594 },
  { number: 90, name: "Al-Balad", arabicName: "البلد", totalAyahs: 20, revelation: "Makkiyah", startPage: 594, endPage: 595 },
  { number: 91, name: "Asy-Syams", arabicName: "الشمس", totalAyahs: 15, revelation: "Makkiyah", startPage: 595, endPage: 595 },
  { number: 92, name: "Al-Lail", arabicName: "الليل", totalAyahs: 21, revelation: "Makkiyah", startPage: 595, endPage: 596 },
  { number: 93, name: "Ad-Duha", arabicName: "الضحى", totalAyahs: 11, revelation: "Makkiyah", startPage: 596, endPage: 596 },
  { number: 94, name: "Asy-Syarh", arabicName: "الشرح", totalAyahs: 8, revelation: "Makkiyah", startPage: 596, endPage: 596 },
  { number: 95, name: "At-Tin", arabicName: "التين", totalAyahs: 8, revelation: "Makkiyah", startPage: 597, endPage: 597 },
  { number: 96, name: "Al-'Alaq", arabicName: "العلق", totalAyahs: 19, revelation: "Makkiyah", startPage: 597, endPage: 598 },
  { number: 97, name: "Al-Qadr", arabicName: "القدر", totalAyahs: 5, revelation: "Makkiyah", startPage: 598, endPage: 598 },
  { number: 98, name: "Al-Bayyinah", arabicName: "البينة", totalAyahs: 8, revelation: "Madaniyah", startPage: 598, endPage: 599 },
  { number: 99, name: "Az-Zalzalah", arabicName: "الزلزلة", totalAyahs: 8, revelation: "Madaniyah", startPage: 599, endPage: 599 },
  { number: 100, name: "Al-'Adiyat", arabicName: "العاديات", totalAyahs: 11, revelation: "Makkiyah", startPage: 599, endPage: 600 },
  { number: 101, name: "Al-Qari'ah", arabicName: "القارعة", totalAyahs: 11, revelation: "Makkiyah", startPage: 600, endPage: 600 },
  { number: 102, name: "At-Takatsur", arabicName: "التكاثر", totalAyahs: 8, revelation: "Makkiyah", startPage: 600, endPage: 600 },
  { number: 103, name: "Al-'Asr", arabicName: "العصر", totalAyahs: 3, revelation: "Makkiyah", startPage: 601, endPage: 601 },
  { number: 104, name: "Al-Humazah", arabicName: "الهمزة", totalAyahs: 9, revelation: "Makkiyah", startPage: 601, endPage: 601 },
  { number: 105, name: "Al-Fil", arabicName: "الفيل", totalAyahs: 5, revelation: "Makkiyah", startPage: 601, endPage: 601 },
  { number: 106, name: "Quraisy", arabicName: "قريش", totalAyahs: 4, revelation: "Makkiyah", startPage: 602, endPage: 602 },
  { number: 107, name: "Al-Ma'un", arabicName: "الماعون", totalAyahs: 7, revelation: "Makkiyah", startPage: 602, endPage: 602 },
  { number: 108, name: "Al-Kautsar", arabicName: "الكوثر", totalAyahs: 3, revelation: "Makkiyah", startPage: 602, endPage: 602 },
  { number: 109, name: "Al-Kafirun", arabicName: "الكافرون", totalAyahs: 6, revelation: "Makkiyah", startPage: 603, endPage: 603 },
  { number: 110, name: "An-Nasr", arabicName: "النصر", totalAyahs: 3, revelation: "Madaniyah", startPage: 603, endPage: 603 },
  { number: 111, name: "Al-Lahab", arabicName: "اللهب", totalAyahs: 5, revelation: "Makkiyah", startPage: 603, endPage: 603 },
  { number: 112, name: "Al-Ikhlas", arabicName: "الإخلاص", totalAyahs: 4, revelation: "Makkiyah", startPage: 604, endPage: 604 },
  { number: 113, name: "Al-Falaq", arabicName: "الفلق", totalAyahs: 5, revelation: "Makkiyah", startPage: 604, endPage: 604 },
  { number: 114, name: "An-Nas", arabicName: "الناس", totalAyahs: 6, revelation: "Makkiyah", startPage: 604, endPage: 604 },
];

export const JUZ_MAPPING: Record<number, { name: string; surahNumbers: number[] }> = {
  1: { name: "Juz 1", surahNumbers: [1, 2] },
  2: { name: "Juz 2", surahNumbers: [2] },
  3: { name: "Juz 3", surahNumbers: [2, 3] },
  4: { name: "Juz 4", surahNumbers: [3, 4] },
  5: { name: "Juz 5", surahNumbers: [4] },
  6: { name: "Juz 6", surahNumbers: [4, 5] },
  7: { name: "Juz 7", surahNumbers: [5, 6] },
  8: { name: "Juz 8", surahNumbers: [6, 7] },
  9: { name: "Juz 9", surahNumbers: [7, 8] },
  10: { name: "Juz 10", surahNumbers: [8, 9] },
  11: { name: "Juz 11", surahNumbers: [9, 10, 11] },
  12: { name: "Juz 12", surahNumbers: [11, 12] },
  13: { name: "Juz 13", surahNumbers: [12, 13, 14] },
  14: { name: "Juz 14", surahNumbers: [15, 16] },
  15: { name: "Juz 15", surahNumbers: [17, 18] },
  16: { name: "Juz 16", surahNumbers: [18, 19, 20] },
  17: { name: "Juz 17", surahNumbers: [21, 22] },
  18: { name: "Juz 18", surahNumbers: [23, 24, 25] },
  19: { name: "Juz 19", surahNumbers: [25, 26, 27] },
  20: { name: "Juz 20", surahNumbers: [27, 28, 29] },
  21: { name: "Juz 21", surahNumbers: [29, 30, 31, 32, 33] },
  22: { name: "Juz 22", surahNumbers: [33, 34, 35, 36] },
  23: { name: "Juz 23", surahNumbers: [36, 37, 38, 39] },
  24: { name: "Juz 24", surahNumbers: [39, 40, 41] },
  25: { name: "Juz 25", surahNumbers: [41, 42, 43, 44, 45] },
  26: { name: "Juz 26", surahNumbers: [46, 47, 48, 49, 50, 51] },
  27: { name: "Juz 27", surahNumbers: [51, 52, 53, 54, 55, 56, 57] },
  28: { name: "Juz 28", surahNumbers: [58, 59, 60, 61, 62, 63, 64, 65, 66] },
  29: { name: "Juz 29", surahNumbers: [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77] },
  30: { name: "Juz 30 (Juz 'Amma)", surahNumbers: [
    78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100,
    101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114
  ] }
};

export function getSurahByNumber(num: number) {
  return ALL_SURAHS.find(s => s.number === num);
}

export function getSurahsForJuz(juzNumber: number) {
  const mapping = JUZ_MAPPING[juzNumber];
  if (!mapping) return [];
  return mapping.surahNumbers.map(n => getSurahByNumber(n)!).filter(Boolean);
}

/**
 * Menghitung nomor halaman Mushaf Utsmani (1 - 604) berdasarkan nomor surah dan nomor ayat
 */
export function getUtsmaniPage(surahNumber: number, ayahNumber: number): number {
  const meta = getSurahByNumber(surahNumber);
  if (!meta) return 1;

  if (meta.startPage === meta.endPage) {
    return meta.startPage;
  }

  const totalPages = meta.endPage - meta.startPage + 1;
  const clampedAyah = Math.max(1, Math.min(meta.totalAyahs, ayahNumber || 1));
  const progressRatio = (clampedAyah - 1) / Math.max(1, meta.totalAyahs - 1);
  const pageOffset = Math.floor(progressRatio * totalPages);

  return Math.min(meta.endPage, Math.max(meta.startPage, meta.startPage + pageOffset));
}

export interface UtsmaniCalculationResult {
  halamanMulai: number;
  halamanSelesai: number;
  totalHalaman: number;
  totalLembar: number;
  lembarMulai: number;
  lembarSelesai: number;
  juzEstimate: number;
  summaryText: string;
}

/**
 * Menghitung rentang halaman & lembar standar Mushaf Rasm Utsmani
 * 1 Lembar = 2 Halaman (Lembar ke-ceil(halaman/2))
 * Total Mushaf = 604 Halaman / 302 Lembar
 */
export function calculateUtsmaniHalamanDanLembar(params: {
  surahNumber: number;
  ayatMulai: number;
  ayatSelesai: number;
  surahSampaiNumber?: number;
}): UtsmaniCalculationResult {
  const endSurahNumber = params.surahSampaiNumber || params.surahNumber;
  const endSurahMeta = getSurahByNumber(endSurahNumber);

  const startAyat = Math.max(1, params.ayatMulai || 1);
  const endAyat = Math.max(startAyat, params.ayatSelesai || (endSurahMeta?.totalAyahs || 1));

  let pageStart = getUtsmaniPage(params.surahNumber, startAyat);
  let pageEnd = getUtsmaniPage(endSurahNumber, endAyat);

  if (pageEnd < pageStart) {
    pageEnd = pageStart;
  }

  const totalHalaman = Math.max(1, pageEnd - pageStart + 1);
  const lembarMulai = Math.ceil(pageStart / 2);
  const lembarSelesai = Math.ceil(pageEnd / 2);
  const totalLembar = Math.max(1, lembarSelesai - lembarMulai + 1);

  // Estimasi Juz dari nomor halaman (Standar Mushaf Madinah 20 halaman per juz)
  let juzEstimate = 1;
  if (pageStart >= 582) {
    juzEstimate = 30;
  } else if (pageStart > 21) {
    juzEstimate = Math.min(29, Math.floor((pageStart - 2) / 20) + 1);
  }

  let summaryText = '';
  if (pageStart === pageEnd) {
    summaryText = `Hal. ${pageStart} (1 Halaman · Lembar ke-${lembarMulai})`;
  } else {
    summaryText = `Hal. ${pageStart} - ${pageEnd} (${totalHalaman} Halaman · ${totalLembar} Lembar Utsmani)`;
  }

  return {
    halamanMulai: pageStart,
    halamanSelesai: pageEnd,
    totalHalaman,
    totalLembar,
    lembarMulai,
    lembarSelesai,
    juzEstimate,
    summaryText
  };
}
