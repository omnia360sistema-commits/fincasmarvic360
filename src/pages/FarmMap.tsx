import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useGeoJSON } from '@/hooks/useGeoJSON'
import { useFarmParcelStatuses } from '@/hooks/useParcelData'
import { ArrowLeft, LocateFixed } from 'lucide-react'
import ParcelDetailPanel from '@/components/ParcelDetailPanel'
import ThemeToggle from '@/components/ThemeToggle'
import type { ParcelFeature, ParcelStatus } from '@/types/farm'
import { STATUS_COLORS, STATUS_LABELS } from '@/types/farm'


function MapLegend() {
  const entries = Object.entries(STATUS_COLORS) as [ParcelStatus, string][]


  return (
    <div className="absolute bottom-4 left-4 z-[1000] glass-strong rounded-xl px-3 py-2 space-y-1">
      {entries.map(([status, color]) => (
        <div key={status} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-sm shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-[11px] text-foreground/80">
            {STATUS_LABELS[status]}
          </span>
        </div>
      ))}
    </div>
  )
}


function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
    </div>
  )
}


export default function FarmMap() {
  const { farmName } = useParams<{ farmName: string }>()
  const navigate = useNavigate()
  const { getFarmParcels, loading } = useGeoJSON()


  const [selectedParcel, setSelectedParcel] = useState<ParcelFeature | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)


  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null)
  const labelsRef = useRef<L.Marker[]>([])


  const decodedFarm = decodeURIComponent(farmName || '')
  const parcels = getFarmParcels(decodedFarm)


  const parcelIds = useMemo(
    () => parcels.map(p => p.properties.parcel_id),
    [parcels]
  )


  const { data: statuses } = useFarmParcelStatuses(parcelIds)


  const farmTotals = useMemo(() => {
    const cropYield = 18000
    const plasticPerHa = 12000
    const dripPerHa = 8000
    const tractorHoursPerHa = 2
    const plantingHoursPerHa = 4


    let hectares = 0


    parcels.forEach(p => {
      hectares += p.properties.superficie || 0
    })


    const production = Math.round(hectares * cropYield)
    const plastic = Math.round(hectares * plasticPerHa)
    const drip = Math.round(hectares * dripPerHa)
    const tractorHours = Math.round(hectares * tractorHoursPerHa)
    const plantingHours = Math.round(hectares * plantingHoursPerHa)


    return {
      hectares,
      production,
      plastic,
      drip,
      tractorHours,
      plantingHours
    }
  }, [parcels])


  const handleParcelClick = useCallback((feature: ParcelFeature) => {
    setSelectedParcel(feature)
    setPanelOpen(true)
  }, [])


  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return


    const map = L.map(mapContainerRef.current, {
      center: [38.2, -0.9],
      zoom: 14,
      zoomControl: false
    })


    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Esri', maxZoom: 19 }
    ).addTo(map)


    mapRef.current = map


    setTimeout(() => {
      map.invalidateSize()
    }, 100)


    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [loading])


  useEffect(() => {
    const map = mapRef.current
    if (!map || parcels.length === 0) return


    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current)
    }


    labelsRef.current.forEach(m => m.remove())
    labelsRef.current = []


    const fc: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: parcels as any
    }


    const geojsonLayer = L.geoJSON(fc, {
      style: feature => {
        const pid = feature?.properties?.parcel_id || ''
        const status: ParcelStatus = statuses?.[pid] || 'empty'


        return {
          fillColor: STATUS_COLORS[status],
          fillOpacity: 0.35,
          color: STATUS_COLORS[status],
          weight: 2,
          opacity: 0.8
        }
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties as any


        if (layer instanceof L.Polygon) {
          const center = layer.getBounds().getCenter()


          const label = L.divIcon({
            className: 'parcel-label',
            html: `<span>${props?.parcela || props?.parcel_id || ''}</span>`,
            iconSize: [50, 20],
            iconAnchor: [25, 10]
          })


          const marker = L.marker(center, {
            icon: label,
            interactive: false
          }).addTo(map)


          labelsRef.current.push(marker)
        }


        layer.on('click', () => {
          handleParcelClick(feature as unknown as ParcelFeature)
        })
      }
    }).addTo(map)


    geoJsonLayerRef.current = geojsonLayer


    const bounds = geojsonLayer.getBounds()
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30] })
    }
  }, [parcels, statuses, handleParcelClick])


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }


  return (
    <div className="h-screen w-screen relative overflow-hidden">


      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] px-4 pt-4">
        <div className="glass-strong rounded-2xl px-4 py-3 flex items-center gap-3">


          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>


          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Finca</p>
            <h1 className="text-base font-bold text-foreground truncate">
              {decodedFarm}
            </h1>
          </div>


          <ThemeToggle />


          <span className="text-xs text-muted-foreground">
            {parcels.length} parcelas
          </span>


        </div>
      </div>


      {/* Dashboard finca */}
      <div className="absolute top-20 left-0 right-0 z-[999] px-4">
        <div className="grid md:grid-cols-2 gap-4">


          {/* PANEL MÉTRICAS */}
          <div className="glass-strong rounded-2xl p-4 grid grid-cols-2 gap-3">


            <InfoCard label="Superficie total" value={`${farmTotals.hectares.toFixed(2)} ha`} />
            <InfoCard label="Producción estimada" value={`${farmTotals.production} kg`} />


            <InfoCard label="Plástico necesario" value={`${farmTotals.plastic} m`} />
            <InfoCard label="Cinta de riego" value={`${farmTotals.drip} m`} />


            <InfoCard label="Horas tractor" value={`${farmTotals.tractorHours} h`} />
            <InfoCard label="Horas plantación" value={`${farmTotals.plantingHours} h`} />


          </div>


          {/* PANEL INFORMACIÓN */}
          <div className="glass-strong rounded-2xl p-4">


            <h3 className="text-sm font-bold mb-3">
              Información de cultivo
            </h3>


            <div className="space-y-2 text-sm">


              <div>Cultivo previsto: Broccoli</div>
              <div>Producción media: 18.000 kg / ha</div>
              <div>Marco plantación: 0.8 x 0.5</div>
              <div>Plástico acolchado: Sí</div>
              <div>Sistema riego: Cinta</div>


            </div>


          </div>


        </div>
      </div>


      {/* Map */}
      <div ref={mapContainerRef} className="h-full w-full" />


      {/* GPS */}
      <button
        onClick={() => mapRef.current?.locate({ setView: true, maxZoom: 16 })}
        className="absolute bottom-28 right-4 z-[1000] w-12 h-12 rounded-full glass-strong flex items-center justify-center active:scale-95 transition-transform"
      >
        <LocateFixed className="w-5 h-5 text-primary" />
      </button>


      {/* Legend */}
      <MapLegend />


      {/* Parcel panel */}
      <ParcelDetailPanel
        parcel={selectedParcel}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
      />


    </div>
  )
}
