import { supabase } from '@/integrations/supabase/client'

export const TEXTURAS = [
  'Arcilloso', 'Franco arcilloso', 'Franco', 'Franco arenoso', 'Arenoso', 'Limoso',
] as const

export const FUENTES_AGUA = [
  'Pozo propio', 'Balsa de riego', 'Canal de riego', 'Red municipal', 'Río', 'Otra',
] as const

export const num = (v: string) => (v === '' ? undefined : parseFloat(v))
export const int = (v: string) => (v === '' ? undefined : parseInt(v, 10))

export async function uploadFoto(file: File, parcelId: string): Promise<string | null> {
  try {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `estado/${parcelId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('parcel-images')
      .upload(path, file, { upsert: true })
    if (error) return null
    return supabase.storage.from('parcel-images').getPublicUrl(path).data.publicUrl
  } catch {
    return null
  }
}
