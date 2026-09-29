import React, { useState } from 'react';
import { useTahfidz } from '../context/TahfidzContext';
import { 
  BookOpen, 
  ShieldCheck, 
  HeartHandshake, 
  UserPlus, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  LogIn, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Phone,
  Eye,
  EyeOff,
  KeyRound,
  X,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { Role } from '../types';

export const AuthScreen: React.FC = () => {
  const { loginUserAccount, registerUserAccount, resetUserPassword, userAccounts, santriList } = useTahfidz();

  type ViewMode = 'selection' | 'guru-login' | 'parent-login' | 'guru-register' | 'parent-register';
  const [view, setView] = useState<ViewMode>('selection');

  // Password visibility states
  const [showGuruPassword, setShowGuruPassword] = useState(false);
  const [showParentPassword, setShowParentPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [showRegParentPassword, setShowRegParentPassword] = useState(false);
  const [showRegParentConfirmPassword, setShowRegParentConfirmPassword] = useState(false);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotStep, setForgotStep] = useState<'input' | 'reset' | 'success'>('input');
  const [forgotTargetAccount, setForgotTargetAccount] = useState<{ name: string; username?: string; email: string; role: string } | null>(null);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(santriList[0]?.id || '');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register Guru form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regRole, setRegRole] = useState<Role>('guru');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Register Parent form state
  const [regParentName, setRegParentName] = useState('');
  const [regParentEmail, setRegParentEmail] = useState('');
  const [regParentPhone, setRegParentPhone] = useState('');
  const [regParentStudentId, setRegParentStudentId] = useState(santriList[0]?.id || '');
  const [regParentPassword, setRegParentPassword] = useState('');
  const [regParentConfirmPassword, setRegParentConfirmPassword] = useState('');

  // Reset errors when view changes
  const changeView = (newView: ViewMode) => {
    setView(newView);
    setLoginError('');
    setRegError('');
    setRegSuccess('');
  };

  const handleOpenForgotPassword = (prefillIdentifier?: string) => {
    setForgotIdentifier(prefillIdentifier || '');
    setForgotStep('input');
    setForgotTargetAccount(null);
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError('');
    setForgotSuccessMsg('');
    setIsForgotModalOpen(true);
  };

  const handleCheckForgotAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    const cleanId = forgotIdentifier.trim().toLowerCase();
    if (!cleanId) {
      setForgotError('Harap masukkan Username atau Email terdaftar.');
      return;
    }

    if (cleanId === 'adminbr' || cleanId === 'adminbr@tahfidz.sch.id') {
      setForgotTargetAccount({
        name: 'Administrator',
        username: 'AdminBr',
        email: 'adminbr@tahfidz.sch.id',
        role: 'super_admin'
      });
      setForgotSuccessMsg('Akun terverifikasi dalam sistem. Silakan atur password baru Anda.');
      setForgotStep('reset');
      return;
    }

    const matched = userAccounts.find(u =>
      (u.email && u.email.trim().toLowerCase() === cleanId) ||
      (u.username && u.username.trim().toLowerCase() === cleanId)
    );

    if (matched) {
      setForgotTargetAccount({
        name: matched.name,
        username: matched.username,
        email: matched.email,
        role: matched.role
      });
      setForgotStep('reset');
    } else {
      setForgotError('Akun tidak ditemukan dalam sistem. Pastikan username atau email yang Anda masukkan sudah benar.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotNewPassword) {
      setForgotError('Password baru wajib diisi.');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotError('Password minimal harus 6 karakter.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Konfirmasi password tidak cocok.');
      return;
    }

    setIsForgotSubmitting(true);
    const res = await resetUserPassword(forgotIdentifier, forgotNewPassword);
    setIsForgotSubmitting(false);

    if (res.success) {
      setForgotSuccessMsg(res.message);
      setForgotStep('success');
    } else {
      setForgotError(res.message);
    }
  };

  const handleGuruLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setLoginError('Harap masukkan Username/Email dan Password.');
      return;
    }
    setIsSubmitting(true);
    setLoginError('');
    const res = await loginUserAccount(loginIdentifier, loginPassword, 'guru');
    setIsSubmitting(false);
    if (!res.success) {
      setLoginError(res.message);
    }
  };

  const handleParentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setLoginError('Harap masukkan Email dan Password.');
      return;
    }
    setIsSubmitting(true);
    setLoginError('');
    const res = await loginUserAccount(loginIdentifier, loginPassword, 'parent', selectedStudentId);
    setIsSubmitting(false);
    if (!res.success) {
      setLoginError(res.message);
    }
  };

  const handleGuruRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regName.trim() || !regEmail.trim() || !regUsername.trim() || !regPassword) {
      setRegError('Semua kolom wajib diisi.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('Password minimal harus 6 karakter.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Konfirmasi password tidak cocok.');
      return;
    }

    setIsSubmitting(true);
    const res = await registerUserAccount({
      name: regName.trim(),
      email: regEmail.trim(),
      username: regUsername.trim(),
      password: regPassword,
      role: regRole,
      phone: regPhone.trim()
    });
    setIsSubmitting(false);

    if (res.success) {
      setRegSuccess('Pendaftaran berhasil! Mengalihkan ke dashboard...');
      setTimeout(() => {
        if (res.user) {
          loginUserAccount(regEmail, regPassword);
        }
      }, 1200);
    } else {
      setRegError(res.message);
    }
  };

  const handleParentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regParentName.trim() || !regParentEmail.trim() || !regParentPassword) {
      setRegError('Nama, email, santri, dan password wajib diisi.');
      return;
    }

    if (regParentPassword.length < 6) {
      setRegError('Password minimal harus 6 karakter.');
      return;
    }

    if (regParentPassword !== regParentConfirmPassword) {
      setRegError('Konfirmasi password tidak cocok.');
      return;
    }

    const student = santriList.find(s => s.id === regParentStudentId);
    if (!student) {
      setRegError('Pilih santri yang valid.');
      return;
    }

    setIsSubmitting(true);
    const res = await registerUserAccount({
      name: regParentName.trim(),
      email: regParentEmail.trim(),
      username: regParentEmail.split('@')[0],
      password: regParentPassword,
      role: 'parent',
      phone: regParentPhone.trim(),
      studentId: student.id,
      studentName: student.nama
    });
    setIsSubmitting(false);

    if (res.success) {
      setRegSuccess('Pendaftaran wali santri berhasil! Mengalihkan...');
      setTimeout(() => {
        if (res.user) {
          loginUserAccount(regParentEmail, regParentPassword, 'parent', student.id);
        }
      }, 1200);
    } else {
      setRegError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Islamic geometric ambient patterns */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Tahfidz Tracker
          </h1>
          <p className="text-emerald-100/90 text-sm mt-1">
            Sistem Pencatatan Hafalan Al-Qur'an Terpadu
          </p>
        </div>

        {/* VIEW: Selection */}
        {view === 'selection' && (
          <div className="space-y-4">
            <button
              onClick={() => changeView('guru-login')}
              className="w-full flex items-center justify-between p-4 bg-white/15 hover:bg-white/25 border border-white/25 rounded-2xl transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/30 flex items-center justify-center text-emerald-200 shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-white text-base">Masuk Sebagai Guru / Asatidz</div>
                  <div className="text-xs text-emerald-100/80">Kelola santri, setoran hafalan, & absensi halaqah</div>
                </div>
              </div>
              <span className="text-emerald-300 group-hover:translate-x-1 transition-transform font-bold">→</span>
            </button>

            <button
              onClick={() => changeView('parent-login')}
              className="w-full flex items-center justify-between p-4 bg-white/15 hover:bg-white/25 border border-white/25 rounded-2xl transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-teal-500/30 flex items-center justify-center text-teal-200 shadow-sm">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-white text-base">Masuk Sebagai Wali Santri</div>
                  <div className="text-xs text-emerald-100/80">Pantau perkembangan mutqin & kehadiran ananda</div>
                </div>
              </div>
              <span className="text-emerald-300 group-hover:translate-x-1 transition-transform font-bold">→</span>
            </button>

            <div className="pt-4 border-t border-white/15">
              <div className="text-xs text-center text-emerald-100/90 font-medium mb-3">
                Belum memiliki akun terdaftar?
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => changeView('guru-register')}
                  className="py-2.5 px-3 bg-white/15 hover:bg-white/25 border border-white/25 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors"
                >
                  <UserPlus className="w-4 h-4 text-emerald-300" />
                  Daftar Guru / Admin
                </button>
                <button
                  onClick={() => changeView('parent-register')}
                  className="py-2.5 px-3 bg-white/15 hover:bg-white/25 border border-white/25 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors"
                >
                  <UserPlus className="w-4 h-4 text-teal-300" />
                  Daftar Wali Santri
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: Guru / Admin Login */}
        {view === 'guru-login' && (
          <form onSubmit={handleGuruLogin} className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => changeView('selection')}
                  className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-lg font-bold text-white">Login Guru / Admin</h2>
              </div>
              <button
                type="button"
                onClick={() => changeView('guru-register')}
                className="text-xs text-emerald-300 hover:text-white underline underline-offset-2"
              >
                Daftar Akun
              </button>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-500/25 border border-rose-400/40 rounded-xl text-xs text-rose-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-emerald-100 mb-1 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5" /> Username atau Email
              </label>
              <input
                type="text"
                value={loginIdentifier}
                onChange={e => setLoginIdentifier(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white/15 border border-white/25 rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Masukkan username atau email"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-emerald-100 mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Password
              </label>
              <div className="relative">
                <input
                  type={showGuruPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white/15 border border-white/25 rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowGuruPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-1 transition-colors"
                  title={showGuruPassword ? 'Sembunyikan Password' : 'Lihat Password'}
                >
                  {showGuruPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-emerald-100/60 text-[11px]">
                Keamanan Akun Terenkripsi
              </span>
              <button
                type="button"
                onClick={() => handleOpenForgotPassword(loginIdentifier)}
                className="text-emerald-300 hover:text-white underline underline-offset-2 font-medium"
              >
                Lupa Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg transition-all text-sm mt-3 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {isSubmitting ? 'Memeriksa Akun...' : 'Masuk Sekarang'}
            </button>
          </form>
        )}

        {/* VIEW: Parent Login */}
        {view === 'parent-login' && (
          <form onSubmit={handleParentLogin} className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => changeView('selection')}
                  className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-lg font-bold text-white">Login Wali Santri</h2>
              </div>
              <button
                type="button"
                onClick={() => changeView('parent-register')}
                className="text-xs text-teal-300 hover:text-white underline underline-offset-2"
              >
                Daftar Akun
              </button>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-500/25 border border-rose-400/40 rounded-xl text-xs text-rose-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-emerald-100 mb-1">
                Pilih Santri yang Dipantau
              </label>
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/25 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                {santriList.map(s => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                    {s.nama} ({s.kelasNama} - {s.kelompokNama})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-emerald-100 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Email Terdaftar
              </label>
              <input
                type="email"
                value={loginIdentifier}
                onChange={e => setLoginIdentifier(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white/15 border border-white/25 rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                placeholder="nama@email.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-emerald-100 mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Password
              </label>
              <div className="relative">
                <input
                  type={showParentPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white/15 border border-white/25 rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowParentPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-1 transition-colors"
                  title={showParentPassword ? 'Sembunyikan Password' : 'Lihat Password'}
                >
                  {showParentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end text-xs pt-1">
              <button
                type="button"
                onClick={() => handleOpenForgotPassword(loginIdentifier)}
                className="text-teal-300 hover:text-white underline underline-offset-2 font-medium"
              >
                Lupa Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-teal-400 hover:bg-teal-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg transition-all text-sm mt-3 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {isSubmitting ? 'Memverifikasi...' : 'Masuk Pantau Santri'}
            </button>
          </form>
        )}

        {/* VIEW: Guru Register */}
        {view === 'guru-register' && (
          <form onSubmit={handleGuruRegister} className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => changeView('selection')}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-bold text-white">Daftar Akun Guru / Asatidz</h2>
            </div>

            {regError && (
              <div className="p-3 bg-rose-500/25 border border-rose-400/40 rounded-xl text-xs text-rose-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="p-3 bg-emerald-500/25 border border-emerald-400/50 rounded-xl text-xs text-emerald-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>{regSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-emerald-100 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={regName}
                onChange={e => setRegName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white/15 border border-white/25 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-400"
                placeholder="Ustadz / Ustadzah..."
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-emerald-100 mb-1">Email</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white/15 border border-white/25 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-400"
                  placeholder="guru@tahfidz.sch.id"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-emerald-100 mb-1">Username</label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={e => setRegUsername(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white/15 border border-white/25 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-400"
                  placeholder="asatidz_baru"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-emerald-100 mb-1">Jenis Akun</label>
                <select
                  value={regRole}
                  onChange={e => setRegRole(e.target.value as Role)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/25 rounded-xl text-white text-xs"
                >
                  <option value="guru">Guru Tahfidz</option>
                  <option value="admin">Admin Lembaga</option>
                  <option value="coordinator">Koordinator Tahfidz</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-emerald-100 mb-1">No. WhatsApp</label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white/15 border border-white/25 rounded-xl text-white text-xs"
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-emerald-100 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    required
                    className="w-full pl-3 pr-8 py-2 bg-white/15 border border-white/25 rounded-xl text-white text-xs"
                    placeholder="Min 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(prev => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-0.5"
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-emerald-100 mb-1">Konfirmasi Password</label>
                <div className="relative">
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-3 pr-8 py-2 bg-white/15 border border-white/25 rounded-xl text-white text-xs"
                    placeholder="Ulangi password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(prev => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-0.5"
                  >
                    {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg transition-all text-sm mt-3 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {isSubmitting ? 'Mendaftarkan Akun...' : 'Daftar Akun Baru'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => changeView('guru-login')}
                className="text-xs text-emerald-200 hover:text-white underline underline-offset-2"
              >
                Sudah punya akun? Masuk di sini
              </button>
            </div>
          </form>
        )}

        {/* VIEW: Parent Register */}
        {view === 'parent-register' && (
          <form onSubmit={handleParentRegister} className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => changeView('selection')}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-bold text-white">Daftar Akun Wali Santri</h2>
            </div>

            {regError && (
              <div className="p-3 bg-rose-500/25 border border-rose-400/40 rounded-xl text-xs text-rose-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="p-3 bg-emerald-500/25 border border-emerald-400/50 rounded-xl text-xs text-emerald-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>{regSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-emerald-100 mb-1">Nama Orang Tua / Wali</label>
              <input
                type="text"
                value={regParentName}
                onChange={e => setRegParentName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white/15 border border-white/25 rounded-xl text-white text-xs focus:ring-2 focus:ring-teal-400"
                placeholder="Bapak / Ibu..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-emerald-100 mb-1">Pilih Santri Ananda</label>
              <select
                value={regParentStudentId}
                onChange={e => setRegParentStudentId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/25 rounded-xl text-white text-xs focus:ring-2 focus:ring-teal-400"
              >
                {santriList.map(s => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                    {s.nama} ({s.kelasNama} - {s.kelompokNama})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-emerald-100 mb-1">Email</label>
                <input
                  type="email"
                  value={regParentEmail}
                  onChange={e => setRegParentEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white/15 border border-white/25 rounded-xl text-white text-xs"
                  placeholder="wali@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-emerald-100 mb-1">No. WhatsApp</label>
                <input
                  type="tel"
                  value={regParentPhone}
                  onChange={e => setRegParentPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white/15 border border-white/25 rounded-xl text-white text-xs"
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-emerald-100 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showRegParentPassword ? 'text' : 'password'}
                    value={regParentPassword}
                    onChange={e => setRegParentPassword(e.target.value)}
                    required
                    className="w-full pl-3 pr-8 py-2 bg-white/15 border border-white/25 rounded-xl text-white text-xs"
                    placeholder="Min 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegParentPassword(prev => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-0.5"
                  >
                    {showRegParentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-emerald-100 mb-1">Konfirmasi Password</label>
                <div className="relative">
                  <input
                    type={showRegParentConfirmPassword ? 'text' : 'password'}
                    value={regParentConfirmPassword}
                    onChange={e => setRegParentConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-3 pr-8 py-2 bg-white/15 border border-white/25 rounded-xl text-white text-xs"
                    placeholder="Ulangi password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegParentConfirmPassword(prev => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-0.5"
                  >
                    {showRegParentConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-teal-400 hover:bg-teal-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg transition-all text-sm mt-3 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {isSubmitting ? 'Mendaftarkan Akun...' : 'Daftar Akun Wali'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => changeView('parent-login')}
                className="text-xs text-teal-200 hover:text-white underline underline-offset-2"
              >
                Sudah punya akun? Masuk di sini
              </button>
            </div>
          </form>
        )}

      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-white/20 rounded-3xl w-full max-w-md p-6 text-white shadow-2xl relative overflow-hidden">
            {/* Background ambient light */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Lupa Password Akun</h3>
                  <p className="text-[11px] text-emerald-200/80">Pemulihan akses login Tahfidz Tracker</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotError && (
              <div className="p-3 bg-rose-500/20 border border-rose-400/40 rounded-xl text-xs text-rose-200 mb-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccessMsg && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-xs text-emerald-200 mb-3 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{forgotSuccessMsg}</span>
              </div>
            )}

            {forgotStep === 'input' && (
              <form onSubmit={handleCheckForgotAccount} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-emerald-100 mb-1">
                    Masukkan Username atau Email Akun Anda
                  </label>
                  <input
                    type="text"
                    value={forgotIdentifier}
                    onChange={e => setForgotIdentifier(e.target.value)}
                    required
                    placeholder="Contoh: nama@email.com atau username"
                    className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                  />
                  <p className="text-[11px] text-white/60 mt-1">
                    Sistem akan memverifikasi keberadaan akun Anda dalam database untuk memulai reset password.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="flex-1 py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-bold shadow-lg"
                  >
                    Periksa Akun
                  </button>
                </div>

                {/* Direct WhatsApp button to Admin */}
                <div className="pt-3 border-t border-white/10 text-center">
                  <p className="text-[11px] text-white/60 mb-2">Mengalami kendala akun atau lupa email terdaftar?</p>
                  <a
                    href="https://api.whatsapp.com/send?phone=6281234567801&text=Assalamu'alaikum%20Admin%20Tahfidz,%20mohon%20bantuan%20reset%20password%20akun%20saya%20di%20Tahfidz%20Tracker."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-emerald-300 border border-emerald-400/30 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Hubungi Admin via WhatsApp</span>
                  </a>
                </div>
              </form>
            )}

            {forgotStep === 'reset' && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                {forgotTargetAccount && (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-400/40 rounded-xl text-xs">
                    <span className="text-[11px] text-emerald-300 font-semibold block">Akun Terverifikasi:</span>
                    <span className="font-bold text-white text-sm block">{forgotTargetAccount.name}</span>
                    <span className="text-[11px] text-emerald-100/80">
                      {forgotTargetAccount.username ? `@${forgotTargetAccount.username} · ` : ''}{forgotTargetAccount.email} · Role: {forgotTargetAccount.role}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-emerald-100 mb-1">
                    Password Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      value={forgotNewPassword}
                      onChange={e => setForgotNewPassword(e.target.value)}
                      required
                      placeholder="Minimal 6 karakter"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-1"
                    >
                      {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-100 mb-1">
                    Konfirmasi Password Baru
                  </label>
                  <input
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={e => setForgotConfirmPassword(e.target.value)}
                    required
                    placeholder="Ulangi password baru"
                    className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep('input')}
                    className="flex-1 py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotSubmitting}
                    className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold shadow-lg"
                  >
                    {isForgotSubmitting ? 'Menyimpan...' : 'Simpan Password Baru'}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 'success' && (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-400/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Password Berhasil Diperbarui!</h4>
                  <p className="text-xs text-emerald-100/80 mt-1">
                    Password akun Anda telah berhasil diperbarui. Silakan langsung masuk ke sistem menggunakan password baru.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setLoginIdentifier(forgotIdentifier);
                    setLoginPassword(forgotNewPassword);
                  }}
                  className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs shadow-lg"
                >
                  Masuk Sekarang dengan Password Baru
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
