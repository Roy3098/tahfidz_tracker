import React, { useState } from 'react';
import { 
  CalendarCheck, 
  Users, 
  Search, 
  Filter, 
  Check, 
  Clock, 
  X, 
  BookOpen, 
  Award, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import { Santri, Kelompok, AttendanceRecord } from '../types';

interface AbsensiWeeklyViewProps {
  isParent: boolean;
  child: Santri | null;
  santriList: Santri[];
  groups: Kelompok[];
  attendanceHistory: AttendanceRecord[];
  weekData: {
    days: {
      dateIso: string;
      dayName: string;
      fullDayName: string;
      dateLabel: string;
      fullFormatted: string;
    }[];
    weekStartStr: string;
    weekEndStr: string;
    weekLabel: string;
    weekRecords: AttendanceRecord[];
    totalWeekSessions: number;
    onTime: number;
    late: number;
    absent: number;
    weekAttendancePct: number;
    setoranWeekCount: number;
  };
}

export const AbsensiWeeklyView: React.FC<AbsensiWeeklyViewProps> = ({
  isParent,
  child,
  santriList,
  groups,
  attendanceHistory,
  weekData
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null);

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

  const getStudentDayRecord = (studentId: string, dateIso: string) => {
    return attendanceHistory.find(a => a.studentId === studentId && a.tanggal === dateIso);
  };

  const getStudentWeekStats = (student: Santri) => {
    const records = weekData.days
      .map(d => getStudentDayRecord(student.id, d.dateIso))
      .filter(Boolean) as AttendanceRecord[];
    const onTime = records.filter(r => r.status === 'hadir_tepat').length;
    const late = records.filter(r => r.status === 'hadir_terlambat').length;
    const absent = records.filter(r => r.status === 'tidak_hadir').length;
    const total = records.length;
    const pct = total > 0 ? Math.round(((onTime + late * 0.8) / total) * 100) : (student.kehadiranPersen || 95);
    const deposits = records.filter(r => !!r.hafalanDeposit).length;
    return {
      records,
      onTime,
      late,
      absent,
      total,
      pct,
      deposits
    };
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      
      {/* 4 Weekly KPI Summary Cards - Hanya untuk Guru & Admin */}
      {!isParent && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Rata-Rata Kehadiran</span>
              <span className="text-xl sm:text-2xl font-bold text-teal-700 dark:text-teal-400 tabular-nums">
                {weekData.weekAttendancePct}%
              </span>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold block mt-0.5">
                Pekan: {weekData.weekStartStr} - {weekData.weekEndStr}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Sesi Terlaksana</span>
              <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {weekData.totalWeekSessions} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">sesi</span>
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
                {weekData.onTime} hadir tepat waktu
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Terlambat & Izin</span>
              <span className="text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                {weekData.late} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">terlambat</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                {weekData.absent} sesi tidak hadir
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Setoran Hafalan Pekan Ini</span>
              <span className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                {weekData.setoranWeekCount} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">kali</span>
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
                Tercatat pada absensi
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* PARENT VIEW (IF LOGGED IN AS PARENT) */}
      {isParent && child ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Rekap Kehadiran Mingguan: {child.nama}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pekan: {weekData.weekLabel}
              </p>
            </div>
            <span className="px-3 py-1 bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 rounded-full text-xs font-bold border border-teal-200 dark:border-teal-800 self-start sm:self-auto">
              Kehadiran Pekan Ini: {getStudentWeekStats(child).pct}%
            </span>
          </div>

          {/* 7 Days Card Grid for Child */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {weekData.days.map((day) => {
              const rec = getStudentDayRecord(child.id, day.dateIso);
              const isPresent = rec?.status === 'hadir_tepat';
              const isLate = rec?.status === 'hadir_terlambat';
              const isAbsent = rec?.status === 'tidak_hadir';

              const badgeColor = isPresent 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' 
                : isLate 
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200' 
                : isAbsent 
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200' 
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400';

              return (
                <div
                  key={day.dateIso}
                  onClick={() => setSelectedDayIso(prev => prev === day.dateIso ? null : day.dateIso)}
                  className={`p-3 rounded-2xl border text-center flex flex-col justify-between cursor-pointer transition-all ${badgeColor} ${
                    selectedDayIso === day.dateIso ? 'ring-2 ring-teal-500 shadow-xs' : 'hover:opacity-90'
                  }`}
                >
                  <div>
                    <span className="text-[11px] font-bold block">{day.dayName}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{day.dateLabel}</span>
                  </div>
                  <div className="my-2 flex justify-center">
                    {isPresent ? (
                      <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                        ✔
                      </span>
                    ) : isLate ? (
                      <span className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                        ⏱
                      </span>
                    ) : isAbsent ? (
                      <span className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                        ✖
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">-</span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold block truncate">
                    {isPresent ? 'Hadir' : isLate ? 'Telat' : isAbsent ? 'Tidak Hadir' : 'Libur'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Detail Hafalan & Catatan Perilaku Saat Kartu Hari Diklik */}
          {selectedDayIso && (() => {
            const selRec = getStudentDayRecord(child.id, selectedDayIso);
            const selDayObj = weekData.days.find(d => d.dateIso === selectedDayIso);
            const fallbackHafalan = (child.hafalanList || []).find(h => h.tanggal === selectedDayIso);
            const deposit = selRec?.hafalanDeposit || (fallbackHafalan ? {
              type: fallbackHafalan.type,
              juz: fallbackHafalan.juz,
              surahName: fallbackHafalan.surahName,
              ayatMulai: fallbackHafalan.ayatMulai,
              ayatSelesai: fallbackHafalan.ayatSelesai,
              lembar: fallbackHafalan.lembar,
              kualitas: fallbackHafalan.kualitas,
              catatan: fallbackHafalan.catatan
            } : undefined);

            return (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-teal-300 dark:border-teal-700 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    Detail Kehadiran: {selDayObj?.fullFormatted || selectedDayIso}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedDayIso(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-xs cursor-pointer"
                  >
                    ✕ Tutup
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/70 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                      Detail Hafalan Disetorkan
                    </span>
                    {deposit ? (
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          Juz {deposit.juz} · {deposit.surahName}
                          {deposit.ayatMulai && deposit.ayatSelesai ? ` (Ayat ${deposit.ayatMulai}-${deposit.ayatSelesai})` : ''}
                        </p>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                          Nilai {deposit.kualitas} · {deposit.type === 'baru' ? 'Hafalan Baru' : "Muroja'ah"}
                        </p>
                        {deposit.catatan && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">"{deposit.catatan}"</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-500 dark:text-slate-400 italic">
                        Belum ada setoran hafalan yang tercatat pada hari ini.
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/70 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                      Catatan Perilaku & Kehadiran
                    </span>
                    {selRec?.catatanPerilaku ? (
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{selRec.catatanPerilaku}</p>
                    ) : (
                      <p className="text-slate-500 dark:text-slate-400 italic">
                        Tidak ada catatan perilaku khusus pada hari ini.
                      </p>
                    )}
                    {selRec?.keterangan && (
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 pt-1">
                        <strong>Keterangan:</strong> {selRec.keterangan}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-100 block">Evaluasi Keaktifan Pekanan:</span>
            <p>
              Ananda {child.nama} telah mengikuti {getStudentWeekStats(child).total} sesi halaqah pada pekan ini dengan persentase kehadiran <strong>{getStudentWeekStats(child).pct}%</strong>.
            </p>
          </div>
        </div>
      ) : (
        /* GURU / ADMIN VIEW: 7-DAY WEEKLY MATRIX TABLE */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3.5 transition-colors">
          
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari santri di tabel mingguan..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Halaqah Filter Chips */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setSelectedGroup('all')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer text-center ${
                  selectedGroup === 'all'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Semua Halaqah
              </button>
              {groups.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGroup(g.id)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer text-center truncate ${
                    selectedGroup === g.id
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {g.nama}
                </button>
              ))}
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto border border-slate-200/90 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-3 min-w-[140px]">Santri</th>
                  <th className="py-3 px-2 min-w-[90px]">Halaqah</th>
                  {weekData.days.map(d => (
                    <th key={d.dateIso} className="py-3 px-2 text-center min-w-[50px]">
                      <div>{d.dayName}</div>
                      <div className="text-[9px] font-normal text-slate-400 dark:text-slate-500">{d.dateLabel}</div>
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center min-w-[80px]">Total Hadir</th>
                  <th className="py-3 px-3 text-center min-w-[90px]">% Pekan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleStudents.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      Tidak ada santri yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  visibleStudents.map((student, idx) => {
                    const stats = getStudentWeekStats(student);

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-400 dark:text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 dark:text-slate-100 block truncate">{student.nama}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{student.kelasNama}</span>
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium text-[11px] text-slate-700 dark:text-slate-300">
                            {student.kelompokNama}
                          </span>
                        </td>

                        {/* 7 Days Cells */}
                        {weekData.days.map(d => {
                          const rec = getStudentDayRecord(student.id, d.dateIso);
                          const isPresent = rec?.status === 'hadir_tepat';
                          const isLate = rec?.status === 'hadir_terlambat';
                          const isAbsent = rec?.status === 'tidak_hadir';

                          return (
                            <td key={d.dateIso} className="py-2 px-1 text-center">
                              {isPresent ? (
                                <span 
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]" 
                                  title={`Hadir Tepat${rec?.hafalanDeposit ? ` (Setor: ${rec.hafalanDeposit.surahName})` : ''}`}
                                >
                                  ✔
                                </span>
                              ) : isLate ? (
                                <span 
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold text-[11px]" 
                                  title="Hadir Terlambat"
                                >
                                  ⏱
                                </span>
                              ) : isAbsent ? (
                                <span 
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-bold text-[11px]" 
                                  title="Tidak Hadir"
                                >
                                  ✖
                                </span>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600 font-medium">-</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Total Hadir */}
                        <td className="py-2.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                          {stats.onTime + stats.late} / {Math.max(stats.total, 1)}
                        </td>

                        {/* % Pekan */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-bold text-teal-800 dark:text-teal-400 tabular-nums w-8 text-right">
                              {stats.pct}%
                            </span>
                            <div className="w-10 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${stats.pct >= 90 ? 'bg-emerald-500' : stats.pct >= 75 ? 'bg-teal-500' : 'bg-amber-500'}`} 
                                style={{ width: `${stats.pct}%` }} 
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 pt-1">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-[9px]">✔</span>
                Hadir Tepat
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-[9px]">⏱</span>
                Terlambat
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 flex items-center justify-center font-bold text-[9px]">✖</span>
                Tidak Hadir
              </span>
            </div>
            <span>Matriks Kehadiran Mingguan Terintegrasi Real-time</span>
          </div>

        </div>
      )}

    </div>
  );
};
