import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  useUbicaciones, useTotalRegistros,
  useConteosUbicaciones, useCategorias,
  useProveedores, useAddProveedor, useUpdateProveedor, useDeleteProveedor,
  usePreciosProveedor, useAddPrecioProveedor,
  useEntradas, useAddEntrada, useDeleteEntrada,
  useProductosCatalogo,
} from '../hooks/useInventario';
import { usePersonal } from '../hooks/usePersonal';
import { useCatalogoLocal } from '../hooks/useCatalogoLocal';
import { uploadImage, buildStoragePath } from '../utils/uploadImage';
import type { Tables } from '../integrations/supabase/types';
import { MainTab, UNIDADES_FRECUENTES } from '@/components/Inventario/inventarioConstants';
import {
  ModalInformeGlobalPdf,
  ModalNuevaEntrada,
  ModalProveedor,
  ModalPrecioProveedor,
} from '@/components/Inventario/inventarioModals';
import {
  InventarioPageHeader,
  InventarioMainTabBar,
  InventarioTabUbicaciones,
  InventarioTabEntradas,
  InventarioTabProveedores,
  InventarioPageFooter,
} from '@/components/Inventario/inventarioPageViews';
import { generarInventarioGlobalPdf } from '@/utils/generarInventarioGlobalPdf';

export default function Inventario() {
  const catUnidades = useCatalogoLocal('inventario_unidades', UNIDADES_FRECUENTES);
  const catReceptores = useCatalogoLocal('inventario_receptores', []);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const mainTab: MainTab =
    tabParam === 'entradas' ? 'entradas' : tabParam === 'proveedores' ? 'proveedores' : 'ubicaciones';

  const setMainTab = useCallback(
    (t: MainTab) => {
      setSearchParams(
        prev => {
          const p = new URLSearchParams(prev);
          if (t === 'ubicaciones') p.delete('tab');
          else p.set('tab', t);
          return p;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [genPdf, setGenPdf] = useState(false);
  const [selUbics, setSelUbics] = useState<Set<string>>(new Set());
  const [selCats, setSelCats] = useState<Set<string>>(new Set());
  const [fechaDesde, setFechaDesde] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [fechaHasta, setFechaHasta] = useState(() => new Date().toISOString().split('T')[0]);

  const [showEntradaModal, setShowEntradaModal] = useState(false);
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const [entradaProveedorId, setEntradaProveedorId] = useState('');
  const [entradaUbicacion, setEntradaUbicacion] = useState('');
  const [entradaCategoria, setEntradaCategoria] = useState('');
  const [entradaProductoId, setEntradaProductoId] = useState('');
  const [entradaCantidad, setEntradaCantidad] = useState('');
  const [entradaUnidad, setEntradaUnidad] = useState('kg');
  const [entradaPrecio, setEntradaPrecio] = useState('');
  const [entradaReceptor, setEntradaReceptor] = useState('');
  const [entradaFecha, setEntradaFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [entradaFotoFile, setEntradaFotoFile] = useState<File | null>(null);
  const [entradaNotas, setEntradaNotas] = useState('');
  const [entradaSubmitting, setEntradaSubmitting] = useState(false);
  const [entradaError, setEntradaError] = useState<string | null>(null);

  const [showProvModal, setShowProvModal] = useState(false);
  const [editProv, setEditProv] = useState<Tables<'proveedores'> | null>(null);
  const [provNombre, setProvNombre] = useState('');
  const [provNif, setProvNif] = useState('');
  const [provTelefono, setProvTelefono] = useState('');
  const [provEmail, setProvEmail] = useState('');
  const [provTipo, setProvTipo] = useState('');
  const [provContacto, setProvContacto] = useState('');
  const [provActivo, setProvActivo] = useState(true);
  const [provNotas, setProvNotas] = useState('');
  const [provFotoFile, setProvFotoFile] = useState<File | null>(null);
  const [provSubmitting, setProvSubmitting] = useState(false);
  const [provError, setProvError] = useState<string | null>(null);
  const [expandedProvId, setExpandedProvId] = useState<string | null>(null);
  const [showPrecioModal, setShowPrecioModal] = useState(false);
  const [precioProvId, setPrecioProvId] = useState<string | null>(null);
  const [precioProducto, setPrecioProducto] = useState('');
  const [precioUnidad, setPrecioUnidad] = useState('');
  const [precioValor, setPrecioValor] = useState('');
  const [precioVigencia, setPrecioVigencia] = useState(() => new Date().toISOString().split('T')[0]);
  const [precioSubmitting, setPrecioSubmitting] = useState(false);

  const navigate = useNavigate();
  const { theme } = useTheme();
  const { data: ubicaciones = [], isLoading } = useUbicaciones();
  const { data: categorias = [] } = useCategorias();
  const { data: totalRegistros, isLoading: isLoadingTotal } = useTotalRegistros();
  const { data: conteos } = useConteosUbicaciones();
  const { data: proveedores = [] } = useProveedores();
  const { data: entradas = [] } = useEntradas(
    filtroUbicacion || null,
    filtroDesde || undefined,
    filtroHasta || undefined,
  );
  const { data: productos = [] } = useProductosCatalogo(entradaCategoria || null);
  const { data: personal = [] } = usePersonal();
  const { data: precios = [] } = usePreciosProveedor(expandedProvId);
  const addProveedor = useAddProveedor();
  const updateProveedor = useUpdateProveedor();
  const deleteProveedor = useDeleteProveedor();
  const addPrecio = useAddPrecioProveedor();
  const addEntrada = useAddEntrada();
  const deleteEntrada = useDeleteEntrada();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const isDark = theme === 'dark';
  const horaStr = now.toTimeString().slice(0, 8);
  const fechaStr = now
    .toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    .toUpperCase();

  const importeCalc = parseFloat(entradaCantidad || '0') * parseFloat(entradaPrecio || '0');

  function abrirModal() {
    setSelUbics(new Set(ubicaciones.map(u => u.id)));
    setSelCats(new Set(categorias.map(c => c.id)));
    setShowModal(true);
  }

  function toggleUbic(id: string) {
    setSelUbics(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }
  function toggleCat(id: string) {
    setSelCats(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  function openProvModal(p?: Tables<'proveedores'>) {
    setEditProv(p ?? null);
    setProvNombre(p?.nombre ?? '');
    setProvNif(p?.nif ?? '');
    setProvTelefono(p?.telefono ?? '');
    setProvEmail(p?.email ?? '');
    setProvTipo(p?.tipo ?? '');
    setProvContacto(p?.persona_contacto ?? '');
    setProvActivo(p?.activo ?? true);
    setProvNotas(p?.notas ?? '');
    setProvFotoFile(null);
    setProvError(null);
    setShowProvModal(true);
  }

  function openPrecioModalForProveedor(proveedorId: string) {
    setPrecioProvId(proveedorId);
    setPrecioProducto('');
    setPrecioUnidad('');
    setPrecioValor('');
    setShowPrecioModal(true);
  }

  async function handleGuardarProveedor() {
    if (!provNombre.trim()) {
      setProvError('El nombre es obligatorio');
      return;
    }
    setProvSubmitting(true);
    setProvError(null);
    try {
      let foto_url: string | undefined = editProv?.foto_url ?? undefined;
      if (provFotoFile) {
        foto_url =
          (await uploadImage(
            provFotoFile,
            'inventario-images',
            buildStoragePath('proveedores', provFotoFile),
          )) ?? undefined;
      }
      const payload = {
        nombre: provNombre.trim(),
        nif: provNif || null,
        telefono: provTelefono || null,
        email: provEmail || null,
        tipo: provTipo || null,
        persona_contacto: provContacto || null,
        activo: provActivo,
        notas: provNotas || null,
        foto_url: foto_url ?? null,
      };
      if (editProv) {
        await updateProveedor.mutateAsync({ id: editProv.id, ...payload });
      } else {
        await addProveedor.mutateAsync(payload);
      }
      setShowProvModal(false);
    } catch (e: unknown) {
      setProvError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setProvSubmitting(false);
    }
  }

  async function handleEliminarProveedor(id: string) {
    if (!confirm('¿Eliminar este proveedor?')) return;
    await deleteProveedor.mutateAsync(id);
  }

  async function handleGuardarPrecio() {
    if (!precioProvId || !precioProducto.trim()) return;
    setPrecioSubmitting(true);
    try {
      await addPrecio.mutateAsync({
        proveedor_id: precioProvId,
        producto: precioProducto.trim(),
        unidad: precioUnidad || null,
        precio_unitario: parseFloat(precioValor) || null,
        fecha_vigencia: precioVigencia || null,
      });
      setShowPrecioModal(false);
      setPrecioProducto('');
      setPrecioUnidad('');
      setPrecioValor('');
    } finally {
      setPrecioSubmitting(false);
    }
  }

  async function handleGuardarEntrada() {
    if (!entradaUbicacion || !entradaCategoria || !entradaCantidad) {
      setEntradaError('Ubicación, categoría y cantidad son obligatorios');
      return;
    }
    setEntradaSubmitting(true);
    setEntradaError(null);
    try {
      let foto_albaran: string | null = null;
      if (entradaFotoFile) {
        foto_albaran = await uploadImage(
          entradaFotoFile,
          'inventario-images',
          buildStoragePath('albaran', entradaFotoFile),
        );
      }
      await addEntrada.mutateAsync({
        proveedor_id: entradaProveedorId || null,
        ubicacion_id: entradaUbicacion,
        categoria_id: entradaCategoria,
        producto_id: entradaProductoId || null,
        cantidad: parseFloat(entradaCantidad),
        unidad: entradaUnidad,
        precio_unitario: parseFloat(entradaPrecio) || null,
        importe_total: importeCalc > 0 ? importeCalc : null,
        receptor: entradaReceptor || null,
        fecha: entradaFecha || null,
        foto_albaran,
        notas: entradaNotas || null,
      });
      setShowEntradaModal(false);
      setEntradaProveedorId('');
      setEntradaUbicacion('');
      setEntradaCategoria('');
      setEntradaProductoId('');
      setEntradaCantidad('');
      setEntradaUnidad('kg');
      setEntradaPrecio('');
      setEntradaReceptor('');
      setEntradaNotas('');
      setEntradaFotoFile(null);
    } catch (e: unknown) {
      setEntradaError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setEntradaSubmitting(false);
    }
  }

  async function generarPDFGlobal() {
    if (selUbics.size === 0 || selCats.size === 0) return;
    setGenPdf(true);
    try {
      await generarInventarioGlobalPdf({ fechaDesde, fechaHasta, selUbics, selCats });
      setShowModal(false);
    } finally {
      setGenPdf(false);
    }
  }

  async function crearProveedorDesdeEntrada(nombre: string): Promise<string> {
    const result = await addProveedor.mutateAsync({ nombre, tipo: 'proveedor_materiales' });
    return (result as { id: string }).id;
  }

  const entradasFiltradas = filtroCategoria
    ? entradas.filter(e => e.categoria_id === filtroCategoria)
    : entradas;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white flex flex-col transition-colors duration-300">
      <InventarioPageHeader
        fechaStr={fechaStr}
        horaStr={horaStr}
        onAbrirInformeGlobal={abrirModal}
        onVolverDashboard={() => navigate('/dashboard')}
      />

      <InventarioMainTabBar mainTab={mainTab} setMainTab={setMainTab} />

      <main className="flex-1 px-6 py-8">
        {mainTab === 'ubicaciones' && (
          <InventarioTabUbicaciones
            isDark={isDark}
            isLoading={isLoading}
            isLoadingTotal={isLoadingTotal}
            totalRegistros={totalRegistros}
            ubicaciones={ubicaciones}
            conteos={conteos}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
          />
        )}
        {mainTab === 'entradas' && (
          <InventarioTabEntradas
            ubicaciones={ubicaciones}
            categorias={categorias}
            filtroUbicacion={filtroUbicacion}
            setFiltroUbicacion={setFiltroUbicacion}
            filtroCategoria={filtroCategoria}
            setFiltroCategoria={setFiltroCategoria}
            filtroDesde={filtroDesde}
            setFiltroDesde={setFiltroDesde}
            filtroHasta={filtroHasta}
            setFiltroHasta={setFiltroHasta}
            entradasFiltradas={entradasFiltradas}
            onNuevaEntrada={() => setShowEntradaModal(true)}
            onDeleteEntrada={id => deleteEntrada.mutate(id)}
          />
        )}
        {mainTab === 'proveedores' && (
          <InventarioTabProveedores
            proveedores={proveedores}
            expandedProvId={expandedProvId}
            setExpandedProvId={setExpandedProvId}
            precios={precios}
            onOpenProvModal={openProvModal}
            onEliminarProveedor={handleEliminarProveedor}
            onOpenPrecioModal={openPrecioModalForProveedor}
          />
        )}
      </main>

      <InventarioPageFooter numProveedores={proveedores.length} numEntradas={entradas.length} horaStr={horaStr} />

      {showModal && (
        <ModalInformeGlobalPdf
          ubicaciones={ubicaciones}
          categorias={categorias}
          fechaDesde={fechaDesde}
          fechaHasta={fechaHasta}
          selUbics={selUbics}
          selCats={selCats}
          genPdf={genPdf}
          onClose={() => setShowModal(false)}
          setFechaDesde={setFechaDesde}
          setFechaHasta={setFechaHasta}
          onSelectAllUbics={() => setSelUbics(new Set(ubicaciones.map(u => u.id)))}
          onClearUbics={() => setSelUbics(new Set())}
          onSelectAllCats={() => setSelCats(new Set(categorias.map(c => c.id)))}
          onClearCats={() => setSelCats(new Set())}
          toggleUbic={toggleUbic}
          toggleCat={toggleCat}
          onGenerar={() => {
            void generarPDFGlobal();
          }}
        />
      )}

      {showEntradaModal && (
        <ModalNuevaEntrada
          proveedores={proveedores}
          ubicaciones={ubicaciones}
          categorias={categorias}
          productos={productos}
          personal={personal}
          catUnidades={catUnidades}
          catReceptores={catReceptores}
          entradaError={entradaError}
          entradaProveedorId={entradaProveedorId}
          entradaUbicacion={entradaUbicacion}
          entradaCategoria={entradaCategoria}
          entradaProductoId={entradaProductoId}
          entradaCantidad={entradaCantidad}
          entradaUnidad={entradaUnidad}
          entradaPrecio={entradaPrecio}
          importeCalc={importeCalc}
          entradaReceptor={entradaReceptor}
          entradaFecha={entradaFecha}
          entradaFotoFile={entradaFotoFile}
          entradaNotas={entradaNotas}
          entradaSubmitting={entradaSubmitting}
          onClose={() => setShowEntradaModal(false)}
          setEntradaProveedorId={setEntradaProveedorId}
          setEntradaUbicacion={setEntradaUbicacion}
          setEntradaCategoria={setEntradaCategoria}
          setEntradaProductoId={setEntradaProductoId}
          setEntradaCantidad={setEntradaCantidad}
          setEntradaUnidad={setEntradaUnidad}
          setEntradaPrecio={setEntradaPrecio}
          setEntradaReceptor={setEntradaReceptor}
          setEntradaFecha={setEntradaFecha}
          setEntradaFotoFile={setEntradaFotoFile}
          setEntradaNotas={setEntradaNotas}
          onCreateProveedor={crearProveedorDesdeEntrada}
          onGuardar={handleGuardarEntrada}
        />
      )}

      {showProvModal && (
        <ModalProveedor
          editProv={editProv}
          provError={provError}
          provNombre={provNombre}
          provNif={provNif}
          provTelefono={provTelefono}
          provEmail={provEmail}
          provTipo={provTipo}
          provContacto={provContacto}
          provActivo={provActivo}
          provNotas={provNotas}
          provFotoFile={provFotoFile}
          provSubmitting={provSubmitting}
          onClose={() => setShowProvModal(false)}
          setProvNombre={setProvNombre}
          setProvNif={setProvNif}
          setProvTelefono={setProvTelefono}
          setProvEmail={setProvEmail}
          setProvTipo={setProvTipo}
          setProvContacto={setProvContacto}
          setProvActivo={setProvActivo}
          setProvNotas={setProvNotas}
          setProvFotoFile={setProvFotoFile}
          onGuardar={handleGuardarProveedor}
        />
      )}

      {showPrecioModal && (
        <ModalPrecioProveedor
          catUnidades={catUnidades}
          precioProducto={precioProducto}
          precioUnidad={precioUnidad}
          precioValor={precioValor}
          precioVigencia={precioVigencia}
          precioSubmitting={precioSubmitting}
          onClose={() => setShowPrecioModal(false)}
          setPrecioProducto={setPrecioProducto}
          setPrecioUnidad={setPrecioUnidad}
          setPrecioValor={setPrecioValor}
          setPrecioVigencia={setPrecioVigencia}
          onGuardar={handleGuardarPrecio}
        />
      )}
    </div>
  );
}
