import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  MessageCircle, 
  Copy, 
  Check, 
  User, 
  BookOpen, 
  Clock, 
  HeartHandshake, 
  Phone,
  FileText,
  Calendar,
  AlertCircle,
  Sparkles,
  Users,
  CheckCircle2
} from 'lucide-react';
import { Santri } from '../types';
import { useTahfidz } from '../context/TahfidzContext';
import { parseHafalan } from '../utils/hafalanFormat';

interface KirimPesanWAModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Santri | null;
  defaultCategory?: 'tanya_hafalan' | 'izin_absen' | 'izin_terlambat' | 'tasmi' | 'custom';
}

export const KirimPesanWAModal: React.FC<KirimPesanWAModalProps> = ({
  isOpen,
  onClose,
  student,
  defaultCategory = 'tanya_hafalan'
}) => {
  const { groups } = useTahfidz();

  const [category, setCategory] = useState<'tanya_hafalan' | 'izin_absen' | 'izin_terlambat' | 'tasmi' | 'custom'>(defaultCategory);
  const [copied, setCopied] = useState(false);
  
  // Find child's halaqah group & teacher
  const groupObj = useMemo(() => {
    if (!student) return null;
    return groups.find(g => g.id === student.kelompokId || g.nama === student.kelompokNama);
  }, [groups, student]);

  // Selected teacher choice: 'child_group' | group ID | 'manual'
  const [selectedTeacherChoice, setSelectedTeacherChoice] = useState<string>('child_group');
  const [teacherName, setTeacherName] = useState(groupObj?.pengajar || 'Ustadz Pembina');
  const [teacherPhone, setTeacherPhone] = useState(groupObj?.phone || '');
  const [customReason, setCustomReason] = useState('Demam dan perlu istirahat di rumah');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [estimatedArrival, setEstimatedArrival] = useState('15:30 WIB');
  const [customMessage, setCustomMessage] = useState('');

  // Update teacher when child's group or choice changes
  useEffect(() => {
    if (groupObj && selectedTeacherChoice === 'child_group') {
      setTeacherName(groupObj.pengajar);
      setTeacherPhone(groupObj.phone || '');
    }
  }, [groupObj, selectedTeacherChoice]);

  const handleTeacherChoiceChange = (choice: string) => {
    setSelectedTeacherChoice(choice);
    if (choice === 'child_group') {
      if (groupObj) {
        setTeacherName(groupObj.pengajar);
        setTeacherPhone(groupObj.phone || '');
      }
    } else if (choice === 'manual') {
      // Keep existing or let user edit freely
    } else {
      const targetGroup = groups.find(g => g.id === choice);
      if (targetGroup) {
        setTeacherName(targetGroup.pengajar);
        setTeacherPhone(targetGroup.phone || '');
      }
    }
  };

  const studentName = student?.nama || 'Santri';
  const className = student?.kelasNama || 'Kelas Tahfidz';
  const groupName = student?.kelompokNama || 'Halaqah';
  const studentBreakdown = student ? parseHafalan(student.totalJuzMemorized) : null;
  const currentSurah = student?.inProgressJuz?.surahSedangDihafal || student?.terakhirSetor?.surah || 'Juz Amma';

  // Generate WhatsApp Message text based on category
  const generatedText = useMemo(() => {
    const salam = "Assalamu'alaikum Warahmatullahi Wabarakatuh";
    const closing = "Jazakumullahu khairan wa barakallahu fiikum.\nWassalamu'alaikum Warahmatullahi Wabarakatuh.";

    switch (category) {
      case 'tanya_hafalan':
        return `${salam} Ustadz/Ustadzah ${teacherName},

Saya orang tua/wali dari santri ananda *${studentName}* (${className} - ${groupName}).

Mohon izin ingin menanyakan terkait perkembangan hafalan Al-Qur'an ananda di halaqah. Saat ini tercatat ananda telah mencapai *${studentBreakdown?.decimalText || '0'} Juz* (${studentBreakdown?.lembarText || ''}), dan sedang mempelajari *${currentSurah}*.

Apakah ada catatan atau evaluasi khusus dari Ustadz/Ustadzah terkait kelancaran tajwid, makharijul huruf, atau muroja'ah ananda yang perlu kami dampingi di rumah?

${closing}`;

      case 'izin_absen':
        return `${salam} Ustadz/Ustadzah ${teacherName},

Saya orang tua/wali dari santri ananda *${studentName}* (${className} - ${groupName}).

Memberitahukan bahwa ananda hari ini (tanggal ${targetDate}) berhalangan hadir mengikuti sesi halaqah dikarenakan:
*${customReason}*.

Mohon doa dan izinnya dari Ustadz/Ustadzah. Insya Allah ananda akan tetap muraja'ah mandiri di rumah.

${closing}`;

      case 'izin_terlambat':
        return `${salam} Ustadz/Ustadzah ${teacherName},

Saya orang tua/wali dari santri ananda *${studentName}* (${className} - ${groupName}).

Memberitahukan bahwa ananda insya Allah akan sedikit terlambat menghadiri halaqah sesi hari ini karena:
*${customReason}*.

Diperkirakan ananda tiba di lokasi halaqah sekitar pukul *${estimatedArrival}*. Mohon maklum dan izinnya.

${closing}`;

      case 'tasmi':
        return `${salam} Ustadz/Ustadzah ${teacherName},

Saya orang tua/wali dari ananda *${studentName}* (${className} - ${groupName}).

Mohon informasi terkait persiapan atau jadwal Ujian Tasmi' Al-Qur'an ananda untuk capaian juz yang sedang ditempuh. Apakah ada persyaratan muroja'ah kelayakan yang perlu ananda selesaikan terlebih dahulu?

${closing}`;

      case 'custom':
        return `${salam} Ustadz/Ustadzah ${teacherName},

Saya orang tua/wali dari ananda *${studentName}* (${className} - ${groupName}).

${customMessage || 'Mohon izin menyampaikan pesan terkait ananda...'}

${closing}`;

      default:
        return '';
    }
  }, [category, teacherName, studentName, className, groupName, studentBreakdown, currentSurah, targetDate, customReason, estimatedArrival, customMessage]);

  if (!isOpen) return null;

  // Clean phone number for WhatsApp URL (convert 08xx to 628xx)
  const formatPhoneForWa = (phone: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    return clean;
  };

  const cleanPhone = teacherPhone ? formatPhoneForWa(teacherPhone) : '';
  const waUrl = cleanPhone 
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(generatedText)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(generatedText)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 transition-colors"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">
                Hubungi Guru via WhatsApp
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Format pesan resmi & sopan untuk wali santri kepada Ustadz pembina
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Target Student Info Pill */}
          {student && (
            <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  {student.nama.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                    Ananda {student.nama}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {student.kelasNama} · {student.kelompokNama}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
                Wali Santri
              </span>
            </div>
          )}

          {/* Teacher and Phone Selection (Guru Halaqoh Ananda) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
              <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Pilih Ustadz Tujuan & Nomor WhatsApp</span>
              </label>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Data no. HP diambil dari Kelola Kelompok
              </span>
            </div>

            {/* Quick Card: Child's Halaqah Teacher Recommendation */}
            {groupObj && (
              <div 
                onClick={() => handleTeacherChoiceChange('child_group')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                  selectedTeacherChoice === 'child_group'
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-500 dark:border-emerald-600 ring-1 ring-emerald-500 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    selectedTeacherChoice === 'child_group' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {selectedTeacherChoice === 'child_group' ? <Check className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                        {groupObj.pengajar}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                        Guru Halaqah Ananda
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        ({groupObj.nama})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mt-1">
                      <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {groupObj.phone ? `No. WA: ${groupObj.phone}` : 'No. WA belum tercatat di data kelompok'}
                      </span>
                      {groupObj.phone && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100/70 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded">
                          Tersimpan
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTeacherChoiceChange('child_group');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 self-start sm:self-auto ${
                    selectedTeacherChoice === 'child_group'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600'
                  }`}
                >
                  {selectedTeacherChoice === 'child_group' ? '✓ Sedang Dipilih' : 'Pilih Guru Halaqah'}
                </button>
              </div>
            )}

            {/* Dropdown for selecting any halaqah teacher */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Atau Pilih Dari Daftar Guru / Halaqah Lainnya:
              </label>
              <select
                value={selectedTeacherChoice}
                onChange={e => handleTeacherChoiceChange(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {groupObj && (
                  <option value="child_group">
                    ⭐ Guru Halaqah Ananda: {groupObj.pengajar} ({groupObj.nama}) - {groupObj.phone ? `WA: ${groupObj.phone}` : 'Tanpa No HP'}
                  </option>
                )}
                <optgroup label="Daftar Guru Halaqah Lainnya">
                  {groups
                    .filter(g => g.id !== groupObj?.id)
                    .map(g => (
                      <option key={g.id} value={g.id}>
                        {g.pengajar} ({g.nama}) - {g.phone ? `WA: ${g.phone}` : 'Tanpa No HP'}
                      </option>
                    ))}
                </optgroup>
                <option value="manual">✏️ Input Nama & Nomor HP Secara Manual...</option>
              </select>
            </div>

            {/* Editable Teacher and Phone Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Guru Tujuan di Pesan
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={teacherName}
                    onChange={e => {
                      setTeacherName(e.target.value);
                      setSelectedTeacherChoice('manual');
                    }}
                    placeholder="Nama Ustadz..."
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor WhatsApp Guru
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={teacherPhone}
                    onChange={e => {
                      setTeacherPhone(e.target.value);
                      setSelectedTeacherChoice('manual');
                    }}
                    placeholder="Contoh: 081234567801"
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* WhatsApp Phone status banner for parent visibility */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2 text-xs min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${teacherPhone ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-slate-600 dark:text-slate-400 shrink-0">No. WhatsApp Tujuan:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 truncate">
                  {teacherPhone || '(Belum ada nomor HP di data halaqah)'}
                </span>
              </div>
              {teacherPhone ? (
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0 self-start sm:self-auto flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Terhubung ke Halaqah</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 shrink-0">
                  Perlu nomor ustadz
                </span>
              )}
            </div>
          </div>

          {/* Template Selector Tabs */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Pilih Jenis Kebutuhan Pesan
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setCategory('tanya_hafalan')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                  category === 'tanya_hafalan'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-bold ring-1 ring-emerald-500 shadow-xs'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Tanya Hafalan</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Perkembangan & evaluasi</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('izin_absen')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                  category === 'izin_absen'
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-950 dark:text-rose-200 font-bold ring-1 ring-rose-500 shadow-xs'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Izin Tidak Hadir</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Sakit atau kepentingan</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('izin_terlambat')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                  category === 'izin_terlambat'
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-950 dark:text-amber-200 font-bold ring-1 ring-amber-500 shadow-xs'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Izin Terlambat</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Pemberitahuan datang telat</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('tasmi')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                  category === 'tasmi'
                    ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-950 dark:text-teal-200 font-bold ring-1 ring-teal-500 shadow-xs'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Ujian Tasmi'</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Jadwal & persiapan</span>
              </button>
            </div>
          </div>

          {/* Conditional Inputs Based on Category */}
          {category === 'izin_absen' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-rose-50/60 dark:bg-rose-950/40 rounded-2xl border border-rose-200/70 dark:border-rose-900/60">
              <div>
                <label className="block text-[11px] font-bold text-rose-900 dark:text-rose-200 mb-1">
                  Tanggal Berhalangan
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-rose-900 dark:text-rose-200 mb-1">
                  Alasan Tidak Hadir
                </label>
                <input
                  type="text"
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  placeholder="Misal: Kurang sehat / ada acara keluarga"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {category === 'izin_terlambat' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50/60 dark:bg-amber-950/40 rounded-2xl border border-amber-200/70 dark:border-amber-900/60">
              <div>
                <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200 mb-1">
                  Estimasi Tiba di Halaqah
                </label>
                <input
                  type="text"
                  value={estimatedArrival}
                  onChange={e => setEstimatedArrival(e.target.value)}
                  placeholder="Misal: 15:45 WIB"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200 mb-1">
                  Alasan Keterlambatan
                </label>
                <input
                  type="text"
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  placeholder="Misal: Terjebak hujan lebat / urusan keluarga"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {category === 'custom' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tulis Isi Pesan Kustom Anda
              </label>
              <textarea
                rows={3}
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                placeholder="Tulis pesan yang ingin disampaikan..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>
          )}

          {/* WhatsApp Chat Preview Bubble */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Pratinjau Pesan yang Akan Dikirim:</span>
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/70 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Teks Tersalin!' : 'Salin Teks'}</span>
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-slate-800/80 border border-emerald-200/80 dark:border-slate-700 font-mono text-[11px] text-slate-800 dark:text-emerald-200 whitespace-pre-wrap leading-relaxed shadow-inner max-h-48 overflow-y-auto">
              {generatedText}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center sm:text-left">
            {teacherPhone 
              ? `Tersambung ke nomor ustadz: ${teacherPhone}`
              : 'Pesan akan dibuka di WhatsApp untuk Anda pilih kontak'
            }
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin Pesan'}</span>
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white/20" />
              <span>Buka WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
