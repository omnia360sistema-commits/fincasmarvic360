import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, FileText, Plus, Users,
} from 'lucide-react';
import {
  usePersonal,
  usePersonalExterno,
  useDeletePersonal,
  useDeletePersonalExterno,
  Personal,
  PersonalExterno,
  CategoriaPersonal,
} from '../hooks/usePersonal';
import { TabType, TABS, diasHastaCaducidad, formatFecha } from '@/components/Personal/personalConstants';
import {
  ModalPersonal,
  ModalExterno,
  TarjetaPersonal,
  TarjetaExterno,
} from '@/components/Personal/personalPieces';
import { generarPersonalListadoPdf } from '@/utils/generarPersonalListadoPdf';

const URL_TO_TAB: Record<string, TabType> = {
  operarios: 'operario_campo',
  encargados: 'encargado',
  maquinaria: 'conductor_maquinaria',
  camion: 'conductor_camion',
  externa: 'externo',
};

const TAB_TO_URL: Record<TabType, string> = {
  operario_campo: 'operarios',
  encargado: 'encargados',
  conductor_maquinaria: 'maquinaria',
  conductor_camion: 'camion',
  externo: 'externa',
};

export default function Personal() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const tab: TabType = rawTab && URL_TO_TAB[rawTab] ? URL_TO_TAB[rawTab] : 'operario_campo';

  const setTab = useCallback((next: TabType) => {
    setSearchParams(
      prev => {
        const p = new URLSearchParams(prev);
        p.set('tab', TAB_TO_URL[next]);
        return p;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const { data: todoPersonal = [] } = usePersonal();
  const { data: externos = [] }     = usePersonalExterno();
  const deleteFijo = useDeletePersonal();
  const deleteExt  = useDeletePersonalExterno();

  const [modalCat,   setModalCat]   = useState<CategoriaPersonal | null>(null);
  const [editFijo,   setEditFijo]   = useState<Personal | null>(null);
  const [editExt,    setEditExt]    = useState<PersonalExterno | null>(null);
  const [newExterno, setNewExterno] = useState(false);

  const listaFija = tab !== 'externo' ? todoPersonal.filter(p => p.categoria === tab) : [];
  const listaExt  = tab === 'externo' ? externos : [];
  const activeTab = TABS.find(t => t.id === tab)!;

  const carnetsCriticos = todoPersonal.filter(p => {
    const d = diasHastaCaducidad(p.carnet_caducidad);
    return d !== null && d <= 30;
  });

  function generarPDF() {
    generarPersonalListadoPdf(todoPersonal, externos);
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Header */}
      <div className="flex items-center justify-between pl-14 pr-4 pt-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#e879f9]/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#e879f9]" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">PERSONAL</p>
              <p className="text-slate-500 text-[10px]">Gestion de personal de la explotacion</p>
            </div>
          </div>
        </div>
        <button onClick={generarPDF}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs">
          <FileText className="w-3.5 h-3.5" />
          PDF
        </button>
      </div>

      {/* Panel resumen */}
      <div className="px-4 py-3 space-y-2">
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'Operarios',  cat: 'operario_campo' as CategoriaPersonal,       color: '#22c55e', externo: false },
            { label: 'Encargados', cat: 'encargado' as CategoriaPersonal,             color: '#6d9b7d', externo: false },
            { label: 'Maquinaria', cat: 'conductor_maquinaria' as CategoriaPersonal,  color: '#fb923c', externo: false },
            { label: 'Camion',     cat: 'conductor_camion' as CategoriaPersonal,      color: '#a78bfa', externo: false },
            { label: 'Externa',    cat: null,                                          color: '#f472b6', externo: true },
          ].map(({ label, cat, color, externo }) => {
            const count = externo
              ? externos.filter(e => e.activo).length
              : todoPersonal.filter(p => p.categoria === cat && p.activo).length;
            return (
              <div key={label} className="bg-slate-900/60 border border-white/10 rounded-lg px-1 py-2 text-center">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-tight mb-0.5">
                  {label}
                </p>
                <p className="text-base font-black" style={{ color }}>{count}</p>
              </div>
            );
          })}
        </div>

        {/* Alerta carnets */}
        {carnetsCriticos.length > 0 && (
          <div className="border border-red-500/30 rounded-lg px-3 py-2 space-y-0.5">
            <p className="text-red-400 text-xs font-bold uppercase tracking-wide">
              Carnets con caducidad proxima o vencida
            </p>
            {carnetsCriticos.map(p => {
              const d = diasHastaCaducidad(p.carnet_caducidad);
              return (
                <p key={p.id} className="text-red-300 text-xs">
                  {p.nombre}
                  {p.carnet_tipo ? ` — carnet ${p.carnet_tipo}` : ''}
                  {' — '}
                  {d !== null && d <= 0 ? 'CADUCADO' : `caduca en ${d} dias`}
                  {' '}({formatFecha(p.carnet_caducidad)})
                </p>
              );
            })}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pb-3 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
            style={tab === t.id
              ? { backgroundColor: t.color + '22', color: t.color, border: `1px solid ${t.color}55` }
              : { backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid transparent' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="px-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white text-sm font-bold uppercase tracking-wide">
            {activeTab.label}
            <span className="text-slate-500 text-xs font-normal ml-2 normal-case">
              ({tab === 'externo' ? listaExt.length : listaFija.length})
            </span>
          </span>
          <button
            onClick={() => {
              if (tab === 'externo') setNewExterno(true);
              else setModalCat(tab as CategoriaPersonal);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold"
            style={{ backgroundColor: activeTab.color }}
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo
          </button>
        </div>

        {tab !== 'externo' && (
          listaFija.length === 0
            ? <p className="text-slate-500 text-sm text-center py-8">Sin registros en esta categoria</p>
            : <div className="space-y-2">
                {listaFija.map(p => (
                  <TarjetaPersonal
                    key={p.id}
                    p={p}
                    onEdit={setEditFijo}
                    onDelete={id => deleteFijo.mutate(id)}
                  />
                ))}
              </div>
        )}

        {tab === 'externo' && (
          listaExt.length === 0
            ? <p className="text-slate-500 text-sm text-center py-8">Sin empresas externas registradas</p>
            : <div className="space-y-2">
                {listaExt.map(p => (
                  <TarjetaExterno
                    key={p.id}
                    p={p}
                    onEdit={setEditExt}
                    onDelete={id => deleteExt.mutate(id)}
                  />
                ))}
              </div>
        )}
      </div>

      {/* Modales */}
      {modalCat && (
        <ModalPersonal
          categoria={modalCat}
          onClose={() => setModalCat(null)}
        />
      )}
      {editFijo && (
        <ModalPersonal
          categoria={editFijo.categoria}
          initial={editFijo}
          onClose={() => setEditFijo(null)}
        />
      )}
      {(newExterno || editExt) && (
        <ModalExterno
          initial={editExt ?? undefined}
          onClose={() => { setNewExterno(false); setEditExt(null); }}
        />
      )}
    </div>
  );
}
