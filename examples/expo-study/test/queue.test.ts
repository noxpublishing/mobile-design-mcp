import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeQueue, initialQueue, isQueueState, moveItem, toggleRead } from '../src/queue.ts';
import { createQueuePersistence } from '../src/persistence.ts';

test('reordering preserves all stable IDs and completion without mutating the prior state', () => {
  const initial = toggleRead(initialQueue(), 'margin');
  const next = moveItem(initial, 0, 3);
  assert.deepEqual(next.order, ['walk', 'draft', 'table', 'margin']);
  assert.deepEqual(next.completed, ['margin']);
  assert.deepEqual(initial.order, ['margin', 'walk', 'draft', 'table']);
  assert.equal(moveItem(initial, -1, 2), initial); assert.equal(moveItem(initial, 0, 9), initial);
  assert.deepEqual(toggleRead(next, 'margin').completed, []);
});

test('unknown or corrupt saved state is rejected instead of silently erasing it', () => {
  const initial = initialQueue();
  assert.deepEqual(decodeQueue(null), initial); assert.deepEqual(decodeQueue(JSON.stringify(initial)), initial);
  for (const value of [{ ...initial, schema: 'folio-study-v2' }, { ...initial, order: ['margin', 'margin', 'draft', 'table'] }, { ...initial, completed: ['unknown'] }, { ...initial, extra: true }]) {
    assert.equal(isQueueState(value), false); assert.throws(() => decodeQueue(JSON.stringify(value)));
  }
});

test('serialized persistence prevents a late older write from replacing newer state', async () => {
  const gates: Array<() => void> = []; const started: string[] = []; let stored: string | null = null;
  const persistence = createQueuePersistence({ read: async () => stored, write: value => new Promise<void>(resolve => { started.push(value); gates.push(() => { stored = value; resolve(); }); }) });
  const first = initialQueue(), second = toggleRead(first, 'walk');
  const a = persistence.save(first), b = persistence.save(second);
  await Promise.resolve(); assert.equal(started.length, 1);
  gates[0](); await a; await Promise.resolve(); assert.equal(started.length, 2);
  gates[1](); await b; assert.deepEqual(await persistence.load(), second);
});

test('failed writes are reported and a retry can persist the current state', async () => {
  let fail = true, stored: string | null = null;
  const persistence = createQueuePersistence({ read: async () => stored, write: async value => { if (fail) throw new Error('Fixture disk failure'); stored = value; } });
  const next = toggleRead(initialQueue(), 'draft');
  await assert.rejects(persistence.save(next), /Fixture disk failure/);
  fail = false; await persistence.save(next); assert.deepEqual(await persistence.load(), next);
});

test('remount hydration waits for an already pending save', async () => {
  let finish!: () => void;
  let stored = JSON.stringify(initialQueue()), reads = 0;
  const persistence = createQueuePersistence({
    read: async () => { reads++; return stored; },
    write: value => new Promise<void>(resolve => { finish = () => { stored = value; resolve(); }; }),
  });
  const latest = toggleRead(initialQueue(), 'margin');
  const save = persistence.save(latest);
  await Promise.resolve();
  const hydration = persistence.load();
  await Promise.resolve(); assert.equal(reads, 0);
  finish(); await save;
  assert.deepEqual(await hydration, latest);
});
