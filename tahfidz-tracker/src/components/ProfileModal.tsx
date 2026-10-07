import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTahfidz } from '../context/TahfidzContext';
import { 
  X, 
  User as UserIcon, 
  Mail, 
  Phone, 
  Shield, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  BookOpen, 
  Users, 
  Sparkles,
  Edit3,
  Lock,
  Crown,
  Building2,
  GraduationCap,
  Palette,
  ShieldCheck
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'view' | 'edit';
}

const AVATAR_GRADIENTS = [
  { id: 'emerald', name: 'Emerald', class: 'from-emerald-600 via-teal-600 to-emerald-500' },
  { id: 'teal', name: 'Teal', class: 'from-teal-600 via-cyan-600 to-emerald-600' },
  { id: 'indigo', name: 'Indigo', class: 'from-indigo-600 via-blue-600 to-purple-600' },
  { id: 'amber', name: 'Gold / Amber', class: 'from-amber-500 via-orange-500 to-yellow-500' },
  { id: 'rose', name: 'Rose', class: 'from-rose-500 via-pink-600 to-rose-600' },
  { id: 'purple', name: 'Purple', class: 'from-purple-600 via-violet-600 to-indigo-600' }
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'view'
}) => {
  const { 
    currentUser, 
    updateUserProfile, 
    santriList, 
    groups, 
    userAccounts,
    systemSettings,
    cloudSyncStatus,
    setActiveTab: setNavTab,
    switchParentActiveChild,
    parentChildren
  } = useTahfidz();

  const [activeTab, setActiveTab] = useState<'view' | 'edit'>(initialTab);

  // Form states for Edit Profile
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarTheme, setAvatarTheme] = useState<string>('emerald');

  // Password fields
  const [changePassword, setChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Find linked user account for metadata
  const linkedAccount = userAccounts.find(
    u => u.id === currentUser?.id || u.username === currentUser?.username || u.email === currentUser?.email
  );

  // Find child student info if parent
  const linkedStudent = currentUser?.role === 'parent' && currentUser.studentId
    ? santriList.find(s => s.id === currentUser.studentId)
    : null;

  // Find group info if guru
  const linkedGroup = currentUser?.role === 'guru'
    ? groups.find(g => g.pengajar === currentUser.name)
    : null;

  const studentsInGroup = linkedGroup
    ? santriList.filter(s => s.kelompokId === linkedGroup.id)
    : [];

  // Reset form when modal opens or user changes
  useEffect(() => {
    if (isOpen && currentUser) {
      setName(currentUser.name || '');
      setUsername(currentUser.username || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || linkedAccount?.phone || linkedStudent?.orangTuaPhone || '');
      setActiveTab(initialTab);
      setChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMessage(null);
      setSuccessMessage(null);

      // Extract existing avatar theme if stored
      if (currentUser.avatar && AVATAR_GRADIENTS.some(g => g.id === currentUser.avatar)) {
        setAvatarTheme(currentUser.avatar);
      } else if (currentUser.role === 'super_admin') {
        setAvatarTheme('amber');
      } else if (currentUser.role === 'guru') {
        setAvatarTheme('emerald');
      } else if (currentUser.role === 'parent') {
        setAvatarTheme('teal');
      } else {
        setAvatarTheme('indigo');
      }
    }
  }, [isOpen, currentUser, initialTab, linkedAccount, linkedStudent]);

  if (!isOpen || !currentUser) return null;

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('Nama lengkap tidak boleh kosong.');
      return;
    }

    if (changePassword) {
      if (!currentPassword) {
        setErrorMessage('Silakan masukkan kata sandi saat ini untuk verifikasi keamanan.');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMessage('Kata sandi baru minimal harus 6 karakter.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('Konfirmasi kata sandi baru tidak sesuai.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await updateUserProfile({
        name: name.trim(),
        username: username.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        avatar: avatarTheme,
        currentPassword: changePassword ? currentPassword : undefined,
        newPassword: changePassword ? newPassword : undefined
      });

      if (res.success) {
        setSuccessMessage(res.message || 'Profil berhasil diperbarui!');
        setChangePassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setActiveTab('view');
          setSuccessMessage(null);
        }, 1200);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal memperbarui profil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'super_admin':
        return {
          title: 'Super Admin',
          badgeText: '👑 Super Administrator',
          desc: 'Akses Penuh Master Basis Data & Pengaturan Sistem',
          color: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700/80',
          gradientHeader: 'from-amber-600 via-amber-700 to-yellow-700',
          icon: Crown
        };
      case 'admin':
        return {
          title: 'Administrator',
          badgeText: '🛡️ Administrator',
          desc: 'Manajemen Data Santri, Pengajar & Lembaga',
          color: 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-700/80',
          gradientHeader: 'from-indigo-700 via-indigo-800 to-slate-900',
          icon: Shield
        };
      case 'guru':
        return {
          title: 'Guru / Ustadz',
          badgeText: '🎓 Pengajar Halaqah',
          desc: 'Pembina & Penguji Setoran Hafalan Santri',
          color: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700/80',
          gradientHeader: 'from-emerald-700 via-teal-800 to-emerald-900',
          icon: BookOpen
        };
      case 'coordinator':
        return {
          title: 'Koordinator',
          badgeText: '📋 Koordinator Tahfidz',
          desc: 'Koordinator Kurikulum & Jadwal Ujian Tasmi',
          color: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700/80',
          gradientHeader: 'from-blue-700 via-indigo-800 to-blue-900',
          icon: Users
        };
      case 'parent':
        return {
          title: 'Wali Santri',
          badgeText: '👨‍👩‍👧 Wali Santri',
          desc: `Wali dari ${currentUser.studentName || 'Santri'}`,
          color: 'bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-950/80 dark:text-teal-300 dark:border-teal-700/80',
          gradientHeader: 'from-teal-700 via-emerald-800 to-teal-900',
          icon: UserIcon
        };
      default:
        return {
          title: 'Pengguna',
          badgeText: '👤 Pengguna Sistem',
          desc: 'Pengguna Terdaftar',
          color: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
          gradientHeader: 'from-slate-700 via-slate-800 to-slate-900',
          icon: UserIcon
        };
    }
  };

  const roleBadge = getRoleBadge();
  const RoleIcon = roleBadge.icon;

  // Selected avatar gradient object
  const activeGradient = AVATAR_GRADIENTS.find(g => g.id === avatarTheme) || AVATAR_GRADIENTS[0];

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: '', color: 'bg-slate-200 dark:bg-slate-700', pct: 0, textCol: 'text-slate-400' };
    if (pwd.length < 6) return { label: 'Sangat Pendek (Min. 6 Karakter)', color: 'bg-rose-500', pct: 25, textCol: 'text-rose-500' };
    if (pwd.length < 8) return { label: 'Cukup', color: 'bg-amber-500', pct: 50, textCol: 'text-amber-500' };
    const hasNum = /\d/.test(pwd);
    const hasLetter = /[a-zA-Z]/.test(pwd);
    if (hasNum && hasLetter && pwd.length >= 8) {
      return { label: 'Kuat & Aman ✓', color: 'bg-emerald-500', pct: 100, textCol: 'text-emerald-600 dark:text-emerald-400' };
    }
    return { label: 'Baik', color: 'bg-blue-500', pct: 75, textCol: 'text-blue-500' };
  };

  const pwdStrength = getPasswordStrength(newPassword);

  const modalContent = (
    <div 
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/75 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="my-auto bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh] transition-all text-slate-800 dark:text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Modern Dynamic Header Banner */}
        <div className={`relative px-5 pt-4 pb-4 sm:pb-5 bg-gradient-to-r ${roleBadge.gradientHeader} text-white shrink-0`}>
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-xs text-[11px] font-bold text-white tracking-wide border border-white/20">
              <RoleIcon className="w-3.5 h-3.5" />
              <span>{roleBadge.badgeText}</span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/35 text-white/90 hover:text-white flex items-center justify-center transition-colors cursor-pointer focus:outline-none"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Profile Avatar with Gradient Accent */}
            <div className="relative shrink-0">
              <div className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr ${activeGradient.class} text-white font-bold text-xl sm:text-2xl flex items-center justify-center shadow-md ring-4 ring-white/30 dark:ring-slate-900/50`}>
                {currentUser.name ? currentUser.name.substring(0, 2).toUpperCase() : 'US'}
              </div>
              <div 
                className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-white rounded-full ring-2 ring-white dark:ring-slate-900 shadow-xs"
                title="Akun Aktif & Terverifikasi"
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            </div>

            {/* Profile Identity Text */}
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-lg sm:text-xl text-white leading-tight truncate drop-shadow-xs">
                {currentUser.name}
              </h3>
              <p className="text-xs text-white/85 font-medium mt-0.5 truncate flex items-center gap-1.5">
                <span className="font-mono bg-white/20 px-1.5 py-0.2 rounded text-[11px]">
                  {currentUser.username ? `@${currentUser.username}` : (currentUser.email || 'Pengguna')}
                </span>
                <span className="text-white/60">·</span>
                <span className="truncate">{systemSettings?.schoolName || "Tahfidz Tracker"}</span>
              </p>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-white/90">
                <span className="inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-emerald-300" />
                  <span>Sesi Terenkripsi</span>
                </span>
                {cloudSyncStatus === 'synced' && (
                  <span className="inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full text-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                    <span>Cloud Sync</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Segmented Control Pill Tabs */}
          <div className="mt-4 p-1 bg-black/25 backdrop-blur-md rounded-2xl flex items-center gap-1 border border-white/15">
            <button
              type="button"
              onClick={() => {
                setActiveTab('view');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'view'
                  ? 'bg-white text-slate-900 shadow-md font-extrabold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Lihat Profil</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('edit');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'edit'
                  ? 'bg-white text-slate-900 shadow-md font-extrabold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profil & Sandi</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5 text-xs sm:text-sm">
          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div className="flex-1 font-semibold">{successMessage}</div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 1: LIHAT PROFIL (VIEW PROFILE)                             */}
          {/* ============================================================== */}
          {activeTab === 'view' && (
            <div className="space-y-3.5">
              
              {/* Institution Identity Banner */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block leading-tight">
                      Lembaga / Pesantren Terdaftar
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate block">
                      {systemSettings?.schoolName || "Ma'had Tahfidz Al-Qur'an Terpadu"}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 shrink-0 border border-emerald-200 dark:border-emerald-800">
                  Tersinkron
                </span>
              </div>

              {/* Data Akun & Kontak Card */}
              <div className="bg-white dark:bg-slate-850 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Informasi Akun & Kontak
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    ID: <code className="font-mono text-[10px] text-slate-600 dark:text-slate-400">{currentUser.id.substring(0, 10)}...</code>
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Nama Lengkap */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50/80 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>Nama Lengkap</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{currentUser.name}</span>
                  </div>

                  {/* Username Login */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50/80 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Key className="w-3.5 h-3.5" />
                      <span>Username Login</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {currentUser.username ? `@${currentUser.username}` : '-'}
                      </span>
                      {currentUser.username && (
                        <button
                          type="button"
                          onClick={() => handleCopy(currentUser.username || '', 'username')}
                          className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded transition-colors cursor-pointer"
                          title="Salin Username"
                        >
                          {copiedField === 'username' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50/80 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate max-w-[210px]">
                      <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                        {currentUser.email || '-'}
                      </span>
                      {currentUser.email && (
                        <button
                          type="button"
                          onClick={() => handleCopy(currentUser.email, 'email')}
                          className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded transition-colors shrink-0 cursor-pointer"
                          title="Salin Email"
                        >
                          {copiedField === 'email' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* WhatsApp / Phone */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50/80 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                      <span>No. WhatsApp</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {currentUser.phone || linkedAccount?.phone || linkedStudent?.orangTuaPhone || (
                          <span className="text-slate-400 dark:text-slate-500 italic font-normal">Belum diisi</span>
                        )}
                      </span>
                      {(currentUser.phone || linkedAccount?.phone || linkedStudent?.orangTuaPhone) && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCopy(currentUser.phone || linkedAccount?.phone || linkedStudent?.orangTuaPhone || '', 'phone')}
                            className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded transition-colors cursor-pointer"
                            title="Salin No. WhatsApp"
                          >
                            {copiedField === 'phone' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={`https://wa.me/${(currentUser.phone || linkedAccount?.phone || linkedStudent?.orangTuaPhone || '').replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 rounded transition-colors cursor-pointer"
                            title="Buka WhatsApp"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contextual Card: Wali Santri (Mendukung 1, 2, atau lebih anak) */}
              {currentUser.role === 'parent' && (parentChildren.length > 0 ? parentChildren : (linkedStudent ? [linkedStudent] : [])).length > 0 && (
                <div className="bg-teal-50/90 dark:bg-teal-950/40 rounded-2xl p-4 border border-teal-200/80 dark:border-teal-900/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-900 dark:text-teal-300 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                      <span>Data Santri Ananda ({(parentChildren.length > 0 ? parentChildren : [linkedStudent!]).length} Anak Terdaftar)</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      Wali Santri
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {(parentChildren.length > 0 ? parentChildren : [linkedStudent!]).map(c => {
                      const isActive = c.id === currentUser.studentId;
                      return (
                        <div 
                          key={c.id} 
                          className={`p-3 rounded-xl border transition-all ${
                            isActive 
                              ? 'bg-white dark:bg-slate-850 border-teal-300 dark:border-teal-700 shadow-xs ring-1 ring-teal-400/40' 
                              : 'bg-white/70 dark:bg-slate-850/60 border-teal-100 dark:border-teal-900/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-900/80 text-teal-800 dark:text-teal-300 flex items-center justify-center font-bold text-xs">
                                {c.nama.substring(0, 1).toUpperCase()}
                              </div>
                              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                {c.nama}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                ({c.gender === 'santriwan' ? 'Putra' : 'Putri'})
                              </span>
                            </div>

                            {isActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-bold shadow-2xs">
                                <Check className="w-3 h-3" />
                                <span>Sedang Dipantau</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => switchParentActiveChild(c.id)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-750 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-slate-700 dark:text-slate-200 hover:text-teal-800 dark:hover:text-teal-300 text-[10px] font-semibold transition-colors cursor-pointer"
                              >
                                Pantau Ananda Ini
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-[11px]">
                            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 block">Kelas & Halaqah</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{c.kelasNama} · {c.kelompokNama}</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 block">Hafalan</span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400 block">{c.totalJuzMemorized} / {c.targetJuz} Juz</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 block">Kehadiran</span>
                              <span className="font-semibold text-blue-600 dark:text-blue-400 block">{c.kehadiranPersen}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Contextual Card: Guru */}
              {currentUser.role === 'guru' && (
                <div className="bg-emerald-50/90 dark:bg-emerald-950/40 rounded-2xl p-4 border border-emerald-200/80 dark:border-emerald-900/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      Kelompok Halaqah Bimbingan
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Aktif Mengajar
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white dark:bg-slate-850 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Halaqah yang Dibina</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100 block">{linkedGroup ? linkedGroup.nama : 'Guru Halaqah'}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-850 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Santri Terdaftar</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 block">{studentsInGroup.length} Santri Binaan</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Contextual Card: Super Admin */}
              {currentUser.role === 'super_admin' && (
                <div className="bg-amber-50/90 dark:bg-amber-950/40 rounded-2xl p-4 border border-amber-200/80 dark:border-amber-900/80 space-y-2 text-xs text-amber-900 dark:text-amber-200">
                  <div className="font-bold flex items-center gap-2 text-amber-950 dark:text-amber-300 text-sm">
                    <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Akses Master Super Administrator</span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed text-amber-900/90 dark:text-amber-200/90">
                    Akun ini memiliki hak otoritas tertinggi ke seluruh koleksi Cloud Firestore, kontrol sistem, penamaan lembaga resmi, ekspor cadangan data, dan audit log keamanan.
                  </p>
                </div>
              )}

              {/* Security & Encryption Status Banner */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Keamanan Akun: <strong>Tersimpan Aman</strong></span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Aktif
                </span>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profil & Sandi</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: EDIT PROFIL (EDIT PROFILE & SECURITY)                   */}
          {/* ============================================================== */}
          {activeTab === 'edit' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              {/* Avatar Color Theme Selector */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Warna Aksen Profil & Avatar</span>
                  </label>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {activeGradient.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  {AVATAR_GRADIENTS.map(grad => (
                    <button
                      key={grad.id}
                      type="button"
                      onClick={() => setAvatarTheme(grad.id)}
                      className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${grad.class} transition-all cursor-pointer relative ${
                        avatarTheme === grad.id 
                          ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900 scale-110 shadow-sm' 
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                      title={grad.name}
                    >
                      {avatarTheme === grad.id && (
                        <Check className="w-3.5 h-3.5 text-white stroke-[3] mx-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Identitas Card */}
              <div className="bg-white dark:bg-slate-850 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-1 border-b border-slate-100 dark:border-slate-800">
                  Data Identitas Pengguna
                </div>

                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Contoh: Ustadz Ahmad Fauzi"
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                    />
                  </div>
                  {currentUser.role === 'parent' && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                      Perubahan nama otomatis disinkronkan ke data wali santri ananda.
                    </span>
                  )}
                  {currentUser.role === 'guru' && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                      Perubahan nama otomatis disinkronkan ke halaqah yang diampu.
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Username Login */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Username Login
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value.replace(/\s+/g, ''))}
                        placeholder="username"
                        className="w-full pl-7 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* No WhatsApp */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      No. WhatsApp / HP
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="08123456789"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Linked Children Info for Parent */}
              {currentUser.role === 'parent' && parentChildren.length > 0 && (
                <div className="p-3 bg-teal-50/90 dark:bg-teal-950/40 rounded-2xl border border-teal-200 dark:border-teal-900/80 text-xs space-y-1.5">
                  <div className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Santri Ananda Terhubung ({parentChildren.length} Anak):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {parentChildren.map(c => (
                      <span key={c.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800 text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                        <span>{c.nama} ({c.kelasNama})</span>
                        {c.id === currentUser.studentId && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 font-bold">
                            Aktif
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Password Section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                        Ubah Kata Sandi (Password)
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Aktifkan opsi ini jika ingin mengganti kata sandi login
                      </span>
                    </div>
                  </div>
                  
                  {/* Modern Toggle */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={changePassword}
                      onChange={e => {
                        setChangePassword(e.target.checked);
                        if (!e.target.checked) {
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {changePassword && (
                  <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700 space-y-3 animate-in fade-in duration-150">
                    {/* Kata Sandi Lama */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Kata Sandi Saat Ini <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)}
                          placeholder="Masukkan kata sandi lama Anda"
                          required={changePassword}
                          className="w-full pl-3.5 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Kata Sandi Baru */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Kata Sandi Baru <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Min. 6 karakter"
                            required={changePassword}
                            className="w-full pl-3 pr-9 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {newPassword && (
                          <div className="mt-1.5 space-y-1">
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-300 ${pwdStrength.color}`} style={{ width: `${pwdStrength.pct}%` }} />
                            </div>
                            <span className={`text-[10px] font-semibold ${pwdStrength.textCol} block`}>
                              Kekuatan: {pwdStrength.label}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Ulangi Sandi Baru */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Ulangi Sandi Baru <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Ketik ulang sandi baru"
                            required={changePassword}
                            className="w-full pl-3 pr-9 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {confirmPassword && (
                          <div className="mt-1 text-[10px] flex items-center gap-1 font-semibold">
                            {confirmPassword === newPassword ? (
                              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[3]" /> Sandi cocok
                              </span>
                            ) : (
                              <span className="text-rose-500 flex items-center gap-1">
                                <X className="w-3 h-3" /> Sandi belum cocok
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('view');
                    setErrorMessage(null);
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan Perubahan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
