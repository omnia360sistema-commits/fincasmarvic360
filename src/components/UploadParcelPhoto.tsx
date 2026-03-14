import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"

type Props = {
  parcelId: string
  onClose?: () => void
}

export default function UploadParcelPhoto({ parcelId, onClose }: Props) {

  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState("")
  const [uploading, setUploading] = useState(false)

  async function handleUpload(e: React.FormEvent) {

    e.preventDefault()

    if (!file) {
      alert("Selecciona una imagen")
      return
    }

    try {

      setUploading(true)

      const fileExt = file.name.split(".").pop()
      const fileName = `${parcelId}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("parcel-images")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from("parcel-images")
        .getPublicUrl(filePath)

      const imageUrl = data.publicUrl

      const { error: insertError } = await supabase
        .from("parcel_photos")
        .insert([
          {
            parcel_id: parcelId,
            image_url: imageUrl,
            description
          }
        ])

      if (insertError) throw insertError

      alert("Foto subida correctamente")

      if (onClose) onClose()

    } catch (err) {

      console.error(err)
      alert("Error subiendo imagen")

    } finally {

      setUploading(false)

    }

  }

  return (

    <div className="px-5 pb-6">

      <h3 className="text-lg font-bold mb-4">
        Subir foto de parcela
      </h3>

      <form onSubmit={handleUpload} className="space-y-4">

        <input
          type="file"
          accept="image/*,video/*"
          capture="environment"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full"
        />

        <textarea
          placeholder="Descripción (plaga, estado cultivo, dron, etc)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-3 rounded-xl w-full bg-secondary"
        />

        <button
          type="submit"
          disabled={uploading}
          className="bg-primary text-white px-4 py-3 rounded-xl w-full font-semibold"
        >
          {uploading ? "Subiendo..." : "Subir foto"}
        </button>

      </form>

    </div>
  )
}