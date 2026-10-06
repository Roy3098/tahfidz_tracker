import React, { useState } from 'react';
import { useTahfidz } from '../context/TahfidzContext';
import { BookOpen, ShieldCheck, HeartHandshake, UserPlus, ArrowLeft, CheckCircle2, AlertCircle, LogIn, Lock, Mail, User as UserIcon, Phone, Search, Check, X, Users } from 'lucide-react';
import { Role } from '../types';

export const AuthScreen: React.FC = () => {
  const { loginUserAccount, registerUserAccount, santriList } = useTahfidz();

  type ViewMode = 'selection' | 'guru-login' | 'parent-login' | 'guru-register' | 'parent-register';
  const [view, setView] = useState<ViewMode>('selection');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
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

  // Register Parent form state (Mendukung 2 anak atau lebih)
  const [regParentName, setRegParentName] = useState('');
  const [regParentEmail, setRegParentEmail] = useState('');
  const [regParentPhone, setRegParentPhone] = useState('');
  const [regParentStudentIds, setRegParentStudentIds] = useState<string[]>(santriList[0]?.id ? [santriList[0].id] : []);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [regParentPassword, setRegParentPassword] = useState('');
  const [regParentConfirmPassword, setRegParentConfirmPassword] = useState('');

  // Reset errors when view changes
  const changeView = (newView: ViewMode) => {
    setView(newView);
    setLoginError('');
    setRegError('');
    setRegSuccess('');
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
      setLoginError('Harap masukkan Email/Username dan Password.');
      return;
    }
    setIsSubmitting(true);
    setLoginError('');
    const res = await loginUserAccount(loginIdentifier, loginPassword, 'parent');
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
      setRegError('Nama, email, santri ananda, dan password wajib diisi.');
      return;
    }

    if (regParentStudentIds.length === 0) {
      setRegError('Pilih setidaknya 1 santri ananda (Anda dapat memilih 2 anak atau lebih).');
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

    const selectedStudents = santriList.filter(s => regParentStudentIds.includes(s.id));
    if (selectedStudents.length === 0) {
      setRegError('Pilih santri ananda yang valid.');
      return;
    }

    const primaryStudent = selectedStudents[0];

    setIsSubmitting(true);
    const res = await registerUserAccount({
      name: regParentName.trim(),
      email: regParentEmail.trim(),
      username: regParentEmail.split('@')[0],
      password: regParentPassword,
      role: 'parent',
      phone: regParentPhone.trim(),
      studentId: primaryStudent.id,
      studentName: selectedStudents.map(s => s.nama).join(', '),
      studentIds: selectedStudents.map(s => s.id),
      studentNames: selectedStudents.map(s => s.nama)
    });
    setIsSubmitting(false);

    if (res.success) {
      setRegSuccess(`Pendaftaran wali berhasil untuk ${selectedStudents.length} santri ananda! Mengalihkan...`);
      setTimeout(() => {
        if (res.user) {
          loginUserAccount(regParentEmail, regParentPassword, 'parent');
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
              <input
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white/15 border border-white/25 rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="••••••••"
              />
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
              <label className="block text-xs font-medium text-emerald-100 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Email atau Username Terdaftar
              </label>
              <input
                type="text"
                value={loginIdentifier}
                onChange={e => setLoginIdentifier(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white/15 border border-white/25 rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                placeholder="Masukkan email atau username"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-emerald-100 mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white/15 border border-white/25 rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                placeholder="••••••••"
              />
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
                <input
                  type="password"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white/15 border border-white/25 rounded-xl text-white text-xs"
                  placeholder="Min 6 karakter"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-emerald-100 mb-1">Konfirmasi Password</label>
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={e => setRegConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white/15 border border-white/25 rounded-xl text-white text-xs"
                  placeholder="Ulangi password"
                />
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

            {/* Multi-Child Selector: Pilih 2 anak atau lebih */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-emerald-100 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-teal-300" />
                  <span>Pilih Santri Ananda (Bisa 2 Anak atau Lebih)</span>
                </label>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30">
                  {regParentStudentIds.length} Anak Terpilih
                </span>
              </div>

              {/* Selected children tags */}
              {regParentStudentIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-white/10 rounded-xl border border-white/20">
                  {regParentStudentIds.map(id => {
                    const student = santriList.find(s => s.id === id);
                    if (!student) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500/30 text-white text-xs font-medium border border-teal-300/40"
                      >
                        <span>{student.nama} ({student.kelasNama})</span>
                        <button
                          type="button"
                          onClick={() => setRegParentStudentIds(prev => prev.filter(item => item !== id))}
                          className="hover:bg-white/20 rounded p-0.5 transition-colors cursor-pointer"
                          title="Hapus pilihan"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Search input for students */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={e => setStudentSearchQuery(e.target.value)}
                  placeholder="Ketik nama santri untuk mencari..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-white text-xs placeholder:text-white/40 focus:ring-2 focus:ring-teal-400 outline-none"
                />
              </div>

              {/* List of students with toggle checkboxes */}
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1 bg-slate-900/80 rounded-xl border border-white/15 p-1.5">
                {santriList
                  .filter(s => {
                    if (!studentSearchQuery.trim()) return true;
                    const q = studentSearchQuery.toLowerCase();
                    return s.nama.toLowerCase().includes(q) || s.kelasNama.toLowerCase().includes(q) || s.kelompokNama.toLowerCase().includes(q);
                  })
                  .map(s => {
                    const isSelected = regParentStudentIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setRegParentStudentIds(prev =>
                            prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                          );
                        }}
                        className={`p-2 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-colors text-xs ${
                          isSelected
                            ? 'bg-teal-600/40 border border-teal-400/50 text-white'
                            : 'hover:bg-white/10 text-slate-200 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-teal-400 border-teal-300 text-slate-950 font-bold' : 'border-white/30'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="truncate">
                            <span className="font-semibold block truncate">{s.nama}</span>
                            <span className="text-[10px] text-white/60 block truncate">{s.kelasNama} · {s.kelompokNama}</span>
                          </div>
                        </div>

                        <span className="text-[10px] text-white/50 shrink-0">
                          {s.gender === 'santriwan' ? 'Putra' : 'Putri'}
                        </span>
                      </div>
                    );
                  })}
              </div>
              <p className="text-[10px] text-teal-100/70 italic">
                * Klik pada nama santri untuk memilih atau membatalkan pilihan. Anda dapat memilih 2 anak atau lebih.
              </p>
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
                <input
                  type="password"
                  value={regParentPassword}
                  onChange={e => setRegParentPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white/15 border border-white/25 rounded-xl text-white text-xs"
                  placeholder="Min 6 karakter"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-emerald-100 mb-1">Konfirmasi Password</label>
                <input
                  type="password"
                  value={regParentConfirmPassword}
                  onChange={e => setRegParentConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white/15 border border-white/25 rounded-xl text-white text-xs"
                  placeholder="Ulangi password"
                />
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
    </div>
  );
};
