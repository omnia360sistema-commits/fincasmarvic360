import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, LayoutDashboard, History, FileText,
  Map as MapIcon, Download, CheckCircle2,
  Activity, Server, Wifi
} from 'lucide-react';

const FINCAS = [
  { nombre: 'LA CONCEPCION',            ruta: 'LA CONCEPCION',            ha: 28.37,  sectores: 24 },
  { nombre: 'LONSORDO',                 ruta: 'LONSORDO',                 ha: 10.54,  sectores: 16 },
  { nombre: 'FINCA COLLADOS',           ruta: 'FINCA COLLADOS',           ha: 46.06,  sectores: 18 },
  { nombre: 'FINCA BRAZO DE LA VIRGEN', ruta: 'FINCA BRAZO DE LA VIRGEN', ha: 7.08,   sectores: 4  },
  { nombre: 'FINCA LA BARDA',           ruta: 'FINCA LA BARDA',           ha: 74.70,  sectores: 28 },
  { nombre: 'FINCA LA NUEVA',           ruta: 'FINCA LA NUEVA',           ha: 15.66,  sectores: 13 },
  { nombre: 'FINCA MAYORAZGO',          ruta: 'FINCA MAYORAZGO',          ha: 29.53,  sectores: 16 },
];

export default function Dashboard() {
  const [showModal, setShowModal]       = useState(false);
  const [hoveredFinca, setHoveredFinca] = useState<string | null>(null);
  const [now, setNow]                   = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleDownload = () => {
    setShowModal(true);
    setTimeout(() => setShowModal(false), 3000);
  };

  const horaStr  = now.toTimeString().slice(0, 8);
  const fechaStr = now.toLocaleDateString('es-ES', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'
  }).toUpperCase();

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">

      {/* ── BARRA SUPERIOR ───────────────────────────── */}
      <header className="w-full bg-slate-900/80 border-b border-white/10 px-6 py-2 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Sistema Operativo</span>
          <span className="text-[10px] text-slate-600 mx-2">|</span>
          <span className="text-[10px] text-slate-400 font-mono">{fechaStr}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-green-400" />
            <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Online</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Server className="w-3 h-3 text-[#38bdf8]" />
            <span className="text-[10px] text-slate-400 font-mono">{horaStr}</span>
          </div>
        </div>
      </header>

      {/* ── CONTENIDO PRINCIPAL ───────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">

        {/* LOGO + IDENTIDAD */}
        <div className="flex flex-col items-center mb-10 relative">
          <div className="absolute w-[600px] h-[300px] bg-[#38bdf8]/10 rounded-full blur-[120px] opacity-50 pointer-events-none" />
          <img
            src="/MARVIC_logo.png"
            className="w-full max-w-[480px] brightness-0 invert opacity-90 relative z-10"
            style={{ filter: 'brightness(0) invert(1) drop-shadow(0 0 30px rgba(56,189,248,0.3))' }}
          />
          <div className="mt-4 h-px w-64 bg-gradient-to-r from-transparent via-[#38bdf8]/40 to-transparent" />
          <p className="mt-3 text-[10px] tracking-[0.5em] uppercase font-black text-slate-500">
            Panel de Control Operativo
          </p>
        </div>

        {/* KPIs GLOBALES */}
        <div className="grid grid-cols-3 gap-4 mb-10 w-full max-w-lg">
          {[
            { label: 'Fincas',    value: '7',      icon: MapIcon  },
            { label: 'Sectores',  value: '119',    icon: Activity },
            { label: 'Hectáreas', value: '211.94', icon: Server   },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="bg-slate-900/60 border border-white/10 rounded-lg px-4 py-3 text-center"
            >
              <Icon className="w-4 h-4 text-[#38bdf8] mx-auto mb-1" />
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
              <p className="text-xl font-black text-white mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* GRID DE FINCAS */}
        <div className="w-full max-w-3xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
            <MapIcon className="w-3.5 h-3.5 text-[#38bdf8]" />
            Acceso directo por finca
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {FINCAS.map(({ nombre, ruta, ha, sectores }) => (
              <button
                key={ruta}
                onMouseEnter={() => setHoveredFinca(nombre)}
                onMouseLeave={() => setHoveredFinca(null)}
                onClick={() => navigate(`/farm/${encodeURIComponent(ruta)}`)}
                className={`text-left p-3 rounded-lg border transition-all duration-200 ${
                  hoveredFinca === nombre
                    ? 'bg-[#38bdf8]/10 border-[#38bdf8]/50 shadow-[0_0_15px_rgba(56,189,248,0.1)]'
                    : 'bg-slate-900/50 border-white/10 hover:border-white/20'
                }`}
              >
                <p className={`text-[10px] font-black uppercase tracking-wide transition-colors ${
                  hoveredFinca === nombre ? 'text-[#38bdf8]' : 'text-white'
                }`}>
                  {nombre}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[9px] text-slate-500">{sectores} sect.</span>
                  <span className="text-[9px] text-slate-600">·</span>
                  <span className="text-[9px] text-slate-500">{ha} ha</span>
                </div>
                <div className={`mt-2 h-px transition-all ${
                  hoveredFinca === nombre
                    ? 'bg-[#38bdf8]/40'
                    : 'bg-white/5'
                }`} />
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  <span className="text-[8px] text-slate-600 uppercase tracking-widest">Vacía</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ACCIONES SECUNDARIAS */}
        <div className="mt-8 w-full max-w-3xl flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate('/estado-general')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-slate-900/50 hover:border-[#38bdf8]/30 hover:text-[#38bdf8] transition-all text-[10px] font-black uppercase tracking-widest text-slate-400"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Estado General
          </button>
          <button
            onClick={() => navigate('/historicos')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-slate-900/50 hover:border-[#38bdf8]/30 hover:text-[#38bdf8] transition-all text-[10px] font-black uppercase tracking-widest text-slate-400"
          >
            <History className="w-3.5 h-3.5" />
            Históricos
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#38bdf8]/20 bg-[#38bdf8]/5 hover:bg-[#38bdf8]/10 transition-all text-[10px] font-black uppercase tracking-widest text-[#38bdf8] ml-auto"
          >
            <FileText className="w-3.5 h-3.5" />
            Exportar PDF
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>

      </main>

      {/* ── BARRA INFERIOR DE ESTADO ─────────────────── */}
      <footer className="w-full bg-slate-900/80 border-t border-white/10 px-6 py-1.5 flex items-center gap-6">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Marvic 360 · v3.0
        </span>
        <span className="text-[10px] text-slate-600">|</span>
        <span className="text-[10px] text-slate-500">
          7 fincas · 119 sectores · 211.94 ha
        </span>
        <span className="text-[10px] font-mono text-slate-600 ml-auto">{horaStr}</span>
      </footer>

      {/* ── MODAL INFORMES ────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl">
          <div className="bg-slate-900 border border-white/10 rounded-xl p-8 text-center space-y-4 shadow-2xl">
            <img src="/MARVIC_logo.png" className="h-8 mx-auto brightness-0 invert opacity-80" />
            <CheckCircle2 className="w-10 h-10 text-[#38bdf8] mx-auto animate-bounce" />
            <h3 className="text-sm font-black uppercase tracking-widest">Generando PDF</h3>
            <p className="text-slate-500 text-xs">El reporte de Agrícola Marvic se está preparando...</p>
            <button
              onClick={() => setShowModal(false)}
              className="mt-2 text-[10px] text-slate-600 hover:text-slate-400 uppercase tracking-widest"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}