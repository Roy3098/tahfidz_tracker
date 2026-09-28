import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  HafalanEntry
} from '../types';
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
    catatan: 'Mumtaz, tajwid sempurna dan irama sangat khusyuk.'
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
  CLEARED: 'tahfidz_cleared_data_v1'
};

export interface TahfidzContextType {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  login: (user: User) => void;
  logout: () => void;
  switchRole: (role: UserRole, studentId?: string) => void;
  registerUserAccount: (account: Omit<UserAccount, 'id' | 'createdAt'>) => Promise<{ success: boolean; message: string; user?: User }>;
  loginUserAccount: (identifier: string, password?: string, role?: UserRole, studentId?: string) => Promise<{ success: boolean; message: string; user?: User }>;
  santriList: Santri[];
  classes: Kelas[];
  groups: Kelompok[];
  targets: TargetHafalan[];
  sessions: SesiTahfidz[];
  tasmiList: TasmiRecord[];
  attendanceHistory: AttendanceRecord[];
  userAccounts: UserAccount[];
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
    hafalan?: Omit<HafalanEntry, 'id' | 'studentId' | 'studentName' | 'tanggal' | 'ustadzName'>;
  }[]) => void;
  saveAttendanceSetoran: (attendanceId: string, hafalan: Omit<HafalanEntry, 'id' | 'studentId' | 'studentName' | 'ustadzName'> & { tanggal?: string }, catatanPerilaku?: string) => void;
  updateAttendancePerilaku: (attendanceId: string, catatanPerilaku: string) => void;
  deleteAttendanceRecord: (attendanceId: string) => void;
  
  // Tasmi Actions
  scheduleTasmi: (studentId: string, tanggal: string, waktu: string, penguji?: string, targetText?: string) => void;
  updateTasmiSchedule: (id: string, tanggal: string, waktu: string, penguji?: string, targetText?: string) => void;
  updateTasmiResult: (id: string, nilai: TasmiRecord['nilai'], catatan: string) => void;
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

  addKelompok: (nama: string, pengajar: string) => void;
  updateKelompok: (id: string, nama: string, pengajar: string) => void;
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

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('syncing');
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

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

    return () => {
      unsubSantri();
      unsubAttendance();
      unsubTasmi();
      unsubClasses();
      unsubGroups();
      unsubSessions();
      unsubTargets();
      unsubUsers();
    };
  }, []);

  // Auth Functions
  const login = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const logout = () => {
    setCurrentUser(null);
  };

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
    } else {
      setCurrentUser({
        id: 'admin-1',
        name: 'Ustadz Ahmad',
        username: 'AsatidzBr',
        email: 'ahmad@tahfidz.sch.id',
        role: 'admin'
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

      setUserAccounts(prev => [...prev, newAccount]);

      try {
        await setDoc(doc(db, 'users', newId), cleanForFirestore(newAccount));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${newId}`);
      }

      const safeUser: User = {
        id: newAccount.id,
        name: newAccount.name,
        username: newAccount.username,
        email: newAccount.email,
        role: newAccount.role,
        studentId: newAccount.studentId,
        studentName: newAccount.studentName
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

  const loginUserAccount = async (
    identifier: string,
    password?: string,
    role?: UserRole,
    studentId?: string
  ) => {
    const cleanId = identifier.trim().toLowerCase();
    const matched = userAccounts.find(u => {
      const matchEmail = u.email && u.email.trim().toLowerCase() === cleanId;
      const matchUsername = u.username && u.username.trim().toLowerCase() === cleanId;
      return matchEmail || matchUsername;
    });

    if (matched) {
      if (matched.password && matched.password !== password) {
        return { success: false, message: 'Password yang dimasukkan salah!' };
      }
      const safeUser: User = {
        id: matched.id,
        name: matched.name,
        username: matched.username,
        email: matched.email,
        role: matched.role,
        studentId: matched.studentId,
        studentName: matched.studentName
      };
      login(safeUser);
      return { success: true, message: 'Login berhasil!', user: safeUser };
    }

    if (role === 'parent' && studentId) {
      const student = santriList.find(s => s.id === studentId);
      if (student) {
        const parentUser: User = {
          id: `parent-${student.id}`,
          name: student.orangTuaNama || `Wali dari ${student.nama}`,
          email: `${student.id}@wali.santri`,
          role: 'parent',
          studentId: student.id,
          studentName: student.nama
        };
        login(parentUser);
        return { success: true, message: 'Login sebagai Wali Santri berhasil!', user: parentUser };
      }
    }

    return { success: false, message: 'Akun tidak ditemukan. Silakan periksa kembali email atau username Anda.' };
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
          const totalJuz = Math.max(s.totalJuzMemorized, juzSet.size);
          const growthDelta = newEntry.category === 'juz' ? 1.0 : newEntry.category === 'surah' ? 0.5 : 0.2;
          const newGrowth = Number(((s.weeklyGrowthJuz || 0) + growthDelta).toFixed(1));

          const updatedStudent: Santri = {
            ...s,
            hafalanList: updatedList,
            totalJuzMemorized: totalJuz,
            weeklyGrowthJuz: newGrowth,
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
              if (deposit.category === 'surah' || deposit.category === 'ayat') {
                totalJuz = Math.min(30, Math.round((totalJuz + 0.1) * 10) / 10);
              }
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
            ? latestDeposit.category === 'juz' ? 1.0 : latestDeposit.category === 'surah' ? 0.5 : 0.2
            : 0;

          const updatedStudent: Santri = {
            ...s,
            kehadiranPersen: newAttendancePct,
            weeklyGrowthJuz: Number(((s.weeklyGrowthJuz || 0) + growthBonus).toFixed(1)),
            hafalanList: updatedList,
            totalJuzMemorized: totalJuz,
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
    hafalan: Omit<HafalanEntry, 'id' | 'studentId' | 'studentName' | 'ustadzName'> & { tanggal?: string },
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

        if (newDeposit.type === 'baru') {
          if (newDeposit.surahNumber && !surahNumbers.includes(newDeposit.surahNumber)) {
            surahNumbers.push(newDeposit.surahNumber);
          }
          if (newDeposit.category === 'juz' && !juzList.includes(newDeposit.juz)) {
            juzList.push(newDeposit.juz);
          }
          if (newDeposit.category === 'surah' || newDeposit.category === 'ayat') {
            totalJuz = Math.min(30, Math.round((totalJuz + 0.1) * 10) / 10);
          }
        }

        const growthBonus = newDeposit.category === 'juz' ? 1.0 : newDeposit.category === 'surah' ? 0.5 : 0.2;

        const updatedStudent: Santri = {
          ...s,
          hafalanList: updatedList,
          totalJuzMemorized: totalJuz,
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
    targetText?: string
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
      status: 'terjadwal'
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
    targetText?: string
  ) => {
    setTasmiList(prev =>
      prev.map(t => {
        if (t.id === id) {
          const updated: TasmiRecord = {
            ...t,
            tanggal,
            waktu,
            ...(penguji !== undefined ? { penguji } : {}),
            ...(targetText ? { targetJuzText: targetText } : {})
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

  const updateTasmiResult = (id: string, nilai: TasmiRecord['nilai'], catatan: string) => {
    setTasmiList(prev =>
      prev.map(t => {
        if (t.id === id) {
          const updated: TasmiRecord = {
            ...t,
            status: 'selesai',
            nilai,
            catatan: catatan || ''
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

  const addKelompok = (nama: string, pengajar: string) => {
    const newGroup: Kelompok = {
      id: `grp-${Date.now()}`,
      nama,
      pengajar
    };

    setGroups(prev => [...prev, newGroup]);

    setDoc(doc(db, 'groups', newGroup.id), cleanForFirestore(newGroup)).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `groups/${newGroup.id}`);
    });
  };

  const updateKelompok = (id: string, nama: string, pengajar: string) => {
    setGroups(prev =>
      prev.map(g => {
        if (g.id === id) {
          const updated: Kelompok = { ...g, nama, pengajar };
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

      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  };

  return (
    <TahfidzContext.Provider
      value={{
        currentUser,
        activeTab,
        setActiveTab,
        login,
        logout,
        switchRole,
        registerUserAccount,
        loginUserAccount,
        santriList,
        classes,
        groups,
        targets,
        sessions,
        tasmiList,
        attendanceHistory,
        userAccounts,
        isCloudSynced,
        cloudSyncStatus,
        addHafalanRecord,
        updateHafalanRecord,
        deleteHafalanRecord,
        saveBulkAttendance,
        saveAttendanceSetoran,
        updateAttendancePerilaku,
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
        importDataJson
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
