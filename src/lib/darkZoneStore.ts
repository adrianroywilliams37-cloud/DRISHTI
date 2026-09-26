/**
 * DRISHTI Dark Zone IndexedDB Wrapper
 * Author: Adrian Roy Williams
 * Role: Locally stores encrypted telemetry and binary assets when operating offline.
 */

import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'DrishtiDarkZoneDB';
const STORE_NAME = 'telemetry_outbox';

export interface OfflineTelemetryPayload {
  id?: number;
  projectId: string;
  telemetryData: any;
  interrogationAnswers: Record<number, string>;
  pdfBlob?: Blob | null;
  photoBlob?: Blob | null;
  authToken?: string;
  queued_at?: string;
  status?: 'AWAITING_SYNC' | 'SYNCING' | 'SYNCED';
}

// Initialize the local database
export const initDarkZoneDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // We use an auto-incrementing key to queue multiple offline reports
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

// Write a comprehensive payload to the offline outbox
export const queueOfflineTelemetry = async (payload: OfflineTelemetryPayload): Promise<void> => {
  // Enforce quota limits to prevent IDB crash
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    if (estimate.usage && estimate.quota) {
      const percentage = (estimate.usage / estimate.quota) * 100;
      if (percentage > 90) {
        throw new Error('LOCAL_STORAGE_QUOTA_EXCEEDED');
      }
    }
  }

  const db = await initDarkZoneDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.objectStore(STORE_NAME).add({
    ...payload,
    queued_at: new Date().toISOString(),
    status: 'AWAITING_SYNC'
  });
  await tx.done;
};

// Read all queued payloads (Used by the Service Worker)
export const getQueuedTelemetry = async (): Promise<OfflineTelemetryPayload[]> => {
  const db = await initDarkZoneDB();
  return db.getAll(STORE_NAME);
};

// Get count of pending items (for UI badge)
export const getPendingCount = async (): Promise<number> => {
  const db = await initDarkZoneDB();
  return db.count(STORE_NAME);
};

// Remove a payload once successfully synced
export const clearSyncedTelemetry = async (id: number): Promise<void> => {
  const db = await initDarkZoneDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.objectStore(STORE_NAME).delete(id);
  await tx.done;
};
