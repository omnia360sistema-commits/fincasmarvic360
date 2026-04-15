import { useState } from 'react';
import { useInsertWorkRecord, useCuadrillas } from '@/hooks/useParcelData';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Users } from 'lucide-react';

const WORK_TYPES = [
  { value: 'tractor',  label: 'Tractor' },
  { value: 'labor',    label: 'Mano de obra' },
  { value: 'external', label: 'Servicio externo' },
  { value: 'plastico', label: 'Plástico' },
  { value: 'riego',    label: 'Riego' },
];

export default function RegisterWorkForm({
  parcelId,
  onClose,
}: {
  parcelId: string;
  onClose: () => void;
}) {
  const [date, setDate]               = useState(new Date().toISOString().slice(0, 10));
  const [workType, setWorkType]       = useState('tractor');
  const [cuadrillaId, setCuadrillaId] = useState('');
  const [workers, setWorkers]         = useState('');
  const [hours, setHours]             = useState('');
  const [horaEntrada, setHoraEntrada] = useState('');
  const [horaSalida, setHoraSalida]   = useState('');
  const [description, setDescription] = useState('');

  const mutation = useInsertWorkRecord();
  const { data: cuadrillas, isLoading: loadingCuadrillas } = useCuadrillas();

  // Calcular horas automáticamente si hay entrada y salida
  const calcularHoras = (entrada: string, salida: string) => {
    if (!entrada || !salida) return;
    const [h1, m1] = entrada.split(':').map(Number);
    const [h2, m2] = salida.split(':').map(Number);
    const totalMinutos = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (totalMinutos > 0) {
      setHours((totalMinutos / 60).toFixed(1));
    }
  };

  const handleEntrada = (val: string) => {
    setHoraEntrada(val);
    calcularHoras(val, horaSalida);
  };

  const handleSalida = (val: string) => {
    setHoraSalida(val);
    calcularHoras(horaEntrada, val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const horaEntradaISO = horaEntrada
      ? new Date(`${date}T${horaEntrada}:00`).toISOString()
      : null;
    const horaSalidaISO = horaSalida
      ? new Date(`${date}T${horaSalida}:00`).toISOString()
      : null;

    mutation.mutate(
      {
        parcel_id:   parcelId,
        date,
        work_type:   workType,
        cuadrilla_id: cuadrillaId || null,
        workers_count: workers ? parseInt(workers, 10) : null,
        hours_worked: hours ? parseFloat(hours) : null,
        hora_entrada: horaEntradaISO,
        hora_salida:  horaSalidaISO,
        notas: description || null,
      },
      {
        onSuccess: () => {
          toast({ title: '✅ Trabajo registrado', description: 'El registro se guardó correctamente.' });
          onClose();
        },
      onError: (err: unknown) => {
        toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
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

        {/* FECHA */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Fecha</label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>

        {/* TIPO DE TRABAJO */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tipo de trabajo</label>
          <div className="grid grid-cols-3 gap-2">
            {WORK_TYPES.map(wt => (
              <button
                key={wt.value}
                type="button"
                onClick={() => setWorkType(wt.value)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${
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

        {/* CUADRILLA */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
            <Users className="w-3 h-3" /> Cuadrilla
          </label>
          {loadingCuadrillas ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando cuadrillas...
            </div>
          ) : (
            <select
              value={cuadrillaId}
              onChange={e => setCuadrillaId(e.target.value)}
              className="w-full h-10 rounded-xl border bg-background px-3 text-sm"
            >
              <option value="">— Sin cuadrilla asignada —</option>
              {cuadrillas?.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre}{c.empresa ? ` · ${c.empresa}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* TRABAJADORES Y HORAS */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Trabajadores</label>
            <Input
              type="number"
              value={workers}
              onChange={e => setWorkers(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Horas totales</label>
            <Input
              type="number"
              step="0.5"
              value={hours}
              onChange={e => setHours(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>
        </div>

        {/* HORA ENTRADA / SALIDA */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Hora entrada</label>
            <Input
              type="time"
              value={horaEntrada}
              onChange={e => handleEntrada(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Hora salida</label>
            <Input
              type="time"
              value={horaSalida}
              onChange={e => handleSalida(e.target.value)}
            />
          </div>
        </div>

        {/* DESCRIPCIÓN */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Descripción</label>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Detalles del trabajo..."
            rows={3}
          />
        </div>

        <Button
          type="submit"
          className="w-full h-12 rounded-2xl text-base font-bold"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Guardando...' : 'Guardar Trabajo'}
        </Button>

      </form>
    </div>
  );
}