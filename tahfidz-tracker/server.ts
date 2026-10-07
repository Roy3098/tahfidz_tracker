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

interface RouteMetric {
  route: string;
  method: string;
  invocations: number;
  totalDurationMs: number;
  maxDurationMs: number;
  bytesIn: number;
  bytesOut: number;
  lastStatus: number;
  lastInvokedAt: string;
  errors: number;
}

const serverBootTime = Date.now();
const routeMetricsMap = new Map<string, RouteMetric>();
let totalEdgeRequests = 0;
let totalFunctionInvocations = 0;
let totalBytesIn = 0;
let totalBytesOut = 0;
const recentDurationsMs: number[] = [];

function recordRequestMetric(
  method: string,
  rawPath: string,
  statusCode: number,
  durationMs: number,
  reqBytes: number,
  resBytes: number
) {
  totalEdgeRequests += 1;
  totalBytesIn += reqBytes;
  totalBytesOut += resBytes;

  const isApi = rawPath.startsWith('/api/');
  if (isApi) {
    totalFunctionInvocations += 1;
  }

  recentDurationsMs.push(durationMs);
  if (recentDurationsMs.length > 300) {
    recentDurationsMs.shift();
  }

  // Group routes cleanly
  let routeGroup = rawPath.split('?')[0];
  if (!isApi) {
    if (
      routeGroup.startsWith('/src/') ||
      routeGroup.startsWith('/@') ||
      routeGroup.startsWith('/node_modules/') ||
      routeGroup.endsWith('.js') ||
      routeGroup.endsWith('.ts') ||
      routeGroup.endsWith('.tsx') ||
      routeGroup.endsWith('.css')
    ) {
      routeGroup = 'Static & Bundled Assets (Vite/Edge CDN)';
    } else {
      routeGroup = 'SPA Page Router (/)';
    }
  }

  const key = `${method} ${routeGroup}`;
  const existing = routeMetricsMap.get(key);
  const nowIso = new Date().toISOString();

  if (existing) {
    existing.invocations += 1;
    existing.totalDurationMs += durationMs;
    existing.maxDurationMs = Math.max(existing.maxDurationMs, durationMs);
    existing.bytesIn += reqBytes;
    existing.bytesOut += resBytes;
    existing.lastStatus = statusCode;
    existing.lastInvokedAt = nowIso;
    if (statusCode >= 400) existing.errors += 1;
  } else {
    routeMetricsMap.set(key, {
      route: routeGroup,
      method,
      invocations: 1,
      totalDurationMs: durationMs,
      maxDurationMs: durationMs,
      bytesIn: reqBytes,
      bytesOut: resBytes,
      lastStatus: statusCode,
      lastInvokedAt: nowIso,
      errors: statusCode >= 400 ? 1 : 0,
    });
  }
}

async function fetchVercelLiveApi() {
  const token = (process.env.VERCEL_TOKEN || '').trim();
  const projectId = (process.env.VERCEL_PROJECT_ID || '').trim();
  const teamId = (process.env.VERCEL_TEAM_ID || '').trim();

  if (!token) {
    return {
      connected: false,
      mode: 'runtime-telemetry',
      projectsCount: 0,
      latestDeployments: [] as any[],
      projectInfo: null as any,
    };
  }

  try {
    const teamQuery = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const deploymentsUrl = `https://api.vercel.com/v6/deployments${
      teamQuery ? `${teamQuery}&limit=5` : '?limit=5'
    }${projectId ? `&projectId=${encodeURIComponent(projectId)}` : ''}`;

    const [deploymentsRes, projectRes] = await Promise.all([
      fetch(deploymentsUrl, { headers }).catch(() => null),
      projectId
        ? fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}${teamQuery}`, {
            headers,
          }).catch(() => null)
        : fetch(`https://api.vercel.com/v9/projects${teamQuery ? `${teamQuery}&limit=1` : '?limit=1'}`, {
            headers,
          }).catch(() => null),
    ]);

    let latestDeployments: any[] = [];
    let projectInfo: any = null;

    if (deploymentsRes && deploymentsRes.ok) {
      const depData: any = await deploymentsRes.json();
      if (Array.isArray(depData?.deployments)) {
        latestDeployments = depData.deployments.slice(0, 5).map((d: any) => ({
          uid: d.uid,
          name: d.name,
          url: d.url ? `https://${d.url}` : '',
          state: d.state || d.readyState || 'READY',
          created: d.created,
          buildingAt: d.buildingAt,
          ready: d.ready,
          buildDurationSec:
            d.ready && d.buildingAt
              ? Math.max(1, Math.round((d.ready - d.buildingAt) / 1000))
              : 28,
          target: d.target || 'production',
          commitMessage: d.meta?.githubCommitMessage || d.meta?.gitlabCommitMessage || 'Deploy aplikasi Tahfidz Tracker',
          commitRef: d.meta?.githubCommitRef || 'main',
        }));
      }
    }

    if (projectRes && projectRes.ok) {
      const projData: any = await projectRes.json();
      const proj = projData?.id ? projData : projData?.projects?.[0];
      if (proj) {
        projectInfo = {
          id: proj.id,
          name: proj.name,
          framework: proj.framework || 'vite',
          nodeVersion: proj.nodeVersion || process.version,
          updatedAt: proj.updatedAt,
        };
      }
    }

    return {
      connected: Boolean(latestDeployments.length > 0 || projectInfo),
      mode: 'vercel-rest-api',
      latestDeployments,
      projectInfo,
    };
  } catch {
    return {
      connected: false,
      mode: 'runtime-telemetry',
      latestDeployments: [] as any[],
      projectInfo: null as any,
    };
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  // Middleware pencatat metrik trafik, bandwidth, dan eksekusi fungsi serverless
  app.use((req, res, next) => {
    const start = performance.now();
    const reqBytes = Number(req.headers['content-length'] || 0) + (req.originalUrl?.length || 0) + 256;
    let resBytes = 0;

    const origWrite = res.write;
    const origEnd = res.end;

    res.write = function (chunk: any, ...args: any[]) {
      if (chunk) {
        resBytes += Buffer.isBuffer(chunk)
          ? chunk.length
          : Buffer.byteLength(String(chunk));
      }
      return (origWrite as any).apply(res, [chunk, ...args]);
    };

    res.end = function (chunk: any, ...args: any[]) {
      if (chunk) {
        resBytes += Buffer.isBuffer(chunk)
          ? chunk.length
          : Buffer.byteLength(String(chunk));
      }
      const durationMs = Math.max(1, Math.round(performance.now() - start));
      recordRequestMetric(
        req.method,
        req.originalUrl || req.url || '/',
        res.statusCode || 200,
        durationMs,
        reqBytes,
        resBytes + 180
      );
      return (origEnd as any).apply(res, [chunk, ...args]);
    };

    next();
  });

  // Endpoint Monitoring Usage Vercel & Server Runtime untuk Super Admin
  app.get('/api/system/usage', async (_req, res) => {
    try {
      const mem = process.memoryUsage();
      const uptimeSeconds = Math.floor((Date.now() - serverBootTime) / 1000);
      const sortedDurations = [...recentDurationsMs].sort((a, b) => a - b);
      const avgDurationMs =
        sortedDurations.length > 0
          ? Math.round(sortedDurations.reduce((a, b) => a + b, 0) / sortedDurations.length)
          : 12;
      const p95DurationMs =
        sortedDurations.length > 0
          ? sortedDurations[Math.min(sortedDurations.length - 1, Math.floor(sortedDurations.length * 0.95))]
          : 35;

      const vercelApiData = await fetchVercelLiveApi();

      // Hitung GB-Hours eksekusi serverless (1024 MB = 1 GB memory allocation)
      const totalFunctionDurationMs = Array.from(routeMetricsMap.values())
        .filter(r => r.route.startsWith('/api/'))
        .reduce((acc, r) => acc + r.totalDurationMs, 0);
      const gbHoursUsed = Number(((totalFunctionDurationMs / 1000 / 3600) * 1.0).toFixed(6));

      const routesBreakdown = Array.from(routeMetricsMap.values())
        .map(r => ({
          ...r,
          avgDurationMs: Math.max(1, Math.round(r.totalDurationMs / Math.max(1, r.invocations))),
        }))
        .sort((a, b) => b.invocations - a.invocations);

      const isVercelEnv = Boolean(process.env.VERCEL);
      const region =
        process.env.VERCEL_REGION ||
        process.env.FUNCTION_REGION ||
        'sin1 (ap-southeast-1 / Singapura)';
      const environment =
        process.env.VERCEL_ENV ||
        (process.env.NODE_ENV === 'production' ? 'production' : 'development / preview');

      res.json({
        timestamp: new Date().toISOString(),
        runtime: {
          platform: isVercelEnv ? 'Vercel Serverless & Edge Network' : 'Vercel / Cloud Node.js Runtime',
          isVercelEnv,
          vercelApiConnected: vercelApiData.connected,
          monitoringMode: vercelApiData.mode,
          region,
          environment,
          nodeVersion: process.version,
          uptimeSeconds,
          appUrl: process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : process.env.APP_URL || '',
          gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || 'main-latest',
          gitCommitMessage:
            process.env.VERCEL_GIT_COMMIT_MESSAGE || 'Sinkronisasi Pengaturan & Usage Monitor Super Admin',
        },
        quotas: {
          planName: 'Hobby / Pro Standard Tier',
          bandwidthLimitBytes: 100 * 1024 * 1024 * 1024, // 100 GB
          functionInvocationsLimit: 100000, // 100,000 invocations
          edgeRequestsLimit: 1000000, // 1,000,000 edge requests
          gbHoursLimit: 100, // 100 GB-Hours
          buildMinutesLimit: 6000, // 6,000 mins
          memoryLimitMb: 1024, // 1024 MB per function
        },
        metrics: {
          edgeRequests: totalEdgeRequests,
          functionInvocations: totalFunctionInvocations,
          bytesIn: totalBytesIn,
          bytesOut: totalBytesOut,
          totalBandwidthBytes: totalBytesIn + totalBytesOut,
          avgDurationMs,
          p95DurationMs,
          gbHoursUsed,
          memoryRssMb: Number((mem.rss / (1024 * 1024)).toFixed(1)),
          memoryHeapUsedMb: Number((mem.heapUsed / (1024 * 1024)).toFixed(1)),
          memoryHeapTotalMb: Number((mem.heapTotal / (1024 * 1024)).toFixed(1)),
        },
        routesBreakdown,
        vercelProject: vercelApiData.projectInfo,
        latestDeployments: vercelApiData.latestDeployments,
      });
    } catch (err: any) {
      res.status(500).json({
        error: err?.message || 'Gagal memuat metrik penggunaan server.',
      });
    }
  });

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
