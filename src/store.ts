import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Flow, Platform, Recording, ReferenceApp } from './types.js';

export class Store {
  readonly db: DatabaseSync;
  constructor(readonly root: string) {
    mkdirSync(root, { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(join(root, 'library.db'));
    this.db.exec(`
      PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS apps(id TEXT PRIMARY KEY, payload TEXT NOT NULL);
      CREATE VIRTUAL TABLE IF NOT EXISTS apps_fts USING fts5(id UNINDEXED, text, tokenize='porter unicode61');
      CREATE TABLE IF NOT EXISTS recordings(id TEXT PRIMARY KEY, payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS flows(id TEXT PRIMARY KEY, payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS meta(id TEXT PRIMARY KEY, payload TEXT NOT NULL);
    `);
  }
  close() { this.db.close(); }
  upsertApps(apps: ReferenceApp[]) {
    this.db.exec('BEGIN');
    try {
      const upsert = this.db.prepare('INSERT INTO apps VALUES(?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload');
      const remove = this.db.prepare('DELETE FROM apps_fts WHERE id=?');
      const add = this.db.prepare('INSERT INTO apps_fts(id,text) VALUES(?,?)');
      for (const app of apps) {
        upsert.run(app.id, JSON.stringify(app)); remove.run(app.id);
        add.run(app.id, [app.name, app.description, ...app.tags, ...app.awards.map(a => a.category)].join(' '));
      }
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  getApp(id: string): ReferenceApp | null { return this.read('apps', id); }
  searchApps(args: { query?: string; platform?: Platform; awardsOnly?: boolean; limit?: number } = {}) {
    const terms = args.query?.match(/[\p{L}\p{N}-]+/gu) ?? [];
    const where: string[] = []; const parameters: (string | number)[] = [];
    let sql = 'SELECT a.payload FROM apps a';
    if (terms.length) {
      sql += ' JOIN apps_fts ON apps_fts.id=a.id';
      where.push('apps_fts MATCH ?'); parameters.push(terms.map(t => `"${t}"*`).join(' AND '));
    }
    if (args.platform) {
      where.push("EXISTS (SELECT 1 FROM json_each(a.payload, '$.platforms') WHERE value=?)");
      parameters.push(args.platform);
    }
    if (args.awardsOnly) where.push("json_array_length(json_extract(a.payload,'$.awards'))>0");
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += terms.length ? ' ORDER BY bm25(apps_fts)' : " ORDER BY json_extract(a.payload,'$.name')";
    sql += ' LIMIT ?'; parameters.push(Math.min(100, Math.max(1, args.limit ?? 12)));
    return this.db.prepare(sql).all(...parameters).map(row => JSON.parse(String(row.payload)) as ReferenceApp);
  }
  private read<T>(table: 'apps' | 'recordings' | 'flows' | 'meta', id: string): T | null {
    const row = this.db.prepare(`SELECT payload FROM ${table} WHERE id=?`).get(id);
    return row ? JSON.parse(String(row.payload)) as T : null;
  }
  private write(table: 'recordings' | 'flows' | 'meta', id: string, value: unknown) {
    this.db.prepare(`INSERT INTO ${table} VALUES(?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload`).run(id, JSON.stringify(value));
  }
  getRecording(id: string): Recording | null { return this.read('recordings', id); }
  putRecording(recording: Recording) { this.write('recordings', recording.id, recording); }
  listRecordings(args: { platform?: Platform; appId?: string; limit?: number } = {}): Recording[] {
    const rows = this.db.prepare('SELECT payload FROM recordings ORDER BY rowid DESC').all();
    return rows.map(row => JSON.parse(String(row.payload)) as Recording)
      .filter(r => (!args.platform || r.platform === args.platform) && (!args.appId || r.appId === args.appId))
      .slice(0, args.limit ?? 30);
  }
  putFlow(flow: Flow) { this.write('flows', flow.id, flow); }
  getFlow(id: string): Flow | null { return this.read('flows', id); }
  setMeta(id: string, value: unknown) { this.write('meta', id, value); }
  getMeta<T>(id: string): T | null { return this.read('meta', id); }
  counts() {
    return Object.fromEntries(['apps', 'recordings', 'flows'].map(table => [table, Number(this.db.prepare(`SELECT count(*) AS n FROM ${table}`).get()?.n ?? 0)]));
  }
}
