import React, { useState, useMemo } from 'react';
import { Truck, X, MapPin, Clock, Fuel, Wrench, Car } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  useAddCamion, useUpdateCamion,
  useAddVehiculoEmpresa, useUpdateVehiculoEmpresa,
  useAddViaje, useUpdateViaje,
  useMantenimientoCamion, useAddMantenimientoCamion, useUpdateMantenimientoCamion,
  useCombustible, useAddCombustible, useUpdateCombustible,
  type Camion, type VehiculoEmpresa, type Viaje, type MantenimientoCamion, type Combustible,
} from '@/hooks/useLogistica';
import type { Personal } from '@/hooks/usePersonal';
import { useCatalogoLocal } from '@/hooks/useCatalogoLocal';
import { SelectWithOther, AudioInput, PhotoAttachment } from '@/components/base';
import { uploadImage, buildStoragePath } from '@/utils/uploadImage';
import { FINCAS_NOMBRES as FINCAS } from '@/constants/farms';

// ── Tipos ─────────────────────────────────────────────────────

export type TabType = 'camiones' | 'vehiculos' | 'conductores' | 'viajes' | 'mantenimiento' | 'combustible';

// ── Constantes ────────────────────────────────────────────────

export const INPUT  = 'w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-400/50 focus:outline-none';
export const LABEL  = 'block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1';

export const MARCAS_CAMION   = ['MAN', 'Iveco', 'Volvo', 'DAF', 'Mercedes-Benz', 'Renault Trucks', 'Scania', 'FUSO'];
export const MODELOS_CAMION  = ['TGM', 'TGS', 'Daily', 'Stralis', 'FH', 'XF', 'Actros', 'T-Series', 'S-Series'];
export const MARCAS_VH       = ['Ford', 'Volkswagen', 'Mercedes-Benz', 'Renault', 'Toyota', 'Opel', 'Peugeot', 'Citroën', 'Fiat', 'Nissan', 'Mitsubishi', 'SEAT'];
export const MODELOS_VH      = ['Transit', 'Crafter', 'Sprinter', 'Master', 'Hilux', 'L200', 'HiAce', 'Movano', 'Ducato', 'Jumper', 'Ranger'];
export const TIPOS_CAMION    = ['Camión rígido', 'Camión articulado', 'Furgón isotermo', 'Camión plataforma', 'Volquete', 'Cisterna'];
export const TIPOS_VH_OPTS   = [{ val: 'furgoneta', label: 'Furgoneta' }, { val: 'turismo', label: 'Turismo' }, { val: 'pick_up', label: 'Pick-up' }, { val: 'otro', label: 'Otro' }];
export const EMPRESAS_TRANSP = ['Marvic', 'Transportes Rodríguez', 'Autónomo'];
export const DESTINOS_PRESET = ['Nave Collados+Brazo Virgen', 'Cabezal La Barda', 'Nave Polígono La Barda', 'Nave La Concepción', 'Nave Lonsordo', 'Semillero', 'Oficina', 'Almería', 'Murcia', 'Valencia'];
export const GASOLINERAS     = ['Repsol', 'BP', 'Cepsa', 'Shell', 'Total Energies', 'Galp', 'Plenoil', 'Carrefour', 'Valcarce'];
export const TALLERES        = ['Taller oficial MAN', 'Taller oficial Iveco', 'Taller mecánico local', 'Concesionario oficial'];
export const ESTADOS_OP      = ['disponible', 'en_uso', 'mantenimiento', 'baja'] as const;

export const ESTADO_LABEL: Record<string, string> = {
  disponible: 'Disponible', en_uso: 'En uso', mantenimiento: 'En mantenimiento', baja: 'Baja',
};
export const ESTADO_CLS: Record<string, string> = {
  disponible:   'text-green-400 border-green-400/60',
  en_uso:       'text-emerald-400 border-emerald-500/60',
  mantenimiento:'text-amber-400 border-amber-400/60',
  baja:         'text-red-400 border-red-400/60',
};

// ── Helpers ───────────────────────────────────────────────────

export function itvDias(f: string | null): number | null {
  if (!f) return null;
  return Math.ceil((new Date(f).getTime() - Date.now()) / 86400000);
}

export function fmtFecha(f: string | null): string {
  if (!f) return '—';
  try { return new Date(f).toLocaleDateString('es-ES'); } catch { return '—'; }
}

export function fmtDatetime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
}

export function nombreDe(lista: Personal[], id: string | null): string {
  if (!id) return '—';
  return lista.find(p => p.id === id)?.nombre ?? '—';
}

export function matriculaVehiculo(camiones: Camion[], vehiculos: VehiculoEmpresa[], id: string | null): string {
  if (!id) return '—';
  return camiones.find(c => c.id === id)?.matricula ?? vehiculos.find(v => v.id === id)?.matricula ?? '—';
}

export function calcHoras(salida: string, llegada: string): number | null {
  if (!salida || !llegada) return null;
  const d = (new Date(llegada).getTime() - new Date(salida).getTime()) / 3600000;
  return d > 0 ? +d.toFixed(2) : null;
}

export function mismoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ── Badge estado operativo ────────────────────────────────────

export const BadgeEstado = React.memo(function BadgeEstado({ estado }: { estado: string | null }) {
  if (!estado) return null;
  const cls = ESTADO_CLS[estado] ?? 'text-slate-400 border-slate-400/60';
  return (
    <span className={`text-[8px] font-black uppercase tracking-widest border px-1.5 py-0.5 rounded ${cls}`}>
      {ESTADO_LABEL[estado] ?? estado}
    </span>
  );
});
