import React, { useState } from 'react';
import { useTahfidz } from '../context/TahfidzContext';
import { 
  Plus, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  BookOpen, 
  CheckCircle2, 
  UserCheck, 
  Calendar,
  Layers,
  Sparkles,
  Trash2,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { Santri, HafalanEntry } from '../types';
import { EditHafalanModal } from './EditHafalanModal';
import { AddHafalanModal } from './AddHafalanModal';
import { EditSingleHafalanModal } from './EditSingleHafalanModal';
import { DirectEditHafalanModal } from './DirectEditHafalanModal';

export const HafalanView: React.FC = () => {
  const { santriList, groups, currentUser, updateHafalanRecord, deleteHafalanRecord } = useTahfidz();

  const [genderFilter, setGenderFilter] = useState<'all' | 'santriwan' | 'santriwati'>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Expandable accordions state
  const [expandedStudentIds, setExpandedStudentIds] = useState<Record<string, boolean>>({});

  // Modals state
  const [selectedStudentForDirectEdit, setSelectedStudentForDirectEdit] = useState<Santri | null>(null);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<Santri | null>(null);
  const [selectedStudentForAdd, setSelectedStudentForAdd] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<{ student: Santri; record: HafalanEntry } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setExpandedStudentIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Filter students
  const filteredStudents = santriList.filter(student => {
    if (genderFilter !== 'all' && student.gender !== genderFilter) return false;
    if (groupFilter !== 'all' && student.kelompokNama !== groupFilter && student.kelompokId !== groupFilter) return false;
    if (searchQuery.trim() && !student.nama.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Data Hafalan Santri
          </h2>
          <p className="text-xs text-slate-500">
            Monitoring mutqin dan progres capaian 30 Juz Al-Qur'an
          </p>
        </div>

        {currentUser?.role !== 'parent' && (
          <button
            onClick={() => {
              setSelectedStudentForAdd(santriList[0]?.id || null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Tambah Hafalan
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nama santri..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        {/* Gender Filter Segmented Control */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1">Kategori:</span>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setGenderFilter('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                genderFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({santriList.length})
            </button>
            <button
              onClick={() => setGenderFilter('santriwan')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                genderFilter === 'santriwan'
                  ? 'bg-white text-blue-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Santriwan
            </button>
            <button
              onClick={() => setGenderFilter('santriwati')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                genderFilter === 'santriwati'
                  ? 'bg-white text-rose-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Santriwati
            </button>
          </div>
        </div>

        {/* Kelompok Filter Segmented Control */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-400 font-medium mr-1">Halaqah:</span>
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <button
              onClick={() => setGroupFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                groupFilter === 'all'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Halaqah
            </button>
            {groups.map(grp => (
              <button
                key={grp.id}
                onClick={() => setGroupFilter(grp.nama)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  groupFilter === grp.nama
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {grp.nama}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Student Cards List */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 p-8">
          <p className="text-slate-500 text-sm">Tidak ada santri yang sesuai dengan filter pencarian.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStudents.map(student => {
            const isExpanded = !!expandedStudentIds[student.id];
            const isMale = student.gender === 'santriwan';
            const targetPercent = Math.min(100, Math.round((student.totalJuzMemorized / (student.targetJuz || 1)) * 100));
            const quranPercent = Math.round((student.totalJuzMemorized / 30) * 100);

            return (
              <div 
                key={student.id} 
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      isMale ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {student.nama.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight">
                        {student.nama}
                      </h3>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>{student.kelasNama}</span>
                        <span aria-hidden="true">·</span>
                        <span>{student.kelompokNama}</span>
                        <span aria-hidden="true">·</span>
                        <span className={isMale ? 'text-blue-600 font-medium' : 'text-rose-600 font-medium'}>
                          {isMale ? 'Santriwan' : 'Santriwati'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-base font-bold text-emerald-700 block tabular-nums">
                        {student.totalJuzMemorized} Juz
                      </span>
                      {currentUser?.role !== 'parent' && (
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForDirectEdit(student)}
                          className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                          title="Edit Capaian Juz Santri Langsung (Tanpa Setoran)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      {quranPercent}% dari 30 Juz
                    </span>
                  </div>
                </div>

                {/* Progress Bar towards Target */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span>Progress Target ({student.targetJuz} Juz)</span>
                    <span className="font-semibold tabular-nums">{student.totalJuzMemorized}/{student.targetJuz} Juz ({targetPercent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${targetPercent}%` }} 
                    />
                  </div>
                </div>

                {/* Sub-Details */}
                <div className="text-xs text-slate-600 space-y-1 py-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Setoran Terakhir:</span>
                    <span className="font-medium text-slate-800">
                      {student.terakhirSetor 
                        ? `Juz ${student.terakhirSetor.juz} - ${student.terakhirSetor.surah} (${student.terakhirSetor.ayat})`
                        : 'Belum ada setoran'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Target Selesai:</span>
                    <span className="font-medium text-slate-800">
                      {student.targetSelesai || 'Desember 2026'}
                    </span>
                  </div>
                </div>

                {/* Accordion Toggle: Hafalan Tersimpan */}
                <div className="pt-2.5 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleAccordion(student.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 transition-colors"
                    >
                      <span>Hafalan Tersimpan ({student.hafalanList.length})</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <div className="flex items-center gap-1.5">
                      {currentUser?.role !== 'parent' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedStudentForAdd(student.id);
                              setIsAddModalOpen(true);
                            }}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Setor Hafalan Baru"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedStudentForEdit(student)}
                            className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Kelola & Edit Hafalan"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded List */}
                  {isExpanded && (
                    <div className="mt-2.5 space-y-2 max-h-60 overflow-y-auto pr-1 animate-in fade-in duration-150">
                      {student.hafalanList.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-3 text-center bg-slate-50 rounded-xl">
                          Belum ada riwayat setoran tersimpan.
                        </p>
                      ) : (
                        student.hafalanList.map(h => (
                          <div 
                            key={h.id} 
                            className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl text-xs space-y-2 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-bold text-slate-900 text-xs flex flex-wrap items-center gap-1.5">
                                  <span>Juz {h.juz} · {h.surahName}</span>
                                  {h.ayatMulai && h.ayatSelesai ? (
                                    <span className="font-normal text-slate-500">
                                      (Ayat {h.ayatMulai}-{h.ayatSelesai})
                                    </span>
                                  ) : null}
                                </div>
                                <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                                  <span className="capitalize font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded text-[10px]">
                                    {h.type === 'baru' ? 'Hafalan Baru' : h.type === 'muroja' ? "Muroja'ah" : 'Perbaikan'}
                                  </span>
                                  <span>·</span>
                                  <span>{h.tanggal}</span>
                                  {h.ustadzName && <span>· Ustadz: {h.ustadzName}</span>}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                                  h.kualitas === 'A' ? 'bg-emerald-100 text-emerald-800' :
                                  h.kualitas === 'B' ? 'bg-blue-100 text-blue-800' :
                                  h.kualitas === 'C' ? 'bg-amber-100 text-amber-800' :
                                  'bg-rose-100 text-rose-800'
                                }`}>
                                  Nilai {h.kualitas}
                                </span>

                                {currentUser?.role !== 'parent' && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setEditingTarget({ student, record: h })}
                                      className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                      title="Edit Catatan Hafalan Ini"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>

                                    {confirmDeleteId === h.id ? (
                                      <div className="flex items-center gap-1 bg-red-50 p-0.5 rounded-md border border-red-200">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            deleteHafalanRecord(student.id, h.id);
                                            setConfirmDeleteId(null);
                                          }}
                                          className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[9px] font-bold"
                                        >
                                          Hapus
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setConfirmDeleteId(null)}
                                          className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px]"
                                        >
                                          Batal
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setConfirmDeleteId(h.id)}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="Hapus Catatan Hafalan"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Catatan Ustadz (Hasil dari input di Absensi atau Tambah Hafalan) */}
                            {h.catatan && (
                              <div className="p-2 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-950 flex items-start gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-semibold text-amber-900">Catatan Hafalan: </span>
                                  <span className="italic">"{h.catatan}"</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Edit Hafalan Modal */}
      {selectedStudentForEdit && (
        <EditHafalanModal
          student={selectedStudentForEdit}
          isOpen={!!selectedStudentForEdit}
          onClose={() => setSelectedStudentForEdit(null)}
        />
      )}

      {/* Direct Edit Hafalan Modal (Tanpa Harus Setoran) */}
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

    </div>
  );
};
