import type { FeatureCollection, Feature, Polygon, MultiPolygon } from 'geojson';
import type { TipoRiego, TipoSuelo, EstadoParcela } from '@/integrations/supabase/types';

export interface ParcelProperties {
  parcel_id: string;
  finca: string;
  parcela: string;
  codigo: string;
  superficie: number;
  riego: string;
  // Nuevos campos edafológicos
  tipo_suelo?: TipoSuelo;
  ph_suelo?: number;
  materia_organica_pct?: number;
  ultima_analisis_suelo?: string;
  irrigation_type_v2?: TipoRiego;
}

export type ParcelFeature = Feature<Polygon | MultiPolygon, ParcelProperties>;
export type ParcelCollection = FeatureCollection<Polygon | MultiPolygon, ParcelProperties>;

export interface FarmSummary {
  name: string;
  parcelCount: number;
  totalHectares: number;
}

export type ParcelStatus = EstadoParcela;

export const STATUS_COLORS: Record<ParcelStatus, string> = {
  activa:       '#22c55e',
  plantada:     '#eab308',
  preparacion:  '#3b82f6',
  cosechada:    '#ef4444',
  vacia:        '#6b7280',
  baja:         '#1f2937',
};

export const STATUS_LABELS: Record<ParcelStatus, string> = {
  activa:       'Activa',
  plantada:     'Plantada',
  preparacion:  'Preparación',
  cosechada:    'Cosechada',
  vacia:        'Vacía',
  baja:         'Baja',
};

// Interfaces para entidades nuevas
export interface CultivoCatalogo {
  id: string;
  nombre_interno: string;
  nombre_display: string;
  ciclo_dias: number;
  rendimiento_kg_ha: number | null;
  marco_std_entre_lineas_cm: number | null;
  marco_std_entre_plantas_cm: number | null;
  kg_plastico_por_ha: number | null;
  m_cinta_riego_por_ha: number | null;
  es_ecologico: boolean;
}

export interface Cuadrilla {
  id: string;
  nombre: string;
  empresa: string | null;
  nif: string | null;
  responsable: string | null;
  telefono: string | null;
  activa: boolean;
  qr_code: string | null;
}

export interface Camion {
  id: string;
  matricula: string;
  empresa_transporte: string | null;
  tipo: 'propio' | 'contratado' | null;
  capacidad_kg: number | null;
  activo: boolean;
}

export interface TicketPesaje {
  id: string;
  harvest_id: string;
  camion_id: string | null;
  matricula_manual: string | null;
  destino: string;
  peso_bruto_kg: number;
  peso_tara_kg: number;
  peso_neto_kg: number;
  conductor: string | null;
  hora_salida: string | null;
  numero_albaran: string | null;
  observaciones: string | null;
  created_at: string | null;
}

export interface ResiduoOperacion {
  id: string;
  parcel_id: string;
  operacion_id: string | null;
  tipo_residuo: string;
  kg_instalados: number | null;
  kg_retirados: number | null;
  proveedor: string | null;
  lote_material: string | null;
  gestor_residuos: string | null;
  fecha_instalacion: string | null;
  fecha_retirada: string | null;
}

export interface CertificacionParcela {
  id: string;
  parcel_id: string;
  entidad_certificadora: string;
  numero_expediente: string | null;
  campana: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: 'vigente' | 'suspendida' | 'en_tramite' | 'caducada';
  observaciones: string | null;
}