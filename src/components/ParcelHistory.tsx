import { useParcelRecords } from '@/hooks/useParcelData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';

export default function ParcelHistory({ parcelId, onClose }: { parcelId: string; onClose: () => void }) {
  const { workRecords, plantings, harvests } = useParcelRecords(parcelId);

  return (
    <div className="px-5 pb-6">
      <button onClick={onClose} className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>
      <h3 className="text-lg font-bold text-foreground mb-4">Historial</h3>

      <Tabs defaultValue="work">
        <TabsList className="w-full bg-secondary rounded-xl">
          <TabsTrigger value="work" className="flex-1 rounded-lg text-xs">Trabajos</TabsTrigger>
          <TabsTrigger value="plantings" className="flex-1 rounded-lg text-xs">Plantaciones</TabsTrigger>
          <TabsTrigger value="harvests" className="flex-1 rounded-lg text-xs">Cosechas</TabsTrigger>
        </TabsList>

        <TabsContent value="work" className="mt-3 space-y-2">
          {workRecords.isLoading && <LoadingIndicator />}
          {workRecords.data?.length === 0 && <EmptyState />}
          {workRecords.data?.map(r => (
            <RecordCard key={r.id}>
              <p className="text-sm font-semibold text-foreground">{r.work_type}</p>
              <p className="text-xs text-muted-foreground">{r.date} · {r.workers || 0} trabajadores · {r.hours || 0}h</p>
              {r.description && <p className="text-xs text-muted-foreground mt-1">{r.description}</p>}
            </RecordCard>
          ))}
        </TabsContent>

        <TabsContent value="plantings" className="mt-3 space-y-2">
          {plantings.isLoading && <LoadingIndicator />}
          {plantings.data?.length === 0 && <EmptyState />}
          {plantings.data?.map(r => (
            <RecordCard key={r.id}>
              <p className="text-sm font-semibold text-foreground">{r.crop}</p>
              <p className="text-xs text-muted-foreground">{r.date}</p>
              {r.notes && <p className="text-xs text-muted-foreground mt-1">{r.notes}</p>}
            </RecordCard>
          ))}
        </TabsContent>

        <TabsContent value="harvests" className="mt-3 space-y-2">
          {harvests.isLoading && <LoadingIndicator />}
          {harvests.data?.length === 0 && <EmptyState />}
          {harvests.data?.map(r => (
            <RecordCard key={r.id}>
              <p className="text-sm font-semibold text-foreground">{r.crop} — {r.production_kg || 0} kg</p>
              <p className="text-xs text-muted-foreground">{r.date}</p>
              {r.notes && <p className="text-xs text-muted-foreground mt-1">{r.notes}</p>}
            </RecordCard>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RecordCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl bg-secondary/50 p-3">{children}</div>;
}

function LoadingIndicator() {
  return <div className="py-6 flex justify-center"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
}

function EmptyState() {
  return <p className="text-sm text-muted-foreground text-center py-6">Sin registros</p>;
}
