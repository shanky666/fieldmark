/**
 * Offline queue store with cross-platform storage:
 * - Native (iOS/Android): expo-sqlite (persistent across restarts)
 * - Web: in-memory array (sufficient for browser dev/demo)
 */
import { Platform } from 'react-native';
import { create } from 'zustand';

// ─── SQLite (native only) ────────────────────────────────────────────────────
let db: import('expo-sqlite').SQLiteDatabase | null = null;

if (Platform.OS !== 'web') {
  const SQLite = require('expo-sqlite');
  db = SQLite.openDatabaseSync('fieldmark.db');
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface OfflineRecord {
  id: number;
  latitude: number;
  longitude: number;
  photo_local_uri: string;
  device_id: string;
  marked_at: string;
  queued_at: string;
  sync_attempts: number;
  last_attempt_at: string | null;
  error_detail: string | null;
}

interface OfflineQueueState {
  queueCount: number;
  queue: OfflineRecord[];
  initDb: () => void;
  addToQueue: (record: Omit<OfflineRecord, 'id' | 'sync_attempts' | 'last_attempt_at' | 'error_detail'>) => void;
  removeFromQueue: (id: number) => void;
  updateSyncAttempt: (id: number, attempts: number, error: string) => void;
  loadQueue: () => void;
}

// ─── In-memory fallback for web ───────────────────────────────────────────────
let _memQueue: OfflineRecord[] = [];
let _nextId = 1;

// ─── Store ───────────────────────────────────────────────────────────────────
export const useOfflineQueueStore = create<OfflineQueueState>((set, get) => ({
  queueCount: 0,
  queue: [],

  initDb: () => {
    if (Platform.OS === 'web') {
      // Nothing to initialise for in-memory store
      get().loadQueue();
      return;
    }
    try {
      db!.execSync(`
        CREATE TABLE IF NOT EXISTS offline_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          photo_local_uri TEXT NOT NULL,
          device_id TEXT NOT NULL,
          marked_at TEXT NOT NULL,
          queued_at TEXT NOT NULL,
          sync_attempts INTEGER DEFAULT 0,
          last_attempt_at TEXT,
          error_detail TEXT
        );
      `);
      get().loadQueue();
    } catch (error) {
      console.error('SQLite DB initialization failed', error);
    }
  },

  addToQueue: (record) => {
    if (Platform.OS === 'web') {
      const newRecord: OfflineRecord = {
        ...record,
        id: _nextId++,
        sync_attempts: 0,
        last_attempt_at: null,
        error_detail: null,
      };
      _memQueue = [..._memQueue, newRecord];
      get().loadQueue();
      return;
    }
    try {
      db!.runSync(
        `INSERT INTO offline_queue (latitude, longitude, photo_local_uri, device_id, marked_at, queued_at)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [record.latitude, record.longitude, record.photo_local_uri, record.device_id, record.marked_at, record.queued_at]
      );
      get().loadQueue();
    } catch (error) {
      console.error('Failed to add record to SQLite queue', error);
      throw error;
    }
  },

  removeFromQueue: (id) => {
    if (Platform.OS === 'web') {
      _memQueue = _memQueue.filter((r) => r.id !== id);
      get().loadQueue();
      return;
    }
    try {
      db!.runSync(`DELETE FROM offline_queue WHERE id = ?;`, [id]);
      get().loadQueue();
    } catch (error) {
      console.error('Failed to delete record from SQLite queue', error);
    }
  },

  updateSyncAttempt: (id, attempts, error) => {
    const now = new Date().toISOString();
    if (Platform.OS === 'web') {
      _memQueue = _memQueue.map((r) =>
        r.id === id ? { ...r, sync_attempts: attempts, last_attempt_at: now, error_detail: error } : r
      );
      get().loadQueue();
      return;
    }
    try {
      db!.runSync(
        `UPDATE offline_queue SET sync_attempts = ?, last_attempt_at = ?, error_detail = ? WHERE id = ?;`,
        [attempts, now, error, id]
      );
      get().loadQueue();
    } catch (err) {
      console.error('Failed to update sync attempts in SQLite', err);
    }
  },

  loadQueue: () => {
    if (Platform.OS === 'web') {
      set({ queue: _memQueue, queueCount: _memQueue.length });
      return;
    }
    try {
      const rows = db!.getAllSync('SELECT * FROM offline_queue ORDER BY id ASC;') as OfflineRecord[];
      set({ queue: rows, queueCount: rows.length });
    } catch (error) {
      console.error('Failed to fetch records from SQLite', error);
    }
  },
}));
