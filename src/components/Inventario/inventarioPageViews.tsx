import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Warehouse, Tag, Package,
  Server, Wifi, FileText,
  ShoppingCart, Users, ChevronDown, ChevronRight, Plus, Trash2,
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { MainTab, TIPOS_PROVEEDOR_LABEL } from '@/components/Inventario/inventarioConstants';
import { RecordActions } from '@/components/base';

type UbicResumen = { id: string; nombre: string };
type CatResumen = { id: string; nombre: string };

type EntradaFila = {
  id: string;
  fecha: string | null;
  proveedor_nombre?: string | null;
  producto_nombre?: string | null;
  cantidad: number;
  unidad: string;
  precio_unitario: number | null;
  receptor: string | null;
  ubicacion_id: string;
};

type PrecioRow = Tables<'proveedores_precios'>;

export function InventarioPageHeader(props: {
  fechaStr: string;
  horaStr: string;
  onAbrirInformeGlobal: () => void;
  onVolverDashboard: () => void;
}) {
  const { fechaStr, horaStr, onAbrirInformeGlobal, onVolverDashboard } = props;
  return (
    <header className="w-full bg-white/90 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10 pl-14 pr-6 py-2 flex items-center justify-between z-50">
      <div className="flex items-center gap-3">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[10px] font-black text-green-500 dark:text-green-400 uppercase tracking-widest">
          Inventario Activos
        </span>
        <span className="text-[10px] text-slate-300 dark:text-slate-600 mx-2">|</span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{fechaStr}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onAbrirInformeGlobal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#6d9b7d]/30 bg-[#6d9b7d]/5 hover:bg-[#6d9b7d]/10 text-[#6d9b7d] transition-all"
        >
          <FileText className="w-3 h-3" />
          <span className="text-[9px] font-black uppercase tracking-widest">Informe Global</span>
        </button>
        <button
          type="button"
          onClick={onVolverDashboard}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800/60 hover:border-[#6d9b7d]/50 hover:text-[#6d9b7d] transition-all text-slate-500 dark:text-slate-400"
        >
          <ArrowLeft className="w-3 h-3" />
          <span className="text-[9px] font-black uppercase tracking-widest">Volver</span>
        </button>
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3 h-3 text-green-400" />
          <span className="text-[10px] text-green-500 dark:text-green-400 font-bold uppercase tracking-widest">Online</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Server className="w-3 h-3 text-[#6d9b7d]" />
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{horaStr}</span>
        </div>
      </div>
    </header>
  );
}

export function InventarioMainTabBar(props: {
  mainTab: MainTab;
  setMainTab: (t: MainTab) => void;
}) {
  const { mainTab, setMainTab } = props;
  return (
    <div className="w-full bg-white dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10 px-6 flex gap-1 pt-2">
      {[
        { id: 'ubicaciones' as MainTab, label: 'Ubicaciones', icon: Warehouse },
        { id: 'entradas' as MainTab, label: 'Entradas de stock', icon: ShoppingCart },
        { id: 'proveedores' as MainTab, label: 'Proveedores', icon: Users },
      ].map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setMainTab(id)}
          className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${
            mainTab === id
              ? 'border-[#6d9b7d] text-[#6d9b7d]'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

export function InventarioTabUbicaciones(props: {
  isDark: boolean;
  isLoading: boolean;
  isLoadingTotal: boolean;
  totalRegistros: number | undefined;
  ubicaciones: UbicResumen[];
  conteos: Map<string, number> | undefined;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
}) {
  const {
    isDark,
    isLoading,
    isLoadingTotal,
    totalRegistros,
    ubicaciones,
    conteos,
    hoveredId,
    setHoveredId,
  } = props;
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center mb-10 relative">
        <div className="absolute w-[600px] h-[300px] bg-[#6d9b7d]/10 rounded-full blur-[120px] opacity-50 pointer-events-none" />
        <img
          src="/MARVIC_logo.png"
          alt=""
          className="w-full max-w-[480px] opacity-90 relative z-10"
          style={{
            filter: isDark
              ? 'brightness(0) invert(1) drop-shadow(0 0 30px rgba(56,189,248,0.3))'
              : 'drop-shadow(0 0 20px rgba(56,189,248,0.2))',
          }}
        />
        <div className="mt-4 h-px w-64 bg-gradient-to-r from-transparent via-[#6d9b7d]/40 to-transparent" />
        <p className="mt-3 text-[10px] tracking-[0.5em] uppercase font-black text-slate-400 dark:text-slate-500">
          Inventario de Activos Físicos
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10 w-full max-w-lg">
        {[
          { label: 'Ubicaciones', value: '6', icon: Warehouse },
          { label: 'Categorías', value: '7', icon: Tag },
          {
            label: 'Registros',
            value: isLoadingTotal ? '…' : String(totalRegistros ?? 0),
            icon: Package,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-3 text-center shadow-sm dark:shadow-none"
          >
            <Icon className="w-4 h-4 text-[#6d9b7d] mx-auto mb-1" />
            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      <div className="w-full max-w-3xl">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
          <Warehouse className="w-3.5 h-3.5 text-[#6d9b7d]" />
          Acceso directo por ubicación
        </p>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <span className="text-[11px] font-black text-[#6d9b7d] uppercase tracking-widest animate-pulse">
              Cargando...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ubicaciones.map(ub => (
              <button
                key={ub.id}
                type="button"
                onMouseEnter={() => setHoveredId(ub.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => navigate(`/inventario/${ub.id}`)}
                className={`text-left p-3 rounded-lg border transition-all duration-200 ${
                  hoveredId === ub.id
                    ? 'bg-[#6d9b7d]/10 border-[#6d9b7d]/50 shadow-[0_0_15px_rgba(56,189,248,0.1)]'
                    : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-sm dark:shadow-none'
                }`}
              >
                <p
                  className={`text-[10px] font-black uppercase tracking-wide transition-colors leading-tight ${
                    hoveredId === ub.id ? 'text-[#6d9b7d]' : 'text-slate-800 dark:text-white'
                  }`}
                >
                  {ub.nombre}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Tag className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500" />
                  <span className="text-[9px] text-slate-400 dark:text-slate-500">7 categorías</span>
                </div>
                <div
                  className={`mt-2 h-px transition-all ${
                    hoveredId === ub.id ? 'bg-[#6d9b7d]/40' : 'bg-slate-200 dark:bg-white/5'
                  }`}
                />
                <div className="flex items-center gap-1 mt-1.5">
                  {(() => {
                    const count = conteos?.get(ub.id) ?? 0;
                    return (
                      <>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            count > 0 ? 'bg-green-400' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        />
                        <span className="text-[8px] text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                          {count > 0 ? `${count} registro${count !== 1 ? 's' : ''}` : 'Sin registros'}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function InventarioTabEntradas(props: {
  ubicaciones: UbicResumen[];
  categorias: CatResumen[];
  filtroUbicacion: string;
  setFiltroUbicacion: (v: string) => void;
  filtroCategoria: string;
  setFiltroCategoria: (v: string) => void;
  filtroDesde: string;
  setFiltroDesde: (v: string) => void;
  filtroHasta: string;
  setFiltroHasta: (v: string) => void;
  entradasFiltradas: EntradaFila[];
  onNuevaEntrada: () => void;
  onDeleteEntrada: (id: string) => void;
}) {
  const {
    ubicaciones,
    categorias,
    filtroUbicacion,
    setFiltroUbicacion,
    filtroCategoria,
    setFiltroCategoria,
    filtroDesde,
    setFiltroDesde,
    filtroHasta,
    setFiltroHasta,
    entradasFiltradas,
    onNuevaEntrada,
    onDeleteEntrada,
  } = props;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
          Entradas de stock
        </h2>
        <button
          type="button"
          onClick={onNuevaEntrada}
          className="btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase"
        >
          <Plus className="w-3.5 h-3.5" />
          Nueva entrada
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-lg">
        <div>
          <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1 uppercase font-bold">
            Ubicación
          </label>
          <select
            value={filtroUbicacion}
            onChange={e => setFiltroUbicacion(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded px-2 py-1.5 text-xs text-slate-900 dark:text-white"
          >
            <option value="">Todas</option>
            {ubicaciones.map(u => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1 uppercase font-bold">
            Categoría
          </label>
          <select
            value={filtroCategoria}
            onChange={e => setFiltroCategoria(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded px-2 py-1.5 text-xs text-slate-900 dark:text-white"
          >
            <option value="">Todas</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1 uppercase font-bold">Desde</label>
          <input
            type="date"
            value={filtroDesde}
            onChange={e => setFiltroDesde(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded px-2 py-1.5 text-xs text-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1 uppercase font-bold">Hasta</label>
          <input
            type="date"
            value={filtroHasta}
            onChange={e => setFiltroHasta(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded px-2 py-1.5 text-xs text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1e293b] text-white">
              {['Fecha', 'Proveedor', 'Producto', 'Cantidad', 'Precio', 'Receptor', 'Ubicación', ''].map(h => (
                <th key={h} className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entradasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-xs text-slate-400">
                  Sin entradas registradas
                </td>
              </tr>
            ) : (
              entradasFiltradas.map((e, i) => (
                <tr
                  key={e.id}
                  className={i % 2 === 0 ? 'bg-white dark:bg-slate-900/40' : 'bg-slate-50 dark:bg-slate-900/20'}
                >
                  <td className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300">{e.fecha ?? '—'}</td>
                  <td className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300">{e.proveedor_nombre ?? '—'}</td>
                  <td className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300">{e.producto_nombre ?? '—'}</td>
                  <td className="px-3 py-2 text-xs font-bold text-slate-900 dark:text-white">
                    {e.cantidad} {e.unidad}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                    {e.precio_unitario ? `${e.precio_unitario.toFixed(2)} €` : '—'}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300">{e.receptor ?? '—'}</td>
                  <td className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                    {ubicaciones.find(u => u.id === e.ubicacion_id)?.nombre ?? '—'}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('¿Eliminar esta entrada?')) onDeleteEntrada(e.id);
                      }}
                      className="text-red-400 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function InventarioTabProveedores(props: {
  proveedores: Tables<'proveedores'>[];
  expandedProvId: string | null;
  setExpandedProvId: (id: string | null) => void;
  precios: PrecioRow[];
  onOpenProvModal: (p?: Tables<'proveedores'>) => void;
  onEliminarProveedor: (id: string) => void;
  onOpenPrecioModal: (proveedorId: string) => void;
}) {
  const {
    proveedores,
    expandedProvId,
    setExpandedProvId,
    precios,
    onOpenProvModal,
    onEliminarProveedor,
    onOpenPrecioModal,
  } = props;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Proveedores</h2>
        <button
          type="button"
          onClick={() => onOpenProvModal()}
          className="btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuevo proveedor
        </button>
      </div>

      <div className="space-y-2">
        {proveedores.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-400">Sin proveedores registrados</div>
        ) : (
          proveedores.map(p => (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setExpandedProvId(expandedProvId === p.id ? null : p.id)}
                    className="text-slate-400 hover:text-[#6d9b7d] transition-colors"
                  >
                    {expandedProvId === p.id ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{p.nombre}</p>
                    <p className="text-[10px] text-slate-400">
                      {p.codigo_interno && (
                        <span className="font-mono mr-2 text-[#6d9b7d]">{p.codigo_interno}</span>
                      )}
                      {p.tipo ? TIPOS_PROVEEDOR_LABEL[p.tipo] ?? p.tipo : ''}
                      {p.telefono ? ` · ${p.telefono}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                      p.activo ? 'border-green-500/50 text-green-500' : 'border-slate-500/50 text-slate-400'
                    }`}
                  >
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <RecordActions
                    onEdit={() => onOpenProvModal(p)}
                    onDelete={() => onEliminarProveedor(p.id)}
                  />
                </div>
              </div>

              {expandedProvId === p.id && (
                <div className="border-t border-slate-200 dark:border-white/10 px-4 py-3 bg-slate-50 dark:bg-slate-900/40">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-4">
                    {p.nif && (
                      <div>
                        <span className="text-slate-400">NIF:</span>{' '}
                        <span className="text-slate-700 dark:text-slate-300">{p.nif}</span>
                      </div>
                    )}
                    {p.email && (
                      <div>
                        <span className="text-slate-400">Email:</span>{' '}
                        <span className="text-slate-700 dark:text-slate-300">{p.email}</span>
                      </div>
                    )}
                    {p.persona_contacto && (
                      <div>
                        <span className="text-slate-400">Contacto:</span>{' '}
                        <span className="text-slate-700 dark:text-slate-300">{p.persona_contacto}</span>
                      </div>
                    )}
                    {p.notas && (
                      <div className="col-span-2 sm:col-span-3">
                        <span className="text-slate-400">Notas:</span>{' '}
                        <span className="text-slate-700 dark:text-slate-300">{p.notas}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Lista de precios
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenPrecioModal(p.id)}
                      className="btn-secondary flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase"
                    >
                      <Plus className="w-3 h-3" />
                      Añadir precio
                    </button>
                  </div>
                  {precios.length === 0 ? (
                    <p className="text-xs text-slate-400">Sin precios registrados</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#1e293b] text-white">
                          {['Producto', 'Unidad', 'Precio', 'Vigencia'].map(h => (
                            <th key={h} className="px-2 py-1 text-left text-[9px] font-black uppercase">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {precios.map((pr, i) => (
                          <tr
                            key={pr.id}
                            className={
                              i % 2 === 0 ? 'bg-white dark:bg-slate-900/40' : 'bg-slate-50 dark:bg-slate-900/20'
                            }
                          >
                            <td className="px-2 py-1 text-slate-700 dark:text-slate-300">{pr.producto}</td>
                            <td className="px-2 py-1 text-slate-500 dark:text-slate-400">{pr.unidad ?? '—'}</td>
                            <td className="px-2 py-1 font-bold text-slate-900 dark:text-white">
                              {pr.precio_unitario != null ? `${pr.precio_unitario.toFixed(2)} €` : '—'}
                            </td>
                            <td className="px-2 py-1 text-slate-500 dark:text-slate-400">{pr.fecha_vigencia ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function InventarioPageFooter(props: {
  numProveedores: number;
  numEntradas: number;
  horaStr: string;
}) {
  const { numProveedores, numEntradas, horaStr } = props;
  return (
    <footer className="w-full bg-white/90 dark:bg-slate-900/80 border-t border-slate-200 dark:border-white/10 px-6 py-1.5 flex items-center gap-6">
      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
        Marvic 360 · Inventario
      </span>
      <span className="text-[10px] text-slate-300 dark:text-slate-600">|</span>
      <span className="text-[10px] text-slate-400 dark:text-slate-500">
        {numProveedores} proveedores · {numEntradas} entradas
      </span>
      <span className="text-[10px] font-mono text-slate-300 dark:text-slate-600 ml-auto">{horaStr}</span>
    </footer>
  );
}
