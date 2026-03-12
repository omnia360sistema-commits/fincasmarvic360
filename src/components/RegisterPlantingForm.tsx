import { useState, useMemo } from 'react';
import { useInsertPlanting, useCropCatalog } from '@/hooks/useParcelData';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function RegisterPlantingForm({
  parcelId,
  onClose,
}: {
  parcelId: string;
  onClose: () => void;
}) {
  const [date, setDate]                   = useState(new Date().toISOString().slice(0, 10));
  const [crop, setCrop]                   = useState('');
  const [variedad, setVariedad]           = useState('');
  const [loteSemilla, setLoteSemilla]     = useState('');
  const [proveedor, setProveedor]         = useState('');
  const [sistemaRiego, setSistemaRiego]   = useState<'goteo' | 'tradicional' | 'aspersion' | 'ninguno'>('goteo');
  const [numPlantas, setNumPlantas]       = useState('');
  const [notes, setNotes]                 = useState('');

  const mutation    = useInsertPlanting();
  const { data: catalogo, isLoading: loadingCatalogo } = useCropCatalog();

  // Cultivo seleccionado del catálogo
  const cultivoSeleccionado = useMemo(
    () => catalogo?.find(c => c.nombre_interno === crop) ?? null,
    [catalogo, crop]
  );

  // Fecha estimada de cosecha desde ciclo real del catálogo
  const harvestDate = useMemo(() => {
    if (!date || !cultivoSeleccionado) return '';
    const d = new Date(date);
    d.setDate(d.getDate() + (cultivoSeleccionado.ciclo_dias ?? 90));
    return d.toISOString().slice(0, 10);
  }, [date, cultivoSeleccionado]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!crop) {
      toast({ title: 'Error', description: 'Selecciona un cultivo', variant: 'destructive' });
      return;
    }

    mutation.mutate(
      {
        parcel_id:               parcelId,
        date,
        crop,
        variedad:                variedad || null,
        lote_semilla:            loteSemilla || null,
        proveedor_semilla:       proveedor || null,
        sistema_riego:           sistemaRiego,
        num_plantas_real:        numPlantas ? parseInt(numPlantas) : null,
        marco_cm_entre_lineas:   cultivoSeleccionado?.marco_std_entre_lineas_cm ?? null,
        marco_cm_entre_plantas:  cultivoSeleccionado?.marco_std_entre_plantas_cm ?? null,
        fecha_cosecha_estimada:  harvestDate || null,
        notes:                   notes || null,
      },
      {
        onSuccess: () => {
          toast({ title: '✅ Plantación registrada', description: 'Datos guardados correctamente.' });
          onClose();
        },
        onError: (err: any) => {
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

      <h3 className="text-lg font-bold text-foreground mb-4">Registrar Plantación</h3>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* FECHA */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Fecha plantación</label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>

        {/* CULTIVO DESDE CATÁLOGO */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Cultivo</label>
          {loadingCatalogo ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando catálogo...
            </div>
          ) : (
            <select
              value={crop}
              onChange={e => setCrop(e.target.value)}
              className="w-full h-10 rounded-xl border bg-background px-3 text-sm"
              required
            >
              <option value="">— Selecciona cultivo —</option>
              {catalogo?.map(c => (
                <option key={c.nombre_interno} value={c.nombre_interno}>
                  {c.nombre_display}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* INFO DEL CATÁLOGO (solo lectura) */}
        {cultivoSeleccionado && (
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 grid grid-cols-3 gap-2">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Marco</p>
              <p className="text-sm font-semibold">
                {cultivoSeleccionado.marco_std_entre_lineas_cm ?? '—'}×{cultivoSeleccionado.marco_std_entre_plantas_cm ?? '—'} cm
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Ciclo</p>
              <p className="text-sm font-semibold">{cultivoSeleccionado.ciclo_dias} días</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Plástico</p>
              <p className="text-sm font-semibold">{cultivoSeleccionado.kg_plastico_por_ha ?? '—'} kg/ha</p>
            </div>
          </div>
        )}

        {/* VARIEDAD */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Variedad</label>
          <Input
            value={variedad}
            onChange={e => setVariedad(e.target.value)}
            placeholder="Ej: Ironman F1, Parthenon..."
          />
        </div>

        {/* LOTE SEMILLA */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Lote de semilla</label>
          <Input
            value={loteSemilla}
            onChange={e => setLoteSemilla(e.target.value)}
            placeholder="Nº lote del proveedor"
          />
        </div>

        {/* PROVEEDOR SEMILLA */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Proveedor semilla</label>
          <Input
            value={proveedor}
            onChange={e => setProveedor(e.target.value)}
            placeholder="Ej: Rijk Zwaan, Clause..."
          />
        </div>

        {/* SISTEMA DE RIEGO */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Sistema de riego</label>
          <div className="grid grid-cols-2 gap-2">
            {(['goteo', 'tradicional', 'aspersion', 'ninguno'] as const).map(tipo => (
              <button
                key={tipo}
                type="button"
                onClick={() => setSistemaRiego(tipo)}
                className={`py-2.5 rounded-xl text-sm font-semibold capitalize transition-colors ${
                  sistemaRiego === tipo
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* NÚMERO DE PLANTAS REAL */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Nº plantas reales <span className="text-muted-foreground/60">(conteo en campo)</span>
          </label>
          <Input
            type="number"
            value={numPlantas}
            onChange={e => setNumPlantas(e.target.value)}
            placeholder="0"
          />
        </div>

        {/* COSECHA ESTIMADA (calculada automáticamente) */}
        {harvestDate && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Cosecha estimada</label>
            <Input value={harvestDate} readOnly className="bg-secondary/50 text-muted-foreground" />
          </div>
        )}

        {/* NOTAS */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Notas</label>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Observaciones..."
            rows={3}
          />
        </div>

        <Button
          type="submit"
          className="w-full h-12 rounded-2xl text-base font-bold"
          disabled={mutation.isPending || !crop}
        >
          {mutation.isPending ? 'Guardando...' : 'Guardar Plantación'}
        </Button>

      </form>
    </div>
  );
}