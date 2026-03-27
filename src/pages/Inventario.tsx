import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Warehouse, Tag, Package,
  Activity, Server, Wifi, FileText, Filter,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../integrations/supabase/client';
import {
  useUbicaciones, useTotalRegistros,
  useConteosUbicaciones, useCategorias,
} from '../hooks/useInventario';

// ─── Helpers PDF ─────────────────────────────────────────────────────────────

async function loadImageInv(url: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const res  = await fetch(url)
    const blob = await res.blob()
    return await new Promise(resolve => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width  = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        const data = canvas.toDataURL('image/jpeg', 0.8)
        URL.revokeObjectURL(img.src)
        resolve({ data, w: img.naturalWidth, h: img.naturalHeight })
      }
      img.onerror = () => resolve(null)
      img.src = URL.createObjectURL(blob)
    })
  } catch { return null }
}

// ─── Tipo para registros con relaciones ──────────────────────────────────────

type RegConRel = {
  id: string
  ubicacion_id: string
  categoria_id: string
  cantidad: number
  unidad: string
  descripcion: string | null
  foto_url: string | null
  foto_url_2: string | null
  notas: string | null
  created_at: string
  precio_unitario: number | null
  responsable: string | null
  inventario_ubicaciones: { nombre: string } | null
  inventario_categorias:  { nombre: string } | null
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function Inventario() {
  const [hoveredId,     setHoveredId]     = useState<string | null>(null);
  const [now,           setNow]           = useState(new Date());
  const [showModal,     setShowModal]     = useState(false);
  const [genPdf,        setGenPdf]        = useState(false);
  const [selUbics,      setSelUbics]      = useState<Set<string>>(new Set());
  const [selCats,       setSelCats]       = useState<Set<string>>(new Set());
  const [fechaDesde,    setFechaDesde]    = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [fechaHasta,    setFechaHasta]    = useState(() => new Date().toISOString().split('T')[0]);

  const navigate                = useNavigate();
  const { theme }               = useTheme();
  const { data: ubicaciones = [],  isLoading }          = useUbicaciones();
  const { data: categorias  = [] }                       = useCategorias();
  const { data: totalRegistros, isLoading: isLoadingTotal } = useTotalRegistros();
  const { data: conteos }                                = useConteosUbicaciones();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const isDark   = theme === 'dark';
  const horaStr  = now.toTimeString().slice(0, 8);
  const fechaStr = now.toLocaleDateString('es-ES', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'
  }).toUpperCase();

  // Abrir modal pre-seleccionando todo
  function abrirModal() {
    setSelUbics(new Set(ubicaciones.map(u => u.id)));
    setSelCats(new Set(categorias.map(c => c.id)));
    setShowModal(true);
  }

  function toggleUbic(id: string) {
    setSelUbics(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }
  function toggleCat(id: string) {
    setSelCats(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  // ── GENERACIÓN PDF GLOBAL ──────────────────────────────────────────────────
  async function generarPDFGlobal() {
    if (selUbics.size === 0 || selCats.size === 0) return;
    setGenPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc    = new jsPDF();
      const margin = 15;
      const maxW   = 180;
      const lh     = 6;
      let y        = 25;

      // Cargar logo
      const logo = await loadImageInv('/MARVIC_logo.png');

      function addLogoToPage() {
        if (!logo) return;
        const lw  = 38;
        const lh2 = lw * (logo.h / logo.w);
        doc.addImage(logo.data, 'JPEG', 210 - margin - lw, 6, lw, lh2);
      }

      const checkPage = (needed = 10) => {
        if (y + needed > 272) {
          doc.addPage();
          y = 25;
          addLogoToPage();
        }
      };

      const writeLine = (text: string, bold = false, size = 9) => {
        checkPage();
        doc.setFontSize(size);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        const lines = doc.splitTextToSize(text, maxW) as string[];
        doc.text(lines, margin, y);
        y += lines.length * lh;
      };

      const separator = () => {
        checkPage(4);
        doc.setDrawColor(160);
        doc.line(margin, y, margin + maxW, y);
        y += lh;
      };

      const addPhoto = async (url: string | null) => {
        if (!url) return;
        const img = await loadImageInv(url);
        if (!img) return;
        writeLine('Foto adjunta:');
        const imgW = 80;
        const imgH = imgW * (img.h / img.w);
        checkPage(imgH + 6);
        doc.addImage(img.data, 'JPEG', margin, y, imgW, Math.min(imgH, 100));
        y += Math.min(imgH, 100) + lh;
      };

      // ── Cabecera primera página ──
      addLogoToPage();
      writeLine('INFORME GLOBAL DE INVENTARIO — AGRÍCOLA MARVIC 360', true, 13);
      y += 2;
      writeLine(`Período: ${fechaDesde} → ${fechaHasta}`);
      writeLine(`Ubicaciones seleccionadas: ${selUbics.size} de ${ubicaciones.length}`);
      writeLine(`Categorías seleccionadas: ${selCats.size} de ${categorias.length}`);
      writeLine(`Generado el: ${new Date().toLocaleString('es-ES')}`);
      y += 4;
      separator();

      // ── Consultar registros ──
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: registros, error } = await (supabase as any)
        .from('inventario_registros')
        .select('*, inventario_ubicaciones(nombre), inventario_categorias(nombre)')
        .in('ubicacion_id', Array.from(selUbics))
        .in('categoria_id', Array.from(selCats))
        .gte('created_at', fechaDesde + 'T00:00:00')
        .lte('created_at', fechaHasta + 'T23:59:59')
        .order('ubicacion_id')
        .order('categoria_id')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows: RegConRel[] = registros ?? [];

      if (rows.length === 0) {
        writeLine('Sin registros para el período y filtros seleccionados.', false, 10);
      } else {
        // Agrupar por ubicación, luego por categoría
        const porUbic = new Map<string, RegConRel[]>();
        for (const r of rows) {
          const key = r.ubicacion_id;
          if (!porUbic.has(key)) porUbic.set(key, []);
          porUbic.get(key)!.push(r);
        }

        for (const [ubicId, regsUbic] of porUbic) {
          const nombreUbic = regsUbic[0]?.inventario_ubicaciones?.nombre ?? ubicId;
          checkPage(16);
          writeLine(`UBICACIÓN: ${nombreUbic.toUpperCase()}`, true, 11);
          y += 2;

          // Agrupar por categoría dentro de la ubicación
          const porCat = new Map<string, RegConRel[]>();
          for (const r of regsUbic) {
            const key = r.categoria_id;
            if (!porCat.has(key)) porCat.set(key, []);
            porCat.get(key)!.push(r);
          }

          for (const [, regsCat] of porCat) {
            const nombreCat = regsCat[0]?.inventario_categorias?.nombre ?? '—';
            checkPage(12);
            writeLine(`Categoría: ${nombreCat} (${regsCat.length} registro${regsCat.length !== 1 ? 's' : ''})`, true, 9);
            y += 1;

            for (const r of regsCat) {
              checkPage(12);
              const fecha = new Date(r.created_at).toLocaleDateString('es-ES');
              const hora  = new Date(r.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
              writeLine(`  ${fecha} ${hora}  ·  ${r.cantidad} ${r.unidad}${r.descripcion ? `  ·  ${r.descripcion}` : ''}`);
              if (r.precio_unitario) writeLine(`  Precio unitario: ${r.precio_unitario.toFixed(2)} €`);
              if (r.responsable)     writeLine(`  Responsable: ${r.responsable}`);
              if (r.notas)           writeLine(`  Notas: ${r.notas}`);
              await addPhoto(r.foto_url);
              await addPhoto(r.foto_url_2);
              y += 1;
            }
            y += 2;
          }

          separator();
        }

        // Resumen final
        checkPage(12);
        writeLine(`Total registros incluidos: ${rows.length}`, true);
      }

      doc.save(`Inventario_Global_${fechaDesde}_${fechaHasta}.pdf`);
      setShowModal(false);
    } finally {
      setGenPdf(false);
    }
  }

  // ── RENDER ────────────────────────────────────────────────────────────────

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
        <div className="flex items-center gap-3">
          <button
            onClick={abrirModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#38bdf8]/30 bg-[#38bdf8]/5 hover:bg-[#38bdf8]/10 text-[#38bdf8] transition-all"
          >
            <FileText className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase tracking-widest">Informe Global</span>
          </button>
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

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL — INFORME GLOBAL                                    */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* Cabecera modal */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                  Informe Global de Inventario
                </span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl leading-none"
              >×</button>
            </div>

            <div className="p-5 space-y-5">

              {/* Período */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                  Período
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Desde</label>
                    <input
                      type="date"
                      value={fechaDesde}
                      onChange={e => setFechaDesde(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-[#38bdf8]/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">Hasta</label>
                    <input
                      type="date"
                      value={fechaHasta}
                      onChange={e => setFechaHasta(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-[#38bdf8]/50 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Ubicaciones */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Ubicaciones ({selUbics.size}/{ubicaciones.length})
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelUbics(new Set(ubicaciones.map(u => u.id)))}
                      className="text-[9px] text-[#38bdf8] hover:underline font-bold uppercase"
                    >Todas</button>
                    <button
                      onClick={() => setSelUbics(new Set())}
                      className="text-[9px] text-slate-400 hover:underline uppercase"
                    >Ninguna</button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {ubicaciones.map(u => (
                    <label key={u.id} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selUbics.has(u.id)}
                        onChange={() => toggleUbic(u.id)}
                        className="w-3.5 h-3.5 accent-sky-400"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {u.nombre}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Categorías */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Categorías ({selCats.size}/{categorias.length})
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelCats(new Set(categorias.map(c => c.id)))}
                      className="text-[9px] text-[#38bdf8] hover:underline font-bold uppercase"
                    >Todas</button>
                    <button
                      onClick={() => setSelCats(new Set())}
                      className="text-[9px] text-slate-400 hover:underline uppercase"
                    >Ninguna</button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {categorias.map(c => (
                    <label key={c.id} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selCats.has(c.id)}
                        onChange={() => toggleCat(c.id)}
                        className="w-3.5 h-3.5 accent-sky-400"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {c.nombre}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-sm hover:border-slate-300 dark:hover:border-white/20 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={generarPDFGlobal}
                  disabled={genPdf || selUbics.size === 0 || selCats.size === 0}
                  className="flex-1 py-2.5 rounded-lg bg-[#38bdf8] text-[#020617] text-sm font-black hover:bg-sky-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {genPdf
                    ? <span className="w-3.5 h-3.5 border-2 border-[#020617]/20 border-t-[#020617] rounded-full animate-spin" />
                    : <FileText className="w-3.5 h-3.5" />
                  }
                  {genPdf ? 'Generando…' : 'Generar PDF'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
