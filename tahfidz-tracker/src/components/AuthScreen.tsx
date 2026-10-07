import React, { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
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
  Search,
  Check,
  X,
  Users,
  Eye,
  EyeOff,
  KeyRound,
  History
} from 'lucide-react';
import { Role, User } from '../types';

const REMEMBERED_ACCOUNTS_KEY = 'tahfidz_remembered_accounts_v1';

export interface RememberedAccountInfo {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: Role;
  avatar?: string;
  studentName?: string;
  authMethod: 'password' | 'google';
  savedIdentifier: string;
  savedPassword?: string;
  lastUsedAt: string;
}

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.49 12.275c0-.85-.075-1.675-.215-2.475H12v4.69h6.445c-.28 1.49-1.125 2.755-2.395 3.605v2.995h3.875c2.265-2.085 3.565-5.16 3.565-8.815z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.955-1.075 7.94-2.91l-3.875-2.995c-1.075.72-2.45 1.15-4.065 1.15-3.125 0-5.775-2.11-6.72-4.945H1.275v3.09C3.25 21.305 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.3c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3V6.61H1.275C.465 8.225 0 10.06 0 12s.465 3.775 1.275 5.39L5.28 14.3z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.76 0 3.34.605 4.585 1.795l3.435-3.435C17.95 1.19 15.235 0 12 0 7.31 0 3.25 2.695 1.275 6.61L5.28 9.7c.945-2.835 3.595-4.95 6.72-4.95z"
    />
  </svg>
);

export const AuthScreen: React.FC = () => {
  const {
    loginUserAccount,
    registerUserAccount,
    loginWithGoogle,
    resetUserPassword,
    santriList,
    userAccounts,
    deletedUserIds,
    deletedUsersList,
    systemSettings
  } = useTahfidz();

  type ViewMode =
    | 'selection'
    | 'guru-login'
    | 'parent-login'
    | 'guru-register'
    | 'parent-register'
    | 'forgot-password'
    | 'google-parent-complete';

  const [view, setView] = useState<ViewMode>('selection');
  const [forgotReturnView, setForgotReturnView] = useState<'guru-login' | 'parent-login'>('guru-login');

  // Remembered accounts state (sorted by most recently used)
  const [rememberedAccounts, setRememberedAccounts] = useState<RememberedAccountInfo[]>(() => {
    try {
      const raw = localStorage.getItem(REMEMBERED_ACCOUNTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load remembered accounts:', e);
    }
    return [];
  });
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Automatically remove any remembered account that has been deleted by Super Admin
  useEffect(() => {
    if (deletedUserIds.length === 0 && deletedUsersList.length === 0) return;
    const lowerDeleted = new Set<string>();
    deletedUserIds.forEach(d => {
      if (d) lowerDeleted.add(d.trim().toLowerCase());
    });
    deletedUsersList.forEach(d => {
      if (d.userId) lowerDeleted.add(d.userId.trim().toLowerCase());
      if (d.email) lowerDeleted.add(d.email.trim().toLowerCase());
      if (d.username) lowerDeleted.add(d.username.trim().toLowerCase());
    });

    setRememberedAccounts(prev => {
      const filtered = prev.filter(
        a =>
          !lowerDeleted.has((a.id || '').trim().toLowerCase()) &&
          !lowerDeleted.has((a.email || '').trim().toLowerCase()) &&
          !lowerDeleted.has((a.username || '').trim().toLowerCase()) &&
          !lowerDeleted.has((a.savedIdentifier || '').trim().toLowerCase())
      );
      if (filtered.length !== prev.length) {
        try {
          localStorage.setItem(REMEMBERED_ACCOUNTS_KEY, JSON.stringify(filtered));
        } catch {
          // ignore
        }
      }
      return filtered;
    });
  }, [deletedUserIds, deletedUsersList]);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Register Guru form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regRole, setRegRole] = useState<Role>('guru');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Register Parent form state (Mendukung 2 anak atau lebih)
  const [regParentName, setRegParentName] = useState('');
  const [regParentEmail, setRegParentEmail] = useState('');
  const [regParentPhone, setRegParentPhone] = useState('');
  const [regParentStudentIds, setRegParentStudentIds] = useState<string[]>(
    santriList[0]?.id ? [santriList[0].id] : []
  );
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [regParentPassword, setRegParentPassword] = useState('');
  const [regParentConfirmPassword, setRegParentConfirmPassword] = useState('');
  const [showRegParentPassword, setShowRegParentPassword] = useState(false);
  const [showRegParentConfirmPassword, setShowRegParentConfirmPassword] = useState(false);

  // Forgot Password form state
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Pending Google user state (for new Wali Santri selecting children or fallback Google modal)
  const [pendingGoogleUser, setPendingGoogleUser] = useState<{
    uid?: string;
    name: string;
    email: string;
    avatar?: string;
    phone?: string;
  } | null>(null);
  const [isGoogleFallbackOpen, setIsGoogleFallbackOpen] = useState(false);
  const [googleFallbackRole, setGoogleFallbackRole] = useState<Role>('guru');
  const [googleFallbackName, setGoogleFallbackName] = useState('');
  const [googleFallbackEmail, setGoogleFallbackEmail] = useState('');
  const [googleFallbackError, setGoogleFallbackError] = useState('');

  // Helper to save a remembered account upon successful login
  const saveRememberedAccount = (
    user: User,
    authMethod: 'password' | 'google',
    identifierUsed: string,
    passwordUsed?: string
  ) => {
    if (!rememberMe) return;
    try {
      const entry: RememberedAccountInfo = {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        studentName: user.studentName,
        authMethod,
        savedIdentifier: identifierUsed || user.email || user.username || '',
        savedPassword: passwordUsed,
        lastUsedAt: new Date().toISOString()
      };

      setRememberedAccounts(prev => {
        const filtered = prev.filter(
          a =>
            a.id !== entry.id &&
            a.email.toLowerCase() !== entry.email.toLowerCase() &&
            a.savedIdentifier.toLowerCase() !== entry.savedIdentifier.toLowerCase()
        );
        const updated = [entry, ...filtered].slice(0, 3);
        localStorage.setItem(REMEMBERED_ACCOUNTS_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.warn('Failed to save remembered account:', e);
    }
  };

  const removeRememberedAccount = (accountId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRememberedAccounts(prev => {
      const updated = prev.filter(a => a.id !== accountId);
      try {
        localStorage.setItem(REMEMBERED_ACCOUNTS_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn(err);
      }
      return updated;
    });
  };

  // Pre-fill login fields when entering guru-login or parent-login from the last used account of that category
  const changeView = (newView: ViewMode) => {
    setView(newView);
    setLoginError('');
    setRegError('');
    setRegSuccess('');
    setForgotError('');
    setForgotSuccess('');
    setShowLoginPassword(false);

    if (newView === 'guru-login') {
      const lastGuru = rememberedAccounts.find(a => a.role !== 'parent');
      if (lastGuru) {
        setLoginIdentifier(lastGuru.savedIdentifier || lastGuru.email || lastGuru.username || '');
        setLoginPassword(lastGuru.savedPassword || '');
      }
    } else if (newView === 'parent-login') {
      const lastParent = rememberedAccounts.find(a => a.role === 'parent');
      if (lastParent) {
        setLoginIdentifier(lastParent.savedIdentifier || lastParent.email || lastParent.username || '');
        setLoginPassword(lastParent.savedPassword || '');
      }
    }
  };

  // Quick 1-click login from a remembered account card
  const handleQuickLoginRemembered = async (acc: RememberedAccountInfo) => {
    setLoginError('');
    setIsSubmitting(true);
    try {
      if (acc.authMethod === 'google') {
        const res = await loginWithGoogle(
          {
            name: acc.name,
            email: acc.email,
            avatar: acc.avatar
          },
          acc.role
        );
        if (res.success && res.user) {
          saveRememberedAccount(res.user, 'google', acc.email);
        } else {
          if (res.message.toLowerCase().includes('dihapus')) {
            removeRememberedAccount(acc.id);
          }
          changeView(acc.role === 'parent' ? 'parent-login' : 'guru-login');
          setLoginIdentifier(acc.email);
          setLoginError(res.message);
        }
      } else if (acc.savedPassword) {
        const targetRole = acc.role === 'parent' ? 'parent' : 'guru';
        const res = await loginUserAccount(acc.savedIdentifier, acc.savedPassword, targetRole);
        if (res.success && res.user) {
          saveRememberedAccount(res.user, 'password', acc.savedIdentifier, acc.savedPassword);
        } else {
          if (res.message.toLowerCase().includes('dihapus')) {
            removeRememberedAccount(acc.id);
          }
          changeView(acc.role === 'parent' ? 'parent-login' : 'guru-login');
          setLoginIdentifier(acc.savedIdentifier);
          setLoginPassword('');
          setLoginError(res.message);
        }
      } else {
        changeView(acc.role === 'parent' ? 'parent-login' : 'guru-login');
        setLoginIdentifier(acc.savedIdentifier || acc.email);
        setLoginPassword('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openForgotPassword = (fromView: 'guru-login' | 'parent-login') => {
    setForgotReturnView(fromView);
    setForgotIdentifier(loginIdentifier);
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError('');
    setForgotSuccess('');
    setView('forgot-password');
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
    } else if (res.user) {
      saveRememberedAccount(res.user, 'password', loginIdentifier.trim(), loginPassword);
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
    } else if (res.user) {
      saveRememberedAccount(res.user, 'password', loginIdentifier.trim(), loginPassword);
    }
  };

  const processGoogleUserResult = async (
    googleUser: {
      uid?: string;
      name: string;
      email: string;
      avatar?: string;
      phone?: string;
    },
    targetRole: Role
  ) => {
    const preselectedStudents =
      targetRole === 'parent' && view === 'parent-register' && regParentStudentIds.length > 0
        ? regParentStudentIds
        : undefined;

    const res = await loginWithGoogle(googleUser, targetRole, preselectedStudents);
    if (!res.success) {
      if (res.needsStudentSelection) {
        setPendingGoogleUser(googleUser);
        if (regParentStudentIds.length === 0 && santriList[0]?.id) {
          setRegParentStudentIds([santriList[0].id]);
        }
        changeView('google-parent-complete');
      } else {
        setLoginError(res.message);
        setRegError(res.message);
      }
    } else if (res.user) {
      saveRememberedAccount(res.user, 'google', res.user.email);
    }
  };

  const handleGoogleAuth = async (targetRole: Role) => {
    setLoginError('');
    setRegError('');
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      if (!fbUser.email) {
        setLoginError('Akun Google tidak memiliki alamat email yang valid.');
        setIsGoogleLoading(false);
        return;
      }

      await processGoogleUserResult(
        {
          uid: fbUser.uid,
          name: fbUser.displayName || fbUser.email.split('@')[0],
          email: fbUser.email,
          avatar: fbUser.photoURL || undefined,
          phone: fbUser.phoneNumber || undefined
        },
        targetRole
      );
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User closed the popup intentionally
      } else {
        // Fallback modal when preview iframe / domain restricts popup OAuth
        const lastAcc = rememberedAccounts.find(a =>
          targetRole === 'parent' ? a.role === 'parent' : a.role !== 'parent'
        );
        setGoogleFallbackRole(targetRole);
        setGoogleFallbackName(lastAcc?.name || '');
        setGoogleFallbackEmail(lastAcc?.email || '');
        setGoogleFallbackError('');
        setIsGoogleFallbackOpen(true);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleFallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleFallbackError('');
    const cleanEmail = googleFallbackEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setGoogleFallbackError('Masukkan alamat email Google yang valid (contoh: nama@gmail.com).');
      return;
    }
    const existing = userAccounts.find(u => u.email && u.email.trim().toLowerCase() === cleanEmail);
    const finalName = googleFallbackName.trim() || existing?.name || cleanEmail.split('@')[0];

    setIsGoogleFallbackOpen(false);
    setIsGoogleLoading(true);
    await processGoogleUserResult(
      {
        name: finalName,
        email: cleanEmail
      },
      googleFallbackRole
    );
    setIsGoogleLoading(false);
  };

  const handleCompleteGoogleParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingGoogleUser) return;
    if (regParentStudentIds.length === 0) {
      setRegError('Pilih setidaknya 1 santri ananda.');
      return;
    }
    setIsSubmitting(true);
    setRegError('');
    const res = await loginWithGoogle(
      {
        ...pendingGoogleUser,
        phone: regParentPhone.trim() || pendingGoogleUser.phone
      },
      'parent',
      regParentStudentIds
    );
    setIsSubmitting(false);
    if (!res.success) {
      setRegError(res.message);
    } else if (res.user) {
      saveRememberedAccount(res.user, 'google', res.user.email);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotIdentifier.trim()) {
      setForgotError('Harap masukkan Email atau Username akun Anda.');
      return;
    }

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setForgotError('Password baru minimal harus 6 karakter.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Konfirmasi password baru tidak cocok.');
      return;
    }

    setIsSubmitting(true);
    const res = await resetUserPassword(forgotIdentifier.trim(), forgotNewPassword);

    if (forgotIdentifier.includes('@')) {
      try {
        await sendPasswordResetEmail(auth, forgotIdentifier.trim());
      } catch {
        // Handled via local/Firestore resetUserPassword
      }
    }
    setIsSubmitting(false);

    if (res.success) {
      setForgotSuccess(res.message);
      setLoginIdentifier(forgotIdentifier.trim());
      setLoginPassword(forgotNewPassword);
      // Update savedPassword in rememberedAccounts if this account was remembered
      const cleanId = forgotIdentifier.trim().toLowerCase();
      setRememberedAccounts(prev => {
        const updated = prev.map(a => {
          if (
            a.email.toLowerCase() === cleanId ||
            (a.username && a.username.toLowerCase() === cleanId) ||
            a.savedIdentifier.toLowerCase() === cleanId
          ) {
            return { ...a, savedPassword: forgotNewPassword };
          }
          return a;
        });
        try {
          localStorage.setItem(REMEMBERED_ACCOUNTS_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    } else {
      setForgotError(res.message);
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
      if (res.user) {
        saveRememberedAccount(res.user, 'password', regEmail.trim(), regPassword);
      }
      setRegSuccess('Pendaftaran berhasil! Mengalihkan ke dashboard...');
      setTimeout(() => {
        if (res.user) {
          loginUserAccount(regEmail, regPassword);
        }
      }, 1000);
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
      if (res.user) {
        saveRememberedAccount(res.user, 'password', regParentEmail.trim(), regParentPassword);
      }
      setRegSuccess(`Pendaftaran wali berhasil untuk ${selectedStudents.length} santri ananda! Mengalihkan...`);
      setTimeout(() => {
        if (res.user) {
          loginUserAccount(regParentEmail, regParentPassword, 'parent');
        }
      }, 1000);
    } else {
      setRegError(res.message);
    }
  };

  const getRoleBadgeLabel = (role: Role) => {
    if (role === 'parent') return 'Wali Santri';
    if (role === 'super_admin') return 'Super Admin';
    if (role === 'admin') return 'Admin';
    if (role === 'coordinator') return 'Koordinator';
    return 'Guru / Asatidz';
  };

  // Reusable Multi-Child Selector UI
  const renderMultiChildSelector = () => (
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
                <span>
                  {student.nama} ({student.kelasNama})
                </span>
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

      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
        <input
          type="text"
          value={studentSearchQuery}
          onChange={e => setStudentSearchQuery(e.target.value)}
          placeholder="Ketik nama santri untuk mencari..."
          className="w-full pl-8 pr-3 py-1.5 bg-white/10 border border-white/25 rounded-xl text-white text-xs placeholder:text-white/40 focus:ring-2 focus:ring-teal-400 outline-none"
        />
      </div>

      <div className="max-h-40 overflow-y-auto space-y-1 pr-1 bg-slate-900/80 rounded-xl border border-white/15 p-1.5">
        {santriList
          .filter(s => {
            if (!studentSearchQuery.trim()) return true;
            const q = studentSearchQuery.toLowerCase();
            return (
              s.nama.toLowerCase().includes(q) ||
              s.kelasNama.toLowerCase().includes(q) ||
              s.kelompokNama.toLowerCase().includes(q)
            );
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
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-teal-400 border-teal-300 text-slate-950 font-bold' : 'border-white/30'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div className="truncate">
                    <span className="font-semibold block truncate">{s.nama}</span>
                    <span className="text-[10px] text-white/60 block truncate">
                      {s.kelasNama} · {s.kelompokNama}
                    </span>
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
  );

  // Reusable Remembered Account Quick Card for Login views
  const renderRoleRememberedAccounts = (forParent: boolean) => {
    const matching = rememberedAccounts.filter(a =>
      forParent ? a.role === 'parent' : a.role !== 'parent'
    );
    if (matching.length === 0) return null;

    return (
      <div className="space-y-1.5 bg-white/10 border border-white/20 rounded-2xl p-3">
        <div className="flex items-center justify-between text-[11px] text-emerald-100/90 font-semibold">
          <span className="flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-emerald-300" />
            <span>Akun Terakhir Digunakan</span>
          </span>
          <span className="text-[10px] text-white/60">Klik untuk masuk cepat</span>
        </div>
        <div className="space-y-1.5">
          {matching.map(acc => (
            <div
              key={acc.id}
              onClick={() => handleQuickLoginRemembered(acc)}
              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {acc.avatar ? (
                  <img
                    src={acc.avatar}
                    alt={acc.name}
                    className="w-8 h-8 rounded-full object-cover border border-white/30 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/30 border border-emerald-300/40 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {acc.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate">{acc.name}</span>
                    {acc.authMethod === 'google' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white text-[9px] font-bold text-slate-700 shrink-0">
                        Google
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-emerald-100/75 truncate">
                    {acc.email || acc.username}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-emerald-400/20 text-emerald-200 group-hover:bg-emerald-400 group-hover:text-slate-950 transition-colors">
                  Masuk
                </span>
                <button
                  type="button"
                  onClick={e => removeRememberedAccount(acc.id, e)}
                  className="p-1 text-white/50 hover:text-rose-300 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Lupakan akun ini"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {systemSettings?.schoolName || 'Tahfidz Tracker'}
          </h1>
          <p className="text-emerald-100/90 text-xs sm:text-sm mt-1">
            {systemSettings?.academicYear
              ? `Sistem Pencatatan Hafalan Al-Qur'an · T.A. ${systemSettings.academicYear}`
              : "Sistem Pencatatan Hafalan Al-Qur'an Terpadu"}
          </p>
        </div>

        {/* VIEW: Selection (Clean Role Selection + Akun Terakhir yang Digunakan) */}
        {view === 'selection' && (
          <div className="space-y-4">
            {/* Fitur Ingat Akun Terakhir yang Digunakan untuk Masuk */}
            {rememberedAccounts.length > 0 && (
              <div className="bg-white/10 border border-emerald-300/30 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Akun Terakhir Digunakan</span>
                  </span>
                  <span className="text-[10px] text-emerald-100/70">1-Klik Masuk</span>
                </div>

                <div className="space-y-2">
                  {rememberedAccounts.slice(0, 2).map(acc => (
                    <div
                      key={acc.id}
                      onClick={() => handleQuickLoginRemembered(acc)}
                      className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {acc.avatar ? (
                          <img
                            src={acc.avatar}
                            alt={acc.name}
                            className="w-9 h-9 rounded-full object-cover border border-white/30 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/30 border border-emerald-300/40 flex items-center justify-center text-sm font-bold text-white shrink-0">
                            {acc.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-white truncate">
                              {acc.name}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-500/30 text-emerald-100 border border-emerald-300/30">
                              {getRoleBadgeLabel(acc.role)}
                            </span>
                          </div>
                          <div className="text-[11px] text-emerald-100/80 truncate">
                            {acc.email || acc.username}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-400 group-hover:bg-emerald-300 text-slate-950 font-bold text-[11px] transition-colors">
                          Masuk
                        </span>
                        <button
                          type="button"
                          onClick={e => removeRememberedAccount(acc.id, e)}
                          className="p-1.5 text-white/60 hover:text-rose-300 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                          title="Hapus dari akun tersimpan"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs text-center text-emerald-100/80">
                {rememberedAccounts.length > 0
                  ? 'Atau pilih portal akses untuk masuk dengan akun lain:'
                  : 'Pilih portal akses sesuai peran Anda:'}
              </p>

              <button
                onClick={() => changeView('guru-login')}
                className="w-full flex items-center justify-between p-4 bg-white/15 hover:bg-white/25 border border-white/25 rounded-2xl transition-all duration-200 text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/30 flex items-center justify-center text-emerald-200 shadow-sm shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-base">Masuk Sebagai Guru / Asatidz</div>
                    <div className="text-xs text-emerald-100/80">
                      Kelola santri, setoran hafalan, & absensi halaqah
                    </div>
                  </div>
                </div>
                <span className="text-emerald-300 group-hover:translate-x-1 transition-transform font-bold">
                  →
                </span>
              </button>

              <button
                onClick={() => changeView('parent-login')}
                className="w-full flex items-center justify-between p-4 bg-white/15 hover:bg-white/25 border border-white/25 rounded-2xl transition-all duration-200 text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-teal-500/30 flex items-center justify-center text-teal-200 shadow-sm shrink-0">
                    <HeartHandshake className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-base">Masuk Sebagai Wali Santri</div>
                    <div className="text-xs text-emerald-100/80">
                      Pantau perkembangan mutqin & kehadiran ananda
                    </div>
                  </div>
                </div>
                <span className="text-emerald-300 group-hover:translate-x-1 transition-transform font-bold">
                  →
                </span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW: Guru / Admin Login */}
        {view === 'guru-login' && (
          <div className="space-y-4">
            <form onSubmit={handleGuruLogin} className="space-y-3.5">
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => changeView('selection')}
                  className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                  title="Kembali"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-lg font-bold text-white">Login Guru / Admin</h2>
              </div>

              {renderRoleRememberedAccounts(false)}

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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-emerald-100 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Password
                  </label>
                  <button
                    type="button"
                    onClick={() => openForgotPassword('guru-login')}
                    className="text-xs font-medium text-emerald-300 hover:text-white underline underline-offset-2 cursor-pointer"
                  >
                    Lupa Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 bg-white/15 border border-white/25 rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                    title={showLoginPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Checkbox Ingat Akun */}
              <label className="flex items-center gap-2 text-xs text-emerald-100/90 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-white/30 bg-white/10 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                />
                <span>Ingat akun terakhir yang digunakan untuk masuk</span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting || isGoogleLoading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                {isSubmitting ? 'Memeriksa Akun...' : 'Masuk Sekarang'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center py-0.5">
              <div className="flex-grow border-t border-white/15" />
              <span className="flex-shrink mx-3 text-[11px] text-emerald-100/70 uppercase tracking-wider font-medium">
                atau
              </span>
              <div className="flex-grow border-t border-white/15" />
            </div>

            {/* Masuk dengan Google */}
            <button
              type="button"
              disabled={isSubmitting || isGoogleLoading}
              onClick={() => handleGoogleAuth('guru')}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-800 font-semibold rounded-xl shadow-md transition-all text-xs sm:text-sm flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <GoogleIcon className="w-4 h-4 shrink-0" />
              <span>{isGoogleLoading ? 'Menghubungkan Google...' : 'Masuk dengan Google'}</span>
            </button>

            {/* Tombol Daftar Akun Guru di Halaman Login Guru */}
            <div className="pt-3 border-t border-white/15 text-center space-y-2">
              <p className="text-xs text-emerald-100/85">Belum memiliki akun Guru / Asatidz?</p>
              <button
                type="button"
                onClick={() => changeView('guru-register')}
                className="w-full py-2.5 px-4 bg-white/15 hover:bg-white/25 border border-emerald-300/30 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-emerald-300" />
                <span>Daftar Akun Guru / Admin Baru</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW: Parent Login */}
        {view === 'parent-login' && (
          <div className="space-y-4">
            <form onSubmit={handleParentLogin} className="space-y-3.5">
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => changeView('selection')}
                  className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                  title="Kembali"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-lg font-bold text-white">Login Wali Santri</h2>
              </div>

              {renderRoleRememberedAccounts(true)}

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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-emerald-100 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Password
                  </label>
                  <button
                    type="button"
                    onClick={() => openForgotPassword('parent-login')}
                    className="text-xs font-medium text-teal-300 hover:text-white underline underline-offset-2 cursor-pointer"
                  >
                    Lupa Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 bg-white/15 border border-white/25 rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                    title={showLoginPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Checkbox Ingat Akun */}
              <label className="flex items-center gap-2 text-xs text-emerald-100/90 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-white/30 bg-white/10 text-teal-400 focus:ring-teal-400 cursor-pointer"
                />
                <span>Ingat akun terakhir yang digunakan untuk masuk</span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting || isGoogleLoading}
                className="w-full py-3 bg-teal-400 hover:bg-teal-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                {isSubmitting ? 'Memverifikasi...' : 'Masuk Pantau Santri'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center py-0.5">
              <div className="flex-grow border-t border-white/15" />
              <span className="flex-shrink mx-3 text-[11px] text-emerald-100/70 uppercase tracking-wider font-medium">
                atau
              </span>
              <div className="flex-grow border-t border-white/15" />
            </div>

            {/* Masuk dengan Google */}
            <button
              type="button"
              disabled={isSubmitting || isGoogleLoading}
              onClick={() => handleGoogleAuth('parent')}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-800 font-semibold rounded-xl shadow-md transition-all text-xs sm:text-sm flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <GoogleIcon className="w-4 h-4 shrink-0" />
              <span>{isGoogleLoading ? 'Menghubungkan Google...' : 'Masuk dengan Google'}</span>
            </button>

            {/* Tombol Daftar Akun Orang Tua / Wali di Halaman Login Wali */}
            <div className="pt-3 border-t border-white/15 text-center space-y-2">
              <p className="text-xs text-emerald-100/85">Belum memiliki akun Wali Santri?</p>
              <button
                type="button"
                onClick={() => changeView('parent-register')}
                className="w-full py-2.5 px-4 bg-white/15 hover:bg-white/25 border border-teal-300/30 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-teal-300" />
                <span>Daftar Akun Wali Santri Baru</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW: Forgot Password */}
        {view === 'forgot-password' && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => changeView(forgotReturnView)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                title="Kembali ke Login"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-300" />
                  <span>Reset / Lupa Password</span>
                </h2>
                <p className="text-[11px] text-emerald-100/80">
                  Masukkan email atau username terdaftar untuk mengatur ulang password
                </p>
              </div>
            </div>

            {forgotError && (
              <div className="p-3 bg-rose-500/25 border border-rose-400/40 rounded-xl text-xs text-rose-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="p-3.5 bg-emerald-500/25 border border-emerald-400/50 rounded-xl text-xs text-emerald-100 space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <span>{forgotSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => changeView(forgotReturnView)}
                  className="w-full py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Kembali ke Halaman Login
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-emerald-100 mb-1 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5" /> Email atau Username Terdaftar
              </label>
              <input
                type="text"
                value={forgotIdentifier}
                onChange={e => setForgotIdentifier(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white/15 border border-white/25 rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Masukkan email atau username akun Anda"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-emerald-100 mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Password Baru
              </label>
              <div className="relative">
                <input
                  type={showForgotPassword ? 'text' : 'password'}
                  value={forgotNewPassword}
                  onChange={e => setForgotNewPassword(e.target.value)}
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white/15 border border-white/25 rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="Minimal 6 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                  title={showForgotPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showForgotPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-emerald-100 mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Konfirmasi Password Baru
              </label>
              <div className="relative">
                <input
                  type={showForgotConfirmPassword ? 'text' : 'password'}
                  value={forgotConfirmPassword}
                  onChange={e => setForgotConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white/15 border border-white/25 rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="Ulangi password baru"
                />
                <button
                  type="button"
                  onClick={() => setShowForgotConfirmPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                  title={showForgotConfirmPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showForgotConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              {isSubmitting ? 'Memperbarui Password...' : 'Simpan Password Baru'}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => changeView(forgotReturnView)}
                className="text-xs text-emerald-200 hover:text-white underline underline-offset-2 cursor-pointer"
              >
                Batal & Kembali ke Login
              </button>
            </div>
          </form>
        )}

        {/* VIEW: Complete Google Registration for Wali Santri (Select Santri Ananda) */}
        {view === 'google-parent-complete' && pendingGoogleUser && (
          <form onSubmit={handleCompleteGoogleParent} className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => changeView('parent-login')}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Lengkapi Pendaftaran Wali (Google)
                </h2>
                <p className="text-[11px] text-emerald-100/80">
                  Pilih santri ananda yang ingin dipantau dengan akun Google Anda
                </p>
              </div>
            </div>

            <div className="p-3 bg-white/10 border border-white/20 rounded-xl flex items-center gap-3">
              {pendingGoogleUser.avatar ? (
                <img
                  src={pendingGoogleUser.avatar}
                  alt={pendingGoogleUser.name}
                  className="w-10 h-10 rounded-full border border-white/30 object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-teal-500/30 border border-teal-300/40 flex items-center justify-center font-bold text-sm shrink-0">
                  {pendingGoogleUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{pendingGoogleUser.name}</div>
                <div className="text-[11px] text-emerald-200 truncate">{pendingGoogleUser.email}</div>
              </div>
            </div>

            {regError && (
              <div className="p-3 bg-rose-500/25 border border-rose-400/40 rounded-xl text-xs text-rose-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {renderMultiChildSelector()}

            <div>
              <label className="block text-xs font-medium text-emerald-100 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> No. WhatsApp Aktif (Opsional)
              </label>
              <input
                type="tel"
                value={regParentPhone}
                onChange={e => setRegParentPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white/15 border border-white/25 rounded-xl text-white text-xs"
                placeholder="08xxxxxxxxxx"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-teal-400 hover:bg-teal-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Menyimpan...' : 'Selesaikan & Masuk Dashboard'}
            </button>
          </form>
        )}

        {/* VIEW: Guru Register */}
        {view === 'guru-register' && (
          <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
            <form onSubmit={handleGuruRegister} className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => changeView('guru-login')}
                  className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                  title="Kembali ke Login Guru"
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

              <button
                type="button"
                disabled={isSubmitting || isGoogleLoading}
                onClick={() => handleGoogleAuth(regRole)}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-800 font-semibold rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <GoogleIcon className="w-4 h-4 shrink-0" />
                <span>{isGoogleLoading ? 'Menghubungkan Google...' : 'Masuk dengan Google'}</span>
              </button>

              <div className="relative flex items-center py-0.5">
                <div className="flex-grow border-t border-white/15" />
                <span className="flex-shrink mx-2 text-[10px] text-emerald-100/70 uppercase tracking-wider">
                  atau isi formulir
                </span>
                <div className="flex-grow border-t border-white/15" />
              </div>

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
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-0.5 cursor-pointer"
                      title={showRegPassword ? 'Sembunyikan' : 'Lihat'}
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-0.5 cursor-pointer"
                      title={showRegConfirmPassword ? 'Sembunyikan' : 'Lihat'}
                    >
                      {showRegConfirmPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg transition-all text-sm mt-2 flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                {isSubmitting ? 'Mendaftarkan Akun...' : 'Daftar Akun Baru'}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => changeView('guru-login')}
                  className="text-xs text-emerald-200 hover:text-white underline underline-offset-2 cursor-pointer"
                >
                  Sudah punya akun? Masuk di sini
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW: Parent Register */}
        {view === 'parent-register' && (
          <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
            <form onSubmit={handleParentRegister} className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => changeView('parent-login')}
                  className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                  title="Kembali ke Login Wali Santri"
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

              {/* Multi-Child Selector first so even Google Sign-Up uses selected children */}
              {renderMultiChildSelector()}

              <button
                type="button"
                disabled={isSubmitting || isGoogleLoading}
                onClick={() => handleGoogleAuth('parent')}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-800 font-semibold rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <GoogleIcon className="w-4 h-4 shrink-0" />
                <span>{isGoogleLoading ? 'Menghubungkan Google...' : 'Masuk dengan Google'}</span>
              </button>

              <div className="relative flex items-center py-0.5">
                <div className="flex-grow border-t border-white/15" />
                <span className="flex-shrink mx-2 text-[10px] text-emerald-100/70 uppercase tracking-wider">
                  atau daftar manual
                </span>
                <div className="flex-grow border-t border-white/15" />
              </div>

              <div>
                <label className="block text-xs font-medium text-emerald-100 mb-1">
                  Nama Orang Tua / Wali
                </label>
                <input
                  type="text"
                  value={regParentName}
                  onChange={e => setRegParentName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white/15 border border-white/25 rounded-xl text-white text-xs focus:ring-2 focus:ring-teal-400"
                  placeholder="Bapak / Ibu..."
                />
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-0.5 cursor-pointer"
                      title={showRegParentPassword ? 'Sembunyikan' : 'Lihat'}
                    >
                      {showRegParentPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-emerald-100 mb-1">
                    Konfirmasi Password
                  </label>
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-0.5 cursor-pointer"
                      title={showRegParentConfirmPassword ? 'Sembunyikan' : 'Lihat'}
                    >
                      {showRegParentConfirmPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-teal-400 hover:bg-teal-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg transition-all text-sm mt-2 flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                {isSubmitting ? 'Mendaftarkan Akun...' : 'Daftar Akun Wali'}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => changeView('parent-login')}
                  className="text-xs text-teal-200 hover:text-white underline underline-offset-2 cursor-pointer"
                >
                  Sudah punya akun? Masuk di sini
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Modal Fallback Google Sign-In jika Popup diblokir browser/iframe */}
      {isGoogleFallbackOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsGoogleFallbackOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white text-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <GoogleIcon className="w-5 h-5" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Masuk dengan Google</h3>
                  <p className="text-[11px] text-slate-500">
                    Lanjutkan ke Tahfidz Tracker sebagai{' '}
                    {googleFallbackRole === 'parent' ? 'Wali Santri' : 'Guru / Asatidz'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGoogleFallbackOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {googleFallbackError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{googleFallbackError}</span>
              </div>
            )}

            <form onSubmit={handleGoogleFallbackSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Email Google
                </label>
                <input
                  type="email"
                  required
                  value={googleFallbackEmail}
                  onChange={e => setGoogleFallbackEmail(e.target.value)}
                  placeholder="nama@gmail.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Akun Google
                </label>
                <input
                  type="text"
                  value={googleFallbackName}
                  onChange={e => setGoogleFallbackName(e.target.value)}
                  placeholder="Nama Anda (opsional jika sudah terdaftar)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsGoogleFallbackOpen(false)}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <GoogleIcon className="w-3.5 h-3.5 bg-white rounded-full p-0.5" />
                  <span>Masuk dengan Google</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
