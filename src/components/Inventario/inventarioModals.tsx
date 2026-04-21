import React from 'react';
import { FileText, Filter } from 'lucide-react';
import { SelectWithOther, AudioInput, PhotoAttachment } from '@/components/base';
import type { Tables } from '@/integrations/supabase/types';
import { TIPOS_PROVEEDOR, TIPOS_PROVEEDOR_LABEL } from './inventarioConstants';

/** Subconjunto de `useCatalogoLocal` usado por los modales */
type CatalogoLocalLike = {
  opciones: string[];
  addOpcion: (valor: string) => void;
};

type UbicRow = { id: string; nombre: string };
type CatRow = { id: string; nombre: string };
type ProveedorRow = Tables<'proveedores'>;
type ProductoRow = { id: string; nombre: string };
type PersonalRow = { nombre: string; activo: boolean };

export const ModalInformeGlobalPdf = React.memo(function ModalInformeGlobalPdf({
  ubicaciones,
  categorias,
  fechaDesde,
  fechaHasta,
  selUbics,
  selCats,
  genPdf,
  onClose,
  setFechaDesde,
  setFechaHasta,
  onSelectAllUbics,
  onClearUbics,
  onSelectAllCats,
  onClearCats,
  toggleUbic,
  toggleCat,
  onGenerar,
}: {
  ubicaciones: UbicRow[];
  categorias: CatRow[];
  fechaDesde: string;
  fechaHasta: string;
  selUbics: Set<string>;
  selCats: Set<string>;
  genPdf: boolean;
  onClose: () => void;
  setFechaDesde: (v: string) => void;
  setFechaHasta: (v: string) => void;
  onSelectAllUbics: () => void;
  onClearUbics: () => void;
  onSelectAllCats: () => void;
  onClearCats: () => void;
  toggleUbic: (id: string) => void;
  toggleCat: (id: string) => void;
  onGenerar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#6d9b7d]" />
            <span className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Informe Global de Inventario</span>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Período</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Desde</label>
                <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-[#6d9b7d]/50 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Hasta</label>
                <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-[#6d9b7d]/50 outline-none" />
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Ubicaciones ({selUbics.size}/{ubicaciones.length})</p>
              <div className="flex gap-2">
                <button type="button" onClick={onSelectAllUbics} className="text-[9px] text-[#6d9b7d] hover:underline font-bold uppercase">Todas</button>
                <button type="button" onClick={onClearUbics} className="text-[9px] text-slate-400 hover:underline uppercase">Ninguna</button>
              </div>
            </div>
            <div className="space-y-1.5">
              {ubicaciones.map(u => (
                <label key={u.id} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="checkbox" checked={selUbics.has(u.id)} onChange={() => toggleUbic(u.id)} className="w-3.5 h-3.5 accent-emerald-600" />
                  <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{u.nombre}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Categorías ({selCats.size}/{categorias.length})</p>
              <div className="flex gap-2">
                <button type="button" onClick={onSelectAllCats} className="text-[9px] text-[#6d9b7d] hover:underline font-bold uppercase">Todas</button>
                <button type="button" onClick={onClearCats} className="text-[9px] text-slate-400 hover:underline uppercase">Ninguna</button>
              </div>
            </div>
            <div className="space-y-1.5">
              {categorias.map(c => (
                <label key={c.id} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="checkbox" checked={selCats.has(c.id)} onChange={() => toggleCat(c.id)} className="w-3.5 h-3.5 accent-emerald-600" />
                  <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{c.nombre}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 rounded-lg text-sm">Cancelar</button>
            <button
              type="button"
              onClick={onGenerar}
              disabled={genPdf || selUbics.size === 0 || selCats.size === 0}
              className="btn-primary flex-1 py-2.5 rounded-lg text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {genPdf ? <span className="w-3.5 h-3.5 border-2 border-[#020617]/20 border-t-[#020617] rounded-full animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              {genPdf ? 'Generando…' : 'Generar PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export const ModalNuevaEntrada = React.memo(function ModalNuevaEntrada({
  proveedores,
  ubicaciones,
  categorias,
  productos,
  personal,
  catUnidades,
  catReceptores,
  entradaError,
  entradaProveedorId,
  entradaUbicacion,
  entradaCategoria,
  entradaProductoId,
  entradaCantidad,
  entradaUnidad,
  entradaPrecio,
  importeCalc,
  entradaReceptor,
  entradaFecha,
  entradaFotoFile,
  entradaNotas,
  entradaSubmitting,
  onClose,
  setEntradaProveedorId,
  setEntradaUbicacion,
  setEntradaCategoria,
  setEntradaProductoId,
  setEntradaCantidad,
  setEntradaUnidad,
  setEntradaPrecio,
  setEntradaReceptor,
  setEntradaFecha,
  setEntradaFotoFile,
  setEntradaNotas,
  onCreateProveedor,
  onGuardar,
}: {
  proveedores: ProveedorRow[];
  ubicaciones: UbicRow[];
  categorias: CatRow[];
  productos: ProductoRow[];
  personal: PersonalRow[];
  catUnidades: CatalogoLocalLike;
  catReceptores: CatalogoLocalLike;
  entradaError: string | null;
  entradaProveedorId: string;
  entradaUbicacion: string;
  entradaCategoria: string;
  entradaProductoId: string;
  entradaCantidad: string;
  entradaUnidad: string;
  entradaPrecio: string;
  importeCalc: number;
  entradaReceptor: string;
  entradaFecha: string;
  entradaFotoFile: File | null;
  entradaNotas: string;
  entradaSubmitting: boolean;
  onClose: () => void;
  setEntradaProveedorId: (id: string) => void;
  setEntradaUbicacion: (v: string) => void;
  setEntradaCategoria: (v: string) => void;
  setEntradaProductoId: (v: string) => void;
  setEntradaCantidad: (v: string) => void;
  setEntradaUnidad: (v: string) => void;
  setEntradaPrecio: (v: string) => void;
  setEntradaReceptor: (v: string) => void;
  setEntradaFecha: (v: string) => void;
  setEntradaFotoFile: (f: File | null) => void;
  setEntradaNotas: (v: string) => void;
  onCreateProveedor: (nombre: string) => Promise<string>;
  onGuardar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 px-5 py-3 flex items-center justify-between">
          <span className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Nueva entrada de stock</span>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          {entradaError && <p className="text-xs text-red-400">{entradaError}</p>}

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Proveedor</label>
            <SelectWithOther
              options={proveedores.map(p => p.nombre)}
              value={proveedores.find(p => p.id === entradaProveedorId)?.nombre ?? ''}
              onChange={v => { const p = proveedores.find(x => x.nombre === v); setEntradaProveedorId(p?.id ?? ''); }}
              placeholder="Seleccionar proveedor"
              onCreateNew={async (nombre) => {
                const id = await onCreateProveedor(nombre);
                setEntradaProveedorId(id);
              }}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Ubicacion *</label>
            <select
              value={entradaUbicacion}
              onChange={e => { setEntradaUbicacion(e.target.value); setEntradaProductoId(''); }}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
            >
              <option value="">Seleccionar ubicacion</option>
              {ubicaciones.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Categoria *</label>
            <select
              value={entradaCategoria}
              onChange={e => { setEntradaCategoria(e.target.value); setEntradaProductoId(''); }}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
            >
              <option value="">Seleccionar categoria</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Producto</label>
            <select
              value={entradaProductoId}
              onChange={e => setEntradaProductoId(e.target.value)}
              disabled={!entradaCategoria}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
            >
              <option value="">Seleccionar producto</option>
              {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Cantidad *</label>
              <input type="number" min="0" step="0.01" value={entradaCantidad} onChange={e => setEntradaCantidad(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Unidad</label>
              <SelectWithOther
                options={catUnidades.opciones}
                value={entradaUnidad}
                onChange={v => setEntradaUnidad(v)}
                onCreateNew={v => { catUnidades.addOpcion(v); setEntradaUnidad(v); }}
                placeholder="kg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Precio unitario (€)</label>
              <input type="number" min="0" step="0.01" value={entradaPrecio} onChange={e => setEntradaPrecio(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Importe total (€)</label>
              <input type="text" readOnly value={importeCalc > 0 ? importeCalc.toFixed(2) : ''} className="w-full bg-slate-200 dark:bg-slate-700 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Receptor</label>
            <SelectWithOther
              options={Array.from(new Set([...personal.filter(p => p.activo).map(p => p.nombre), ...catReceptores.opciones]))}
              value={entradaReceptor}
              onChange={v => setEntradaReceptor(v)}
              onCreateNew={v => { catReceptores.addOpcion(v); setEntradaReceptor(v); }}
              placeholder="Seleccionar receptor"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Fecha</label>
            <input type="date" value={entradaFecha} onChange={e => setEntradaFecha(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Albaran (foto)</label>
            <PhotoAttachment value={entradaFotoFile ? URL.createObjectURL(entradaFotoFile) : null} onChange={f => setEntradaFotoFile(f)} />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Notas</label>
            <AudioInput value={entradaNotas} onChange={v => setEntradaNotas(v)} placeholder="Notas de la entrada..." rows={2} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 rounded-lg text-sm">Cancelar</button>
            <button type="button" onClick={onGuardar} disabled={entradaSubmitting} className="btn-primary flex-1 py-2.5 rounded-lg text-sm font-black disabled:opacity-50">
              {entradaSubmitting ? 'Guardando…' : 'Guardar entrada'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export const ModalProveedor = React.memo(function ModalProveedor({
  editProv,
  provError,
  provNombre,
  provNif,
  provTelefono,
  provEmail,
  provTipo,
  provContacto,
  provActivo,
  provNotas,
  provFotoFile,
  provSubmitting,
  onClose,
  setProvNombre,
  setProvNif,
  setProvTelefono,
  setProvEmail,
  setProvTipo,
  setProvContacto,
  setProvActivo,
  setProvNotas,
  setProvFotoFile,
  onGuardar,
}: {
  editProv: Tables<'proveedores'> | null;
  provError: string | null;
  provNombre: string;
  provNif: string;
  provTelefono: string;
  provEmail: string;
  provTipo: string;
  provContacto: string;
  provActivo: boolean;
  provNotas: string;
  provFotoFile: File | null;
  provSubmitting: boolean;
  onClose: () => void;
  setProvNombre: (v: string) => void;
  setProvNif: (v: string) => void;
  setProvTelefono: (v: string) => void;
  setProvEmail: (v: string) => void;
  setProvTipo: (v: string) => void;
  setProvContacto: (v: string) => void;
  setProvActivo: React.Dispatch<React.SetStateAction<boolean>>;
  setProvNotas: (v: string) => void;
  setProvFotoFile: (f: File | null) => void;
  onGuardar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 px-5 py-3 flex items-center justify-between">
          <span className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
            {editProv ? 'Editar proveedor' : 'Nuevo proveedor'}
          </span>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          {provError && <p className="text-xs text-red-400">{provError}</p>}
          {editProv?.codigo_interno && (
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Codigo interno</label>
              <input type="text" readOnly value={editProv.codigo_interno} className="w-full bg-slate-200 dark:bg-slate-700 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed" />
            </div>
          )}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Nombre *</label>
            <input value={provNombre} onChange={e => setProvNombre(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">NIF</label>
              <input value={provNif} onChange={e => setProvNif(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Telefono</label>
              <input value={provTelefono} onChange={e => setProvTelefono(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Email</label>
            <input type="email" value={provEmail} onChange={e => setProvEmail(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Tipo</label>
            <select
              value={provTipo}
              onChange={e => setProvTipo(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none"
            >
              <option value="">Seleccionar tipo</option>
              {TIPOS_PROVEEDOR.map(t => <option key={t} value={t}>{TIPOS_PROVEEDOR_LABEL[t] ?? t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Persona de contacto</label>
            <input value={provContacto} onChange={e => setProvContacto(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Activo</label>
            <button
              type="button"
              onClick={() => setProvActivo(v => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${provActivo ? 'bg-[#6d9b7d]' : 'bg-slate-400 dark:bg-slate-600'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${provActivo ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Notas</label>
            <AudioInput value={provNotas} onChange={v => setProvNotas(v)} placeholder="Notas sobre el proveedor..." rows={2} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Foto</label>
            <PhotoAttachment value={provFotoFile ? URL.createObjectURL(provFotoFile) : (editProv?.foto_url ?? null)} onChange={f => setProvFotoFile(f)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 rounded-lg text-sm">Cancelar</button>
            <button type="button" onClick={onGuardar} disabled={provSubmitting} className="btn-primary flex-1 py-2.5 rounded-lg text-sm font-black disabled:opacity-50">
              {provSubmitting ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export const ModalPrecioProveedor = React.memo(function ModalPrecioProveedor({
  catUnidades,
  precioProducto,
  precioUnidad,
  precioValor,
  precioVigencia,
  precioSubmitting,
  onClose,
  setPrecioProducto,
  setPrecioUnidad,
  setPrecioValor,
  setPrecioVigencia,
  onGuardar,
}: {
  catUnidades: CatalogoLocalLike;
  precioProducto: string;
  precioUnidad: string;
  precioValor: string;
  precioVigencia: string;
  precioSubmitting: boolean;
  onClose: () => void;
  setPrecioProducto: (v: string) => void;
  setPrecioUnidad: (v: string) => void;
  setPrecioValor: (v: string) => void;
  setPrecioVigencia: (v: string) => void;
  onGuardar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl w-full max-w-md shadow-2xl">
        <div className="border-b border-slate-200 dark:border-white/10 px-5 py-3 flex items-center justify-between">
          <span className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Añadir precio</span>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Producto *</label>
            <input value={precioProducto} onChange={e => setPrecioProducto(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Unidad</label>
              <SelectWithOther
                options={catUnidades.opciones}
                value={precioUnidad}
                onChange={v => setPrecioUnidad(v)}
                onCreateNew={v => { catUnidades.addOpcion(v); setPrecioUnidad(v); }}
                placeholder="kg"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Precio (€)</label>
              <input type="number" min="0" step="0.01" value={precioValor} onChange={e => setPrecioValor(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Vigencia</label>
            <input type="date" value={precioVigencia} onChange={e => setPrecioVigencia(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 rounded-lg text-sm">Cancelar</button>
            <button type="button" onClick={onGuardar} disabled={precioSubmitting || !precioProducto} className="btn-primary flex-1 py-2.5 rounded-lg text-sm font-black disabled:opacity-50">
              {precioSubmitting ? 'Guardando…' : 'Guardar precio'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
