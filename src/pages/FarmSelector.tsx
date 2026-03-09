import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Building2, User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export default function FarmSelector() {
  const [isDark, setIsDark] = useState(true);
  const navigate = useNavigate();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className={`min-h-screen transition-all duration-700 flex flex-col items-center justify-center p-4 ${isDark ? 'bg-[#020617] text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      
      {/* BOTÓN DE TEMA (Superior Izquierda) */}
      <div className="fixed top-8 left-8 z-50">
        <button 
          onClick={toggleTheme}
          className={`relative w-14 h-7 rounded-full border transition-all duration-500 flex items-center px-1 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300 shadow-inner'}`}
        >
          <div className={`absolute w-5 h-5 rounded-full transition-all duration-500 flex items-center justify-center shadow-lg ${isDark ? 'translate-x-7 bg-[#38bdf8]' : 'translate-x-0 bg-slate-200'}`}>
            {isDark ? <Moon className="w-3 h-3 text-slate-900" /> : <Sun className="w-3 h-3 text-orange-500" />}
          </div>
        </button>
      </div>

      <header className="flex flex-col items-center mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">Agro<span className="text-[#38bdf8]">Gestión</span></h1>
        <p className="text-[11px] tracking-[3px] font-bold uppercase opacity-70 mt-3 text-[#38bdf8]">
          Inteligencia Agrícola Circular
        </p>
      </header>

      <main className={`relative w-full max-w-[400px] rounded-[2rem] p-1 ${isDark ? 'bg-gradient-to-b from-slate-800 to-transparent' : 'bg-gradient-to-b from-slate-200 to-transparent'}`}>
        <div className={`w-full h-full rounded-[1.9rem] p-8 backdrop-blur-xl ${isDark ? 'bg-slate-900/90' : 'bg-white/90 shadow-2xl'}`}>
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-50 ml-1">Empresa</label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#38bdf8]" />
                <input type="text" required placeholder="Nombre de la empresa" className={`w-full pl-12 pr-4 py-4 rounded-2xl text-sm transition-all border outline-none ${isDark ? 'bg-slate-950/50 border-slate-800 focus:border-[#38bdf8]' : 'bg-slate-50 border-slate-200 focus:border-[#38bdf8]'}`} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-50 ml-1">Usuario</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#38bdf8]" />
                <input type="text" required placeholder="Nombre de usuario" className={`w-full pl-12 pr-4 py-4 rounded-2xl text-sm transition-all border outline-none ${isDark ? 'bg-slate-950/50 border-slate-800 focus:border-[#38bdf8]' : 'bg-slate-50 border-slate-200 focus:border-[#38bdf8]'}`} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-50 ml-1">Clave Segura</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#38bdf8]" />
                <input type="password" required placeholder="••••••••" className={`w-full pl-12 pr-4 py-4 rounded-2xl text-sm transition-all border outline-none ${isDark ? 'bg-slate-950/50 border-slate-800 focus:border-[#38bdf8]' : 'bg-slate-50 border-slate-200 focus:border-[#38bdf8]'}`} />
              </div>
            </div>
            <button type="submit" className="w-full mt-4 bg-[#38bdf8] hover:bg-[#0ea5e9] text-slate-950 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg">
              AUTENTIFICAR <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}