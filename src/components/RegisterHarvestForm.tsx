import { useState } from 'react';
import { useInsertHarvest, useInsertTicketPesaje, useCamiones, useCropCatalog } from '@/hooks/useParcelData';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Truck, Scale } from 'lucide-react';

type Step = 'cosecha' | 'ticket';

export default function RegisterHarvestForm({
  parcelId,
  onClose,
}: {
  parcelId: string;
  onClose: () => void;
}) {
  // ── STEP ──────────────────────────────────────────
  const [step, setStep] = useState<Step>('cosecha');

  // ── COSECHA ───────────────────────────────────────
  const [date, setDate]               = useState(new Date().toISOString().slice(0, 10));
  const [crop, setCrop]               = useState('');
  const [productionKg, setProductionKg] = useState('');
  const [notes, setNotes]             = useState('');
  const [harvestId, setHarvestId]     = useState<string | null>(null);

  // ── TICKET DE PESAJE ──────────────────────────────
  const [camionId, setCamionId]       = useState('');
  const [matriculaManual, setMatriculaManual] = useState('');
  const [destino, setDestino]         = useState('');
  const [pesoBruto, setPesoBruto]     = useState('');
  const [pesoTara, setPesoTara]       = useState('');
  const [conductor, setConductor]     = useState('');

  const mutationHarvest = useInsertHarvest();
  const mutationTicket  = useInsertTicketPesaje();
  const { data: camiones, isLoading: loadingCamiones } = useCamiones();
  const { data: catalogo, isLoading: loadingCatalogo } = useCropCatalog();

  const pesoNeto = pesoBruto && pesoTara
    ? (parseFloat(pesoBruto) - parseFloat(pesoTara)).toFixed(0)
    : null;

  // ── GUARDAR COSECHA ───────────────────────────────
  const handleSubmitCosecha = (e: React.FormEvent) => {
    e.preventDefault();
    if (!crop) {
      toast({ title: 'Error', description: 'Selecciona un cultivo', variant: 'destructive' });
      return;
    }

    mutationHarvest.mutate(
      {
        parcel_id:     parcelId,
        date,
        crop,
        production_kg: productionKg ? parseFloat(productionKg) : null,
        notes:         notes || null,
      },
      {
        onSuccess: (data) => {
          setHarvestId(data.id);
          toast({ title: '✅ Cosecha registrada', description: '¿Añadir ticket de pesaje?' });
          setStep('ticket');
        },
        onError: (err: any) => {
          toast({ title: 'Error', description: err.message, variant: 'destructive' });
        },
      }
    );
  };

  // ── GUARDAR TICKET ────────────────────────────────
  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!harvestId) return;
    if (!destino) {
      toast({ title: 'Error', description: 'El destino es obligatorio', variant: 'destructive' });
      return;
    }
    if (!pesoBruto) {
      toast({ title: 'Error', description: 'El peso bruto es obligatorio', variant: 'destructive' });
      return;
    }

    mutationTicket.mutate(
      {
        harvest_id:       harvestId,
        camion_id:        camionId || null,
        matricula_manual: !camionId ? matriculaManual || null : null,
        destino,
        peso_bruto_kg:    parseFloat(pesoBruto),
        peso_tara_kg:     pesoTara ? parseFloat(pesoTara) : 0,
        conductor:        conductor || null,
        hora_salida:      new Date().toISOString(),
      },
      {
        onSuccess: (data) => {
          toast({
            title: '✅ Ticket generado',
            description: `Albarán ${data.numero_albaran} · ${pesoNeto} kg netos → ${destino}`,
          });
          onClose();
        },
        onError: (err: any) => {
          toast({ title: 'Error ticket', description: err.message, variant: 'destructive' });
        },
      }
    );
  };

  // ── RENDER COSECHA ────────────────────────────────
  if (step === 'cosecha') {
    return (
      <div className="px-5 pb-6">
        <button onClick={onClose} className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <h3 className="text-lg font-bold text-foreground mb-4">
          <Scale className="w-5 h-5 inline mr-2" />
          Registrar Cosecha
        </h3>

        <form onSubmit={handleSubmitCosecha} className="space-y-4">

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Fecha</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Cultivo</label>
            {loadingCatalogo ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
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

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Producción total (kg)</label>
            <Input
              type="number"
              value={productionKg}
              onChange={e => setProductionKg(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Notas</label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observaciones de la cosecha..."
              rows={3}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-2xl text-base font-bold"
            disabled={mutationHarvest.isPending || !crop}
          >
            {mutationHarvest.isPending ? 'Guardando...' : 'Guardar Cosecha →'}
          </Button>

        </form>
      </div>
    );
  }

  // ── RENDER TICKET ─────────────────────────────────
  return (
    <div className="px-5 pb-6">
      <button
        onClick={() => setStep('cosecha')}
        className="flex items-center gap-2 text-sm text-muted-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a cosecha
      </button>

      <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 mb-4">
        <p className="text-xs text-green-600 font-bold uppercase tracking-wide">✅ Cosecha guardada</p>
        <p className="text-sm text-muted-foreground mt-0.5">Añade el ticket de báscula para completar la trazabilidad</p>
      </div>

      <h3 className="text-lg font-bold text-foreground mb-4">
        <Truck className="w-5 h-5 inline mr-2" />
        Ticket de Pesaje
      </h3>

      <form onSubmit={handleSubmitTicket} className="space-y-4">

        {/* CAMIÓN */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Camión</label>
          {loadingCamiones ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando camiones...
            </div>
          ) : (
            <select
              value={camionId}
              onChange={e => setCamionId(e.target.value)}
              className="w-full h-10 rounded-xl border bg-background px-3 text-sm"
            >
              <option value="">— Matrícula manual —</option>
              {camiones?.map(c => (
                <option key={c.id} value={c.id}>
                  {c.matricula}{c.empresa_transporte ? ` · ${c.empresa_transporte}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* MATRÍCULA MANUAL si no está en catálogo */}
        {!camionId && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Matrícula manual</label>
            <Input
              value={matriculaManual}
              onChange={e => setMatriculaManual(e.target.value.toUpperCase())}
              placeholder="Ej: 1234 ABC"
            />
          </div>
        )}

        {/* DESTINO */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Destino</label>
          <Input
            value={destino}
            onChange={e => setDestino(e.target.value)}
            placeholder="Ej: Mercabarna, Alhóndiga Murcia..."
            required
          />
        </div>

        {/* PESOS */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Peso bruto (kg)</label>
            <Input
              type="number"
              value={pesoBruto}
              onChange={e => setPesoBruto(e.target.value)}
              placeholder="0"
              min="0"
              required
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tara (kg)</label>
            <Input
              type="number"
              value={pesoTara}
              onChange={e => setPesoTara(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>
        </div>

        {/* PESO NETO CALCULADO */}
        {pesoNeto && (
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-3">
            <p className="text-xs text-muted-foreground uppercase font-bold">Peso neto</p>
            <p className="text-2xl font-black text-primary">{parseFloat(pesoNeto).toLocaleString()} kg</p>
          </div>
        )}

        {/* CONDUCTOR */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Conductor</label>
          <Input
            value={conductor}
            onChange={e => setConductor(e.target.value)}
            placeholder="Nombre del conductor"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-2xl font-bold"
            onClick={onClose}
          >
            Saltar ticket
          </Button>
          <Button
            type="submit"
            className="h-12 rounded-2xl font-bold"
            disabled={mutationTicket.isPending || !destino || !pesoBruto}
          >
            {mutationTicket.isPending ? 'Guardando...' : '🖨 Generar Ticket'}
          </Button>
        </div>

      </form>
    </div>
  );
}