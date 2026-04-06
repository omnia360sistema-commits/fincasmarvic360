import React, { useState, useCallback } from 'react'
import { Truck, Plus, Camera, X } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import type { Tables } from '@/integrations/supabase/types'
import { useAddResiduos, useGanaderos, useAddGanadero } from '@/hooks/useParteDiario'
import { usePersonal } from '@/hooks/usePersonal'
import { AudioInput } from '@/components/base'
import { uploadImage } from '@/utils/uploadImage'
import { formatHora } from '@/utils/dateFormat'
import { EntradaRow, EmptyState } from './Shared'

type FormD = {
  personal_id: string; nombre_conductor: string
  hora_salida_nave: string
  ganadero_id: string; nombre_ganadero: string; nuevo_ganadero: string
  hora_llegada_ganadero: string
  hora_regreso_nave: string; notas_descarga: string
  foto: File | null
}

const initD = (): FormD => ({
  personal_id: '', nombre_conductor: '',
  hora_salida_nave: '',
  ganadero_id: '', nombre_ganadero: '', nuevo_ganadero: '',
  hora_llegada_ganadero: '',
  hora_regreso_nave: '', notas_descarga: '',
  foto: null,
})

function timeToISO(fecha: string, time: string): string | null {
  if (!time) return null
  return `${fecha}T${time}:00`
}

async function uploadFoto(file: File, parteId: string): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${parteId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  return uploadImage(file, 'partes-images', path)
}

interface FormLogisticaResiduosProps {
  parteId: string | null
  residuos: Tables<'parte_residuos_vegetales'>[]
  fecha: string
  esHoy: boolean
  onDelete: (id: string) => void
}

export const FormLogisticaResiduos = React.memo(({ parteId, residuos, fecha, esHoy, onDelete }: FormLogisticaResiduosProps) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [formD, setFormD] = useState<FormD>(initD())
  const [editIdD, setEditIdD] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const { data: conductoresCamion = [] } = usePersonal('conductor_camion')
  const { data: ganaderos = [] } = useGanaderos()

  const addResiduos = useAddResiduos()
  const addGanadero = useAddGanadero()

  const editar = useCallback((e: Tables<'parte_residuos_vegetales'>) => {
    setEditIdD(e.id)
    setFormD({
      personal_id: e.personal_id ?? '', nombre_conductor: e.nombre_conductor ?? '',
      hora_salida_nave: e.hora_salida_nave ? new Date(e.hora_salida_nave).toTimeString().slice(0,5) : '',
      ganadero_id: e.ganadero_id ?? '', nombre_ganadero: e.nombre_ganadero ?? '', nuevo_ganadero: '',
      hora_llegada_ganadero: e.hora_llegada_ganadero ? new Date(e.hora_llegada_ganadero).toTimeString().slice(0,5) : '',
      hora_regreso_nave: e.hora_regreso_nave ? new Date(e.hora_regreso_nave).toTimeString().slice(0,5) : '',
      notas_descarga: e.notas_descarga ?? '', foto: null,
    })
    setModalOpen(true)
  }, [])

  async function submitD() {
    if (!parteId) return
    setSaving(true)
    try {
      let ganaderoId = formD.ganadero_id ?? null
      if (!ganaderoId && formD.nuevo_ganadero.trim()) {
        const nuevo = await addGanadero.mutateAsync(formD.nuevo_ganadero.trim())
        ganaderoId = nuevo.id
      }

      let foto_url: string | null = null
      if (formD.foto) {
        foto_url = await uploadFoto(formD.foto, parteId)
      }

      const nombreConductor = formD.personal_id
        ? ((conductoresCamion.find(c => c.id === formD.personal_id)?.nombre ?? formD.nombre_conductor) || null)
        : (formD.nombre_conductor || null)

      const nombreGanadero = ganaderoId
        ? ((ganaderos.find(g => g.id === ganaderoId)?.nombre ?? formD.nuevo_ganadero) || null)
        : (formD.nombre_ganadero || null)

      const patch = {
        parte_id:               parteId,
        nombre_conductor:       nombreConductor,
        hora_salida_nave:       timeToISO(fecha, formD.hora_salida_nave),
        nombre_ganadero:        nombreGanadero,
        hora_llegada_ganadero:  timeToISO(fecha, formD.hora_llegada_ganadero),
        hora_regreso_nave:      timeToISO(fecha, formD.hora_regreso_nave),
        notas_descarga:         formD.notas_descarga || null,
        personal_id:            formD.personal_id ?? null,
        ganadero_id:            ganaderoId,
      }

      if (editIdD) {
        await supabase.from('parte_residuos_vegetales').update(patch).eq('id', editIdD)
        if (foto_url) await supabase.from('parte_residuos_vegetales').update({ foto_url }).eq('id', editIdD)
      } else {
        await addResiduos.mutateAsync({ ...patch, foto_url })
      }
      
      setModalOpen(false); setFormD(initD()); setEditIdD(null)
    } finally { setSaving(false) }
  }

  return (
    <>
      <div className="bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden">
        <div className="bg-slate-800/60 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded border text-orange-400 border-orange-400/40 bg-orange-400/5">D</span>
            <Truck className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Residuos Vegetales</span>
          </div>
          {esHoy && parteId && (
            <button
              onClick={() => { setFormD(initD()); setEditIdD(null); setModalOpen(true); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded border border-[#38bdf8]/30 bg-[#38bdf8]/5 hover:bg-[#38bdf8]/15 text-[#38bdf8] text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <Plus className="w-3 h-3" /> Añadir
            </button>
          )}
        </div>
        <div className="divide-y divide-white/5">
          {residuos.length === 0 ? (
            <EmptyState texto="Sin viajes de residuos registrados" />
          ) : (
            residuos.map(e => (
              <EntradaRow
                key={e.id}
                hora={formatHora(e.hora_salida_nave ?? e.created_at)}
                titulo={e.nombre_conductor ? `Conductor: ${e.nombre_conductor}` : 'Viaje residuos'}
                subtitulo={[ e.nombre_ganadero ? `Ganadero: ${e.nombre_ganadero}` : null, e.hora_llegada_ganadero ? `Llegada: ${formatHora(e.hora_llegada_ganadero)}` : null, e.hora_regreso_nave ? `Regreso: ${formatHora(e.hora_regreso_nave)}` : null ].filter(Boolean).join(' · ')}
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
              <span className="text-sm font-black uppercase tracking-widest text-orange-400">D · Residuos Vegetales</span>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-white text-lg leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Conductor</label><select value={formD.personal_id} onChange={e => { const id = e.target.value; const nombre = conductoresCamion.find(c => c.id === id)?.nombre ?? ''; setFormD(p => ({ ...p, personal_id: id, nombre_conductor: nombre })) }} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#38bdf8]/50 outline-none"><option value="">— Seleccionar conductor —</option>{conductoresCamion.map(c => (<option key={c.id} value={c.id}>{c.nombre}</option>))}</select></div>
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Ganadero destino</label><select value={formD.ganadero_id} onChange={e => setFormD(p => ({ ...p, ganadero_id: e.target.value, nuevo_ganadero: '' }))} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#38bdf8]/50 outline-none"><option value="">— Seleccionar ganadero —</option><option value="__nuevo__">+ Nuevo ganadero…</option>{ganaderos.map(g => (<option key={g.id} value={g.id}>{g.nombre}</option>))}</select>{formD.ganadero_id === '__nuevo__' && (<input type="text" placeholder="Nombre del ganadero (se guardará)" value={formD.nuevo_ganadero} onChange={e => setFormD(p => ({ ...p, nuevo_ganadero: e.target.value, ganadero_id: '__nuevo__' }))} className="mt-2 w-full bg-slate-800 border border-orange-400/40 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-orange-400/70 outline-none" />)}</div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Hora salida nave</label><input type="time" value={formD.hora_salida_nave} onChange={e => setFormD(p => ({ ...p, hora_salida_nave: e.target.value }))} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#38bdf8]/50 outline-none" /></div>
                <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Hora llegada ganadero</label><input type="time" value={formD.hora_llegada_ganadero} onChange={e => setFormD(p => ({ ...p, hora_llegada_ganadero: e.target.value }))} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#38bdf8]/50 outline-none" /></div>
              </div>
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Hora regreso nave</label><input type="time" value={formD.hora_regreso_nave} onChange={e => setFormD(p => ({ ...p, hora_regreso_nave: e.target.value }))} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#38bdf8]/50 outline-none" /></div>
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Notas de la descarga</label><AudioInput value={formD.notas_descarga} onChange={v => setFormD(p => ({ ...p, notas_descarga: v }))} placeholder="Observaciones del viaje..." rows={3} /></div>
              <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Foto {!editIdD && <span className="text-orange-400">*</span>}</label>{formD.foto ? (<div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-white/10"><img src={URL.createObjectURL(formD.foto)} alt="preview" className="w-14 h-14 object-cover rounded-lg shrink-0" /><div className="flex-1 min-w-0"><p className="text-xs text-white truncate">{formD.foto.name}</p><p className="text-[10px] text-slate-500">{(formD.foto.size / 1024).toFixed(0)} KB</p></div><button type="button" onClick={() => setFormD(p => ({ ...p, foto: null }))} className="text-slate-500 hover:text-red-400 transition-colors">×</button></div>) : (<label className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-dashed border-white/20 cursor-pointer hover:border-orange-400/50 transition-colors"><Camera className="w-5 h-5 text-slate-500" /><span className="text-sm text-slate-400">Tomar foto o seleccionar</span><input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setFormD(p => ({ ...p, foto: f })) }} /></label>)}</div>
              <div className="flex gap-3 pt-2"><button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-400 text-sm hover:border-white/20 transition-colors">Cancelar</button><button onClick={submitD} disabled={saving || (!editIdD && !formD.foto)} className="flex-1 py-2.5 rounded-lg bg-orange-600 text-white text-sm font-black hover:bg-orange-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">{saving && <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />} Guardar</button></div>
            </div>
          </div>
        </div>
      )}
    </>
  )
})