import QRCode from 'qrcode';

export type TabType =
  | 'operario_campo'
  | 'encargado'
  | 'conductor_maquinaria'
  | 'conductor_camion'
  | 'externo';

export const TABS: { id: TabType; label: string; color: string }[] = [
  { id: 'operario_campo',       label: 'Operarios',  color: '#22c55e' },
  { id: 'encargado',            label: 'Encargados',  color: '#6d9b7d' },
  { id: 'conductor_maquinaria', label: 'Maquinaria',  color: '#fb923c' },
  { id: 'conductor_camion',     label: 'Camion',      color: '#a78bfa' },
  { id: 'externo',              label: 'Externa',     color: '#f472b6' },
];

export const LICENCIAS_OPCIONES = ['Carnet tractor', 'Carnet agricola', 'Manipulador fitosanitarios'];
export const CARNET_OPCIONES    = ['B', 'C', 'C+E', 'D'];

export function diasHastaCaducidad(fecha: string | null): number | null {
  if (!fecha) return null;
  const diff = new Date(fecha).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

export function formatFecha(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export async function generarQRDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { width: 200, margin: 1 });
}
