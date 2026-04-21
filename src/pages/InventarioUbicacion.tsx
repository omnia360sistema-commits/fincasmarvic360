import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  useUbicaciones, useCategorias, useUltimoRegistro,
  useRegistros, useAddRegistro,
  useProductosCatalogo, useAddProductoCatalogo, useAddMovimiento,
  useActivosEnUbicacionVista, useInventarioUbicacionActivosAll,
  useAperosTablaInventario, useAssignActivoUbicacion, useRemoveActivoUbicacion,
  useMaquinariaAperosAsignadosUbicacion, useResumenUbicacion,
  useEntradas,
} from '@/hooks/useInventario'
import { useTractores, useAperos } from '@/hooks/useMaquinaria'
import type { ActivoAssignTab, PanelView, InformeTipo } from '@/components/InventarioUbicacion/inventarioUbicacionTypes'
import type { TablesInsert } from '@/integrations/supabase/types'
import { supabase } from '@/integrations/supabase/client'
import { uploadImage } from '@/utils/uploadImage'
import {
  inventarioUbicacionGenerarPDF,
  inventarioUbicacionGenerarExcel,
} from '@/utils/inventarioUbicacionInforme'
import { InventarioUbicacionModalInforme } from '@/components/InventarioUbicacion/InventarioUbicacionModalInforme'
import { InventarioUbicacionModalRegistro } from '@/components/InventarioUbicacion/InventarioUbicacionModalRegistro'
import { InventarioUbicacionModalMover } from '@/components/InventarioUbicacion/InventarioUbicacionModalMover'
import { InventarioUbicacionModalActivo } from '@/components/InventarioUbicacion/InventarioUbicacionModalActivo'
import { InventarioUbicacionPanelLateral } from '@/components/InventarioUbicacion/InventarioUbicacionPanelLateral'
import { InventarioUbicacionStockMaquinariaBar } from '@/components/InventarioUbicacion/InventarioUbicacionStockMaquinariaBar'
import { InventarioUbicacionPageChrome } from '@/components/InventarioUbicacion/InventarioUbicacionPageChrome'

export default function InventarioUbicacion() {
  const { ubicacionId } = useParams<{ ubicacionId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [activeCatId, setActiveCatId] = useState<string | null>(null)
  const [panelView, setPanelView] = useState<PanelView>('estado')
  const [showModal, setShowModal] = useState(false)
  const [now, setNow] = useState(new Date())

  const [cantidad, setCantidad] = useState('')
  const [unidad, setUnidad] = useState('kg')
  const [descripcion, setDescripcion] = useState('')
  const [notas, setNotas] = useState('')
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [productoId, setProductoId] = useState<string>('')
  const [productoNombre, setProductoNombre] = useState('')
  const [precioUnitario, setPrecioUnitario] = useState('')
  const [fotoFile2, setFotoFile2] = useState<File | null>(null)
  const [preview2, setPreview2] = useState<string | null>(null)
  const [responsable, setResponsable] = useState('')
  const [showMoverModal, setShowMoverModal] = useState(false)
  const [moverProductoId, setMoverProductoId] = useState<string>('')
  const [moverCantidad, setMoverCantidad] = useState('')
  const [moverUnidad, setMoverUnidad] = useState('kg')
  const [moverDestinoId, setMoverDestinoId] = useState('')
  const [moverResponsable, setMoverResponsable] = useState('')
  const [moverNotas, setMoverNotas] = useState('')
  const [submittingMover, setSubmittingMover] = useState(false)
  const [moverError, setMoverError] = useState<string | null>(null)

  const [showInformeModal, setShowInformeModal] = useState(false)
  const [informeTipo, setInformeTipo] = useState<InformeTipo>('historico')
  const [informeFechaInicio, setInformeFechaInicio] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })
  const [informeFechaFin, setInformeFechaFin] = useState(() => new Date().toISOString().slice(0, 10))
  const [informeCategoria, setInformeCategoria] = useState('')
  const [informeMes, setInformeMes] = useState(() => new Date().getMonth() + 1)
  const [informeAnio, setInformeAnio] = useState(() => new Date().getFullYear())
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [generandoExcel, setGenerandoExcel] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [showPdfMenu, setShowPdfMenu] = useState(false)
  const [showActivoModal, setShowActivoModal] = useState(false)
  const [activoTab, setActivoTab] = useState<ActivoAssignTab>('tractor')
  const [selTractorId, setSelTractorId] = useState('')
  const [selAperoId, setSelAperoId] = useState('')
  const [selMaquinariaAperoId, setSelMaquinariaAperoId] = useState('')
  const [activoSubmitting, setActivoSubmitting] = useState(false)
  const [activoError, setActivoError] = useState<string | null>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const { data: ubicaciones = [] } = useUbicaciones()
  const { data: categorias = [] } = useCategorias()
  const { data: ultimoRegistro } = useUltimoRegistro(ubicacionId ?? null, activeCatId)
  const { data: registros = [] } = useRegistros(ubicacionId ?? null, activeCatId)
  const { data: productos = [] } = useProductosCatalogo(activeCatId)
  const addRegistro = useAddRegistro()
  const addProductoCatalogo = useAddProductoCatalogo()
  const addMovimiento = useAddMovimiento()
  const { data: activosVista = [] } = useActivosEnUbicacionVista(ubicacionId ?? null)
  const { data: todasAsign = [] } = useInventarioUbicacionActivosAll()
  const { data: resumenUbic = [] } = useResumenUbicacion(ubicacionId ?? null)
  const { data: entradasUbic = [] } = useEntradas(ubicacionId ?? null)
  const { data: aperosInv = [] } = useAperosTablaInventario()
  const { data: tractores = [] } = useTractores()
  const { data: maqAperosCat = [] } = useAperos()
  const { data: maperosUbic = [] } = useMaquinariaAperosAsignadosUbicacion(ubicacionId ?? null)
  const assignActivo = useAssignActivoUbicacion()
  const removeActivo = useRemoveActivoUbicacion()

  const ubicacion = ubicaciones.find(u => u.id === ubicacionId)
  const activeCat = categorias.find(c => c.id === activeCatId)
  const horaStr = now.toTimeString().slice(0, 8)
  const isFito = activeCat?.slug === 'fitosanitarios_abonos'
  const importe = parseFloat(cantidad || '0') * parseFloat(precioUnitario || '0')

  const informeCallbacks = {
    setGenerandoPDF,
    setGenerandoExcel,
    setPdfError,
    setShowInformeModal,
  }

  function buildFetchParams() {
    return {
      ubicacionId: ubicacionId!,
      informeTipo,
      informeFechaInicio,
      informeFechaFin,
      informeCategoria,
      informeMes,
      informeAnio,
    }
  }

  async function generarPDF() {
    if (!ubicacionId || !ubicacion) return
    await inventarioUbicacionGenerarPDF(
      ubicacionId,
      ubicacion.nombre,
      categorias.map(c => ({ id: c.id, nombre: c.nombre })),
      buildFetchParams(),
      informeCallbacks
    )
  }

  async function generarExcel() {
    if (!ubicacionId || !ubicacion) return
    await inventarioUbicacionGenerarExcel(
      ubicacionId,
      ubicacion.nombre,
      buildFetchParams(),
      informeCallbacks
    )
  }

  function handleSelectCat(id: string) {
    if (activeCatId === id) {
      setActiveCatId(null)
    } else {
      setActiveCatId(id)
      setPanelView('estado')
      setShowModal(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFotoFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  function openModal() {
    setCantidad('')
    setUnidad('kg')
    setDescripcion('')
    setNotas('')
    setFotoFile(null)
    setPreview(null)
    setSubmitError(null)
    setProductoId('')
    setProductoNombre('')
    setPrecioUnitario('')
    setFotoFile2(null)
    setPreview2(null)
    setResponsable('')
    setShowModal(true)
  }

  function openMoverModal() {
    setMoverProductoId('')
    setMoverCantidad('')
    setMoverUnidad('kg')
    setMoverDestinoId('')
    setMoverResponsable('')
    setMoverNotas('')
    setMoverError(null)
    setShowMoverModal(true)
  }

  function openActivoModalFn() {
    setActivoTab('tractor')
    setSelTractorId('')
    setSelAperoId('')
    setSelMaquinariaAperoId('')
    setActivoError(null)
    setShowActivoModal(true)
  }

  const tractoresLibres = tractores.filter(t => {
    const a = todasAsign.find((x: { maquinaria_tractor_id?: string | null }) => x.maquinaria_tractor_id === t.id)
    return !a
  })
  const aperosLibres = aperosInv.filter(ap => {
    const x = todasAsign.find((y: { apero_id?: string | null }) => y.apero_id === ap.id)
    return !x
  })
  const maquinariaAperosLibres = maqAperosCat.filter(a => {
    const x = todasAsign.find((y: { maquinaria_apero_id?: string | null }) => y.maquinaria_apero_id === a.id)
    return !x
  })

  async function handleSubmitActivo(e: React.FormEvent) {
    e.preventDefault()
    if (!ubicacionId) return
    setActivoError(null)
    if (activoTab === 'tractor' && !selTractorId) {
      setActivoError('Selecciona un tractor')
      return
    }
    if (activoTab === 'apero' && !selAperoId) {
      setActivoError('Selecciona un apero')
      return
    }
    if (activoTab === 'maquinaria_apero' && !selMaquinariaAperoId) {
      setActivoError('Selecciona un apero del módulo Maquinaria')
      return
    }
    setActivoSubmitting(true)
    try {
      await assignActivo.mutateAsync({
        ubicacion_id: ubicacionId,
        maquinaria_tractor_id: activoTab === 'tractor' ? selTractorId : null,
        apero_id: activoTab === 'apero' ? selAperoId : null,
        maquinaria_apero_id: activoTab === 'maquinaria_apero' ? selMaquinariaAperoId : null,
      } as TablesInsert<'inventario_ubicacion_activo'>)
      setShowActivoModal(false)
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err)
      setActivoError(
        raw.includes('23505') || raw.toLowerCase().includes('unique')
          ? 'Ese activo ya está asignado (solo una ubicación de inventario).'
          : raw
      )
    } finally {
      setActivoSubmitting(false)
    }
  }

  async function handleRemoveActivo(asignacionId: string | null) {
    if (!ubicacionId || !asignacionId) return
    setActivoError(null)
    try {
      await removeActivo.mutateAsync({ id: asignacionId, ubicacion_id: ubicacionId })
    } catch (err: unknown) {
      setActivoError(err instanceof Error ? err.message : 'No se pudo quitar la asignación')
    }
  }

  async function handleDeleteRegistro(registroId: string) {
    await supabase.from('inventario_registros').delete().eq('id', registroId)
    qc.invalidateQueries({ queryKey: ['inventario_registros', ubicacionId, activeCatId] })
    qc.invalidateQueries({ queryKey: ['inventario_ultimo_registro', ubicacionId, activeCatId] })
    qc.invalidateQueries({ queryKey: ['inventario_resumen_ubicacion', ubicacionId] })
    qc.invalidateQueries({ queryKey: ['inventario_total_registros'] })
    qc.invalidateQueries({ queryKey: ['inventario_conteos_ubicaciones'] })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ubicacionId || !activeCatId || !cantidad) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      let resolvedProductoId: string | null = null
      if (productoId === 'nuevo') {
        if (!productoNombre.trim()) throw new Error('El nombre del producto es obligatorio')
        const nuevo = await addProductoCatalogo.mutateAsync({
          nombre: productoNombre.trim(),
          categoria_id: activeCatId,
          precio_unitario: precioUnitario ? parseFloat(precioUnitario) : null,
          unidad_defecto: unidad,
          created_by: responsable || null,
        })
        resolvedProductoId = nuevo.id
      } else if (productoId) {
        resolvedProductoId = productoId
      }

      let foto_url: string | null = null
      if (fotoFile) {
        const ext = fotoFile.name.split('.').pop() ?? 'jpg'
        const path = `${ubicacionId}/${activeCatId}/${Date.now()}.${ext}`
        foto_url = await uploadImage(fotoFile, 'inventario-images', path, false)
        if (!foto_url) throw new Error('Error subiendo foto 1')
      }

      let foto_url_2: string | null = null
      if (fotoFile2) {
        const ext = fotoFile2.name.split('.').pop() ?? 'jpg'
        const path = `${ubicacionId}/${activeCatId}/lote_${Date.now()}.${ext}`
        foto_url_2 = await uploadImage(fotoFile2, 'inventario-images', path, false)
        if (!foto_url_2) throw new Error('Error subiendo foto 2')
      }

      await addRegistro.mutateAsync({
        ubicacion_id: ubicacionId,
        categoria_id: activeCatId,
        cantidad: parseFloat(cantidad),
        unidad,
        descripcion: descripcion || null,
        notas: notas || null,
        foto_url,
        foto_url_2,
        precio_unitario: precioUnitario ? parseFloat(precioUnitario) : null,
        producto_id: resolvedProductoId,
        created_by: responsable || null,
      })

      setShowModal(false)
      setPanelView('estado')

    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmitMover(e: React.FormEvent) {
    e.preventDefault()
    if (!ubicacionId || !activeCatId || !moverCantidad || !moverDestinoId) return
    setSubmittingMover(true)
    setMoverError(null)

    try {
      const cantidadNum = parseFloat(moverCantidad)

      const { data: origenRow } = await supabase
        .from('inventario_registros')
        .select('cantidad, unidad')
        .eq('ubicacion_id', ubicacionId)
        .eq('categoria_id', activeCatId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const stockOrigen = origenRow?.cantidad ?? 0
      if (cantidadNum > stockOrigen) {
        throw new Error(
          `Stock insuficiente en origen (disponible: ${stockOrigen} ${origenRow?.unidad ?? ''})`
        )
      }

      const { data: destinoRow } = await supabase
        .from('inventario_registros')
        .select('cantidad')
        .eq('ubicacion_id', moverDestinoId)
        .eq('categoria_id', activeCatId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const stockDestino = destinoRow?.cantidad ?? 0

      await addRegistro.mutateAsync({
        ubicacion_id: ubicacionId,
        categoria_id: activeCatId,
        cantidad: stockOrigen - cantidadNum,
        unidad: moverUnidad,
        descripcion: 'Salida por movimiento a otra ubicación',
        producto_id: moverProductoId || null,
        created_by: moverResponsable || null,
      })

      await addRegistro.mutateAsync({
        ubicacion_id: moverDestinoId,
        categoria_id: activeCatId,
        cantidad: stockDestino + cantidadNum,
        unidad: moverUnidad,
        descripcion: 'Entrada por movimiento desde otra ubicación',
        producto_id: moverProductoId || null,
        created_by: moverResponsable || null,
      })

      await addMovimiento.mutateAsync({
        producto_id: moverProductoId || null,
        categoria_id: activeCatId,
        ubicacion_origen_id: ubicacionId,
        ubicacion_destino_id: moverDestinoId,
        cantidad: cantidadNum,
        unidad: moverUnidad,
        responsable: moverResponsable || null,
        notas: moverNotas || null,
        created_by: moverResponsable || null,
      })

      setShowMoverModal(false)

    } catch (err: unknown) {
      setMoverError(err instanceof Error ? err.message : 'Error al registrar el movimiento')
    } finally {
      setSubmittingMover(false)
    }
  }

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-[#020617]">

      <InventarioUbicacionPageChrome
        ubicacionNombre={ubicacion?.nombre}
        horaStr={horaStr}
        onBack={() => navigate('/inventario')}
        categorias={categorias}
        activeCatId={activeCatId}
        onSelectCat={handleSelectCat}
        showPdfMenu={showPdfMenu}
        setShowPdfMenu={setShowPdfMenu}
        onPickInforme={tipo => {
          setInformeTipo(tipo);
          setPdfError(null);
          setShowInformeModal(true);
          setShowPdfMenu(false);
        }}
        onOpenInformeExcel={() => {
          setInformeTipo('historico');
          setShowInformeModal(true);
          setShowPdfMenu(false);
        }}
      />

      {activeCatId && activeCat && (
        <InventarioUbicacionPanelLateral
          activeCat={activeCat}
          panelView={panelView}
          setPanelView={setPanelView}
          setActiveCatId={setActiveCatId}
          ultimoRegistro={ultimoRegistro}
          registros={registros}
          onDeleteRegistro={handleDeleteRegistro}
          openModal={openModal}
          openMoverModal={openMoverModal}
        />
      )}

      <InventarioUbicacionStockMaquinariaBar
        ubicacionId={ubicacionId}
        ubicacionNombre={ubicacion?.nombre}
        horaStr={horaStr}
        resumenUbic={resumenUbic}
        entradasUbic={entradasUbic}
        activosVista={activosVista}
        maperosUbic={maperosUbic}
        activoError={activoError}
        showActivoModal={showActivoModal}
        openActivoModalFn={openActivoModalFn}
        onRemoveActivo={aid => { void handleRemoveActivo(aid) }}
      />

      <InventarioUbicacionModalInforme
        open={showInformeModal}
        ubicacionNombre={ubicacion?.nombre}
        categorias={categorias}
        informeTipo={informeTipo}
        setInformeTipo={setInformeTipo}
        informeFechaInicio={informeFechaInicio}
        setInformeFechaInicio={setInformeFechaInicio}
        informeFechaFin={informeFechaFin}
        setInformeFechaFin={setInformeFechaFin}
        informeCategoria={informeCategoria}
        setInformeCategoria={setInformeCategoria}
        informeMes={informeMes}
        setInformeMes={setInformeMes}
        informeAnio={informeAnio}
        setInformeAnio={setInformeAnio}
        generandoPDF={generandoPDF}
        generandoExcel={generandoExcel}
        pdfError={pdfError}
        onClose={() => setShowInformeModal(false)}
        onGenerarPDF={() => { void generarPDF() }}
        onGenerarExcel={() => { void generarExcel() }}
      />

      <InventarioUbicacionModalRegistro
        open={showModal}
        activeCat={activeCat}
        isFito={!!isFito}
        productos={productos}
        productoId={productoId}
        setProductoId={setProductoId}
        productoNombre={productoNombre}
        setProductoNombre={setProductoNombre}
        cantidad={cantidad}
        setCantidad={setCantidad}
        unidad={unidad}
        setUnidad={setUnidad}
        precioUnitario={precioUnitario}
        setPrecioUnitario={setPrecioUnitario}
        importe={importe}
        descripcion={descripcion}
        setDescripcion={setDescripcion}
        notas={notas}
        setNotas={setNotas}
        preview={preview}
        preview2={preview2}
        setFotoFile={setFotoFile}
        setPreview={setPreview}
        setFotoFile2={setFotoFile2}
        setPreview2={setPreview2}
        responsable={responsable}
        setResponsable={setResponsable}
        submitError={submitError}
        submitting={submitting}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        onFileChange={handleFileChange}
      />

      <InventarioUbicacionModalMover
        open={showMoverModal}
        ubicacionId={ubicacionId}
        activeCat={activeCat}
        ubicaciones={ubicaciones}
        productos={productos}
        moverProductoId={moverProductoId}
        setMoverProductoId={setMoverProductoId}
        moverCantidad={moverCantidad}
        setMoverCantidad={setMoverCantidad}
        moverUnidad={moverUnidad}
        setMoverUnidad={setMoverUnidad}
        moverDestinoId={moverDestinoId}
        setMoverDestinoId={setMoverDestinoId}
        moverResponsable={moverResponsable}
        setMoverResponsable={setMoverResponsable}
        moverNotas={moverNotas}
        setMoverNotas={setMoverNotas}
        moverError={moverError}
        submittingMover={submittingMover}
        onClose={() => setShowMoverModal(false)}
        onSubmit={handleSubmitMover}
      />

      <InventarioUbicacionModalActivo
        open={showActivoModal}
        ubicacionId={ubicacionId}
        activoTab={activoTab}
        setActivoTab={setActivoTab}
        selTractorId={selTractorId}
        setSelTractorId={setSelTractorId}
        selAperoId={selAperoId}
        setSelAperoId={setSelAperoId}
        selMaquinariaAperoId={selMaquinariaAperoId}
        setSelMaquinariaAperoId={setSelMaquinariaAperoId}
        tractoresLibres={tractoresLibres}
        aperosLibres={aperosLibres}
        maquinariaAperosLibres={maquinariaAperosLibres}
        activoError={activoError}
        setActivoError={setActivoError}
        activoSubmitting={activoSubmitting}
        onClose={() => setShowActivoModal(false)}
        onSubmit={handleSubmitActivo}
      />

    </div>
  )
}
