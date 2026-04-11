import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, WifiOff } from 'lucide-react';

/**
 * Notifica al usuario cuando hay una nueva versión disponible
 * y cuando el dispositivo pierde conexión.
 */
export function PWAUpdatePrompt() {
  const [offline, setOffline] = useState(!navigator.onLine);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl) {
      console.log('[PWA] Service worker registrado:', swUrl);
    },
    onRegisterError(error) {
      console.error('[PWA] Error registrando SW:', error);
    },
  });

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  return (
    <>
      {/* Banner offline */}
      {offline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-orange-600 text-white text-sm py-2 px-4 flex items-center justify-center gap-2 shadow-lg">
          <WifiOff className="w-4 h-4" />
          <span>Sin conexión — trabajando en modo offline</span>
        </div>
      )}

      {/* Prompt de actualización */}
      {needRefresh && (
        <div className="fixed bottom-4 left-4 right-4 z-[100] max-w-md mx-auto bg-slate-900 border border-sky-400/40 rounded-xl shadow-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-sky-400/10 rounded-lg">
              <RefreshCw className="w-5 h-5 text-sky-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Nueva versión disponible</h3>
              <p className="text-slate-400 text-sm mb-3">
                Hay una actualización lista. Recarga para aplicarla.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-sky-400 text-slate-900 text-sm font-medium rounded-lg hover:bg-sky-300 transition-colors"
                >
                  Actualizar ahora
                </button>
                <button
                  onClick={() => setNeedRefresh(false)}
                  className="px-4 py-2 border border-slate-600 text-slate-300 text-sm rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Luego
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
