export type Role = 'admin' | 'guru' | 'coordinator' | 'parent';
export type UserRole = Role;

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: Role;
  studentId?: string; // if role === 'parent'
  studentName?: string;
}

export interface UserAccount extends User {
  password?: string;
  phone?: string;
  createdAt?: string;
}

export type HafalanQuality = 'A' | 'B' | 'C' | 'D';
export type HafalanType = 'baru' | 'muroja' | 'perbaikan';

export interface HafalanEntry {
  id: string;
  studentId: string;
  studentName: string;
  type: HafalanType;
  category: 'juz' | 'surah' | 'ayat';
  juz: number;
  surahNumber?: number;
  surahName: string;
  ayatMulai?: number;
  ayatSelesai?: number;
  kualitas: HafalanQuality;
  catatan?: string;
  tanggal: string; // YYYY-MM-DD
  ustadzName?: string;
}

export interface Santri {
  id: string;
  nama: string;
  nis?: string;
  gender: 'santriwan' | 'santriwati';
  kelasId: string;
  kelasNama: string;
  kelompokId: string;
  kelompokNama: string;
  targetJuz: number;
  totalJuzMemorized: number;
  terakhirSetor?: {
    juz: number;
    surah: string;
    ayat: string;
    tanggal: string;
  };
  targetSelesai?: string;
  kehadiranPersen: number;
  weeklyGrowthJuz: number;
  orangTuaNama?: string;
  orangTuaPhone?: string;
  hafalanList: HafalanEntry[];
  memorizedJuzList?: number[];
  memorizedSurahNumbers?: number[];
  keteranganHafalan?: string;
  inProgressJuz?: {
    juzNumber: number;
    lembar: number;
    halaman: number;
  };
}

export type AttendanceStatus = 'hadir_tepat' | 'hadir_terlambat' | 'tidak_hadir';

export interface AttendanceRecord {
  id: string;
  tanggal: string; // YYYY-MM-DD
  sessionKey: string;
  sessionName: string;
  studentId: string;
  studentName: string;
  kelompokId: string;
  status: AttendanceStatus;
  keterangan?: string;
  catatanPerilaku?: string;
  hafalanDeposit?: HafalanEntry;
  timestamp: string;
}

export type TasmiStatus = 'belum' | 'terjadwal' | 'selesai';

export interface TasmiRecord {
  id: string;
  studentId: string;
  studentName: string;
  kelompokNama: string;
  gender: 'santriwan' | 'santriwati';
  targetJuzText: string;
  tanggal?: string;
  waktu?: string;
  penguji?: string;
  status: TasmiStatus;
  nilai?: 'A' | 'A-' | 'B+' | 'B' | 'C' | 'D';
  catatan?: string;
}

export interface Kelas {
  id: string;
  nama: string;
  tingkat: 'Ibtidaiyyah' | 'Mutawasith' | 'Aliyah' | 'SD' | 'SMP' | 'SMA' | string;
  waliKelas?: string;
}

export interface Kelompok {
  id: string;
  nama: string;
  pengajar: string;
}

export interface TargetHafalan {
  id: string;
  nama: string;
  jumlahJuz: number;
}

export interface SesiTahfidz {
  id: string;
  key: string;
  nama: string;
  jamMulai: string;
  jamSelesai: string;
  status: 'Aktif' | 'Nonaktif';
}
