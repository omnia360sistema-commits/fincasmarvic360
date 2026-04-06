import React from 'react';
import { Camera } from 'lucide-react';
import { RecordActions } from '@/components/base';

export const EntradaRow = React.memo(({
  hora, titulo, subtitulo, hasPhoto, id, onEdit, onDelete, esHoy, parteId
}: {
  hora: string; titulo: string; subtitulo?: string;
  hasPhoto?: boolean; id: string;
  onEdit?: () => void; onDelete: () => void; esHoy: boolean; parteId: string | null;
}) => (
  <div className="px-4 py-3 flex items-start justify-between gap-2 hover:bg-white/5 transition-colors">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-[#38bdf8] shrink-0">{hora}</span>
        {hasPhoto && <Camera className="w-3 h-3 text-slate-500 shrink-0" />}
      </div>
      <p className="text-sm text-white font-medium truncate mt-0.5">{titulo}</p>
      {subtitulo && <p className="text-[11px] text-slate-400 truncate mt-0.5">{subtitulo}</p>}
    </div>
    {esHoy && parteId && (
      <RecordActions onEdit={onEdit} onDelete={onDelete} />
    )}
  </div>
));

export const EmptyState = React.memo(({ texto }: { texto: string }) => (
  <div className="px-4 py-8 text-center">
    <p className="text-[11px] text-slate-600 uppercase tracking-widest">{texto}</p>
  </div>
));