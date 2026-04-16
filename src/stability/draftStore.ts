import type { DraftRecord, DraftStatus } from './types';
import { idbDelete, idbGet, idbGetAll, idbPut } from './idb';

export async function saveDraft(
  partial: Omit<DraftRecord, 'createdAt' | 'updatedAt'> & { createdAt?: number }
): Promise<void> {
  const now = Date.now();
  const existing = await idbGet<DraftRecord>('drafts', partial.scope);
  const row: DraftRecord = {
    ...partial,
    createdAt: existing?.createdAt ?? partial.createdAt ?? now,
    updatedAt: now,
  };
  await idbPut('drafts', row);
}

export async function getDraft(scope: string): Promise<DraftRecord | undefined> {
  return idbGet<DraftRecord>('drafts', scope);
}

export async function listDrafts(): Promise<DraftRecord[]> {
  return idbGetAll<DraftRecord>('drafts');
}

export async function removeDraft(scope: string): Promise<void> {
  await idbDelete('drafts', scope);
}

export async function updateDraftStatus(scope: string, status: DraftStatus): Promise<void> {
  const row = await getDraft(scope);
  if (!row) return;
  await saveDraft({ ...row, status });
}
