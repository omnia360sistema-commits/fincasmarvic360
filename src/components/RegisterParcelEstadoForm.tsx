import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { useParcelEstado } from "@/hooks/useParcelEstado"

type Props = {
  parcelId: string
  onClose?: () => void
}

export default function RegisterParcelEstadoForm({ parcelId, onClose }: Props) {

  const { registrarEstado, loading } = useParcelEstado()

  const [estado, setEstado] = useState("")
  const [cultivo, setCultivo] = useState("")
  const [observaciones, setObservaciones] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {

      await registrarEstado({
        parcel_id: parcelId,
        estado,
        cultivo,
        observaciones
      })

      alert("Estado registrado")

      setEstado("")
      setCultivo("")
      setObservaciones("")

      if (onClose) onClose()

    } catch (err) {

      alert("Error guardando datos")

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

        <h3 className="font-bold text-lg">
          Estado de Parcela
        </h3>

      </div>

      <form onSubmit={handleSubmit} className="space-y-3">

        <input
          type="text"
          placeholder="Estado (ej: crecimiento)"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="border p-3 rounded-xl w-full bg-secondary"
          required
        />

        <input
          type="text"
          placeholder="Cultivo actual"
          value={cultivo}
          onChange={(e) => setCultivo(e.target.value)}
          className="border p-3 rounded-xl w-full bg-secondary"
          required
        />

        <textarea
          placeholder="Observaciones"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          className="border p-3 rounded-xl w-full bg-secondary"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white px-4 py-3 rounded-xl w-full font-semibold"
        >
          {loading ? "Guardando..." : "Guardar estado"}
        </button>

      </form>

    </div>
  )
}