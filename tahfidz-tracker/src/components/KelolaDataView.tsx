import React, { useState, useRef } from 'react';
import { useTahfidz } from '../context/TahfidzContext';
import { 
  UserPlus, 
  GraduationCap, 
  Users, 
  Target, 
  Clock, 
  Download, 
  Upload,
  RotateCcw, 
  Edit3, 
  Trash2, 
  Plus, 
  Check, 
  X,
  FileJson,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { Santri, Kelas, Kelompok, TargetHafalan, SesiTahfidz } from '../types';
import { parseHafalan } from '../utils/hafalanFormat';

export const KelolaDataView: React.FC = () => {
  const { 
    santriList, 
    classes, 
    groups, 
    targets, 
    sessions, 
    addSantri,
    updateSantri,
    deleteSantri,
    addKelas,
    updateKelas,
    deleteKelas,
    addKelompok,
    updateKelompok,
    deleteKelompok,
    addTarget,
    updateTarget,
    deleteTarget,
    addSesi,
    updateSesi,
    deleteSesi,
    resetToDefaultData,
    resetAllDataToEmpty,
    populateDemoData,
    exportDataJson,
    importDataJson
  } = useTahfidz();

  type TabType = 'santri' | 'kelas' | 'kelompok' | 'target' | 'sesi' | 'backup';
  const [activeTab, setActiveTab] = useState<TabType>('santri');
  const [isClearing, setIsClearing] = useState(false);

  // Santri Management State
  const [santriSearch, setSantriSearch] = useState('');
  const [santriFilterKelas, setSantriFilterKelas] = useState('all');
  const [santriNama, setSantriNama] = useState('');
  const [santriKelasId, setSantriKelasId] = useState(classes[0]?.id || '');
  const [santriGender, setSantriGender] = useState<'santriwan' | 'santriwati'>('santriwan');
  const [santriKelompokId, setSantriKelompokId] = useState(groups[0]?.id || '');
  const [santriTargetJuz, setSantriTargetJuz] = useState(10);
  const [santriParentName, setSantriParentName] = useState('');
  const [santriParentPhone, setSantriParentPhone] = useState('');
  const [editingSantri, setEditingSantri] = useState<Santri | null>(null);

  // Kelas Management State
  const [kelasNama, setKelasNama] = useState('');
  const [kelasTingkat, setKelasTingkat] = useState<Kelas['tingkat']>('Ibtidaiyyah');
  const [kelasWali, setKelasWali] = useState('');
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);

  // Kelompok Management State
  const [kelompokNama, setKelompokNama] = useState('');
  const [kelompokPengajar, setKelompokPengajar] = useState('');
  const [editingKelompok, setEditingKelompok] = useState<Kelompok | null>(null);

  // Target Management State
  const [targetNama, setTargetNama] = useState('');
  const [targetJuz, setTargetJuz] = useState(10);
  const [editingTarget, setEditingTarget] = useState<TargetHafalan | null>(null);

  // Sesi Management State
  const [sesiNama, setSesiNama] = useState('');
  const [sesiMulai, setSesiMulai] = useState('08:00');
  const [sesiSelesai, setSesiSelesai] = useState('10:00');
  const [editingSesi, setEditingSesi] = useState<SesiTahfidz | null>(null);

  // Delete Confirmation State
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'santri' | 'kelas' | 'kelompok' | 'target' | 'sesi' | 'reset' | 'load_demo';
    id: string;
    name: string;
    details?: string;
  } | null>(null);

  const handleConfirmDelete = async () => {
    if (!deleteConfirmTarget) return;

    const { type, id, name } = deleteConfirmTarget;

    if (type === 'santri') {
      deleteSantri(id);
      if (editingSantri?.id === id) setEditingSantri(null);
      showFeedback(`Santri "${name}" berhasil dihapus.`);
    } else if (type === 'kelas') {
      deleteKelas(id);
      if (editingKelas?.id === id) setEditingKelas(null);
      showFeedback(`Kelas "${name}" berhasil dihapus.`);
    } else if (type === 'kelompok') {
      deleteKelompok(id);
      if (editingKelompok?.id === id) setEditingKelompok(null);
      showFeedback(`Kelompok halaqah "${name}" berhasil dihapus.`);
    } else if (type === 'target') {
      deleteTarget(id);
      if (editingTarget?.id === id) setEditingTarget(null);
      showFeedback(`Target hafalan "${name}" berhasil dihapus.`);
    } else if (type === 'sesi') {
      deleteSesi(id);
      if (editingSesi?.id === id) setEditingSesi(null);
      showFeedback(`Sesi tahfidz "${name}" berhasil dihapus.`);
    } else if (type === 'reset') {
      setIsClearing(true);
      try {
        await resetAllDataToEmpty();
        showFeedback('Semua data (termasuk data palsu/contoh) berhasil dihapus total. Sistem kini kosong.');
      } catch (e) {
        showFeedback('Gagal mengosongkan data. Silakan coba lagi.', 'error');
      } finally {
        setIsClearing(false);
      }
    } else if (type === 'load_demo') {
      setIsClearing(true);
      try {
        await populateDemoData();
        showFeedback('Data contoh demo (10 santri) berhasil dimuat!');
      } catch (e) {
        showFeedback('Gagal memuat data demo.', 'error');
      } finally {
        setIsClearing(false);
      }
    }

    setDeleteConfirmTarget(null);
  };

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Santri Handlers
  const handleSaveSantri = (e: React.FormEvent) => {
    e.preventDefault();
    if (!santriNama.trim()) return;

    addSantri({
      nama: santriNama.trim(),
      kelasId: santriKelasId || classes[0]?.id,
      gender: santriGender,
      kelompokId: santriKelompokId || groups[0]?.id,
      targetJuz: Number(santriTargetJuz),
      orangTuaNama: santriParentName.trim(),
      orangTuaPhone: santriParentPhone.trim()
    });

    setSantriNama('');
    setSantriParentName('');
    setSantriParentPhone('');
    showFeedback('Data santri baru berhasil ditambahkan!');
  };

  const handleUpdateSantri = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSantri) return;

    updateSantri(editingSantri.id, {
      nama: editingSantri.nama.trim(),
      kelasId: editingSantri.kelasId,
      gender: editingSantri.gender,
      kelompokId: editingSantri.kelompokId,
      targetJuz: Number(editingSantri.targetJuz),
      totalJuzMemorized: Number(editingSantri.totalJuzMemorized),
      orangTuaNama: editingSantri.orangTuaNama?.trim() || '',
      orangTuaPhone: editingSantri.orangTuaPhone?.trim() || ''
    });

    setEditingSantri(null);
    showFeedback('Data santri berhasil diperbarui!');
  };

  // Kelas Handlers
  const handleSaveKelas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kelasNama.trim()) return;

    addKelas(kelasNama.trim(), kelasTingkat, kelasWali.trim());
    setKelasNama('');
    setKelasWali('');
    showFeedback('Kelas baru berhasil ditambahkan!');
  };

  const handleUpdateKelas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKelas) return;

    updateKelas(editingKelas.id, editingKelas.nama.trim(), editingKelas.tingkat, editingKelas.waliKelas?.trim() || '');
    setEditingKelas(null);
    showFeedback('Data kelas berhasil diperbarui!');
  };

  // Kelompok Handlers
  const handleSaveKelompok = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kelompokNama.trim() || !kelompokPengajar.trim()) return;

    addKelompok(kelompokNama, kelompokPengajar);
    setKelompokNama('');
    setKelompokPengajar('');
    showFeedback('Kelompok halaqah baru berhasil ditambahkan!');
  };

  const handleUpdateKelompok = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKelompok) return;

    updateKelompok(editingKelompok.id, editingKelompok.nama, editingKelompok.pengajar);
    setEditingKelompok(null);
    showFeedback('Data kelompok halaqah berhasil diperbarui!');
  };

  // Target Handlers
  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetNama.trim()) return;

    addTarget(targetNama, Number(targetJuz));
    setTargetNama('');
    showFeedback('Target hafalan baru berhasil ditambahkan!');
  };

  const handleUpdateTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTarget) return;

    updateTarget(editingTarget.id, editingTarget.nama, Number(editingTarget.jumlahJuz));
    setEditingTarget(null);
    showFeedback('Data target hafalan berhasil diperbarui!');
  };

  // Sesi Handlers
  const handleSaveSesi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sesiNama.trim()) return;

    addSesi(sesiNama, sesiMulai, sesiSelesai);
    setSesiNama('');
    showFeedback('Sesi tahfidz baru berhasil ditambahkan!');
  };

  const handleUpdateSesi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSesi) return;

    updateSesi(editingSesi.id, {
      nama: editingSesi.nama,
      jamMulai: editingSesi.jamMulai,
      jamSelesai: editingSesi.jamSelesai,
      status: editingSesi.status
    });
    setEditingSesi(null);
    showFeedback('Data sesi tahfidz berhasil diperbarui!');
  };

  // Import JSON Handler
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = importDataJson(content);
      if (success) {
        showFeedback('Basis data berhasil dipulihkan dari file JSON!');
      } else {
        showFeedback('Format file JSON tidak valid.', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filtered santri for management table
  const filteredSantriList = santriList.filter(s => {
    if (santriFilterKelas !== 'all' && s.kelasId !== santriFilterKelas && s.kelasNama !== santriFilterKelas) return false;
    if (santriSearch.trim() && !s.nama.toLowerCase().includes(santriSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Kelola Data Master
        </h2>
        <p className="text-xs text-slate-500">
          Manajemen santri, rombel kelas, halaqah, target juz, dan sesi tahfidz
        </p>
      </div>

      {feedbackMsg && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-300 text-emerald-800' 
            : 'bg-rose-50 border border-rose-300 text-rose-800'
        }`}>
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-nowrap sm:flex-wrap gap-1.5 p-1.5 bg-slate-100 rounded-2xl overflow-x-auto max-w-full scrollbar-none">
        {[
          { id: 'santri' as TabType, label: 'Santri', count: santriList.length, icon: UserPlus },
          { id: 'kelas' as TabType, label: 'Kelas', count: classes.length, icon: GraduationCap },
          { id: 'kelompok' as TabType, label: 'Halaqah', count: groups.length, icon: Users },
          { id: 'target' as TabType, label: 'Target Juz', count: targets.length, icon: Target },
          { id: 'sesi' as TabType, label: 'Sesi', count: sessions.length, icon: Clock },
          { id: 'backup' as TabType, label: 'Backup & Reset', icon: FileJson },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full tabular-nums ${
                  isActive ? 'bg-slate-100 text-slate-800' : 'text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: SANTRI */}
      {activeTab === 'santri' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Add Santri Form */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-600" />
              Tambah Santri Baru
            </h3>

            <form onSubmit={handleSaveSantri} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={santriNama}
                  onChange={e => setSantriNama(e.target.value)}
                  placeholder="Contoh: Muhammad Azzam"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={santriKelasId}
                    onChange={e => setSantriKelasId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={santriGender}
                    onChange={e => setSantriGender(e.target.value as 'santriwan' | 'santriwati')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  >
                    <option value="santriwan">Santriwan (L)</option>
                    <option value="santriwati">Santriwati (P)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kelompok</label>
                  <select
                    value={santriKelompokId}
                    onChange={e => setSantriKelompokId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Hafalan</label>
                  <select
                    value={santriTargetJuz}
                    onChange={e => setSantriTargetJuz(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  >
                    {targets.map(t => (
                      <option key={t.id} value={t.jumlahJuz}>{t.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Orang Tua / Wali <span className="text-slate-400 font-normal text-[11px]">(Tidak wajib diisi)</span>
                </label>
                <input
                  type="text"
                  value={santriParentName}
                  onChange={e => setSantriParentName(e.target.value)}
                  placeholder="Contoh: Bapak Hendra (Opsional)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. WhatsApp / HP Wali <span className="text-slate-400 font-normal text-[11px]">(Tidak wajib diisi)</span>
                </label>
                <input
                  type="tel"
                  value={santriParentPhone}
                  onChange={e => setSantriParentPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx (Opsional)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Simpan Data Santri
              </button>
            </form>
          </div>

          {/* Santri List Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-slate-900 text-base">
                Daftar Santri Terdaftar ({filteredSantriList.length})
              </h3>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={santriSearch}
                    onChange={e => setSantriSearch(e.target.value)}
                    placeholder="Filter nama..."
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <select
                  value={santriFilterKelas}
                  onChange={e => setSantriFilterKelas(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="all">Semua Kelas</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.nama}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredSantriList.map(student => {
                const b = parseHafalan(student.totalJuzMemorized);
                return (
                  <div
                    key={student.id}
                    className="p-3 sm:p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        student.gender === 'santriwan' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {student.nama.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{student.nama}</h4>
                        <div className="text-[11px] text-slate-500 truncate">
                          {student.kelasNama} · {student.kelompokNama}
                          {student.orangTuaNama?.trim() ? (
                            <span> · Wali: {student.orangTuaNama} {student.orangTuaPhone?.trim() ? `(${student.orangTuaPhone})` : ''}</span>
                          ) : student.orangTuaPhone?.trim() ? (
                            <span> · HP: {student.orangTuaPhone}</span>
                          ) : (
                            <span> · <span className="text-slate-400 italic">Wali belum diisi</span></span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                      <div className="text-left sm:text-right">
                        <span className="text-xs font-bold text-emerald-700 tabular-nums block">
                          {b.decimalText} / {student.targetJuz} Juz
                        </span>
                        <span className="text-[10px] text-slate-400 block -mt-0.5">
                          {b.lembarText}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditingSantri(student)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Santri"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirmTarget({
                              type: 'santri',
                              id: student.id,
                              name: student.nama,
                              details: 'Data riwayat setoran hafalan, absensi, dan ujian tasmi santri ini akan dihapus secara permanen.'
                            });
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Santri"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: KELAS */}
      {activeTab === 'kelas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Tambah Kelas Baru</h3>
            <form onSubmit={handleSaveKelas} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kelas</label>
                <input
                  type="text"
                  value={kelasNama}
                  onChange={e => setKelasNama(e.target.value)}
                  placeholder="Contoh: Kelas 7 A"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tingkat Jenjang</label>
                <select
                  value={kelasTingkat}
                  onChange={e => setKelasTingkat(e.target.value as Kelas['tingkat'])}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                >
                  <option value="Ibtidaiyyah">Ibtidaiyyah</option>
                  <option value="Mutawasith">Mutawasith</option>
                  <option value="Aliyah">Aliyah</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wali Kelas <span className="text-slate-400 font-normal text-[11px]">(Tidak wajib diisi)</span>
                </label>
                <input
                  type="text"
                  value={kelasWali}
                  onChange={e => setKelasWali(e.target.value)}
                  placeholder="Nama Ustadz / Ustadzah (Opsional)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Simpan Kelas
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-base">Daftar Kelas ({classes.length})</h3>
            <div className="space-y-2">
              {classes.map(c => {
                const count = santriList.filter(s => s.kelasId === c.id || s.kelasNama === c.nama).length;
                return (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{c.nama}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">{c.tingkat}</span>
                      </div>
                      <span className="text-slate-500">
                        Wali: {c.waliKelas && c.waliKelas.trim() ? c.waliKelas : <span className="italic text-slate-400">Belum ditentukan</span>} · {count} Santri
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingKelas(c)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Kelas"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteConfirmTarget({
                            type: 'kelas',
                            id: c.id,
                            name: c.nama,
                            details: `Kelas ini memiliki ${count} santri terdaftar.`
                          });
                        }}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Kelas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: KELOMPOK / HALAQAH */}
      {activeTab === 'kelompok' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Tambah Halaqah Baru</h3>
            <form onSubmit={handleSaveKelompok} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kelompok</label>
                <input
                  type="text"
                  value={kelompokNama}
                  onChange={e => setKelompokNama(e.target.value)}
                  placeholder="Contoh: Kelompok F"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ustadz / Pengajar</label>
                <input
                  type="text"
                  value={kelompokPengajar}
                  onChange={e => setKelompokPengajar(e.target.value)}
                  placeholder="Nama pengajar..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Simpan Halaqah
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-base">Halaqah yang Ada ({groups.length})</h3>
            <div className="space-y-2">
              {groups.map(g => {
                const count = santriList.filter(s => s.kelompokId === g.id || s.kelompokNama === g.nama).length;
                return (
                  <div key={g.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{g.nama}</span>
                      <span className="text-slate-500">Pengajar: {g.pengajar} · {count} Santri</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingKelompok(g)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Halaqah"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteConfirmTarget({
                            type: 'kelompok',
                            id: g.id,
                            name: g.nama,
                            details: `Halaqah ini dibimbing oleh ${g.pengajar} dan memiliki ${count} santri.`
                          });
                        }}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Halaqah"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TARGET JUZ */}
      {activeTab === 'target' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Tambah Target Baru</h3>
            <form onSubmit={handleSaveTarget} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Target</label>
                <input
                  type="text"
                  value={targetNama}
                  onChange={e => setTargetNama(e.target.value)}
                  placeholder="Contoh: 12 Juz Mutqin"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Juz</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={targetJuz}
                  onChange={e => setTargetJuz(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Simpan Target
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-base">Target Hafalan Tersedia ({targets.length})</h3>
            <div className="space-y-2">
              {targets.map(t => {
                const count = santriList.filter(s => s.targetJuz === t.jumlahJuz).length;
                return (
                  <div key={t.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{t.nama}</span>
                      <span className="text-slate-500">{t.jumlahJuz} Juz · {count} Santri menargetkan</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingTarget(t)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Target"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteConfirmTarget({
                            type: 'target',
                            id: t.id,
                            name: t.nama,
                            details: `Target capaian ${t.jumlahJuz} Juz ini ditargetkan oleh ${count} santri.`
                          });
                        }}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Target"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SESI TAHFIDZ */}
      {activeTab === 'sesi' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Tambah Sesi Baru</h3>
            <form onSubmit={handleSaveSesi} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Sesi</label>
                <input
                  type="text"
                  value={sesiNama}
                  onChange={e => setSesiNama(e.target.value)}
                  placeholder="Contoh: Sesi Ba'da Shubuh"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={sesiMulai}
                    onChange={e => setSesiMulai(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={sesiSelesai}
                    onChange={e => setSesiSelesai(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Simpan Sesi
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-base">Daftar Sesi ({sessions.length})</h3>
            <div className="space-y-2">
              {sessions.map(s => (
                <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{s.nama}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    <span className="text-slate-500">Pukul {s.jamMulai} - {s.jamSelesai} WIB</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateSesi(s.id, { status: s.status === 'Aktif' ? 'Nonaktif' : 'Aktif' })}
                      className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg hover:bg-slate-100 font-medium transition-colors"
                    >
                      {s.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>

                    <button
                      onClick={() => setEditingSesi(s)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Sesi"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDeleteConfirmTarget({
                          type: 'sesi',
                          id: s.id,
                          name: s.nama,
                          details: `Pukul ${s.jamMulai} - ${s.jamSelesai} WIB`
                        });
                      }}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Hapus Sesi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: BACKUP & RESET */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6 max-w-4xl">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Cadangan Data & Pengaturan Ulang
            </h3>
            <p className="text-xs text-slate-500">
              Ekspor seluruh basis data santri dan hafalan ke format JSON, pulihkan cadangan, atau hapus dan kosongkan total semua data.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Export Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Ekspor JSON</h4>
                <p className="text-xs text-slate-600">
                  Unduh file cadangan lengkap santri, riwayat hafalan, absensi, & jadwal tasmi'.
                </p>
              </div>
              <button
                onClick={exportDataJson}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Unduh File JSON
              </button>
            </div>

            {/* Import Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Impor JSON</h4>
                <p className="text-xs text-slate-600">
                  Unggah file cadangan JSON untuk memulihkan seluruh data aplikasi.
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Pilih File Cadangan
              </button>
            </div>

            {/* Reset / Kosongkan Total Card */}
            <div className="p-4 bg-rose-50/70 rounded-2xl border-2 border-rose-200 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-rose-950 text-sm">Kosongkan Semua Data</h4>
                <p className="text-xs text-rose-800 leading-relaxed">
                  Hapus <strong>semua data santri, hafalan, absensi, dan data palsu/contoh</strong> sehingga sistem menjadi <strong>benar-benar kosong (0 data)</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmTarget({
                    type: 'reset',
                    id: 'reset',
                    name: 'Kosongkan Seluruh Data Sistem (Termasuk Data Palsu)',
                    details: 'PERINGATAN: Seluruh data santri, riwayat setoran hafalan, absensi, jadwal tasmi, kelas, halaqah, dan seluruh data contoh/palsu akan DIHAPUS TOTAL dari penyimpanan awan (Firestore) dan perangkat ini. Semua data akan menjadi 0 (KOSONG BERSIH). Data palsu tidak akan dimuat kembali.'
                  });
                }}
                disabled={isClearing}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                {isClearing ? 'Sedang Memproses...' : 'Kosongkan Semua Data'}
              </button>
            </div>

            {/* Muat Data Contoh Demo Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Muat Data Demo</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ingin mencoba fitur dengan data simulasi? Muat kembali 10 data santri contoh lengkap.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmTarget({
                    type: 'load_demo',
                    id: 'load_demo',
                    name: 'Muat 10 Santri Contoh Demo',
                    details: 'Sistem akan memuat 10 data santri contoh lengkap dengan riwayat setoran, absensi, dan jadwal tasmi untuk keperluan simulasi.'
                  });
                }}
                disabled={isClearing}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
              >
                {isClearing ? 'Sedang Memuat...' : 'Muat Contoh Demo'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Editing Santri Modal */}
      {editingSantri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Edit Data Santri</h3>
              <button onClick={() => setEditingSantri(null)} className="p-1.5 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSantri} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={editingSantri.nama}
                  onChange={e => setEditingSantri({ ...editingSantri, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={editingSantri.kelasId}
                    onChange={e => setEditingSantri({ ...editingSantri, kelasId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={editingSantri.gender}
                    onChange={e => setEditingSantri({ ...editingSantri, gender: e.target.value as 'santriwan' | 'santriwati' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  >
                    <option value="santriwan">Santriwan (L)</option>
                    <option value="santriwati">Santriwati (P)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kelompok</label>
                  <select
                    value={editingSantri.kelompokId}
                    onChange={e => setEditingSantri({ ...editingSantri, kelompokId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Hafalan (Juz)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={editingSantri.targetJuz}
                    onChange={e => setEditingSantri({ ...editingSantri, targetJuz: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Capaian Saat Ini (Total Juz)</label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={editingSantri.totalJuzMemorized}
                  onChange={e => setEditingSantri({ ...editingSantri, totalJuzMemorized: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Orang Tua / Wali <span className="text-slate-400 font-normal text-[11px]">(Tidak wajib diisi)</span>
                </label>
                <input
                  type="text"
                  value={editingSantri.orangTuaNama || ''}
                  onChange={e => setEditingSantri({ ...editingSantri, orangTuaNama: e.target.value })}
                  placeholder="Nama Orang Tua/Wali (Opsional)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. HP / WhatsApp Wali <span className="text-slate-400 font-normal text-[11px]">(Tidak wajib diisi)</span>
                </label>
                <input
                  type="tel"
                  value={editingSantri.orangTuaPhone || ''}
                  onChange={e => setEditingSantri({ ...editingSantri, orangTuaPhone: e.target.value })}
                  placeholder="08xxxxxxxxxx (Opsional)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmTarget({
                      type: 'santri',
                      id: editingSantri.id,
                      name: editingSantri.nama,
                      details: 'Data santri, riwayat setoran hafalan, absensi, dan ujian tasmi akan dihapus secara permanen.'
                    });
                  }}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Santri
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSantri(null)}
                    className="py-2 px-3 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Editing Kelas Modal */}
      {editingKelas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Edit Data Kelas</h3>
              <button onClick={() => setEditingKelas(null)} className="p-1.5 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateKelas} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kelas</label>
                <input
                  type="text"
                  value={editingKelas.nama}
                  onChange={e => setEditingKelas({ ...editingKelas, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tingkat Jenjang</label>
                <select
                  value={editingKelas.tingkat}
                  onChange={e => setEditingKelas({ ...editingKelas, tingkat: e.target.value as Kelas['tingkat'] })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                >
                  <option value="Ibtidaiyyah">Ibtidaiyyah</option>
                  <option value="Mutawasith">Mutawasith</option>
                  <option value="Aliyah">Aliyah</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wali Kelas <span className="text-slate-400 font-normal text-[11px]">(Tidak wajib diisi)</span>
                </label>
                <input
                  type="text"
                  value={editingKelas.waliKelas || ''}
                  onChange={e => setEditingKelas({ ...editingKelas, waliKelas: e.target.value })}
                  placeholder="Nama Ustadz / Ustadzah (Opsional)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmTarget({
                      type: 'kelas',
                      id: editingKelas.id,
                      name: editingKelas.nama,
                      details: 'Data kelas ini akan dihapus.'
                    });
                  }}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Kelas
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingKelas(null)}
                    className="py-2 px-3 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Editing Kelompok Modal */}
      {editingKelompok && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Edit Kelompok Halaqah</h3>
              <button onClick={() => setEditingKelompok(null)} className="p-1.5 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateKelompok} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kelompok</label>
                <input
                  type="text"
                  value={editingKelompok.nama}
                  onChange={e => setEditingKelompok({ ...editingKelompok, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pengajar (Ustadz/ah)</label>
                <input
                  type="text"
                  value={editingKelompok.pengajar}
                  onChange={e => setEditingKelompok({ ...editingKelompok, pengajar: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmTarget({
                      type: 'kelompok',
                      id: editingKelompok.id,
                      name: editingKelompok.nama,
                      details: `Halaqah dibimbing oleh ${editingKelompok.pengajar}.`
                    });
                  }}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Halaqah
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingKelompok(null)}
                    className="py-2 px-3 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Editing Target Modal */}
      {editingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Edit Target Hafalan</h3>
              <button onClick={() => setEditingTarget(null)} className="p-1.5 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTarget} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Target</label>
                <input
                  type="text"
                  value={editingTarget.nama}
                  onChange={e => setEditingTarget({ ...editingTarget, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Juz</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={editingTarget.jumlahJuz}
                  onChange={e => setEditingTarget({ ...editingTarget, jumlahJuz: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmTarget({
                      type: 'target',
                      id: editingTarget.id,
                      name: editingTarget.nama,
                      details: `Target capaian ${editingTarget.jumlahJuz} Juz.`
                    });
                  }}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Target
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTarget(null)}
                    className="py-2 px-3 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Editing Sesi Modal */}
      {editingSesi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Edit Sesi Tahfidz</h3>
              <button onClick={() => setEditingSesi(null)} className="p-1.5 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSesi} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Sesi</label>
                <input
                  type="text"
                  value={editingSesi.nama}
                  onChange={e => setEditingSesi({ ...editingSesi, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={editingSesi.jamMulai}
                    onChange={e => setEditingSesi({ ...editingSesi, jamMulai: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={editingSesi.jamSelesai}
                    onChange={e => setEditingSesi({ ...editingSesi, jamSelesai: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status Sesi</label>
                <select
                  value={editingSesi.status}
                  onChange={e => setEditingSesi({ ...editingSesi, status: e.target.value as 'Aktif' | 'Nonaktif' })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmTarget({
                      type: 'sesi',
                      id: editingSesi.id,
                      name: editingSesi.nama,
                      details: `Pukul ${editingSesi.jamMulai} - ${editingSesi.jamSelesai} WIB`
                    });
                  }}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Sesi
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSesi(null)}
                    className="py-2 px-3 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal for Deletion / Reset */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 text-center">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                deleteConfirmTarget.type === 'load_demo' 
                  ? 'bg-amber-100 text-amber-600' 
                  : 'bg-rose-100 text-rose-600'
              }`}>
                {deleteConfirmTarget.type === 'load_demo' ? (
                  <RotateCcw className="w-7 h-7" />
                ) : (
                  <AlertTriangle className="w-7 h-7" />
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">
                {deleteConfirmTarget.type === 'reset'
                  ? 'Konfirmasi Pengosongan Data Total'
                  : deleteConfirmTarget.type === 'load_demo'
                  ? 'Konfirmasi Muat Data Demo'
                  : 'Konfirmasi Hapus Data'}
              </h3>
              <p className="text-sm font-semibold text-slate-800 mb-1">
                "{deleteConfirmTarget.name}"
              </p>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                {deleteConfirmTarget.details || 'Tindakan ini permanen dan data yang dihapus tidak dapat dipulihkan.'}
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTarget(null)}
                  disabled={isClearing}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Batalkan
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isClearing}
                  className={`flex-1 py-2.5 px-4 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                    deleteConfirmTarget.type === 'load_demo'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {deleteConfirmTarget.type === 'load_demo' ? (
                    <RotateCcw className="w-3.5 h-3.5" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  {isClearing
                    ? 'Sedang Memproses...'
                    : deleteConfirmTarget.type === 'reset'
                    ? 'Ya, Hapus & Kosongkan'
                    : deleteConfirmTarget.type === 'load_demo'
                    ? 'Ya, Muat Demo'
                    : 'Ya, Hapus Data'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
