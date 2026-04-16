import type { QueueItem } from './types';
import { idbDelete, idbGetAll, idbPut } from './idb';

function backoffMs(retryCount: number): number {
  const base = 8000;
  const max = 5 * 60 * 1000;
  return Math.min(base * Math.pow(2, retryCount), max);
}

function normalizeQueueRow(row: QueueItem): QueueItem {
  return {
    ...row,
    clientId: row.clientId ?? row.id,
  };
}

export async function enqueueItem(
  item: Omit<QueueItem, 'id' | 'createdAt' | 'retryCount' | 'nextRetryAt' | 'clientId'> & {
    id?: string;
    retryCount?: number;
    clientId: string;
  },
): Promise<QueueItem> {
  const now = Date.now();
  const all = await listQueue();
  const dup = all.find((q) => q.clientId === item.clientId);
  if (dup) {
    const updated: QueueItem = normalizeQueueRow({
      ...dup,
      operationKey: item.operationKey,
      payload: item.payload,
      linkedDraftScope: item.linkedDraftScope ?? dup.linkedDraftScope,
      createdAt: dup.createdAt,
      nextRetryAt: now,
      retryCount: 0,
      lastError: undefined,
    });
    await idbPut('queue', updated);
    return updated;
  }
  const full: QueueItem = {
    id: item.id ?? crypto.randomUUID(),
    clientId: item.clientId,
    operationKey: item.operationKey,
    payload: item.payload,
    createdAt: now,
    retryCount: item.retryCount ?? 0,
    lastError: item.lastError,
    nextRetryAt: now,
    linkedDraftScope: item.linkedDraftScope,
  };
  await idbPut('queue', full);
  return full;
}

export async function listQueue(): Promise<QueueItem[]> {
  const rows = await idbGetAll<QueueItem>('queue');
  return rows.map(normalizeQueueRow);
}

export async function removeQueueItem(id: string): Promise<void> {
  await idbDelete('queue', id);
}

export async function updateQueueItemAfterFailure(id: string, err: string): Promise<void> {
  const all = await listQueue();
  const row = all.find((q) => q.id === id);
  if (!row) return;
  const retryCount = row.retryCount + 1;
  const updated: QueueItem = {
    ...normalizeQueueRow(row),
    retryCount,
    lastError: err,
    nextRetryAt: Date.now() + backoffMs(retryCount),
  };
  await idbPut('queue', updated);
}

export async function listQueueReady(now = Date.now()): Promise<QueueItem[]> {
  const all = await listQueue();
  return all.filter((q) => q.nextRetryAt <= now);
}

export async function bumpAllRetriesReady(): Promise<void> {
  const all = await listQueue();
  const now = Date.now();
  for (const q of all) {
    await idbPut('queue', { ...normalizeQueueRow(q), nextRetryAt: now });
  }
}
