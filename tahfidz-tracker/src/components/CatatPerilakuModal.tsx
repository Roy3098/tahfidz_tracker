import React, { useState, useEffect } from 'react';
import { Smile, X, Save, Sparkles, Check, HeartHandshake } from 'lucide-react';
import { AttendanceRecord } from '../types';

export const BEHAVIOR_PRESETS = [
  '🌟 Sangat Fokus & Tertib',
  '📖 Aktif Menyimak',
  '✨ Adab Sangat Baik',
  '😴 Mengantuk / Kurang Fit',
  '💬 Kurang Fokus',
  '🔄 Perlu Dimotivasi'
];

interface CatatPerilakuModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  onSave: (attendanceId: string, catatanPerilaku: string) => void;
}

export const CatatPerilakuModal: React.FC<CatatPerilakuModalProps> = ({
  isOpen,
  onClose,
  record,
  onSave
}) => {
  const [perilakuText, setPerilakuText] = useState('');

  useEffect(() => {
    if (record) {
      setPerilakuText(record.catatanPerilaku || '');
    } else {
      setPerilakuText('');
    }
  }, [record, isOpen]);

  if (!isOpen || !record) return null;

  const handleSelectPreset = (preset: string) => {
    setPerilakuText(prev => (prev ? `${prev}, ${preset}` : preset));
  };

  const handleSave = () => {
    onSave(record.id, perilakuText.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 w-full max-w-lg flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-white shrink-0">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">
                Catat Perilaku di Halaqah
              </h3>
              <p className="text-xs text-amber-100/90 mt-0.5">
                Evaluasi adab, keaktifan & ketertiban santri selama sesi berlangsung
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Santri & Sesi Card */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/40 rounded-2xl border border-amber-200/70 dark:border-amber-800/60 flex items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider block">
                Santri yang Dievaluasi:
              </span>
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 block">
                {record.studentName}
              </span>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 border border-amber-200 dark:border-amber-800 text-[11px] block">
                {record.sessionName} · {record.tanggal}
              </span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Pilih Cepat Preset Perilaku:</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {BEHAVIOR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-amber-100/80 dark:hover:bg-amber-900/60 text-slate-700 dark:text-slate-200 hover:text-amber-900 dark:hover:text-amber-100 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Catatan Adab / Perilaku Santri:
              </label>
              {perilakuText && (
                <button
                  type="button"
                  onClick={() => setPerilakuText('')}
                  className="text-[11px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium transition-colors"
                >
                  Kosongkan
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={perilakuText}
              onChange={e => setPerilakuText(e.target.value)}
              placeholder="Contoh: Sangat khusyuk menyimak, adab terhadap guru sangat baik, tilawah tartil..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-850 transition-all resize-none"
            />
          </div>

          {/* Information callout */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-750 flex items-start gap-2.5 text-slate-600 dark:text-slate-300 text-xs">
            <HeartHandshake className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              Catatan perilaku ini secara otomatis tersinkron dan dapat dibaca oleh orang tua di portal monitoring kehadiran dan hafalan ananda.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Catatan Perilaku</span>
          </button>
        </div>
      </div>
    </div>
  );
};
