import React, { useRef } from 'react'

interface PhotoAttachmentProps {
  value: string | null
  onChange: (file: File | null) => void
  bucket?: string
  path?: string
  label?: string
}

export default function PhotoAttachment({
  value,
  onChange,
  label,
}: PhotoAttachmentProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    onChange(file)
  }

  function handleRemove() {
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-slate-200">{label}</label>
      )}

      {value ? (
        <div className="relative w-full max-w-xs">
          <img
            src={value}
            alt="Adjunto"
            className="w-full rounded border border-slate-600 object-cover max-h-48"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 right-1 rounded bg-slate-900/80 border border-slate-600 text-slate-300 text-xs px-2 py-1 hover:text-red-400"
          >
            Eliminar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 w-fit rounded border border-dashed border-slate-600 bg-slate-800 text-slate-400 text-sm px-4 py-3 hover:border-slate-400 hover:text-slate-200 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          Adjuntar foto
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
