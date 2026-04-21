import React, { useState, useCallback, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { nombreFirmaPdfFromUser } from '@/utils/pdfUtils'
import { User, Plus, Camera, X } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import type { Tables } from '@/integrations/supabase/types'
import { useAddPersonal } from '@/hooks/useParteDiario'
import { AudioInput } from '@/components/base'
import { uploadImage } from '@/utils/uploadImage'
import { formatHora } from '@/utils/dateFormat'
import { EntradaRow, EmptyState } from './Shared'

type FormC = { texto: string; con_quien: string; donde: string; foto: File | null }
const initC = (): FormC => ({ texto: '', con_quien: '', donde: '', foto: null })

async function uploadFoto(file: File, parteId: string): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${parteId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  return uploadImage(file, 'partes-images', path)
}

interface FormAnotacionesLibresProps {
  parteId: string | null
  personales: Tables<'parte_personal'>[]
  esHoy: boolean
  onDelete: (id: string) => void
}

export const FormAnotacionesLibres = React.memo(({ parteId, personales, esHoy, onDelete }: FormAnotacionesLibresProps) => {
  const { user } = useAuth()
  const etiquetaPersonal = useMemo(() => {
    const n = nombreFirmaPdfFromUser(user)
    return `Parte personal — ${n}`
  }, [user])
  const [modalOpen, setModalOpen] = useState(false)
  const [formC, setFormC] = useState<FormC>(initC())
  const [editIdC, setEditIdC] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const addPersonal = useAddPersonal()

  const editar = useCallback((e: Tables<'parte_personal'>) => {
    setEditIdC(e.id)
    setFormC({ texto: e.texto ?? '', con_quien: e.con_quien ?? '', donde: e.donde ?? '', foto: null })
    setModalOpen(true)
  }, [])

  async function submitC() {
    if (!parteId || !formC.texto.trim()) return
    setSaving(true)
    try {
      const patch = {
        parte_id:  parteId,
        texto:     formC.texto,
        con_quien: formC.con_quien || null,
        donde:     formC.donde     || null,
      }
      if (editIdC) {
        await supabase.from('parte_personal').update(patch).eq('id', editIdC)
        if (formC.foto) { const u = await uploadFoto(formC.foto, parteId); if (u) await supabase.from('parte_personal').update({ foto_url: u }).eq('id', editIdC) }
      } else {
        const foto_url = formC.foto ? await uploadFoto(formC.foto, parteId) : null
        await addPersonal.mutateAsync({ ...patch, foto_url })
      }
      setModalOpen(false); setFormC(initC()); setEditIdC(null)
    } finally { setSaving(false) }
  }

  return (
    <>
      <div className="bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden">
        <div className="bg-slate-800/60 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded border text-green-400 border-green-400/40 bg-green-400/5">C</span>
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">{etiquetaPersonal}</span>
          </div>
          {esHoy && parteId && (
            <button
              onClick={() => { setFormC(initC()); setEditIdC(null); setModalOpen(true); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded border border-[#6d9b7d]/30 bg-[#6d9b7d]/5 hover:bg-[#6d9b7d]/15 text-[#6d9b7d] text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <Plus className="w-3 h-3" /> Añadir
            </button>
          )}
        </div>
        <div className="divide-y divide-white/5">
          {personales.length === 0 ? (
            <EmptyState texto="Sin anotaciones personales" />
          ) : (
            personales.map(e => (
              <EntradaRow
                key={e.id} hora={formatHora(e.fecha_hora)}
                titulo={e.texto.length > 60 ? e.texto.slice(0, 60) + '…' : e.texto}
                subtitulo={[ e.con_quien ? `Con: ${e.con_quien}` : null, e.donde ? `En: ${e.donde}` : null ].filter(Boolean).join(' · ')}
                hasPhoto={!!e.foto_url}
                onEdit={() => editar(e)} onDelete={() => onDelete(e.id)}
                esHoy={esHoy} parteId={parteId} id={e.id}
              />
            ))
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-white/10 px-5 py-3 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-widest text-green-400">C · {etiquetaPersonal}</span>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-white text-lg leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Texto libre *</label><AudioInput value={formC.texto} onChange={v => setFormC(p => ({ ...p, texto: v }))} placeholder="Qué gestiona, decisiones tomadas, observaciones..." rows={5} /></div>
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Con quién</label><input type="text" value={formC.con_quien} onChange={e => setFormC(p => ({ ...p, con_quien: e.target.value }))} placeholder="Técnico CAAE, proveedor, gestor..." className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-[#6d9b7d]/50 outline-none" /></div>
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Dónde</label><AudioInput value={formC.donde} onChange={v => setFormC(p => ({ ...p, donde: v }))} placeholder="Murcia, nave, oficina..." rows={1} /></div>
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Foto (opcional)</label><label className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 border border-white/10 rounded-lg cursor-pointer hover:border-[#6d9b7d]/30 transition-colors"><Camera className="w-4 h-4 text-slate-500 shrink-0" /><span className="text-[11px] text-slate-400 truncate">{formC.foto?.name ?? 'Capturar / Subir'}</span><input type="file" accept="image/*" capture="environment" className="sr-only" onChange={e => { const f = e.target.files?.[0] ?? null; setFormC(p => ({ ...p, foto: f })) }} /></label></div>
              <p className="text-[10px] text-slate-600">La fecha y hora se registran automáticamente.</p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-400 text-sm hover:border-white/20 transition-colors">Cancelar</button>
                <button onClick={submitC} disabled={saving || !formC.texto.trim()} className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-black hover:bg-green-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">{saving && <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />} Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
})