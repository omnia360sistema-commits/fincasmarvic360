import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import {
  useParcelRecords,
  useParcelProduction,
  useParcelTickets,
  useParcelResiduos,
  useParcelCertification,
  useParcelAnalisisSuelo,
  useFincaAnalisisAgua,
  useParcelLecturasSensor
} from '@/hooks/useParcelData'
import { useRegistrosRiego } from '@/hooks/useRiego'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, AlertCircle, Clock, X, MapPin } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function ParcelHistory({
  parcelId,
  onClose
}: {
  parcelId: string
  onClose: () => void
}) {
  const { workRecords, plantings, harvests } = useParcelRecords(parcelId)
  const latestCrop                           = plantings.data?.[0]?.crop ?? null
  const { data: production }                 = useParcelProduction(parcelId, latestCrop)
  const { data: tickets }                    = useParcelTickets(parcelId)
  const { data: residuos }                   = useParcelResiduos(parcelId)
  const { data: certification }              = useParcelCertification(parcelId)
  const estimatedProduction                  = production?.estimated_production_kg ?? null

  // Suelo charts state
  const [chartParam, setChartParam] = useState<string>('ph')
  const chartParamMap: Record<string, string> = {
    'ph': 'pH', 'conductividad_ec': 'EC', 'salinidad_ppm': 'Salinidad',
    'nitrogeno_ppm': 'N', 'fosforo_ppm': 'P', 'potasio_ppm': 'K'
  }

  // Galería — fotos_campo por parcela
  const [fotoModal, setFotoModal] = useState<null | {
    url: string; descripcion: string | null; fecha: string | null; tipo: string | null; lat: number | null; lng: number | null
  }>(null)
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')

  const { data: fotosData } = useQuery({
    queryKey: ['fotos_campo', parcelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fotos_campo')
        .select('id, url_imagen, descripcion, fecha, tipo, latitud, longitud')
        .eq('parcel_id', parcelId)
        .order('fecha', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!parcelId
  })

  const tiposDisponibles = fotosData
    ? Array.from(new Set(fotosData.map(f => f.tipo ?? 'general').filter(Boolean)))
    : []

  const fotosFiltradas = fotosData
    ? (filtroTipo === 'todos' ? fotosData : fotosData.filter(f => (f.tipo ?? 'general') === filtroTipo))
    : []

  // Obtener finca para análisis agua
  const { data: parcelaInfo } = useQuery({
    queryKey: ['parcela_info', parcelId],
    queryFn: async () => {
      const { data } = await supabase
        .from('parcels')
        .select('farm')
        .eq('parcel_id', parcelId)
        .single()
      return data
    },
    enabled: !!parcelId
  })
  const finca = parcelaInfo?.farm

  // Hooks para análisis
  const { data: analisisSuelo } = useParcelAnalisisSuelo(parcelId)
  const { data: analisisAgua } = useFincaAnalisisAgua(finca)
  const { data: lecturasSensor } = useParcelLecturasSensor(parcelId)
  
  // Hook para Riegos
  const { data: riegos } = useRegistrosRiego(parcelId)

  return (
    <div className="px-4 pb-4 pt-2">
      <Tabs defaultValue="work">

        <TabsList className="w-full bg-slate-800 rounded-lg overflow-x-auto flex gap-0.5 p-0.5 mb-3">
          {[
            { value: 'work',          label: 'Trabajos' },
            { value: 'plantings',     label: 'Plantaciones' },
            { value: 'harvests',      label: 'Cosechas' },
            { value: 'tickets',       label: 'Tickets' },
            { value: 'residuos',      label: 'Residuos' },
            { value: 'certificacion', label: 'Cert.' },
            { value: 'riego',         label: 'Riegos' },
            { value: 'analisis',      label: 'Análisis' },
            { value: 'galeria',       label: 'Galería' },
          ].map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex-1 text-[9px] font-black uppercase tracking-wide rounded-md data-[state=active]:bg-[#38bdf8]/20 data-[state=active]:text-[#38bdf8] text-slate-500 px-1 py-1.5"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── TRABAJOS ─────────────────────────────── */}
        <TabsContent value="work" className="space-y-2 mt-0">
          {workRecords.isLoading && <Spinner />}
          {!workRecords.isLoading && !workRecords.data?.length && <Empty />}
          {workRecords.data?.map(r => (
            <Card key={r.id}>
              <Row label="Tipo"         value={r.work_type} capitalize />
              <Row label="Fecha"        value={r.date} />
              <Row label="Trabajadores" value={`${r.workers || 0}`} />
              <Row label="Horas"        value={`${r.hours || 0} h`} />
              {(r as any).cuadrillas?.nombre && (
                <Row label="Cuadrilla" value={(r as any).cuadrillas.nombre} accent />
              )}
              {r.hora_entrada && r.hora_salida && (
                <Row
                  label="Horario"
                  value={`${new Date(r.hora_entrada).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} → ${new Date(r.hora_salida).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                />
              )}
              {r.description && <Row label="Nota" value={r.description} />}
            </Card>
          ))}
        </TabsContent>

        {/* ── PLANTACIONES ─────────────────────────── */}
        <TabsContent value="plantings" className="space-y-2 mt-0">
          {plantings.isLoading && <Spinner />}
          {!plantings.isLoading && !plantings.data?.length && <Empty />}
          {plantings.data?.map(r => (
            <Card key={r.id}>
              <Row label="Cultivo"          value={r.crop} capitalize accent />
              {r.variedad && <Row label="Variedad" value={r.variedad} />}
              <Row label="Fecha plantación" value={r.date} />
              {r.fecha_cosecha_estimada && (
                <Row label="Cosecha est." value={r.fecha_cosecha_estimada} />
              )}
              {r.marco_cm_entre_lineas && r.marco_cm_entre_plantas && (
                <Row label="Marco" value={`${r.marco_cm_entre_lineas}×${r.marco_cm_entre_plantas} cm`} />
              )}
              {r.lote_semilla    && <Row label="Lote"      value={r.lote_semilla} />}
              {r.proveedor_semilla && <Row label="Proveedor" value={r.proveedor_semilla} />}
              {r.notes           && <Row label="Nota"      value={r.notes} />}
            </Card>
          ))}
        </TabsContent>

        {/* ── COSECHAS ─────────────────────────────── */}
        <TabsContent value="harvests" className="space-y-2 mt-0">
          {harvests.isLoading && <Spinner />}
          {!harvests.isLoading && !harvests.data?.length && <Empty />}
          {harvests.data?.map(r => {
            const real        = r.production_kg ?? 0
            const performance = estimatedProduction && real
              ? Math.round((real / estimatedProduction) * 100)
              : null
            const perfColor = performance
              ? performance >= 90 ? 'text-green-400'
              : performance >= 70 ? 'text-yellow-400'
              : 'text-red-400'
              : ''
            return (
              <Card key={r.id}>
                <Row label="Cultivo"    value={r.crop} capitalize accent />
                <Row label="Fecha"      value={r.date} />
                <Row label="Producción" value={`${real.toLocaleString()} kg`} />
                {estimatedProduction && (
                  <Row label="Estimado" value={`${estimatedProduction.toLocaleString()} kg`} />
                )}
                {performance !== null && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wide">Rendimiento</span>
                    <span className={`text-[11px] font-black ${perfColor}`}>{performance}%</span>
                  </div>
                )}
                {r.notes && <Row label="Nota" value={r.notes} />}
              </Card>
            )
          })}
        </TabsContent>

        {/* ── TICKETS ──────────────────────────────── */}
        <TabsContent value="tickets" className="space-y-2 mt-0">
          {!tickets?.length && <Empty />}
          {tickets?.map(t => {
            const matricula = (t as any).camiones?.matricula ?? t.matricula_manual ?? '—'
            const fecha     = t.created_at
              ? new Date(t.created_at).toLocaleDateString('es-ES')
              : '—'
            return (
              <Card key={t.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black text-white">
                    {t.numero_albaran ?? 'Sin albarán'}
                  </span>
                  <span className="text-[11px] font-black text-[#38bdf8]">
                    {(t.peso_neto_kg ?? 0).toLocaleString()} kg
                  </span>
                </div>
                <Row label="Matrícula" value={matricula} />
                <Row label="Fecha"     value={fecha} />
                <Row label="Destino"   value={t.destino} />
                {t.conductor && <Row label="Conductor" value={t.conductor} />}
              </Card>
            )
          })}
        </TabsContent>

        {/* ── RESIDUOS ─────────────────────────────── */}
        <TabsContent value="residuos" className="space-y-2 mt-0">
          {!residuos?.length && <Empty />}
          {residuos?.map(r => {
            const pendiente = (r.kg_instalados ?? 0) - (r.kg_retirados ?? 0)
            return (
              <Card key={r.id}>
                <Row label="Tipo"       value={r.tipo_residuo.replace(/_/g, ' ')} capitalize accent />
                <Row label="Instalado"  value={`${(r.kg_instalados ?? 0).toLocaleString()} kg`} />
                {r.kg_retirados ? (
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wide">Retirado</span>
                    <span className="text-[11px] font-semibold text-green-400">
                      {r.kg_retirados.toLocaleString()} kg
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wide">Pendiente</span>
                    <span className="text-[11px] font-semibold text-yellow-400">
                      {pendiente.toLocaleString()} kg
                    </span>
                  </div>
                )}
                {r.proveedor       && <Row label="Proveedor" value={r.proveedor} />}
                {r.gestor_residuos && <Row label="Gestor"    value={r.gestor_residuos} />}
              </Card>
            )
          })}
        </TabsContent>

        {/* ── CERTIFICACIÓN ────────────────────────── */}
        <TabsContent value="certificacion" className="space-y-2 mt-0">
          {!certification && <Empty />}
          {certification && (() => {
            const cfg: Record<string, { color: string; icon: React.ReactNode }> = {
              vigente:    { color: 'text-green-400',  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
              suspendida: { color: 'text-red-400',    icon: <AlertCircle  className="w-3.5 h-3.5" /> },
              en_tramite: { color: 'text-yellow-400', icon: <Clock        className="w-3.5 h-3.5" /> },
              caducada:   { color: 'text-red-400',    icon: <AlertCircle  className="w-3.5 h-3.5" /> },
            }
            const c = cfg[certification.estado] ?? cfg.en_tramite
            return (
              <Card>
                <Row label="Entidad"    value={certification.entidad_certificadora} accent />
                <div className={`flex items-center gap-1.5 my-1 ${c.color}`}>
                  {c.icon}
                  <span className="text-[11px] font-black capitalize">
                    {certification.estado.replace(/_/g, ' ')}
                  </span>
                </div>
                {certification.numero_expediente && (
                  <Row label="Expediente" value={certification.numero_expediente} />
                )}
                <Row label="Campaña" value={certification.campana} />
                <Row label="Inicio"  value={certification.fecha_inicio} />
                {certification.fecha_fin && (
                  <Row label="Fin" value={certification.fecha_fin} />
                )}
                {certification.observaciones && (
                  <Row label="Observaciones" value={certification.observaciones} />
                )}
              </Card>
            )
          })()}
        </TabsContent>

        {/* ── RIEGOS ───────────────────────────────── */}
        <TabsContent value="riego" className="space-y-2 mt-0">
          {!riegos?.length && <Empty />}
          {riegos?.map(r => {
            const zonaNombre = (r as any).sistema_riego_zonas?.nombre_zona ?? '—'
            return (
              <Card key={r.id}>
                <Row label="Zona"     value={zonaNombre} accent />
                <Row label="Inicio"   value={new Date(r.fecha_inicio).toLocaleString('es-ES')} />
                {r.fecha_fin && <Row label="Fin" value={new Date(r.fecha_fin).toLocaleString('es-ES')} />}
                {r.litros_aplicados != null && <Row label="Litros" value={`${r.litros_aplicados.toLocaleString()} L`} />}
                {r.presion_bar != null && <Row label="Presión" value={`${r.presion_bar} bar`} />}
                {r.origen_agua && <Row label="Origen" value={r.origen_agua} />}
                {r.notas && <Row label="Notas" value={r.notas} />}
              </Card>
            )
          })}
        </TabsContent>

        {/* ── ANÁLISIS ─────────────────────────────── */}
        <TabsContent value="analisis" className="space-y-4 mt-0">
          {/* Suelo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Suelo</h3>
            </div>
            
            {/* GRÁFICO RECHARTS */}
            {analisisSuelo && analisisSuelo.length >= 2 && (() => {
              const chartData = [...analisisSuelo].reverse().map(a => ({
                fecha: a.fecha ? new Date(a.fecha).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }) : '',
                ph: a.ph, conductividad_ec: a.conductividad_ec, salinidad_ppm: a.salinidad_ppm,
                nitrogeno_ppm: a.nitrogeno_ppm, fosforo_ppm: a.fosforo_ppm, potasio_ppm: a.potasio_ppm
              }))
              return (
                <div className="bg-slate-800/60 border border-white/5 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evolución</span>
                    <select 
                      value={chartParam}
                      onChange={(e) => setChartParam(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded text-[10px] text-white px-2 py-1 outline-none"
                    >
                      {Object.entries(chartParamMap).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="fecha" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px', fontSize: '10px' }} itemStyle={{ color: '#38bdf8', fontWeight: 'bold' }} />
                        <Line type="monotone" dataKey={chartParam} name={chartParamMap[chartParam]} stroke="#38bdf8" strokeWidth={2} dot={{ r: 3, fill: '#38bdf8', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )
            })()}

            {!analisisSuelo?.length && <p className="text-slate-600 text-center py-4">Sin registros de análisis</p>}
            {analisisSuelo?.map(item => (
              <Card key={item.id}>
                <Row label="pH" value={item.ph?.toString() || '-'} />
                <Row label="Conductividad EC" value={item.conductividad_ec?.toString() || '-'} />
                <Row label="Salinidad" value={item.salinidad_ppm?.toString() || '-'} />
                <Row label="Temperatura" value={item.temperatura_suelo?.toString() || '-'} />
                <Row label="Materia orgánica" value={item.materia_organica?.toString() || '-'} />
                <Row label="Nitrógeno" value={item.nitrogeno_ppm?.toString() || '-'} />
                <Row label="Fósforo" value={item.fosforo_ppm?.toString() || '-'} />
                <Row label="Potasio" value={item.potasio_ppm?.toString() || '-'} />
                <Row label="Textura" value={item.textura || '-'} />
                <Row label="Profundidad" value={item.profundidad_cm ? `${item.profundidad_cm} cm` : '-'} />
                <Row label="Muestras" value={item.num_muestras?.toString() || '-'} />
                <Row label="Operario" value={item.operario || '-'} />
                <Row label="Herramienta" value={item.herramienta || '-'} />
                <Row label="Fecha" value={item.fecha ? new Date(item.fecha).toLocaleDateString('es-ES') : '-'} />
                {item.observaciones && <Row label="Observaciones" value={item.observaciones} />}
              </Card>
            ))}
          </div>

          {/* Agua */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">Agua</h3>
            {!analisisAgua?.length && <p className="text-slate-600 text-center py-4">Sin registros de análisis</p>}
            {analisisAgua?.map(item => (
              <Card key={item.id}>
                <Row label="Fuente" value={item.fuente || '-'} />
                <Row label="pH" value={item.ph?.toString() || '-'} />
                <Row label="Conductividad EC" value={item.conductividad_ec?.toString() || '-'} />
                <Row label="Salinidad" value={item.salinidad_ppm?.toString() || '-'} />
                <Row label="Temperatura" value={item.temperatura?.toString() || '-'} />
                <Row label="Sodio" value={item.sodio_ppm?.toString() || '-'} />
                <Row label="Cloruros" value={item.cloruros_ppm?.toString() || '-'} />
                <Row label="Nitratos" value={item.nitratos_ppm?.toString() || '-'} />
                <Row label="Dureza total" value={item.dureza_total?.toString() || '-'} />
                <Row label="Operario" value={item.operario || '-'} />
                <Row label="Herramienta" value={item.herramienta || '-'} />
                <Row label="Fecha" value={item.fecha ? new Date(item.fecha).toLocaleDateString('es-ES') : '-'} />
                {item.observaciones && <Row label="Observaciones" value={item.observaciones} />}
              </Card>
            ))}
          </div>

          {/* Sensores */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">Sensores</h3>
            {!lecturasSensor?.length && <p className="text-slate-600 text-center py-4">Sin registros de análisis</p>}
            {lecturasSensor?.map(item => (
              <Card key={item.id}>
                <Row label="Índice salud" value={item.indice_salud?.toString() || '-'} />
                <Row label="Estrés" value={item.nivel_estres?.toString() || '-'} />
                <Row label="NDVI" value={item.ndvi?.toString() || '-'} />
                <Row label="Clorofila" value={item.clorofila?.toString() || '-'} />
                <Row label="Cultivo" value={item.cultivo || '-'} />
                <Row label="Plantas medidas" value={item.num_plantas_medidas?.toString() || '-'} />
                <Row label="Operario" value={item.operario || '-'} />
                <Row label="Herramienta" value={item.herramienta || '-'} />
                <Row label="Fecha" value={item.fecha ? new Date(item.fecha).toLocaleDateString('es-ES') : '-'} />
                {item.observaciones && <Row label="Observaciones" value={item.observaciones} />}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── GALERÍA ──────────────────────────────── */}
        <TabsContent value="galeria" className="mt-0">
          {/* Filtro por tipo */}
          {tiposDisponibles.length > 1 && (
            <div className="flex gap-1.5 flex-wrap mb-3">
              {['todos', ...tiposDisponibles].map(t => (
                <button
                  key={t}
                  onClick={() => setFiltroTipo(t)}
                  className={`text-[9px] uppercase tracking-wide px-2 py-0.5 rounded-full border transition-colors ${
                    filtroTipo === t
                      ? 'border-[#38bdf8] text-[#38bdf8] bg-[#38bdf8]/10'
                      : 'border-slate-600 text-slate-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {!fotosFiltradas.length && (
            <p className="text-[10px] text-slate-600 text-center py-6 uppercase tracking-widest">
              Sin evidencias fotográficas
            </p>
          )}

          <div className="grid grid-cols-3 gap-1.5">
            {fotosFiltradas.map(f => (
              <button
                key={f.id}
                onClick={() => setFotoModal({
                  url: f.url_imagen ?? '',
                  descripcion: f.descripcion,
                  fecha: f.fecha,
                  tipo: f.tipo,
                  lat: f.latitud ?? null,
                  lng: f.longitud ?? null,
                })}
                className="relative aspect-square rounded-lg overflow-hidden border border-white/5 hover:border-[#38bdf8]/40 transition-colors"
              >
                <img
                  src={f.url_imagen ?? ''}
                  alt={f.descripcion ?? 'Foto'}
                  className="w-full h-full object-cover"
                />
                {f.tipo && f.tipo !== 'general' && (
                  <span className="absolute bottom-0 left-0 right-0 text-[7px] uppercase tracking-wide bg-black/60 text-white text-center py-0.5">
                    {f.tipo}
                  </span>
                )}
              </button>
            ))}
          </div>
        </TabsContent>

      </Tabs>

      {/* ── MODAL FOTO COMPLETA ───────────────────── */}
      {fotoModal && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-4"
          onClick={() => setFotoModal(null)}
        >
          <button
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center"
            onClick={() => setFotoModal(null)}
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <img
            src={fotoModal.url}
            alt={fotoModal.descripcion ?? 'Foto'}
            className="max-w-full max-h-[65vh] object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />

          <div
            className="mt-3 w-full max-w-sm space-y-1"
            onClick={e => e.stopPropagation()}
          >
            {fotoModal.descripcion && (
              <p className="text-sm text-white text-center">{fotoModal.descripcion}</p>
            )}
            <div className="flex items-center justify-center gap-4">
              {fotoModal.fecha && (
                <span className="text-[10px] text-slate-400">
                  {new Date(fotoModal.fecha).toLocaleDateString('es-ES')}
                </span>
              )}
              {fotoModal.tipo && (
                <span className="text-[10px] text-[#38bdf8] uppercase tracking-wide">
                  {fotoModal.tipo}
                </span>
              )}
            </div>
            {fotoModal.lat !== null && fotoModal.lng !== null && (
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500">
                <MapPin className="w-3 h-3" />
                {fotoModal.lat!.toFixed(6)}, {fotoModal.lng!.toFixed(6)}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

// ── AUXILIARES ────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/60 border border-white/5 rounded-lg px-3 py-2.5 space-y-1">
      {children}
    </div>
  )
}

function Row({
  label, value, accent = false, capitalize = false
}: {
  label: string
  value: string
  accent?: boolean
  capitalize?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-[9px] text-slate-500 uppercase tracking-wide shrink-0">{label}</span>
      <span className={`text-[11px] font-semibold text-right ${
        accent ? 'text-[#38bdf8]' : 'text-white'
      } ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function Spinner() {
  return (
    <div className="py-6 flex justify-center">
      <div className="w-4 h-4 border-2 border-[#38bdf8] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function Empty() {
  return (
    <p className="text-[10px] text-slate-600 text-center py-6 uppercase tracking-widest">
      Sin registros
    </p>
  )
}