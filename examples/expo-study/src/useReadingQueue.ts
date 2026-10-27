import { useCallback, useEffect, useRef, useState } from 'react';
import { initialQueue, moveItem, toggleRead, type QueueState } from './queue.ts';
import { queuePersistence } from './storage.ts';

export function useReadingQueue() {
  const [state, setState] = useState(initialQueue);
  const current = useRef(state);
  const history = useRef<QueueState[]>([]);
  const alive = useRef(false);
  const revision = useRef(0);
  const hydration = useRef(0);
  const readyRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = useCallback((next: QueueState) => {
    const request = ++revision.current; setSaving(true); setError(null);
    queuePersistence.save(next).then(() => {
      if (alive.current && request === revision.current) setSaving(false);
    }).catch(() => {
      if (alive.current && request === revision.current) {
        setSaving(false); setError('Your changes are kept here, but could not be saved. Try saving again.');
      }
    });
  }, []);

  const load = useCallback(async () => {
    const request = ++hydration.current;
    setLoading(true); setError(null); readyRef.current = false; setReady(false);
    try {
      const saved = await queuePersistence.load();
      if (!alive.current || request !== hydration.current) return;
      current.current = saved; history.current = []; setState(saved); readyRef.current = true; setReady(true);
    } catch {
      if (alive.current && request === hydration.current) setError('Your saved list could not be opened. Retry, or choose a fresh list. The saved data stays until you choose.');
    } finally { if (alive.current && request === hydration.current) setLoading(false); }
  }, []);

  useEffect(() => { alive.current = true; void load(); return () => { alive.current = false; ++hydration.current; }; }, [load]);

  const commit = useCallback((next: QueueState) => {
    if (!readyRef.current || next === current.current) return;
    history.current = [...history.current.slice(-19), current.current];
    current.current = next; setState(next); save(next);
  }, [save]);

  const move = useCallback((from: number, to: number) => commit(moveItem(current.current, from, to)), [commit]);
  const toggle = useCallback((id: string) => commit(toggleRead(current.current, id)), [commit]);
  const undo = useCallback(() => {
    if (!readyRef.current) return;
    const previous = history.current.pop();
    if (!previous) return;
    current.current = previous; setState(previous); save(previous);
  }, [save]);
  const fresh = useCallback(() => {
    ++hydration.current;
    const next = initialQueue(); current.current = next; history.current = []; setState(next);
    readyRef.current = true; setReady(true); setLoading(false); save(next);
  }, [save]);
  const retrySave = useCallback(() => save(current.current), [save]);
  return { state, ready, loading, saving, error, canUndo: history.current.length > 0, move, toggle, undo, load, fresh, retrySave };
}
