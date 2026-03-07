import { useState, useEffect } from 'react';
import proj4 from 'proj4';
import type { ParcelCollection, ParcelFeature, FarmSummary, ParcelProperties } from '@/types/farm';

// UTM Zone 30N (ETRS89) → WGS84
const UTM30N = '+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
const WGS84 = 'EPSG:4326';

function convertCoords(coords: number[][]): number[][] {
  return coords.map(([x, y]) => {
    const [lng, lat] = proj4(UTM30N, WGS84, [x, y]);
    return [lng, lat];
  });
}

function convertGeometry(geometry: any): any {
  if (geometry.type === 'Polygon') {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map(convertCoords),
    };
  }
  if (geometry.type === 'MultiPolygon') {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((poly: number[][][]) =>
        poly.map(convertCoords)
      ),
    };
  }
  return geometry;
}

function computeCentroid(coords: number[][]): [number, number] {
  let sx = 0, sy = 0;
  const pts = coords.length > 1 ? coords.slice(0, -1) : coords; // exclude closing point
  for (const [x, y] of pts) { sx += x; sy += y; }
  return [sx / pts.length, sy / pts.length];
}

function computeAreaHectares(coords: number[][]): number {
  // Shoelace formula on UTM (meters) coordinates
  let area = 0;
  const n = coords.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coords[i][0] * coords[j][1];
    area -= coords[j][0] * coords[i][1];
  }
  return Math.abs(area) / 2 / 10000; // m² → ha
}

// Cluster features by centroid proximity and assign farm names
function assignFarms(features: any[]): ParcelFeature[] {
  // Compute centroids from raw UTM coords
  const withCentroid = features.map((f, idx) => {
    const rawCoords = f.geometry.type === 'Polygon' 
      ? f.geometry.coordinates[0]
      : f.geometry.coordinates[0][0];
    const centroid = computeCentroid(rawCoords);
    const area = computeAreaHectares(rawCoords);
    return { feature: f, centroid, area, idx };
  });

  // K-means-like clustering by centroid x,y
  // First, find distinct clusters by sorting and grouping
  const sorted = [...withCentroid].sort((a, b) => a.centroid[0] - b.centroid[0]);
  
  // Group by easting proximity (>5000m gap = new cluster)
  const clusters: { features: typeof withCentroid }[] = [];
  let current: typeof withCentroid = [];
  
  for (const item of sorted) {
    if (current.length === 0) {
      current.push(item);
    } else {
      const lastX = current[current.length - 1].centroid[0];
      if (Math.abs(item.centroid[0] - lastX) > 5000) {
        clusters.push({ features: [...current] });
        current = [item];
      } else {
        current.push(item);
      }
    }
  }
  if (current.length > 0) clusters.push({ features: current });

  // If we have fewer clusters than 4 farms, split largest clusters by northing
  while (clusters.length < 4) {
    // Find largest cluster
    let maxIdx = 0;
    for (let i = 1; i < clusters.length; i++) {
      if (clusters[i].features.length > clusters[maxIdx].features.length) maxIdx = i;
    }
    const toSplit = clusters[maxIdx];
    const sortedByY = [...toSplit.features].sort((a, b) => a.centroid[1] - b.centroid[1]);
    const mid = Math.ceil(sortedByY.length / 2);
    clusters.splice(maxIdx, 1, 
      { features: sortedByY.slice(0, mid) },
      { features: sortedByY.slice(mid) }
    );
  }

  // Assign farm names to clusters (sorted by easting, then northing)
  clusters.sort((a, b) => {
    const avgXa = a.features.reduce((s, f) => s + f.centroid[0], 0) / a.features.length;
    const avgXb = b.features.reduce((s, f) => s + f.centroid[0], 0) / b.features.length;
    return avgXa - avgXb;
  });

  const FARM_NAMES = ['Cieza', 'Callosa-Catral', 'San Isidro', 'Mudamiento'];

  const result: ParcelFeature[] = [];

  clusters.forEach((cluster, ci) => {
    const farmName = FARM_NAMES[ci] || `Finca ${ci + 1}`;
    // Sort features within cluster by original id
    const sortedFeatures = [...cluster.features].sort((a, b) => 
      (a.feature.properties?.id || a.idx) - (b.feature.properties?.id || b.idx)
    );
    
    sortedFeatures.forEach((item, pi) => {
      const convertedGeometry = convertGeometry(item.feature.geometry);
      const parcelId = `${farmName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-p${pi + 1}`;
      
      const props: ParcelProperties = {
        parcel_id: parcelId,
        finca: farmName,
        parcela: `P${pi + 1}`,
        codigo: `${farmName.substring(0, 3).toUpperCase()}-${String(pi + 1).padStart(3, '0')}`,
        superficie: Math.round(item.area * 100) / 100,
        riego: 'Goteo',
      };

      result.push({
        type: 'Feature',
        geometry: convertedGeometry,
        properties: props,
      } as ParcelFeature);
    });
  });

  return result;
}

export function useGeoJSON() {
  const [data, setData] = useState<ParcelCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/FINCAS_COMPLETAS.geojson')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load GeoJSON');
        return res.json();
      })
      .then(async (json: any) => {
        const enrichedFeatures = assignFarms(json.features || []);
        const collection: ParcelCollection = {
          type: 'FeatureCollection',
          features: enrichedFeatures,
        };
        setData(collection);
        setLoading(false);

        // Upsert parcels into Supabase so FK constraints are satisfied
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const parcelsToUpsert = enrichedFeatures.map(f => ({
            parcel_id: f.properties.parcel_id,
            farm: f.properties.finca,
            parcel_number: f.properties.parcela,
            code: f.properties.codigo,
            area_hectares: f.properties.superficie,
            irrigation_type: f.properties.riego,
          }));
          await supabase.from('parcels').upsert(parcelsToUpsert, { onConflict: 'parcel_id' });
        } catch (e) {
          console.warn('Failed to upsert parcels:', e);
        }
      })
      .catch(err => {
        console.error('GeoJSON load error:', err);
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
      if (!farms[name]) {
        farms[name] = { name, parcelCount: 0, totalHectares: 0 };
      }
      farms[name].parcelCount++;
      farms[name].totalHectares += f.properties.superficie || 0;
    });
    return Object.values(farms);
  };

  return { data, loading, error, getFarmParcels, getFarmSummaries };
}
