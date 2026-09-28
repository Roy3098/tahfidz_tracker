import React, { useState } from 'react';
import { 
  CalendarDays, 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  X, 
  BookOpen, 
  Award, 
  TrendingUp,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { Santri, Kelompok, AttendanceRecord } from '../types';

interface AbsensiMonthlyViewProps {
  isParent: boolean;
  child: Santri | null;
  santriList: Santri[];
  groups: Kelompok[];
  attendanceHistory: AttendanceRecord[];
  selectedMonth: number;
  selectedYear: number;
  monthData: {
    monthName: string;
    year: number;
    monthRecords: AttendanceRecord[];
    totalRecorded: number;
    onTime: number;
    late: number;
    absent: number;
    monthAttendancePct: number;
    setoranCount: number;
  };
}

export const AbsensiMonthlyView: React.FC<AbsensiMonthlyViewProps> = ({
  isParent,
  child,
  santriList,
  groups,
  attendanceHistory,
  monthData
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const selectedGroupObj = groups.find(g => g.id === selectedGroup || g.nama === selectedGroup);

  // Filter students
  const visibleStudents = santriList.filter(s => {
    if (selectedGroup !== 'all') {
      const match = selectedGroupObj
        ? (s.kelompokId === selectedGroupObj.id || s.kelompokNama === selectedGroupObj.nama)
        : (s.kelompokId === selectedGroup || s.kelompokNama === selectedGroup);
      if (!match) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.nama.toLowerCase().includes(q);
      const matchKelas = s.kelasNama.toLowerCase().includes(q);
      if (!matchName && !matchKelas) return false;
    }

    return true;
  });

  const getStudentMonthStats = (student: Santri) => {
    const records = monthData.monthRecords.filter(r => r.studentId === student.id);
    const onTime = records.filter(r => r.status === 'hadir_tepat').length;
    const late = records.filter(r => r.status === 'hadir_terlambat').length;
    const absent = records.filter(r => r.status === 'tidak_hadir').length;
    const total = records.length;
    const deposits = records.filter(r => !!r.hafalanDeposit).length;
    const pct = total > 0 ? Math.round(((onTime + late * 0.8) / total) * 100) : (student.kehadiranPersen || 95);
    const predikat = pct >= 90 ? 'Mumtaz (A)' : pct >= 75 ? 'Jayyid (B)' : 'Perlu Pembinaan';
    return {
      records,
      onTime,
      late,
      absent,
      total,
      deposits,
      pct,
      predikat
    };
  };

  const mumtazCount = visibleStudents.filter(s => getStudentMonthStats(s).pct >= 90).length;

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      
      {/* 4 Monthly KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Rata-Rata Kehadiran</span>
            <span className="text-xl sm:text-2xl font-bold text-blue-700 tabular-nums">
              {monthData.monthAttendancePct}%
            </span>
            <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">
              Bulan {monthData.monthName} {monthData.year}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Sesi Terjadwal</span>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
              {monthData.totalRecorded} <span className="text-xs font-normal text-slate-500">sesi</span>
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
              {monthData.onTime} hadir tepat waktu
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Santri Mumtaz (≥90%)</span>
            <span className="text-xl sm:text-2xl font-bold text-emerald-700 tabular-nums">
              {mumtazCount} <span className="text-xs font-normal text-slate-400">/ {visibleStudents.length}</span>
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
              Disiplin tinggi bulan ini
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Setoran Hafalan Bulanan</span>
            <span className="text-xl sm:text-2xl font-bold text-purple-700 tabular-nums">
              {monthData.setoranCount} <span className="text-xs font-normal text-slate-500">kali</span>
            </span>
            <span className="text-[10px] text-purple-600 font-semibold block mt-0.5">
              Tercatat di absensi
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* PARENT VIEW (IF LOGGED IN AS PARENT) */}
      {isParent && child ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Rekap Kehadiran Bulanan: {child.nama}
              </h3>
              <p className="text-xs text-slate-500">
                Bulan: {monthData.monthName} {monthData.year}
              </p>
            </div>
            <span className="px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-bold border border-blue-200 self-start sm:self-auto">
              Tingkat Kehadiran: {getStudentMonthStats(child).pct}% ({getStudentMonthStats(child).predikat})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Sesi Diikuti</span>
              <span className="text-lg font-bold text-slate-800">{getStudentMonthStats(child).total} Sesi</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
              <span className="text-[11px] text-emerald-800 block">Hadir Tepat</span>
              <span className="text-lg font-bold text-emerald-700">{getStudentMonthStats(child).onTime} Sesi</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
              <span className="text-[11px] text-amber-800 block">Terlambat</span>
              <span className="text-lg font-bold text-amber-700">{getStudentMonthStats(child).late} Sesi</span>
            </div>
            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
              <span className="text-[11px] text-rose-800 block">Tidak Hadir</span>
              <span className="text-lg font-bold text-rose-700">{getStudentMonthStats(child).absent} Sesi</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Persentase Kehadiran Bulanan:</span>
              <span className="font-bold text-blue-700">{getStudentMonthStats(child).pct}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${getStudentMonthStats(child).pct}%` }} 
              />
            </div>
          </div>
        </div>
      ) : (
        /* GURU / ADMIN VIEW: MONTHLY RECAP TABLE */
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3.5">
          
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari santri di rekap bulanan..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Halaqah Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
              <button
                type="button"
                onClick={() => setSelectedGroup('all')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                  selectedGroup === 'all'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Halaqah
              </button>
              {groups.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGroup(g.id)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                    selectedGroup === g.id
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {g.nama}
                </button>
              ))}
            </div>
          </div>

          {/* Monthly Recap Table */}
          <div className="overflow-x-auto border border-slate-200/90 rounded-2xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-3 min-w-[150px]">Santri</th>
                  <th className="py-3 px-3 min-w-[95px]">Halaqah</th>
                  <th className="py-3 px-2 text-center text-emerald-800 min-w-[65px]">Tepat</th>
                  <th className="py-3 px-2 text-center text-amber-800 min-w-[65px]">Terlambat</th>
                  <th className="py-3 px-2 text-center text-rose-800 min-w-[65px]">Absen</th>
                  <th className="py-3 px-2 text-center text-purple-800 min-w-[65px]">Setoran</th>
                  <th className="py-3 px-3 text-center min-w-[110px]">% Bulanan</th>
                  <th className="py-3 px-3 text-center min-w-[100px]">Predikat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Tidak ada santri yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  visibleStudents.map((student, idx) => {
                    const stats = getStudentMonthStats(student);
                    const predikatColor = stats.pct >= 90 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : stats.pct >= 75 
                      ? 'bg-blue-50 text-blue-800 border-blue-200' 
                      : 'bg-amber-50 text-amber-800 border-amber-200';

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 text-center font-semibold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block truncate">{student.nama}</span>
                          <span className="text-[10px] text-slate-400 block">{student.kelasNama}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium text-[11px] text-slate-700">
                            {student.kelompokNama}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-emerald-700">
                          {stats.onTime}
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-amber-700">
                          {stats.late}
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-rose-700">
                          {stats.absent}
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-purple-700">
                          {stats.deposits > 0 ? `${stats.deposits}x` : '-'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-bold text-slate-800 tabular-nums w-8 text-right">
                              {stats.pct}%
                            </span>
                            <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${stats.pct >= 90 ? 'bg-emerald-500' : stats.pct >= 75 ? 'bg-blue-500' : 'bg-amber-500'}`} 
                                style={{ width: `${stats.pct}%` }} 
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${predikatColor}`}>
                            {stats.predikat}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
            <span>Rekap kehadiran bulanan mencakup seluruh sesi harian di bulan {monthData.monthName} {monthData.year}.</span>
            <span className="text-emerald-700 font-medium">Standar Kehadiran: Min. 75%</span>
          </div>

        </div>
      )}

    </div>
  );
};
