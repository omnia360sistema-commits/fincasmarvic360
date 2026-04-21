import { FINCAS_DATA } from './farms';

export interface NavItemChild {
  id: string;
  label: string;
  ruta: string;
}

export interface NavItem {
  id: string;
  label: string;
  /** Si no hay hijos, navegación directa */
  ruta?: string;
  activo: boolean;
  children?: NavItemChild[];
}

const fincaChildren: NavItemChild[] = [
  { id: 'campo-todas', label: 'Ver todas las fincas', ruta: '/farm' },
  ...FINCAS_DATA.map(f => ({
    id: `campo-${f.nombre}`,
    label: f.nombre,
    ruta: `/farm/${encodeURIComponent(f.nombre)}`,
  })),
];

export const NAV_ITEMS: NavItem[] = [
  { id: 'campo', label: 'Campo', activo: true, children: fincaChildren },
  {
    id: 'parte-diario',
    label: 'Parte diario',
    activo: true,
    children: [
      { id: 'pd-completo', label: 'Parte diario completo', ruta: '/parte-diario' },
      { id: 'pd-a', label: 'Estado finca / parcela', ruta: '/parte-diario?bloque=A' },
      { id: 'pd-b', label: 'Trabajo en curso', ruta: '/parte-diario?bloque=B' },
      { id: 'pd-c', label: 'Parte personal', ruta: '/parte-diario?bloque=C' },
      { id: 'pd-d', label: 'Residuos vegetales', ruta: '/parte-diario?bloque=D' },
    ],
  },
  {
    id: 'trabajos',
    label: 'Trabajos',
    activo: true,
    children: [
      { id: 'tr-completo', label: 'Trabajos completo', ruta: '/trabajos' },
      { id: 'tr-plan', label: 'Planificación diaria', ruta: '/trabajos?tab=planificacion' },
      { id: 'tr-camp', label: 'Campaña', ruta: '/trabajos?tab=campana' },
      { id: 'tr-inc', label: 'Incidencias', ruta: '/trabajos?tab=incidencias' },
    ],
  },
  {
    id: 'personal',
    label: 'Personal',
    activo: true,
    children: [
      { id: 'per-completo', label: 'Personal completo', ruta: '/personal' },
      { id: 'per-op', label: 'Operarios', ruta: '/personal?tab=operarios' },
      { id: 'per-enc', label: 'Encargados', ruta: '/personal?tab=encargados' },
      { id: 'per-maq', label: 'Maquinaria', ruta: '/personal?tab=maquinaria' },
      { id: 'per-cam', label: 'Camión', ruta: '/personal?tab=camion' },
      { id: 'per-ext', label: 'Externa', ruta: '/personal?tab=externa' },
    ],
  },
  {
    id: 'presencia',
    label: 'Presencia',
    activo: true,
    children: [
      { id: 'pr-panel', label: 'Panel de presencia', ruta: '/presencia' },
      { id: 'pr-act', label: 'Cuadrillas activas ahora', ruta: '/presencia?vista=activas' },
      { id: 'pr-hor', label: 'Resumen de horas', ruta: '/presencia?vista=horas' },
    ],
  },
  {
    id: 'maquinaria',
    label: 'Maquinaria',
    activo: true,
    children: [
      { id: 'mq-completo', label: 'Maquinaria completo', ruta: '/maquinaria' },
      { id: 'mq-tr', label: 'Tractores', ruta: '/maquinaria?tab=tractores' },
      { id: 'mq-ap', label: 'Aperos', ruta: '/maquinaria?tab=aperos' },
      { id: 'mq-uso', label: 'Registros de uso', ruta: '/maquinaria?tab=uso' },
      { id: 'mq-gps', label: 'Recorridos GPS', ruta: '/maquinaria?tab=recorridos' },
    ],
  },
  {
    id: 'logistica',
    label: 'Logística',
    activo: true,
    children: [
      { id: 'lg-completo', label: 'Logística completo', ruta: '/logistica' },
      { id: 'lg-cam', label: 'Camiones', ruta: '/logistica?tab=camiones' },
      { id: 'lg-veh', label: 'Vehículos', ruta: '/logistica?tab=vehiculos' },
      { id: 'lg-cond', label: 'Conductores', ruta: '/logistica?tab=conductores' },
      { id: 'lg-via', label: 'Viajes', ruta: '/logistica?tab=viajes' },
      { id: 'lg-mant', label: 'Mantenimiento', ruta: '/logistica?tab=mantenimiento' },
      { id: 'lg-comb', label: 'Combustible', ruta: '/logistica?tab=combustible' },
    ],
  },
  {
    id: 'materiales',
    label: 'Materiales',
    activo: true,
    children: [
      { id: 'mat-completo', label: 'Materiales completo', ruta: '/materiales?tab=fitosanitarios' },
      { id: 'mat-fito', label: 'Fitosanitarios y abonos', ruta: '/materiales?tab=fitosanitarios' },
      { id: 'mat-rieg', label: 'Material de riego', ruta: '/materiales?tab=riego' },
      { id: 'mat-reg', label: 'Registrar entrada / salida', ruta: '/materiales?accion=registro' },
    ],
  },
  {
    id: 'inventario',
    label: 'Inventario',
    activo: true,
    children: [
      { id: 'inv-completo', label: 'Inventario completo', ruta: '/inventario' },
      { id: 'inv-ent', label: 'Entradas de stock', ruta: '/inventario?tab=entradas' },
      { id: 'inv-prov', label: 'Proveedores', ruta: '/inventario?tab=proveedores' },
    ],
  },
  {
    id: 'trazabilidad',
    label: 'Trazabilidad',
    activo: true,
    children: [
      { id: 'trz-completo', label: 'Trazabilidad completo', ruta: '/trazabilidad' },
      { id: 'trz-pal', label: 'Palots', ruta: '/trazabilidad?tab=palots' },
      { id: 'trz-cam', label: 'Cámaras de almacén', ruta: '/trazabilidad?tab=camaras' },
      { id: 'trz-esc', label: 'Lector de código', ruta: '/trazabilidad?tab=escaner' },
    ],
  },
  {
    id: 'estado-general',
    label: 'Estado general',
    activo: true,
    children: [
      { id: 'eg-completo', label: 'Estado general completo', ruta: '/estado-general' },
      { id: 'eg-crit', label: 'Alertas críticas', ruta: '/estado-general?nivel=critico' },
      { id: 'eg-urg', label: 'Alertas urgentes', ruta: '/estado-general?nivel=urgente' },
      { id: 'eg-av', label: 'Avisos', ruta: '/estado-general?nivel=aviso' },
    ],
  },
  {
    id: 'auditoria',
    label: 'Auditoría',
    activo: true,
    children: [
      { id: 'au-completo', label: 'Auditoría completa', ruta: '/auditoria' },
      { id: 'au-fec', label: 'Buscar por fecha', ruta: '/auditoria?filtro=fecha' },
      { id: 'au-mod', label: 'Buscar por módulo', ruta: '/auditoria?filtro=modulo' },
      { id: 'au-usu', label: 'Buscar por usuario', ruta: '/auditoria?filtro=usuario' },
    ],
  },
  {
    id: 'historicos',
    label: 'Históricos',
    activo: true,
    children: [
      { id: 'hi-completo', label: 'Históricos completo', ruta: '/historicos' },
      { id: 'hi-bus', label: 'Buscar registros', ruta: '/historicos' },
    ],
  },
  {
    id: 'exportar-pdf',
    label: 'Exportar informe',
    activo: true,
    children: [
      { id: 'xp-completo', label: 'Exportar completo', ruta: '/exportar-pdf' },
      { id: 'xp-glob', label: 'Informe global', ruta: '/exportar-pdf?tipo=global' },
      { id: 'xp-agro', label: 'Informes agronómicos', ruta: '/exportar-pdf?tipo=agronomico' },
    ],
  },
  {
    id: 'integracion-erp',
    label: 'Integración sistema externo',
    activo: true,
    children: [
      { id: 'erp-completo', label: 'Integración completa', ruta: '/integracion-erp' },
      { id: 'erp-prod', label: 'Producción y destinos', ruta: '/integracion-erp?seccion=produccion' },
      { id: 'erp-cost', label: 'Costes de campo', ruta: '/integracion-erp?seccion=costes' },
      { id: 'erp-bio', label: 'Activos biológicos', ruta: '/integracion-erp?seccion=biologicos' },
      { id: 'erp-hist', label: 'Historial de exportaciones', ruta: '/integracion-erp?seccion=historial' },
    ],
  },
];
