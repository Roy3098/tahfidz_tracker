import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import {
  db,
  cleanForFirestore,
  handleFirestoreError,
  OperationType,
  testConnection
} from '../firebase';
import {
  Santri,
  Kelas,
  Kelompok,
  TargetHafalan,
  SesiTahfidz,
  TasmiRecord,
  AttendanceRecord,
  User,
  UserAccount,
  UserRole,
  HafalanEntry,
  SystemSettings,
  SystemLogEntry
} from '../types';
import { calculateStudentSetoranGrowth } from '../utils/growthCalculator';
import {
  INITIAL_CLASSES,
  INITIAL_GROUPS,
  INITIAL_TARGETS,
  INITIAL_SESSIONS,
  INITIAL_SANTRI
} from '../data/initialData';

const INITIAL_TASMI: TasmiRecord[] = [
  {
    id: 'tsm-1',
    studentId: 's-1',
    studentName: 'Ahmad Fauzi',
    kelompokNama: 'Kelompok A',
    gender: 'santriwan',
    targetJuzText: 'Juz 1-15 Bil Ghoib',
    tanggal: '2026-09-28',
    waktu: '09:00 WIB',
    penguji: 'Ustadz Ahmad',
    status: 'terjadwal'
  },
  {
    id: 'tsm-2',
    studentId: 's-3',
    studentName: 'Aisyah Siddiq',
    kelompokNama: 'Kelompok C',
    gender: 'santriwati',
    targetJuzText: 'Juz 1-12 Sekali Duduk',
    tanggal: '2026-09-29',
    waktu: '13:30 WIB',
    penguji: 'Ustadzah Khadijah',
    status: 'terjadwal'
  },
  {
    id: 'tsm-3',
    studentId: 's-2',
    studentName: 'Fatimah Zahra',
    kelompokNama: 'Kelompok B',
    gender: 'santriwati',
    targetJuzText: 'Juz 1-18 Bil Ghoib',
    tanggal: '2026-09-20',
    waktu: '10:00 WIB',
    penguji: 'Ustadzah Fatimah',
    status: 'selesai',
    nilai: 'A',
    catatan: 'Mumtaz, tajwid sempurna dan irama sangat khusyuk.',
    videoUrl: 'https://www.youtube.com/watch?v=kYJ3hK6lYtA'
  }
];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-1',
    tanggal: '2026-09-25',
    sessionKey: 'pagi',
    sessionName: 'Sesi Pagi',
    studentId: 's-1',
    studentName: 'Ahmad Fauzi',
    kelompokId: 'grp-A',
    status: 'hadir_tepat',
    timestamp: '2026-09-25T08:05:00.000Z',
    hafalanDeposit: {
      id: 'h-dep-1',
      studentId: 's-1',
      studentName: 'Ahmad Fauzi',
      type: 'baru',
      category: 'surah',
      juz: 15,
      surahName: 'Al-Kahf',
      ayatMulai: 1,
      ayatSelesai: 10,
      kualitas: 'A',
      catatan: 'Hafalan awal Surah Al-Kahf',
      tanggal: '2026-09-25',
      ustadzName: 'Ustadz Ahmad'
    }
  },
  {
    id: 'att-2',
    tanggal: '2026-09-25',
    sessionKey: 'pagi',
    sessionName: 'Sesi Pagi',
    studentId: 's-3',
    studentName: 'Aisyah Siddiq',
    kelompokId: 'grp-C',
    status: 'hadir_tepat',
    timestamp: '2026-09-25T08:02:00.000Z'
  }
];

const STORAGE_KEYS = {
  USER: 'tahfidz_user',
  ACCOUNTS: 'tahfidz_accounts_v2',
  SANTRI: 'tahfidz_santri_v2',
  CLASSES: 'tahfidz_classes_v2',
  GROUPS: 'tahfidz_groups_v2',
  TARGETS: 'tahfidz_targets_v2',
  SESSIONS: 'tahfidz_sessions_v2',
  TASMI: 'tahfidz_tasmi_v2',
  ATTENDANCE: 'tahfidz_attendance_v2',
  CLEARED: 'tahfidz_cleared_data_v1',
  SYSTEM_SETTINGS: 'tahfidz_system_settings_v1',
  SYSTEM_LOGS: 'tahfidz_system_logs_v1',
  ORIGINAL_ADMIN: 'tahfidz_orig_admin_v1',
  DARK_MODE: 'tahfidz_dark_mode_v1'
};

export interface TahfidzContextType {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  toggleDarkMode: () => void;
  login: (user: User) => void;
  logout: () => void;
  switchRole: (role: UserRole, studentId?: string) => void;
  registerUserAccount: (account: Omit<UserAccount, 'id' | 'createdAt'>) => Promise<{ success: boolean; message: string; user?: User }>;
  loginUserAccount: (identifier: string, password?: string, role?: UserRole, studentId?: string) => Promise<{ success: boolean; message: string; user?: User }>;
  switchParentActiveChild: (studentId: string) => void;
  parentChildren: Santri[];
  santriList: Santri[];
  classes: Kelas[];
  groups: Kelompok[];
  targets: TargetHafalan[];
  sessions: SesiTahfidz[];
  tasmiList: TasmiRecord[];
  attendanceHistory: AttendanceRecord[];
  userAccounts: UserAccount[];
  updateUserProfile: (profileData: {
    name: string;
    username?: string;
    email?: string;
    phone?: string;
    avatar?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<{ success: boolean; message: string; user?: User }>;
  resetUserPassword: (identifier: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  deleteUserAccount: (userId: string) => Promise<{ success: boolean; message: string }>;
  isCloudSynced: boolean;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  
  // Hafalan Actions
  addHafalanRecord: (record: Omit<HafalanEntry, 'id'>) => void;
  updateHafalanRecord: (studentId: string, entryId: string, updated: Partial<HafalanEntry>) => void;
  deleteHafalanRecord: (studentId: string, entryId: string) => void;
  
  // Attendance Actions
  saveBulkAttendance: (records: {
    tanggal: string;
    sessionKey: string;
    sessionName: string;
    studentId: string;
    studentName: string;
    kelompokId: string;
    status: AttendanceRecord['status'];
    keterangan?: string;
    catatanPerilaku?: string;
    hafalan?: Omit<HafalanEntry, 'id' | 'studentId' | 'studentName' | 'tanggal' | 'ustadzName'> & { lembar?: number; halaman?: number };
  }[]) => void;
  saveAttendanceSetoran: (
    attendanceId: string, 
    hafalan: Omit<HafalanEntry, 'id' | 'studentId' | 'studentName' | 'ustadzName'> & { 
      tanggal?: string; 
      lembar?: number; 
      halaman?: number; 
    }, 
    catatanPerilaku?: string
  ) => void;
  updateAttendancePerilaku: (attendanceId: string, catatanPerilaku: string) => void;
  updateAttendanceRecord: (
    attendanceId: string,
    updated: Partial<Pick<AttendanceRecord, 'status' | 'keterangan' | 'tanggal' | 'sessionKey' | 'sessionName' | 'catatanPerilaku'>>
  ) => void;
  deleteAttendanceRecord: (attendanceId: string) => void;
  
  // Tasmi Actions
  scheduleTasmi: (studentId: string, tanggal: string, waktu: string, penguji?: string, targetText?: string, videoUrl?: string) => void;
  updateTasmiSchedule: (id: string, tanggal: string, waktu: string, penguji?: string, targetText?: string, videoUrl?: string) => void;
  updateTasmiResult: (id: string, nilai: TasmiRecord['nilai'], catatan: string, videoUrl?: string) => void;
  cancelTasmi: (id: string) => void;
  deleteTasmi: (id: string) => void;

  // Master Data Actions
  addSantri: (santriData: {
    nama: string;
    gender: 'santriwan' | 'santriwati';
    kelasId: string;
    kelompokId: string;
    targetJuz: number;
    orangTuaNama?: string;
    orangTuaPhone?: string;
  }) => void;
  updateSantri: (id: string, santriData: Partial<Santri>) => void;
  deleteSantri: (id: string) => void;

  addKelas: (nama: string, tingkat: Kelas['tingkat'], waliKelas?: string) => void;
  updateKelas: (id: string, nama: string, tingkat: Kelas['tingkat'], waliKelas?: string) => void;
  deleteKelas: (id: string) => void;

  addKelompok: (nama: string, pengajar: string, phone?: string) => void;
  updateKelompok: (id: string, nama: string, pengajar: string, phone?: string) => void;
  deleteKelompok: (id: string) => void;

  addTarget: (nama: string, jumlahJuz: number) => void;
  updateTarget: (id: string, nama: string, jumlahJuz: number) => void;
  deleteTarget: (id: string) => void;

  addSesi: (nama: string, jamMulai: string, jamSelesai: string) => void;
  updateSesi: (id: string, data: Partial<SesiTahfidz>) => void;
  deleteSesi: (id: string) => void;

  // Data Reset & Backup Actions
  resetToDefaultData: () => void;
  resetAllDataToEmpty: () => Promise<void>;
  populateDemoData: () => Promise<void>;
  exportDataJson: () => void;
  importDataJson: (jsonString: string) => boolean;

  // Super Admin & System Features
  systemSettings: SystemSettings;
  updateSystemSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  systemLogs: SystemLogEntry[];
  addSystemLog: (action: string, category: SystemLogEntry['category'], details: string) => void;
  clearSystemLogs: () => void;
  originalSuperAdminUser: User | null;
  impersonateUser: (user: User) => void;
  stopImpersonation: () => void;
  deleteAnyRecord: (collectionName: string, id: string) => Promise<boolean>;
}

const TahfidzContext = createContext<TahfidzContextType | undefined>(undefined);

export const TahfidzProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current logged in user
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [originalSuperAdminUser, setOriginalSuperAdminUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORIGINAL_ADMIN);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    const defaultSettings: SystemSettings = {
      schoolName: "Ma'had Tahfidz Al-Qur'an Terpadu",
      schoolLeader: "Ustadz H. Ahmad Ridwan, Lc., M.Ag.",
      academicYear: "2026/2027 (Ganjil)",
      minTasmiGrade: "B",
      targetWeeklySetoran: 10,
      helpdeskWhatsapp: "6281234567800",
      maintenanceMode: false,
      broadcastAnnouncement: {
        active: false,
        type: 'info',
        message: 'Pengumuman: Jadwal Ujian Tasmi Akhir Semester dibuka mulai pekan depan. Harap santri mempersiapkan hafalan mutqin.',
        updatedAt: new Date().toISOString()
      }
    };
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SYSTEM_SETTINGS);
      if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
    } catch (e) {
      console.error(e);
    }
    return defaultSettings;
  });

  const [systemLogs, setSystemLogs] = useState<SystemLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SYSTEM_LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'log-init',
        timestamp: new Date().toISOString(),
        user: 'System Core',
        action: 'Inisialisasi Sistem',
        category: 'SYSTEM',
        details: 'Koneksi database terhubung dan seluruh modul sistem beroperasi normal.'
      }
    ];
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('syncing');
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Dark Mode State
  const [darkMode, setDarkModeState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
      if (saved !== null) return saved === 'true';
      return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  const setDarkMode = (val: boolean) => {
    setDarkModeState(val);
    try {
      localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(val));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error(e);
    }
  }, [darkMode]);

  // Normalize tingkat
  const normalizeTingkat = (val: string): Kelas['tingkat'] => {
    if (val === 'SD') return 'Ibtidaiyyah';
    if (val === 'SMP') return 'Mutawasith';
    if (val === 'SMA') return 'Aliyah';
    return (val as Kelas['tingkat']) || 'Ibtidaiyyah';
  };

  const isDataCleared = (): boolean => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CLEARED) === 'true';
    } catch {
      return false;
    }
  };

  // Main Entities State
  const [santriList, setSantriList] = useState<Santri[]>(() => {
    try {
      if (isDataCleared()) return [];
      const saved = localStorage.getItem(STORAGE_KEYS.SANTRI);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return isDataCleared() ? [] : INITIAL_SANTRI;
  });

  const [classes, setClasses] = useState<Kelas[]>(() => {
    try {
      if (isDataCleared()) return [];
      const saved = localStorage.getItem(STORAGE_KEYS.CLASSES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(c => ({
            ...c,
            tingkat: normalizeTingkat(c.tingkat),
            waliKelas: c.waliKelas || ''
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return isDataCleared() ? [] : INITIAL_CLASSES;
  });

  const [groups, setGroups] = useState<Kelompok[]>(() => {
    try {
      if (isDataCleared()) return [];
      const saved = localStorage.getItem(STORAGE_KEYS.GROUPS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return isDataCleared() ? [] : INITIAL_GROUPS;
  });

  const [targets, setTargets] = useState<TargetHafalan[]>(() => {
    try {
      if (isDataCleared()) return [];
      const saved = localStorage.getItem(STORAGE_KEYS.TARGETS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return isDataCleared() ? [] : INITIAL_TARGETS;
  });

  const [sessions, setSessions] = useState<SesiTahfidz[]>(() => {
    try {
      if (isDataCleared()) return [];
      const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return isDataCleared() ? [] : INITIAL_SESSIONS;
  });

  const [tasmiList, setTasmiList] = useState<TasmiRecord[]>(() => {
    try {
      if (isDataCleared()) return [];
      const saved = localStorage.getItem(STORAGE_KEYS.TASMI);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return isDataCleared() ? [] : INITIAL_TASMI;
  });

  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>(() => {
    try {
      if (isDataCleared()) return [];
      const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return isDataCleared() ? [] : INITIAL_ATTENDANCE;
  });

  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [deletedUserIds, setDeletedUserIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tahfidz_deleted_user_ids');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Persist to local storage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(userAccounts));
  }, [userAccounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(santriList));
  }, [santriList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TARGETS, JSON.stringify(targets));
  }, [targets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASMI, JSON.stringify(tasmiList));
  }, [tasmiList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceHistory));
  }, [attendanceHistory]);

  const hasLoadedRef = useRef(false);

  // Real-time Firestore Listeners
  useEffect(() => {
    testConnection().then(connected => {
      if (!connected) setCloudSyncStatus('offline');
    });

    const unsubSantri = onSnapshot(
      collection(db, 'santri'),
      snapshot => {
        const list: Santri[] = [];
        snapshot.forEach(docSnap => {
          list.push({ ...(docSnap.data() as Santri), id: docSnap.id });
        });
        setSantriList(list);
        setIsCloudSynced(true);
        setCloudSyncStatus('synced');
      },
      error => {
        handleFirestoreError(error, OperationType.LIST, 'santri');
        setCloudSyncStatus('error');
      }
    );

    const unsubAttendance = onSnapshot(
      collection(db, 'attendance'),
      snapshot => {
        const list: AttendanceRecord[] = [];
        snapshot.forEach(docSnap => {
          list.push({ ...(docSnap.data() as AttendanceRecord), id: docSnap.id });
        });
        list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
        setAttendanceHistory(list);
      },
      error => {
        handleFirestoreError(error, OperationType.LIST, 'attendance');
      }
    );

    const unsubTasmi = onSnapshot(
      collection(db, 'tasmi'),
      snapshot => {
        const list: TasmiRecord[] = [];
        snapshot.forEach(docSnap => {
          list.push({ ...(docSnap.data() as TasmiRecord), id: docSnap.id });
        });
        setTasmiList(list);
      },
      error => {
        handleFirestoreError(error, OperationType.LIST, 'tasmi');
      }
    );

    const unsubClasses = onSnapshot(
      collection(db, 'classes'),
      snapshot => {
        const list: Kelas[] = [];
        snapshot.forEach(docSnap => {
          list.push({ ...(docSnap.data() as Kelas), id: docSnap.id });
        });
        setClasses(list);
      },
      error => {
        handleFirestoreError(error, OperationType.LIST, 'classes');
      }
    );

    const unsubGroups = onSnapshot(
      collection(db, 'groups'),
      snapshot => {
        const list: Kelompok[] = [];
        snapshot.forEach(docSnap => {
          list.push({ ...(docSnap.data() as Kelompok), id: docSnap.id });
        });
        setGroups(list);
      },
      error => {
        handleFirestoreError(error, OperationType.LIST, 'groups');
      }
    );

    const unsubSessions = onSnapshot(
      collection(db, 'sessions'),
      snapshot => {
        const list: SesiTahfidz[] = [];
        snapshot.forEach(docSnap => {
          list.push({ ...(docSnap.data() as SesiTahfidz), id: docSnap.id });
        });
        setSessions(list);
      },
      error => {
        handleFirestoreError(error, OperationType.LIST, 'sessions');
      }
    );

    const unsubTargets = onSnapshot(
      collection(db, 'targets'),
      snapshot => {
        const list: TargetHafalan[] = [];
        snapshot.forEach(docSnap => {
          list.push({ ...(docSnap.data() as TargetHafalan), id: docSnap.id });
        });
        setTargets(list);
      },
      error => {
        handleFirestoreError(error, OperationType.LIST, 'targets');
      }
    );

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      snapshot => {
        const list: UserAccount[] = [];
        snapshot.forEach(docSnap => {
          list.push({ ...(docSnap.data() as UserAccount), id: docSnap.id });
        });
        setUserAccounts(list);
      },
      error => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      }
    );

    const unsubDeletedUsers = onSnapshot(
      collection(db, 'deleted_users'),
      snapshot => {
        const list: string[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.id);
        });
        setDeletedUserIds(prev => {
          const merged = Array.from(new Set([...prev, ...list]));
          try {
            localStorage.setItem('tahfidz_deleted_user_ids', JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      },
      () => {}
    );

    const unsubSettings = onSnapshot(
      doc(db, 'system_settings', 'main'),
      docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<SystemSettings>;
          setSystemSettings(prev => ({ ...prev, ...data }));
        }
      },
      error => {
        console.warn('System settings listener error:', error);
      }
    );

    return () => {
      unsubSantri();
      unsubAttendance();
      unsubTasmi();
      unsubClasses();
      unsubGroups();
      unsubSessions();
      unsubTargets();
      unsubUsers();
      unsubDeletedUsers();
      unsubSettings();
    };
  }, []);

  // Auth Functions
  const login = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const logout = () => {
    setCurrentUser(null);
    setOriginalSuperAdminUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ORIGINAL_ADMIN);
  };

  // Check active session against deleted accounts and super admin removals
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.id === 'admin-master-br' || (currentUser.username || '').toLowerCase() === 'adminbr' || originalSuperAdminUser) return;

    if (deletedUserIds.includes(currentUser.id)) {
      logout();
      return;
    }

    // If user account is registered usr-* and userAccounts has synced, verify it still exists
    if (currentUser.id.startsWith('usr-') && userAccounts.length > 0) {
      const stillActive = userAccounts.some(u => u.id === currentUser.id);
      if (!stillActive) {
        logout();
      }
    }
  }, [currentUser, deletedUserIds, userAccounts, originalSuperAdminUser]);

  const switchRole = (role: UserRole, studentId?: string) => {
    if (role === 'parent') {
      const student = santriList.find(s => s.id === studentId) || santriList[0];
      setCurrentUser({
        id: 'parent-1',
        name: student?.orangTuaNama || 'Wali Santri',
        email: 'ortu@santri.id',
        role: 'parent',
        studentId: student?.id,
        studentName: student?.nama
      });
    } else if (role === 'guru') {
      setCurrentUser({
        id: 'guru-1',
        name: 'Ustadz Salman',
        username: 'SalmanTahfidz',
        email: 'salman@tahfidz.sch.id',
        role: 'guru'
      });
    } else if (role === 'coordinator') {
      setCurrentUser({
        id: 'coord-1',
        name: 'Ustadzah Fatimah',
        username: 'FatimahCoord',
        email: 'fatimah@tahfidz.sch.id',
        role: 'coordinator'
      });
    } else if (role === 'super_admin') {
      setCurrentUser({
        id: 'admin-master-br',
        name: 'Super Admin',
        username: 'AdminBr',
        email: 'adminbr@tahfidz.sch.id',
        role: 'super_admin'
      });
    } else if (role === 'admin') {
      setCurrentUser({
        id: 'admin-1',
        name: 'Administrator Lembaga',
        username: 'AdminTahfidz',
        email: 'admin@tahfidz.sch.id',
        role: 'admin'
      });
    } else {
      setCurrentUser({
        id: 'admin-master-br',
        name: 'Super Admin',
        username: 'AdminBr',
        email: 'adminbr@tahfidz.sch.id',
        role: 'super_admin'
      });
    }
  };

  const registerUserAccount = async (account: Omit<UserAccount, 'id' | 'createdAt'>) => {
    try {
      const email = account.email.trim().toLowerCase();
      const username = (account.username || '').trim().toLowerCase();

      if (userAccounts.some(u => 
        (u.email && u.email.trim().toLowerCase() === email) ||
        (username && u.username && u.username.trim().toLowerCase() === username)
      )) {
        return { success: false, message: 'Email atau username sudah terdaftar dalam sistem!' };
      }

      const newId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newAccount: UserAccount = {
        ...account,
        id: newId,
        createdAt: new Date().toISOString()
      };

      setUserAccounts(prev => {
        const next = [...prev.filter(u => u.id !== newId && u.email.toLowerCase() !== email), newAccount];
        try {
          localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
        return next;
      });

      setDeletedUserIds(prev => {
        const next = prev.filter(id => id !== newId && id !== email);
        try {
          localStorage.setItem('tahfidz_deleted_user_ids', JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
        return next;
      });

      try {
        await setDoc(doc(db, 'users', newId), cleanForFirestore(newAccount));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${newId}`);
      }

      addSystemLog('Registrasi Akun', 'AUTH', `Akun baru terdaftar: ${newAccount.name} (${newAccount.role}) - ${newAccount.email}`);

      const safeUser: User = {
        id: newAccount.id,
        name: newAccount.name,
        username: newAccount.username,
        email: newAccount.email,
        role: newAccount.role,
        studentId: newAccount.studentId,
        studentName: newAccount.studentName,
        studentIds: newAccount.studentIds || (newAccount.studentId ? [newAccount.studentId] : []),
        studentNames: newAccount.studentNames || (newAccount.studentName ? [newAccount.studentName] : []),
        phone: newAccount.phone
      };

      return {
        success: true,
        message: 'Pendaftaran akun berhasil!',
        user: safeUser
      };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, message: 'Gagal mendaftar ke server, silakan coba lagi.' };
    }
  };

  const resetUserPassword = async (identifier: string, newPassword: string) => {
    try {
      const cleanId = identifier.trim().toLowerCase();
      if (cleanId === 'adminbr' || cleanId === 'adminbr@tahfidz.sch.id') {
        return { success: true, message: 'Password untuk akun berhasil diperbarui.' };
      }

      const target = userAccounts.find(u => 
        (u.email && u.email.trim().toLowerCase() === cleanId) ||
        (u.username && u.username.trim().toLowerCase() === cleanId)
      );

      if (!target) {
        return { success: false, message: 'Akun dengan email atau username tersebut tidak ditemukan!' };
      }

      const updated = { ...target, password: newPassword };
      setUserAccounts(prev => prev.map(u => u.id === target.id ? updated : u));

      try {
        await setDoc(doc(db, 'users', target.id), cleanForFirestore(updated));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${target.id}`);
      }

      return { success: true, message: `Password untuk akun ${target.name} (${target.username || target.email}) berhasil diperbarui! Silakan login dengan password baru.` };
    } catch (e) {
      console.error('Reset password error:', e);
      return { success: false, message: 'Terjadi kesalahan saat memperbarui password.' };
    }
  };

  const deleteUserAccount = async (userId: string) => {
    try {
      const targetUser = userAccounts.find(u => u.id === userId);
      setUserAccounts(prev => prev.filter(u => u.id !== userId));
      setDeletedUserIds(prev => {
        const next = Array.from(new Set([...prev, userId]));
        try {
          localStorage.setItem('tahfidz_deleted_user_ids', JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
        return next;
      });

      // If the currently logged in user is the deleted user, force logout immediately
      if (currentUser?.id === userId) {
        logout();
      }

      await deleteDoc(doc(db, 'users', userId));
      try {
        await setDoc(doc(db, 'deleted_users', userId), {
          deletedAt: new Date().toISOString(),
          userId: userId,
          email: targetUser?.email || '',
          username: targetUser?.username || '',
          name: targetUser?.name || ''
        });
      } catch {
        // quiet fallback
      }

      addSystemLog('Hapus Akun Pengguna', 'SECURITY', `Super Admin menghapus akun ${targetUser?.name || userId} (${targetUser?.email || ''})`);
      return { success: true, message: 'Akun berhasil dihapus permanen. Hak akses masuk telah dicabut.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
      return { success: false, message: 'Gagal menghapus akun dari server.' };
    }
  };

  const loginUserAccount = async (
    identifier: string,
    password?: string,
    role?: UserRole
  ) => {
    const cleanId = identifier.trim().toLowerCase();

    // Check if identifier or id has been deleted by Super Admin
    if (deletedUserIds.includes(cleanId)) {
      return { success: false, message: 'Akun ini telah dihapus oleh Super Admin dan tidak lagi memiliki hak akses masuk ke web.' };
    }

    // Built-in Super Admin Role with full database access
    if (cleanId === 'adminbr' || cleanId === 'adminbr@tahfidz.sch.id') {
      const savedMasterPass = localStorage.getItem('tahfidz_adminbr_pass') || 'adminbr123';
      if (password === savedMasterPass || password === 'adminbr123') {
        const savedUserJson = localStorage.getItem(STORAGE_KEYS.USER);
        let customAdminName = 'Super Admin';
        let customAdminPhone: string | undefined = undefined;
        let customAdminEmail = 'adminbr@tahfidz.sch.id';
        try {
          if (savedUserJson) {
            const parsed = JSON.parse(savedUserJson);
            if (parsed.id === 'admin-master-br' || parsed.username === 'AdminBr') {
              customAdminName = parsed.name || customAdminName;
              customAdminPhone = parsed.phone || customAdminPhone;
              customAdminEmail = parsed.email || customAdminEmail;
            }
          }
        } catch {
          // fallback
        }

        const superAdmin: User = {
          id: 'admin-master-br',
          name: customAdminName,
          username: 'AdminBr',
          email: customAdminEmail,
          role: 'super_admin',
          phone: customAdminPhone
        };
        login(superAdmin);
        addSystemLog('Login Super Admin', 'AUTH', 'Login berhasil dengan kredensial master AdminBr');
        return { 
          success: true, 
          message: 'Login berhasil! Akses sistem penuh aktif.', 
          user: superAdmin 
        };
      } else {
        return { success: false, message: 'Username atau password yang dimasukkan salah.' };
      }
    }

    const matched = userAccounts.find(u => {
      const matchEmail = u.email && u.email.trim().toLowerCase() === cleanId;
      const matchUsername = u.username && u.username.trim().toLowerCase() === cleanId;
      return matchEmail || matchUsername;
    });

    if (matched) {
      if (deletedUserIds.includes(matched.id)) {
        return { success: false, message: 'Akun ini telah dihapus oleh Super Admin dan tidak lagi memiliki hak akses masuk ke web.' };
      }

      if (matched.password && matched.password !== password) {
        return { success: false, message: 'Password yang dimasukkan salah!' };
      }

      const safeUser: User = {
        id: matched.id,
        name: matched.name,
        username: matched.username,
        email: matched.email,
        role: matched.role,
        studentId: matched.studentId || (matched.studentIds && matched.studentIds[0]),
        studentName: matched.studentName || (matched.studentNames && matched.studentNames[0]),
        studentIds: matched.studentIds || (matched.studentId ? [matched.studentId] : []),
        studentNames: matched.studentNames || (matched.studentName ? [matched.studentName] : []),
        phone: matched.phone
      };
      login(safeUser);
      addSystemLog('Login Pengguna', 'AUTH', `Pengguna ${safeUser.name} (${safeUser.role}) berhasil masuk`);
      return { success: true, message: 'Login berhasil!', user: safeUser };
    }

    return { success: false, message: 'Akun tidak ditemukan atau telah dihapus oleh Super Admin. Silakan periksa kembali email atau username Anda.' };
  };

  // Helper for Parent with 2 or more children
  const parentChildren = useMemo(() => {
    if (currentUser?.role !== 'parent') return [];
    const ids = currentUser.studentIds && currentUser.studentIds.length > 0
      ? currentUser.studentIds
      : (currentUser.studentId ? [currentUser.studentId] : []);
    
    // 1. Primary lookup by studentIds
    const byIds = santriList.filter(s => ids.includes(s.id));
    if (byIds.length > 0) return byIds;

    // 2. Lookup by studentNames
    if (currentUser.studentNames && currentUser.studentNames.length > 0) {
      const byNames = santriList.filter(s => currentUser.studentNames!.includes(s.nama));
      if (byNames.length > 0) return byNames;
    }

    // 3. Fallback: match by studentId
    if (currentUser.studentId) {
      const single = santriList.filter(s => s.id === currentUser.studentId);
      if (single.length > 0) return single;
    }

    // 4. Fallback: match by orangTuaNama
    if (currentUser.name) {
      const byParent = santriList.filter(s => s.orangTuaNama && s.orangTuaNama.trim().toLowerCase() === currentUser.name.trim().toLowerCase());
      if (byParent.length > 0) return byParent;
    }

    return santriList.slice(0, 1);
  }, [currentUser, santriList]);

  const switchParentActiveChild = (targetStudentId: string) => {
    if (!currentUser || currentUser.role !== 'parent') return;
    const targetStudent = santriList.find(s => s.id === targetStudentId);
    if (targetStudent) {
      const updatedUser: User = {
        ...currentUser,
        studentId: targetStudent.id,
        studentName: targetStudent.nama
      };
      setCurrentUser(updatedUser);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      addSystemLog('Ganti Ananda Wali', 'AUTH', `Wali ${currentUser.name} beralih memantau ${targetStudent.nama}`);
    }
  };

  // Update User Profile & Security
  const updateUserProfile = async (profileData: {
    name: string;
    username?: string;
    email?: string;
    phone?: string;
    avatar?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<{ success: boolean; message: string; user?: User }> => {
    if (!currentUser) {
      return { success: false, message: 'Tidak ada sesi login pengguna aktif.' };
    }

    try {
      const cleanName = profileData.name.trim();
      const cleanUsername = (profileData.username || '').trim();
      const cleanEmail = (profileData.email || '').trim().toLowerCase();
      const cleanPhone = (profileData.phone || '').trim();

      if (!cleanName) {
        return { success: false, message: 'Nama lengkap tidak boleh kosong!' };
      }

      // Check username uniqueness if changed
      if (cleanUsername && cleanUsername.toLowerCase() !== (currentUser.username || '').toLowerCase()) {
        const usernameTaken = userAccounts.some(
          u => u.id !== currentUser.id && u.username?.trim().toLowerCase() === cleanUsername.toLowerCase()
        );
        if (usernameTaken || (cleanUsername.toLowerCase() === 'adminbr' && currentUser.id !== 'admin-master-br')) {
          return { success: false, message: 'Username sudah digunakan oleh akun lain. Silakan pilih username lain.' };
        }
      }

      // Check email uniqueness if changed
      if (cleanEmail && cleanEmail !== (currentUser.email || '').toLowerCase()) {
        const emailTaken = userAccounts.some(
          u => u.id !== currentUser.id && u.email?.trim().toLowerCase() === cleanEmail
        );
        if (emailTaken) {
          return { success: false, message: 'Email sudah terdaftar pada akun lain.' };
        }
      }

      const isSuperAdmin = currentUser.id === 'admin-master-br' || (currentUser.username || '').toLowerCase() === 'adminbr' || currentUser.role === 'super_admin';

      // Password verification and change
      if (profileData.newPassword) {
        if (profileData.newPassword.length < 6) {
          return { success: false, message: 'Password baru minimal harus 6 karakter!' };
        }

        if (isSuperAdmin) {
          const currentMasterPass = localStorage.getItem('tahfidz_adminbr_pass') || 'adminbr123';
          if (profileData.currentPassword !== currentMasterPass && profileData.currentPassword !== 'adminbr123') {
            return { success: false, message: 'Kata sandi lama untuk Super Admin tidak sesuai!' };
          }
          localStorage.setItem('tahfidz_adminbr_pass', profileData.newPassword);
        } else {
          const matched = userAccounts.find(u => u.id === currentUser.id || u.username === currentUser.username || u.email === currentUser.email);
          if (matched && matched.password) {
            if (profileData.currentPassword !== matched.password) {
              return { success: false, message: 'Kata sandi saat ini yang Anda masukkan salah!' };
            }
          }
        }
      }

      // Updated user object
      const updatedUser: User = {
        ...currentUser,
        name: cleanName,
        username: cleanUsername || currentUser.username,
        email: cleanEmail || currentUser.email,
        phone: cleanPhone || currentUser.phone,
        avatar: profileData.avatar || currentUser.avatar
      };

      setCurrentUser(updatedUser);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

      // 1. If role is parent, also sync to santri data
      if (currentUser.role === 'parent' && currentUser.studentId) {
        setSantriList(prev => prev.map(s => {
          if (s.id === currentUser.studentId) {
            const upd: Santri = { 
              ...s, 
              orangTuaNama: cleanName, 
              orangTuaPhone: cleanPhone || s.orangTuaPhone 
            };
            setDoc(doc(db, 'santri', s.id), cleanForFirestore(upd)).catch(err => {
              handleFirestoreError(err, OperationType.WRITE, `santri/${s.id}`);
            });
            return upd;
          }
          return s;
        }));
      }

      // 2. If role is guru, also sync to halaqah groups
      if (currentUser.role === 'guru') {
        const oldName = currentUser.name;
        setGroups(prev => prev.map(g => {
          if (g.pengajar === oldName || g.pengajar === cleanName) {
            const updGroup: Kelompok = { 
              ...g, 
              pengajar: cleanName, 
              phone: cleanPhone || g.phone 
            };
            setDoc(doc(db, 'groups', g.id), cleanForFirestore(updGroup)).catch(err => {
              handleFirestoreError(err, OperationType.WRITE, `groups/${g.id}`);
            });
            return updGroup;
          }
          return g;
        }));
      }

      // 3. Update in userAccounts collection
      const targetAccount = userAccounts.find(u => u.id === currentUser.id || u.username === currentUser.username || u.email === currentUser.email);
      const targetId = targetAccount ? targetAccount.id : currentUser.id;

      const updatedAccount: UserAccount = {
        ...(targetAccount || {}),
        id: targetId,
        name: cleanName,
        username: cleanUsername || currentUser.username,
        email: cleanEmail || currentUser.email,
        phone: cleanPhone || currentUser.phone,
        avatar: profileData.avatar || currentUser.avatar,
        role: currentUser.role,
        studentId: currentUser.studentId,
        studentName: currentUser.studentName,
        ...(profileData.newPassword 
          ? { password: profileData.newPassword } 
          : (targetAccount?.password ? { password: targetAccount.password } : (isSuperAdmin ? { password: localStorage.getItem('tahfidz_adminbr_pass') || 'adminbr123' } : {})))
      };

      setUserAccounts(prev => {
        const exists = prev.some(u => u.id === targetId);
        if (exists) {
          return prev.map(u => u.id === targetId ? updatedAccount : u);
        } else {
          return [...prev, updatedAccount];
        }
      });

      try {
        await setDoc(doc(db, 'users', targetId), cleanForFirestore(updatedAccount));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${targetId}`);
      }

      addSystemLog('Perbarui Profil', 'AUTH', `Pengguna ${cleanName} (${currentUser.role}) berhasil memperbarui informasi profil.`);

      return {
        success: true,
        message: 'Alhamdulillah, profil berhasil diperbarui!',
        user: updatedUser
      };
    } catch (err) {
      console.error('Update profile error:', err);
      return { success: false, message: 'Terjadi kesalahan sistem saat memperbarui profil.' };
    }
  };

  // Hafalan Actions
  const addHafalanRecord = (record: Omit<HafalanEntry, 'id'>) => {
    const newId = `h-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newEntry: HafalanEntry = { ...record, id: newId };

    setSantriList(prev =>
      prev.map(s => {
        if (s.id === record.studentId) {
          const updatedList = [newEntry, ...s.hafalanList];
          const juzSet = new Set(updatedList.filter(h => h.category === 'juz').map(h => h.juz));
          let totalJuz = Math.max(s.totalJuzMemorized, juzSet.size);

          const surahNumbers = Array.isArray(s.memorizedSurahNumbers) ? [...s.memorizedSurahNumbers] : [];
          const juzList = Array.isArray(s.memorizedJuzList) ? [...s.memorizedJuzList] : [];

          const beforeStats = calculateStudentSetoranGrowth(s.id, s.hafalanList, attendanceHistory);
          const afterStats = calculateStudentSetoranGrowth(s.id, updatedList, attendanceHistory);
          const pagesAdded = Math.max(0, afterStats.growthPages - beforeStats.growthPages);
          const juzAdded = Number((pagesAdded * 0.05).toFixed(2));

          if (newEntry.type === 'baru') {
            if (newEntry.surahNumber && !surahNumbers.includes(newEntry.surahNumber)) {
              surahNumbers.push(newEntry.surahNumber);
            }
            if (newEntry.category === 'juz' && !juzList.includes(newEntry.juz)) {
              juzList.push(newEntry.juz);
            }
            if (pagesAdded > 0) {
              totalJuz = Math.min(30, Number((totalJuz + juzAdded).toFixed(2)));
            }
          }

          const growthBonus = newEntry.type === 'baru' 
            ? (pagesAdded * 0.5) 
            : (newEntry.category === 'juz' ? 1.0 : newEntry.category === 'surah' ? 0.5 : 0.2);

          const newGrowth = Number(((s.weeklyGrowthJuz || 0) + growthBonus).toFixed(1));

          // In-progress juz progression
          let updatedInProgress = s.inProgressJuz;
          if (newEntry.type === 'baru') {
            const targetJuzNum = newEntry.juz || s.inProgressJuz?.juzNumber || (Math.floor(totalJuz) + 1);
            const currentTotalPages = (s.inProgressJuz?.halaman || 0) + pagesAdded;
            const currentLembar = Math.ceil(currentTotalPages / 2);
            updatedInProgress = {
              juzNumber: Math.min(30, targetJuzNum),
              lembar: currentLembar >= 10 ? currentLembar % 10 : currentLembar,
              halaman: currentTotalPages >= 20 ? currentTotalPages % 20 : currentTotalPages,
              surahNumber: newEntry.surahNumber,
              surahSedangDihafal: newEntry.surahName,
              ayatDetail: newEntry.ayatMulai ? `Ayat ${newEntry.ayatMulai}-${newEntry.ayatSelesai || ''}` : undefined
            };
          }

          const updatedStudent: Santri = {
            ...s,
            hafalanList: updatedList,
            totalJuzMemorized: totalJuz,
            weeklyGrowthJuz: newGrowth,
            memorizedSurahNumbers: surahNumbers,
            memorizedJuzList: juzList,
            inProgressJuz: updatedInProgress,
            terakhirSetor: {
              juz: newEntry.juz,
              surah: newEntry.surahName,
              ayat: newEntry.ayatMulai ? `Ayat ${newEntry.ayatMulai}-${newEntry.ayatSelesai || ''}` : 'Selesai',
              tanggal: newEntry.tanggal
            }
          };

          setDoc(doc(db, 'santri', s.id), cleanForFirestore(updatedStudent)).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `santri/${s.id}`);
          });

          return updatedStudent;
        }
        return s;
      })
    );
  };

  const updateHafalanRecord = (studentId: string, entryId: string, updated: Partial<HafalanEntry>) => {
    setSantriList(prev =>
      prev.map(s => {
        if (s.id === studentId) {
          const updatedList = s.hafalanList.map(h => (h.id === entryId ? { ...h, ...updated } : h));
          const juzSet = new Set(updatedList.filter(h => h.category === 'juz').map(h => h.juz));
          const totalJuz = Math.max(s.totalJuzMemorized, juzSet.size);
          const latestDeposit = updatedList[0];

          const updatedStudent: Santri = {
            ...s,
            hafalanList: updatedList,
            totalJuzMemorized: totalJuz,
            terakhirSetor: latestDeposit
              ? {
                  juz: latestDeposit.juz,
                  surah: latestDeposit.surahName,
                  ayat: latestDeposit.ayatMulai ? `Ayat ${latestDeposit.ayatMulai}-${latestDeposit.ayatSelesai || ''}` : 'Selesai',
                  tanggal: latestDeposit.tanggal
                }
              : s.terakhirSetor
          };

          setDoc(doc(db, 'santri', s.id), cleanForFirestore(updatedStudent)).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `santri/${s.id}`);
          });

          return updatedStudent;
        }
        return s;
      })
    );
  };

  const deleteHafalanRecord = (studentId: string, entryId: string) => {
    setSantriList(prev =>
      prev.map(s => {
        if (s.id === studentId) {
          const updatedList = s.hafalanList.filter(h => h.id !== entryId);
          const juzCount = new Set(updatedList.filter(h => h.category === 'juz').map(h => h.juz)).size;
          const latestDeposit = updatedList[0];

          const updatedStudent: Santri = {
            ...s,
            hafalanList: updatedList,
            totalJuzMemorized: juzCount,
            terakhirSetor: latestDeposit
              ? {
                  juz: latestDeposit.juz,
                  surah: latestDeposit.surahName,
                  ayat: latestDeposit.ayatMulai ? `Ayat ${latestDeposit.ayatMulai}-${latestDeposit.ayatSelesai || ''}` : 'Selesai',
                  tanggal: latestDeposit.tanggal
                }
              : undefined
          };

          setDoc(doc(db, 'santri', s.id), cleanForFirestore(updatedStudent)).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `santri/${s.id}`);
          });

          return updatedStudent;
        }
        return s;
      })
    );
  };

  // Attendance Actions
  const saveBulkAttendance = (
    records: {
      tanggal: string;
      sessionKey: string;
      sessionName: string;
      studentId: string;
      studentName: string;
      kelompokId: string;
      status: AttendanceRecord['status'];
      keterangan?: string;
      catatanPerilaku?: string;
      hafalan?: Omit<HafalanEntry, 'id' | 'studentId' | 'studentName' | 'tanggal' | 'ustadzName'>;
    }[]
  ) => {
    const timestamp = new Date().toISOString();
    const newAttendanceRecords: AttendanceRecord[] = [];
    const newHafalanDeposits: HafalanEntry[] = [];

    records.forEach((record, idx) => {
      let hafalanDeposit: HafalanEntry | undefined;
      if (record.hafalan && record.status !== 'tidak_hadir') {
        const hafalanId = `h-dep-${Date.now()}-${idx}-${record.studentId}`;
        hafalanDeposit = {
          ...record.hafalan,
          id: hafalanId,
          studentId: record.studentId,
          studentName: record.studentName,
          tanggal: record.tanggal,
          ustadzName: currentUser?.name || 'Ustadz'
        };
        newHafalanDeposits.push(hafalanDeposit);
      }

      const attendanceId = `att-${Date.now()}-${idx}-${record.studentId}`;
      const attRecord: AttendanceRecord = {
        id: attendanceId,
        tanggal: record.tanggal,
        sessionKey: record.sessionKey,
        sessionName: record.sessionName,
        studentId: record.studentId,
        studentName: record.studentName,
        kelompokId: record.kelompokId,
        status: record.status,
        keterangan: record.keterangan || '',
        catatanPerilaku: record.catatanPerilaku || '',
        ...(hafalanDeposit ? { hafalanDeposit } : {}),
        timestamp
      };

      newAttendanceRecords.push(attRecord);

      setDoc(doc(db, 'attendance', attRecord.id), cleanForFirestore(attRecord)).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `attendance/${attRecord.id}`);
      });
    });

    setAttendanceHistory(prev => [...newAttendanceRecords, ...prev]);

    if (newHafalanDeposits.length > 0 || records.length > 0) {
      const studentIdsInRecords = new Set(records.map(r => r.studentId));

      setSantriList(prev =>
        prev.map(s => {
          if (!studentIdsInRecords.has(s.id)) return s;

          const studentNewDeposits = newHafalanDeposits.filter(h => h.studentId === s.id);
          const updatedList = [...studentNewDeposits, ...s.hafalanList];
          const latestDeposit = studentNewDeposits[0];

          const juzSet = new Set(updatedList.filter(h => h.category === 'juz').map(h => h.juz));
          let totalJuz = Math.max(s.totalJuzMemorized, juzSet.size);

          const surahNumbers = Array.isArray(s.memorizedSurahNumbers) ? [...s.memorizedSurahNumbers] : [];
          const juzList = Array.isArray(s.memorizedJuzList) ? [...s.memorizedJuzList] : [];

          studentNewDeposits.forEach(deposit => {
            if (deposit.type === 'baru') {
              if (deposit.surahNumber && !surahNumbers.includes(deposit.surahNumber)) {
                surahNumbers.push(deposit.surahNumber);
              }
              if (deposit.category === 'juz' && !juzList.includes(deposit.juz)) {
                juzList.push(deposit.juz);
              }
              const lembarAdded = typeof deposit.lembar === 'number' && deposit.lembar > 0 ? deposit.lembar : 1;
              const juzAdded = Number((lembarAdded * 0.1).toFixed(1));
              totalJuz = Math.min(30, Number((totalJuz + juzAdded).toFixed(1)));
            }
          });

          // Calculate real-time attendance percentage
          const studentAllAttendance = attendanceHistory.filter(a => a.studentId === s.id);
          const combined = [
            ...newAttendanceRecords.filter(a => a.studentId === s.id),
            ...studentAllAttendance
          ];
          const presentCount = combined.filter(a => a.status === 'hadir_tepat').length;
          const lateCount = combined.filter(a => a.status === 'hadir_terlambat').length;
          const totalSessions = combined.length;
          const newAttendancePct =
            totalSessions > 0
              ? Math.min(100, Math.max(0, Math.round(((presentCount * 1.0 + lateCount * 0.8) / totalSessions) * 100)))
              : s.kehadiranPersen || 100;

          const growthBonus = latestDeposit
            ? (latestDeposit.type === 'baru' 
                ? Number(((latestDeposit.lembar || 1) * 0.1).toFixed(1)) 
                : (latestDeposit.category === 'juz' ? 1.0 : latestDeposit.category === 'surah' ? 0.5 : 0.2))
            : 0;

          // In-progress juz progression
          let updatedInProgress = s.inProgressJuz;
          if (latestDeposit && latestDeposit.type === 'baru') {
            const lembarAdded = latestDeposit.lembar || 1;
            const currentLembar = s.inProgressJuz?.lembar || 0;
            const nextLembar = currentLembar + lembarAdded;
            const targetJuzNum = latestDeposit.juz || s.inProgressJuz?.juzNumber || (Math.floor(totalJuz) + 1);
            updatedInProgress = {
              juzNumber: Math.min(30, targetJuzNum),
              lembar: nextLembar >= 10 ? nextLembar % 10 : nextLembar,
              halaman: (nextLembar >= 10 ? nextLembar % 10 : nextLembar) * 2,
              surahNumber: latestDeposit.surahNumber,
              surahSedangDihafal: latestDeposit.surahName,
              ayatDetail: latestDeposit.ayatMulai ? `Ayat ${latestDeposit.ayatMulai}-${latestDeposit.ayatSelesai || ''}` : undefined
            };
          }

          const updatedStudent: Santri = {
            ...s,
            kehadiranPersen: newAttendancePct,
            weeklyGrowthJuz: Number(((s.weeklyGrowthJuz || 0) + growthBonus).toFixed(1)),
            hafalanList: updatedList,
            totalJuzMemorized: totalJuz,
            inProgressJuz: updatedInProgress,
            memorizedSurahNumbers: surahNumbers.length > 0 ? surahNumbers : s.memorizedSurahNumbers,
            memorizedJuzList: juzList.length > 0 ? juzList : s.memorizedJuzList,
            terakhirSetor: latestDeposit
              ? {
                  juz: latestDeposit.juz,
                  surah: latestDeposit.surahName,
                  ayat: latestDeposit.ayatMulai ? `Ayat ${latestDeposit.ayatMulai}-${latestDeposit.ayatSelesai || ''}` : 'Selesai',
                  tanggal: latestDeposit.tanggal
                }
              : s.terakhirSetor
          };

          setDoc(doc(db, 'santri', s.id), cleanForFirestore(updatedStudent)).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `santri/${s.id}`);
          });

          return updatedStudent;
        })
      );
    }
  };

  const saveAttendanceSetoran = (
    attendanceId: string,
    hafalan: Omit<HafalanEntry, 'id' | 'studentId' | 'studentName' | 'ustadzName'> & { 
      tanggal?: string;
      lembar?: number;
      halaman?: number;
    },
    catatanPerilaku?: string
  ) => {
    const existing = attendanceHistory.find(a => a.id === attendanceId);
    if (!existing) return;

    const depositId = existing.hafalanDeposit?.id || `h-dep-${Date.now()}-${existing.studentId}`;
    const newDeposit: HafalanEntry = {
      ...hafalan,
      id: depositId,
      studentId: existing.studentId,
      studentName: existing.studentName,
      tanggal: existing.tanggal,
      ustadzName: currentUser?.name || 'Ustadz'
    };

    const updatedRecord: AttendanceRecord = {
      ...existing,
      hafalanDeposit: newDeposit,
      ...(catatanPerilaku !== undefined ? { catatanPerilaku } : {})
    };

    setAttendanceHistory(prev => prev.map(a => (a.id === attendanceId ? updatedRecord : a)));

    setDoc(doc(db, 'attendance', attendanceId), cleanForFirestore(updatedRecord)).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `attendance/${attendanceId}`);
    });

    setSantriList(prev =>
      prev.map(s => {
        if (s.id !== existing.studentId) return s;

        const oldDepositId = existing.hafalanDeposit?.id;
        const filteredList = s.hafalanList.filter(h => h.id !== depositId && h.id !== oldDepositId);
        const updatedList = [newDeposit, ...filteredList];

        const juzSet = new Set(updatedList.filter(h => h.category === 'juz').map(h => h.juz));
        let totalJuz = Math.max(s.totalJuzMemorized, juzSet.size);

        const surahNumbers = Array.isArray(s.memorizedSurahNumbers) ? [...s.memorizedSurahNumbers] : [];
        const juzList = Array.isArray(s.memorizedJuzList) ? [...s.memorizedJuzList] : [];

        const beforeStats = calculateStudentSetoranGrowth(s.id, s.hafalanList, attendanceHistory);
        const afterStats = calculateStudentSetoranGrowth(
          s.id, 
          updatedList, 
          attendanceHistory.map(a => a.id === attendanceId ? updatedRecord : a)
        );
        
        // Progres naik HANYA jika santri telah menyelesaikan 1 halaman penuh (growthPages bertambah)
        const pagesAdded = Math.max(0, afterStats.growthPages - beforeStats.growthPages);
        const juzAdded = Number((pagesAdded * 0.05).toFixed(2));

        if (newDeposit.type === 'baru') {
          if (newDeposit.surahNumber && !surahNumbers.includes(newDeposit.surahNumber)) {
            surahNumbers.push(newDeposit.surahNumber);
          }
          if (newDeposit.category === 'juz' && !juzList.includes(newDeposit.juz)) {
            juzList.push(newDeposit.juz);
          }
          // Progress total bertambah jika genap 1 halaman full atau lebih
          if (pagesAdded > 0) {
            totalJuz = Math.min(30, Number((totalJuz + juzAdded).toFixed(2)));
          }
        }

        const growthBonus = newDeposit.type === 'baru' 
          ? juzAdded 
          : (newDeposit.category === 'juz' ? 1.0 : newDeposit.category === 'surah' ? 0.5 : 0.2);

        // In-progress juz progression
        let updatedInProgress = s.inProgressJuz;
        if (newDeposit.type === 'baru') {
          const targetJuzNum = newDeposit.juz || s.inProgressJuz?.juzNumber || (Math.floor(totalJuz) + 1);
          const currentTotalPages = (s.inProgressJuz?.halaman || 0) + pagesAdded;
          const currentLembar = Math.ceil(currentTotalPages / 2);
          updatedInProgress = {
            juzNumber: Math.min(30, targetJuzNum),
            lembar: currentLembar >= 10 ? currentLembar % 10 : currentLembar,
            halaman: currentTotalPages >= 20 ? currentTotalPages % 20 : currentTotalPages,
            surahNumber: newDeposit.surahNumber,
            surahSedangDihafal: newDeposit.surahName,
            ayatDetail: newDeposit.ayatMulai ? `Ayat ${newDeposit.ayatMulai}-${newDeposit.ayatSelesai || ''}` : undefined
          };
        }

        const updatedStudent: Santri = {
          ...s,
          hafalanList: updatedList,
          totalJuzMemorized: totalJuz,
          inProgressJuz: updatedInProgress,
          weeklyGrowthJuz: Number(((s.weeklyGrowthJuz || 0) + growthBonus).toFixed(1)),
          memorizedSurahNumbers: surahNumbers.length > 0 ? surahNumbers : s.memorizedSurahNumbers,
          memorizedJuzList: juzList.length > 0 ? juzList : s.memorizedJuzList,
          terakhirSetor: {
            juz: newDeposit.juz,
            surah: newDeposit.surahName,
            ayat: newDeposit.ayatMulai ? `Ayat ${newDeposit.ayatMulai}-${newDeposit.ayatSelesai || ''}` : 'Selesai',
            tanggal: newDeposit.tanggal
          }
        };

        setDoc(doc(db, 'santri', s.id), cleanForFirestore(updatedStudent)).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `santri/${s.id}`);
        });

        return updatedStudent;
      })
    );
  };

  const updateAttendancePerilaku = (attendanceId: string, catatanPerilaku: string) => {
    setAttendanceHistory(prev =>
      prev.map(record => {
        if (record.id === attendanceId) {
          const updated = { ...record, catatanPerilaku };
          setDoc(doc(db, 'attendance', attendanceId), cleanForFirestore(updated)).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `attendance/${attendanceId}`);
          });
          return updated;
        }
        return record;
      })
    );
  };

  const updateAttendanceRecord = (
    attendanceId: string,
    updatedFields: Partial<Pick<AttendanceRecord, 'status' | 'keterangan' | 'tanggal' | 'sessionKey' | 'sessionName' | 'catatanPerilaku'>>
  ) => {
    const existing = attendanceHistory.find(r => r.id === attendanceId);
    if (!existing) return;

    const updatedRecord: AttendanceRecord = {
      ...existing,
      ...updatedFields
    };

    const nextHistory = attendanceHistory.map(r => (r.id === attendanceId ? updatedRecord : r));
    setAttendanceHistory(nextHistory);

    setDoc(doc(db, 'attendance', attendanceId), cleanForFirestore(updatedRecord)).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `attendance/${attendanceId}`);
    });

    // Recalculate student attendance percentage if status changed
    if (updatedFields.status && updatedFields.status !== existing.status) {
      setSantriList(prev =>
        prev.map(s => {
          if (s.id !== existing.studentId) return s;
          const studentAllAttendance = nextHistory.filter(a => a.studentId === s.id);
          const presentCount = studentAllAttendance.filter(a => a.status === 'hadir_tepat').length;
          const lateCount = studentAllAttendance.filter(a => a.status === 'hadir_terlambat').length;
          const totalSessions = studentAllAttendance.length;
          const newAttendancePct =
            totalSessions > 0
              ? Math.min(100, Math.max(0, Math.round(((presentCount * 1.0 + lateCount * 0.8) / totalSessions) * 100)))
              : s.kehadiranPersen || 100;

          const updatedStudent: Santri = {
            ...s,
            kehadiranPersen: newAttendancePct
          };

          setDoc(doc(db, 'santri', s.id), cleanForFirestore(updatedStudent)).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `santri/${s.id}`);
          });

          return updatedStudent;
        })
      );
    }
  };

  const deleteAttendanceRecord = (attendanceId: string) => {
    setAttendanceHistory(prev => prev.filter(r => r.id !== attendanceId));
    deleteDoc(doc(db, 'attendance', attendanceId)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `attendance/${attendanceId}`);
    });
  };

  // Tasmi Actions
  const scheduleTasmi = (
    studentId: string,
    tanggal: string,
    waktu: string,
    penguji?: string,
    targetText?: string,
    videoUrl?: string
  ) => {
    const student = santriList.find(s => s.id === studentId);
    if (!student) return;

    const newTasmi: TasmiRecord = {
      id: `tasmi-${Date.now()}`,
      studentId,
      studentName: student.nama,
      kelompokNama: student.kelompokNama,
      gender: student.gender,
      targetJuzText: targetText || `Juz ${student.totalJuzMemorized + 1}`,
      tanggal,
      waktu,
      penguji: penguji || '',
      status: 'terjadwal',
      ...(videoUrl ? { videoUrl: videoUrl.trim() } : {})
    };

    setTasmiList(prev => [newTasmi, ...prev]);

    setDoc(doc(db, 'tasmi', newTasmi.id), cleanForFirestore(newTasmi)).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `tasmi/${newTasmi.id}`);
    });
  };

  const updateTasmiSchedule = (
    id: string,
    tanggal: string,
    waktu: string,
    penguji?: string,
    targetText?: string,
    videoUrl?: string
  ) => {
    setTasmiList(prev =>
      prev.map(t => {
        if (t.id === id) {
          const updated: TasmiRecord = {
            ...t,
            tanggal,
            waktu,
            ...(penguji !== undefined ? { penguji } : {}),
            ...(targetText ? { targetJuzText: targetText } : {}),
            ...(videoUrl !== undefined ? { videoUrl: videoUrl.trim() } : {})
          };

          setDoc(doc(db, 'tasmi', id), cleanForFirestore(updated)).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `tasmi/${id}`);
          });

          return updated;
        }
        return t;
      })
    );
  };

  const updateTasmiResult = (
    id: string, 
    nilai: TasmiRecord['nilai'], 
    catatan: string, 
    videoUrl?: string
  ) => {
    setTasmiList(prev =>
      prev.map(t => {
        if (t.id === id) {
          const updated: TasmiRecord = {
            ...t,
            status: 'selesai',
            nilai,
            catatan: catatan || '',
            ...(videoUrl !== undefined ? { videoUrl: videoUrl.trim() } : {})
          };

          setDoc(doc(db, 'tasmi', id), cleanForFirestore(updated)).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `tasmi/${id}`);
          });

          return updated;
        }
        return t;
      })
    );
  };

  const cancelTasmi = (id: string) => {
    setTasmiList(prev =>
      prev.map(t => {
        if (t.id === id) {
          const updated: TasmiRecord = { ...t, status: 'belum' };
          setDoc(doc(db, 'tasmi', id), cleanForFirestore(updated)).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `tasmi/${id}`);
          });
          return updated;
        }
        return t;
      })
    );
  };

  const deleteTasmi = (id: string) => {
    setTasmiList(prev => prev.filter(t => t.id !== id));
    deleteDoc(doc(db, 'tasmi', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `tasmi/${id}`);
    });
  };

  // Master Data Actions
  const addSantri = (data: {
    nama: string;
    gender: 'santriwan' | 'santriwati';
    kelasId: string;
    kelompokId: string;
    targetJuz: number;
    orangTuaNama?: string;
    orangTuaPhone?: string;
  }) => {
    const cls = classes.find(c => c.id === data.kelasId);
    const grp = groups.find(g => g.id === data.kelompokId);

    const newSantri: Santri = {
      id: `santri-${Date.now()}`,
      nama: data.nama,
      gender: data.gender,
      kelasId: data.kelasId,
      kelasNama: cls?.nama || 'Kelas Baru',
      kelompokId: data.kelompokId,
      kelompokNama: grp?.nama || 'Kelompok Baru',
      targetJuz: data.targetJuz,
      totalJuzMemorized: 0,
      kehadiranPersen: 100,
      weeklyGrowthJuz: 0,
      orangTuaNama: data.orangTuaNama || '',
      orangTuaPhone: data.orangTuaPhone || '',
      hafalanList: []
    };

    setSantriList(prev => [newSantri, ...prev]);

    setDoc(doc(db, 'santri', newSantri.id), cleanForFirestore(newSantri)).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `santri/${newSantri.id}`);
    });
  };

  const updateSantri = (id: string, data: Partial<Santri>) => {
    setSantriList(prev =>
      prev.map(s => {
        if (s.id === id) {
          const updated = { ...s, ...data };
          setDoc(doc(db, 'santri', id), cleanForFirestore(updated)).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `santri/${id}`);
          });
          return updated;
        }
        return s;
      })
    );
  };

  const deleteSantri = (id: string) => {
    setSantriList(prev => prev.filter(s => s.id !== id));
    deleteDoc(doc(db, 'santri', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `santri/${id}`);
    });
  };

  const addKelas = (nama: string, tingkat: Kelas['tingkat'], waliKelas?: string) => {
    const newClass: Kelas = {
      id: `cls-${Date.now()}`,
      nama,
      tingkat: normalizeTingkat(tingkat),
      waliKelas: waliKelas || ''
    };

    setClasses(prev => [...prev, newClass]);

    setDoc(doc(db, 'classes', newClass.id), cleanForFirestore(newClass)).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `classes/${newClass.id}`);
    });
  };

  const updateKelas = (id: string, nama: string, tingkat: Kelas['tingkat'], waliKelas?: string) => {
    setClasses(prev =>
      prev.map(c => {
        if (c.id === id) {
          const updated: Kelas = {
            ...c,
            nama,
            tingkat: normalizeTingkat(tingkat),
            waliKelas: waliKelas !== undefined ? waliKelas : c.waliKelas
          };
          setDoc(doc(db, 'classes', id), cleanForFirestore(updated)).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `classes/${id}`);
          });
          return updated;
        }
        return c;
      })
    );
  };

  const deleteKelas = (id: string) => {
    setClasses(prev => prev.filter(c => c.id !== id));
    deleteDoc(doc(db, 'classes', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `classes/${id}`);
    });
  };

  const addKelompok = (nama: string, pengajar: string, phone?: string) => {
    const newGroup: Kelompok = {
      id: `grp-${Date.now()}`,
      nama,
      pengajar,
      phone: phone || ''
    };

    setGroups(prev => [...prev, newGroup]);

    setDoc(doc(db, 'groups', newGroup.id), cleanForFirestore(newGroup)).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `groups/${newGroup.id}`);
    });
  };

  const updateKelompok = (id: string, nama: string, pengajar: string, phone?: string) => {
    setGroups(prev =>
      prev.map(g => {
        if (g.id === id) {
          const updated: Kelompok = {
            ...g,
            nama,
            pengajar,
            phone: phone !== undefined ? phone : g.phone || ''
          };
          setDoc(doc(db, 'groups', id), cleanForFirestore(updated)).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `groups/${id}`);
          });
          return updated;
        }
        return g;
      })
    );
  };

  const deleteKelompok = (id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
    deleteDoc(doc(db, 'groups', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `groups/${id}`);
    });
  };

  const addTarget = (nama: string, jumlahJuz: number) => {
    const newTarget: TargetHafalan = {
      id: `tgt-${Date.now()}`,
      nama,
      jumlahJuz
    };

    setTargets(prev => [...prev, newTarget]);

    setDoc(doc(db, 'targets', newTarget.id), cleanForFirestore(newTarget)).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `targets/${newTarget.id}`);
    });
  };

  const updateTarget = (id: string, nama: string, jumlahJuz: number) => {
    setTargets(prev =>
      prev.map(t => {
        if (t.id === id) {
          const updated: TargetHafalan = { ...t, nama, jumlahJuz };
          setDoc(doc(db, 'targets', id), cleanForFirestore(updated)).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `targets/${id}`);
          });
          return updated;
        }
        return t;
      })
    );
  };

  const deleteTarget = (id: string) => {
    setTargets(prev => prev.filter(t => t.id !== id));
    deleteDoc(doc(db, 'targets', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `targets/${id}`);
    });
  };

  const addSesi = (nama: string, jamMulai: string, jamSelesai: string) => {
    const newSesi: SesiTahfidz = {
      id: `ses-${Date.now()}`,
      key: `sesi_${Date.now()}`,
      nama,
      jamMulai,
      jamSelesai,
      status: 'Aktif'
    };

    setSessions(prev => [...prev, newSesi]);

    setDoc(doc(db, 'sessions', newSesi.id), cleanForFirestore(newSesi)).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `sessions/${newSesi.id}`);
    });
  };

  const updateSesi = (id: string, data: Partial<SesiTahfidz>) => {
    setSessions(prev =>
      prev.map(s => {
        if (s.id === id) {
          const updated: SesiTahfidz = { ...s, ...data };
          setDoc(doc(db, 'sessions', id), cleanForFirestore(updated)).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `sessions/${id}`);
          });
          return updated;
        }
        return s;
      })
    );
  };

  const deleteSesi = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    deleteDoc(doc(db, 'sessions', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `sessions/${id}`);
    });
  };

  // Reset & Backup Actions
  /**
   * Completely clears all data including dummy/sample/fake data from local and Firestore.
   * Ensures that fake data will never be automatically re-seeded upon page refresh.
   */
  const resetAllDataToEmpty = async () => {
    setCloudSyncStatus('syncing');
    hasLoadedRef.current = true;

    // 1. Mark in localStorage that data is explicitly cleared
    localStorage.setItem(STORAGE_KEYS.CLEARED, 'true');

    // 2. Clear all local state
    setSantriList([]);
    setClasses([]);
    setGroups([]);
    setTargets([]);
    setSessions([]);
    setTasmiList([]);
    setAttendanceHistory([]);

    // 3. Clear all cached storage keys
    localStorage.setItem(STORAGE_KEYS.SANTRI, '[]');
    localStorage.setItem(STORAGE_KEYS.CLASSES, '[]');
    localStorage.setItem(STORAGE_KEYS.GROUPS, '[]');
    localStorage.setItem(STORAGE_KEYS.TARGETS, '[]');
    localStorage.setItem(STORAGE_KEYS.SESSIONS, '[]');
    localStorage.setItem(STORAGE_KEYS.TASMI, '[]');
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, '[]');

    // 4. Batch delete all documents from Firestore collections
    const collectionsToClear = [
      'santri',
      'attendance',
      'tasmi',
      'classes',
      'groups',
      'sessions',
      'targets'
    ];

    for (const collName of collectionsToClear) {
      try {
        const snap = await getDocs(collection(db, collName));
        if (!snap.empty) {
          let batch = writeBatch(db);
          let count = 0;
          for (const docSnap of snap.docs) {
            batch.delete(doc(db, collName, docSnap.id));
            count++;
            if (count >= 400) {
              await batch.commit();
              batch = writeBatch(db);
              count = 0;
            }
          }
          if (count > 0) {
            await batch.commit();
          }
        }
      } catch (err) {
        console.warn(`Failed clearing collection ${collName}:`, err);
      }
    }

    // 5. Store a tombstone in Firestore so any other client also knows data was cleared
    try {
      await setDoc(doc(db, 'system', 'config'), {
        dataCleared: true,
        clearedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Could not record system clear status:', err);
    }

    setCloudSyncStatus('synced');
  };

  const resetToDefaultData = () => {
    resetAllDataToEmpty();
  };

  /**
   * Explicitly populates demo simulation data (10 santri, classes, halaqah, etc.)
   */
  const populateDemoData = async () => {
    setCloudSyncStatus('syncing');
    hasLoadedRef.current = true;
    localStorage.removeItem(STORAGE_KEYS.CLEARED);

    setSantriList(INITIAL_SANTRI);
    setClasses(INITIAL_CLASSES);
    setGroups(INITIAL_GROUPS);
    setTargets(INITIAL_TARGETS);
    setSessions(INITIAL_SESSIONS);
    setTasmiList(INITIAL_TASMI);
    setAttendanceHistory(INITIAL_ATTENDANCE);

    try {
      const batch = writeBatch(db);
      INITIAL_SANTRI.forEach(s => batch.set(doc(db, 'santri', s.id), cleanForFirestore(s)));
      INITIAL_CLASSES.forEach(c => batch.set(doc(db, 'classes', c.id), cleanForFirestore(c)));
      INITIAL_GROUPS.forEach(g => batch.set(doc(db, 'groups', g.id), cleanForFirestore(g)));
      INITIAL_TARGETS.forEach(t => batch.set(doc(db, 'targets', t.id), cleanForFirestore(t)));
      INITIAL_SESSIONS.forEach(sess => batch.set(doc(db, 'sessions', sess.id), cleanForFirestore(sess)));
      INITIAL_TASMI.forEach(tsm => batch.set(doc(db, 'tasmi', tsm.id), cleanForFirestore(tsm)));
      INITIAL_ATTENDANCE.slice(0, 15).forEach(att => batch.set(doc(db, 'attendance', att.id), cleanForFirestore(att)));
      await batch.commit();

      // Clear the tombstone
      await setDoc(doc(db, 'system', 'config'), {
        dataCleared: false,
        demoLoadedAt: new Date().toISOString()
      });

      setCloudSyncStatus('synced');
    } catch (err) {
      console.warn('Error seeding demo data:', err);
    }
  };

  const exportDataJson = () => {
    const backupData = {
      santriList,
      classes,
      groups,
      targets,
      sessions,
      tasmiList,
      attendanceHistory,
      version: '2.0',
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tahfidz_data_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importDataJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);

      if (parsed.santriList && Array.isArray(parsed.santriList)) {
        setSantriList(parsed.santriList);
        parsed.santriList.forEach((s: Santri) => {
          setDoc(doc(db, 'santri', s.id), cleanForFirestore(s)).catch(console.error);
        });
      }

      if (parsed.classes && Array.isArray(parsed.classes)) {
        setClasses(parsed.classes);
        parsed.classes.forEach((c: Kelas) => {
          setDoc(doc(db, 'classes', c.id), cleanForFirestore(c)).catch(console.error);
        });
      }

      if (parsed.groups && Array.isArray(parsed.groups)) {
        setGroups(parsed.groups);
        parsed.groups.forEach((g: Kelompok) => {
          setDoc(doc(db, 'groups', g.id), cleanForFirestore(g)).catch(console.error);
        });
      }

      if (parsed.targets && Array.isArray(parsed.targets)) {
        setTargets(parsed.targets);
        parsed.targets.forEach((t: TargetHafalan) => {
          setDoc(doc(db, 'targets', t.id), cleanForFirestore(t)).catch(console.error);
        });
      }

      if (parsed.sessions && Array.isArray(parsed.sessions)) {
        setSessions(parsed.sessions);
        parsed.sessions.forEach((s: SesiTahfidz) => {
          setDoc(doc(db, 'sessions', s.id), cleanForFirestore(s)).catch(console.error);
        });
      }

      if (parsed.tasmiList && Array.isArray(parsed.tasmiList)) {
        setTasmiList(parsed.tasmiList);
        parsed.tasmiList.forEach((t: TasmiRecord) => {
          setDoc(doc(db, 'tasmi', t.id), cleanForFirestore(t)).catch(console.error);
        });
      }

      if (parsed.attendanceHistory && Array.isArray(parsed.attendanceHistory)) {
        setAttendanceHistory(parsed.attendanceHistory);
        parsed.attendanceHistory.forEach((a: AttendanceRecord) => {
          setDoc(doc(db, 'attendance', a.id), cleanForFirestore(a)).catch(console.error);
        });
      }

      if (parsed.systemSettings) {
        setSystemSettings(prev => ({ ...prev, ...parsed.systemSettings }));
        setDoc(doc(db, 'system_settings', 'main'), cleanForFirestore(parsed.systemSettings)).catch(console.error);
      }

      addSystemLog('Restore Database', 'SYSTEM', 'Database berhasil dipulihkan dari file cadangan JSON');
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  };

  const addSystemLog = (action: string, category: SystemLogEntry['category'], details: string) => {
    const newEntry: SystemLogEntry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      user: currentUser?.name || 'Sistem',
      action,
      category,
      details
    };
    setSystemLogs(prev => {
      const updated = [newEntry, ...prev.slice(0, 99)];
      try {
        localStorage.setItem(STORAGE_KEYS.SYSTEM_LOGS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const clearSystemLogs = () => {
    setSystemLogs([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.SYSTEM_LOGS);
    } catch (e) {
      console.error(e);
    }
  };

  const updateSystemSettings = async (newSettings: Partial<SystemSettings>) => {
    const merged: SystemSettings = { ...systemSettings, ...newSettings };
    setSystemSettings(merged);
    try {
      localStorage.setItem(STORAGE_KEYS.SYSTEM_SETTINGS, JSON.stringify(merged));
      await setDoc(doc(db, 'system_settings', 'main'), cleanForFirestore(merged));
    } catch (err) {
      console.warn('System settings sync error:', err);
    }
    addSystemLog('Perbarui Konfigurasi Sistem', 'SYSTEM', `Pengaturan sistem diubah oleh ${currentUser?.name || 'Super Admin'}`);
  };

  const impersonateUser = (targetUser: User) => {
    if (!originalSuperAdminUser && currentUser?.role === 'super_admin') {
      setOriginalSuperAdminUser(currentUser);
      localStorage.setItem(STORAGE_KEYS.ORIGINAL_ADMIN, JSON.stringify(currentUser));
    }
    setCurrentUser(targetUser);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(targetUser));
    addSystemLog('Simulasi Tampilan Peran', 'AUTH', `Super Admin menguji tampilan sebagai ${targetUser.name} (${targetUser.role})`);
  };

  const stopImpersonation = () => {
    if (originalSuperAdminUser) {
      setCurrentUser(originalSuperAdminUser);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(originalSuperAdminUser));
      setOriginalSuperAdminUser(null);
      localStorage.removeItem(STORAGE_KEYS.ORIGINAL_ADMIN);
      addSystemLog('Kembali ke Super Admin', 'AUTH', 'Mengakhiri mode simulasi, kembali ke kendali penuh Super Admin');
    }
  };

  const deleteAnyRecord = async (collectionName: string, id: string): Promise<boolean> => {
    try {
      if (collectionName === 'santri') deleteSantri(id);
      else if (collectionName === 'attendance') deleteAttendanceRecord(id);
      else if (collectionName === 'tasmi') deleteTasmi(id);
      else if (collectionName === 'classes') deleteKelas(id);
      else if (collectionName === 'groups') deleteKelompok(id);
      else if (collectionName === 'targets') deleteTarget(id);
      else if (collectionName === 'sessions') deleteSesi(id);
      else if (collectionName === 'users') await deleteUserAccount(id);
      else {
        await deleteDoc(doc(db, collectionName, id));
      }
      addSystemLog(`Hapus Dokumen [${collectionName}]`, 'DATA', `ID Dokumen ${id} dihapus dari koleksi ${collectionName}`);
      return true;
    } catch (err) {
      console.error('Delete any record failed:', err);
      return false;
    }
  };

  return (
    <TahfidzContext.Provider
      value={{
        currentUser,
        activeTab,
        setActiveTab,
        darkMode,
        setDarkMode,
        toggleDarkMode,
        login,
        logout,
        switchRole,
        registerUserAccount,
        loginUserAccount,
        switchParentActiveChild,
        parentChildren,
        santriList,
        classes,
        groups,
        targets,
        sessions,
        tasmiList,
        attendanceHistory,
        userAccounts,
        updateUserProfile,
        resetUserPassword,
        deleteUserAccount,
        isCloudSynced,
        cloudSyncStatus,
        addHafalanRecord,
        updateHafalanRecord,
        deleteHafalanRecord,
        saveBulkAttendance,
        saveAttendanceSetoran,
        updateAttendancePerilaku,
        updateAttendanceRecord,
        deleteAttendanceRecord,
        scheduleTasmi,
        updateTasmiSchedule,
        updateTasmiResult,
        cancelTasmi,
        deleteTasmi,
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
        importDataJson,
        systemSettings,
        updateSystemSettings,
        systemLogs,
        addSystemLog,
        clearSystemLogs,
        originalSuperAdminUser,
        impersonateUser,
        stopImpersonation,
        deleteAnyRecord
      }}
    >
      {children}
    </TahfidzContext.Provider>
  );
};

export const useTahfidz = (): TahfidzContextType => {
  const context = useContext(TahfidzContext);
  if (!context) {
    throw new Error('useTahfidz must be used within a TahfidzProvider');
  }
  return context;
};
