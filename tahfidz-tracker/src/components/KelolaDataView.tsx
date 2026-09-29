import React, { useState, useRef } from 'react';
import { useTahfidz } from '../context/TahfidzContext';
import { ProfileModal } from './ProfileModal';
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
  AlertTriangle,
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Database,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Building,
  Megaphone,
  Terminal,
  FileText,
  Activity,
  Copy,
  Wrench,
  Smartphone,
  UserCheck,
  ArrowRight,
  Layers
} from 'lucide-react';
import { Santri, Kelas, Kelompok, TargetHafalan, SesiTahfidz, UserAccount, User } from '../types';
import { parseHafalan } from '../utils/hafalanFormat';

export const KelolaDataView: React.FC = () => {
  const { 
    currentUser,
    userAccounts,
    registerUserAccount,
    resetUserPassword,
    deleteUserAccount,
    switchRole,
    systemSettings,
    updateSystemSettings,
    systemLogs,
    addSystemLog,
    clearSystemLogs,
    impersonateUser,
    deleteAnyRecord,
    santriList, 
    classes, 
    groups, 
    targets, 
    sessions, 
    attendanceHistory,
    tasmiList,
    isCloudSynced,
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

  type TabType = 'santri' | 'kelas' | 'kelompok' | 'target' | 'sesi' | 'backup' | 'superadmin';
  const [activeTab, setActiveTab] = useState<TabType>('santri');
  const [isClearing, setIsClearing] = useState(false);

  // Super Admin Command Center Sub-Section
  const [superAdminSection, setSuperAdminSection] = useState<'overview' | 'inspector' | 'settings' | 'broadcast' | 'maintenance' | 'logs' | 'users' | 'impersonate'>('overview');

  // Institution & System Settings State
  const [schoolNameInput, setSchoolNameInput] = useState(systemSettings?.schoolName || "Ma'had Tahfidz Al-Qur'an Terpadu");
  const [schoolLeaderInput, setSchoolLeaderInput] = useState(systemSettings?.schoolLeader || 'Ustadz H. Ahmad Ridwan, Lc., M.Ag.');
  const [academicYearInput, setAcademicYearInput] = useState(systemSettings?.academicYear || '2026/2027 (Ganjil)');
  const [minTasmiGradeInput, setMinTasmiGradeInput] = useState(systemSettings?.minTasmiGrade || 'B');
  const [weeklyTargetInput, setWeeklyTargetInput] = useState(systemSettings?.targetWeeklySetoran || 10);
  const [whatsappHelpdeskInput, setWhatsappHelpdeskInput] = useState(systemSettings?.helpdeskWhatsapp || '6281234567800');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Broadcast Announcement State
  const [broadcastActiveInput, setBroadcastActiveInput] = useState(systemSettings?.broadcastAnnouncement?.active || false);
  const [broadcastTypeInput, setBroadcastTypeInput] = useState<'info' | 'announcement' | 'warning'>(systemSettings?.broadcastAnnouncement?.type || 'info');
  const [broadcastMessageInput, setBroadcastMessageInput] = useState(systemSettings?.broadcastAnnouncement?.message || '');
  const [isSavingBroadcast, setIsSavingBroadcast] = useState(false);

  // Database Inspector State
  const [inspectorCollection, setInspectorCollection] = useState<'santri' | 'attendance' | 'tasmi' | 'classes' | 'groups' | 'targets' | 'sessions' | 'users' | 'system_logs'>('santri');
  const [inspectorSearch, setInspectorSearch] = useState('');
  const [selectedDocDetail, setSelectedDocDetail] = useState<any | null>(null);
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);

  // Activity Logs Filter
  const [logCategoryFilter, setLogCategoryFilter] = useState('all');
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Add User Account Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'guru' | 'coordinator'>('guru');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Super Admin Account Management State
  const [accountSearch, setAccountSearch] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'view' | 'edit'>('view');
  const [resetModalAccount, setResetModalAccount] = useState<UserAccount | null>(null);
  const [resetModalNewPassword, setResetModalNewPassword] = useState('');
  const [showResetModalPassword, setShowResetModalPassword] = useState(false);
  const [resetModalFeedback, setResetModalFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  React.useEffect(() => {
    if (activeTab === 'superadmin' && currentUser?.role !== 'super_admin') {
      setActiveTab('santri');
    }
  }, [currentUser, activeTab]);

  React.useEffect(() => {
    if (systemSettings) {
      setSchoolNameInput(systemSettings.schoolName || '');
      setSchoolLeaderInput(systemSettings.schoolLeader || '');
      setAcademicYearInput(systemSettings.academicYear || '');
      setMinTasmiGradeInput(systemSettings.minTasmiGrade || 'B');
      setWeeklyTargetInput(systemSettings.targetWeeklySetoran || 10);
      setWhatsappHelpdeskInput(systemSettings.helpdeskWhatsapp || '');
      setBroadcastActiveInput(systemSettings.broadcastAnnouncement?.active || false);
      setBroadcastTypeInput(systemSettings.broadcastAnnouncement?.type || 'info');
      setBroadcastMessageInput(systemSettings.broadcastAnnouncement?.message || '');
    }
  }, [systemSettings]);

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
  const [kelompokPhone, setKelompokPhone] = useState('');
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

    addKelompok(kelompokNama.trim(), kelompokPengajar.trim(), kelompokPhone.trim());
    setKelompokNama('');
    setKelompokPengajar('');
    setKelompokPhone('');
    showFeedback('Kelompok halaqah baru dan nomor WhatsApp berhasil ditambahkan!');
  };

  const handleUpdateKelompok = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKelompok) return;

    updateKelompok(
      editingKelompok.id, 
      editingKelompok.nama.trim(), 
      editingKelompok.pengajar.trim(), 
      editingKelompok.phone?.trim() || ''
    );
    setEditingKelompok(null);
    showFeedback('Data kelompok halaqah dan no. HP ustadz berhasil diperbarui!');
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
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Kelola Data Master
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manajemen santri, rombel kelas, halaqah, target juz, dan sesi tahfidz
        </p>
      </div>

      {feedbackMsg && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' 
            : 'bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
        }`}>
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-nowrap sm:flex-wrap gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/90 rounded-2xl overflow-x-auto max-w-full scrollbar-none border border-slate-200/60 dark:border-slate-700/60">
        {[
          { id: 'santri' as TabType, label: 'Santri', count: santriList.length, icon: UserPlus },
          { id: 'kelas' as TabType, label: 'Kelas', count: classes.length, icon: GraduationCap },
          { id: 'kelompok' as TabType, label: 'Halaqah', count: groups.length, icon: Users },
          { id: 'target' as TabType, label: 'Target Juz', count: targets.length, icon: Target },
          { id: 'sesi' as TabType, label: 'Sesi', count: sessions.length, icon: Clock },
          { id: 'backup' as TabType, label: 'Backup & Reset', icon: FileJson },
          ...(currentUser?.role === 'super_admin' ? [
            { id: 'superadmin' as TabType, label: '👑 Konsol Super Admin', icon: ShieldAlert }
          ] : [])
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-750'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full tabular-nums font-bold ${
                  isActive ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Tambah Santri Baru
            </h3>

            <form onSubmit={handleSaveSantri} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={santriNama}
                  onChange={e => setSantriNama(e.target.value)}
                  placeholder="Contoh: Muhammad Azzam"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kelas</label>
                  <select
                    value={santriKelasId}
                    onChange={e => setSantriKelasId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                  <select
                    value={santriGender}
                    onChange={e => setSantriGender(e.target.value as 'santriwan' | 'santriwati')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="santriwan">Santriwan (L)</option>
                    <option value="santriwati">Santriwati (P)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kelompok</label>
                  <select
                    value={santriKelompokId}
                    onChange={e => setSantriKelompokId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Hafalan</label>
                  <select
                    value={santriTargetJuz}
                    onChange={e => setSantriTargetJuz(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {targets.map(t => (
                      <option key={t.id} value={t.jumlahJuz}>{t.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Orang Tua / Wali <span className="text-slate-400 dark:text-slate-500 font-normal text-[11px]">(Tidak wajib diisi)</span>
                </label>
                <input
                  type="text"
                  value={santriParentName}
                  onChange={e => setSantriParentName(e.target.value)}
                  placeholder="Contoh: Bapak Hendra (Opsional)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  No. WhatsApp / HP Wali <span className="text-slate-400 dark:text-slate-500 font-normal text-[11px]">(Tidak wajib diisi)</span>
                </label>
                <input
                  type="tel"
                  value={santriParentPhone}
                  onChange={e => setSantriParentPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx (Opsional)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Simpan Data Santri
              </button>
            </form>
          </div>

          {/* Santri List Table */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Daftar Santri Terdaftar ({filteredSantriList.length})
              </h3>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={santriSearch}
                    onChange={e => setSantriSearch(e.target.value)}
                    placeholder="Filter nama..."
                    className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <select
                  value={santriFilterKelas}
                  onChange={e => setSantriFilterKelas(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-emerald-500 outline-none"
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
                    className="p-3 sm:p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        student.gender === 'santriwan' ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900' : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                      }`}>
                        {student.nama.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{student.nama}</h4>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {student.kelasNama} · {student.kelompokNama}
                          {student.orangTuaNama?.trim() ? (
                            <span> · Wali: {student.orangTuaNama} {student.orangTuaPhone?.trim() ? `(${student.orangTuaPhone})` : ''}</span>
                          ) : student.orangTuaPhone?.trim() ? (
                            <span> · HP: {student.orangTuaPhone}</span>
                          ) : (
                            <span> · <span className="text-slate-400 dark:text-slate-500 italic">Wali belum diisi</span></span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800">
                      <div className="text-left sm:text-right">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums block">
                          {b.decimalText} / {student.targetJuz} Juz
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block -mt-0.5">
                          {b.lembarText}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditingSantri(student)}
                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
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
                          className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Tambah Kelas Baru</h3>
            <form onSubmit={handleSaveKelas} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Kelas</label>
                <input
                  type="text"
                  value={kelasNama}
                  onChange={e => setKelasNama(e.target.value)}
                  placeholder="Contoh: Kelas 7 A"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tingkat Jenjang</label>
                <select
                  value={kelasTingkat}
                  onChange={e => setKelasTingkat(e.target.value as Kelas['tingkat'])}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Ibtidaiyyah">Ibtidaiyyah</option>
                  <option value="Mutawasith">Mutawasith</option>
                  <option value="Aliyah">Aliyah</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Wali Kelas <span className="text-slate-400 dark:text-slate-500 font-normal text-[11px]">(Tidak wajib diisi)</span>
                </label>
                <input
                  type="text"
                  value={kelasWali}
                  onChange={e => setKelasWali(e.target.value)}
                  placeholder="Nama Ustadz / Ustadzah (Opsional)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Simpan Kelas
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Daftar Kelas ({classes.length})</h3>
            <div className="space-y-2">
              {classes.map(c => {
                const count = santriList.filter(s => s.kelasId === c.id || s.kelasNama === c.nama).length;
                return (
                  <div key={c.id} className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{c.nama}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">{c.tingkat}</span>
                      </div>
                      <span className="text-slate-500 dark:text-slate-400">
                        Wali: {c.waliKelas && c.waliKelas.trim() ? c.waliKelas : <span className="italic text-slate-400 dark:text-slate-500">Belum ditentukan</span>} · {count} Santri
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingKelas(c)}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
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
                        className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Tambah Halaqah Baru</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tambahkan rombel halaqah beserta no. WhatsApp pengajar untuk kontak wali santri.
              </p>
            </div>
            <form onSubmit={handleSaveKelompok} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Kelompok</label>
                <input
                  type="text"
                  value={kelompokNama}
                  onChange={e => setKelompokNama(e.target.value)}
                  placeholder="Contoh: Kelompok F"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ustadz / Pengajar</label>
                <input
                  type="text"
                  value={kelompokPengajar}
                  onChange={e => setKelompokPengajar(e.target.value)}
                  placeholder="Contoh: Ustadz Abdullah, S.Pd.I"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  No. HP / WhatsApp Pengajar
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={kelompokPhone}
                    onChange={e => setKelompokPhone(e.target.value)}
                    placeholder="Contoh: 081234567801"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  💡 No. HP ini akan tampil di akun wali santri saat konsultasi hafalan & chat WhatsApp.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan Halaqah</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Halaqah yang Ada ({groups.length})</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">Total rombel santri</span>
            </div>
            <div className="space-y-2.5">
              {groups.map(g => {
                const count = santriList.filter(s => s.kelompokId === g.id || s.kelompokNama === g.nama).length;
                return (
                  <div key={g.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{g.nama}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {count} Santri
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <span className="text-slate-500 dark:text-slate-400">Pengajar:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{g.pengajar}</span>
                      </div>
                      {g.phone ? (
                        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                          <a
                            href={`https://wa.me/${g.phone.replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-2xs"
                            title="Buka chat WhatsApp langsung"
                          >
                            <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>WA: {g.phone}</span>
                          </a>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            ✓ Tampil di chat wali santri
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 pt-0.5 text-[11px] text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>No. HP belum ditambahkan (klik edit untuk melengkapi)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => setEditingKelompok(g)}
                        className="px-2.5 py-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors flex items-center gap-1 font-medium text-xs border border-blue-200 dark:border-blue-900/60"
                        title="Edit Halaqah & No. HP"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
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
                        className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60"
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Tambah Target Baru</h3>
            <form onSubmit={handleSaveTarget} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Target</label>
                <input
                  type="text"
                  value={targetNama}
                  onChange={e => setTargetNama(e.target.value)}
                  placeholder="Contoh: 12 Juz Mutqin"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Jumlah Juz</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={targetJuz}
                  onChange={e => setTargetJuz(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Simpan Target
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Target Hafalan Tersedia ({targets.length})</h3>
            <div className="space-y-2">
              {targets.map(t => {
                const count = santriList.filter(s => s.targetJuz === t.jumlahJuz).length;
                return (
                  <div key={t.id} className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block">{t.nama}</span>
                      <span className="text-slate-500 dark:text-slate-400">{t.jumlahJuz} Juz · {count} Santri menargetkan</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingTarget(t)}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
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
                        className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Tambah Sesi Baru</h3>
            <form onSubmit={handleSaveSesi} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Sesi</label>
                <input
                  type="text"
                  value={sesiNama}
                  onChange={e => setSesiNama(e.target.value)}
                  placeholder="Contoh: Sesi Ba'da Shubuh"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={sesiMulai}
                    onChange={e => setSesiMulai(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={sesiSelesai}
                    onChange={e => setSesiSelesai(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Simpan Sesi
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Daftar Sesi ({sessions.length})</h3>
            <div className="space-y-2">
              {sessions.map(s => (
                <div key={s.id} className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{s.nama}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.status === 'Aktif' 
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    <span className="text-slate-500 dark:text-slate-400">Pukul {s.jamMulai} - {s.jamSelesai} WIB</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateSesi(s.id, { status: s.status === 'Aktif' ? 'Nonaktif' : 'Aktif' })}
                      className="px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                    >
                      {s.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>

                    <button
                      onClick={() => setEditingSesi(s)}
                      className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
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
                      className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6 max-w-4xl">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1">
              Cadangan Data & Pengaturan Ulang
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ekspor seluruh basis data santri dan hafalan ke format JSON, pulihkan cadangan, atau hapus dan kosongkan total semua data.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Export Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Ekspor JSON</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Unduh file cadangan lengkap santri, riwayat hafalan, absensi, & jadwal tasmi'.
                </p>
              </div>
              <button
                onClick={exportDataJson}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Unduh File JSON
              </button>
            </div>

            {/* Import Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Impor JSON</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
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
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Pilih File Cadangan
              </button>
            </div>

            {/* Reset / Kosongkan Total Card */}
            <div className="p-4 bg-rose-50/70 dark:bg-rose-950/40 rounded-2xl border-2 border-rose-200 dark:border-rose-900 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-rose-950 dark:text-rose-200 text-sm">Kosongkan Semua Data</h4>
                <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
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
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {isClearing ? 'Sedang Memproses...' : 'Kosongkan Semua Data'}
              </button>
            </div>

            {/* Muat Data Contoh Demo Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Muat Data Demo</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
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
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                {isClearing ? 'Sedang Memuat...' : 'Muat Contoh Demo'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TAB CONTENT: SUPER ADMIN & DATABASE */}
      {activeTab === 'superadmin' && currentUser?.role === 'super_admin' && (
        <div className="space-y-6">
          
          {/* Super Admin Status Banner */}
          <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden border border-amber-500/30">
            <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-lg sm:text-2xl text-white tracking-tight">
                      Konsol Super Administrator
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-amber-950 uppercase tracking-wide">
                      Root Master
                    </span>
                    {systemSettings.maintenanceMode && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white uppercase animate-pulse">
                        Maintenance Mode Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
                    Pusat kendali tertinggi sistem Tahfidz Tracker. Anda memiliki hak akses penuh untuk mengonfigurasi lembaga, menginspeksi koleksi Firestore, menyiarkan pengumuman global, mengatur mode pemeliharaan, serta meninjau audit log aktivitas.
                  </p>
                </div>
              </div>

              {/* Status Session Card */}
              <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-xs space-y-2 shrink-0 lg:min-w-[270px]">
                <div className="flex items-center justify-between text-[11px] text-amber-300/90 font-bold uppercase tracking-wider">
                  <span>Sesi Root Master</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-normal">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </div>
                <div className="space-y-1 text-slate-300 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Username:</span>
                    <span className="font-mono font-bold text-white">AdminBr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tingkat Akses:</span>
                    <span className="text-amber-300 font-semibold">Full System & DB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sinkronisasi:</span>
                    <span className="text-emerald-300 font-semibold">{isCloudSynced ? 'Firestore Cloud' : 'Lokal Storage'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub Navigation Tabs inside Super Admin Console */}
            <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap gap-2">
              {[
                { id: 'overview' as const, label: '📊 Ikhtisar & Database' },
                { id: 'inspector' as const, label: '🔍 Penjelajah Firestore' },
                { id: 'settings' as const, label: '⚙️ Pengaturan Lembaga' },
                { id: 'broadcast' as const, label: '📢 Pengumuman Global' },
                { id: 'maintenance' as const, label: '🛠️ Mode Pemeliharaan' },
                { id: 'logs' as const, label: '📜 Log Aktivitas' },
                { id: 'users' as const, label: '👥 Kelola Akun' },
                { id: 'impersonate' as const, label: '🎭 Simulasi Peran' },
              ].map(sub => {
                const isActive = superAdminSection === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSuperAdminSection(sub.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
                        : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 1: OVERVIEW & METRICS */}
          {superAdminSection === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  { label: 'Data Santri', count: santriList.length, icon: UserPlus, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                  { label: 'Rombel Kelas', count: classes.length, icon: GraduationCap, color: 'text-blue-700 bg-blue-50 border-blue-200' },
                  { label: 'Halaqah Qur\'an', count: groups.length, icon: Users, color: 'text-teal-700 bg-teal-50 border-teal-200' },
                  { label: 'Riwayat Absensi', count: attendanceHistory.length, icon: Clock, color: 'text-amber-700 bg-amber-50 border-amber-200' },
                  { label: 'Ujian Tasmi', count: tasmiList.length, icon: Target, color: 'text-purple-700 bg-purple-50 border-purple-200' },
                  { label: 'Akun Pengguna', count: userAccounts.length + 1, icon: KeyRound, color: 'text-rose-700 bg-rose-50 border-rose-200' },
                  { label: 'Log Aktivitas', count: systemLogs.length, icon: Activity, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className={`p-4 rounded-2xl border ${stat.color} flex flex-col justify-between`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold opacity-80">{stat.label}</span>
                        <Icon className="w-4 h-4 opacity-75 shrink-0" />
                      </div>
                      <div className="text-2xl font-black tabular-nums tracking-tight">
                        {stat.count}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Cadangan Basis Data Komplit (JSON)</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Unduh snapshot komplit seluruh koleksi santri, hafalan, riwayat absensi, ujian tasmi, akun pengguna, dan konfigurasi sistem ke satu file JSON.
                  </p>
                  <button
                    type="button"
                    onClick={exportDataJson}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    Unduh Cadangan JSON
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                    <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Muat Data Demo Pengujian</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Muat 10 data santri contoh lengkap beserta setoran mutqin, absensi halaqah harian, dan jadwal tasmi untuk keperluan demonstrasi atau pengujian.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmTarget({
                        type: 'load_demo',
                        id: 'load_demo',
                        name: 'Muat 10 Santri Contoh Demo',
                        details: 'Sistem akan memuat data demo lengkap untuk keperluan demonstrasi atau pengujian sistem.'
                      });
                    }}
                    disabled={isClearing}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    {isClearing ? 'Memuat...' : 'Muat 10 Santri Demo'}
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm">
                    <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Pembersihan Total Basis Data</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Mengosongkan seluruh santri, rekaman hafalan, dan riwayat absensi dari database untuk memulai sistem dari awal secara bersih.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmTarget({
                        type: 'reset',
                        id: 'reset_all',
                        name: 'KOSONGKAN SEMUA DATA',
                        details: 'PERINGATAN: Semua santri, riwayat absensi, setoran hafalan, dan tasmi akan dihapus total dari database!'
                      });
                    }}
                    disabled={isClearing}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    {isClearing ? 'Mengosongkan...' : 'Kosongkan Basis Data'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: FIRESTORE INSPECTOR */}
          {superAdminSection === 'inspector' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Penjelajah & Inspeksi Dokumen Firestore</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Inspeksi struktur data JSON mentah, salin dokumen, atau lakukan penghapusan langsung per dokumen.
                  </p>
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  Total {
                    inspectorCollection === 'santri' ? santriList.length :
                    inspectorCollection === 'attendance' ? attendanceHistory.length :
                    inspectorCollection === 'tasmi' ? tasmiList.length :
                    inspectorCollection === 'classes' ? classes.length :
                    inspectorCollection === 'groups' ? groups.length :
                    inspectorCollection === 'targets' ? targets.length :
                    inspectorCollection === 'sessions' ? sessions.length :
                    inspectorCollection === 'users' ? userAccounts.length :
                    systemLogs.length
                  } dokumen
                </div>
              </div>

              {/* Collection Selector Tabs */}
              <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
                {[
                  { id: 'santri' as const, label: 'santri', count: santriList.length },
                  { id: 'attendance' as const, label: 'attendance', count: attendanceHistory.length },
                  { id: 'tasmi' as const, label: 'tasmi', count: tasmiList.length },
                  { id: 'classes' as const, label: 'classes', count: classes.length },
                  { id: 'groups' as const, label: 'groups', count: groups.length },
                  { id: 'targets' as const, label: 'targets', count: targets.length },
                  { id: 'sessions' as const, label: 'sessions', count: sessions.length },
                  { id: 'users' as const, label: 'users', count: userAccounts.length },
                  { id: 'system_logs' as const, label: 'system_logs', count: systemLogs.length },
                ].map(col => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => {
                      setInspectorCollection(col.id);
                      setInspectorSearch('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                      inspectorCollection === col.id
                        ? 'bg-amber-400 dark:bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <span>{col.label}</span>
                    <span className="text-[10px] opacity-75 tabular-nums">({col.count})</span>
                  </button>
                ))}
              </div>

              {/* Inspector Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={inspectorSearch}
                  onChange={e => setInspectorSearch(e.target.value)}
                  placeholder={`Cari di koleksi '${inspectorCollection}' (ID, nama, detail)...`}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              {/* Document List Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-mono">
                      <th className="py-2 px-3 font-semibold w-1/4">Doc ID</th>
                      <th className="py-2 px-3 font-semibold">Ringkasan Field Utama</th>
                      <th className="py-2 px-3 font-semibold text-right w-44">Aksi Dokumen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                    {(() => {
                      let docs: any[] = [];
                      if (inspectorCollection === 'santri') docs = santriList;
                      else if (inspectorCollection === 'attendance') docs = attendanceHistory;
                      else if (inspectorCollection === 'tasmi') docs = tasmiList;
                      else if (inspectorCollection === 'classes') docs = classes;
                      else if (inspectorCollection === 'groups') docs = groups;
                      else if (inspectorCollection === 'targets') docs = targets;
                      else if (inspectorCollection === 'sessions') docs = sessions;
                      else if (inspectorCollection === 'users') docs = userAccounts;
                      else if (inspectorCollection === 'system_logs') docs = systemLogs;

                      const filtered = docs.filter(d => {
                        if (!inspectorSearch.trim()) return true;
                        const str = JSON.stringify(d).toLowerCase();
                        return str.includes(inspectorSearch.toLowerCase());
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={3} className="py-6 text-center text-slate-400 dark:text-slate-500 font-sans text-xs">
                              Tidak ada dokumen ditemukan di koleksi ini.
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map((docItem, idx) => {
                        const docId = docItem.id || `doc-${idx}`;
                        return (
                          <tr key={docId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200 break-all max-w-[200px]">
                              {docId}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-sans truncate max-w-md">
                              {inspectorCollection === 'santri' && `${docItem.nama} · Kelas: ${docItem.kelasNama || '-'} · ${docItem.totalHalamanHafalan || 0} halaman`}
                              {inspectorCollection === 'attendance' && `${docItem.tanggal} · Santri ID: ${docItem.santriId} · Status: ${docItem.status} · Sesi: ${docItem.sesi}`}
                              {inspectorCollection === 'tasmi' && `${docItem.santriNama} · Juz ${docItem.juz} · Nilai: ${docItem.predikat || docItem.nilaiAngka || 'Belum diuji'}`}
                              {inspectorCollection === 'classes' && `${docItem.nama} (Tingkat: ${docItem.tingkat}) · Wali: ${docItem.waliKelas || '-'}`}
                              {inspectorCollection === 'groups' && `${docItem.nama} · Pengajar: ${docItem.pengajar}`}
                              {inspectorCollection === 'targets' && `${docItem.nama} · ${docItem.jumlahJuz} Juz`}
                              {inspectorCollection === 'sessions' && `${docItem.nama} (${docItem.jamMulai} - ${docItem.jamSelesai})`}
                              {inspectorCollection === 'users' && `${docItem.name} · ${docItem.email} · Role: ${docItem.role}`}
                              {inspectorCollection === 'system_logs' && `[${docItem.category}] ${docItem.action}: ${docItem.details}`}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5 font-sans">
                                <button
                                  type="button"
                                  onClick={() => setSelectedDocDetail(docItem)}
                                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors"
                                  title="Lihat format JSON lengkap"
                                >
                                  JSON
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(JSON.stringify(docItem, null, 2));
                                    setCopiedDocId(docId);
                                    setTimeout(() => setCopiedDocId(null), 1500);
                                  }}
                                  className="px-2 py-1 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                  title="Salin JSON ke clipboard"
                                >
                                  {copiedDocId === docId ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedDocId === docId ? 'Disalin' : 'Salin'}</span>
                                </button>
                                {inspectorCollection !== 'system_logs' && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (window.confirm(`Hapus dokumen '${docId}' dari koleksi '${inspectorCollection}'?`)) {
                                        const success = await deleteAnyRecord(inspectorCollection, docId);
                                        if (success) {
                                          showFeedback(`Dokumen ${docId} berhasil dihapus.`);
                                        } else {
                                          showFeedback(`Gagal menghapus dokumen.`, 'error');
                                        }
                                      }
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                    title="Hapus Dokumen Langsung"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 3: INSTITUTION & SYSTEM SETTINGS */}
          {superAdminSection === 'settings' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5 animate-in fade-in duration-150">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                  <Building className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Pengaturan Identitas Lembaga & Kebijakan Tahfidz</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Konfigurasi nama ma'had, pimpinan lembaga, tahun ajaran aktif, dan parameter kurikulum tahfidz.
                </p>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSavingSettings(true);
                  await updateSystemSettings({
                    schoolName: schoolNameInput,
                    schoolLeader: schoolLeaderInput,
                    academicYear: academicYearInput,
                    minTasmiGrade: minTasmiGradeInput,
                    targetWeeklySetoran: Number(weeklyTargetInput),
                    helpdeskWhatsapp: whatsappHelpdeskInput
                  });
                  setIsSavingSettings(false);
                  showFeedback('Pengaturan sistem dan identitas lembaga berhasil disimpan!');
                }}
                className="space-y-4 max-w-2xl"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lembaga / Pondok Pesantren / Sekolah
                  </label>
                  <input
                    type="text"
                    value={schoolNameInput}
                    onChange={e => setSchoolNameInput(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl text-xs sm:text-sm focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Contoh: Ma'had Tahfidz Al-Qur'an Terpadu"
                  />
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">Ditampilkan pada kop laporan PDF, navbar, dan header aplikasi.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Mudir / Kepala Madrasah
                    </label>
                    <input
                      type="text"
                      value={schoolLeaderInput}
                      onChange={e => setSchoolLeaderInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl text-xs sm:text-sm focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-amber-500 outline-none"
                      placeholder="Contoh: Ustadz H. Ahmad Ridwan, Lc."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tahun Ajaran & Semester Aktif
                    </label>
                    <input
                      type="text"
                      value={academicYearInput}
                      onChange={e => setAcademicYearInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl text-xs sm:text-sm focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-amber-500 outline-none"
                      placeholder="Contoh: 2026/2027 (Ganjil)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Standar Predikat Kelulusan Tasmi Minimal
                    </label>
                    <select
                      value={minTasmiGradeInput}
                      onChange={e => setMinTasmiGradeInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs sm:text-sm focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                      <option value="A">Predikat A (Mumtaz / Sangat Baik)</option>
                      <option value="B">Predikat B (Jayyid Jiddan / Baik Sekali)</option>
                      <option value="C">Predikat C (Jayyid / Cukup)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Target Setoran Mutqin Mingguan Santri
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={weeklyTargetInput}
                      onChange={e => setWeeklyTargetInput(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs sm:text-sm focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">Digunakan sebagai parameter capaian pada grafik tren hafalan.</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor WhatsApp Pusat Bantuan / Helpdesk Madrasah
                  </label>
                  <input
                    type="text"
                    value={whatsappHelpdeskInput}
                    onChange={e => setWhatsappHelpdeskInput(e.target.value)}
                    placeholder="Contoh: 6281234567890"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl text-xs sm:text-sm focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">Gunakan format internasional tanpa tanda + (contoh: 6281234567890).</span>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="py-2.5 px-6 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavingSettings ? 'Menyimpan Konfigurasi...' : 'Simpan Perubahan Pengaturan'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION 4: BROADCAST ANNOUNCEMENT */}
          {superAdminSection === 'broadcast' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5 animate-in fade-in duration-150">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Siaran Pengumuman Global (Broadcast Banner)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tampilkan spanduk pengumuman darurat atau info penting di bagian atas layar seluruh pengguna yang sedang aktif.
                </p>
              </div>

              {/* Live Preview */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Pratinjau Langsung (Live Preview):</div>
                <div className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                  !broadcastActiveInput
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                    : broadcastTypeInput === 'warning'
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
                    : broadcastTypeInput === 'announcement'
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                }`}>
                  <div className="flex items-center gap-2 truncate">
                    <Megaphone className="w-4 h-4 shrink-0" />
                    <div className="truncate">
                      <strong className="mr-1.5 uppercase font-bold text-[10px] tracking-wide">
                        {broadcastTypeInput === 'warning' ? 'Peringatan' : broadcastTypeInput === 'announcement' ? 'Pengumuman' : 'Informasi'}:
                      </strong>
                      <span>{broadcastMessageInput || '(Belum ada pesan yang diketik)'}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    broadcastActiveInput ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {broadcastActiveInput ? 'Aktif Tayang' : 'Nonaktif'}
                  </span>
                </div>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSavingBroadcast(true);
                  await updateSystemSettings({
                    broadcastAnnouncement: {
                      active: broadcastActiveInput,
                      type: broadcastTypeInput,
                      message: broadcastMessageInput
                    }
                  });
                  setIsSavingBroadcast(false);
                  showFeedback(broadcastActiveInput ? 'Pengumuman global berhasil disiarkan!' : 'Pengumuman global dinonaktifkan.');
                }}
                className="space-y-4 max-w-2xl pt-2"
              >
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <input
                    type="checkbox"
                    id="broadcastActive"
                    checked={broadcastActiveInput}
                    onChange={e => setBroadcastActiveInput(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <label htmlFor="broadcastActive" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                    Aktifkan Penyiaran Pengumuman di Seluruh Halaman Pengguna
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipe / Kategori Pesan
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'info' as const, label: 'Informasi', desc: 'Warna Hijau' },
                      { id: 'announcement' as const, label: 'Pengumuman', desc: 'Warna Kuning' },
                      { id: 'warning' as const, label: 'Peringatan', desc: 'Warna Merah' },
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setBroadcastTypeInput(t.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                          broadcastTypeInput === t.id
                            ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 text-slate-900 dark:text-slate-100 font-bold shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="font-semibold">{t.label}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teks Isi Pengumuman
                  </label>
                  <textarea
                    rows={3}
                    value={broadcastMessageInput}
                    onChange={e => setBroadcastMessageInput(e.target.value)}
                    placeholder="Contoh: Tasmi Akbar Akhir Semester akan dilaksanakan pada hari Sabtu, 15 Oktober 2026. Harap para asatidz merekap setoran santri."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl text-xs sm:text-sm focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingBroadcast}
                    className="py-2.5 px-6 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavingBroadcast ? 'Menyimpan...' : 'Simpan & Terapkan Pengumuman'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION 5: MAINTENANCE MODE */}
          {superAdminSection === 'maintenance' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5 animate-in fade-in duration-150">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Mode Pemeliharaan Sistem (Maintenance Mode)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Kunci akses sementara untuk seluruh guru, asatidz, dan wali santri ketika sedang melakukan migrasi atau perbaikan basis data.
                </p>
              </div>

              {/* Maintenance Status Info */}
              <div className={`p-4 rounded-2xl border ${
                systemSettings.maintenanceMode 
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-200' 
                  : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200'
              } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${systemSettings.maintenanceMode ? 'bg-rose-600 animate-pulse' : 'bg-emerald-600'}`} />
                    <span className="font-bold text-sm">
                      Status Saat Ini: {systemSettings.maintenanceMode ? 'Mode Pemeliharaan AKTIF' : 'Sistem Normal (Online)'}
                    </span>
                  </div>
                  <p className="text-xs opacity-85 leading-relaxed">
                    {systemSettings.maintenanceMode 
                      ? 'Pengguna umum (guru, ustadz, dan wali santri) saat ini diblokir dari antarmuka utama dan diarahkan ke halaman pemeliharaan.'
                      : 'Seluruh pengguna dapat masuk dan menggunakan seluruh fitur Tahfidz Tracker seperti biasa.'
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const newStatus = !systemSettings.maintenanceMode;
                    await updateSystemSettings({ maintenanceMode: newStatus });
                    showFeedback(newStatus ? 'Mode pemeliharaan berhasil diaktifkan!' : 'Sistem kembali normal online.');
                  }}
                  className={`py-2 px-5 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 ${
                    systemSettings.maintenanceMode
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {systemSettings.maintenanceMode ? 'Matikan Mode Pemeliharaan' : 'Aktifkan Mode Pemeliharaan'}
                </button>
              </div>

              {/* Explanatory Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Kekebalan Akses Super Administrator</span>
                </div>
                <p>
                  Sebagai <strong>Super Administrator</strong>, Anda selalu dapat masuk dan mengoperasikan sistem meskipun Mode Pemeliharaan sedang menyala. Sebuah bilah peringatan oranye akan muncul di bagian atas untuk mengingatkan Anda bahwa sistem sedang dalam mode tertutup untuk publik.
                </p>
              </div>
            </div>
          )}

          {/* SECTION 6: SYSTEM LOGS */}
          {superAdminSection === 'logs' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Audit Log & Catatan Aktivitas Sistem ({systemLogs.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Rekaman peristiwa keamanan, manipulasi data santri, otentikasi login, dan perubahan pengaturan secara realtime.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(systemLogs, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Log</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Bersihkan seluruh catatan riwayat log aktivitas?')) {
                        clearSystemLogs();
                        showFeedback('Riwayat log berhasil dibersihkan.');
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Bersihkan</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={e => setLogSearchQuery(e.target.value)}
                    placeholder="Cari tindakan atau rincian log..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {['all', 'AUTH', 'DATA', 'SECURITY', 'SYSTEM'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setLogCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                        logCategoryFilter === cat
                          ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logs Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-mono">
                      <th className="py-2.5 px-3 font-semibold w-40">Waktu</th>
                      <th className="py-2.5 px-3 font-semibold w-24">Kategori</th>
                      <th className="py-2.5 px-3 font-semibold w-48">Tindakan</th>
                      <th className="py-2.5 px-3 font-semibold">Rincian Peristiwa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                    {systemLogs
                      .filter(l => {
                        if (logCategoryFilter !== 'all' && l.category !== logCategoryFilter) return false;
                        if (logSearchQuery.trim()) {
                          const q = logSearchQuery.toLowerCase();
                          return l.action.toLowerCase().includes(q) || l.details.toLowerCase().includes(q);
                        }
                        return true;
                      })
                      .map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-2 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString('id-ID')}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.category === 'SECURITY'
                                ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                                : log.category === 'AUTH'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                : log.category === 'DATA'
                                ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300'
                            }`}>
                              {log.category}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200 font-sans">
                            {log.action}
                          </td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400 font-sans">
                            {log.details}
                          </td>
                        </tr>
                      ))}
                    {systemLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-slate-500 font-sans text-xs">
                          Belum ada catatan aktivitas tercatat.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 7: USER ACCOUNTS MANAGEMENT */}
          {superAdminSection === 'users' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Daftar Akun Pengguna & Hak Akses ({userAccounts.length + 1})</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Super Admin dapat melihat semua pengguna, mereset kata sandi, dan mengelola hak akses database.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Search User Input */}
                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={accountSearch}
                      onChange={e => setAccountSearch(e.target.value)}
                      placeholder="Cari akun..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setNewUserName('');
                      setNewUserEmail('');
                      setNewUserUsername('');
                      setNewUserPassword('');
                      setNewUserRole('guru');
                      setNewUserPhone('');
                      setIsAddUserModalOpen(true);
                    }}
                    className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Akun</span>
                  </button>
                </div>
              </div>

              {/* Current User Quick Profile Banner */}
              <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800/90 dark:to-slate-850 rounded-2xl border border-emerald-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                    {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'US'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                        {currentUser?.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        {currentUser?.role === 'super_admin' ? '👑 Super Admin' : currentUser?.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {currentUser?.username ? `@${currentUser.username}` : currentUser?.email} · {currentUser?.phone || 'Nomor kontak dapat diatur di edit profil'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileModalTab('view');
                      setIsProfileModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-600 transition-colors shadow-xs"
                  >
                    Lihat Profil
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileModalTab('edit');
                      setIsProfileModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                  >
                    Edit Profil Saya
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-3 font-semibold">Pengguna</th>
                      <th className="py-2.5 px-3 font-semibold">Username / Email</th>
                      <th className="py-2.5 px-3 font-semibold">Hak Akses (Role)</th>
                      <th className="py-2.5 px-3 font-semibold">Kontak</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Aksi Super Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {/* Built-in Super Admin row */}
                    <tr className="bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50/80 dark:hover:bg-amber-950/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>👑 Super Admin Database</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold">
                            Master
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Akun Super Administrator Utama</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">AdminBr</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">adminbr@tahfidz.sch.id</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 uppercase">
                          super_admin
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                        Pusat Madrasah
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setResetModalAccount({
                              id: 'admin-master-br',
                              name: 'Super Admin Database (AdminBr)',
                              username: 'AdminBr',
                              email: 'adminbr@tahfidz.sch.id',
                              role: 'super_admin'
                            });
                            setResetModalNewPassword('adminbr123');
                            setResetModalFeedback(null);
                          }}
                          className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Info Akun
                        </button>
                      </td>
                    </tr>

                    {/* Registered User Accounts */}
                    {userAccounts
                      .filter(u => {
                        if (!accountSearch.trim()) return true;
                        const q = accountSearch.toLowerCase();
                        return (
                          u.name.toLowerCase().includes(q) ||
                          (u.username && u.username.toLowerCase().includes(q)) ||
                          u.email.toLowerCase().includes(q) ||
                          u.role.toLowerCase().includes(q)
                        );
                      })
                      .map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{u.name}</div>
                            {u.studentName && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                Wali dari: <strong>{u.studentName}</strong>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-mono text-slate-800 dark:text-slate-200">{u.username || '-'}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{u.email}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              u.role === 'super_admin'
                                ? 'bg-amber-200 dark:bg-amber-950 text-amber-950 dark:text-amber-200'
                                : u.role === 'admin'
                                ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                                : u.role === 'guru'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                : u.role === 'coordinator'
                                ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                                : 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            {u.phone || '-'}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setResetModalAccount(u);
                                  setResetModalNewPassword('');
                                  setResetModalFeedback(null);
                                }}
                                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950 text-slate-700 dark:text-slate-300 hover:text-amber-900 dark:hover:text-amber-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                                title="Reset Password Akun Ini"
                              >
                                <Lock className="w-3 h-3" />
                                <span>Reset Password</span>
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (window.confirm(`Yakin ingin menghapus akun ${u.name} (${u.email})?`)) {
                                    const res = await deleteUserAccount(u.id);
                                    showFeedback(res.message, res.success ? 'success' : 'error');
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Hapus Akun Pengguna"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {userAccounts.length === 0 && (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                    Belum ada akun pengguna tambahan yang terdaftar.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 8: ROLE IMPERSONATION & SIMULATION */}
          {superAdminSection === 'impersonate' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5 animate-in fade-in duration-150">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Simulasi Pengalaman Pengguna (Role Impersonation)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Uji coba seluruh antarmuka dan batasan hak akses sebagai peran lain. Sebuah tombol melayang akan muncul di bawah layar agar Anda dapat kembali ke mode Super Admin kapan pun.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Impersonate as Admin */}
                <div className="p-5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/30 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/70 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                      <Shield className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Simulasi Sebagai Administrator</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Melihat fitur dari sudut pandang staf tata usaha / pengelola data hafalan dan absensi (tanpa akses konsol root super admin).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      impersonateUser({
                        id: 'simulated-admin',
                        name: 'Staf Administrasi (Simulasi)',
                        username: 'admin_simulasi',
                        email: 'admin.simulasi@tahfidz.sch.id',
                        role: 'admin'
                      });
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    Masuk Sebagai Admin
                  </button>
                </div>

                {/* Impersonate as Guru / Asatidz */}
                <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/30 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Simulasi Sebagai Guru / Ustadz</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Menguji pengalaman mencatat hafalan harian di halaqah, mengisi absensi, dan memberi nilai ujian tasmi.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      impersonateUser({
                        id: 'simulated-guru',
                        name: 'Ustadz Ahmad Fauzi (Simulasi)',
                        username: 'guru_simulasi',
                        email: 'guru.simulasi@tahfidz.sch.id',
                        role: 'guru'
                      });
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    Masuk Sebagai Guru
                  </button>
                </div>

                {/* Impersonate as Wali Santri */}
                <div className="p-5 rounded-2xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-950/30 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/70 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Simulasi Sebagai Wali Santri</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Melihat dasbor santri, progres hafalan, catatan guru halaqah, dan fitur kirim pesan WhatsApp dari kacamata orang tua.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const firstStudent = santriList[0];
                      impersonateUser({
                        id: 'simulated-parent',
                        name: firstStudent ? `Wali ${firstStudent.nama} (Simulasi)` : 'Wali Santri (Simulasi)',
                        username: 'wali_simulasi',
                        email: 'wali.simulasi@tahfidz.sch.id',
                        role: 'parent',
                        studentId: firstStudent?.id,
                        studentName: firstStudent?.nama
                      });
                    }}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    Masuk Sebagai Wali Santri
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Editing Santri Modal */}
      {editingSantri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Edit Data Santri</h3>
              <button onClick={() => setEditingSantri(null)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSantri} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={editingSantri.nama}
                  onChange={e => setEditingSantri({ ...editingSantri, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kelas</label>
                  <select
                    value={editingSantri.kelasId}
                    onChange={e => setEditingSantri({ ...editingSantri, kelasId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                  <select
                    value={editingSantri.gender}
                    onChange={e => setEditingSantri({ ...editingSantri, gender: e.target.value as 'santriwan' | 'santriwati' })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="santriwan">Santriwan (L)</option>
                    <option value="santriwati">Santriwati (P)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kelompok</label>
                  <select
                    value={editingSantri.kelompokId}
                    onChange={e => setEditingSantri({ ...editingSantri, kelompokId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Hafalan (Juz)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={editingSantri.targetJuz}
                    onChange={e => setEditingSantri({ ...editingSantri, targetJuz: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Capaian Saat Ini (Total Juz)</label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={editingSantri.totalJuzMemorized}
                  onChange={e => setEditingSantri({ ...editingSantri, totalJuzMemorized: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Orang Tua / Wali <span className="text-slate-400 dark:text-slate-500 font-normal text-[11px]">(Tidak wajib diisi)</span>
                </label>
                <input
                  type="text"
                  value={editingSantri.orangTuaNama || ''}
                  onChange={e => setEditingSantri({ ...editingSantri, orangTuaNama: e.target.value })}
                  placeholder="Nama Orang Tua/Wali (Opsional)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  No. HP / WhatsApp Wali <span className="text-slate-400 dark:text-slate-500 font-normal text-[11px]">(Tidak wajib diisi)</span>
                </label>
                <input
                  type="tel"
                  value={editingSantri.orangTuaPhone || ''}
                  onChange={e => setEditingSantri({ ...editingSantri, orangTuaPhone: e.target.value })}
                  placeholder="08xxxxxxxxxx (Opsional)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
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
                  className="px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Santri
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSantri(null)}
                    className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Edit Data Kelas</h3>
              <button onClick={() => setEditingKelas(null)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateKelas} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Kelas</label>
                <input
                  type="text"
                  value={editingKelas.nama}
                  onChange={e => setEditingKelas({ ...editingKelas, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tingkat Jenjang</label>
                <select
                  value={editingKelas.tingkat}
                  onChange={e => setEditingKelas({ ...editingKelas, tingkat: e.target.value as Kelas['tingkat'] })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Ibtidaiyyah">Ibtidaiyyah</option>
                  <option value="Mutawasith">Mutawasith</option>
                  <option value="Aliyah">Aliyah</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Wali Kelas <span className="text-slate-400 dark:text-slate-500 font-normal text-[11px]">(Tidak wajib diisi)</span>
                </label>
                <input
                  type="text"
                  value={editingKelas.waliKelas || ''}
                  onChange={e => setEditingKelas({ ...editingKelas, waliKelas: e.target.value })}
                  placeholder="Nama Ustadz / Ustadzah (Opsional)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
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
                  className="px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Kelas
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingKelas(null)}
                    className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Edit Kelompok Halaqah</h3>
              <button onClick={() => setEditingKelompok(null)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateKelompok} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Kelompok</label>
                <input
                  type="text"
                  value={editingKelompok.nama}
                  onChange={e => setEditingKelompok({ ...editingKelompok, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Pengajar (Ustadz/ah)</label>
                <input
                  type="text"
                  value={editingKelompok.pengajar}
                  onChange={e => setEditingKelompok({ ...editingKelompok, pengajar: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  No. HP / WhatsApp Pengajar
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={editingKelompok.phone || ''}
                    onChange={e => setEditingKelompok({ ...editingKelompok, phone: e.target.value })}
                    placeholder="Contoh: 081234567801"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Nomor ini akan langsung tampil saat orang tua / wali santri ingin menghubungi ustadz via WhatsApp.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
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
                  className="px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Halaqah
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingKelompok(null)}
                    className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Edit Target Hafalan</h3>
              <button onClick={() => setEditingTarget(null)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTarget} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Target</label>
                <input
                  type="text"
                  value={editingTarget.nama}
                  onChange={e => setEditingTarget({ ...editingTarget, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Jumlah Juz</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={editingTarget.jumlahJuz}
                  onChange={e => setEditingTarget({ ...editingTarget, jumlahJuz: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
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
                  className="px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Target
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTarget(null)}
                    className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Edit Sesi Tahfidz</h3>
              <button onClick={() => setEditingSesi(null)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSesi} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Sesi</label>
                <input
                  type="text"
                  value={editingSesi.nama}
                  onChange={e => setEditingSesi({ ...editingSesi, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={editingSesi.jamMulai}
                    onChange={e => setEditingSesi({ ...editingSesi, jamMulai: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={editingSesi.jamSelesai}
                    onChange={e => setEditingSesi({ ...editingSesi, jamSelesai: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status Sesi</label>
                <select
                  value={editingSesi.status}
                  onChange={e => setEditingSesi({ ...editingSesi, status: e.target.value as 'Aktif' | 'Nonaktif' })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
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
                  className="px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Sesi
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSesi(null)}
                    className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">
            <div className="p-6 text-center">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                deleteConfirmTarget.type === 'load_demo' 
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' 
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
              }`}>
                {deleteConfirmTarget.type === 'load_demo' ? (
                  <RotateCcw className="w-7 h-7" />
                ) : (
                  <AlertTriangle className="w-7 h-7" />
                )}
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-2">
                {deleteConfirmTarget.type === 'reset'
                  ? 'Konfirmasi Pengosongan Data Total'
                  : deleteConfirmTarget.type === 'load_demo'
                  ? 'Konfirmasi Muat Data Demo'
                  : 'Konfirmasi Hapus Data'}
              </h3>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                "{deleteConfirmTarget.name}"
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                {deleteConfirmTarget.details || 'Tindakan ini permanen dan data yang dihapus tidak dapat dipulihkan.'}
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTarget(null)}
                  disabled={isClearing}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
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

      {/* Inspector JSON Detail Modal */}
      {selectedDocDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Inspeksi Data Mentah JSON</h3>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">ID: {selectedDocDetail.id || 'Tanpa ID'}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDocDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto">
              <pre className="p-4 bg-slate-950 dark:bg-slate-950 text-emerald-400 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800 selection:bg-emerald-800 selection:text-white">
                {JSON.stringify(selectedDocDetail, null, 2)}
              </pre>
            </div>

            <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Format standar dokumen Cloud Firestore
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedDocDetail, null, 2));
                    showFeedback('JSON berhasil disalin ke clipboard!');
                  }}
                  className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDocDetail(null)}
                  className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Account Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Tambah Akun Pengguna Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
                  showFeedback('Harap lengkapi semua kolom wajib.', 'error');
                  return;
                }
                if (newUserPassword.length < 6) {
                  showFeedback('Password minimal 6 karakter.', 'error');
                  return;
                }

                setIsSubmittingUser(true);
                const res = await registerUserAccount({
                  name: newUserName.trim(),
                  username: newUserUsername.trim() || undefined,
                  email: newUserEmail.trim(),
                  password: newUserPassword,
                  role: newUserRole,
                  phone: newUserPhone.trim() || undefined
                });
                setIsSubmittingUser(false);

                if (res.success) {
                  showFeedback(`Akun ${newUserName} berhasil dibuat!`);
                  setIsAddUserModalOpen(false);
                } else {
                  showFeedback(res.message, 'error');
                }
              }}
              className="p-6 space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="Contoh: Ustadz Muhammad Yusuf, S.Pd.I."
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={newUserUsername}
                    onChange={e => setNewUserUsername(e.target.value)}
                    placeholder="Contoh: ustadzyusuf"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hak Akses (Role) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="guru">Guru / Asatidz Halaqah</option>
                    <option value="admin">Administrator Biasa</option>
                    <option value="coordinator">Koordinator Tahfidz</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Akun <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="yusuf@tahfidz.sch.id"
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor WhatsApp
                </label>
                <input
                  type="text"
                  value={newUserPhone}
                  onChange={e => setNewUserPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password Awal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  placeholder="Minimal 6 karakter..."
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition-colors"
                >
                  {isSubmittingUser ? 'Menyimpan...' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super Admin Reset Password Modal */}
      {resetModalAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Reset Password Pengguna</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{resetModalAccount.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setResetModalAccount(null)} 
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setResetModalFeedback(null);
                if (!resetModalNewPassword) {
                  setResetModalFeedback({ type: 'error', text: 'Password baru wajib diisi.' });
                  return;
                }
                if (resetModalNewPassword.length < 6) {
                  setResetModalFeedback({ type: 'error', text: 'Password minimal 6 karakter.' });
                  return;
                }

                setIsResettingPassword(true);
                const identifier = resetModalAccount.username || resetModalAccount.email;
                const res = await resetUserPassword(identifier, resetModalNewPassword);
                setIsResettingPassword(false);

                if (res.success) {
                  setResetModalFeedback({ type: 'success', text: res.message });
                  setTimeout(() => {
                    setResetModalAccount(null);
                    showFeedback(`Password untuk ${resetModalAccount.name} berhasil diperbarui.`);
                  }, 1500);
                } else {
                  setResetModalFeedback({ type: 'error', text: res.message });
                }
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Akun yang akan diperbarui:</div>
                <div className="font-bold text-slate-900 dark:text-slate-100">{resetModalAccount.name}</div>
                <div className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                  Username: {resetModalAccount.username || '-'} · Email: {resetModalAccount.email}
                </div>
              </div>

              {resetModalFeedback && (
                <div className={`p-3 rounded-xl flex items-center gap-2 ${
                  resetModalFeedback.type === 'success' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold' 
                    : 'bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}>
                  {resetModalFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                  <span>{resetModalFeedback.text}</span>
                </div>
              )}

              {resetModalAccount.username === 'AdminBr' || resetModalAccount.id === 'admin-master-br' ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 text-xs space-y-1">
                  <div className="font-bold">Akun Root Master Administrator</div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    Akun ini dilindungi oleh otentikasi root sistem. Pengaturan kredensial akun master dikelola langsung oleh administrator utama.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Masukkan Password Baru:
                  </label>
                  <div className="relative">
                    <input
                      type={showResetModalPassword ? 'text' : 'password'}
                      value={resetModalNewPassword}
                      onChange={e => setResetModalNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter..."
                      required
                      className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetModalPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showResetModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setResetModalAccount(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Tutup
                </button>
                {!(resetModalAccount.username === 'AdminBr' || resetModalAccount.id === 'admin-master-br') && (
                  <button
                    type="submit"
                    disabled={isResettingPassword}
                    className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                  >
                    {isResettingPassword ? 'Menyimpan...' : 'Simpan Password'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        initialTab={profileModalTab}
      />

    </div>
  );
};
