import { readingItems } from './readingItems.ts';

export interface QueueState { schema: 'folio-study-v1'; order: string[]; completed: string[]; }
const ids = readingItems.map(item => item.id);
export const initialQueue = (): QueueState => ({ schema: 'folio-study-v1', order: [...ids], completed: [] });

export function isQueueState(value: unknown): value is QueueState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  if (Object.keys(row).sort().join(',') !== 'completed,order,schema' || row.schema !== 'folio-study-v1') return false;
  return Array.isArray(row.order) && row.order.length === ids.length && new Set(row.order).size === ids.length
    && row.order.every(id => typeof id === 'string' && ids.includes(id))
    && Array.isArray(row.completed) && new Set(row.completed).size === row.completed.length
    && row.completed.every(id => typeof id === 'string' && ids.includes(id));
}

export function decodeQueue(raw: string | null): QueueState {
  if (raw === null) return initialQueue();
  const value: unknown = JSON.parse(raw);
  if (!isQueueState(value)) throw new Error('The saved reading list cannot be read by this version.');
  return value;
}

export function moveItem(state: QueueState, from: number, to: number): QueueState {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= state.order.length || to >= state.order.length || from === to) return state;
  const order = [...state.order]; const [id] = order.splice(from, 1); order.splice(to, 0, id);
  return { ...state, order };
}

export function toggleRead(state: QueueState, id: string): QueueState {
  if (!ids.includes(id)) return state;
  return { ...state, completed: state.completed.includes(id) ? state.completed.filter(item => item !== id) : [...state.completed, id] };
}
