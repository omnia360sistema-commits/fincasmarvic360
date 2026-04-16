import type { CapacitorConfig } from '@capacitor/cli';

/**
 * APK en modo “servidor remoto”: el WebView carga la misma URL que el despliegue web.
 * Así los cambios en el servidor se reflejan sin reinstalar el APK (salvo cambios nativos).
 *
 * (Capacitor 8 requiere Node ≥22; este proyecto usa Capacitor 7.6.1 para Node 20.)
 * Antes de `npm run cap:sync` o `npx cap sync android`:
 *   export CAPACITOR_SERVER_URL="https://tu-dominio.com"
 * Si no se define, la app usa los assets copiados en `dist` (útil para pruebas sin URL).
 */
const raw = process.env.CAPACITOR_SERVER_URL?.trim();
const serverUrl = raw?.replace(/\/$/, '');

const config: CapacitorConfig = {
  appId: 'com.agricola.marvic360',
  appName: 'Marvic 360',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
};

if (serverUrl) {
  config.server = {
    url: serverUrl,
    cleartext: serverUrl.startsWith('http://'),
    androidScheme: 'https',
  };
}

export default config;
