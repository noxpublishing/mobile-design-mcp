import { decodeQueue, type QueueState } from './queue.ts';

export interface StorageAdapter { read(): Promise<string | null>; write(value: string): Promise<void>; }

export function createQueuePersistence(adapter: StorageAdapter) {
  let tail = Promise.resolve();
  return {
    load() {
      const operation = tail.then(async () => decodeQueue(await adapter.read()));
      tail = operation.then(() => {}, () => {});
      return operation;
    },
    save(state: QueueState) {
      const snapshot = JSON.stringify(state);
      const operation = tail.then(() => adapter.write(snapshot));
      // A failed request must reach its caller without poisoning later retries.
      tail = operation.catch(() => {});
      return operation;
    },
  };
}
