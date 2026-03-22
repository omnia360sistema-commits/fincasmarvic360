import React from 'react'
import {
  useParcelRecords,
  useParcelProduction,
  useParcelTickets,
  useParcelResiduos,
  useParcelCertification
} from '@/hooks/useParcelData'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react'

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

      </Tabs>
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