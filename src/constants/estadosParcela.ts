// Coincide exactamente con el ENUM estado_parcela de Supabase
export const ESTADOS_PARCELA: { value: string; label: string }[] = [
  { value: 'vacia',        label: 'Vacía' },
  { value: 'preparacion',  label: 'Preparación' },
  { value: 'plantada',     label: 'Plantada' },
  { value: 'cosechada',    label: 'Cosechada' },
  { value: 'en_produccion',label: 'En producción' },
  { value: 'acolchado',    label: 'Acolchado' },
];
