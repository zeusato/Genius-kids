import { useCallback, useEffect, useState } from 'react';
import { listLibrary, saveLibraryEntry, type LibraryEntry } from './library';

export function useLibrary(owner: string) {
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    setReady(false);
    listLibrary(owner).then(rows => { if (active) { setEntries(rows); setReady(true); } }).catch(() => { if (active) setError('Chưa đọc được dấu trang và bộ từ đã lưu.'); });
    return () => { active = false; };
  }, [owner]);
  const save = useCallback(async (entry: Omit<LibraryEntry, 'studentId'>) => {
    try {
      const next = { ...entry, studentId: owner };
      await saveLibraryEntry(next);
      setEntries(rows => [...rows.filter(row => row.id !== next.id), next]);
      setError('');
      return true;
    } catch { setError('Chưa lưu được thay đổi. Hãy thử lại.'); return false; }
  }, [owner]);
  return { entries, save, error, ready };
}
