import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useGeoJSON } from '@/hooks/useGeoJSON'
import { useFarmParcelStatuses } from '@/hooks/useParcelData'
import {
  ArrowLeft, LocateFixed, X,
  List, ClipboardList, FlaskConical,
  GitBranch, Bell, History, ChevronRight,
  Shovel, Sprout, Wheat, Activity, Camera
} from 'lucide-react'
import type { ParcelFeature, ParcelStatus } from '@/types/farm'
import { STATUS_COLORS, STATUS_LABELS } from '@/types/farm'

import RegisterWorkForm from '@/components/RegisterWorkForm'
import RegisterPlantingForm from '@/components/RegisterPlantingForm'
import RegisterHarvestForm from '@/components/RegisterHarvestForm'
import RegisterParcelEstadoForm from '@/components/RegisterParcelEstadoForm'
import UploadParcelPhoto from '@/components/UploadParcelPhoto'
import ParcelHistory from '@/components/ParcelHistory'

// ── LEYENDA ───────────────────────────────────────────
function MapLegend() {
  const entries = Object.entries(STATUS_COLORS) as [ParcelStatus, string][]
  return (
    <div className="absolute bottom-8 left-4 z-[1000] bg-slate-900/80 border border-white/10 rounded-lg px-3 py-2 space-y-1">
      {entries.map(([status, color]) => (
        <div key={status} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
            {STATUS_LABELS[status]}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── TAMAÑO LABEL POR ZOOM ─────────────────────────────
function getLabelSize(zoom: number): string {
  if (zoom >= 17) return '11px'
  if (zoom >= 15) return '9px'
  if (zoom >= 14) return '8px'
  return '7px'
}

// ── MÓDULOS DEL MENÚ DERECHO ──────────────────────────
const MENU_ITEMS = [
  { id: 'sectores',     label: 'SECTORES',     icon: List },
  { id: 'registrar',    label: 'REGISTRAR',    icon: ClipboardList },
  { id: 'analisis',     label: 'ANÁLISIS',     icon: FlaskConical },
  { id: 'trazabilidad', label: 'TRAZABILIDAD', icon: GitBranch },
  { id: 'alertas',      label: 'ALERTAS',      icon: Bell },
  { id: 'historico',    label: 'HISTÓRICO',    icon: History },
] as const

type MenuId = typeof MENU_ITEMS[number]['id']

// Subacciones de REGISTRAR
type RegisterAction = 'work' | 'planting' | 'harvest' | 'estado' | 'photo' | null

// ── MODAL WRAPPER ─────────────────────────────────────
function Modal({
  title, subtitle, onClose, children
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center">
      {/* Overlay semitransparente — NO cierra al clicar para evitar cierres accidentales */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 bg-slate-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[85vh]">
        {/* HEADER */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div>
            <p className="text-[11px] font-black text-[#38bdf8] uppercase tracking-[0.3em]">{title}</p>
            {subtitle && (
              <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors ml-4 shrink-0"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        {/* CONTENIDO */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}

// ── TOOLTIP DE SECTOR ─────────────────────────────────
function SectorTooltip({
  parcel, onClose
}: {
  parcel: ParcelFeature
  onClose: () => void
}) {
  const p = parcel.properties
  return (
    <div className="bg-slate-900/95 border border-[#38bdf8]/30 rounded-lg p-3 min-w-[180px] shadow-2xl">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-black text-[#38bdf8] uppercase tracking-widest">{p.parcela}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{p.finca}</p>
        </div>
        <button onClick={onClose} className="text-slate-600 hover:text-slate-400">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1.5 mt-2">
        <div className="bg-slate-800/80 rounded px-2 py-1">
          <p className="text-[9px] text-slate-500 uppercase">Superficie</p>
          <p className="text-[11px] font-bold text-white">{p.superficie?.toFixed(2)} ha</p>
        </div>
        <div className="bg-slate-800/80 rounded px-2 py-1">
          <p className="text-[9px] text-slate-500 uppercase">Código</p>
          <p className="text-[11px] font-bold text-white">{p.codigo || '—'}</p>
        </div>
      </div>
      <p className="text-[9px] text-slate-600 text-center mt-2 uppercase tracking-widest">
        Usa el menú derecho para acceder
      </p>
    </div>
  )
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────
export default function FarmMap() {
  const { farmName } = useParams<{ farmName: string }>()
  const navigate     = useNavigate()
  const { getFarmParcels, loading } = useGeoJSON()

  const [selectedParcel, setSelectedParcel] = useState<ParcelFeature | null>(null)
  const [tooltipParcel, setTooltipParcel]   = useState<ParcelFeature | null>(null)
  const [activeMenu, setActiveMenu]         = useState<MenuId | null>(null)
  const [activeModal, setActiveModal]       = useState<RegisterAction>(null)
  const [now, setNow]                       = useState(new Date())
  const [coords, setCoords]                 = useState({ lat: 0, lng: 0 })

  const mapRef          = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null)
  const labelsRef       = useRef<L.Marker[]>([])

  const decodedFarm = decodeURIComponent(farmName || '')
  const parcels     = getFarmParcels(decodedFarm)
  const { data: statuses } = useFarmParcelStatuses(parcels.map(p => p.properties.parcel_id))

  // Reloj en tiempo real
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const handleParcelClick = useCallback((feature: ParcelFeature) => {
    setTooltipParcel(feature)
    setSelectedParcel(feature)
  }, [])

  const buildLabel = useCallback((text: string, map: L.Map): L.DivIcon => {
    const size = getLabelSize(map.getZoom())
    return L.divIcon({
      className: 'parcel-label',
      html: `<span style="font-size:${size};white-space:nowrap">${text}</span>`,
      iconAnchor: [0, 0],
    })
  }, [])

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return
    const map = L.map(mapContainerRef.current, {
      center: [38.2, -0.9],
      zoom: 14,
      zoomControl: false,
    })
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    ).addTo(map)
    map.on('mousemove', (e) => setCoords({ lat: e.latlng.lat, lng: e.latlng.lng }))
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [loading])

  // Dibujar parcelas
  useEffect(() => {
    const map = mapRef.current
    if (!map || parcels.length === 0) return

    if (geoJsonLayerRef.current) map.removeLayer(geoJsonLayerRef.current)
    labelsRef.current.forEach(m => m.remove())
    labelsRef.current = []

    const fc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: parcels as any }

    const geojsonLayer = L.geoJSON(fc, {
      style: feature => {
        const status: ParcelStatus = statuses?.[feature?.properties?.parcel_id] ?? 'vacia'
        const isVacia    = status === 'vacia'
        const isSelected = feature?.properties?.parcel_id === selectedParcel?.properties.parcel_id
        return {
          fillColor:   STATUS_COLORS[status],
          fillOpacity: isSelected ? 0.45 : isVacia ? 0.08 : 0.25,
          color:       isSelected ? '#38bdf8' : isVacia ? 'rgba(255,255,255,0.4)' : STATUS_COLORS[status],
          weight:      isSelected ? 2.5 : isVacia ? 1 : 1.5,
        }
      },
      onEachFeature: (feature, layer) => {
        if (layer instanceof L.Polygon) {
          const center = layer.getBounds().getCenter()
          const nombre = feature.properties?.parcela || feature.properties?.parcel_id || ''
          const marker = L.marker(center, {
            icon: buildLabel(nombre, map),
            interactive: false,
          }).addTo(map)
          labelsRef.current.push(marker)
        }
        layer.on('click', () => handleParcelClick(feature as any))
      }
    }).addTo(map)

    geoJsonLayerRef.current = geojsonLayer
    const bounds = geojsonLayer.getBounds()
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30] })

    const onZoom = () => {
      labelsRef.current.forEach((marker, i) => {
        const feature = parcels[i]
        if (!feature) return
        const nombre = feature.properties?.parcela || feature.properties?.parcel_id || ''
        marker.setIcon(buildLabel(nombre, map))
      })
    }
    map.on('zoomend', onZoom)
    return () => { map.off('zoomend', onZoom) }
  }, [parcels, statuses, selectedParcel, handleParcelClick, buildLabel])

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center text-[#38bdf8] text-sm font-black tracking-widest uppercase">
      Cargando sistema...
    </div>
  )

  const horaStr         = now.toTimeString().slice(0, 8)
  const sectoresActivos = parcels.length
  const parcelId        = selectedParcel?.properties.parcel_id ?? null
  const parcelNombre    = selectedParcel?.properties.parcela ?? ''

  const closeModal = () => setActiveModal(null)

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-[#020617]">

      {/* ── MAPA ─────────────────────────────────────── */}
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* ── PANEL IDENTIDAD — SUPERIOR IZQUIERDA ─────── */}
      <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 border border-white/10 rounded-lg px-4 py-3 min-w-[200px]">
        <p className="text-[10px] font-black text-[#38bdf8] uppercase tracking-[0.3em] mb-1">Marvic 360</p>
        <p className="text-base font-black text-white uppercase tracking-tight leading-none">{decodedFarm}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Operativo</span>
          <span className="text-[10px] text-slate-500 ml-auto font-mono">{horaStr}</span>
        </div>
      </div>

      {/* ── BOTÓN VOLVER ──────────────────────────────── */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-[220px] z-[1000] w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center bg-slate-900/90 hover:border-[#38bdf8]/40 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 text-slate-400" />
      </button>

      {/* ── MENÚ VERTICAL — SUPERIOR DERECHA ─────────── */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-1">
        {MENU_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveMenu(activeMenu === id ? null : id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-[11px] font-black uppercase tracking-widest transition-all ${
              activeMenu === id
                ? 'bg-[#38bdf8]/20 border-[#38bdf8]/60 text-[#38bdf8]'
                : 'bg-slate-900/90 border-white/10 text-slate-300 hover:border-[#38bdf8]/30 hover:text-[#38bdf8]'
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* ── PANEL LATERAL — SECTORES ─────────────────── */}
      {activeMenu === 'sectores' && (
        <div className="absolute top-4 right-52 bottom-10 z-[999] w-72 bg-slate-900/95 border border-white/10 rounded-lg flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
            <span className="text-[11px] font-black text-[#38bdf8] uppercase tracking-widest">Sectores</span>
            <button onClick={() => setActiveMenu(null)}><X className="w-4 h-4 text-slate-500 hover:text-white" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {parcels.map(p => {
              const status = statuses?.[p.properties.parcel_id] ?? 'vacia'
              return (
                <button
                  key={p.properties.parcel_id}
                  onClick={() => {
                    setSelectedParcel(p)
                    setTooltipParcel(p)
                    const map = mapRef.current
                    if (map) {
                      const rawCoords = p.geometry.type === 'Polygon'
                        ? p.geometry.coordinates[0]
                        : p.geometry.coordinates[0][0]
                      const lats = (rawCoords as number[][]).map(c => c[1])
                      const lngs = (rawCoords as number[][]).map(c => c[0])
                      map.flyTo(
                        [(Math.min(...lats) + Math.max(...lats)) / 2,
                         (Math.min(...lngs) + Math.max(...lngs)) / 2],
                        16, { duration: 1 }
                      )
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded border text-left transition-all ${
                    selectedParcel?.properties.parcel_id === p.properties.parcel_id
                      ? 'bg-[#38bdf8]/10 border-[#38bdf8]/30'
                      : 'bg-slate-800/50 border-transparent hover:border-white/10'
                  }`}
                >
                  <div>
                    <p className="text-[11px] font-bold text-white">{p.properties.parcela}</p>
                    <p className="text-[9px] text-slate-500">{p.properties.superficie?.toFixed(2)} ha</p>
                  </div>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[status] }} />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── PANEL LATERAL — REGISTRAR ────────────────── */}
      {activeMenu === 'registrar' && (
        <div className="absolute top-4 right-52 bottom-10 z-[999] w-72 bg-slate-900/95 border border-white/10 rounded-lg flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
            <div>
              <span className="text-[11px] font-black text-[#38bdf8] uppercase tracking-widest">Registrar</span>
              {selectedParcel && (
                <p className="text-[10px] text-slate-500 mt-0.5">{parcelNombre}</p>
              )}
            </div>
            <button onClick={() => setActiveMenu(null)}><X className="w-4 h-4 text-slate-500 hover:text-white" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {!selectedParcel ? (
              <p className="text-[11px] text-slate-500 text-center mt-8 uppercase tracking-widest">
                Selecciona un sector en el mapa primero
              </p>
            ) : (
              <div className="space-y-2">
                {[
                  { label: 'Registrar Trabajo',    icon: Shovel,   action: 'work' as RegisterAction },
                  { label: 'Registrar Plantación', icon: Sprout,   action: 'planting' as RegisterAction },
                  { label: 'Registrar Cosecha',    icon: Wheat,    action: 'harvest' as RegisterAction },
                  { label: 'Estado de Parcela',    icon: Activity, action: 'estado' as RegisterAction },
                  { label: 'Subir Foto',           icon: Camera,   action: 'photo' as RegisterAction },
                ].map(({ label, icon: Icon, action }) => (
                  <button
                    key={action}
                    onClick={() => { setActiveModal(action); setActiveMenu(null) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded border border-white/10 bg-slate-800/50 hover:bg-slate-800 hover:border-[#38bdf8]/30 transition-all text-left"
                  >
                    <Icon className="w-4 h-4 text-[#38bdf8] shrink-0" />
                    <span className="text-[11px] font-bold text-white uppercase tracking-wide">{label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 ml-auto" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PANEL LATERAL — HISTÓRICO ────────────────── */}
      {activeMenu === 'historico' && (
        <div className="absolute top-4 right-52 bottom-10 z-[999] w-[480px] bg-slate-900/95 border border-white/10 rounded-lg flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
            <div>
              <span className="text-[11px] font-black text-[#38bdf8] uppercase tracking-widest">Histórico</span>
              {selectedParcel && (
                <p className="text-[10px] text-slate-500 mt-0.5">{parcelNombre}</p>
              )}
            </div>
            <button onClick={() => setActiveMenu(null)}><X className="w-4 h-4 text-slate-500 hover:text-white" /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {!selectedParcel ? (
              <p className="text-[11px] text-slate-500 text-center mt-8 uppercase tracking-widest p-4">
                Selecciona un sector en el mapa primero
              </p>
            ) : (
              <ParcelHistory parcelId={parcelId!} onClose={() => setActiveMenu(null)} />
            )}
          </div>
        </div>
      )}

      {/* ── PANELES LATERALES — ANÁLISIS / TRAZABILIDAD / ALERTAS ── */}
      {['analisis', 'trazabilidad', 'alertas'].includes(activeMenu ?? '') && (
        <div className="absolute top-4 right-52 bottom-10 z-[999] w-72 bg-slate-900/95 border border-white/10 rounded-lg flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
            <span className="text-[11px] font-black text-[#38bdf8] uppercase tracking-widest">
              {MENU_ITEMS.find(m => m.id === activeMenu)?.label}
            </span>
            <button onClick={() => setActiveMenu(null)}><X className="w-4 h-4 text-slate-500 hover:text-white" /></button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-3">
            {selectedParcel ? (
              <>
                <p className="text-[11px] text-slate-400 text-center uppercase tracking-widest">
                  {parcelNombre}
                </p>
                <p className="text-[10px] text-slate-600 text-center">
                  Módulo disponible cuando se introduzcan datos de campo
                </p>
              </>
            ) : (
              <p className="text-[11px] text-slate-500 text-center uppercase tracking-widest">
                Selecciona un sector en el mapa primero
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── TOOLTIP DE SECTOR SELECCIONADO ───────────── */}
      {tooltipParcel && !activeModal && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-[1001]">
          <SectorTooltip
            parcel={tooltipParcel}
            onClose={() => { setTooltipParcel(null); setSelectedParcel(null) }}
          />
        </div>
      )}

      {/* ── BARRA INFERIOR DE ESTADO ──────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-slate-900/90 border-t border-white/10 px-4 py-1.5 flex items-center gap-6">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Finca: <span className="text-white">{decodedFarm}</span>
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Sectores: <span className="text-white">{sectoresActivos}</span>
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Conexión: <span className="text-green-400">Online</span>
        </span>
        <span className="text-[10px] font-mono text-slate-500 ml-auto">
          {coords.lat !== 0 ? `${coords.lat.toFixed(5)}° N  ${coords.lng.toFixed(5)}° E` : '—'}
        </span>
        <span className="text-[10px] font-mono text-slate-400">{horaStr}</span>
      </div>

      {/* ── BOTÓN LOCALIZAR ───────────────────────────── */}
      <button
        onClick={() => mapRef.current?.locate({ setView: true, maxZoom: 16 })}
        className="absolute bottom-10 right-4 z-[1000] w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-slate-900/90 hover:border-[#38bdf8]/40 transition-colors"
      >
        <LocateFixed className="w-4 h-4 text-[#38bdf8]" />
      </button>

      {/* ── LEYENDA ───────────────────────────────────── */}
      <MapLegend />

      {/* ══ MODALES INDEPENDIENTES POR MÓDULO ══════════ */}

      {activeModal === 'work' && parcelId && (
        <Modal
          title="Registrar Trabajo"
          subtitle={parcelNombre}
          onClose={closeModal}
        >
          <RegisterWorkForm parcelId={parcelId} onClose={closeModal} />
        </Modal>
      )}

      {activeModal === 'planting' && parcelId && (
        <Modal
          title="Registrar Plantación"
          subtitle={parcelNombre}
          onClose={closeModal}
        >
          <RegisterPlantingForm parcelId={parcelId} onClose={closeModal} />
        </Modal>
      )}

      {activeModal === 'harvest' && parcelId && (
        <Modal
          title="Registrar Cosecha"
          subtitle={parcelNombre}
          onClose={closeModal}
        >
          <RegisterHarvestForm parcelId={parcelId} onClose={closeModal} />
        </Modal>
      )}

      {activeModal === 'estado' && parcelId && (
        <Modal
          title="Estado de Parcela"
          subtitle={parcelNombre}
          onClose={closeModal}
        >
          <RegisterParcelEstadoForm parcelId={parcelId} onClose={closeModal} />
        </Modal>
      )}

      {activeModal === 'photo' && parcelId && (
        <Modal
          title="Subir Foto"
          subtitle={parcelNombre}
          onClose={closeModal}
        >
          <UploadParcelPhoto parcelId={parcelId} onClose={closeModal} />
        </Modal>
      )}

    </div>
  )
}