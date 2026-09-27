import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db, testConnection, handleFirestoreError, cleanForFirestore, OperationType } from '../firebase';
import { User, UserAccount, Role, Santri, Kelas, Kelompok, TargetHafalan, SesiTahfidz, TasmiRecord, AttendanceRecord, HafalanEntry } from '../types';
import { INITIAL_SANTRI, INITIAL_CLASSES, INITIAL_GROUPS, INITIAL_TARGETS, INITIAL_SESSIONS, INITIAL_TASMI, INITIAL_ATTENDANCE } from '../data/initialData';

interface TahfidzContextType {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  login: (user: User) => void;
  logout: () => void;
  switchRole: (role: Role, studentId?: string) => void;
  registerUserAccount: (account: Omit<UserAccount, 'id' | 'createdAt'>) => Promise<{ success: boolean; message: string; user?: User }>;
  loginUserAccount: (identifier: string, password: string, role?: Role, studentId?: string) => Promise<{ success: boolean; message: string; user?: User }>;
  
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
  addHafalanRecord: (entry: Omit<HafalanEntry, 'id'>) => void;
  updateHafalanRecord: (studentId: string, recordId: string, data: Partial<HafalanEntry>) => void;
  deleteHafalanRecord: (studentId: string, recordId: string) => void;

  // Attendance Actions
  saveBulkAttendance: (records: {
    studentId: string;
    studentName: string;
    kelompokId: string;
    sessionKey: string;
    sessionName: string;
    tanggal: string;
    status: AttendanceRecord['status'];
    keterangan?: string;
    hafalan?: Omit<HafalanEntry, 'id' | 'studentId' | 'studentName'>;
  }[]) => void;

  // Tasmi Actions
  scheduleTasmi: (studentId: string, tanggal: string, waktu: string, penguji: string, targetText?: string) => void;
  updateTasmiSchedule: (id: string, tanggal: string, waktu: string, penguji: string, targetText?: string) => void;
  updateTasmiResult: (id: string, nilai: TasmiRecord['nilai'], catatan: string) => void;
  cancelTasmi: (id: string) => void;
  deleteTasmi: (id: string) => void;
  deleteAttendanceRecord: (id: string) => void;

  // Master Data Actions
  addSantri: (data: {
    nama: string;
    kelasId: string;
    gender: 'santriwan' | 'santriwati';
    kelompokId: string;
    targetJuz: number;
    orangTuaNama?: string;
    orangTuaPhone?: string;
  }) => void;
  updateSantri: (id: string, data: Partial<Santri>) => void;
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

  resetToDefaultData: () => void;
  exportDataJson: () => void;
  importDataJson: (jsonString: string) => boolean;
}

const TahfidzContext = createContext<TahfidzContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'tahfidz_user',
  ACCOUNTS: 'tahfidz_accounts_v2',
  SANTRI: 'tahfidz_santri_v2',
  CLASSES: 'tahfidz_classes_v2',
  GROUPS: 'tahfidz_groups_v2',
  TARGETS: 'tahfidz_targets_v2',
  SESSIONS: 'tahfidz_sessions_v2',
  TASMI: 'tahfidz_tasmi_v2',
  ATTENDANCE: 'tahfidz_attendance_v2'
};

export const TahfidzProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const normalizeTingkat = (tingkat: string): Kelas['tingkat'] => {
    if (tingkat === 'SD') return 'Ibtidaiyyah';
    if (tingkat === 'SMP') return 'Mutawasith';
    if (tingkat === 'SMA') return 'Aliyah';
    return (tingkat as Kelas['tingkat']) || 'Ibtidaiyyah';
  };

  const [santriList, setSantriList] = useState<Santri[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SANTRI);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SANTRI;
  });

  const [classes, setClasses] = useState<Kelas[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLASSES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((c: any) => ({
            ...c,
            tingkat: normalizeTingkat(c.tingkat),
            waliKelas: c.waliKelas || ''
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CLASSES;
  });

  const [groups, setGroups] = useState<Kelompok[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GROUPS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_GROUPS;
  });

  const [targets, setTargets] = useState<TargetHafalan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TARGETS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TARGETS;
  });

  const [sessions, setSessions] = useState<SesiTahfidz[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SESSIONS;
  });

  const [tasmiList, setTasmiList] = useState<TasmiRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASMI);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TASMI;
  });

  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ATTENDANCE;
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

  // LocalStorage backups
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

  const hasBootstrappedRef = useRef(false);

  // REAL-TIME FIRESTORE MULTI-DEVICE SYNC
  useEffect(() => {
    testConnection().then(connected => {
      if (!connected) {
        setCloudSyncStatus('offline');
      }
    });

    const unsubSantri = onSnapshot(
      collection(db, 'santri'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Santri[] = [];
          snapshot.forEach(d => {
            list.push({ ...d.data(), id: d.id } as Santri);
          });
          setSantriList(list);
          setIsCloudSynced(true);
          setCloudSyncStatus('synced');
        } else if (!hasBootstrappedRef.current) {
          // If Firestore is completely empty on fresh database bootstrap initial data
          bootstrapInitialFirestore();
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'santri');
        setCloudSyncStatus('error');
      }
    );

    const unsubAttendance = onSnapshot(
      collection(db, 'attendance'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: AttendanceRecord[] = [];
          snapshot.forEach(d => {
            list.push({ ...d.data(), id: d.id } as AttendanceRecord);
          });
          // Sort newest timestamp first
          list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
          setAttendanceHistory(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'attendance');
      }
    );

    const unsubTasmi = onSnapshot(
      collection(db, 'tasmi'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: TasmiRecord[] = [];
          snapshot.forEach(d => {
            list.push({ ...d.data(), id: d.id } as TasmiRecord);
          });
          setTasmiList(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'tasmi');
      }
    );

    const unsubClasses = onSnapshot(
      collection(db, 'classes'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Kelas[] = [];
          snapshot.forEach(d => {
            list.push({ ...d.data(), id: d.id } as Kelas);
          });
          setClasses(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'classes');
      }
    );

    const unsubGroups = onSnapshot(
      collection(db, 'groups'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Kelompok[] = [];
          snapshot.forEach(d => {
            list.push({ ...d.data(), id: d.id } as Kelompok);
          });
          setGroups(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'groups');
      }
    );

    const unsubSessions = onSnapshot(
      collection(db, 'sessions'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: SesiTahfidz[] = [];
          snapshot.forEach(d => {
            list.push({ ...d.data(), id: d.id } as SesiTahfidz);
          });
          setSessions(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'sessions');
      }
    );

    const unsubTargets = onSnapshot(
      collection(db, 'targets'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: TargetHafalan[] = [];
          snapshot.forEach(d => {
            list.push({ ...d.data(), id: d.id } as TargetHafalan);
          });
          setTargets(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'targets');
      }
    );

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: UserAccount[] = [];
          snapshot.forEach(d => {
            list.push({ ...d.data(), id: d.id } as UserAccount);
          });
          setUserAccounts(list);
        }
      },
      (error) => {
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

  // Helper to populate Firestore if newly provisioned
  const bootstrapInitialFirestore = async () => {
    if (hasBootstrappedRef.current) return;
    hasBootstrappedRef.current = true;
    try {
      const batch = writeBatch(db);

      INITIAL_SANTRI.forEach(s => {
        batch.set(doc(db, 'santri', s.id), cleanForFirestore(s));
      });
      INITIAL_CLASSES.forEach(c => {
        batch.set(doc(db, 'classes', c.id), cleanForFirestore(c));
      });
      INITIAL_GROUPS.forEach(g => {
        batch.set(doc(db, 'groups', g.id), cleanForFirestore(g));
      });
      INITIAL_TARGETS.forEach(t => {
        batch.set(doc(db, 'targets', t.id), cleanForFirestore(t));
      });
      INITIAL_SESSIONS.forEach(sess => {
        batch.set(doc(db, 'sessions', sess.id), cleanForFirestore(sess));
      });
      INITIAL_TASMI.forEach(tsm => {
        batch.set(doc(db, 'tasmi', tsm.id), cleanForFirestore(tsm));
      });
      INITIAL_ATTENDANCE.slice(0, 15).forEach(att => {
        batch.set(doc(db, 'attendance', att.id), cleanForFirestore(att));
      });

      await batch.commit();
      setIsCloudSynced(true);
      setCloudSyncStatus('synced');
    } catch (e) {
      console.warn('Initial cloud seed skipped or already present:', e);
    }
  };

  const login = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchRole = (role: Role, studentId?: string) => {
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

  // Real Account Registration against Firestore
  const registerUserAccount = async (account: Omit<UserAccount, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string; user?: User }> => {
    try {
      // Check existing by email or username
      const normalizedEmail = account.email.trim().toLowerCase();
      const normalizedUsername = (account.username || '').trim().toLowerCase();

      const exists = userAccounts.some(u => 
        (u.email && u.email.trim().toLowerCase() === normalizedEmail) ||
        (normalizedUsername && u.username && u.username.trim().toLowerCase() === normalizedUsername)
      );

      if (exists) {
        return { success: false, message: 'Email atau username sudah terdaftar dalam sistem!' };
      }

      const newId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newAccount: UserAccount = {
        ...account,
        id: newId,
        createdAt: new Date().toISOString()
      };

      // Update state
      setUserAccounts(prev => [...prev, newAccount]);

      // Save cleanly to Cloud Firestore
      await setDoc(doc(db, 'users', newId), cleanForFirestore(newAccount));

      const safeUser: User = {
        id: newAccount.id,
        name: newAccount.name,
        username: newAccount.username,
        email: newAccount.email,
        role: newAccount.role,
        studentId: newAccount.studentId,
        studentName: newAccount.studentName
      };

      return { success: true, message: 'Pendaftaran akun berhasil!', user: safeUser };
    } catch (e) {
      console.error('Registration failed:', e);
      return { success: false, message: 'Gagal mendaftar ke server, silakan coba lagi.' };
    }
  };

  // Real Account Login against Firestore
  const loginUserAccount = async (
    identifier: string, 
    password: string, 
    expectedRole?: Role,
    studentId?: string
  ): Promise<{ success: boolean; message: string; user?: User }> => {
    const cleanIdent = identifier.trim().toLowerCase();

    // 1. Check against registered Firestore userAccounts
    const match = userAccounts.find(u => {
      const matchEmail = u.email && u.email.trim().toLowerCase() === cleanIdent;
      const matchUsername = u.username && u.username.trim().toLowerCase() === cleanIdent;
      return (matchEmail || matchUsername);
    });

    if (match) {
      if (match.password && match.password !== password) {
        return { success: false, message: 'Password yang dimasukkan salah!' };
      }
      const loggedUser: User = {
        id: match.id,
        name: match.name,
        username: match.username,
        email: match.email,
        role: match.role,
        studentId: match.studentId,
        studentName: match.studentName
      };
      login(loggedUser);
      return { success: true, message: 'Login berhasil!', user: loggedUser };
    }

    // 2. Allow registered Parent based on student data matching email
    if (expectedRole === 'parent' && studentId) {
      const student = santriList.find(s => s.id === studentId);
      if (student) {
        const loggedUser: User = {
          id: `parent-${student.id}`,
          name: student.orangTuaNama || `Wali ${student.nama}`,
          email: identifier,
          role: 'parent',
          studentId: student.id,
          studentName: student.nama
        };
        login(loggedUser);
        return { success: true, message: 'Login wali santri berhasil!', user: loggedUser };
      }
    }

    return { success: false, message: 'Akun tidak ditemukan. Silakan periksa kembali atau daftar akun baru.' };
  };

  // Hafalan Actions
  const addHafalanRecord = (entry: Omit<HafalanEntry, 'id'>) => {
    const newId = `h-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newEntry: HafalanEntry = {
      ...entry,
      id: newId
    };

    setSantriList(prev => {
      const updated = prev.map(s => {
        if (s.id === entry.studentId) {
          const updatedList = [newEntry, ...s.hafalanList];
          const juzSet = new Set(updatedList.filter(h => h.category === 'juz').map(h => h.juz));
          const totalJuz = Math.max(s.totalJuzMemorized, juzSet.size);

          const updatedStudent = {
            ...s,
            hafalanList: updatedList,
            totalJuzMemorized: totalJuz,
            terakhirSetor: {
              juz: newEntry.juz,
              surah: newEntry.surahName,
              ayat: newEntry.ayatMulai ? `Ayat ${newEntry.ayatMulai}-${newEntry.ayatSelesai || ''}` : 'Selesai',
              tanggal: newEntry.tanggal
            }
          };

          // Save to Firestore real-time
          setDoc(doc(db, 'santri', s.id), cleanForFirestore(updatedStudent)).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `santri/${s.id}`);
          });

          return updatedStudent;
        }
        return s;
      });
      return updated;
    });
  };

  const updateHafalanRecord = (studentId: string, recordId: string, data: Partial<HafalanEntry>) => {
    setSantriList(prev => {
      const updated = prev.map(s => {
        if (s.id === studentId) {
          const updatedList = s.hafalanList.map(h => {
            if (h.id === recordId) {
              return { ...h, ...data };
            }
            return h;
          });

          const juzSet = new Set(updatedList.filter(h => h.category === 'juz').map(h => h.juz));
          const totalJuz = Math.max(s.totalJuzMemorized, juzSet.size);

          const latest = updatedList[0];
          const updatedStudent = {
            ...s,
            hafalanList: updatedList,
            totalJuzMemorized: totalJuz,
            terakhirSetor: latest ? {
              juz: latest.juz,
              surah: latest.surahName,
              ayat: latest.ayatMulai ? `Ayat ${latest.ayatMulai}-${latest.ayatSelesai || ''}` : 'Selesai',
              tanggal: latest.tanggal
            } : s.terakhirSetor
          };

          // Save to Firestore real-time
          setDoc(doc(db, 'santri', s.id), cleanForFirestore(updatedStudent)).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `santri/${s.id}`);
          });

          return updatedStudent;
        }
        return s;
      });
      return updated;
    });
  };

  const deleteHafalanRecord = (studentId: string, recordId: string) => {
    setSantriList(prev => {
      const updated = prev.map(s => {
        if (s.id === studentId) {
          const updatedList = s.hafalanList.filter(h => h.id !== recordId);
          const juzSet = new Set(updatedList.filter(h => h.category === 'juz').map(h => h.juz));
          const totalJuz = juzSet.size;
          const latest = updatedList[0];

          const updatedStudent = {
            ...s,
            hafalanList: updatedList,
            totalJuzMemorized: totalJuz,
            terakhirSetor: latest ? {
              juz: latest.juz,
              surah: latest.surahName,
              ayat: latest.ayatMulai ? `Ayat ${latest.ayatMulai}-${latest.ayatSelesai || ''}` : 'Selesai',
              tanggal: latest.tanggal
            } : undefined
          };

          // Save to Firestore real-time
          setDoc(doc(db, 'santri', s.id), cleanForFirestore(updatedStudent)).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `santri/${s.id}`);
          });

          return updatedStudent;
        }
        return s;
      });
      return updated;
    });
  };

  // Attendance Actions
  const saveBulkAttendance = (records: {
    studentId: string;
    studentName: string;
    kelompokId: string;
    sessionKey: string;
    sessionName: string;
    tanggal: string;
    status: AttendanceRecord['status'];
    keterangan?: string;
    hafalan?: Omit<HafalanEntry, 'id' | 'studentId' | 'studentName'>;
  }[]) => {
    const timestamp = new Date().toISOString();
    const newAttendanceRecords: AttendanceRecord[] = [];
    const newHafalanDeposits: HafalanEntry[] = [];

    records.forEach((r, idx) => {
      let hafalanDeposit: HafalanEntry | undefined = undefined;

      if (r.hafalan && r.status !== 'tidak_hadir') {
        const newHafalanId = `h-dep-${Date.now()}-${idx}-${r.studentId}`;
        hafalanDeposit = {
          ...r.hafalan,
          id: newHafalanId,
          studentId: r.studentId,
          studentName: r.studentName,
          tanggal: r.tanggal,
          ustadzName: currentUser?.name || 'Ustadz'
        };
        newHafalanDeposits.push(hafalanDeposit);
      }

      const attRecord: AttendanceRecord = {
        id: `att-${Date.now()}-${idx}-${r.studentId}`,
        tanggal: r.tanggal,
        sessionKey: r.sessionKey,
        sessionName: r.sessionName,
        studentId: r.studentId,
        studentName: r.studentName,
        kelompokId: r.kelompokId,
        status: r.status,
        keterangan: r.keterangan || '',
        ...(hafalanDeposit ? { hafalanDeposit } : {}),
        timestamp
      };

      newAttendanceRecords.push(attRecord);

      // Save each attendance record to Cloud Firestore cleanly
      setDoc(doc(db, 'attendance', attRecord.id), cleanForFirestore(attRecord)).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `attendance/${attRecord.id}`);
      });
    });

    setAttendanceHistory(prev => [...newAttendanceRecords, ...prev]);

    // Atomically update santriList and sync to Cloud Firestore
    if (newHafalanDeposits.length > 0) {
      setSantriList(prev => prev.map(s => {
        const studentDeposits = newHafalanDeposits.filter(d => d.studentId === s.id);
        if (studentDeposits.length === 0) return s;

        const updatedList = [...studentDeposits, ...s.hafalanList];
        const latestDeposit = studentDeposits[0];
        const juzSet = new Set(updatedList.filter(h => h.category === 'juz').map(h => h.juz));
        const totalJuz = Math.max(s.totalJuzMemorized, juzSet.size);

        const updatedStudent = {
          ...s,
          hafalanList: updatedList,
          totalJuzMemorized: totalJuz,
          terakhirSetor: {
            juz: latestDeposit.juz,
            surah: latestDeposit.surahName,
            ayat: latestDeposit.ayatMulai ? `Ayat ${latestDeposit.ayatMulai}-${latestDeposit.ayatSelesai || ''}` : 'Selesai',
            tanggal: latestDeposit.tanggal
          }
        };

        // Sync student data to Cloud Firestore
        setDoc(doc(db, 'santri', s.id), cleanForFirestore(updatedStudent)).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `santri/${s.id}`);
        });

        return updatedStudent;
      }));
    }
  };

  const deleteAttendanceRecord = (id: string) => {
    setAttendanceHistory(prev => prev.filter(r => r.id !== id));
    deleteDoc(doc(db, 'attendance', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `attendance/${id}`);
    });
  };

  // Tasmi Actions
  const scheduleTasmi = (studentId: string, tanggal: string, waktu: string, penguji: string, targetText?: string) => {
    const student = santriList.find(s => s.id === studentId);
    if (!student) return;

    const newRecord: TasmiRecord = {
      id: `tasmi-${Date.now()}`,
      studentId,
      studentName: student.nama,
      kelompokNama: student.kelompokNama,
      gender: student.gender,
      targetJuzText: targetText || `Juz ${student.totalJuzMemorized + 1}`,
      tanggal,
      waktu,
      penguji,
      status: 'terjadwal'
    };

    setTasmiList(prev => [newRecord, ...prev]);
    setDoc(doc(db, 'tasmi', newRecord.id), cleanForFirestore(newRecord)).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `tasmi/${newRecord.id}`);
    });
  };

  const updateTasmiSchedule = (id: string, tanggal: string, waktu: string, penguji: string, targetText?: string) => {
    setTasmiList(prev => prev.map(t => {
      if (t.id === id) {
        const updated = {
          ...t,
          tanggal,
          waktu,
          penguji,
          ...(targetText ? { targetJuzText: targetText } : {})
        };
        setDoc(doc(db, 'tasmi', id), cleanForFirestore(updated)).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `tasmi/${id}`);
        });
        return updated;
      }
      return t;
    }));
  };

  const updateTasmiResult = (id: string, nilai: TasmiRecord['nilai'], catatan: string) => {
    setTasmiList(prev => prev.map(t => {
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
    }));
  };

  const cancelTasmi = (id: string) => {
    setTasmiList(prev => prev.map(t => {
      if (t.id === id) {
        const updated: TasmiRecord = { ...t, status: 'belum' };
        setDoc(doc(db, 'tasmi', id), cleanForFirestore(updated)).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `tasmi/${id}`);
        });
        return updated;
      }
      return t;
    }));
  };

  const deleteTasmi = (id: string) => {
    setTasmiList(prev => prev.filter(t => t.id !== id));
    deleteDoc(doc(db, 'tasmi', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `tasmi/${id}`);
    });
  };

  // Master Data: Santri
  const addSantri = (data: {
    nama: string;
    kelasId: string;
    gender: 'santriwan' | 'santriwati';
    kelompokId: string;
    targetJuz: number;
    orangTuaNama?: string;
    orangTuaPhone?: string;
  }) => {
    const kelasObj = classes.find(c => c.id === data.kelasId);
    const kelompokObj = groups.find(g => g.id === data.kelompokId);

    const newStudent: Santri = {
      id: `santri-${Date.now()}`,
      nama: data.nama,
      gender: data.gender,
      kelasId: data.kelasId,
      kelasNama: kelasObj?.nama || 'Kelas Baru',
      kelompokId: data.kelompokId,
      kelompokNama: kelompokObj?.nama || 'Kelompok Baru',
      targetJuz: data.targetJuz,
      totalJuzMemorized: 0,
      kehadiranPersen: 100,
      weeklyGrowthJuz: 0,
      orangTuaNama: data.orangTuaNama || '',
      orangTuaPhone: data.orangTuaPhone || '',
      hafalanList: []
    };

    setSantriList(prev => [newStudent, ...prev]);
    setDoc(doc(db, 'santri', newStudent.id), cleanForFirestore(newStudent)).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `santri/${newStudent.id}`);
    });
  };

  const updateSantri = (id: string, data: Partial<Santri>) => {
    setSantriList(prev => prev.map(s => {
      if (s.id === id) {
        const updated = { ...s, ...data };
        setDoc(doc(db, 'santri', id), cleanForFirestore(updated)).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `santri/${id}`);
        });
        return updated;
      }
      return s;
    }));
  };

  const deleteSantri = (id: string) => {
    setSantriList(prev => prev.filter(s => s.id !== id));
    deleteDoc(doc(db, 'santri', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `santri/${id}`);
    });
  };

  // Master Data: Kelas
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
    setClasses(prev => prev.map(c => {
      if (c.id === id) {
        const updated = {
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
    }));
  };

  const deleteKelas = (id: string) => {
    setClasses(prev => prev.filter(c => c.id !== id));
    deleteDoc(doc(db, 'classes', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `classes/${id}`);
    });
  };

  // Master Data: Kelompok
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
    setGroups(prev => prev.map(g => {
      if (g.id === id) {
        const updated = { ...g, nama, pengajar };
        setDoc(doc(db, 'groups', id), cleanForFirestore(updated)).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `groups/${id}`);
        });
        return updated;
      }
      return g;
    }));
  };

  const deleteKelompok = (id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
    deleteDoc(doc(db, 'groups', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `groups/${id}`);
    });
  };

  // Master Data: Target
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
    setTargets(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { ...t, nama, jumlahJuz };
        setDoc(doc(db, 'targets', id), cleanForFirestore(updated)).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `targets/${id}`);
        });
        return updated;
      }
      return t;
    }));
  };

  const deleteTarget = (id: string) => {
    setTargets(prev => prev.filter(t => t.id !== id));
    deleteDoc(doc(db, 'targets', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `targets/${id}`);
    });
  };

  // Master Data: Sesi
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
    setSessions(prev => prev.map(s => {
      if (s.id === id) {
        const updated = { ...s, ...data };
        setDoc(doc(db, 'sessions', id), cleanForFirestore(updated)).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `sessions/${id}`);
        });
        return updated;
      }
      return s;
    }));
  };

  const deleteSesi = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    deleteDoc(doc(db, 'sessions', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `sessions/${id}`);
    });
  };

  // Reset & Backup
  const resetToDefaultData = () => {
    setSantriList(INITIAL_SANTRI);
    setClasses(INITIAL_CLASSES);
    setGroups(INITIAL_GROUPS);
    setTargets(INITIAL_TARGETS);
    setSessions(INITIAL_SESSIONS);
    setTasmiList(INITIAL_TASMI);
    setAttendanceHistory(INITIAL_ATTENDANCE);
    bootstrapInitialFirestore();
  };

  const exportDataJson = () => {
    const data = {
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
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tahfidz_data_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
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
        parsed.sessions.forEach((sess: SesiTahfidz) => {
          setDoc(doc(db, 'sessions', sess.id), cleanForFirestore(sess)).catch(console.error);
        });
      }
      if (parsed.tasmiList && Array.isArray(parsed.tasmiList)) {
        setTasmiList(parsed.tasmiList);
        parsed.tasmiList.forEach((tsm: TasmiRecord) => {
          setDoc(doc(db, 'tasmi', tsm.id), cleanForFirestore(tsm)).catch(console.error);
        });
      }
      if (parsed.attendanceHistory && Array.isArray(parsed.attendanceHistory)) {
        setAttendanceHistory(parsed.attendanceHistory);
        parsed.attendanceHistory.forEach((att: AttendanceRecord) => {
          setDoc(doc(db, 'attendance', att.id), cleanForFirestore(att)).catch(console.error);
        });
      }
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  };

  return (
    <TahfidzContext.Provider value={{
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
      exportDataJson,
      importDataJson
    }}>
      {children}
    </TahfidzContext.Provider>
  );
};

export const useTahfidz = () => {
  const context = useContext(TahfidzContext);
  if (!context) {
    throw new Error('useTahfidz must be used within a TahfidzProvider');
  }
  return context;
};
