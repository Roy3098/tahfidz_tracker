import { useState, useEffect } from 'react';

export const INDONESIA_TIMEZONE = 'Asia/Jakarta';

export interface WIBDateParts {
  year: number;
  month: number; // 1 - 12
  day: number; // 1 - 31
  hour: number; // 0 - 23
  minute: number; // 0 - 59
  second: number; // 0 - 59
  dateStr: string; // YYYY-MM-DD in Asia/Jakarta
  timeStr: string; // HH:mm:ss in Asia/Jakarta
}

/**
 * Extracts exact calendar & clock components in Indonesia Western Time (WIB / Asia/Jakarta, UTC+7)
 */
export function getNowWIBParts(date: Date = new Date()): WIBDateParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: INDONESIA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') {
      map[p.type] = p.value;
    }
  }

  const year = parseInt(map.year || '2026', 10);
  const month = parseInt(map.month || '01', 10);
  const day = parseInt(map.day || '01', 10);
  // Handle '24' hour edge case in some Intl implementations at midnight
  const rawHour = parseInt(map.hour || '00', 10);
  const hour = rawHour === 24 ? 0 : rawHour;
  const minute = parseInt(map.minute || '00', 10);
  const second = parseInt(map.second || '00', 10);

  const yyyy = String(year).padStart(4, '0');
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const hh = String(hour).padStart(2, '0');
  const min = String(minute).padStart(2, '0');
  const ss = String(second).padStart(2, '0');

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    dateStr: `${yyyy}-${mm}-${dd}`,
    timeStr: `${hh}:${min}:${ss}`
  };
}

/**
 * Returns today's date string ('YYYY-MM-DD') strictly in Indonesia timezone (Asia/Jakarta / WIB)
 */
export function getTodayWIB(date: Date = new Date()): string {
  return getNowWIBParts(date).dateStr;
}

/**
 * Returns current { year, monthIndex (0-11), day } in Indonesia timezone (Asia/Jakarta / WIB)
 */
export function getCurrentYearMonthWIB(date: Date = new Date()): {
  year: number;
  monthIndex: number;
  day: number;
} {
  const { year, month, day } = getNowWIBParts(date);
  return {
    year,
    monthIndex: month - 1,
    day
  };
}

/**
 * Shifts a 'YYYY-MM-DD' string by daysDelta days without any timezone drift
 */
export function shiftDateString(dateStr: string, daysDelta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return getTodayWIB();
  const utc = new Date(Date.UTC(y, m - 1, d + daysDelta));
  const yyyy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(utc.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Returns a 'YYYY-MM-DD' date string offset by daysOffset from today in Indonesia timezone (WIB)
 */
export function getRelativeDateWIB(daysOffset: number, baseDate: Date = new Date()): string {
  const todayStr = getTodayWIB(baseDate);
  if (daysOffset === 0) return todayStr;
  return shiftDateString(todayStr, daysOffset);
}

/**
 * Computes exact day difference (dateA - dateB) between two 'YYYY-MM-DD' strings
 */
export function diffDaysDateStrings(dateAStr: string, dateBStr: string): number {
  const [yA, mA, dA] = dateAStr.split('-').map(Number);
  const [yB, mB, dB] = dateBStr.split('-').map(Number);
  if (!yA || !mA || !dA || !yB || !mB || !dB) return 0;
  const utcA = Date.UTC(yA, mA - 1, dA);
  const utcB = Date.UTC(yB, mB - 1, dB);
  return Math.round((utcA - utcB) / (1000 * 3600 * 24));
}

/**
 * Formats a 'YYYY-MM-DD' date string using Indonesian locale in Asia/Jakarta timezone
 */
export function formatDateIsoId(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  // Noon UTC corresponds to 19:00 WIB on the exact same calendar day
  const safeUtcNoon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return safeUtcNoon.toLocaleDateString('id-ID', {
    ...options,
    timeZone: INDONESIA_TIMEZONE
  });
}

/**
 * Returns the 7 days (Monday..Sunday) for a given weekOffset relative to today in WIB
 */
export function getWeekDaysWIB(weekOffset: number = 0, referenceDateStr?: string) {
  const baseStr = referenceDateStr || getTodayWIB();
  const targetStr = shiftDateString(baseStr, weekOffset * 7);
  const [y, m, d] = targetStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d));
  const dayOfWeek = utcDate.getUTCDay(); // 0 (Sun) .. 6 (Sat)
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mondayStr = shiftDateString(targetStr, offsetToMonday);
  const [mondayYear] = mondayStr.split('-').map(Number);

  const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const fullDayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

  const days = Array.from({ length: 7 }, (_, i) => {
    const dateIso = shiftDateString(mondayStr, i);
    return {
      dateIso,
      dayName: dayNames[i],
      fullDayName: fullDayNames[i],
      dateLabel: formatDateIsoId(dateIso, { day: 'numeric', month: 'short' }),
      fullFormatted: formatDateIsoId(dateIso, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    };
  });

  return {
    days,
    mondayYear
  };
}

/**
 * React hook that tracks today's date in Indonesia timezone (Asia/Jakarta / WIB)
 * and automatically updates when midnight (00:00 WIB) passes in real time.
 */
export function useTodayWIB(): string {
  const [todayWIB, setTodayWIB] = useState<string>(() => getTodayWIB());

  useEffect(() => {
    const checkDateRollover = () => {
      const current = getTodayWIB();
      setTodayWIB(prev => (prev !== current ? current : prev));
    };

    const intervalId = setInterval(checkDateRollover, 15000);
    window.addEventListener('focus', checkDateRollover);
    document.addEventListener('visibilitychange', checkDateRollover);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', checkDateRollover);
      document.removeEventListener('visibilitychange', checkDateRollover);
    };
  }, []);

  return todayWIB;
}
