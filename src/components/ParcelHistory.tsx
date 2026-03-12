import {
  useParcelRecords,
  useParcelProduction,
  useParcelTickets,
  useParcelResiduos,
  useParcelCertification
} from '@/hooks/useParcelData'

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'

import { ArrowLeft } from 'lucide-react'

export default function ParcelHistory({
  parcelId,
  onClose
}: {
  parcelId: string
  onClose: () => void
}) {

  const { workRecords, plantings, harvests } = useParcelRecords(parcelId)
  const { data: production } = useParcelProduction(parcelId)

  const { data: tickets } = useParcelTickets(parcelId)
  const { data: residuos } = useParcelResiduos(parcelId)
  const { data: certification } = useParcelCertification(parcelId)

  const estimatedProduction = production?.estimated_production_kg || null

  return (
    <div className="px-5 pb-6">

      <button
        onClick={onClose}
        className="flex items-center gap-2 text-sm text-muted-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      <h3 className="text-lg font-bold text-foreground mb-4">
        Historial
      </h3>

      <Tabs defaultValue="work">

        <TabsList className="w-full bg-secondary rounded-xl">

          <TabsTrigger value="work" className="flex-1 rounded-lg text-xs">
            Trabajos
          </TabsTrigger>

          <TabsTrigger value="plantings" className="flex-1 rounded-lg text-xs">
            Plantaciones
          </TabsTrigger>

          <TabsTrigger value="harvests" className="flex-1 rounded-lg text-xs">
            Cosechas
          </TabsTrigger>

          <TabsTrigger value="tickets" className="flex-1 rounded-lg text-xs">
            Tickets
          </TabsTrigger>

          <TabsTrigger value="residuos" className="flex-1 rounded-lg text-xs">
            Residuos
          </TabsTrigger>

          <TabsTrigger value="certificacion" className="flex-1 rounded-lg text-xs">
            Certificación
          </TabsTrigger>

        </TabsList>

        {/* ===================================================== */}
        {/* TRABAJOS */}
        {/* ===================================================== */}

        <TabsContent value="work" className="mt-3 space-y-2">

          {workRecords.isLoading && <LoadingIndicator />}
          {workRecords.data?.length === 0 && <EmptyState />}

          {workRecords.data?.map(r => (

            <RecordCard key={r.id}>

              <p className="text-sm font-semibold text-foreground">
                {r.work_type}
              </p>

              <p className="text-xs text-muted-foreground">
                {r.date} · {r.workers || 0} trabajadores · {r.hours || 0}h
              </p>

              {r.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {r.description}
                </p>
              )}

            </RecordCard>

          ))}

        </TabsContent>

        {/* ===================================================== */}
        {/* PLANTACIONES */}
        {/* ===================================================== */}

        <TabsContent value="plantings" className="mt-3 space-y-2">

          {plantings.isLoading && <LoadingIndicator />}
          {plantings.data?.length === 0 && <EmptyState />}

          {plantings.data?.map(r => (

            <RecordCard key={r.id}>

              <p className="text-sm font-semibold text-foreground">
                {r.crop}
              </p>

              <p className="text-xs text-muted-foreground">
                {r.date}
              </p>

              {r.notes && (
                <p className="text-xs text-muted-foreground mt-1">
                  {r.notes}
                </p>
              )}

            </RecordCard>

          ))}

        </TabsContent>

        {/* ===================================================== */}
        {/* COSECHAS */}
        {/* ===================================================== */}

        <TabsContent value="harvests" className="mt-3 space-y-2">

          {harvests.isLoading && <LoadingIndicator />}
          {harvests.data?.length === 0 && <EmptyState />}

          {harvests.data?.map(r => {

            const realProduction = r.production_kg || 0

            const performance =
              estimatedProduction && realProduction
                ? Math.round((realProduction / estimatedProduction) * 100)
                : null

            return (

              <RecordCard key={r.id}>

                <p className="text-sm font-semibold text-foreground">
                  {r.crop} — {realProduction} kg
                </p>

                <p className="text-xs text-muted-foreground">
                  {r.date}
                </p>

                {estimatedProduction && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Estimado: {estimatedProduction} kg
                  </p>
                )}

                {performance && (
                  <p className="text-xs font-semibold text-primary mt-1">
                    Rendimiento: {performance}%
                  </p>
                )}

                {r.notes && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {r.notes}
                  </p>
                )}

              </RecordCard>

            )

          })}

        </TabsContent>

        {/* ===================================================== */}
        {/* TICKETS */}
        {/* ===================================================== */}

        <TabsContent value="tickets" className="mt-3 space-y-2">

          {tickets?.length === 0 && <EmptyState />}

          {tickets?.map(t => (

            <RecordCard key={t.id}>

              <p className="text-sm font-semibold text-foreground">
                Ticket pesaje
              </p>

              <p className="text-xs text-muted-foreground">
                Peso neto: {t.peso_neto_kg || 0} kg
              </p>

              <p className="text-xs text-muted-foreground">
                {t.created_at}
              </p>

            </RecordCard>

          ))}

        </TabsContent>

        {/* ===================================================== */}
        {/* RESIDUOS */}
        {/* ===================================================== */}

        <TabsContent value="residuos" className="mt-3 space-y-2">

          {residuos?.length === 0 && <EmptyState />}

          {residuos?.map(r => (

            <RecordCard key={r.id}>

              <p className="text-sm font-semibold text-foreground">
                {r.tipo_residuo}
              </p>

              <p className="text-xs text-muted-foreground">
                Instalado: {r.kg_instalados || 0} kg
              </p>

              {r.kg_retirados && (
                <p className="text-xs text-muted-foreground">
                  Retirado: {r.kg_retirados} kg
                </p>
              )}

            </RecordCard>

          ))}

        </TabsContent>

        {/* ===================================================== */}
        {/* CERTIFICACIÓN */}
        {/* ===================================================== */}

        <TabsContent value="certificacion" className="mt-3 space-y-2">

          {!certification && <EmptyState />}

          {certification && (

            <RecordCard>

              <p className="text-sm font-semibold text-foreground">
  {certification.entidad_certificadora}
</p>

              <p className="text-xs text-muted-foreground">
                Estado: {certification.estado}
              </p>

              <p className="text-xs text-muted-foreground">
                Inicio: {certification.fecha_inicio}
              </p>

              {certification.fecha_fin && (
                <p className="text-xs text-muted-foreground">
                  Fin: {certification.fecha_fin}
                </p>
              )}

            </RecordCard>

          )}

        </TabsContent>

      </Tabs>

    </div>
  )
}

/* ===================================================== */
/* COMPONENTES AUXILIARES */
/* ===================================================== */

function RecordCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-secondary/50 p-3">
      {children}
    </div>
  )
}

function LoadingIndicator() {
  return (
    <div className="py-6 flex justify-center">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function EmptyState() {
  return (
    <p className="text-sm text-muted-foreground text-center py-6">
      Sin registros
    </p>
  )
}