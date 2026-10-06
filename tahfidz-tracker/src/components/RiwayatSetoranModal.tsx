import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Bookmark,
  Calendar,
  Edit3,
  Trash2,
  MessageSquare,
  AlertTriangle,
  Plus,
  RotateCcw,
  UserCheck
} from 'lucide-react';
import { Santri, HafalanEntry, HafalanType } from '../types';
import { useTahfidz } from '../context/TahfidzContext';
import { parseHafalan } from '../utils/hafalanFormat';

interface RiwayatSetoranModalProps {
  isOpen: boolean;
  student: Santri;
  onClose: () => void;
  onEditRecord?: (student: Santri, record: HafalanEntry) => void;
  onAddSetoran?: (student: Santri) => void;
}

export const RiwayatSetoranModal: React.FC<RiwayatSetoranModalProps> = ({
  isOpen,
  student,
  onClose,
  onEditRecord,
  onAddSetoran
}) => {
  const { santriList, currentUser, deleteHafalanRecord } = useTahfidz();

  // Minimal filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | HafalanType>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Always use live student data from context so edits/deletions reflect immediately
  const liveStudent = santriList.find(s => s.id === student.id) || student;
  const breakdown = parseHafalan(liveStudent.totalJuzMemorized);
  const allRecords = liveStudent.hafalanList || [];
  const isParent = currentUser?.role === 'parent';

  // Counts by type
  const counts = useMemo(() => {
    return {
      all: allRecords.length,
      baru: allRecords.filter(r => r.type === 'baru').length,
      muroja: allRecords.filter(r => r.type === 'muroja').length,
      perbaikan: allRecords.filter(r => r.type === 'perbaikan').length
    };
  }, [allRecords]);

  // Filtered records (newest first)
  const filteredRecords = useMemo(() => {
    return allRecords.filter(r => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSurah = (r.surahName || '').toLowerCase().includes(q);
        const matchJuz = `juz ${r.juz}`.includes(q) || String(r.juz) === q;
        const matchCatatan = (r.catatan || '').toLowerCase().includes(q);
        const matchUstadz = (r.ustadzName || '').toLowerCase().includes(q);
        const matchDate = (r.tanggal || '').toLowerCase().includes(q);
        if (!matchSurah && !matchJuz && !matchCatatan && !matchUstadz && !matchDate) {
          return false;
        }
      }

      return true;
    });
  }, [allRecords, typeFilter, searchQuery]);

  const hasActiveFilter = searchQuery.trim() !== '' || typeFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-2xl h-[88vh] sm:h-[85vh] max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Compact Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 shrink-0 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                liveStudent.gender === 'santriwan'
                  ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {liveStudent.nama.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight truncate">
                  Riwayat Setoran
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  {breakdown.decimalText} Juz ({breakdown.lembarText})
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                <strong className="text-slate-700 dark:text-slate-200">{liveStudent.nama}</strong> · {liveStudent.kelasNama} · {liveStudent.kelompokNama}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isParent && onAddSetoran && (
              <button
                type="button"
                onClick={() => onAddSetoran(liveStudent)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tambah</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Ultra-Minimal Single-Line Filter Bar */}
        <div className="px-4 sm:px-5 py-2 bg-slate-50/60 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2 shrink-0">
          <div className="relative flex-1 min-w-0">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari surah, juz, atau tanggal..."
              className="w-full h-8 pl-8 pr-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as 'all' | HafalanType)}
            className="h-8 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shrink-0 cursor-pointer"
            title="Filter Jenis Setoran"
          >
            <option value="all">Semua ({counts.all})</option>
            <option value="baru">Hafalan Baru ({counts.baru})</option>
            <option value="muroja">Muroja'ah ({counts.muroja})</option>
            <option value="perbaikan">Perbaikan ({counts.perbaikan})</option>
          </select>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="h-8 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer"
              title="Reset Filter"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Maximized Scrollable Records List */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-2">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
              <Bookmark className="w-7 h-7 text-slate-400 dark:text-slate-500 mx-auto" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {allRecords.length === 0
                  ? 'Belum ada riwayat setoran tersimpan.'
                  : 'Tidak ada riwayat setoran yang sesuai filter.'}
              </p>
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>
          ) : (
            filteredRecords.map(h => {
              const isConfirmingDelete = confirmDeleteId === h.id;
              const isBaru = h.type === 'baru';
              const typeLabel =
                h.type === 'baru' ? 'Hafalan Baru' : h.type === 'muroja' ? "Muroja'ah" : 'Perbaikan';

              return (
                <div
                  key={h.id}
                  className="p-2.5 sm:p-3 bg-white dark:bg-slate-800/70 hover:bg-slate-50/90 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 rounded-xl text-xs space-y-1.5 transition-all shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-[13px] flex flex-wrap items-center gap-1.5">
                        <span>
                          Juz {h.juz} · {h.surahName}
                        </span>
                        {h.ayatMulai && h.ayatSelesai ? (
                          <span className="font-normal text-slate-500 dark:text-slate-400 text-[11px]">
                            (Ayat {h.ayatMulai}–{h.ayatSelesai})
                          </span>
                        ) : null}
                      </div>

                      <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            h.type === 'baru'
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                              : h.type === 'muroja'
                              ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
                              : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {typeLabel}
                        </span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {h.tanggal}
                        </span>
                        {h.ustadzName && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-slate-400" />
                              {h.ustadzName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md border ${
                          h.kualitas === 'A'
                            ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : h.kualitas === 'B'
                            ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                            : h.kualitas === 'C'
                            ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        Nilai {h.kualitas}
                      </span>

                      {!isParent && (
                        <div className="flex items-center gap-0.5">
                          {onEditRecord && (
                            <button
                              type="button"
                              onClick={() => onEditRecord(liveStudent, h)}
                              className="p-1 text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors cursor-pointer"
                              title="Edit Riwayat Setoran Ini"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(isConfirmingDelete ? null : h.id)}
                            className={`p-1 rounded-lg transition-colors cursor-pointer ${
                              isConfirmingDelete
                                ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/60'
                                : 'text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60'
                            }`}
                            title="Hapus Riwayat Setoran"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Catatan Ustadz */}
                  {h.catatan && (
                    <div className="px-2.5 py-1.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60 rounded-lg text-[11px] text-amber-950 dark:text-amber-200 flex items-start gap-1.5">
                      <MessageSquare className="w-3 h-3 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <div className="leading-snug">
                        <span className="font-semibold text-amber-900 dark:text-amber-300">Catatan: </span>
                        <span className="italic">"{h.catatan}"</span>
                      </div>
                    </div>
                  )}

                  {/* Delete Confirmation Box */}
                  {isConfirmingDelete && (
                    <div className="p-2 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in duration-150">
                      <div className="flex items-start gap-1.5 text-[11px] text-rose-900 dark:text-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        <span>
                          {isBaru ? (
                            <>
                              Hapus <strong>Hafalan Baru</strong> ini? Capaian hafalan akan ikut dikurangi.
                            </>
                          ) : (
                            <>
                              Hapus <strong>{typeLabel}</strong> ini? Capaian hafalan <strong>tidak berkurang</strong>.
                            </>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            deleteHafalanRecord(liveStudent.id, h.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[11px] font-bold shadow-2xs cursor-pointer"
                        >
                          Ya, Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-[11px] font-medium cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Compact Footer */}
        <div className="px-4 sm:px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Menampilkan <strong className="text-slate-800 dark:text-slate-200">{filteredRecords.length}</strong> dari{' '}
            <strong className="text-slate-800 dark:text-slate-200">{allRecords.length}</strong> setoran
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
