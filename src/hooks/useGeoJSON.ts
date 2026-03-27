import { useState, useEffect } from 'react';
import type { ParcelCollection, ParcelFeature, FarmSummary } from '@/types/farm';

// Flag de módulo: el upsert solo se ejecuta una vez por sesión de navegador,
// aunque FarmMap se monte/desmonte varias veces.
let upsertDone = false;

export function useGeoJSON() {
  const [data, setData]       = useState<ParcelCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch('/FINCAS_MARVIC_FINAL.geojson')
      .then(res => {
        if (!res.ok) throw new Error('Error cargando mapa de fincas');
        return res.json();
      })
      .then(async (geojson: ParcelCollection) => {
        setData(geojson);
        setLoading(false);

        // Upsert parcelas reales en Supabase (solo una vez por sesión)
        if (!upsertDone) {
          upsertDone = true;
          try {
            const { supabase } = await import('@/integrations/supabase/client');
            const parcelas = geojson.features.map(f => ({
              parcel_id:       f.properties.parcel_id,
              farm:            f.properties.finca,
              parcel_number:   f.properties.parcela,
              code:            f.properties.codigo,
              area_hectares:   f.properties.superficie,
              irrigation_type: f.properties.riego,
            }));
            await supabase
              .from('parcels')
              .upsert(parcelas, { onConflict: 'parcel_id' });
          } catch (e) {
            console.warn('Upsert parcelas fallido:', e);
          }
        }
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const getFarmParcels = (farmName: string): ParcelFeature[] => {
    if (!data) return [];
    return data.features.filter(
      f => f.properties.finca?.toLowerCase() === farmName.toLowerCase()
    );
  };

  const getFarmSummaries = (): FarmSummary[] => {
    if (!data) return [];
    const farms: Record<string, FarmSummary> = {};
    data.features.forEach(f => {
      const name = f.properties.finca;
      if (!name) return;
      if (!farms[name]) farms[name] = { name, parcelCount: 0, totalHectares: 0 };
      farms[name].parcelCount++;
      farms[name].totalHectares = Math.round((farms[name].totalHectares + (f.properties.superficie || 0)) * 100) / 100;
    });
    return Object.values(farms).sort((a, b) => a.name.localeCompare(b.name));
  };

  return { data, loading, error, getFarmParcels, getFarmSummaries };
}