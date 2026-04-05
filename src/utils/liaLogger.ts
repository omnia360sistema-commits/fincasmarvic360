/**
 * liaLogger.ts — Logger silencioso para LIA (Infrastructura Agrícola Inteligente)
 * 
 * Registra eventos del sistema en lia_contexto_sesion sin bloquear operaciones.
 * NO lanza excepciones — graceful degradation si falla Supabase.
 * Funciona solo con conexión (navigator.onLine).
 */

import { supabase } from '@/integrations/supabase/client';

export interface LiaEventoPayload {
  [key: string]: unknown;
}

/**
 * Registra evento silenciosamente en lia_contexto_sesion
 * @param modulo — Nombre del módulo (trabajos, maquinaria, logistica, etc)
 * @param evento — Tipo de evento (trabajo_creado, uso_registrado, viaje_registrado, etc)
 * @param datos — JSONB con payload del evento
 */
export function logLiaEvento(
  modulo: string,
  evento: string,
  datos?: LiaEventoPayload
): void {
  // No bloquear si estamos offline
  if (!navigator.onLine) {
    return;
  }

  // FIre and forget — no await, no try-catch que bloquee
  supabase
    .from('lia_contexto_sesion')
    .insert({
      modulo,
      evento,
      datos: datos || {},
      procesado: false,
    })
    .catch(() => {
      // Silent fail — nunca lanzar excepción
    });
}

/**
 * Registra un patrón detectado en lia_patrones (uso futuro)
 * @param patron — Descripción del patrón
 * @param modulos — Array de módulos involucrados
 */
export function logLiaPatron(
  patron: string,
  modulos: string[]
): void {
  if (!navigator.onLine) {
    return;
  }

  supabase
    .from('lia_patrones')
    .insert({
      patron,
      modulos,
      frecuencia: 1,
      activo: true,
    })
    .catch(() => {
      // Silent fail
    });
}
