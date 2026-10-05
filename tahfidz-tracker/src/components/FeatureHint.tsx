import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, X } from 'lucide-react';

interface FeatureHintProps {
  content: React.ReactNode;
  title?: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export const FeatureHint: React.FC<FeatureHintProps> = ({
  content,
  title = 'Petunjuk Fitur',
  align = 'left',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const mobilePopupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inTrigger = containerRef.current && containerRef.current.contains(target);
      const inPopup = mobilePopupRef.current && mobilePopupRef.current.contains(target);
      if (!inTrigger && !inPopup) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const alignmentClasses = 
    align === 'right' ? 'right-0 origin-top-right' :
    align === 'center' ? 'left-1/2 -translate-x-1/2 origin-top' :
    'left-0 origin-top-left';

  const isDesktopViewport = () =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches;

  return (
    <span 
      ref={containerRef} 
      onMouseLeave={() => {
        if (isDesktopViewport()) setIsOpen(false);
      }}
      className={`relative inline-flex items-center align-middle ${className}`}
    >
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(prev => !prev);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(prev => !prev);
          }
        }}
        onMouseEnter={() => {
          if (isDesktopViewport()) setIsOpen(true);
        }}
        className="w-4 h-4 rounded-full bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-emerald-950 text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-300 border border-slate-300 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-800 inline-flex items-center justify-center font-bold text-[10px] leading-none transition-all shadow-2xs cursor-pointer select-none focus:outline-none"
        aria-label="Petunjuk fitur"
        title="Klik atau arahkan kursor untuk petunjuk fitur"
      >
        !
      </span>

      {/* Desktop Floating Tooltip */}
      {isOpen && (
        <span 
          onClick={(e) => e.stopPropagation()}
          className={`hidden sm:block absolute top-full mt-1.5 z-50 w-72 p-3.5 bg-white dark:bg-slate-850 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150 text-left normal-case tracking-normal font-normal ${alignmentClasses}`}
        >
          <span className="flex items-center justify-between gap-2 font-bold text-emerald-700 dark:text-emerald-400 text-xs mb-1">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{title}</span>
            </span>
          </span>
          <span className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 space-y-1 block">
            {typeof content === 'string' ? <span className="block">{content}</span> : content}
          </span>
        </span>
      )}

      {/* Mobile Floating Centered Card (Tengah Layar Khusus Mobile) */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
          className="sm:hidden fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/35 backdrop-blur-[1px] animate-in fade-in duration-150"
        >
          <div
            ref={mobilePopupRef}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-emerald-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 animate-in zoom-in-95 duration-150 text-left normal-case tracking-normal font-normal space-y-2"
          >
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{title}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors"
                aria-label="Tutup petunjuk"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 space-y-1">
              {typeof content === 'string' ? <p>{content}</p> : content}
            </div>
          </div>
        </div>,
        document.body
      )}
    </span>
  );
};
