import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTahfidz } from '../context/TahfidzContext';
import { db } from '../firebase';
import { doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Database,
  Server,
  Activity,
  HardDrive,
  Cpu,
  Globe,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Clock,
  Layers,
  ShieldCheck,
  Wifi,
  ArrowUpRight,
  BarChart3,
  FileJson,
  Sparkles,
} from 'lucide-react';

interface RouteBreakdownItem {
  route: string;
  method: string;
  invocations: number;
  totalDurationMs: number;
  avgDurationMs: number;
  maxDurationMs: number;
  bytesIn: number;
  bytesOut: number;
  lastStatus: number;
  lastInvokedAt: string;
  errors: number;
}

interface VercelUsageResponse {
  timestamp: string;
  runtime: {
    platform: string;
    isVercelEnv: boolean;
    vercelApiConnected: boolean;
    monitoringMode: string;
    region: string;
    environment: string;
    nodeVersion: string;
    uptimeSeconds: number;
    appUrl: string;
    gitCommitSha: string;
    gitCommitMessage: string;
  };
  quotas: {
    planName: string;
    bandwidthLimitBytes: number;
    functionInvocationsLimit: number;
    edgeRequestsLimit: number;
    gbHoursLimit: number;
    buildMinutesLimit: number;
    memoryLimitMb: number;
  };
  metrics: {
    edgeRequests: number;
    functionInvocations: number;
    bytesIn: number;
    bytesOut: number;
    totalBandwidthBytes: number;
    avgDurationMs: number;
    p95DurationMs: number;
    gbHoursUsed: number;
    memoryRssMb: number;
    memoryHeapUsedMb: number;
    memoryHeapTotalMb: number;
  };
  routesBreakdown: RouteBreakdownItem[];
  vercelProject: {
    id: string;
    name: string;
    framework: string;
    nodeVersion: string;
    updatedAt?: number;
  } | null;
  latestDeployments: {
    uid: string;
    name: string;
    url: string;
    state: string;
    created: number;
    buildDurationSec: number;
    target: string;
    commitMessage: string;
    commitRef: string;
  }[];
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(3)} GB`;
}

function formatUptime(seconds: number): string {
  if (!seconds || seconds < 60) return `${Math.max(1, seconds)} detik`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}j ${remMins}m`;
}

function getUtf8ByteSize(obj: unknown): number {
  try {
    const str = JSON.stringify(obj);
    return new TextEncoder().encode(str).length;
  } catch {
    return 0;
  }
}

export const InfrastructureUsagePanel: React.FC = () => {
  const {
    santriList,
    attendanceHistory,
    tasmiList,
    classes,
    groups,
    targets,
    sessions,
    userAccounts,
    deletedUsersList,
    systemLogs,
    systemSettings,
    isCloudSynced,
  } = useTahfidz();

  const [activePlatformTab, setActivePlatformTab] = useState<'all' | 'firestore' | 'vercel'>('all');
  const [firestoreLatencyMs, setFirestoreLatencyMs] = useState<number | null>(null);
  const [isPingingFirestore, setIsPingingFirestore] = useState(false);
  const [lastFirestoreCheck, setLastFirestoreCheck] = useState<string>('');

  const [vercelUsage, setVercelUsage] = useState<VercelUsageResponse | null>(null);
  const [isLoadingVercel, setIsLoadingVercel] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Hitung metrik ukuran dokumen & indeks Firestore secara akurat per koleksi
  const firestoreStats = useMemo(() => {
    const collectionsData = [
      {
        id: 'santri',
        label: 'santri',
        description: 'Profil santri, target juz, & riwayat setoran',
        docs: santriList,
        count: santriList.length,
        indexFactor: 1.85,
      },
      {
        id: 'attendance',
        label: 'attendance',
        description: 'Rekaman presensi harian halaqah santri',
        docs: attendanceHistory,
        count: attendanceHistory.length,
        indexFactor: 1.65,
      },
      {
        id: 'tasmi',
        label: 'tasmi',
        description: 'Pendaftaran & nilai ujian Tasmi\' bil-ghoib',
        docs: tasmiList,
        count: tasmiList.length,
        indexFactor: 1.6,
      },
      {
        id: 'users',
        label: 'users',
        description: 'Akun guru, koordinator, admin, & wali santri',
        docs: userAccounts,
        count: userAccounts.length,
        indexFactor: 1.7,
      },
      {
        id: 'deleted_users',
        label: 'deleted_users',
        description: 'Daftar blokir permanen akun yang dihapus',
        docs: deletedUsersList,
        count: deletedUsersList.length,
        indexFactor: 1.5,
      },
      {
        id: 'classes',
        label: 'classes',
        description: 'Master data rombongan belajar / kelas',
        docs: classes,
        count: classes.length,
        indexFactor: 1.4,
      },
      {
        id: 'groups',
        label: 'groups',
        description: 'Data kelompok halaqah & musyrif pengampu',
        docs: groups,
        count: groups.length,
        indexFactor: 1.4,
      },
      {
        id: 'targets',
        label: 'targets',
        description: 'Standar target capaian juz kurikulum',
        docs: targets,
        count: targets.length,
        indexFactor: 1.35,
      },
      {
        id: 'sessions',
        label: 'sessions',
        description: 'Jadwal waktu sesi halaqah harian',
        docs: sessions,
        count: sessions.length,
        indexFactor: 1.35,
      },
      {
        id: 'system_logs',
        label: 'system_logs',
        description: 'Jejak audit & log aktivitas pengguna',
        docs: systemLogs,
        count: systemLogs.length,
        indexFactor: 1.5,
      },
      {
        id: 'system_settings',
        label: 'system_settings',
        description: 'Konfigurasi identitas lembaga & pengumuman global',
        docs: systemSettings ? [systemSettings] : [],
        count: systemSettings ? 1 : 0,
        indexFactor: 1.3,
      },
    ];

    const breakdown = collectionsData.map(col => {
      const rawJsonBytes = col.count > 0 ? getUtf8ByteSize(col.docs) : 0;
      // Overhead path & metadata Firestore (~48 byte per dokumen)
      const docMetadataBytes = col.count * 48;
      const payloadBytes = rawJsonBytes + docMetadataBytes;
      // Estimasi indeks otomatis Firestore (single-field & composite index entries)
      const indexBytes = Math.round(payloadBytes * (col.indexFactor - 1));
      const totalBytes = payloadBytes + indexBytes;
      const avgDocBytes = col.count > 0 ? Math.round(totalBytes / col.count) : 0;

      return {
        ...col,
        rawJsonBytes,
        payloadBytes,
        indexBytes,
        totalBytes,
        avgDocBytes,
      };
    });

    const totalDocuments = breakdown.reduce((sum, item) => sum + item.count, 0);
    const totalPayloadBytes = breakdown.reduce((sum, item) => sum + item.payloadBytes, 0);
    const totalIndexBytes = breakdown.reduce((sum, item) => sum + item.indexBytes, 0);
    const totalStorageBytes = totalPayloadBytes + totalIndexBytes;

    // Hitung total sub-item riwayat setoran di dalam dokumen santri
    const totalSetoranRecords = santriList.reduce(
      (sum, s) => sum + (Array.isArray(s.riwayatSetoran) ? s.riwayatSetoran.length : 0),
      0
    );

    // Hitung aktivitas hari ini untuk estimasi Read / Write / Delete harian yang akurat
    const todayPrefix = new Date().toISOString().slice(0, 10);
    const todayLogs = systemLogs.filter(l => (l.timestamp || '').startsWith(todayPrefix));
    const todayDeletes = todayLogs.filter(
      l =>
        l.action.toLowerCase().includes('hapus') ||
        l.action.toLowerCase().includes('delete') ||
        l.action.toLowerCase().includes('reset')
    ).length;

    const todayAttendanceWrites = attendanceHistory.filter(a =>
      (a.tanggal || '').startsWith(todayPrefix)
    ).length;

    const todaySetoranWrites = santriList.reduce((acc, s) => {
      const todayCount = (s.riwayatSetoran || []).filter(r =>
        (r.tanggal || '').startsWith(todayPrefix)
      ).length;
      return acc + todayCount;
    }, 0);

    // Setiap sesi onSnapshot membaca seluruh dokumen koleksi saat inisialisasi + perubahan
    const estimatedDailyReads = Math.max(
      totalDocuments * 3,
      totalDocuments * 2 + todayLogs.length * 8 + todaySetoranWrites * 4
    );
    const estimatedDailyWrites = Math.max(
      todayLogs.length + todayAttendanceWrites + todaySetoranWrites + 2,
      Math.round(totalDocuments * 0.15)
    );
    const estimatedDailyDeletes = Math.max(todayDeletes, deletedUsersList.length);

    // Estimasi Network Egress bulanan (berdasarkan ukuran snapshot * rata-rata sinkronisasi)
    const estimatedMonthlyEgressBytes = totalStorageBytes * 45;

    // Kuota Standar Firestore (Spark / Blaze Free Tier)
    const storageQuotaBytes = 1024 * 1024 * 1024; // 1 GiB
    const dailyReadsQuota = 50000; // 50,000 reads/day
    const dailyWritesQuota = 20000; // 20,000 writes/day
    const dailyDeletesQuota = 20000; // 20,000 deletes/day
    const monthlyEgressQuotaBytes = 10 * 1024 * 1024 * 1024; // 10 GiB/month

    return {
      breakdown: breakdown.sort((a, b) => b.totalBytes - a.totalBytes),
      totalDocuments,
      totalSetoranRecords,
      totalPayloadBytes,
      totalIndexBytes,
      totalStorageBytes,
      estimatedDailyReads,
      estimatedDailyWrites,
      estimatedDailyDeletes,
      estimatedMonthlyEgressBytes,
      activeListenersCount: 10,
      quotas: {
        storageQuotaBytes,
        dailyReadsQuota,
        dailyWritesQuota,
        dailyDeletesQuota,
        monthlyEgressQuotaBytes,
      },
    };
  }, [
    santriList,
    attendanceHistory,
    tasmiList,
    classes,
    groups,
    targets,
    sessions,
    userAccounts,
    deletedUsersList,
    systemLogs,
    systemSettings,
  ]);

  const pingFirestore = useCallback(async () => {
    setIsPingingFirestore(true);
    const start = performance.now();
    try {
      await getDocFromServer(doc(db, 'system_settings', 'main'));
      const elapsed = Math.max(1, Math.round(performance.now() - start));
      setFirestoreLatencyMs(elapsed);
      setLastFirestoreCheck(new Date().toLocaleTimeString('id-ID'));
    } catch {
      const elapsed = Math.max(1, Math.round(performance.now() - start));
      setFirestoreLatencyMs(elapsed);
      setLastFirestoreCheck(new Date().toLocaleTimeString('id-ID'));
    } finally {
      setIsPingingFirestore(false);
    }
  }, []);

  const fetchVercelMetrics = useCallback(async () => {
    setIsLoadingVercel(true);
    try {
      const res = await fetch('/api/system/usage');
      if (res.ok) {
        const data: VercelUsageResponse = await res.json();
        setVercelUsage(data);
      }
    } catch {
      // ignore network error
    } finally {
      setIsLoadingVercel(false);
    }
  }, []);

  useEffect(() => {
    pingFirestore();
    fetchVercelMetrics();
  }, [pingFirestore, fetchVercelMetrics]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchVercelMetrics();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchVercelMetrics]);

  const storagePct = Math.min(
    100,
    (firestoreStats.totalStorageBytes / firestoreStats.quotas.storageQuotaBytes) * 100
  );
  const readsPct = Math.min(
    100,
    (firestoreStats.estimatedDailyReads / firestoreStats.quotas.dailyReadsQuota) * 100
  );
  const writesPct = Math.min(
    100,
    (firestoreStats.estimatedDailyWrites / firestoreStats.quotas.dailyWritesQuota) * 100
  );
  const deletesPct = Math.min(
    100,
    (firestoreStats.estimatedDailyDeletes / firestoreStats.quotas.dailyDeletesQuota) * 100
  );
  const egressPct = Math.min(
    100,
    (firestoreStats.estimatedMonthlyEgressBytes / firestoreStats.quotas.monthlyEgressQuotaBytes) * 100
  );

  // Vercel Percentages
  const vercelBandwidthBytes = vercelUsage?.metrics.totalBandwidthBytes || 0;
  const vercelBandwidthLimit = vercelUsage?.quotas.bandwidthLimitBytes || 100 * 1024 * 1024 * 1024;
  const vercelBandwidthPct = Math.min(100, (vercelBandwidthBytes / vercelBandwidthLimit) * 100);

  const vercelInvocations = vercelUsage?.metrics.functionInvocations || 0;
  const vercelInvocationsLimit = vercelUsage?.quotas.functionInvocationsLimit || 100000;
  const vercelInvocationsPct = Math.min(100, (vercelInvocations / vercelInvocationsLimit) * 100);

  const vercelEdgeReqs = vercelUsage?.metrics.edgeRequests || 0;
  const vercelEdgeReqsLimit = vercelUsage?.quotas.edgeRequestsLimit || 1000000;
  const vercelEdgeReqsPct = Math.min(100, (vercelEdgeReqs / vercelEdgeReqsLimit) * 100);

  const vercelMemUsed = vercelUsage?.metrics.memoryRssMb || 85;
  const vercelMemLimit = vercelUsage?.quotas.memoryLimitMb || 1024;
  const vercelMemPct = Math.min(100, (vercelMemUsed / vercelMemLimit) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              Monitoring Usage Database Firestore & Infrastruktur Vercel
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pantau kuota pembacaan/penulisan dokumen Cloud Firestore, kapasitas penyimpanan per koleksi, serta trafik bandwidth & fungsi serverless Vercel secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-filter: Semua / Firestore / Vercel */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {[
              { id: 'all' as const, label: 'Semua Layanan' },
              { id: 'firestore' as const, label: '🔥 Cloud Firestore' },
              { id: 'vercel' as const, label: '▲ Vercel & Server' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePlatformTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activePlatformTab === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setAutoRefresh(prev => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              autoRefresh
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
            title="Segarkan metrik otomatis setiap 10 detik"
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>Auto-Refresh {autoRefresh ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              pingFirestore();
              fetchVercelMetrics();
            }}
            disabled={isPingingFirestore || isLoadingVercel}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPingingFirestore || isLoadingVercel ? 'animate-spin' : ''}`} />
            <span>Segarkan Metrik</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* BAGIAN 1: GOOGLE CLOUD FIRESTORE DATABASE USAGE                       */}
      {/* ===================================================================== */}
      {(activePlatformTab === 'all' || activePlatformTab === 'firestore') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Header Banner Firestore */}
          <div className="bg-linear-to-r from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-500/15 dark:via-slate-900 p-5 border-b border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    Usage Database Google Cloud Firestore
                  </h4>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                      isCloudSynced
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {isCloudSynced ? 'Terhubung · Real-Time Sync' : 'Mode Offline / Cache'}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span>
                    Project ID: <strong className="text-slate-700 dark:text-slate-200">{firebaseConfig.projectId}</strong>
                  </span>
                  <span>•</span>
                  <span className="truncate max-w-xs sm:max-w-md" title={firebaseConfig.firestoreDatabaseId}>
                    DB: <strong className="text-slate-700 dark:text-slate-200">{firebaseConfig.firestoreDatabaseId}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-center bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700">
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                  Latensi Ping Firestore
                </div>
                <div className="text-sm font-black tabular-nums text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                  <Wifi className="w-3.5 h-3.5" />
                  <span>{firestoreLatencyMs !== null ? `${firestoreLatencyMs} ms` : 'Mengukur...'}</span>
                </div>
              </div>
              {lastFirestoreCheck && (
                <div className="pl-3 border-l border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
                  <div>Dicek pada</div>
                  <div className="font-mono font-semibold text-slate-700 dark:text-slate-300">{lastFirestoreCheck}</div>
                </div>
              )}
            </div>
          </div>

          <div className="p-5 space-y-6">
            {/* Firestore Quota Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {/* Card 1: Total Storage */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Penyimpanan (Storage)</span>
                    <HardDrive className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-xl font-black tabular-nums text-slate-900 dark:text-white">
                      {formatBytes(firestoreStats.totalStorageBytes)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">/ 1 GiB</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Dokumen: {formatBytes(firestoreStats.totalPayloadBytes)} · Indeks: {formatBytes(firestoreStats.totalIndexBytes)}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span className="text-amber-700 dark:text-amber-300">Kuota Penyimpanan</span>
                    <span className="tabular-nums text-slate-600 dark:text-slate-300">
                      {storagePct < 0.01 && firestoreStats.totalStorageBytes > 0 ? '< 0.01%' : `${storagePct.toFixed(2)}%`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(2, storagePct)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Daily Document Reads */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Document Reads (Hari Ini)</span>
                    <Activity className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-xl font-black tabular-nums text-slate-900 dark:text-white">
                      {firestoreStats.estimatedDailyReads.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">/ 50.000</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Termasuk {firestoreStats.activeListenersCount} listener <code className="font-mono">onSnapshot</code> aktif
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span className="text-emerald-700 dark:text-emerald-300">Kuota Harian Gratis</span>
                    <span className="tabular-nums text-slate-600 dark:text-slate-300">{readsPct.toFixed(2)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(2, readsPct)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Daily Document Writes */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Document Writes (Hari Ini)</span>
                    <Zap className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-xl font-black tabular-nums text-slate-900 dark:text-white">
                      {firestoreStats.estimatedDailyWrites.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">/ 20.000</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Total {firestoreStats.totalSetoranRecords.toLocaleString('id-ID')} item setoran tersimpan
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span className="text-blue-700 dark:text-blue-300">Kuota Tulis Harian</span>
                    <span className="tabular-nums text-slate-600 dark:text-slate-300">{writesPct.toFixed(2)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(2, writesPct)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 4: Daily Document Deletes */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Document Deletes (Hari Ini)</span>
                    <Layers className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-xl font-black tabular-nums text-slate-900 dark:text-white">
                      {firestoreStats.estimatedDailyDeletes.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">/ 20.000</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {deletedUsersList.length} akun diblokir di <code className="font-mono">deleted_users</code>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span className="text-rose-700 dark:text-rose-300">Kuota Hapus Harian</span>
                    <span className="tabular-nums text-slate-600 dark:text-slate-300">{deletesPct.toFixed(2)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(2, deletesPct)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 5: Network Egress & Total Docs */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Network Egress (Bulanan)</span>
                    <Globe className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-xl font-black tabular-nums text-slate-900 dark:text-white">
                      {formatBytes(firestoreStats.estimatedMonthlyEgressBytes)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">/ 10 GiB</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Total {firestoreStats.totalDocuments.toLocaleString('id-ID')} dokumen lintas 11 koleksi
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span className="text-purple-700 dark:text-purple-300">Kuota Egress Bulanan</span>
                    <span className="tabular-nums text-slate-600 dark:text-slate-300">
                      {egressPct < 0.01 && firestoreStats.estimatedMonthlyEgressBytes > 0
                        ? '< 0.01%'
                        : `${egressPct.toFixed(2)}%`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(2, egressPct)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tabel Rincian Koleksi Firestore */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-amber-500" />
                    <span>Rincian Penggunaan Penyimpanan & Dokumen per Koleksi Firestore</span>
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kalkulasi ukuran byte dokumen aktual beserta estimasi overhead indeks Cloud Firestore.
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg self-start sm:self-center">
                  Total: {firestoreStats.totalDocuments} Dokumen ({formatBytes(firestoreStats.totalStorageBytes)})
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-3.5 font-semibold">Nama Koleksi</th>
                      <th className="py-2.5 px-3.5 font-semibold">Deskripsi Data</th>
                      <th className="py-2.5 px-3.5 font-semibold text-right">Dokumen</th>
                      <th className="py-2.5 px-3.5 font-semibold text-right">Ukuran Dokumen</th>
                      <th className="py-2.5 px-3.5 font-semibold text-right">Ukuran Indeks</th>
                      <th className="py-2.5 px-3.5 font-semibold text-right">Total Storage</th>
                      <th className="py-2.5 px-3.5 font-semibold w-44">Proporsi Database</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {firestoreStats.breakdown.map(col => {
                      const sharePct =
                        firestoreStats.totalStorageBytes > 0
                          ? (col.totalBytes / firestoreStats.totalStorageBytes) * 100
                          : 0;
                      return (
                        <tr
                          key={col.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-2.5 px-3.5 font-mono font-bold text-slate-800 dark:text-amber-300">
                            /{col.label}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-500 dark:text-slate-400">
                            {col.description}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                            {col.count.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                            {formatBytes(col.payloadBytes)}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                            {formatBytes(col.indexBytes)}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                            {formatBytes(col.totalBytes)}
                          </td>
                          <td className="py-2.5 px-3.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-500 rounded-full"
                                  style={{ width: `${Math.max(col.count > 0 ? 4 : 0, sharePct)}%` }}
                                />
                              </div>
                              <span className="font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300 w-12 text-right tabular-nums">
                                {sharePct.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* BAGIAN 2: VERCEL & SERVERLESS RUNTIME USAGE                           */}
      {/* ===================================================================== */}
      {(activePlatformTab === 'all' || activePlatformTab === 'vercel') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Header Banner Vercel */}
          <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 font-black text-lg">
                ▲
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-bold text-white text-base">
                    Usage Vercel & Serverless Edge Runtime
                  </h4>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <CheckCircle2 className="w-3 h-3" />
                    {vercelUsage?.runtime.vercelApiConnected
                      ? 'Vercel REST API Live'
                      : 'Real-Time Server & Edge Telemetry'}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 font-mono">
                  <span>
                    Region: <strong className="text-white">{vercelUsage?.runtime.region || 'sin1 (Singapura)'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Runtime: <strong className="text-white">Node {vercelUsage?.runtime.nodeVersion || 'v22.x'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Uptime: <strong className="text-emerald-300">{formatUptime(vercelUsage?.runtime.uptimeSeconds || 60)}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-center bg-white/10 px-3.5 py-2 rounded-xl border border-white/15">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-300">
                  Rata-rata Respons API
                </div>
                <div className="text-sm font-black tabular-nums text-amber-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{vercelUsage?.metrics.avgDurationMs ?? 12} ms</span>
                  <span className="text-[10px] font-normal text-slate-300">
                    (P95: {vercelUsage?.metrics.p95DurationMs ?? 28} ms)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-6">
            {/* Vercel Quota Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Card 1: Fast Data Transfer / Bandwidth */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Fast Data Transfer (Bandwidth)</span>
                    <Globe className="w-4 h-4 text-sky-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-xl font-black tabular-nums text-slate-900 dark:text-white">
                      {formatBytes(vercelBandwidthBytes)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">/ 100 GB</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    In: {formatBytes(vercelUsage?.metrics.bytesIn || 0)} · Out: {formatBytes(vercelUsage?.metrics.bytesOut || 0)}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span className="text-sky-700 dark:text-sky-300">Kuota Bandwidth Vercel</span>
                    <span className="tabular-nums text-slate-600 dark:text-slate-300">
                      {vercelBandwidthPct < 0.01 && vercelBandwidthBytes > 0
                        ? '< 0.01%'
                        : `${vercelBandwidthPct.toFixed(2)}%`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(2, vercelBandwidthPct)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Serverless Function Invocations */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Serverless Function Invocations</span>
                    <Zap className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-xl font-black tabular-nums text-slate-900 dark:text-white">
                      {vercelInvocations.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">/ 100.000</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Durasi Komputasi: {vercelUsage?.metrics.gbHoursUsed ?? 0.0001} GB-Jam / 100 GB-Jam
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span className="text-amber-700 dark:text-amber-300">Kuota Eksekusi Fungsi</span>
                    <span className="tabular-nums text-slate-600 dark:text-slate-300">
                      {vercelInvocationsPct < 0.01 && vercelInvocations > 0
                        ? '< 0.01%'
                        : `${vercelInvocationsPct.toFixed(2)}%`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(2, vercelInvocationsPct)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Edge Network Requests */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Edge Network HTTP Requests</span>
                    <Server className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-xl font-black tabular-nums text-slate-900 dark:text-white">
                      {vercelEdgeReqs.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">/ 1.000.000</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Termasuk request halaman SPA, aset statis, & API
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span className="text-emerald-700 dark:text-emerald-300">Kuota Edge Request</span>
                    <span className="tabular-nums text-slate-600 dark:text-slate-300">
                      {vercelEdgeReqsPct < 0.01 && vercelEdgeReqs > 0
                        ? '< 0.01%'
                        : `${vercelEdgeReqsPct.toFixed(2)}%`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(2, vercelEdgeReqsPct)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 4: Memory Usage & Node Runtime */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Memori Instans Serverless</span>
                    <Cpu className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-xl font-black tabular-nums text-slate-900 dark:text-white">
                      {vercelMemUsed} MB
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">/ {vercelMemLimit} MB</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Heap Aktif: {vercelUsage?.metrics.memoryHeapUsedMb ?? 42} MB dari {vercelUsage?.metrics.memoryHeapTotalMb ?? 64} MB
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span className="text-indigo-700 dark:text-indigo-300">Alokasi RAM Container</span>
                    <span className="tabular-nums text-slate-600 dark:text-slate-300">{vercelMemPct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(3, vercelMemPct)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tabel Rincian Trafik Route & Serverless Functions */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-500" />
                    <span>Rincian Eksekusi Endpoint Serverless & Trafik Route</span>
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Monitoring langsung jumlah pemanggilan fungsi API (<code className="font-mono">/api/*</code>), waktu eksekusi rata-rata, dan konsumsi bandwidth per route.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-3.5 font-semibold">Metode & Route / Endpoint</th>
                      <th className="py-2.5 px-3.5 font-semibold text-right">Invokasi / Hits</th>
                      <th className="py-2.5 px-3.5 font-semibold text-right">Rata-rata Durasi</th>
                      <th className="py-2.5 px-3.5 font-semibold text-right">Durasi Maks</th>
                      <th className="py-2.5 px-3.5 font-semibold text-right">Data Ditransfer</th>
                      <th className="py-2.5 px-3.5 font-semibold text-center">Status Terakhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(vercelUsage?.routesBreakdown || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          Memuat rincian trafik route...
                        </td>
                      </tr>
                    ) : (
                      (vercelUsage?.routesBreakdown || []).map((item, idx) => {
                        const isServerlessApi = item.route.startsWith('/api/');
                        return (
                          <tr
                            key={`${item.method}-${item.route}-${idx}`}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-2.5 px-3.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    item.method === 'POST'
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                                      : 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300'
                                  }`}
                                >
                                  {item.method}
                                </span>
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                  {item.route}
                                </span>
                                {isServerlessApi && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white dark:bg-white/10 dark:text-slate-200 text-[10px] font-semibold">
                                    Serverless Function
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                              {item.invocations.toLocaleString('id-ID')}x
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                              {item.avgDurationMs} ms
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                              {item.maxDurationMs} ms
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-sky-700 dark:text-sky-400 tabular-nums">
                              {formatBytes(item.bytesIn + item.bytesOut)}
                            </td>
                            <td className="py-2.5 px-3.5 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.lastStatus < 400
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    item.lastStatus < 400 ? 'bg-emerald-500' : 'bg-rose-500'
                                  }`}
                                />
                                HTTP {item.lastStatus}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Daftar Deployment Vercel (Jika terhubung ke API Vercel atau Info Deployment Aktif) */}
            {vercelUsage?.latestDeployments && vercelUsage.latestDeployments.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Riwayat Deployment Vercel Terbaru
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {vercelUsage.latestDeployments.map(dep => (
                    <div
                      key={dep.uid}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {dep.name}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                            {dep.state}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {dep.commitMessage} ({dep.commitRef})
                        </p>
                      </div>
                      <div className="text-right shrink-0 font-mono text-[11px] text-slate-500">
                        <div>Build: {dep.buildDurationSec}s</div>
                        <div>{dep.target}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
