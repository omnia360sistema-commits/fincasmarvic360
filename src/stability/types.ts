/** Tipos de borrador / cola centralizados (cliente únicamente). */

export type DraftStatus = 'draft' | 'pending' | 'error' | 'sent';

export type DraftType =
  | 'trabajo'
  | 'parte_diario'
  | 'parte_estado_finca'
  | string;

export interface DraftRecord {
  scope: string;
  type: DraftType;
  status: DraftStatus;
  data: unknown;
  createdAt: number;
  updatedAt: number;
}

export interface QueueItem {
  id: string;
  /** Idempotencia local: un mismo envío no duplica filas en cola. */
  clientId: string;
  operationKey: string;
  payload: unknown;
  createdAt: number;
  retryCount: number;
  lastError?: string;
  nextRetryAt: number;
  /** Opcional: borrador asociado para marcar sent / error */
  linkedDraftScope?: string;
}
