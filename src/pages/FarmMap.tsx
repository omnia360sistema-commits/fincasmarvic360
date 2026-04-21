import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useGeoJSON } from '@/hooks/useGeoJSON'
import { useFarmParcelStatuses, useFarmAnalisisSuelo } from '@/hooks/useParcelData'
import { useAuth } from '@/context/AuthContext'
import { nombreFirmaPdfFromUser } from '@/utils/pdfUtils'
import { farmMapGenerarPDFFinca } from '@/utils/farmMapPagePdf'
import type { ParcelFeature } from '@/types/farm'
import { STATUS_COLORS } from '@/types/farm'
import RegisterWorkForm from '@/components/RegisterWorkForm'
import UploadParcelPhoto from '@/components/UploadParcelPhoto'
import RegisterEstadoUnificadoForm from '@/components/RegisterEstadoUnificadoForm'
import { usePosicionesActuales } from '@/hooks/useGPS'
import {
  getSueloColor,
  getLabelSize,
  type MenuId,
  type RegisterAction,
  type InformeFincaTipo,
  type InformeTipoDato,
} from '@/components/FarmMap/farmMapConstants'
import { MapLegend } from '@/components/FarmMap/FarmMapLegend'
import { FarmMapModal as Modal, SectorTooltip } from '@/components/FarmMap/FarmMapModal'
import { FarmMapHeaderAndMenu } from '@/components/FarmMap/FarmMapHeaderAndMenu'
import { FarmMapBottomChrome } from '@/components/FarmMap/FarmMapBottomChrome'
import { FarmMapSidePanels } from '@/components/FarmMap/FarmMapSidePanels'
import { FarmMapInformePdfModal } from '@/components/FarmMap/FarmMapInformePdfModal'

export default function FarmMap() {
  const { farmName } = useParams<{ farmName: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const firmaPdf = nombreFirmaPdfFromUser(user)
  const { getFarmParcels, loading, error: geoError } = useGeoJSON()

  const [selectedParcel, setSelectedParcel] = useState<ParcelFeature | null>(null)
  const [tooltipParcel, setTooltipParcel] = useState<ParcelFeature | null>(null)
  const [activeMenu, setActiveMenu] = useState<MenuId | null>(null)
  const [activeModal, setActiveModal] = useState<RegisterAction>(null)
  const [now, setNow] = useState(new Date())
  const [coords, setCoords] = useState({ lat: 0, lng: 0 })
  const [sueloParam, setSueloParam] = useState<string>('pH')
  const [showTractores, setShowTractores] = useState(false)

  const [showInformeFinca, setShowInformeFinca] = useState(false)
  const [informeFincaTipo, setInformeFincaTipo] = useState<InformeFincaTipo>('sector')
  const [informeSector, setInformeSector] = useState('')
  const [informeTipoDato, setInformeTipoDato] = useState<InformeTipoDato>('trabajos')
  const [informeFechaInicio, setInformeFechaInicio] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })
  const [informeFechaFin, setInformeFechaFin] = useState(() => new Date().toISOString().slice(0, 10))
  const [generandoInforme, setGenerandoInforme] = useState(false)
  const [informeError, setInformeError] = useState<string | null>(null)

  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null)
  const labelsRef = useRef<L.Marker[]>([])
  const tractoresLayerRef = useRef<L.LayerGroup | null>(null)
  const fitDoneRef = useRef(false)

  const decodedFarm = decodeURIComponent(farmName || '')
  const parcels = getFarmParcels(decodedFarm)
  const parcelIdsForHooks = parcels.map(p => p.properties.parcel_id)
  const { data: statuses } = useFarmParcelStatuses(parcelIdsForHooks)
  const { data: analisisSueloMap } = useFarmAnalisisSuelo(parcelIdsForHooks)
  const { data: tractoresPosiciones = [] } = usePosicionesActuales('tractor')

  const pdfCtx = useMemo(
    () => ({
      firmaPdf,
      decodedFarm,
      parcels,
      informeFincaTipo,
      informeSector,
      informeTipoDato,
      informeFechaInicio,
      informeFechaFin,
    }),
    [
      firmaPdf,
      decodedFarm,
      parcels,
      informeFincaTipo,
      informeSector,
      informeTipoDato,
      informeFechaInicio,
      informeFechaFin,
    ],
  )

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
    map.on('mousemove', e => setCoords({ lat: e.latlng.lat, lng: e.latlng.lng }))
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [loading])

  useEffect(() => {
    const map = mapRef.current
    if (!map || parcels.length === 0) return

    if (geoJsonLayerRef.current) map.removeLayer(geoJsonLayerRef.current)
    labelsRef.current.forEach(m => m.remove())
    labelsRef.current = []

    const fc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: parcels as unknown as GeoJSON.Feature[] }

    const geojsonLayer = L.geoJSON(fc, {
      style: feature => {
        const isSelected = feature?.properties?.parcel_id === selectedParcel?.properties.parcel_id

        if (activeMenu === 'suelo' && feature?.properties?.parcel_id) {
          const paramKeyMap: Record<string, string> = {
            pH: 'ph',
            EC: 'conductividad_ec',
            N: 'nitrogeno_ppm',
            P: 'fosforo_ppm',
            K: 'potasio_ppm',
            MO: 'materia_organica',
          }
          const analisis = analisisSueloMap?.[feature?.properties?.parcel_id]
          const val = analisis ? analisis[paramKeyMap[sueloParam] as keyof typeof analisis] : null
          const color = getSueloColor(sueloParam, val as number | null | undefined)
          return {
            fillColor: color,
            fillOpacity: isSelected ? 0.6 : 0.45,
            color: isSelected ? '#ffffff' : color,
            weight: isSelected ? 2.5 : 1,
          }
        }

        const status = statuses?.[feature?.properties?.parcel_id] ?? 'vacia'
        const isVacia = status === 'vacia'
        return {
          fillColor: STATUS_COLORS[status],
          fillOpacity: isSelected ? 0.45 : isVacia ? 0.08 : 0.25,
          color: isSelected ? '#6d9b7d' : isVacia ? 'rgba(255,255,255,0.4)' : STATUS_COLORS[status],
          weight: isSelected ? 2.5 : isVacia ? 1 : 1.5,
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
        layer.on('click', () => handleParcelClick(feature as unknown as ParcelFeature))
      },
    }).addTo(map)

    geoJsonLayerRef.current = geojsonLayer
    const bounds = geojsonLayer.getBounds()
    if (bounds.isValid() && !fitDoneRef.current) {
      map.fitBounds(bounds, { padding: [30, 30] })
      fitDoneRef.current = true
    }

    const onZoom = () => {
      labelsRef.current.forEach((marker, i) => {
        const feature = parcels[i]
        if (!feature) return
        const nombre = feature.properties?.parcela || feature.properties?.parcel_id || ''
        marker.setIcon(buildLabel(nombre, map))
      })
    }
    map.on('zoomend', onZoom)
    return () => {
      map.off('zoomend', onZoom)
    }
  }, [parcels, statuses, selectedParcel, activeMenu, sueloParam, analisisSueloMap, handleParcelClick, buildLabel])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (tractoresLayerRef.current) {
      map.removeLayer(tractoresLayerRef.current)
      tractoresLayerRef.current = null
    }

    if (!showTractores || !tractoresPosiciones || tractoresPosiciones.length === 0) return

    const layerGroup = L.layerGroup().addTo(map)
    const dosHorasAtras = Date.now() - 2 * 3600 * 1000

    tractoresPosiciones.forEach(pos => {
      if (new Date(pos.timestamp).getTime() < dosHorasAtras) return

      const html = `
        <div style="background:#fb923c; color:#020617; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m10 11 11 .9c.6 0 .9.5.8 1.1l-.8 5h-1"/><path d="M16 18h-5"/><path d="M18 5c-.6 0-1 .4-1 1v5.6"/><path d="m20 18-1-1h-1"/><path d="m22 18-1-1h-1"/><path d="m3 8 1.5-3h4.9l.6 3"/><path d="M3.1 9H8c2.2 0 4 1.8 4 4v3"/><path d="M4 18h-1"/><path d="M7 18h-2"/><circle cx="18" cy="18" r="2"/><circle cx="7" cy="18" r="3"/></svg>
        </div>
      `

      const icon = L.divIcon({ html, className: '' })
      const marker = L.marker([pos.latitud, pos.longitud], { icon }).addTo(layerGroup)

      const timeStr = new Date(pos.timestamp).toLocaleTimeString('es-ES')
      marker.bindTooltip(`
        <div class="font-bold text-slate-800 text-[11px] mb-1 uppercase tracking-wider">Tractor ID: ${pos.vehicle_id.slice(0, 5)}</div>
        <div class="text-[10px] text-slate-600">Velocidad: <b>${pos.velocidad_kmh || 0} km/h</b></div>
        <div class="text-[10px] text-slate-600">Última señal: <b>${timeStr}</b></div>
      `, { direction: 'top', offset: [0, -10] })
    })

    tractoresLayerRef.current = layerGroup
  }, [showTractores, tractoresPosiciones])

  async function generarPDFFinca() {
    setGenerandoInforme(true)
    setInformeError(null)
    try {
      await farmMapGenerarPDFFinca(pdfCtx)
      setShowInformeFinca(false)
    } catch (err: unknown) {
      setInformeError(err instanceof Error ? err.message : 'Error generando el PDF')
    } finally {
      setGenerandoInforme(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center text-[#6d9b7d] text-sm font-black tracking-widest uppercase transition-colors">
        Cargando sistema...
      </div>
    )
  }

  if (geoError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center flex-col gap-4 text-center px-8 transition-colors">
        <span className="text-red-400 text-sm font-black tracking-widest uppercase">Error cargando mapa</span>
        <span className="text-slate-500 dark:text-slate-400 text-xs">{typeof geoError === 'string' ? geoError : ((geoError as unknown as Error)?.message || 'Error')}</span>
        <button type="button" onClick={() => navigate('/farm')} className="text-[#6d9b7d] text-xs underline">Volver al selector</button>
      </div>
    )
  }

  const horaStr = now.toTimeString().slice(0, 8)
  const sectoresActivos = parcels.length
  const parcelId = selectedParcel?.properties.parcel_id ?? null
  const parcelNombre = selectedParcel?.properties.parcela ?? ''

  const closeModal = () => setActiveModal(null)

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const id = window.setTimeout(() => map.invalidateSize(), 320)
    return () => window.clearTimeout(id)
  }, [activeMenu])

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-slate-50 dark:bg-[#020617] transition-colors">

      <div ref={mapContainerRef} className="h-full w-full z-0" />

      <FarmMapHeaderAndMenu
        decodedFarm={decodedFarm}
        horaStr={horaStr}
        onBack={() => navigate(-1)}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        onOpenInformePdf={() => {
          setInformeError(null)
          setShowInformeFinca(true)
        }}
      />

      <FarmMapSidePanels
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        parcels={parcels}
        statuses={statuses}
        selectedParcel={selectedParcel}
        setSelectedParcel={setSelectedParcel}
        setTooltipParcel={setTooltipParcel}
        sueloParam={sueloParam}
        setSueloParam={setSueloParam}
        setActiveModal={setActiveModal}
        parcelNombre={parcelNombre}
        parcelId={parcelId}
        mapRef={mapRef}
      />

      {tooltipParcel && !activeModal && (
        <div className="absolute left-1/2 -translate-x-1/2 z-[1001] max-md:bottom-[4.75rem] md:bottom-14">
          <SectorTooltip
            parcel={tooltipParcel}
            onClose={() => {
              setTooltipParcel(null)
              setSelectedParcel(null)
            }}
          />
        </div>
      )}

      <FarmMapBottomChrome
        decodedFarm={decodedFarm}
        sectoresActivos={sectoresActivos}
        showTractores={showTractores}
        setShowTractores={setShowTractores}
        coords={coords}
        horaStr={horaStr}
        mapRef={mapRef}
      />

      <MapLegend activeMenu={activeMenu} sueloParam={sueloParam} />

      {activeModal === 'work' && parcelId && (
        <Modal title="Registrar Trabajo" subtitle={parcelNombre} onClose={closeModal}>
          <RegisterWorkForm parcelId={parcelId} onClose={closeModal} />
        </Modal>
      )}
      {activeModal === 'estado_unificado' && parcelId && (
        <Modal title="Estado / Análisis" subtitle={parcelNombre} onClose={closeModal} wide>
          <RegisterEstadoUnificadoForm
            parcelId={parcelId}
            farmName={decodedFarm}
            parcelName={parcelNombre}
            onClose={closeModal}
          />
        </Modal>
      )}
      {activeModal === 'photo' && parcelId && (
        <Modal title="Subir Foto" subtitle={parcelNombre} onClose={closeModal}>
          <UploadParcelPhoto parcelId={parcelId} onClose={closeModal} />
        </Modal>
      )}

      <FarmMapInformePdfModal
        open={showInformeFinca}
        onClose={() => setShowInformeFinca(false)}
        decodedFarm={decodedFarm}
        parcels={parcels}
        informeFincaTipo={informeFincaTipo}
        setInformeFincaTipo={setInformeFincaTipo}
        informeSector={informeSector}
        setInformeSector={setInformeSector}
        informeTipoDato={informeTipoDato}
        setInformeTipoDato={setInformeTipoDato}
        informeFechaInicio={informeFechaInicio}
        setInformeFechaInicio={setInformeFechaInicio}
        informeFechaFin={informeFechaFin}
        setInformeFechaFin={setInformeFechaFin}
        informeError={informeError}
        generandoInforme={generandoInforme}
        onGenerar={() => {
          void generarPDFFinca()
        }}
      />

    </div>
  )
}
