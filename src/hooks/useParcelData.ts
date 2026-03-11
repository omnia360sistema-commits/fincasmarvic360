import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { TablesInsert } from '@/integrations/supabase/types'
import type { ParcelStatus } from '@/types/farm'

/*
================================================
CATÁLOGO DE CULTIVOS
================================================
*/

export function useCropCatalog() {

  return useQuery({
    queryKey: ['cultivos_catalogo'],
    queryFn: async () => {

      const { data, error } = await supabase
        .from('cultivos_catalogo')
        .select('*')
        .order('nombre_display')

      if (error) throw error

      return data ?? []

    },
    staleTime: 60000
  })

}

/*
================================================
PRODUCCIÓN ESTIMADA DE PARCELA
================================================
*/

export function useParcelProduction(parcelId: string | null) {

  return useQuery({

    queryKey: ['parcel_production', parcelId],

    queryFn: async () => {

      if (!parcelId) return null

      const { data, error } = await supabase
        .from('parcel_production')
        .select('*')
        .eq('parcel_id', parcelId)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return data

    },

    enabled: !!parcelId,
    staleTime: 30000

  })

}

/*
================================================
REGISTROS DE PARCELA
================================================
*/

export function useParcelRecords(parcelId: string | null) {

  const workRecords = useQuery({
    queryKey: ['work_records', parcelId],
    queryFn: async () => {

      if (!parcelId) return []

      const { data, error } = await supabase
        .from('work_records')
        .select('*')
        .eq('parcel_id', parcelId)
        .order('date', { ascending: false })

      if (error) throw error

      return data ?? []

    },
    enabled: !!parcelId
  })

  const plantings = useQuery({
    queryKey: ['plantings', parcelId],
    queryFn: async () => {

      if (!parcelId) return []

      const { data, error } = await supabase
        .from('plantings')
        .select('*')
        .eq('parcel_id', parcelId)
        .order('date', { ascending: false })

      if (error) throw error

      return data ?? []

    },
    enabled: !!parcelId
  })

  const harvests = useQuery({
    queryKey: ['harvests', parcelId],
    queryFn: async () => {

      if (!parcelId) return []

      const { data, error } = await supabase
        .from('harvests')
        .select('*')
        .eq('parcel_id', parcelId)
        .order('date', { ascending: false })

      if (error) throw error

      return data ?? []

    },
    enabled: !!parcelId
  })

  return { workRecords, plantings, harvests }

}

/*
================================================
ESTADO DE PARCELAS
================================================
*/

export function useFarmParcelStatuses(parcelIds: string[]) {

  return useQuery({

    queryKey: ['farm_parcel_statuses', parcelIds],

    queryFn: async () => {

      if (parcelIds.length === 0) return {}

      const [plantingsRes, harvestsRes, workRes] = await Promise.all([

        supabase
          .from('plantings')
          .select('parcel_id, date')
          .in('parcel_id', parcelIds)
          .order('date', { ascending: false }),

        supabase
          .from('harvests')
          .select('parcel_id, date')
          .in('parcel_id', parcelIds)
          .order('date', { ascending: false }),

        supabase
          .from('work_records')
          .select('parcel_id, date')
          .in('parcel_id', parcelIds)
          .order('date', { ascending: false })

      ])

      const latestPlanting: Record<string,string> = {}
      const latestHarvest: Record<string,string> = {}
      const latestWork: Record<string,string> = {}

      for (const r of plantingsRes.data || []) {
        if (!latestPlanting[r.parcel_id]) latestPlanting[r.parcel_id] = r.date
      }

      for (const r of harvestsRes.data || []) {
        if (!latestHarvest[r.parcel_id]) latestHarvest[r.parcel_id] = r.date
      }

      for (const r of workRes.data || []) {
        if (!latestWork[r.parcel_id]) latestWork[r.parcel_id] = r.date
      }

      const statuses: Record<string,ParcelStatus> = {}

      for (const id of parcelIds) {

        const p = latestPlanting[id]
        const h = latestHarvest[id]
        const w = latestWork[id]

        if (!p && !h && !w) {
          statuses[id] = 'vacia'
        }
        else if (h && (!p || h >= p)) {
          statuses[id] = 'cosechada'
        }
        else if (p && (!h || p > h)) {
          statuses[id] = 'plantada'
        }
        else if (w && !p && !h) {
          statuses[id] = 'preparacion'
        }
        else {
          statuses[id] = 'activa'
        }

      }

      return statuses

    },

    enabled: parcelIds.length > 0,
    staleTime: 30000

  })

}

/*
================================================
INSERTAR TRABAJO
================================================
*/

export function useInsertWorkRecord() {

  const qc = useQueryClient()

  return useMutation({

    mutationFn: async (record: TablesInsert<'work_records'>) => {

      const { data, error } = await supabase
        .from('work_records')
        .insert(record)
        .select()
        .single()

      if (error) throw error

      return data

    },

    onSuccess: (_, vars) => {

      qc.invalidateQueries({ queryKey: ['work_records', vars.parcel_id] })
      qc.invalidateQueries({ queryKey: ['farm_parcel_statuses'] })

    }

  })

}

/*
================================================
INSERTAR PLANTACIÓN
================================================
*/

export function useInsertPlanting() {

  const qc = useQueryClient()

  return useMutation({

    mutationFn: async (record: TablesInsert<'plantings'>) => {

      const { data, error } = await supabase
        .from('plantings')
        .insert(record)
        .select()
        .single()

      if (error) throw error

      const parcel = await supabase
        .from('parcels')
        .select('area_hectares')
        .eq('parcel_id', record.parcel_id)
        .single()

      const area = parcel.data?.area_hectares || 0

      const cropData = await supabase
        .from('cultivos_catalogo')
        .select('*')
        .eq('nombre_interno', record.crop)
        .single()

      const cultivo = cropData.data

      const rendimiento = cultivo?.rendimiento_kg_ha ?? 18000
      const plastico = cultivo?.kg_plastico_por_ha ?? 1200
      const drip = cultivo?.m_cinta_riego_por_ha ?? 8000

      const estimated_production = Math.round(area * rendimiento)
      const estimated_plastic = Math.round(area * plastico)
      const estimated_drip = Math.round(area * drip)
      const estimated_cost = Math.round(area * 650)

      await supabase
        .from('parcel_production')
        .upsert({
          parcel_id: record.parcel_id,
          crop: record.crop,
          area_hectares: area,
          estimated_production_kg: estimated_production,
          estimated_plastic_kg: estimated_plastic,
          estimated_drip_meters: estimated_drip,
          estimated_cost: estimated_cost
        })

      return data

    },

    onSuccess: (_, vars) => {

      qc.invalidateQueries({ queryKey: ['plantings', vars.parcel_id] })
      qc.invalidateQueries({ queryKey: ['farm_parcel_statuses'] })
      qc.invalidateQueries({ queryKey: ['parcel_production'] })

    }

  })

}

/*
================================================
INSERTAR COSECHA
================================================
*/

export function useInsertHarvest() {

  const qc = useQueryClient()

  return useMutation({

    mutationFn: async (record: TablesInsert<'harvests'>) => {

      const { data, error } = await supabase
        .from('harvests')
        .insert(record)
        .select()
        .single()

      if (error) throw error

      return data

    },

    onSuccess: (_, vars) => {

      qc.invalidateQueries({ queryKey: ['harvests', vars.parcel_id] })
      qc.invalidateQueries({ queryKey: ['farm_parcel_statuses'] })

    }

  })

}