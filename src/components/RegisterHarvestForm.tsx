import { useState } from 'react';
import { useInsertHarvest } from '@/hooks/useParcelData';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function RegisterHarvestForm({
  parcelId,
  onClose
}: {
  parcelId: string
  onClose: () => void
}) {

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [crop, setCrop] = useState('')
  const [productionKg, setProductionKg] = useState('')
  const [priceKg, setPriceKg] = useState('')
  const [harvestCost, setHarvestCost] = useState('')
  const [notes, setNotes] = useState('')

  const mutation = useInsertHarvest()

  const production = productionKg ? parseFloat(productionKg) : 0
  const price = priceKg ? parseFloat(priceKg) : 0
  const cost = harvestCost ? parseFloat(harvestCost) : 0

  const totalIncome = production * price
  const estimatedProfit = totalIncome - cost

  const handleSubmit = (e: React.FormEvent) => {

    e.preventDefault()

    mutation.mutate(
      {
        parcel_id: parcelId,
        date,
        crop,
        production_kg: productionKg ? parseFloat(productionKg) : null,
        price_kg: priceKg ? parseFloat(priceKg) : null,
        harvest_cost: harvestCost ? parseFloat(harvestCost) : null,
        notes: notes || null,
      },
      {
        onSuccess: () => {

          toast({
            title: 'Cosecha registrada',
            description: 'El registro se guardó correctamente.'
          })

          onClose()

        },
        onError: (err: any) => {

          toast({
            title: 'Error',
            description: err.message,
            variant: 'destructive'
          })

        }
      }
    )
  }

  return (
    <div className="px-5 pb-6">

      <button
        onClick={onClose}
        className="flex items-center gap-2 text-sm text-muted-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <h3 className="text-lg font-bold text-foreground mb-4">
        Registrar Cosecha
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Fecha
          </label>
          <Input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Cultivo
          </label>
          <Input
            value={crop}
            onChange={e => setCrop(e.target.value)}
            placeholder="Ej: Lechuga, Brócoli..."
            required
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Producción (kg)
          </label>
          <Input
            type="number"
            value={productionKg}
            onChange={e => setProductionKg(e.target.value)}
            placeholder="0"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Precio venta €/kg
          </label>
          <Input
            type="number"
            step="0.01"
            value={priceKg}
            onChange={e => setPriceKg(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Coste cosecha (€)
          </label>
          <Input
            type="number"
            value={harvestCost}
            onChange={e => setHarvestCost(e.target.value)}
            placeholder="0"
          />
        </div>

        {production > 0 && price > 0 && (
          <div className="rounded-xl bg-primary/10 p-3">
            <p className="text-xs text-muted-foreground">
              Ingreso estimado
            </p>
            <p className="text-sm font-semibold text-primary">
              {totalIncome.toLocaleString()} €
            </p>
          </div>
        )}

        {production > 0 && price > 0 && (
          <div className="rounded-xl bg-accent/10 p-3">
            <p className="text-xs text-muted-foreground">
              Beneficio estimado
            </p>
            <p className="text-sm font-semibold text-accent">
              {estimatedProfit.toLocaleString()} €
            </p>
          </div>
        )}

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Notas
          </label>
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
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Guardando...' : 'Guardar Cosecha'}
        </Button>

      </form>

    </div>
  )
}