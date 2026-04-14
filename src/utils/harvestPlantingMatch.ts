interface HarvestRow {
  id: string;
  parcel_id: string | null;
  crop: string | null;
  date: string | null;
  [key: string]: unknown;
}

interface PlantingRow {
  parcel_id: string | null;
  crop: string | null;
  variedad: string | null;
  date: string | null;
}

function normalizeCrop(crop: string | null | undefined): string {
  if (!crop) return '';
  return crop.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Vincula cada harvest con la variedad de planting mas probable.
 *
 * Estrategia de matching (en orden de prioridad):
 * 1. parcel_id + crop normalizado (filtro obligatorio)
 * 2. Si harvest tiene fecha: planting con fecha mas cercana ANTERIOR a la cosecha
 * 3. Si harvest NO tiene fecha: planting mas reciente del mismo grupo
 *
 * Complejidad: O(P + H * G) donde G = max plantings por grupo parcel_id+crop.
 * Con datos reales G <= 10, practicamente O(P + H).
 */
export function matchHarvestsToPlantings<T extends HarvestRow>(
  harvests: T[],
  plantings: PlantingRow[]
): (T & { variedad: string | null })[] {

  const index = new Map<string, PlantingRow[]>();
  for (const p of plantings) {
    const key = `${p.parcel_id ?? ''}::${normalizeCrop(p.crop)}`;
    let group = index.get(key);
    if (!group) {
      group = [];
      index.set(key, group);
    }
    group.push(p);
  }

  for (const group of index.values()) {
    group.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });
  }

  return harvests.map(h => {
    const key = `${h.parcel_id ?? ''}::${normalizeCrop(h.crop)}`;
    const candidates = index.get(key);

    if (!candidates || candidates.length === 0) {
      return { ...h, variedad: null };
    }

    if (!h.date) {
      return { ...h, variedad: candidates[0].variedad };
    }

    const harvestTime = new Date(h.date).getTime();
    let best: PlantingRow | null = null;
    let bestDiff = Infinity;

    for (const p of candidates) {
      if (!p.date) continue;
      const plantTime = new Date(p.date).getTime();
      const diff = harvestTime - plantTime;
      if (diff >= 0 && diff < bestDiff) {
        bestDiff = diff;
        best = p;
      }
    }

    if (!best) {
      for (const p of candidates) {
        if (!p.date) continue;
        const diff = Math.abs(harvestTime - new Date(p.date).getTime());
        if (diff < bestDiff) {
          bestDiff = diff;
          best = p;
        }
      }
    }

    return { ...h, variedad: best?.variedad ?? candidates[0].variedad };
  });
}
