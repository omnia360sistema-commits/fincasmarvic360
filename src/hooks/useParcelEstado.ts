import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"

export function useParcelEstado() {

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function registrarEstado({
    parcel_id,
    estado,
    cultivo,
    observaciones
  }: {
    parcel_id: string
    estado: string
    cultivo: string
    observaciones?: string
  }) {

    try {

      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("registros_estado_parcela")
        .insert([
          {
            parcel_id,
            estado,
            cultivo,
            observaciones
          }
        ])
        .select()

      if (error) throw error

      return data

    } catch (err: any) {

      setError(err.message)
      throw err

    } finally {

      setLoading(false)

    }
  }

  return {
    registrarEstado,
    loading,
    error
  }
}