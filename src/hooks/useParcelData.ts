import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { TablesInsert } from '@/integrations/supabase/types'
import type { ParcelStatus } from '@/types/farm'


const cropProfiles: Record<string, { yield: number; plastic: number; drip: number }> = {
 broccoli: { yield: 18000, plastic: 12000, drip: 8000 },
 romanesco: { yield: 16000, plastic: 12000, drip: 8000 },
 cabbage: { yield: 22000, plastic: 11000, drip: 7500 },
 lettuce: { yield: 14000, plastic: 10000, drip: 7000 },
 celery: { yield: 20000, plastic: 11000, drip: 7500 },
}


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
     return data
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
     return data
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
     return data
   },
   enabled: !!parcelId
 })


 return { workRecords, plantings, harvests }
}


export function useFarmParcelStatuses(parcelIds: string[]) {
 return useQuery({
   queryKey: ['farm_parcel_statuses', parcelIds],
   queryFn: async () => {


     if (parcelIds.length === 0) return {}


     const [plantingsRes, harvestsRes, workRes] = await Promise.all([
       supabase.from('plantings').select('parcel_id, date').in('parcel_id', parcelIds).order('date',{ascending:false}),
       supabase.from('harvests').select('parcel_id, date').in('parcel_id', parcelIds).order('date',{ascending:false}),
       supabase.from('work_records').select('parcel_id, date').in('parcel_id', parcelIds).order('date',{ascending:false})
     ])


     const latestPlanting: Record<string,string> = {}
     for (const r of plantingsRes.data || []) {
       if (!latestPlanting[r.parcel_id]) latestPlanting[r.parcel_id] = r.date
     }


     const latestHarvest: Record<string,string> = {}
     for (const r of harvestsRes.data || []) {
       if (!latestHarvest[r.parcel_id]) latestHarvest[r.parcel_id] = r.date
     }


     const latestWork: Record<string,string> = {}
     for (const r of workRes.data || []) {
       if (!latestWork[r.parcel_id]) latestWork[r.parcel_id] = r.date
     }


     const statuses: Record<string,ParcelStatus> = {}


     for (const id of parcelIds) {


       const p = latestPlanting[id]
       const h = latestHarvest[id]
       const w = latestWork[id]


       if (!p && !h && !w) statuses[id] = 'empty'
       else if (h && (!p || h >= p)) statuses[id] = 'harvested'
       else if (p && (!h || p > h)) statuses[id] = 'planted'
       else if (w && !p && !h) statuses[id] = 'preparation'
       else statuses[id] = 'active'
     }


     return statuses
   },
   enabled: parcelIds.length > 0,
   staleTime: 30000
 })
}


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
     const profile = cropProfiles[record.crop] || cropProfiles.broccoli


     const estimated_production = Math.round(area * profile.yield)
     const estimated_plastic = Math.round(area * profile.plastic)
     const estimated_drip = Math.round(area * profile.drip)
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

