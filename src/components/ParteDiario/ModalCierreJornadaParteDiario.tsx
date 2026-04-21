import React from 'react'

export type CierreJornadaResultado = {
  ejecutados: number
  pendientes: number
  arrastrados: number
  incidenciasArrastradas: number
}

export function ModalCierreJornadaParteDiario({
  open,
  resultado,
  onClose,
  onVerPlanificacion,
}: {
  open: boolean
  resultado: CierreJornadaResultado | null
  onClose: () => void
  onVerPlanificacion: () => void
}) {
  if (!open || !resultado) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md shadow-2xl">
        <div className="border-b border-white/10 px-5 py-3 flex items-center justify-between">
          <span className="text-sm font-black uppercase tracking-widest text-orange-400">Jornada cerrada</span>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white text-lg leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Trabajos ejecutados', value: resultado.ejecutados, color: 'text-green-400' },
              { label: 'Pendientes arrastrados', value: resultado.arrastrados, color: 'text-orange-400' },
              { label: 'Incidencias arrastradas', value: resultado.incidenciasArrastradas, color: 'text-red-400' },
              { label: 'Pendientes marcados', value: resultado.pendientes, color: 'text-slate-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-800/60 border border-white/10 rounded-lg px-3 py-3 text-center">
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 text-center">
            Los trabajos pendientes e incidencias urgentes han sido arrastrados a manana con prioridad alta.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-400 text-sm hover:border-white/20 transition-colors"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={onVerPlanificacion}
              className="flex-1 py-2.5 rounded-lg bg-orange-600 text-white text-sm font-black hover:bg-orange-500 transition-colors"
            >
              Ver planificacion
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
