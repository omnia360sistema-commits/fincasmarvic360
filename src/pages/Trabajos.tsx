import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Plus, CheckCircle2, Calendar, Leaf, AlertTriangle, Briefcase,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import {
  useIncidencias,
  usePlanificacionDia,
  usePlanificacionCampana,
  useCerrarJornada,
  TrabajoRegistro, TrabajoIncidencia, PlanificacionCampana,
} from '../hooks/useTrabajos';
import {
  generarPDFCorporativoBase,
  nombreFirmaPdfFromUser,
  pdfCorporateSection,
  pdfCorporateTable,
  PDF_COLORS,
  PDF_MARGIN,
} from '../utils/pdfUtils';
import ModalCierreTrabajo from '@/components/ModalCierreTrabajo';
import {
  hoy,
  addDays,
  fmtFecha,
  PanelDia,
  TarjetaTrabajoPlan,
  ModalTrabajoPlan,
  ModalCampana,
  TarjetaCampana,
  ModalIncidencia,
  TarjetaIncidencia,
  ModalCierreResultado,
  type CierreResultado,
} from '@/components/Trabajos/trabajosPieces';

// ── Componente principal ──────────────────────────────────────
type TabPrincipal = 'diaria' | 'campana' | 'incidencias';
type FiltroInc = 'todas' | 'urgentes' | 'no_urgentes';

export default function Trabajos() {
  const navigate  = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme } = useTheme();
  const { user }  = useAuth();
  const firmaPdf  = nombreFirmaPdfFromUser(user);
  const isDark    = theme === 'dark';

  const tabFromUrl = searchParams.get('tab');
  const tab: TabPrincipal =
    tabFromUrl === 'campana' ? 'campana' :
    tabFromUrl === 'incidencias' ? 'incidencias' :
    'diaria';

  const setTab = useCallback((next: TabPrincipal) => {
    const urlTab = next === 'diaria' ? 'planificacion' : next;
    setSearchParams(
      prev => {
        const p = new URLSearchParams(prev);
        p.set('tab', urlTab);
        return p;
      },
      { replace: true }
    );
  }, [setSearchParams]);
  const [fechaDia,          setFechaDia]          = useState(hoy());
  const [modalTrabajo,      setModalTrabajo]      = useState(false);
  const [editTrabajo,       setEditTrabajo]       = useState<TrabajoRegistro | null>(null);
  const [modalCampana,      setModalCampana]      = useState(false);
  const [editCampana,       setEditCampana]       = useState<PlanificacionCampana | null>(null);
  const [modalIncidencia,   setModalIncidencia]   = useState(false);
  const [editIncidencia,    setEditIncidencia]    = useState<TrabajoIncidencia | null>(null);
  const [trabajoCierre,     setTrabajoCierre]     = useState<TrabajoRegistro | null>(null);
  const [filtroInc,         setFiltroInc]         = useState<FiltroInc>('todas');
  const [cierreResultado,   setCierreResultado]   = useState<CierreResultado | null>(null);
  const [pdfMenuOpen,       setPdfMenuOpen]       = useState(false);
  const [generandoPdf,      setGenerandoPdf]      = useState(false);
  const pdfMenuRef = useRef<HTMLDivElement>(null);

  const { data: incidencias = [] } = useIncidencias();
  const { data: campanas = [] }  = usePlanificacionCampana();
  const { data: trabajosDia = [] } = usePlanificacionDia(fechaDia);
  const cerrarJornada = useCerrarJornada();

  const incAbiertas = incidencias.filter(i => i.estado !== 'resuelta').length;
  const incUrgentes = incidencias.filter(i => i.urgente && i.estado !== 'resuelta').length;

  const incFiltradas = useMemo(() => {
    if (filtroInc === 'urgentes')    return incidencias.filter(i => i.urgente && i.estado !== 'resuelta');
    if (filtroInc === 'no_urgentes') return incidencias.filter(i => !i.urgente);
    return incidencias;
  }, [incidencias, filtroInc]);

  useEffect(() => {
    if (!pdfMenuOpen) return;
    const onDown = (ev: MouseEvent) => {
      if (pdfMenuRef.current && !pdfMenuRef.current.contains(ev.target as Node)) setPdfMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [pdfMenuOpen]);

  const handlePrevDia = useCallback(() => setFechaDia(d => addDays(d, -1)), []);
  const handleNextDia = useCallback(() => setFechaDia(d => addDays(d, 1)), []);

  const handleCerrarJornada = useCallback(async () => {
    if (!confirm(`¿Cerrar la jornada del ${fmtFecha(fechaDia)}?`)) return;
    const resultado = await cerrarJornada.mutateAsync(fechaDia);
    setCierreResultado(resultado as unknown as CierreResultado);
  }, [fechaDia, cerrarJornada]);

  const handleEditTrabajo = useCallback((t: TrabajoRegistro) => { setEditTrabajo(t); setModalTrabajo(true); }, []);
  const handleCloseTrabajo = useCallback(() => { setModalTrabajo(false); setEditTrabajo(null); }, []);

  const handleEditCampana = useCallback((c: PlanificacionCampana) => { setEditCampana(c); setModalCampana(true); }, []);
  const handleCloseCampana = useCallback(() => { setModalCampana(false); setEditCampana(null); }, []);

  const handleEditIncidencia = useCallback((i: TrabajoIncidencia) => { setEditIncidencia(i); setModalIncidencia(true); }, []);
  const handleCloseIncidencia = useCallback(() => { setModalIncidencia(false); setEditIncidencia(null); }, []);

  const handleCerrarTrabajo = useCallback((t: TrabajoRegistro) => { setTrabajoCierre(t); }, []);
  const handleCloseCierreTrabajo = useCallback(() => { setTrabajoCierre(null); }, []);

  const handleCloseCierre = useCallback(() => setCierreResultado(null), []);
  const handleVerManana = useCallback(() => {
    setCierreResultado(null);
    setFechaDia(d => addDays(d, 1));
    setTab('diaria');
  }, []);

  // ── PDF ───────────────────────────────────────────────────
  async function generarPDF() {
    const ref = new Date();
    const fs  = ref.toISOString().slice(0, 10);
    await generarPDFCorporativoBase({
      titulo: 'PLANIFICACIÓN DE TRABAJOS',
      subtitulo: 'Resumen planificación diaria, campaña e incidencias',
      fecha: ref,
      filename: `Planificacion_${fs}.pdf`,
      accentColor: PDF_COLORS.amber,
      firmaNombre: firmaPdf,
      bloques: [
        ctx => {
          pdfCorporateSection(ctx, `Trabajos del día ${fechaDia}`);
          if (trabajosDia.length === 0) {
            ctx.checkPage(8); ctx.doc.setFontSize(9); ctx.doc.setTextColor(100, 116, 139);
            ctx.doc.text('Sin trabajos.', PDF_MARGIN, ctx.y); ctx.y += 6; return;
          }
          pdfCorporateTable(ctx,
            ['PRIORIDAD', 'TIPO TRABAJO', 'FINCA', 'PERSONAL', 'ESTADO'],
            [22, 56, 38, 40, 26],
            trabajosDia.map(t => [
              t.prioridad ?? '—', t.tipo_trabajo, t.finca ?? '—',
              t.nombres_operarios ?? '—', t.estado_planificacion ?? '—',
            ]));
        },
        ctx => {
          pdfCorporateSection(ctx, 'Planificación campaña');
          if (campanas.length === 0) {
            ctx.checkPage(8); ctx.doc.setFontSize(9); ctx.doc.setTextColor(100, 116, 139);
            ctx.doc.text('Sin campañas.', PDF_MARGIN, ctx.y); ctx.y += 6; return;
          }
          pdfCorporateTable(ctx,
            ['FINCA', 'CULTIVO', 'PLANTACIÓN', 'COSECHA', 'ESTADO'],
            [36, 40, 30, 30, 46],
            campanas.map(c => [
              c.finca, c.cultivo,
              c.fecha_prevista_plantacion ?? '—', c.fecha_estimada_cosecha ?? '—', c.estado,
            ]));
        },
        ctx => {
          pdfCorporateSection(ctx, 'Incidencias');
          if (incidencias.length === 0) {
            ctx.checkPage(8); ctx.doc.setFontSize(9); ctx.doc.setTextColor(100, 116, 139);
            ctx.doc.text('Sin incidencias.', PDF_MARGIN, ctx.y); ctx.y += 6; return;
          }
          pdfCorporateTable(ctx,
            ['FECHA', 'FINCA', 'TÍTULO', 'ESTADO', 'URGENTE'],
            [24, 34, 76, 28, 20],
            incidencias.map(i => [
              i.fecha, i.finca ?? '—', i.titulo, i.estado, i.urgente ? 'Sí' : 'No',
            ]));
        },
      ],
    });
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'} flex flex-col`}>

      {/* HEADER */}
      <header className={`w-full ${isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white/90 border-slate-200'} border-b pl-14 pr-4 py-2 flex flex-col gap-2 max-md:items-stretch md:flex-row md:items-center md:gap-3 z-50`}>
        <div className="flex items-center gap-3 min-w-0">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-slate-400 hover:text-[#6d9b7d] transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[9px] font-black uppercase tracking-widest">Dashboard</span>
        </button>
        <span className="text-slate-600 hidden sm:inline">|</span>
        <Briefcase className="w-4 h-4 text-amber-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-wider leading-tight">Planificación de Trabajos</p>
          <p className="text-[8px] text-slate-500 leading-tight">Gestión y seguimiento de trabajos diarios</p>
        </div>
        </div>

        <div className="flex items-center gap-2 max-md:w-full md:ml-auto">
          {incUrgentes > 0 && (
            <button onClick={() => setTab('incidencias')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] font-black uppercase tracking-widest animate-pulse"
            >
              <AlertTriangle className="w-3 h-3" />{incUrgentes} urgente{incUrgentes > 1 ? 's' : ''}
            </button>
          )}
          <div className="relative" ref={pdfMenuRef}>
            <button type="button" onClick={() => setPdfMenuOpen(o => !o)} disabled={generandoPdf}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#6d9b7d]/20 bg-[#6d9b7d]/5 hover:bg-[#6d9b7d]/10 text-[#6d9b7d] text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {generandoPdf ? <span className="w-3 h-3 border-2 border-[#6d9b7d]/20 border-t-[#6d9b7d] rounded-full animate-spin" /> : null}
              PDF {pdfMenuOpen ? '▲' : '▼'}
            </button>
            {pdfMenuOpen && (
              <div className={`absolute right-0 top-full z-[70] mt-1 min-w-[200px] rounded-lg border shadow-lg py-1 ${isDark ? 'border-slate-600 bg-slate-900 text-slate-100 shadow-black/40' : 'border-slate-200 bg-white text-slate-800'}`}>
                <button type="button" disabled={generandoPdf} onClick={async () => { setPdfMenuOpen(false); setGenerandoPdf(true); try { await generarPDF(); } finally { setGenerandoPdf(false); } }}
                  className={`w-full px-3 py-2.5 text-left text-xs font-medium transition-colors disabled:opacity-50 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                >Informe completo</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 max-w-4xl mx-auto w-full">

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Planificados hoy', value: trabajosDia.length,  color: '#6d9b7d' },
            { label: 'Inc. abiertas',    value: incAbiertas,          color: incAbiertas > 0 ? '#ef4444' : '#34d399' },
            { label: 'Urgentes',         value: incUrgentes,          color: incUrgentes > 0 ? '#ef4444' : '#64748b' },
          ].map(k => (
            <div key={k.label} className={`${isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white border-slate-200'} border rounded-xl p-3 text-center`}>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
              <p className="text-2xl font-black" style={{ color: k.color }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* TABS PRINCIPALES */}
        <div className={`flex flex-wrap gap-1 mb-5 ${isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white border-slate-200'} border rounded-xl p-1`}>
          {([
            { id: 'diaria',      label: 'Planificación diaria', icon: Calendar },
            { id: 'campana',     label: 'Campaña',              icon: Leaf },
            { id: 'incidencias', label: 'Incidencias',          icon: AlertTriangle },
          ] as { id: TabPrincipal; label: string; icon: React.ElementType }[]).map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors relative flex items-center justify-center gap-1.5 ${
                  active ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />{t.label}
                {t.id === 'incidencias' && incAbiertas > 0 && (
                  <span className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-[8px] font-black text-white">{incAbiertas}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── TAB PLANIFICACIÓN DIARIA ── */}
        {tab === 'diaria' && (
          <>
            <PanelDia
              fecha={fechaDia}
            onPrev={handlePrevDia}
            onNext={handleNextDia}
              onCerrar={handleCerrarJornada}
              isDark={isDark}
            />

            <hr className="border-white/10 mb-4" />

            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {trabajosDia.length} trabajo{trabajosDia.length !== 1 ? 's' : ''} — {fmtFecha(fechaDia)}
              </p>
              <button
              onClick={() => { setEditTrabajo(null); setModalTrabajo(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6d9b7d]/10 border border-[#6d9b7d]/30 text-[#6d9b7d] text-[9px] font-black uppercase tracking-widest hover:bg-[#6d9b7d]/20 transition-colors"
              >
                <Plus className="w-3 h-3" />Nuevo trabajo
              </button>
            </div>

            {trabajosDia.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-black uppercase tracking-widest">Sin trabajos planificados</p>
                <p className="text-[10px] mt-1">Añade trabajos para este día</p>
              </div>
            ) : (
              <div className="space-y-2">
                {trabajosDia.map(t => (
                  <TarjetaTrabajoPlan
                    key={t.id}
                    t={t}
                    onEdit={handleEditTrabajo}
                    onCerrar={handleCerrarTrabajo}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── TAB CAMPAÑA ── */}
        {tab === 'campana' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{campanas.length} campañas</p>
              <button
              onClick={() => { setEditCampana(null); setModalCampana(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-[9px] font-black uppercase tracking-widest hover:bg-green-500/20 transition-colors"
              >
                <Plus className="w-3 h-3" />Nueva campaña
              </button>
            </div>
            {campanas.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Leaf className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-black uppercase tracking-widest">Sin campañas planificadas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {campanas.map(c => (
                <TarjetaCampana key={c.id} c={c} onEdit={handleEditCampana} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── TAB INCIDENCIAS ── */}
        {tab === 'incidencias' && (
          <>
            <div className="flex items-center justify-between mb-3">
              {/* Filtros */}
              <div className="flex gap-1 p-1 bg-slate-900/60 border border-white/10 rounded-lg">
                {(['todas', 'urgentes', 'no_urgentes'] as FiltroInc[]).map(f => (
                  <button key={f} onClick={() => setFiltroInc(f)}
                    className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-colors ${filtroInc === f ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-300'}`}
                  >{f.replace('_', ' ')}</button>
                ))}
              </div>
              <button
              onClick={() => { setEditIncidencia(null); setModalIncidencia(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-colors"
              >
                <Plus className="w-3 h-3" />Nueva
              </button>
            </div>

            {incFiltradas.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-black uppercase tracking-widest">Sin incidencias</p>
              </div>
            ) : (
              <div className="space-y-2">
                {incFiltradas.map(i => (
                <TarjetaIncidencia key={i.id} inc={i} onEdit={handleEditIncidencia} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* MODALES */}
      {modalTrabajo && (
        <ModalTrabajoPlan
          fecha={fechaDia}
          editData={editTrabajo}
        onClose={handleCloseTrabajo}
        />
      )}
      {modalCampana && (
        <ModalCampana
          editData={editCampana}
        onClose={handleCloseCampana}
        />
      )}
      {modalIncidencia && (
        <ModalIncidencia
          editData={editIncidencia}
        onClose={handleCloseIncidencia}
        />
      )}
      {cierreResultado && (
        <ModalCierreResultado
          resultado={cierreResultado}
        onClose={handleCloseCierre}
        onVerMañana={handleVerManana}
        />
      )}
      {trabajoCierre && (
        <ModalCierreTrabajo
          trabajo={trabajoCierre}
          onClose={handleCloseCierreTrabajo}
        />
      )}
    </div>
  );
}
