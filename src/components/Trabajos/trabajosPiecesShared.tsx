import React from 'react';
import {
  AlertTriangle, X, Clock,
  MapPin, LogOut, ChevronLeft, ChevronRight,
  Calendar, Layers, Leaf, Tractor, Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  usePlanificacionDia, useAddTrabajoPlanificado, useUpdateTrabajoPlanificado,
  useDeleteTrabajo,
  usePlanificacionCampana, useAddPlanificacionCampana,
  useUpdatePlanificacionCampana, useDeletePlanificacionCampana,
  useAddIncidencia, useUpdateIncidencia, useDeleteIncidencia,
  TrabajoRegistro, TrabajoRegistroPlanificado, TrabajoIncidencia, PlanificacionCampana,
  EstadoPlanificacion, Prioridad, EstadoCampana,
} from '../../hooks/useTrabajos';
import { useParcelas, useCropCatalog } from '../../hooks/useParcelData';
import { usePersonal, useTiposTrabajoCatalogoPersonal, useAddTipoTrabajoCatalogo } from '../../hooks/usePersonal';
import { useCatalogoLocal } from '@/hooks/useCatalogoLocal';
import { useTractores, useAperos } from '../../hooks/useMaquinaria';
import { SelectWithOther, AudioInput, PhotoAttachment, RecordActions } from '@/components/base';
import { FINCAS_NOMBRES as FINCAS } from '../../constants/farms';
import { TIPOS_TRABAJO } from '../../constants/tiposTrabajo';
import { uploadImage, buildStoragePath } from '../../utils/uploadImage';
import { formatFechaCorta } from '../../utils/dateFormat';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormError } from '@/components/base/FormError';

// ── Constantes ───────────────────────────────────────────────

export const INPUT = 'w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#6d9b7d]/50 focus:outline-none';

const PRIORIDAD_STYLES: Record<Prioridad, { border: string; text: string; label: string }> = {
  alta:  { border: 'border-red-500',    text: 'text-red-400',    label: 'ALTA' },
  media: { border: 'border-slate-500',  text: 'text-slate-400',  label: 'MEDIA' },
  baja:  { border: 'border-slate-600',  text: 'text-slate-500',  label: 'BAJA' },
};

const ESTADO_PLAN_STYLES: Record<EstadoPlanificacion, { border: string; text: string }> = {
  borrador:   { border: 'border-slate-500',  text: 'text-slate-400' },
  confirmado: { border: 'border-emerald-600',   text: 'text-emerald-400' },
  ejecutado:  { border: 'border-green-500',  text: 'text-green-400' },
  pendiente:  { border: 'border-red-500',    text: 'text-red-400' },
  cancelado:  { border: 'border-slate-600',  text: 'text-slate-500' },
};

// ── Esquemas Zod ─────────────────────────────────────────────
export const trabajoSchema = z.object({
  fecha_planificada: z.string().min(1, 'La fecha es obligatoria'),
  finca: z.string().optional().nullable(),
  parcel_id: z.string().optional().nullable(),
  tipo_bloque: z.enum(['logistica', 'maquinaria_agricola', 'mano_obra_interna', 'mano_obra_externa']),
  tipo_trabajo: z.string().min(1, 'El tipo de trabajo es obligatorio'),
  recursos_personal: z.array(z.string()).default([]),
  tractor_id: z.string().optional().nullable(),
  apero_id: z.string().optional().nullable(),
  prioridad: z.enum(['alta', 'media', 'baja']),
  estado_planificacion: z.enum(['borrador', 'confirmado', 'ejecutado', 'pendiente', 'cancelado']),
  hora_inicio: z.string().optional().nullable(),
  hora_fin: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
}).refine(data => {
  if (data.hora_fin && !data.hora_inicio) return false;
  if (data.hora_inicio && data.hora_fin) return data.hora_inicio <= data.hora_fin;
  return true;
}, {
  message: "La hora de fin no puede ser anterior a la hora de inicio",
  path: ["hora_fin"]
});

export type TrabajoFormValues = z.infer<typeof trabajoSchema>;

export function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(fecha: string, n: number): string {
  const d = new Date(fecha + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function fmtFecha(f: string): string {
  try { return new Date(f + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }); }
  catch { return f; }
}

// ── Badge Prioridad ───────────────────────────────────────────
export const BadgePrioridad = React.memo(function BadgePrioridad({ p }: { p: Prioridad | null }) {
  if (!p) return null;
  const s = PRIORIDAD_STYLES[p];
  return (
    <span className={`inline-block border rounded px-1.5 py-0.5 text-[8px] font-black tracking-widest ${s.border} ${s.text}`}>
      {s.label}
    </span>
  );
});

// ── Badge Estado ──────────────────────────────────────────────
export const BadgeEstado = React.memo(function BadgeEstado({ e }: { e: EstadoPlanificacion | null }) {
  if (!e) return null;
  const s = ESTADO_PLAN_STYLES[e];
  return (
    <span className={`inline-block border rounded px-1.5 py-0.5 text-[8px] font-black tracking-widest uppercase ${s.border} ${s.text}`}>
      {e}
    </span>
  );
});
