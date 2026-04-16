const DB_NAME = 'marvic-stability-v1';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export function getStabilityDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'scope' });
        }
        if (!db.objectStoreNames.contains('queue')) {
          db.createObjectStore('queue', { keyPath: 'id' });
        }
      };
    });
  }
  return dbPromise;
}

export async function idbGet<T>(store: 'drafts' | 'queue', key: string): Promise<T | undefined> {
  const db = await getStabilityDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result as T | undefined);
  });
}

export async function idbGetAll<T>(store: 'drafts' | 'queue'): Promise<T[]> {
  const db = await getStabilityDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve((req.result ?? []) as T[]);
  });
}

export async function idbPut(store: 'drafts' | 'queue', value: unknown): Promise<void> {
  const db = await getStabilityDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(store).put(value);
  });
}

export async function idbDelete(store: 'drafts' | 'queue', key: string): Promise<void> {
  const db = await getStabilityDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(store).delete(key);
  });
}
