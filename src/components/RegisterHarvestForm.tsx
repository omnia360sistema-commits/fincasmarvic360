import { useState } from 'react';
import { useInsertHarvest } from '@/hooks/useParcelData';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function RegisterHarvestForm({ parcelId, onClose }: { parcelId: string; onClose: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [crop, setCrop] = useState('');
  const [productionKg, setProductionKg] = useState('');
  const [notes, setNotes] = useState('');

  const mutation = useInsertHarvest();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      {
        parcel_id: parcelId,
        date,
        crop,
        production_kg: productionKg ? parseFloat(productionKg) : null,
        notes: notes || null,
      },
      {
        onSuccess: () => {
          toast({ title: 'Cosecha registrada', description: 'El registro se guardó correctamente.' });
          onClose();
        },
        onError: (err) => {
          toast({ title: 'Error', description: err.message, variant: 'destructive' });
        },
      }
    );
  };

  return (
    <div className="px-5 pb-6">
      <button onClick={onClose} className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>
      <h3 className="text-lg font-bold text-foreground mb-4">Registrar Cosecha</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Fecha</label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Cultivo</label>
          <Input value={crop} onChange={e => setCrop(e.target.value)} placeholder="Ej: Limón, Alcachofa..." required />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Producción (kg)</label>
          <Input type="number" value={productionKg} onChange={e => setProductionKg(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Notas</label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones..." rows={3} />
        </div>
        <Button type="submit" className="w-full h-12 rounded-2xl text-base font-bold" disabled={mutation.isPending}>
          {mutation.isPending ? 'Guardando...' : 'Guardar Cosecha'}
        </Button>
      </form>
    </div>
  );
}
