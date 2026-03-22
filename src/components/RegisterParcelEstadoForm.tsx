import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useCropCatalog } from '@/hooks/useParcelData'
import { Loader2 } from 'lucide-react'

const ESTADOS = [
  { value: 'activa',      label: 'Activa' },
  { value: 'plantada',    label: 'Plantada' },
  { value: 'preparacion', label: 'Preparación' },
  { value: 'cosechada',   label: 'Cosechada' },
  { value: 'vacia',       label: 'Vacía' },
  { value: 'baja',        label: 'Baja' },
]

type Props = {
  parcelId: string
  onClose?: () => void
}

export default function RegisterParcelEstadoForm({ parcelId, onClose }: Props) {
  const [estado, setEstado]               = useState('')
  const [cultivo, setCultivo]             = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [loading, setLoading]             = useState(false)

  const { data: catalogo, isLoading: loadingCatalogo } = useCropCatalog()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!estado) {
      toast({ title: 'Error', description: 'Selecciona un estado', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      // Insertar en registros_estado_parcela (FK corregida a TEXT)
      const { error: errorEstado } = await supabase
        .from('registros_estado_parcela')
        .insert({
          parcel_id:    parcelId,
          estado,
          cultivo:      cultivo || null,
          observaciones: observaciones || null,
        })

      if (errorEstado) throw errorEstado

      // Actualizar también el campo status en parcels
      await supabase
        .from('parcels')
        .update({ status: estado })
        .eq('parcel_id', parcelId)

      toast({ title: '✅ Estado registrado', description: `Parcela marcada como ${estado}` })
      if (onClose) onClose()

    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-5 pb-6">

      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <h3 className="font-bold text-lg">Estado de Parcela</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ESTADO */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Estado</label>
          <div className="grid grid-cols-3 gap-2">
            {ESTADOS.map(e => (
              <button
                key={e.value}
                type="button"
                onClick={() => setEstado(e.value)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  estado === e.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* CULTIVO */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Cultivo actual <span className="text-muted-foreground/60">(opcional)</span>
          </label>
          {loadingCatalogo ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
            </div>
          ) : (
            <select
              value={cultivo}
              onChange={e => setCultivo(e.target.value)}
              className="w-full h-10 rounded-xl border bg-background px-3 text-sm"
            >
              <option value="">— Sin cultivo —</option>
              {catalogo?.map(c => (
                <option key={c.nombre_interno} value={c.nombre_interno}>
                  {c.nombre_display}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* OBSERVACIONES */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Observaciones</label>
          <Textarea
            value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
            placeholder="Descripción del estado actual de la parcela..."
            rows={3}
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !estado}
          className="w-full h-12 rounded-2xl text-base font-bold"
        >
          {loading ? 'Guardando...' : 'Guardar Estado'}
        </Button>

      </form>
    </div>
  )
}