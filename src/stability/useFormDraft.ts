import { useCallback, useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import * as draftStore from './draftStore';
import type { DraftStatus, DraftType } from './types';

export interface UseFormDraftOptions<T extends Record<string, unknown>> {
  scope: string;
  type: DraftType;
  enabled: boolean;
  snapshot: T;
  hydrate: (data: T) => void;
  debounceMs?: number;
}

/**
 * Borrador con debounce y recuperación al abrir / cambiar scope.
 */
export function useFormDraft<T extends Record<string, unknown>>({
  scope,
  type,
  enabled,
  snapshot,
  hydrate,
  debounceMs = 650,
}: UseFormDraftOptions<T>) {
  const hydrateRef = useRef(hydrate);
  hydrateRef.current = hydrate;
  const skipNextSave = useRef(false);

  useEffect(() => {
    if (!enabled || !scope) return;
    let cancelled = false;
    skipNextSave.current = true;
    void (async () => {
      try {
        const row = await draftStore.getDraft(scope);
        if (cancelled || !row?.data || typeof row.data !== 'object') {
          skipNextSave.current = false;
          return;
        }
        if (row.status === 'sent') {
          await draftStore.removeDraft(scope);
          skipNextSave.current = false;
          return;
        }
        if (row.status !== 'draft' && row.status !== 'error' && row.status !== 'pending') {
          skipNextSave.current = false;
          return;
        }
        hydrateRef.current(row.data as T);
        toast({
          title: 'Borrador recuperado',
          description: 'Se restauraron datos guardados en este dispositivo.',
        });
      } catch {
        /* IDB no disponible */
      } finally {
        skipNextSave.current = false;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scope, enabled]);

  useEffect(() => {
    if (!enabled || !scope) return;
    if (skipNextSave.current) return;
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const existing = await draftStore.getDraft(scope);
          let status: DraftStatus = 'draft';
          if (existing?.status === 'pending') status = 'pending';
          await draftStore.saveDraft({
            scope,
            type,
            status,
            data: snapshot,
          });
        } catch {
          /* ignorar */
        }
      })();
    }, debounceMs);
    return () => window.clearTimeout(t);
  }, [scope, type, enabled, debounceMs, snapshot]);

  const clearDraft = useCallback(async () => {
    try {
      await draftStore.removeDraft(scope);
    } catch {
      /* ignorar */
    }
  }, [scope]);

  return { clearDraft };
}
