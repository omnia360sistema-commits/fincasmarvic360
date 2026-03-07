import { useState } from 'react';
import { useInsertWorkRecord } from '@/hooks/useParcelData';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const WORK_TYPES = [
  { value: 'tractor', label: 'Tractor' },
  { value: 'labor', label: 'Mano de obra' },
  { value: 'external', label: 'Servicio externo' },
];

export default function RegisterWorkForm({ parcelId, onClose }: { parcelId: string; onClose: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [workType, setWorkType] = useState('tractor');
  const [workers, setWorkers] = useState('');
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');

  const mutation = useInsertWorkRecord();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      {
        parcel_id: parcelId,
        date,
        work_type: workType,
        workers: workers ? parseInt(workers) : null,
        hours: hours ? parseFloat(hours) : null,
        description: description || null,
      },
      {
        onSuccess: () => {
          toast({ title: 'Trabajo registrado', description: 'El registro se guardó correctamente.' });
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
      <h3 className="text-lg font-bold text-foreground mb-4">Registrar Trabajo</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Fecha</label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tipo de trabajo</label>
          <div className="flex gap-2">
            {WORK_TYPES.map(wt => (
              <button
                key={wt.value}
                type="button"
                onClick={() => setWorkType(wt.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  workType === wt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {wt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Trabajadores</label>
            <Input type="number" value={workers} onChange={e => setWorkers(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Horas</label>
            <Input type="number" step="0.5" value={hours} onChange={e => setHours(e.target.value)} placeholder="0" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Descripción</label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalles del trabajo..." rows={3} />
        </div>
        <Button type="submit" className="w-full h-12 rounded-2xl text-base font-bold" disabled={mutation.isPending}>
          {mutation.isPending ? 'Guardando...' : 'Guardar Trabajo'}
        </Button>
      </form>
    </div>
  );
}
