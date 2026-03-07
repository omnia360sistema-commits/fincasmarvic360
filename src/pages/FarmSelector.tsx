import { useNavigate } from 'react-router-dom';
import { useGeoJSON } from '@/hooks/useGeoJSON';
import { MapPin, Layers, ChevronRight } from 'lucide-react';

const FARM_ORDER = ['Mudamiento', 'Callosa-Catral', 'San Isidro', 'Cieza'];

const FARM_ICONS = ['🌿', '🌾', '🌻', '🍊'];

export default function FarmSelector() {
  const navigate = useNavigate();
  const { getFarmSummaries, loading } = useGeoJSON();
  const summaries = getFarmSummaries();

  const orderedFarms = FARM_ORDER.map(name => {
    const found = summaries.find(s => s.name.toLowerCase() === name.toLowerCase());
    return found || { name, parcelCount: 0, totalHectares: 0 };
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-6 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">AgroGestión</h1>
        </div>
        <p className="text-muted-foreground text-sm mt-2">Selecciona una finca para comenzar</p>
      </header>

      {/* Farm Cards */}
      <main className="flex-1 px-4 pb-8 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          orderedFarms.map((farm, i) => (
            <button
              key={farm.name}
              onClick={() => navigate(`/farm/${encodeURIComponent(farm.name)}`)}
              className="w-full glass rounded-2xl p-5 flex items-center gap-4 text-left active:scale-[0.98] transition-all duration-150 hover:border-primary/40 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center text-2xl shrink-0">
                {FARM_ICONS[i]}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-foreground truncate">{farm.name}</h2>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {farm.parcelCount} parcelas
                  </span>
                  <span>{farm.totalHectares.toFixed(2)} ha</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))
        )}
      </main>
    </div>
  );
}
