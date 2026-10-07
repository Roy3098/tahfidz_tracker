import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  Sparkles, 
  Flame, 
  BarChart3, 
  Activity, 
  Award,
  CheckCircle2
} from 'lucide-react';
import { Santri, AttendanceRecord, HafalanEntry } from '../types';
import { useTodayWIB, shiftDateString, formatDateIsoId } from '../utils/dateWIB';
import { usePersistedState } from '../utils/usePersistedState';

interface SetoranTrendChartProps {
  santriList: Santri[];
  attendanceHistory?: AttendanceRecord[];
}

interface DailyTrendItem {
  dateKey: string;
  dayLabel: string;
  dateShort: string;
  fullDateFormatted: string;
  baru: number;
  murojaah: number;
  total: number;
  entries: {
    studentName: string;
    surahName: string;
    type: string;
    kualitas: string;
  }[];
}

export const SetoranTrendChart: React.FC<SetoranTrendChartProps> = ({
  santriList,
  attendanceHistory = []
}) => {
  const [chartType, setChartType] = usePersistedState<'bar' | 'area'>('tahfidz_filter_dashboard_chart_type', 'bar');
  const todayWIB = useTodayWIB();

  // Compute 7-day trend data
  const { trendData, totalDepositsWeek, avgPerDay, mostActiveDay, baruCount, murojaahCount } = useMemo(() => {
    // 1. Gather all setoran entries across students
    interface FlattenedEntry {
      studentName: string;
      tanggal: string;
      type: 'baru' | 'muroja' | 'perbaikan';
      surahName: string;
      kualitas: string;
    }

    const allEntries: FlattenedEntry[] = [];

    santriList.forEach(student => {
      (student.hafalanList || []).forEach(h => {
        if (h.tanggal) {
          allEntries.push({
            studentName: student.nama,
            tanggal: h.tanggal,
            type: h.type || 'baru',
            surahName: h.surahName || `Juz ${h.juz}`,
            kualitas: h.kualitas || 'A'
          });
        }
      });

      // Also incorporate terakhirSetor if available and not redundant
      if (student.terakhirSetor?.tanggal) {
        const dateStr = student.terakhirSetor.tanggal;
        const exists = allEntries.some(
          e => e.studentName === student.nama && e.tanggal === dateStr
        );
        if (!exists) {
          allEntries.push({
            studentName: student.nama,
            tanggal: dateStr,
            type: 'baru',
            surahName: student.terakhirSetor.surah || `Juz ${student.terakhirSetor.juz}`,
            kualitas: 'A'
          });
        }
      }
    });

    // Also gather from attendanceHistory hafalan deposits if any
    attendanceHistory.forEach(att => {
      if (att.hafalanDeposit && att.tanggal) {
        const dep = att.hafalanDeposit;
        allEntries.push({
          studentName: att.studentName,
          tanggal: att.tanggal,
          type: dep.type || 'baru',
          surahName: dep.surahName || `Juz ${dep.juz}`,
          kualitas: dep.kualitas || 'A'
        });
      }
    });

    // 2. Determine anchor date (latest date among entries or today in WIB)
    const sortedDates = allEntries.map(e => e.tanggal).filter(Boolean).sort();
    const todayStr = todayWIB;
    const latestRecordedDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : todayStr;
    const anchorDateStr = latestRecordedDate > todayStr ? latestRecordedDate : todayStr;

    // 3. Generate array of 7 consecutive dates leading up to anchor in WIB
    const days: DailyTrendItem[] = [];

    for (let i = 6; i >= 0; i--) {
      const isoDate = shiftDateString(anchorDateStr, -i);
      const dayName = formatDateIsoId(isoDate, { weekday: 'short' });
      const dateShort = formatDateIsoId(isoDate, { day: 'numeric', month: 'short' });
      const fullDateFormatted = formatDateIsoId(isoDate, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      // Filter entries matching this date
      const matching = allEntries.filter(e => e.tanggal === isoDate);
      const baru = matching.filter(e => e.type === 'baru').length;
      const murojaah = matching.filter(e => e.type === 'muroja' || e.type === 'perbaikan').length;

      days.push({
        dateKey: isoDate,
        dayLabel: `${dayName}`,
        dateShort,
        fullDateFormatted,
        baru,
        murojaah,
        total: matching.length,
        entries: matching.map(m => ({
          studentName: m.studentName,
          surahName: m.surahName,
          type: m.type === 'baru' ? 'Hafalan Baru' : 'Muroja\'ah',
          kualitas: m.kualitas
        }))
      });
    }

    // Calculate aggregated metrics
    const totalDepositsWeek = days.reduce((acc, d) => acc + d.total, 0);
    const avgPerDay = (totalDepositsWeek / 7).toFixed(1);
    const baruCount = days.reduce((acc, d) => acc + d.baru, 0);
    const murojaahCount = days.reduce((acc, d) => acc + d.murojaah, 0);

    let mostActive = days[0];
    days.forEach(d => {
      if (d.total > (mostActive?.total || 0)) {
        mostActive = d;
      }
    });

    return {
      trendData: days,
      totalDepositsWeek,
      avgPerDay,
      mostActiveDay: mostActive,
      baruCount,
      murojaahCount
    };
  }, [santriList, attendanceHistory, todayWIB]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: DailyTrendItem = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 sm:p-3.5 rounded-2xl shadow-xl border border-slate-700/80 text-xs min-w-[200px] z-50 animate-in fade-in duration-100">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
            <span>{data.fullDateFormatted}</span>
            <span className="text-emerald-400 font-bold">{data.total} Setoran</span>
          </div>

          <div className="space-y-1 mb-2">
            <div className="flex items-center justify-between text-emerald-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                Hafalan Baru:
              </span>
              <span className="font-bold">{data.baru}</span>
            </div>
            <div className="flex items-center justify-between text-sky-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                Muroja'ah / Ulang:
              </span>
              <span className="font-bold">{data.murojaah}</span>
            </div>
          </div>

          {data.entries.length > 0 && (
            <div className="pt-1.5 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-400 block mb-1 font-semibold uppercase tracking-wider">
                Santri Setor ({data.entries.length}):
              </span>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1 text-[11px]">
                {data.entries.slice(0, 4).map((ent, i) => (
                  <div key={i} className="flex items-center justify-between text-slate-300 truncate">
                    <span className="truncate max-w-[110px]">{ent.studentName}</span>
                    <span className="text-slate-400 text-[10px] truncate">{ent.surahName}</span>
                  </div>
                ))}
                {data.entries.length > 4 && (
                  <div className="text-[10px] text-slate-400 italic">
                    +{data.entries.length - 4} santri lainnya
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs text-slate-800 dark:text-slate-100 transition-colors">
      
      {/* Top Header of Chart Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
            <TrendingUp className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight flex items-center gap-2">
              <span>Tren Setoran Hafalan 1 Minggu Terakhir</span>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/70 dark:border-emerald-800">
                7 Hari
              </span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Grafik fluktuasi setoran harian (Hafalan Baru & Muroja'ah)
            </p>
          </div>
        </div>

        {/* Chart View Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs self-start sm:self-auto border border-slate-200/60 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              chartType === 'bar'
                ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Batang</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('area')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              chartType === 'area'
                ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Area Tren</span>
          </button>
        </div>
      </div>

      {/* 4 Mini Stat Badges for the Week */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
        <div className="bg-slate-50/80 dark:bg-slate-800/60 p-2.5 sm:p-3 rounded-xl border border-slate-200/70 dark:border-slate-700">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Total Setoran Pekan Ini</span>
          <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {totalDepositsWeek} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">kali</span>
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
            Konsisten tercatat
          </span>
        </div>

        <div className="bg-slate-50/80 dark:bg-slate-800/60 p-2.5 sm:p-3 rounded-xl border border-slate-200/70 dark:border-slate-700">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Rata-Rata Harian</span>
          <span className="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {avgPerDay} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ hari</span>
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Target: 4+ setoran
          </span>
        </div>

        <div className="bg-slate-50/80 dark:bg-slate-800/60 p-2.5 sm:p-3 rounded-xl border border-slate-200/70 dark:border-slate-700">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Hafalan Baru</span>
          <span className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {baruCount} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">setor</span>
          </span>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium block mt-0.5">
            {totalDepositsWeek > 0 ? Math.round((baruCount / totalDepositsWeek) * 100) : 0}% porsi baru
          </span>
        </div>

        <div className="bg-slate-50/80 dark:bg-slate-800/60 p-2.5 sm:p-3 rounded-xl border border-slate-200/70 dark:border-slate-700">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Muroja'ah / Ulang</span>
          <span className="text-lg sm:text-xl font-bold text-sky-600 dark:text-sky-400 tabular-nums">
            {murojaahCount} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">setor</span>
          </span>
          <span className="text-[10px] text-sky-700 dark:text-sky-300 font-medium block mt-0.5">
            {totalDepositsWeek > 0 ? Math.round((murojaahCount / totalDepositsWeek) * 100) : 0}% penguatan
          </span>
        </div>
      </div>

      {/* Main Visual Chart Container */}
      <div className="h-64 sm:h-72 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart
              data={trendData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
              <XAxis 
                dataKey="dayLabel" 
                tickLine={false} 
                axisLine={{ stroke: '#94a3b8', opacity: 0.3 }}
                tick={({ x, y, payload }) => {
                  const item = trendData[payload.index];
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text x={0} y={12} textAnchor="middle" className="fill-slate-700 dark:fill-slate-300" fontSize={11} fontWeight={600}>
                        {payload.value}
                      </text>
                      <text x={0} y={24} textAnchor="middle" className="fill-slate-400 dark:fill-slate-500" fontSize={9.5}>
                        {item?.dateShort}
                      </text>
                    </g>
                  );
                }}
              />
              <YAxis 
                allowDecimals={false} 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 12, fontSize: 11 }}
                formatter={(value) => (
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    {value === 'baru' ? 'Hafalan Baru' : 'Muroja\'ah'}
                  </span>
                )}
              />
              <Bar 
                dataKey="baru" 
                name="baru" 
                fill="#10b981" 
                radius={[6, 6, 0, 0]} 
                stackId="stack"
              />
              <Bar 
                dataKey="murojaah" 
                name="murojaah" 
                fill="#0284c7" 
                radius={[6, 6, 0, 0]} 
                stackId="stack"
              />
            </BarChart>
          ) : (
            <AreaChart
              data={trendData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorMurojaah" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
              <XAxis 
                dataKey="dayLabel" 
                tickLine={false} 
                axisLine={{ stroke: '#94a3b8', opacity: 0.3 }}
                tick={({ x, y, payload }) => {
                  const item = trendData[payload.index];
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text x={0} y={12} textAnchor="middle" className="fill-slate-700 dark:fill-slate-300" fontSize={11} fontWeight={600}>
                        {payload.value}
                      </text>
                      <text x={0} y={24} textAnchor="middle" className="fill-slate-400 dark:fill-slate-500" fontSize={9.5}>
                        {item?.dateShort}
                      </text>
                    </g>
                  );
                }}
              />
              <YAxis 
                allowDecimals={false} 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 12, fontSize: 11 }}
                formatter={(value) => (
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    {value === 'total' ? 'Total Setoran' : 'Muroja\'ah'}
                  </span>
                )}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                name="total" 
                stroke="#10b981" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorTotal)" 
              />
              <Area 
                type="monotone" 
                dataKey="murojaah" 
                name="murojaah" 
                stroke="#0284c7" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorMurojaah)" 
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Insight Footer */}
      {mostActiveDay && mostActiveDay.total > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>
              Hari teraktif: <strong>{mostActiveDay.fullDateFormatted}</strong> ({mostActiveDay.total} setoran tercatat).
            </span>
          </div>
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Monitoring Real-time Aktif</span>
          </span>
        </div>
      )}

    </div>
  );
};
