import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGenAIClient(apiKey: string) {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface StructuredMonthlyReport {
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

interface DepositItemPayload {
  tanggal?: string;
  tanggalFormatted?: string;
  type?: string;
  juz?: number;
  surahName?: string;
  ayatText?: string;
  kualitas?: string;
  catatan?: string;
}

interface MonthlySummaryPayload {
  style?: 'ringkas' | 'wali' | 'evaluasi';
  studentName?: string;
  kelasNama?: string;
  kelompokNama?: string;
  gender?: string;
  periodLabel?: string;
  totalJuzMemorized?: string | number;
  lembarText?: string;
  targetJuz?: number;
  progressPct?: number;
  inProgressInfo?: string;
  lastDepositInfo?: string;
  monthlyStats?: {
    totalSetoran?: number;
    baruCount?: number;
    murojaCount?: number;
    perbaikanCount?: number;
    newLembar?: number;
    newPages?: number;
    dominantQuality?: string;
    topQualityCode?: string;
    attendancePct?: number;
    presentCount?: number;
    onTimeCount?: number;
    lateCount?: number;
    absentCount?: number;
    totalAttendanceSessions?: number;
  };
  depositItems?: DepositItemPayload[];
  behaviorNotes?: string;
}

/**
 * Mesin Generator Rangkuman 1 Bulan yang cerdas, terstruktur, dan mudah dibaca.
 * Mendukung 3 gaya bahasa: 'ringkas' (Poin Ringkas), 'wali' (Laporan Wali Santri), 'evaluasi' (Evaluasi Ustadz).
 */
function buildStructuredMonthlyReport(payload: MonthlySummaryPayload): StructuredMonthlyReport {
  const style = payload.style || 'ringkas';
  const name = payload.studentName || 'Santri';
  const kelas = payload.kelasNama || '-';
  const kelompok = payload.kelompokNama || '-';
  const period = payload.periodLabel || '1 Bulan Terakhir';
  const totalJuz = Number(payload.totalJuzMemorized || 0);
  const lembarText = payload.lembarText || `${totalJuz} Juz`;
  const targetJuz = Number(payload.targetJuz || 30);
  const progressPct = Number(payload.progressPct || 0);
  const sisaJuz = Math.max(0, Number((targetJuz - totalJuz).toFixed(2)));

  const stats = payload.monthlyStats || {};
  const totalSetoran = stats.totalSetoran ?? 0;
  const baruCount = stats.baruCount ?? 0;
  const murojaCount = stats.murojaCount ?? 0;
  const perbaikanCount = stats.perbaikanCount ?? 0;
  const newLembar = stats.newLembar ?? 0;
  const newPages = stats.newPages ?? 0;
  const topQualityCode = stats.topQualityCode || 'A';
  const dominantQuality = stats.dominantQuality || 'A (Mumtaz / Sangat Baik)';
  const attendancePct = stats.attendancePct ?? 100;
  const presentCount = stats.presentCount ?? 0;
  const lateCount = stats.lateCount ?? 0;
  const totalSessions = stats.totalAttendanceSessions ?? 0;

  const items = payload.depositItems || [];
  const behaviorText =
    payload.behaviorNotes || 'Tertib, fokus, dan menjaga adab dengan baik selama sesi halaqah';

  // Kumpulkan daftar unik surah/juz untuk Hafalan Baru & Muroja'ah agar mudah dibaca
  const surahBaruSet = new Set<string>();
  const surahMurojaSet = new Set<string>();
  const catatanUstadzSet = new Set<string>();

  items.forEach(it => {
    const label = `${it.surahName || `Juz ${it.juz}`}${it.ayatText ? ` (${it.ayatText})` : ''}`;
    if (it.type === 'baru') {
      surahBaruSet.add(label);
    } else {
      surahMurojaSet.add(label);
    }
    if (it.catatan && it.catatan.trim()) {
      catatanUstadzSet.add(it.catatan.trim());
    }
  });

  const daftarSurahBaru = Array.from(surahBaruSet).slice(0, 4).join(', ');
  const daftarSurahMuroja = Array.from(surahMurojaSet).slice(0, 4).join(', ');
  const catatanPilihan = Array.from(catatanUstadzSet).slice(0, 2).join('. ');

  // Tentukan predikat bulan ini
  let predikatBulanIni = 'Istiqamah & Terjaga';
  if (newLembar >= 2.5 && attendancePct >= 90) {
    predikatBulanIni = 'Mumtaz & Sangat Progresif';
  } else if (totalSetoran >= 3 && topQualityCode === 'A') {
    predikatBulanIni = 'Lancar & Mutqin';
  } else if (totalSetoran === 0) {
    predikatBulanIni = 'Perlu Pendampingan Setoran';
  } else if (baruCount === 0 && murojaCount > 0) {
    predikatBulanIni = 'Fokus Penguatan Muroja\'ah';
  }

  // Ringkasan Utama berdasarkan gaya bahasa
  let ringkasanUtama = '';
  if (totalSetoran === 0) {
    ringkasanUtama =
      style === 'wali'
        ? `Assalamu'alaikum Ayah/Bunda, pada periode ${period} belum terdapat catatan setoran baru yang terinput untuk ananda ${name}. Total hafalan ananda saat ini berada di ${totalJuz} Juz (${lembarText}) atau ${progressPct}% dari target ${targetJuz} Juz.`
        : `Selama periode ${period}, belum ada riwayat setoran yang tercatat untuk ${name}. Capaian kumulatif saat ini adalah ${totalJuz} Juz (${lembarText}) dari target ${targetJuz} Juz (${progressPct}%).`;
  } else if (style === 'wali') {
    ringkasanUtama = `Alhamdulillah, perkembangan hafalan ananda ${name} (${kelas} · ${kelompok}) selama ${period} berjalan dengan baik. Ananda berhasil menyelesaikan ${totalSetoran} kali setoran dengan tambahan hafalan baru +${newLembar} Lembar (${newPages} Halaman penuh) sehingga total hafalan kini mencapai ${totalJuz} Juz (${progressPct}% dari target ${targetJuz} Juz).`;
  } else if (style === 'evaluasi') {
    ringkasanUtama = `Evaluasi periode ${period} untuk ${name}: tercatat ${totalSetoran}x aktivitas setoran (${baruCount}x Sabaq/Baru, ${murojaCount}x Muroja'ah, ${perbaikanCount}x Perbaikan) dengan penambahan murni +${newLembar} Lembar (${newPages} Halaman Mushaf Utsmani) dan predikat rata-rata ${dominantQuality}.`;
  } else {
    ringkasanUtama = `Selama ${period}, ${name} telah melaksanakan ${totalSetoran} kali setoran dan menambah +${newLembar} Lembar (${newPages} Halaman penuh) hafalan baru. Total capaian saat ini: ${totalJuz} Juz (${lembarText}) atau ${progressPct}% dari target ${targetJuz} Juz.`;
  }

  // Poin-Poin Capaian yang bersih dan mudah dipindai
  const sapaanSantri = style === 'wali' ? `ananda ${name}` : name;
  const poinCapaian: { judul: string; isi: string }[] = [
    {
      judul: 'Capaian Hafalan Baru (Sabaq)',
      isi:
        baruCount > 0
          ? `${style === 'wali' ? `Alhamdulillah ${sapaanSantri} berhasil menambah` : 'Bertambah'} +${newLembar} Lembar (${newPages} Halaman) dari ${baruCount}x setoran baru${
              daftarSurahBaru ? ` pada materi: ${daftarSurahBaru}` : ''
            }.`
          : payload.lastDepositInfo
          ? `Belum ada penambahan halaman baru pada periode ini. Setoran terakhir ${sapaanSantri} tercatat pada ${payload.lastDepositInfo}.`
          : `Belum ada setoran hafalan baru yang tercatat untuk ${sapaanSantri} pada periode ini.`
    },
    {
      judul: "Pengulangan (Muroja'ah) & Kualitas Tajwid",
      isi:
        murojaCount > 0 || perbaikanCount > 0
          ? `${style === 'wali' ? `Ananda telah melaksanakan` : 'Tercatat'} ${murojaCount}x Muroja'ah${
              perbaikanCount > 0 ? ` dan ${perbaikanCount}x Perbaikan` : ''
            }${daftarSurahMuroja ? ` (${daftarSurahMuroja})` : ''} dengan rata-rata kualitas bacaan ${dominantQuality}.${
              catatanPilihan ? ` Catatan pembina: "${catatanPilihan}".` : ''
            }`
          : totalSetoran > 0
          ? `Kualitas bacaan ${sapaanSantri} rata-rata berada pada predikat ${dominantQuality}.${
              catatanPilihan ? ` Catatan pembina: "${catatanPilihan}".` : ' Perlu didampingi untuk menambah porsi muroja\'ah rutin agar hafalan sebelumnya tetap kokoh.'
            }`
          : 'Menunggu jadwal setoran dan evaluasi tajwid berikutnya.'
    },
    {
      judul: 'Kehadiran & Adab di Halaqah',
      isi:
        totalSessions > 0
          ? `Tingkat kehadiran ${sapaanSantri} mencapai ${attendancePct}% (${presentCount} hadir dari ${totalSessions} sesi${
              lateCount > 0 ? `, ${lateCount}x terlambat` : ', selalu hadir tepat waktu'
            }). Catatan adab & sikap: ${behaviorText}.`
          : `Tingkat kehadiran rata-rata ${sapaanSantri} adalah ${attendancePct}%. Catatan adab & sikap: ${behaviorText}.`
    }
  ];

  // Rekomendasi Bulan Depan (Poin pendek & jelas)
  const rekomendasiBulanDepan: string[] = [];
  if (style === 'wali') {
    if (newLembar < 2.5) {
      rekomendasiBulanDepan.push(
        `Mohon dukungan Ayah/Bunda di rumah untuk menyimak bacaan ananda agar dapat mencapai target minimal 1 halaman penuh (0.5 Lembar) setiap sesi setoran.`
      );
    } else {
      rekomendasiBulanDepan.push(
        `Alhamdulillah capaian penambahan hafalan ananda (+${newLembar} Lembar) sangat baik, mohon terus diberikan apresiasi dan semangat di rumah.`
      );
    }
    rekomendasiBulanDepan.push(
      `Mendampingi ananda melakukan muroja'ah (mengulang hafalan) sekitar 10–15 menit bada Maghrib atau Subuh bersama keluarga.`
    );
    if (sisaJuz > 0) {
      rekomendasiBulanDepan.push(
        `Menjaga keistiqamahan ananda untuk menuntaskan sisa ${sisaJuz} Juz menuju target ${targetJuz} Juz${
          payload.inProgressInfo ? ` (saat ini sedang fokus pada ${payload.inProgressInfo})` : ''
        }.`
      );
    } else {
      rekomendasiBulanDepan.push(
        `Alhamdulillah target ${targetJuz} Juz telah tercapai! Mohon doa dan dukungan Ayah/Bunda untuk persiapan ujian Tasmi' bil-ghoib ananda.`
      );
    }
  } else {
    if (newLembar < 2.5) {
      rekomendasiBulanDepan.push(
        'Tingkatkan ritme setoran hafalan baru minimal 1 halaman penuh (0.5 Lembar) setiap sesi agar target 2.5 Lembar/pekan tercapai.'
      );
    } else {
      rekomendasiBulanDepan.push(
        `Pertahankan kecepatan setoran baru (+${newLembar} Lembar bulan ini) sambil menjaga kelancaran bacaan.`
      );
    }

    if (murojaCount === 0) {
      rekomendasiBulanDepan.push(
        'Jadwalkan sesi khusus muroja\'ah minimal 1–2 kali sepekan agar juz yang telah dihafal tidak mudah lupa.'
      );
    } else {
      rekomendasiBulanDepan.push(
        'Lanjutkan rutinitas muroja\'ah berurutan sebelum menambah ayat baru di setiap sesi halaqah.'
      );
    }

    if (sisaJuz > 0) {
      rekomendasiBulanDepan.push(
        `Fokus menuntaskan sisa ${sisaJuz} Juz lagi untuk mencapai target ${targetJuz} Juz${
          payload.inProgressInfo ? ` (melanjutkan ${payload.inProgressInfo})` : ''
        }.`
      );
    } else {
      rekomendasiBulanDepan.push(
        `Alhamdulillah target ${targetJuz} Juz telah tuntas! Fokuskan pada persiapan ujian Tasmi' bil-ghoib.`
      );
    }
  }

  const doaMotivasi =
    style === 'wali'
      ? `Jazakumullahu khairan katsiran kepada Ayah/Bunda atas kerja sama dan doanya. Semoga Allah SWT senantiasa memudahkan ananda ${name} menjadi Hafidz/Hafidzah yang berakhlak mulia.`
      : `Semoga Allah SWT senantiasa memudahkan lisan dan hati ${name} dalam menghafal serta mengamalkan Al-Qur'an.`;

  // Format teks rapi untuk disalin / dikirim ke WhatsApp
  const whatsappText = [
    `*LAPORAN RANGKUMAN HAFALAN 1 BULAN*`,
    `• *Nama Santri:* ${name} (${kelas} · ${kelompok})`,
    `• *Periode:* ${period}`,
    `• *Status Evaluasi:* ${predikatBulanIni}`,
    `• *Total Hafalan:* ${totalJuz} / ${targetJuz} Juz (${progressPct}%)`,
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
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  // Endpoint Generator Rangkuman Capaian 1 Bulan Santri
  app.post('/api/gemini/monthly-summary', async (req, res) => {
    const payload: MonthlySummaryPayload = req.body || {};
    const baseReport = buildStructuredMonthlyReport(payload);

    const rawApiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
    const isUsableApiKey =
      Boolean(rawApiKey) &&
      rawApiKey !== 'MY_GEMINI_API_KEY' &&
      !rawApiKey.startsWith('YOUR_');

    if (!isUsableApiKey) {
      res.json({
        report: baseReport,
        summary: baseReport.whatsappText,
        source: 'smart-engine',
      });
      return;
    }

    try {
      const ai = getGenAIClient(rawApiKey);
      const styleLabel =
        payload.style === 'wali'
          ? 'Laporan santun & hangat untuk Wali Santri (Ayah/Bunda)'
          : payload.style === 'evaluasi'
          ? 'Evaluasi teknis pembina tahfidz (fokus tajwid, kelancaran, dan target lembar)'
          : 'Ringkas, padat, dan langsung pada poin utama';

      const prompt = `Buat rangkuman evaluasi capaian tahfidz 1 bulan (${payload.periodLabel || '1 Bulan Terakhir'}) yang SANGAT MUDAH DIBACA, kalimatnya pendek-pendek, jelas, dan tidak bertele-tele.
Gaya Bahasa: ${styleLabel}

Data Santri:
- Nama: ${payload.studentName} (${payload.kelasNama} · ${payload.kelompokNama})
- Capaian Kumulatif: ${payload.totalJuzMemorized} Juz (${payload.lembarText}) dari Target ${payload.targetJuz} Juz (${payload.progressPct}%)
- Statistik 1 Bulan: ${payload.monthlyStats?.totalSetoran ?? 0}x setoran (${payload.monthlyStats?.baruCount ?? 0}x Hafalan Baru, ${payload.monthlyStats?.murojaCount ?? 0}x Muroja'ah, ${payload.monthlyStats?.perbaikanCount ?? 0}x Perbaikan)
- Tambahan Hafalan Baru: +${payload.monthlyStats?.newLembar ?? 0} Lembar (${payload.monthlyStats?.newPages ?? 0} Halaman Mushaf Utsmani)
- Kualitas Dominan: ${payload.monthlyStats?.dominantQuality || 'A (Mumtaz)'}
- Kehadiran: ${payload.monthlyStats?.attendancePct ?? 100}%
- Catatan Perilaku: ${payload.behaviorNotes || 'Baik dan tertib'}
- Daftar Setoran: ${JSON.stringify((payload.depositItems || []).slice(0, 8))}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              predikatBulanIni: { type: Type.STRING },
              ringkasanUtama: { type: Type.STRING },
              poinCapaian: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    judul: { type: Type.STRING },
                    isi: { type: Type.STRING },
                  },
                  required: ['judul', 'isi'],
                },
              },
              rekomendasiBulanDepan: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              doaMotivasi: { type: Type.STRING },
            },
            required: [
              'predikatBulanIni',
              'ringkasanUtama',
              'poinCapaian',
              'rekomendasiBulanDepan',
              'doaMotivasi',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed && parsed.ringkasanUtama && Array.isArray(parsed.poinCapaian)) {
        const whatsappText = [
          `*LAPORAN RANGKUMAN HAFALAN 1 BULAN*`,
          `• *Nama Santri:* ${payload.studentName} (${payload.kelasNama} · ${payload.kelompokNama})`,
          `• *Periode:* ${payload.periodLabel}`,
          `• *Status Evaluasi:* ${parsed.predikatBulanIni || baseReport.predikatBulanIni}`,
          `• *Total Hafalan:* ${payload.totalJuzMemorized} / ${payload.targetJuz} Juz (${payload.progressPct}%)`,
          ``,
          `*Ringkasan:*`,
          parsed.ringkasanUtama,
          ``,
          `*Poin Evaluasi 1 Bulan:*`,
          ...parsed.poinCapaian.map((p: any) => `• *${p.judul}:* ${p.isi}`),
          ``,
          `*Fokus & Saran Bulan Depan:*`,
          ...(parsed.rekomendasiBulanDepan || []).map((r: string) => `• ${r}`),
          ``,
          `_${parsed.doaMotivasi || baseReport.doaMotivasi}_`,
        ].join('\n');

        res.json({
          report: {
            ...parsed,
            whatsappText,
          },
          summary: whatsappText,
          source: 'gemini',
        });
        return;
      }

      res.json({
        report: baseReport,
        summary: baseReport.whatsappText,
        source: 'smart-engine',
      });
    } catch {
      res.json({
        report: baseReport,
        summary: baseReport.whatsappText,
        source: 'smart-engine',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
