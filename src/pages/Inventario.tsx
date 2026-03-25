import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Warehouse, Tag, Package,
  Activity, Server, Wifi
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useUbicaciones, useTotalRegistros, useConteosUbicaciones } from '../hooks/useInventario';

export default function Inventario() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [now, setNow]             = useState(new Date());
  const navigate                  = useNavigate();
  const { theme }                 = useTheme();
  const { data: ubicaciones = [], isLoading }           = useUbicaciones();
  const { data: totalRegistros, isLoading: isLoadingTotal } = useTotalRegistros();
  const { data: conteos }                               = useConteosUbicaciones();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const isDark   = theme === 'dark';
  const horaStr  = now.toTimeString().slice(0, 8);
  const fechaStr = now.toLocaleDateString('es-ES', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'
  }).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white flex flex-col transition-colors duration-300">

      {/* ── BARRA SUPERIOR ───────────────────────────── */}
      <header className="w-full bg-white/90 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10 px-6 py-2 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-black text-green-500 dark:text-green-400 uppercase tracking-widest">
            Inventario Activos
          </span>
          <span className="text-[10px] text-slate-300 dark:text-slate-600 mx-2">|</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{fechaStr}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800/60 hover:border-[#38bdf8]/50 hover:text-[#38bdf8] transition-all text-slate-500 dark:text-slate-400"
          >
            <ArrowLeft className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase tracking-widest">Volver</span>
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
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">

        {/* LOGO + IDENTIDAD */}
        <div className="flex flex-col items-center mb-10 relative">
          <div className="absolute w-[600px] h-[300px] bg-[#38bdf8]/10 rounded-full blur-[120px] opacity-50 pointer-events-none" />
          <img
            src="/MARVIC_logo.png"
            className="w-full max-w-[480px] opacity-90 relative z-10"
            style={{
              filter: isDark
                ? 'brightness(0) invert(1) drop-shadow(0 0 30px rgba(56,189,248,0.3))'
                : 'drop-shadow(0 0 20px rgba(56,189,248,0.2))',
            }}
          />
          <div className="mt-4 h-px w-64 bg-gradient-to-r from-transparent via-[#38bdf8]/40 to-transparent" />
          <p className="mt-3 text-[10px] tracking-[0.5em] uppercase font-black text-slate-400 dark:text-slate-500">
            Inventario de Activos Físicos
          </p>
        </div>

        {/* KPIs GLOBALES */}
        <div className="grid grid-cols-3 gap-4 mb-10 w-full max-w-lg">
          {[
            { label: 'Ubicaciones', value: '6',  icon: Warehouse },
            { label: 'Categorías',  value: '7',  icon: Tag       },
            { label: 'Registros',   value: isLoadingTotal ? '…' : String(totalRegistros ?? 0), icon: Package },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-3 text-center shadow-sm dark:shadow-none"
            >
              <Icon className="w-4 h-4 text-[#38bdf8] mx-auto mb-1" />
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* GRID DE UBICACIONES */}
        <div className="w-full max-w-3xl">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
            <Warehouse className="w-3.5 h-3.5 text-[#38bdf8]" />
            Acceso directo por ubicación
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <span className="text-[11px] font-black text-[#38bdf8] uppercase tracking-widest animate-pulse">
                Cargando ubicaciones...
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ubicaciones.map((ub) => (
                <button
                  key={ub.id}
                  onMouseEnter={() => setHoveredId(ub.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => navigate(`/inventario/${ub.id}`)}
                  className={`text-left p-3 rounded-lg border transition-all duration-200 ${
                    hoveredId === ub.id
                      ? 'bg-[#38bdf8]/10 border-[#38bdf8]/50 shadow-[0_0_15px_rgba(56,189,248,0.1)]'
                      : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-sm dark:shadow-none'
                  }`}
                >
                  <p className={`text-[10px] font-black uppercase tracking-wide transition-colors leading-tight ${
                    hoveredId === ub.id ? 'text-[#38bdf8]' : 'text-slate-800 dark:text-white'
                  }`}>
                    {ub.nombre}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Tag className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500" />
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">7 categorías</span>
                  </div>
                  <div className={`mt-2 h-px transition-all ${
                    hoveredId === ub.id ? 'bg-[#38bdf8]/40' : 'bg-slate-200 dark:bg-white/5'
                  }`} />
                  <div className="flex items-center gap-1 mt-1.5">
                    {(() => {
                      const count = conteos?.get(ub.id) ?? 0;
                      return (
                        <>
                          <span className={`w-1.5 h-1.5 rounded-full ${count > 0 ? 'bg-green-400' : 'bg-slate-300 dark:bg-slate-600'}`} />
                          <span className="text-[8px] text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                            {count > 0 ? `${count} registro${count !== 1 ? 's' : ''}` : 'Sin registros'}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* ── BARRA INFERIOR DE ESTADO ─────────────────── */}
      <footer className="w-full bg-white/90 dark:bg-slate-900/80 border-t border-slate-200 dark:border-white/10 px-6 py-1.5 flex items-center gap-6">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Marvic 360 · Inventario
        </span>
        <span className="text-[10px] text-slate-300 dark:text-slate-600">|</span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          6 ubicaciones · 7 categorías
        </span>
        <span className="text-[10px] font-mono text-slate-300 dark:text-slate-600 ml-auto">{horaStr}</span>
      </footer>

    </div>
  );
}
