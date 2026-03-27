import { supabase } from '@/integrations/supabase/client'

/**
 * Sube un archivo a Supabase Storage y devuelve la URL pública.
 * Devuelve null si falla (no lanza excepción).
 */
export async function uploadImage(
  file: File,
  bucket: string,
  path: string,
  upsert = true,
): Promise<string | null> {
  try {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert })
    if (error) return null
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
  } catch {
    return null
  }
}

/**
 * Genera un path único: `folder/timestamp-random.ext`
 * Ej: buildStoragePath('trabajos', file) → 'trabajos/1712345678901-x7k3m.jpg'
 */
export function buildStoragePath(folder: string, file: File, filenamePrefix = ''): string {
  const ext = file.name.split('.').pop() ?? 'jpg'
  return `${folder}/${filenamePrefix}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
}
