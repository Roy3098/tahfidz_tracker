import React, { useState } from 'react';
import { useTahfidz } from '../context/TahfidzContext';
import { 
  Plus, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight,
  Edit3, 
  BookOpen, 
  CheckCircle2, 
  UserCheck, 
  Calendar,
  Layers,
  Sparkles,
  Trash2,
  MessageSquare,
  AlertTriangle,
  SlidersHorizontal,
  Bookmark,
  Hash,
  Check,
  Printer,
  Target,
  Award,
  FileText,
  MessageCircle,
  Users,
  GraduationCap,
  Star,
  Clock,
  Filter
} from 'lucide-react';
import { Santri, HafalanEntry } from '../types';
import { parseHafalan, formatRemainingTarget } from '../utils/hafalanFormat';
import { getStudentQuranProgress } from '../utils/studentQuranProgress';
import { EditHafalanModal } from './EditHafalanModal';
import { AddHafalanModal } from './AddHafalanModal';
import { EditSingleHafalanModal } from './EditSingleHafalanModal';
import { DirectEditHafalanModal } from './DirectEditHafalanModal';
import { StudentQuranDetailModal } from './StudentQuranDetailModal';
import { RiwayatSetoranModal } from './RiwayatSetoranModal';
import { RangkumanBulananModal } from './RangkumanBulananModal';
import { CetakLaporanModal } from './CetakLaporanModal';
import { KirimPesanWAModal } from './KirimPesanWAModal';
import { FeatureHint } from './FeatureHint';

export const HafalanView: React.FC = () => {
  const { 
    santriList, 
    groups, 
    currentUser, 
    setActiveTab, 
    updateHafalanRecord, 
    deleteHafalanRecord,
    parentChildren,
    switchParentActiveChild
  } = useTahfidz();

  const isParent = currentUser?.role === 'parent';
  const [parentViewChildId, setParentViewChildId] = useState<string>('all');
  const [selectedStudentForWa, setSelectedStudentForWa] = useState<Santri | null>(null);

  const [genderFilter, setGenderFilter] = useState<'all' | 'santriwan' | 'santriwati'>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);

  // Modals state
  const [isCetakModalOpen, setIsCetakModalOpen] = useState(false);
  const [selectedStudentForQuranDetail, setSelectedStudentForQuranDetail] = useState<Santri | null>(null);
  const [selectedStudentForRiwayat, setSelectedStudentForRiwayat] = useState<Santri | null>(null);
  const [selectedStudentForRangkuman, setSelectedStudentForRangkuman] = useState<Santri | null>(null);
  const [selectedStudentForDirectEdit, setSelectedStudentForDirectEdit] = useState<Santri | null>(null);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<Santri | null>(null);
  const [editHafalanInitialTab, setEditHafalanInitialTab] = useState<'setoran' | 'keterangan_juz_surat'>('keterangan_juz_surat');
  const [selectedStudentForAdd, setSelectedStudentForAdd] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<{ student: Santri; record: HafalanEntry } | null>(null);

  // Filter students (Tanpa filter perjuz dan tanpa filter mode)
  const filteredStudents = santriList.filter(student => {
    if (genderFilter !== 'all' && student.gender !== genderFilter) return false;
    if (groupFilter !== 'all' && student.kelompokNama !== groupFilter && student.kelompokId !== groupFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = student.nama.toLowerCase().includes(q);
      const matchClass = student.kelasNama.toLowerCase().includes(q);
      const matchGroup = student.kelompokNama.toLowerCase().includes(q);
      const prog = getStudentQuranProgress(student);
      const matchSurah = prog.memorizedSurahs.some(s => s.name.toLowerCase().includes(q));
      if (!matchName && !matchClass && !matchGroup && !matchSurah) return false;
    }
    return true;
  });

  const parentChildIds = new Set(parentChildren.map(c => c.id));

  // Sort students: if parent, children are ALWAYS placed at the top of the list!
  const sortedFilteredStudents = [...filteredStudents].sort((a, b) => {
    if (isParent) {
      const aIsChild = parentChildIds.has(a.id);
      const bIsChild = parentChildIds.has(b.id);
      if (aIsChild && !bIsChild) return -1;
      if (!aIsChild && bIsChild) return 1;
    }
    return 0;
  });

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Data Hafalan Santri
              </h2>
              <FeatureHint
                title="Panduan Hafalan & Setoran"
                content="Klik pada bar progres hafalan santri mana pun untuk membuka modal rincian keterangan Juz & Surat yang telah dihafal. Standar perhitungan: 1 Juz = 10 Lembar = 20 Halaman (1 Halaman = 0.5 Lembar)."
                align="left"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitoring capaian detail desimal (1.2 Juz) dan hitungan lembar/halaman Al-Qur'an
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Tombol Cetak Laporan PDF - Hanya untuk Guru, Koordinator & Admin (Dihilangkan pada Akun Orang Tua) */}
          {currentUser?.role !== 'parent' && (
            <button
              onClick={() => setIsCetakModalOpen(true)}
              disabled={santriList.length === 0}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-50 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 active:scale-[0.98] rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-all flex-1 sm:flex-initial"
              title="Cetak Rekap Hafalan Bulanan PDF"
            >
              <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Cetak Laporan</span>
            </button>
          )}

          {/* Tombol Tanya Guru via WA khusus akun Orang Tua */}
          {currentUser?.role === 'parent' && (
            <button
              onClick={() => setIsWaModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer w-full sm:w-auto"
              title="Tanya Guru via WhatsApp"
            >
              <MessageCircle className="w-4 h-4 fill-white/20" />
              <span>Tanya Guru via WA</span>
            </button>
          )}

          {currentUser?.role !== 'parent' && (
            <button
              onClick={() => {
                if (santriList.length === 0) {
                  setActiveTab('kelolaData');
                } else {
                  setSelectedStudentForAdd(santriList[0]?.id || null);
                  setIsAddModalOpen(true);
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-all flex-1 sm:flex-initial"
            >
              <Plus className="w-4 h-4" />
              <span>{santriList.length === 0 ? 'Tambah Santri Pertama' : 'Tambah Hafalan'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KHUSUS WALI SANTRI: HAFALAN ANANDA BERADA PALING ATAS (Mendukung 2 Anak atau Lebih) */}
      {isParent && parentChildren.length > 0 && (() => {
        const displayedParentChildren = parentChildren.filter(
          c => parentViewChildId === 'all' || parentViewChildId === c.id
        );

        return (
          <div className="bg-gradient-to-br from-teal-50/90 via-emerald-50/50 to-white dark:from-slate-900 dark:via-slate-850 dark:to-teal-950/40 p-4 sm:p-6 rounded-3xl border border-teal-200/90 dark:border-teal-800/80 shadow-xs space-y-4 animate-in fade-in duration-150">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-100 dark:border-teal-900/60 pb-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg leading-tight">
                      Hafalan Ananda Tercinta
                    </h3>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shrink-0">
                      {parentChildren.length} Santri Terdaftar
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Ringkasan capaian juz, lembar, dan halaman Al-Qur'an ananda
                  </p>
                </div>
              </div>

              {/* If 2 or more children, show presisi selector tabs */}
              {parentChildren.length > 1 && (
                <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1 p-1 bg-white dark:bg-slate-800 rounded-xl border border-teal-200/80 dark:border-teal-800 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setParentViewChildId('all')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-center whitespace-nowrap cursor-pointer ${
                      parentViewChildId === 'all'
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-teal-700'
                    }`}
                  >
                    Semua ({parentChildren.length})
                  </button>
                  {parentChildren.map(c => {
                    const isSelected = parentViewChildId === c.id;
                    const isActiveMonitoring = c.id === currentUser?.studentId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setParentViewChildId(c.id);
                          switchParentActiveChild(c.id);
                        }}
                        className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                          isSelected
                            ? 'bg-teal-600 text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-teal-700'
                        }`}
                      >
                        <span className="truncate">{c.nama}</span>
                        {isActiveMonitoring && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Children Cards Grid (Full width if 1 child, 2 columns if multiple) */}
            <div className={`grid grid-cols-1 gap-4 ${displayedParentChildren.length > 1 ? 'lg:grid-cols-2' : ''}`}>
              {displayedParentChildren.map(c => {
                const breakdown = parseHafalan(c.totalJuzMemorized);
                const sisaJuz = Math.max(0, c.targetJuz - breakdown.decimalJuz).toFixed(1);
                const progressPct = Math.min(100, Math.round((breakdown.decimalJuz / (c.targetJuz || 1)) * 100));
                const isCurrentMonitoring = c.id === currentUser?.studentId;

                return (
                  <div
                    key={c.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-200/90 dark:border-teal-800/80 p-4 sm:p-5 shadow-xs space-y-3.5 flex flex-col justify-between transition-all"
                  >
                    <div className="space-y-3.5">
                      {/* Card Header: Identity & Monitoring Badge */}
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                            {c.nama.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">
                                {c.nama}
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shrink-0">
                                {c.gender === 'santriwan' ? 'Putra' : 'Putri'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              {c.kelasNama} · {c.kelompokNama}
                            </div>
                          </div>
                        </div>

                        {/* Active monitoring badge / switch */}
                        {isCurrentMonitoring ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800 shrink-0 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Sedang Dipantau</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => switchParentActiveChild(c.id)}
                            className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700 transition-colors shrink-0 whitespace-nowrap cursor-pointer"
                          >
                            Jadikan Utama
                          </button>
                        )}
                      </div>

                      {/* 3 Symmetrical Summary Metric Boxes (Presisi) */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-2.5 text-center">
                        <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/70">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate">
                            Capaian Hafalan
                          </span>
                          <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-400 tabular-nums block mt-0.5">
                            {breakdown.decimalText} Juz
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 block truncate">
                            {breakdown.lembarText}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate">
                            Target Hafalan
                          </span>
                          <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums block mt-0.5">
                            {c.targetJuz} Juz
                          </span>
                          <span className="text-[10px] font-semibold text-teal-700 dark:text-teal-400 block truncate">
                            {progressPct}% Tercapai
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate">
                            Total Halaman
                          </span>
                          <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums block mt-0.5">
                            {breakdown.halaman} Hal
                          </span>
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block truncate">
                            Sisa {sisaJuz} Juz
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar & Setoran Terakhir - Klik untuk Rincian Juz & Surat */}
                      <div 
                        onClick={() => setSelectedStudentForQuranDetail(c)}
                        className="p-3 bg-slate-50/90 hover:bg-emerald-50/60 dark:bg-slate-800/70 dark:hover:bg-emerald-950/40 rounded-xl space-y-2 border border-slate-200/70 hover:border-emerald-300 dark:border-slate-700/80 dark:hover:border-emerald-700 cursor-pointer transition-all group"
                        title="Klik untuk melihat rincian Keterangan Juz & Surat yang dihafal"
                      >
                        <div className="flex items-center justify-between text-xs gap-2">
                          <span className="text-slate-600 dark:text-slate-300 font-semibold truncate">
                            Progres Hafalan Al-Qur'an
                          </span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums shrink-0">
                            {breakdown.decimalText} / {c.targetJuz} Juz ({progressPct}%)
                          </span>
                        </div>

                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>

                        <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2 text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>Setoran Terakhir:</span>
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate text-right">
                            {c.terakhirSetor
                              ? `${c.terakhirSetor.surah}${c.terakhirSetor.ayat ? ` (${c.terakhirSetor.ayat})` : ''} · ${c.terakhirSetor.tanggal}`
                              : 'Belum ada setoran'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Equal-Width Action Buttons (Presisi) */}
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForRiwayat(c)}
                          className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 bg-slate-50/90 hover:bg-emerald-50/70 dark:bg-slate-800/70 dark:hover:bg-emerald-950/40 px-3 py-2 rounded-xl border border-slate-200/80 hover:border-emerald-300 dark:border-slate-700/80 dark:hover:border-emerald-700 transition-all cursor-pointer group"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <Bookmark className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="truncate">Riwayat Setoran ({(c.hafalanList || []).length})</span>
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedStudentForRangkuman(c)}
                          className="w-full flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 bg-emerald-50/80 hover:bg-emerald-100/80 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 px-3 py-2 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 transition-all cursor-pointer group"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="truncate">Rangkuman 1 Bln (AI)</span>
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForQuranDetail(c)}
                          className="w-full h-10 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Rincian Juz & Surat</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentForWa(c);
                            setIsWaModalOpen(true);
                          }}
                          className="w-full h-10 px-3 bg-teal-50 dark:bg-teal-950/70 hover:bg-teal-100 dark:hover:bg-teal-900/60 active:scale-[0.98] text-teal-800 dark:text-teal-300 rounded-xl text-xs font-bold transition-all border border-teal-200 dark:border-teal-800 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                          title="Tanya Ustadz Pembimbing via WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-teal-600/20 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span className="truncate">Tanya Guru via WA</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Empty State Banner if no students */}
      {santriList.length === 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-2xl p-6 sm:p-8 text-center shadow-xs">
          <BookOpen className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">Basis Data Santri Masih Kosong</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
            Belum ada santri yang terdaftar di sistem. Mulai tambahkan santri dan kelompok halaqah untuk mencatat dan memantau perkembangan hafalan Al-Qur'an.
          </p>
          {currentUser?.role !== 'parent' && (
            <button
              onClick={() => setActiveTab('kelolaData')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Santri di Menu Kelola Data</span>
            </button>
          )}
        </div>
      )}

      {/* Filter & Search Bar - Rapi, Bersih & Responsif */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
        
        {/* Row 1: Search Input & Category/Gender Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama santri, kelas, halaqah, atau surat..."
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Gender Filter Segmented Control */}
          <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl text-xs shrink-0 border border-slate-200/60 dark:border-slate-700/60 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setGenderFilter('all')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-center ${
                genderFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Semua ({santriList.length})
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('santriwan')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-center ${
                genderFilter === 'santriwan'
                  ? 'bg-white dark:bg-slate-700 text-blue-900 dark:text-blue-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Santriwan
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('santriwati')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all text-center ${
                genderFilter === 'santriwati'
                  ? 'bg-white dark:bg-slate-700 text-rose-900 dark:text-rose-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Santriwati
            </button>
          </div>
        </div>

        {/* Row 2: Halaqah Filter Chips (Presisi, Semua tampil di layar) */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Filter Halaqah:</span>
            </span>
            {groupFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setGroupFilter('all')}
                className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setGroupFilter('all')}
              className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                groupFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>Semua Halaqah</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                groupFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {santriList.length}
              </span>
            </button>
            {groups.map(grp => {
              const count = santriList.filter(s => s.kelompokNama === grp.nama || s.kelompokId === grp.id).length;
              return (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => setGroupFilter(grp.nama)}
                  className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    groupFilter === grp.nama
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="truncate">{grp.nama}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
                    groupFilter === grp.nama ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Rujukan Standar Al-Qur'an with FeatureHint */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
          <div className="flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Rujukan: 1 Juz = 10 Lembar = 20 Halaman (0.1 Juz = 1 Lembar)</span>
            <FeatureHint
              title="Standar Hitungan Mushaf"
              content="Perhitungan menggunakan Mushaf Rasm Utsmani Madinah standar 604 halaman. 1 Halaman = 0.5 Lembar. Progres baru bertambah ketika santri telah menuntaskan 1 halaman penuh."
              align="left"
            />
          </div>
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-[10px] hidden sm:inline">
            Klik bar progres kartu untuk rincian Juz & Surat
          </span>
        </div>

      </div>

      {/* Student Cards List */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-3 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <p className="text-slate-700 dark:text-slate-300 font-semibold text-sm">
            {santriList.length === 0 ? 'Belum ada data santri terdaftar' : 'Tidak ada santri yang sesuai filter pencarian'}
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-xs max-w-sm mx-auto">
            {santriList.length === 0 
              ? 'Tambahkan santri baru untuk mulai mencatat riwayat setoran hafalan Al-Qur\'an.' 
              : 'Coba ubah kata kunci pencarian atau reset filter halaqah dan kategori.'}
          </p>
          {santriList.length === 0 && currentUser?.role !== 'parent' && (
            <button
              onClick={() => setActiveTab('kelolaData')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Santri di Kelola Data</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {sortedFilteredStudents.map(student => {
            const isMale = student.gender === 'santriwan';
            const isMyChild = isParent && parentChildIds.has(student.id);
            const breakdown = parseHafalan(student.totalJuzMemorized);
            const quranProgress = getStudentQuranProgress(student);
            const targetJuzNum = student.targetJuz || 1;
            const targetPercent = Math.min(100, Math.round((breakdown.decimalJuz / targetJuzNum) * 100));
            const completedJuz = quranProgress?.completedJuzNumbers || [];
            const memorizedJuzSummary =
              completedJuz.length > 0
                ? `Juz ${completedJuz.slice(0, 4).join(', ')}${
                    completedJuz.length > 4
                      ? ` (+${completedJuz.length - 4})`
                      : ''
                  }`
                : student.inProgressJuz
                ? `Sedang Juz ${student.inProgressJuz.juzNumber}`
                : 'Belum ada juz tuntas';

            return (
              <div 
                key={student.id} 
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-xs transition-all flex flex-col justify-between ${
                  isMyChild 
                    ? 'ring-2 ring-teal-500/80 border-teal-400 dark:border-teal-500 bg-teal-50/20 dark:bg-teal-950/20 shadow-sm' 
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Card Header: Nama Santri, Kelas, Halaqah, Gender & Keterangan Juz Minimalis */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    
                    {/* Left: Avatar & Identity */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isMale 
                          ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60' 
                          : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60'
                      }`}>
                        {student.nama.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-snug truncate">
                            {student.nama}
                          </h3>
                          {isMyChild && (
                            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 shrink-0">
                              · Ananda
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                          <span className="font-medium text-slate-600 dark:text-slate-300 shrink-0">{student.kelasNama}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{student.kelompokNama}</span>
                          <span aria-hidden="true">·</span>
                          <span className={`shrink-0 font-medium ${isMale ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {isMale ? 'Santriwan' : 'Santriwati'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Capaian Juz & Lembar Minimalis */}
                    <div className="flex items-start gap-1 shrink-0">
                      <div className="text-right leading-snug">
                        <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-400 tabular-nums block">
                          {breakdown.decimalText} Juz
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                          {breakdown.lembarText}
                        </span>
                      </div>

                      {currentUser?.role !== 'parent' && (
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForDirectEdit(student)}
                          className="p-1 text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors cursor-pointer"
                          title="Edit Capaian Hafalan"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Keterangan Juz & Progres Box - Minimalis & Informatif (Klik untuk rincian Juz & Surat) */}
                  <div 
                    onClick={() => setSelectedStudentForQuranDetail(student)}
                    className="bg-slate-50/90 dark:bg-slate-800/60 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 rounded-xl p-3 border border-slate-200/70 hover:border-emerald-300 dark:border-slate-800 dark:hover:border-emerald-700 mb-3 space-y-2 cursor-pointer transition-all group"
                    title="Klik untuk melihat rincian Keterangan Juz & Surat yang dihafal"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 shrink-0">
                          Target {student.targetJuz} Juz
                        </span>
                        <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium truncate">
                          {memorizedJuzSummary}
                        </span>
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums shrink-0 text-[11px]">
                        {breakdown.decimalText}/{student.targetJuz} Juz ({targetPercent}%)
                      </span>
                    </div>

                    {/* Slim Progress Bar */}
                    <div className="w-full bg-slate-200/80 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${targetPercent}%` }} 
                      />
                    </div>

                    {/* Baris Bawah: Setoran Terakhir & Link Rincian Juz */}
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                      <span className="truncate">
                        {student.terakhirSetor
                          ? `Terakhir: Juz ${student.terakhirSetor.juz} · ${student.terakhirSetor.surah} (${student.terakhirSetor.ayat})`
                          : 'Belum ada setoran tercatat'}
                      </span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold shrink-0 inline-flex items-center gap-0.5 group-hover:underline">
                        <span>Rincian Juz</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Baris Tombol Aksi: Riwayat Setoran & Rangkuman 1 Bulan (AI) */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedStudentForRiwayat(student)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 bg-slate-50 hover:bg-emerald-50/70 dark:bg-slate-800/70 dark:hover:bg-emerald-950/40 px-3 py-2 rounded-xl border border-slate-200/80 hover:border-emerald-300 dark:border-slate-700/80 dark:hover:border-emerald-700 transition-all cursor-pointer group"
                    title="Buka modal Riwayat Setoran"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Bookmark className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">Riwayat Setoran ({(student.hafalanList || []).length})</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStudentForRangkuman(student)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 bg-emerald-50/80 hover:bg-emerald-100/80 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 px-3 py-2 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 transition-all cursor-pointer group"
                    title="Lihat Rangkuman Capaian 1 Bulan (Digenerate oleh AI)"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">Rangkuman 1 Bln (AI)</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal Rangkuman Capaian 1 Bulan (AI) */}
      {selectedStudentForRangkuman && (
        <RangkumanBulananModal
          student={selectedStudentForRangkuman}
          isOpen={!!selectedStudentForRangkuman}
          onClose={() => setSelectedStudentForRangkuman(null)}
        />
      )}

      {/* Modal Riwayat Setoran */}
      {selectedStudentForRiwayat && (
        <RiwayatSetoranModal
          student={selectedStudentForRiwayat}
          isOpen={!!selectedStudentForRiwayat}
          onClose={() => setSelectedStudentForRiwayat(null)}
          onEditRecord={(st, record) => {
            setEditingTarget({ student: st, record });
          }}
          onAddSetoran={(st) => {
            setSelectedStudentForAdd(st.id);
            setIsAddModalOpen(true);
          }}
        />
      )}

      {/* Student Quran 30 Juz & Surah Detail Modal */}
      {selectedStudentForQuranDetail && (
        <StudentQuranDetailModal
          student={selectedStudentForQuranDetail}
          isOpen={!!selectedStudentForQuranDetail}
          onClose={() => setSelectedStudentForQuranDetail(null)}
          onOpenEditKeterangan={() => {
            const st = selectedStudentForQuranDetail;
            setSelectedStudentForQuranDetail(null);
            setEditHafalanInitialTab('keterangan_juz_surat');
            setSelectedStudentForEdit(st);
          }}
        />
      )}

      {/* Edit Hafalan Modal (Mencakup Riwayat Setoran & Keterangan Juz/Surat) */}
      {selectedStudentForEdit && (
        <EditHafalanModal
          student={selectedStudentForEdit}
          isOpen={!!selectedStudentForEdit}
          onClose={() => setSelectedStudentForEdit(null)}
          initialTab={editHafalanInitialTab}
        />
      )}

      {/* Direct Edit Hafalan Modal (Bisa Desimal & Lembar) */}
      {selectedStudentForDirectEdit && (
        <DirectEditHafalanModal
          student={selectedStudentForDirectEdit}
          isOpen={!!selectedStudentForDirectEdit}
          onClose={() => setSelectedStudentForDirectEdit(null)}
        />
      )}

      {/* Add Hafalan Modal */}
      {isAddModalOpen && (
        <AddHafalanModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setSelectedStudentForAdd(null);
          }}
          preselectedStudentId={selectedStudentForAdd || undefined}
        />
      )}

      {/* Edit Single Hafalan Modal */}
      {editingTarget && (
        <EditSingleHafalanModal
          isOpen={!!editingTarget}
          student={editingTarget.student}
          record={editingTarget.record}
          onClose={() => setEditingTarget(null)}
          onSave={(data) => {
            updateHafalanRecord(editingTarget.student.id, editingTarget.record.id, data);
            setEditingTarget(null);
          }}
          onDelete={() => {
            deleteHafalanRecord(editingTarget.student.id, editingTarget.record.id);
            setEditingTarget(null);
          }}
        />
      )}

      {/* Cetak Rekap Hafalan Bulanan PDF Modal */}
      {isCetakModalOpen && (
        <CetakLaporanModal
          isOpen={isCetakModalOpen}
          onClose={() => setIsCetakModalOpen(false)}
          allSantri={santriList}
          currentFilteredSantri={filteredStudents}
          groups={groups}
          currentUser={currentUser}
          activeGenderFilter={genderFilter}
          activeGroupFilter={groupFilter}
        />
      )}

      {/* Kirim Pesan WA Modal for Parent */}
      {currentUser?.role === 'parent' && (
        <KirimPesanWAModal
          isOpen={isWaModalOpen}
          onClose={() => {
            setIsWaModalOpen(false);
            setSelectedStudentForWa(null);
          }}
          student={selectedStudentForWa || santriList.find(s => s.id === currentUser.studentId) || santriList[0]}
          defaultCategory="tanya_hafalan"
        />
      )}

    </div>
  );
};
