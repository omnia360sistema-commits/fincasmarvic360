import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard_data'],
    queryFn: async () => {
      const hoy = new Date();
      const hoyStr = hoy.toISOString().split('T')[0];

      const alertasCriticas: Array<{ id: string; titulo: string; modulo: string }> = [];

      const { data: trItv } = await supabase.from('maquinaria_tractores').select('matricula, fecha_proxima_itv').eq('activo', true);
      const { data: cmItv } = await supabase.from('camiones').select('matricula, fecha_proxima_itv').eq('activo', true);
      const { data: incidencias } = await supabase.from('trabajos_incidencias').select('id, titulo, urgente').in('estado', ['abierta', 'en_proceso']);

      for (const t of trItv || []) {
        if (!t.fecha_proxima_itv) continue;
        const diff = (new Date(t.fecha_proxima_itv).getTime() - hoy.getTime()) / 86400000;
        if (diff < 0) {
          alertasCriticas.push({ id: `tr-${t.matricula}`, titulo: `ITV Vencida: ${t.matricula}`, modulo: 'MAQUINARIA' });
        }
      }
      for (const c of cmItv || []) {
        if (!c.fecha_proxima_itv) continue;
        const diff = (new Date(c.fecha_proxima_itv).getTime() - hoy.getTime()) / 86400000;
        if (diff < 0) {
          alertasCriticas.push({ id: `cm-${c.matricula}`, titulo: `ITV Vencida: ${c.matricula}`, modulo: 'LOGÍSTICA' });
        }
      }
      for (const i of incidencias || []) {
        if (i.urgente) alertasCriticas.push({ id: i.id, titulo: i.titulo, modulo: 'TRABAJOS' });
      }

      return { alertasCriticas: alertasCriticas.slice(0, 5) };
    },
    refetchInterval: 60000,
  });
}

const FINCAS_COORDENADAS = [
  { nombre: 'FINCA LA BARDA', lat: 38.1, lon: -0.9 },
];

interface WeatherData {
  current?: { temperature_2m?: number; precipitation?: number };
}

function useWeather(lat: number, lon: number) {
  return useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: async (): Promise<WeatherData | null> => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation&timezone=Europe%2FMadrid`
        );
        if (!res.ok) return null;
        return (await res.json()) as WeatherData;
      } catch (e) {
        console.warn('Weather API fallida (offline/error):', e);
        return null;
      }
    },
    retry: false,
    refetchInterval: 300000,
  });
}

const ACCESOS: { label: string; ruta: string }[] = [
  { label: 'Registrar trabajo en campo', ruta: '/parte-diario?bloque=B' },
  { label: 'Registrar incidencia', ruta: '/trabajos?tab=incidencias' },
  { label: 'Movimiento de personal', ruta: '/personal' },
  { label: 'Maquinaria activa', ruta: '/maquinaria?tab=uso' },
  { label: 'Logística y viajes', ruta: '/logistica?tab=viajes' },
  { label: 'Parte diario de hoy', ruta: '/parte-diario' },
  { label: 'Presencia', ruta: '/presencia' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const { user } = useAuth();
  const { data } = useDashboardData();
  const fincaClima = FINCAS_COORDENADAS[0];
  const { data: weather } = useWeather(fincaClima.lat, fincaClima.lon);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fechaHoy = now.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const horaActual = now.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const datosMeteo =
    weather?.current != null
      ? {
          finca: fincaClima.nombre,
          condicion: (weather.current.precipitation ?? 0) > 0 ? 'Precipitación' : 'Despejado',
          temperatura: Math.round(weather.current.temperature_2m ?? 0),
        }
      : null;

  const alertas = data?.alertasCriticas ?? [];
  const hayAlertasUrgentes = alertas.length > 0;
  const textoAlerta = alertas.map(a => a.titulo).join(' · ');

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--marvic-fondo-oscuro,#020617)] text-white flex flex-col">
      <header className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
        <img src="/MARVIC_logo.png" alt="Agrícola Marvic" className="h-8 object-contain brightness-0 invert opacity-90" draggable={false} />
        <div className="text-right">
          <p className="text-xs text-slate-400">{fechaHoy}</p>
          <p className="text-sm font-medium text-white tabular-nums">{horaActual}</p>
        </div>
      </header>

      {user && (
        <div className="px-4 flex justify-end -mt-1 mb-2">
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      )}

      {datosMeteo && (
        <div className="mx-4 mb-2 px-3 py-1.5 bg-slate-900 rounded-lg flex items-center justify-between border border-slate-800">
          <span className="text-xs text-slate-400">
            {datosMeteo.finca} · {datosMeteo.condicion}
          </span>
          <span className="text-sm font-medium text-white tabular-nums">{datosMeteo.temperatura}°C</span>
        </div>
      )}

      {hayAlertasUrgentes && (
        <div className="mx-4 mb-3 px-3 py-2 bg-red-950 border border-red-800 rounded-lg flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          <span className="text-xs text-red-300 leading-snug">{textoAlerta}</span>
        </div>
      )}

      <main className="px-4 pb-8 flex-1">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 mt-1">Acceso rápido</p>
        <div className="grid grid-cols-2 gap-3">
          {ACCESOS.map(({ label, ruta }, index) => (
            <button
              key={ruta + label}
              type="button"
              onClick={() => navigate(ruta)}
              className={`bg-slate-900 border border-slate-800 hover:border-emerald-800 hover:bg-slate-800 rounded-xl px-4 py-4 text-left transition-colors duration-150 active:scale-[0.98] ${index === 6 ? 'col-span-2' : ''}`}
            >
              <span className="text-sm font-medium text-white leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
