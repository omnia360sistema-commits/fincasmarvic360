import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatFechaNav } from '@/utils/dateFormat';

interface NavegadorFechasProps {
  fecha: string;
  esHoy: boolean;
  onAnterior: () => void;
  onSiguiente: () => void;
}

export const NavegadorFechas = React.memo(({
  fecha, esHoy, onAnterior, onSiguiente
}: NavegadorFechasProps) => {
  return (
    <div className="flex items-center gap-1 ml-auto">
      <button
        onClick={onAnterior}
        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-[11px] font-bold text-white min-w-[140px] text-center">
        {formatFechaNav(fecha)}
        {esHoy && <span className="ml-1 text-[9px] text-[#6d9b7d] font-black">HOY</span>}
      </span>
      <button
        onClick={onSiguiente}
        disabled={esHoy}
        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
});