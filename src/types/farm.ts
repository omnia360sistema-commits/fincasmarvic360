import type { FeatureCollection, Feature, Polygon, MultiPolygon } from 'geojson';

export interface ParcelProperties {
  parcel_id: string;
  finca: string;
  parcela: string;
  codigo: string;
  superficie: number;
  riego: string;
}

export type ParcelFeature = Feature<Polygon | MultiPolygon, ParcelProperties>;
export type ParcelCollection = FeatureCollection<Polygon | MultiPolygon, ParcelProperties>;

export interface FarmSummary {
  name: string;
  parcelCount: number;
  totalHectares: number;
}

export type ParcelStatus = 'active' | 'planted' | 'preparation' | 'harvested' | 'empty';

export const STATUS_COLORS: Record<ParcelStatus, string> = {
  active: '#22c55e',
  planted: '#eab308',
  preparation: '#3b82f6',
  harvested: '#ef4444',
  empty: '#6b7280',
};

export const STATUS_LABELS: Record<ParcelStatus, string> = {
  active: 'Activa',
  planted: 'Plantada',
  preparation: 'Preparación',
  harvested: 'Cosechada',
  empty: 'Vacía',
};
