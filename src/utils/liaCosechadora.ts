/**
 * liaCosechadora.ts — Cosechadora básica de datos para LIA
 *
 * Función silenciosa que analiza el día y registra patrones.
 * NO lanza excepciones — graceful degradation si falla Supabase.
 */

import { supabase } from '@/integrations/supabase/client';

export async function ejecutarCosechaDiaria(fecha: string): Promise<void> {
  // No bloquear si estamos offline
  if (!navigator.onLine) {
    return;
  }

  try {
    // 1. Contar trabajos del día
    const { count: trabajosCount } = await supabase
      .from('trabajos_registro')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${fecha}T00:00:00.000Z`)
      .lt('created_at', `${fecha}T23:59:59.999Z`);

    // 2. Contar incidencias abiertas
    const { count: incidenciasCount } = await supabase
      .from('trabajos_incidencias')
      .select('*', { count: 'exact', head: true })
      .eq('resuelto', false);

    // 3. Contar viajes del día
    const { count: viajesCount } = await supabase
      .from('logistica_viajes')
      .select('*', { count: 'exact', head: true })
      .gte('fecha_inicio', fecha)
      .lt('fecha_inicio', `${fecha}T23:59:59.999Z`);

    // 4. Contar usos de maquinaria del día
    const { count: maquinariaCount } = await supabase
      .from('maquinaria_uso')
      .select('*', { count: 'exact', head: true })
      .gte('fecha_inicio', fecha)
      .lt('fecha_inicio', `${fecha}T23:59:59.999Z`);

    // 5. Insertar en lia_memoria
    const descripcion = `Día ${fecha}: ${trabajosCount || 0} trabajos, ${incidenciasCount || 0} incidencias abiertas, ${viajesCount || 0} viajes, ${maquinariaCount || 0} usos maquinaria`;

    await supabase
      .from('lia_memoria')
      .insert({
        tipo: 'hecho',
        descripcion,
        modulo: 'cosechadora',
        fecha_referencia: fecha,
        verificado: true,
      });

    // 6. Buscar patrones: Si incidencias > 2 el mismo día 3 veces en 7 días
    if ((incidenciasCount || 0) > 2) {
      // Contar cuántas veces en los últimos 7 días hubo > 2 incidencias
      const fechaHace7Dias = new Date(fecha);
      fechaHace7Dias.setDate(fechaHace7Dias.getDate() - 7);

      const { count: patronesSimilares } = await supabase
        .from('lia_memoria')
        .select('*', { count: 'exact', head: true })
        .eq('tipo', 'hecho')
        .eq('modulo', 'cosechadora')
        .gte('fecha_referencia', fechaHace7Dias.toISOString().split('T')[0])
        .lte('fecha_referencia', fecha)
        .ilike('descripcion', '%incidencias abiertas%');

      if ((patronesSimilares || 0) >= 3) {
        await supabase
          .from('lia_patrones')
          .insert({
            patron: 'Incidencias recurrentes',
            frecuencia: patronesSimilares || 0,
            activo: true,
          });
      }
    }

  } catch (error) {
    // Silent fail — nunca lanzar excepción
    console.warn('LIA Cosechadora: Error silencioso', error);
  }
}