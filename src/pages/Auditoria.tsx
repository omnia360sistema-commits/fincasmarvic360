import React from 'react';
import { ShieldCheck, History, FileText } from 'lucide-react';

export default function Auditoria() {
  return (
      <div className="p-6 max-w-6xl mx-auto w-full text-slate-200">
        <div className="flex items-center gap-3 mb-6 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-tight">Auditoría y Certificaciones</h1>
            <p className="text-xs text-slate-400 font-medium">Certificaciones, trazas y logs del sistema</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-white/5 p-5 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-emerald-400 mb-3" />
            <h2 className="font-bold text-white mb-1">Certificaciones</h2>
            <p className="text-xs text-slate-400">Gestión de CAAE, GlobalGAP y auditorías externas.</p>
          </div>
          <div className="bg-slate-900/60 border border-white/5 p-5 rounded-xl">
            <History className="w-6 h-6 text-indigo-400 mb-3" />
            <h2 className="font-bold text-white mb-1">Trazas de Producción</h2>
            <p className="text-xs text-slate-400">Trazabilidad forense desde semilla a expedición.</p>
          </div>
          <div className="bg-slate-900/60 border border-white/5 p-5 rounded-xl">
            <FileText className="w-6 h-6 text-slate-400 mb-3" />
            <h2 className="font-bold text-white mb-1">Logs del Sistema</h2>
            <p className="text-xs text-slate-400">Registro inmutable de acciones de usuarios en el ERP.</p>
          </div>
        </div>

        <div className="mt-8 bg-slate-900/40 border border-slate-800 p-12 text-center rounded-xl flex flex-col items-center justify-center">
          <ShieldCheck className="w-12 h-12 text-slate-600 mb-4 opacity-50" />
          <p className="text-slate-400 uppercase tracking-widest text-sm font-black">Módulo en construcción</p>
          <p className="text-slate-500 text-xs mt-2">Esta sección estará disponible en la próxima actualización de calidad.</p>
        </div>
      </div>
  );
}