import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, X, LayoutDashboard, 
  History, FileText, Map as MapIcon, 
  Download, Sun, Moon, CheckCircle2 
} from 'lucide-react';

// Nombre corregido: Mudamiento
const FINCAS = ['Mudamiento', 'Callosa-Catral', 'San Isidro', 'Cieza'];

export default function Dashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleDownload = () => {
    setShowModal(true);
    setTimeout(() => setShowModal(false), 3000);
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-700 ${isDark ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* HEADER */}
      <header className="w-full p-8 flex justify-between items-center z-50">
        <button 
          onClick={() => setIsMenuOpen(true)}
          className={`p-3 rounded-2xl border transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-[#38bdf8] shadow-[0_0_20px_rgba(56,189,248,0.15)]' : 'bg-white border-slate-200 shadow-md text-slate-600'}`}
        >
          <Menu className="w-8 h-8" />
        </button>

        <button 
          onClick={() => setIsDark(!isDark)}
          className={`relative w-16 h-8 rounded-full border transition-all duration-500 flex items-center px-1 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-200 border-slate-300'}`}
        >
          <div className={`w-6 h-6 rounded-full transition-all duration-500 flex items-center justify-center shadow-lg ${isDark ? 'translate-x-8 bg-[#38bdf8]' : 'translate-x-0 bg-white'}`}>
            {isDark ? <Moon className="w-4 h-4 text-slate-900" /> : <Sun className="w-4 h-4 text-orange-500" />}
          </div>
        </button>
      </header>

      {/* LOGO CENTRAL CON EFECTO GLOW REFORZADO */}
      <main className="flex-1 flex flex-col items-center justify-center -mt-20 p-6 overflow-visible">
        <div className="relative flex flex-col items-center w-full overflow-visible">
          {isDark && (
            <div className={`absolute w-[700px] h-[450px] bg-[#38bdf8]/20 rounded-full blur-[160px] transition-all duration-1000 ${hoveredItem ? 'opacity-80 scale-110' : 'opacity-40'}`}></div>
          )}
          <img 
            src="/MARVIC_logo.png" 
            style={{
              filter: isDark ? `drop-shadow(0 0 35px rgba(56, 189, 248, ${hoveredItem ? '0.9' : '0.4'}))` : 'none'
            }}
            className={`w-full max-w-[750px] transition-all duration-700 animate-pulse-slow ${isDark ? 'brightness-0 invert' : ''} ${hoveredItem ? 'scale-105' : 'scale-100'}`}
          />
          <div className={`mt-12 h-[1px] w-96 ${isDark ? 'bg-gradient-to-r from-transparent via-[#38bdf8]/60 to-transparent' : 'bg-gradient-to-r from-transparent via-slate-300 to-transparent'}`}></div>
          <p className="mt-8 text-[12px] tracking-[0.6em] uppercase font-black opacity-60">
            {hoveredItem ? `Acceso: ${hoveredItem}` : 'Panel de Control Operativo'}
          </p>
        </div>
      </main>

      {/* MENU LATERAL CON BOTONES ACTIVOS */}
      <div className={`fixed inset-y-0 left-0 w-80 z-[100] transform transition-transform duration-500 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} ${isDark ? 'bg-[#020617] border-r border-slate-800' : 'bg-white border-r border-slate-200'}`}>
        <div className="h-full p-8 flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#38bdf8]">Menú Principal</span>
            <button onClick={() => setIsMenuOpen(false)}><X className="w-7 h-7 text-slate-500" /></button>
          </div>

          <nav className="flex-1 space-y-8 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[#38bdf8] font-black text-xs uppercase tracking-widest"><MapIcon className="w-5 h-5" /> Fincas</div>
              {FINCAS.map(finca => (
                <button 
                  key={finca} 
                  onMouseEnter={() => setHoveredItem(finca)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => navigate(`/farm/${finca.toLowerCase()}`)}
                  className={`w-full text-left p-4 rounded-xl border text-[11px] font-bold uppercase tracking-widest transition-all ${isDark ? 'bg-slate-900/50 border-slate-800 hover:border-[#38bdf8] hover:text-[#38bdf8]' : 'bg-slate-50 hover:border-slate-300'}`}
                >
                  {finca}
                </button>
              ))}
            </div>

            <button onClick={() => navigate('/estado-general')} className="w-full flex items-center gap-4 text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 hover:text-[#38bdf8] transition-all"><LayoutDashboard className="w-5 h-5" /> Estado General</button>
            <button onClick={() => navigate('/historicos')} className="w-full flex items-center gap-4 text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 hover:text-[#38bdf8] transition-all"><History className="w-5 h-5" /> Históricos</button>
            
            <div className="pt-6 border-t border-slate-800/50">
              <button onClick={handleDownload} className={`w-full p-5 rounded-2xl border flex items-center justify-between group transition-all ${isDark ? 'bg-[#38bdf8]/5 border-[#38bdf8]/20 hover:bg-[#38bdf8]/10' : 'bg-slate-100'}`}>
                <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-[#38bdf8]" /> <div className="text-left"><p className="text-[10px] font-black uppercase text-[#38bdf8]">Informes</p><p className="text-[9px] text-slate-500 font-bold uppercase">Exportar PDF</p></div></div>
                <Download className="w-5 h-5 text-[#38bdf8]" />
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* MODAL DE INFORMES */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl">
          <div className={`p-10 rounded-3xl border text-center space-y-6 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white shadow-2xl'}`}>
            <img src="/MARVIC_logo.png" className={`h-10 mx-auto ${isDark ? 'brightness-0 invert' : ''}`} />
            <CheckCircle2 className="w-12 h-12 text-[#38bdf8] mx-auto animate-bounce" />
            <h3 className="text-xl font-black uppercase tracking-widest">Generando PDF</h3>
            <p className="text-slate-500 text-sm">El reporte de Agrícola Marvic se está preparando...</p>
          </div>
        </div>
      )}

      {isMenuOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]" onClick={() => setIsMenuOpen(false)} />}
    </div>
  );
}