import React from 'react';
import { ArrowLeft, Package, FileText, ChevronDown } from 'lucide-react';
import { ICON_MAP } from '@/components/InventarioUbicacion/inventarioUbicacionConstants';
import type { InformeTipo } from '@/components/InventarioUbicacion/inventarioUbicacionTypes';

export type UbicacionCategoriaChip = {
  id: string;
  nombre: string;
  icono: string;
};

type Props = {
  ubicacionNombre: string | undefined;
  horaStr: string;
  onBack: () => void;
  categorias: UbicacionCategoriaChip[];
  activeCatId: string | null;
  onSelectCat: (id: string) => void;
  showPdfMenu: boolean;
  setShowPdfMenu: React.Dispatch<React.SetStateAction<boolean>>;
  onPickInforme: (tipo: InformeTipo) => void;
  onOpenInformeExcel: () => void;
};

export function InventarioUbicacionPageChrome({
  ubicacionNombre,
  horaStr,
  onBack,
  categorias,
  activeCatId,
  onSelectCat,
  showPdfMenu,
  setShowPdfMenu,
  onPickInforme,
  onOpenInformeExcel,
}: Props) {
  return (
    <>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <img
          src="/MARVIC_logo.png"
          className="w-[520px] opacity-[0.04]"
          style={{ filter: 'brightness(0) invert(1)' }}
          alt=""
        />
      </div>

      <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 border border-white/10 rounded-lg px-4 py-3 min-w-[200px] max-w-[260px]">
        <p className="text-[10px] font-black text-[#6d9b7d] uppercase tracking-[0.3em] mb-1">
          Marvic 360 · Inventario
        </p>
        <p className="text-sm font-black text-white uppercase tracking-tight leading-tight">
          {ubicacionNombre ?? '…'}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Operativo</span>
          <span className="text-[10px] text-slate-500 ml-auto font-mono">{horaStr}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="absolute top-4 left-[276px] z-[1000] w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center bg-slate-900/90 hover:border-[#6d9b7d]/40 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 text-slate-400" />
      </button>

      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-1">
        {categorias.map(cat => {
          const Icon = ICON_MAP[cat.icono] ?? Package;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCat(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeCatId === cat.id
                  ? 'bg-[#6d9b7d]/20 border-[#6d9b7d]/60 text-[#6d9b7d]'
                  : 'bg-slate-900/90 border-white/10 text-slate-300 hover:border-[#6d9b7d]/30 hover:text-[#6d9b7d]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {cat.nombre}
            </button>
          );
        })}

        <div className="w-full h-px bg-white/10 my-1" />
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPdfMenu(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap bg-slate-900/90 border-white/10 text-slate-300 hover:border-[#6d9b7d]/30 hover:text-[#6d9b7d] w-full"
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            Informes PDF
            <ChevronDown className="w-3 h-3 ml-auto" />
          </button>
          {showPdfMenu && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-slate-900 border border-white/10 rounded-lg shadow-xl z-10 overflow-hidden">
              {[
                { label: 'Informe completo ubicacion', tipo: 'historico' as const },
                { label: 'Stock actual por categoria', tipo: 'mes' as const },
                { label: 'Por categoria especifica', tipo: 'categoria' as const },
              ].map(({ label, tipo }) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => onPickInforme(tipo)}
                  className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:bg-[#6d9b7d]/10 hover:text-[#6d9b7d] transition-colors"
                >
                  {label}
                </button>
              ))}
              <div className="w-full h-px bg-white/10" />
              <button
                type="button"
                onClick={onOpenInformeExcel}
                className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:bg-[#6d9b7d]/10 hover:text-[#6d9b7d] transition-colors"
              >
                Exportar Excel
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
