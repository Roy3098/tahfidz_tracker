import { useState, useEffect, useCallback, SetStateAction, Dispatch } from 'react';
import { getTodayWIB } from './dateWIB';

/**
 * Custom React hook that persists state in localStorage so active pages, tabs,
 * and filters are remembered across page reloads and browser restarts.
 */
export function usePersistedState<T>(
  storageKey: string,
  initialValue: T | (() => T)
): [T, Dispatch<SetStateAction<T>>] {
  const readFallback = useCallback((): T => {
    return typeof initialValue === 'function'
      ? (initialValue as () => T)()
      : initialValue;
  }, [initialValue]);

  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (parsed !== undefined && parsed !== null) {
          return parsed as T;
        }
      }
    } catch (e) {
      console.warn(`Failed to read persisted state for ${storageKey}:`, e);
    }
    return readFallback();
  });

  useEffect(() => {
    try {
      if (state === undefined) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, JSON.stringify(state));
      }
    } catch (e) {
      console.warn(`Failed to write persisted state for ${storageKey}:`, e);
    }
  }, [storageKey, state]);

  return [state, setState];
}

/**
 * Persists a date filter (YYYY-MM-DD) while still respecting automatic day rollover
 * at 00:00 WIB when the user had not manually locked onto a different historical date.
 */
export function usePersistedWIBDateState(
  storageKey: string
): [string, Dispatch<SetStateAction<string>>] {
  const [dateState, setDateState] = useState<string>(() => {
    const todayWIB = getTodayWIB();
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { value?: string; savedOnDayWIB?: string };
        if (parsed && typeof parsed.value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.value)) {
          // If a new WIB day has rolled over and the user was previously viewing "today",
          // advance automatically to the new WIB today; otherwise keep their chosen filter date.
          if (parsed.savedOnDayWIB && parsed.savedOnDayWIB !== todayWIB && parsed.value === parsed.savedOnDayWIB) {
            return todayWIB;
          }
          return parsed.value;
        }
      }
    } catch (e) {
      console.warn(`Failed to read persisted WIB date for ${storageKey}:`, e);
    }
    return todayWIB;
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          value: dateState,
          savedOnDayWIB: getTodayWIB()
        })
      );
    } catch (e) {
      console.warn(`Failed to write persisted WIB date for ${storageKey}:`, e);
    }
  }, [storageKey, dateState]);

  return [dateState, setDateState];
}
