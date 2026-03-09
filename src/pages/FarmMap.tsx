import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useGeoJSON } from '@/hooks/useGeoJSON'
import { useFarmParcelStatuses } from '@/hooks/useParcelData'
import { ArrowLeft, LocateFixed, Menu, Sun, Moon, X, FileText, Activity, Droplets } from 'lucide-react'
import ParcelDetailPanel from '@/components/ParcelDetailPanel'
import type { ParcelFeature, ParcelStatus } from '@/types/farm'
import { STATUS_COLORS, STATUS_LABELS } from '@/types/farm'

function MapLegend() {
  const entries = Object.entries(STATUS_COLORS) as [ParcelStatus, string][]
  return (
    <div className="absolute bottom-4 left-4 z-[1000] glass-strong rounded-xl px-3 py-2 space-y-1 border border-white/10">
      {entries.map(([status, color]) => (
        <div key={status} className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
          <span className="text-[11px] text-foreground/80 font-medium">{STATUS_LABELS[status]}</span>
        </div>
      ))}
    </div>
  )
}

export default function FarmMap() {
  const { farmName } = useParams<{ farmName: string }>()
  const navigate = useNavigate()
  const { getFarmParcels, loading } = useGeoJSON()

  const [selectedParcel, setSelectedParcel] = useState<ParcelFeature | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(true)

  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null)
  const labelsRef = useRef<L.Marker[]>([])

  const decodedFarm = decodeURIComponent(farmName || '')
  const displayName = decodedFarm.toLowerCase() === 'mudanza' ? 'Mudamiento' : decodedFarm;

  const parcels = getFarmParcels(decodedFarm)
  const { data: statuses } = useFarmParcelStatuses(parcels.map(p => p.properties.parcel_id))

  const handleParcelClick = useCallback((feature: ParcelFeature) => {
    setSelectedParcel(feature);
    setPanelOpen(true);
  }, [])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return
    const map = L.map(mapContainerRef.current, { center: [38.2, -0.9], zoom: 14, zoomControl: false })
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}').addTo(map)
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [loading])

  useEffect(() => {
    const map = mapRef.current
    if (!map || parcels.length === 0) return
    if (geoJsonLayerRef.current) map.removeLayer(geoJsonLayerRef.current)
    labelsRef.current.forEach(m => m.remove())
    const fc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: parcels as any }
    const geojsonLayer = L.geoJSON(fc, {
      style: feature => {
        const status: ParcelStatus = statuses?.[feature?.properties?.parcel_id] || 'empty'
        return { fillColor: STATUS_COLORS[status], fillOpacity: 0.35, color: STATUS_COLORS[status], weight: 2 }
      },
      onEachFeature: (feature, layer) => {
        if (layer instanceof L.Polygon) {
          const center = layer.getBounds().getCenter()
          const marker = L.marker(center, { 
            icon: L.divIcon({ 
              className: 'parcel-label', 
              html: `<span>${feature.properties?.parcela || feature.properties?.parcel_id || ''}</span>` 
            }) 
          }).addTo(map)
          labelsRef.current.push(marker)
        }
        layer.on('click', () => handleParcelClick(feature as any))
      }
    }).addTo(map)
    geoJsonLayerRef.current = geojsonLayer
    const bounds = geojsonLayer.getBounds()
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30] })
  }, [parcels, statuses, handleParcelClick])

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-[#38bdf8]">CARGANDO MAPA...</div>

  return (
    <div className={`h-screen w-screen relative overflow-hidden ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>

      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 z-[1000] px-4 pt-4">
        <div className={`rounded-2xl px-4 py-3 flex items-center gap-4 border shadow-2xl transition-all ${isDark ? 'bg-slate-900/90 border-white/10' : 'bg-white/90 border-slate-200'}`}>
          <button onClick={() => setIsMenuOpen(true)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? 'bg-slate-800 text-[#38bdf8]' : 'bg-slate-100'}`}>
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => navigate(-1)} className={`p-2 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100 text-slate-600'}`}><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <p className="text-[10px] font-black text-[#38bdf8] uppercase tracking-[0.2em]">Operación Finca</p>
              <h1 className={`text-xl font-black uppercase tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>{displayName}</h1>
            </div>
          </div>
          <button onClick={() => setIsDark(!isDark)} className={`relative w-14 h-7 rounded-full border flex items-center px-1 ${isDark ? 'bg-slate-950 border-slate-700' : 'bg-slate-200 border-slate-300'}`}>
            <div className={`w-5 h-5 rounded-full transition-all ${isDark ? 'translate-x-7 bg-[#38bdf8]' : 'translate-x-0 bg-white'}`}>
              {isDark ? <Moon className="w-3 h-3 text-slate-900" /> : <Sun className="w-3 h-3 text-orange-500" />}
            </div>
          </button>
        </div>
      </div>

      {/* SIDEBAR DESPLEGABLE - LIMPIO DE DATOS FALSOS */}
      <div className={`fixed inset-y-0 left-0 w-80 z-[2000] transition-transform duration-500 ease-in-out shadow-2xl ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} ${isDark ? 'bg-[#020617] border-r border-white/10' : 'bg-white border-r border-slate-200'}`}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#38bdf8]">Menú de Finca</span>
            <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:rotate-90 transition-transform"><X className="w-6 h-6 text-slate-500" /></button>
          </div>

          <div className="flex-1 space-y-8 overflow-y-auto pr-2 text-center py-10">
            <Activity className="w-12 h-12 text-[#38bdf8]/20 mx-auto mb-4" />
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              Seleccione una parcela en el mapa para ver datos reales
            </h3>
            <p className="text-[10px] text-slate-600 uppercase font-black tracking-tighter">
              Los cálculos de insumos (Kilos de plástico y cinta) se mostrarán por unidad de cultivo.
            </p>
          </div>

          {/* Botonera inferior de apoyo */}
          <div className="pt-6 border-t border-white/5 space-y-3">
             <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                <FileText className="w-5 h-5 text-[#38bdf8]" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Informes de Finca</span>
             </div>
          </div>
        </div>
      </div>

      {isMenuOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1500]" onClick={() => setIsMenuOpen(false)} />}

      <div ref={mapContainerRef} className="h-full w-full z-0" />
      <button onClick={() => mapRef.current?.locate({ setView: true, maxZoom: 16 })} className="absolute bottom-28 right-4 z-[1000] w-12 h-12 rounded-full border flex items-center justify-center shadow-2xl bg-slate-900 border-white/10"><LocateFixed className="w-5 h-5 text-[#38bdf8]" /></button>
      <MapLegend />
      <ParcelDetailPanel parcel={selectedParcel} open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  )
}