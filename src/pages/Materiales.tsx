import React from 'react';
import { Package, Droplets, Leaf } from 'lucide-react';

export default function Materiales() {
  return (
      <div className="p-6 max-w-6xl mx-auto w-full text-slate-200">
        <div className="flex items-center gap-3 mb-6 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
            <Leaf className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-tight">Materiales y Consumibles</h1>
            <p className="text-xs text-slate-400 font-medium">Gestión de fitosanitarios, riego y plásticos de campo</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-white/5 p-5 rounded-xl">
            <Leaf className="w-6 h-6 text-green-400 mb-3" />
            <h2 className="font-bold text-white mb-1">Fitosanitarios</h2>
            <p className="text-xs text-slate-400">Control de stock y aplicación de tratamientos.</p>
          </div>
          <div className="bg-slate-900/60 border border-white/5 p-5 rounded-xl">
            <Droplets className="w-6 h-6 text-blue-400 mb-3" />
            <h2 className="font-bold text-white mb-1">Riego</h2>
            <p className="text-xs text-slate-400">Abonos líquidos y consumibles de riego.</p>
          </div>
          <div className="bg-slate-900/60 border border-white/5 p-5 rounded-xl">
            <Package className="w-6 h-6 text-amber-400 mb-3" />
            <h2 className="font-bold text-white mb-1">Plásticos</h2>
            <p className="text-xs text-slate-400">Acolchados, mallas y rafias.</p>
          </div>
        </div>

        <div className="mt-8 bg-slate-900/40 border border-slate-800 p-12 text-center rounded-xl flex flex-col items-center justify-center">
          <Package className="w-12 h-12 text-slate-600 mb-4 opacity-50" />
          <p className="text-slate-400 uppercase tracking-widest text-sm font-black">Módulo en construcción</p>
          <p className="text-slate-500 text-xs mt-2">Esta sección estará disponible en la próxima actualización de inventario.</p>
        </div>
      </div>
  );
}