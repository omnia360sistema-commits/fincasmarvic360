// ─── Tipos / constantes compartidas (pantalla Inventario + PDF global) ───

export type MainTab = 'ubicaciones' | 'entradas' | 'proveedores';

export const TIPOS_PROVEEDOR = [
  'proveedor_materiales', 'ganadero', 'gestor_residuos_plasticos', 'otro',
] as const;

export const TIPOS_PROVEEDOR_LABEL: Record<string, string> = {
  proveedor_materiales: 'Proveedor materiales',
  ganadero: 'Ganadero',
  gestor_residuos_plasticos: 'Gestor residuos plásticos',
  otro: 'Otro',
};

export const UNIDADES_FRECUENTES = ['kg', 'litros', 'unidades', 'sacos', 'cajas', 'rollos', 'bidones', 'palés'];
