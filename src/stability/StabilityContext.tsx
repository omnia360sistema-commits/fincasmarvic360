import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { executeWorkRecordInsert } from '@/hooks/useOperaciones';
import type { TablesInsert } from '@/integrations/supabase/types';
import * as draftStore from './draftStore';
import * as sendQueue from './sendQueue';
import type { QueueItem } from './types';

type QueueExecutor = (payload: unknown) => Promise<void>;

interface StabilityContextValue {
  enqueue: (args: {
    operationKey: string;
    payload: unknown;
    linkedDraftScope?: string;
    clientId: string;
  }) => Promise<QueueItem>;
  retryQueueNow: () => Promise<void>;
  discardQueueItem: (id: string) => Promise<void>;
  pendingQueueCount: number;
  queueErrorCount: number;
  refreshQueueStats: () => Promise<void>;
}

const StabilityContext = createContext<StabilityContextValue | null>(null);

const WORK_RECORD_INSERT = 'work_record_insert';

export function StabilityProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const executorsRef = useRef<Map<string, QueueExecutor>>(new Map());
  const processingRef = useRef(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  const refreshQueueStats = useCallback(async () => {
    const all = await sendQueue.listQueue();
    setPendingCount(all.length);
    setErrorCount(all.filter((q) => !!q.lastError).length);
  }, []);

  useEffect(() => {
    void refreshQueueStats();
  }, [refreshQueueStats]);

  useEffect(() => {
    executorsRef.current.set(WORK_RECORD_INSERT, (payload) =>
      executeWorkRecordInsert(queryClient, payload as TablesInsert<'work_records'>),
    );
    return () => {
      executorsRef.current.delete(WORK_RECORD_INSERT);
    };
  }, [queryClient]);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    processingRef.current = true;
    try {
      const ready = await sendQueue.listQueueReady();
      for (const item of ready) {
        const exec = executorsRef.current.get(item.operationKey);
        if (!exec) continue;
        if (item.linkedDraftScope) {
          await draftStore.updateDraftStatus(item.linkedDraftScope, 'pending');
        }
        try {
          await exec(item.payload);
          await sendQueue.removeQueueItem(item.id);
          if (item.linkedDraftScope) {
            await draftStore.removeDraft(item.linkedDraftScope);
          }
          toast({
            title: 'Envío completado',
            description: 'Un elemento en cola se sincronizó correctamente.',
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          await sendQueue.updateQueueItemAfterFailure(item.id, msg);
          if (item.linkedDraftScope) {
            await draftStore.updateDraftStatus(item.linkedDraftScope, 'error');
          }
        }
      }
    } finally {
      processingRef.current = false;
      await refreshQueueStats();
    }
  }, [refreshQueueStats]);

  const enqueue = useCallback(
    async (args: {
      operationKey: string;
      payload: unknown;
      linkedDraftScope?: string;
      clientId: string;
    }) => {
      const item = await sendQueue.enqueueItem({
        operationKey: args.operationKey,
        payload: args.payload,
        linkedDraftScope: args.linkedDraftScope,
        clientId: args.clientId,
      });
      if (args.linkedDraftScope) {
        await draftStore.updateDraftStatus(args.linkedDraftScope, 'pending');
      }
      await refreshQueueStats();
      void processQueue();
      return item;
    },
    [processQueue, refreshQueueStats],
  );

  const retryQueueNow = useCallback(async () => {
    const all = await sendQueue.listQueue();
    for (const q of all) {
      if (q.linkedDraftScope) {
        await draftStore.updateDraftStatus(q.linkedDraftScope, 'pending');
      }
    }
    await sendQueue.bumpAllRetriesReady();
    await refreshQueueStats();
    await processQueue();
  }, [processQueue, refreshQueueStats]);

  const discardQueueItem = useCallback(
    async (id: string) => {
      const ok = window.confirm(
        '¿Descartar este envío pendiente? Los datos no se enviarán al servidor.',
      );
      if (!ok) return;
      await sendQueue.removeQueueItem(id);
      await refreshQueueStats();
      toast({ title: 'Elemento eliminado de la cola' });
    },
    [refreshQueueStats],
  );

  useEffect(() => {
    void processQueue();
    const id = window.setInterval(() => void processQueue(), 45_000);
    const onOnline = () => void processQueue();
    window.addEventListener('online', onOnline);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('online', onOnline);
    };
  }, [processQueue]);

  const value = useMemo<StabilityContextValue>(
    () => ({
      enqueue,
      retryQueueNow,
      discardQueueItem,
      pendingQueueCount: pendingCount,
      queueErrorCount: errorCount,
      refreshQueueStats,
    }),
    [enqueue, retryQueueNow, discardQueueItem, pendingCount, errorCount, refreshQueueStats],
  );

  return <StabilityContext.Provider value={value}>{children}</StabilityContext.Provider>;
}

export function useStability(): StabilityContextValue {
  const ctx = useContext(StabilityContext);
  if (!ctx) {
    throw new Error('useStability debe usarse dentro de StabilityProvider');
  }
  return ctx;
}
