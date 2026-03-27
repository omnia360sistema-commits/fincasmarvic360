import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Map as MapIcon, Package, Briefcase, Truck, Tractor,
  GitBranch, Box, ClipboardCheck, ClipboardList, Users,
  LayoutDashboard, History, FileText, Download,
  Activity, Server, Wifi, Sun, Moon, CheckCircle2,
  AlertTriangle, ChevronRight, Construction,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useTheme } from '../context/ThemeContext';

const FINCAS_NOMBRES = [
  'LA CONCEPCION', 'LONSORDO', 'FINCA COLLADOS',
  'FINCA BRAZO DE LA VIRGEN', 'FINCA LA BARDA',
  'FINCA LA NUEVA', 'FINCA MAYORAZGO',
];

// ── Módulos principales ──────────────────────────────────────
interface Modulo {
  id:          string;
  label:       string;
  sublabel:    string;
  icon:        React.ElementType;
  ruta?:       string;
  wip?:        boolean;
  accentColor: string;
}

const MODULOS: Modulo[] = [
  {
    id: 'campo', label: 'CAMPO', sublabel: 'Fincas · Sectores · GeoMap',
    icon: MapIcon, ruta: '/', accentColor: '#22c55e',
  },
  {
    id: 'inventario', label: 'INVENTARIO', sublabel: 'Activos · Stock · Materiales',
    icon: Package, ruta: '/inventario', accentColor: '#38bdf8',
  },
  {
    id: 'trabajos', label: 'TRABAJOS', sublabel: 'M.O. · Logística · Maquinaria',
    icon: Briefcase, ruta: '/trabajos', accentColor: '#f59e0b',
  },
  {
    id: 'logistica', label: 'LOGÍSTICA', sublabel: 'Camiones · Conductores · Rutas',
    icon: Truck, ruta: '/logistica', accentColor: '#a78bfa',
  },
  {
    id: 'maquinaria', label: 'MAQUINARIA', sublabel: 'Tractores · Aperos · Usos',
    icon: Tractor, ruta: '/maquinaria', accentColor: '#fb923c',
  },
  {
    id: 'personal', label: 'PERSONAL', sublabel: 'Operarios · Encargados · Conductores',
    icon: Users, ruta: '/personal', accentColor: '#e879f9',
  },
  {
    id: 'parte-diario', label: 'PARTE DIARIO', sublabel: 'Registros diarios · Campo · Actividad',
    icon: ClipboardList, ruta: '/parte-diario', accentColor: '#4ade80',
  },
  {
    id: 'trazabilidad', label: 'TRAZABILIDAD', sublabel: 'Semilla → Cosecha → Camión',
    icon: GitBranch, wip: true, accentColor: '#34d399',
  },
  {
    id: 'materiales', label: 'MATERIALES', sublabel: 'Fitosanitarios · Riego · Plástico',
    icon: Box, wip: true, accentColor: '#60a5fa',
  },
  {
    id: 'auditoria', label: 'AUDITORÍA', sublabel: 'Certificaciones · Trazas · Logs',
    icon: ClipboardCheck, wip: true, accentColor: '#f472b6',
  },
];

export default function Dashboard() {
  const [now, setNow]           = useState(new Date());
  const [wipModal, setWipModal] = useState<string | null>(null);
  const navigate                = useNavigate();
  const { theme, toggleTheme }  = useTheme();
  const isDark                  = theme === 'dark';

  // KPIs globales
  const { data: stats, isLoading } = useQuery({
    queryKey: ['parcels_stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parcels')
        .select('farm, area_hectares')
        .in('farm', FINCAS_NOMBRES);
      if (error) throw error;
      const fincas    = new Set((data ?? []).map(p => p.farm)).size;
      const sectores  = (data ?? []).length;
      const hectareas = (data ?? []).reduce((a, p) => a + (p.area_hectares ?? 0), 0);
      return { fincas, sectores, hectareas: hectareas.toFixed(2) };
    },
    staleTime: 300000,
  });

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const horaStr  = now.toTimeString().slice(0, 8);
  const fechaStr = now.toLocaleDateString('es-ES', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
  }).toUpperCase();

  const handleModulo = (m: Modulo) => {
    if (m.wip) { setWipModal(m.label); return; }
    if (m.ruta) navigate(m.ruta);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white flex flex-col transition-colors duration-300">

      {/* ── BARRA SUPERIOR ───────────────────────────── */}
      <header className="w-full bg-white/90 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10 px-6 py-2 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-black text-green-500 dark:text-green-400 uppercase tracking-widest">Sistema Operativo</span>
          <span className="text-[10px] text-slate-300 dark:text-slate-600 mx-2">|</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{fechaStr}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800/60 hover:border-[#38bdf8]/50 hover:text-[#38bdf8] transition-all text-slate-500 dark:text-slate-400"
          >
            {isDark
              ? <><Sun className="w-3 h-3" /><span className="text-[9px] font-black uppercase tracking-widest">Claro</span></>
              : <><Moon className="w-3 h-3" /><span className="text-[9px] font-black uppercase tracking-widest">Oscuro</span></>
            }
          </button>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-green-400" />
            <span className="text-[10px] text-green-500 dark:text-green-400 font-bold uppercase tracking-widest">Online</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Server className="w-3 h-3 text-[#38bdf8]" />
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{horaStr}</span>
          </div>
        </div>
      </header>

      {/* ── CONTENIDO PRINCIPAL ───────────────────────── */}
      <main className="flex-1 flex flex-col items-center px-6 py-8">

        {/* LOGO */}
        <div className="flex flex-col items-center mb-8 relative">
          <div className="absolute w-[500px] h-[250px] bg-[#38bdf8]/10 rounded-full blur-[120px] opacity-40 pointer-events-none" />
          <img
            src="/MARVIC_logo.png"
            className="w-full max-w-[360px] opacity-90 relative z-10"
            style={{
              filter: isDark
                ? 'brightness(0) invert(1) drop-shadow(0 0 24px rgba(56,189,248,0.3))'
                : 'drop-shadow(0 0 16px rgba(56,189,248,0.2))',
            }}
          />
          <div className="mt-3 h-px w-56 bg-gradient-to-r from-transparent via-[#38bdf8]/40 to-transparent" />
          <p className="mt-2 text-[10px] tracking-[0.5em] uppercase font-black text-slate-400 dark:text-slate-500">
            Panel de Control Operativo
          </p>
        </div>

        {/* KPIs GLOBALES */}
        <div className="grid grid-cols-3 gap-3 mb-8 w-full max-w-sm">
          {[
            { label: 'Fincas',    value: isLoading ? '…' : String(stats?.fincas    ?? 7),        icon: MapIcon  },
            { label: 'Sectores',  value: isLoading ? '…' : String(stats?.sectores  ?? 119),      icon: Activity },
            { label: 'Hectáreas', value: isLoading ? '…' : String(stats?.hectareas ?? '211.94'), icon: Server   },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-center shadow-sm dark:shadow-none"
            >
              <Icon className="w-3.5 h-3.5 text-[#38bdf8] mx-auto mb-1" />
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* GRID 9 MÓDULOS (3×3) */}
        <div className="w-full max-w-3xl">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-3">
            Módulos del sistema
          </p>
          <div className="grid grid-cols-3 gap-3">
            {MODULOS.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => handleModulo(m)}
                  className={`group relative text-left p-4 rounded-xl border transition-all duration-200 ${
                    m.wip
                      ? 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-white/5 opacity-60 hover:opacity-80 cursor-default'
                      : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10 hover:shadow-md dark:hover:shadow-none hover:scale-[1.02]'
                  }`}
                  style={m.wip ? {} : {
                    ['--accent' as string]: m.accentColor,
                  }}
                >
                  {/* Glow accent al hover */}
                  {!m.wip && (
                    <div
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      style={{ boxShadow: `inset 0 0 0 1px ${m.accentColor}40` }}
                    />
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: m.accentColor + '18' }}
                    >
                      <Icon className="w-4 h-4" style={{ color: m.accentColor }} />
                    </div>
                    {m.wip
                      ? <Construction className="w-3 h-3 text-slate-400 dark:text-slate-600" />
                      : <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
                    }
                  </div>

                  <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-wide leading-tight">
                    {m.label}
                  </p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                    {m.sublabel}
                  </p>

                  {m.wip && (
                    <span className="mt-2 inline-block text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-white/10 rounded px-1.5 py-0.5">
                      En desarrollo
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3 BOTONES SECUNDARIOS */}
        <div className="mt-6 w-full max-w-3xl flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setWipModal('Estado General')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-white/20 transition-all text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 shadow-sm dark:shadow-none"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Estado General
          </button>
          <button
            onClick={() => setWipModal('Históricos')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-white/20 transition-all text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 shadow-sm dark:shadow-none"
          >
            <History className="w-3.5 h-3.5" />
            Históricos
          </button>
          <button
            onClick={() => setWipModal('Exportar PDF')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#38bdf8]/20 bg-[#38bdf8]/5 hover:bg-[#38bdf8]/10 hover:border-[#38bdf8]/40 transition-all text-[10px] font-black uppercase tracking-widest text-[#38bdf8] ml-auto"
          >
            <FileText className="w-3.5 h-3.5" />
            Exportar PDF
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>

      </main>

      {/* ── BARRA INFERIOR ───────────────────────────── */}
      <footer className="w-full bg-white/90 dark:bg-slate-900/80 border-t border-slate-200 dark:border-white/10 px-6 py-1.5 flex items-center gap-6">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Marvic 360 · v4.0
        </span>
        <span className="text-[10px] text-slate-300 dark:text-slate-600">|</span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          {stats
            ? `${stats.fincas} fincas · ${stats.sectores} sectores · ${stats.hectareas} ha`
            : '7 fincas · 119 sectores · 211.94 ha'}
        </span>
        <span className="text-[10px] font-mono text-slate-300 dark:text-slate-600 ml-auto">{horaStr}</span>
      </footer>

      {/* ── MODAL WIP ─────────────────────────────────── */}
      {wipModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-xl"
          onClick={() => setWipModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-8 text-center space-y-4 shadow-2xl max-w-sm w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            <img
              src="/MARVIC_logo.png"
              className="h-7 mx-auto opacity-70"
              style={{ filter: isDark ? 'brightness(0) invert(1)' : 'none' }}
            />
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
              {wipModal}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Módulo en desarrollo. Disponible en próximas versiones.
            </p>
            <button
              onClick={() => setWipModal(null)}
              className="mt-2 text-[10px] font-black text-[#38bdf8] hover:text-[#38bdf8]/70 uppercase tracking-widest"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
