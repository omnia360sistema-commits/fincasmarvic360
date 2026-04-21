import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import {
  useTractores, useTractoresEnInventario, useAperosEnInventario,
  useDeleteTractor,
  useAperos, useDeleteApero,
  useUsosMaquinaria,
  useMantenimientoTractor,
  useKPIsMaquinaria,
  Tractor as TractorType,
} from '../hooks/useMaquinaria'
import { usePersonal } from '../hooks/usePersonal'
import { nombreFirmaPdfFromUser } from '../utils/pdfUtils'
import { maquinariaPdfOnElegir, type MaquinariaPdfContext } from '@/utils/maquinariaPagePdf'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useRecorridoDia, useAddPosicion } from '../hooks/useGPS'
import type { TabType } from '@/components/Maquinaria/maquinariaConstants'
import { ModalTractor } from '@/components/Maquinaria/ModalTractor'
import { ModalApero } from '@/components/Maquinaria/ModalApero'
import { ModalUso } from '@/components/Maquinaria/ModalUso'
import { MaquinariaPageHeaderKpis } from '@/components/Maquinaria/MaquinariaPageHeaderKpis'
import {
  MaquinariaTabTractores,
  MaquinariaTabAperos,
  MaquinariaTabUso,
  MaquinariaTabGps,
} from '@/components/Maquinaria/MaquinariaPageTabs'

const TAB_FROM_URL: Record<string, TabType> = {
  tractores: 'tractores',
  aperos: 'aperos',
  uso: 'uso',
  recorridos: 'gps',
}

export default function Maquinaria() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { theme } = useTheme()
  const { user } = useAuth()
  const firmaPdf = nombreFirmaPdfFromUser(user)
  const isDark = theme === 'dark'

  const rawTab = searchParams.get('tab')
  const tab: TabType = rawTab && TAB_FROM_URL[rawTab] ? TAB_FROM_URL[rawTab] : 'tractores'

  const setTab = useCallback((next: TabType) => {
    const urlKey = next === 'gps' ? 'recorridos' : next
    setSearchParams(
      prev => {
        const p = new URLSearchParams(prev)
        p.set('tab', urlKey)
        return p
      },
      { replace: true }
    )
  }, [setSearchParams])
  const [modalTractor, setModalTractor] = useState(false)
  const [editTractor, setEditTractor] = useState<TractorType | undefined>()
  const [modalApero, setModalApero] = useState(false)
  const [modalUso, setModalUso] = useState(false)
  const [generandoPdf, setGenerandoPdf] = useState(false)
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false)
  const pdfMenuRef = useRef<HTMLDivElement>(null)

  const { data: kpis } = useKPIsMaquinaria()
  const { data: tractores = [] } = useTractores()
  const { data: tractoresInv = [] } = useTractoresEnInventario()
  const { data: aperos = [] } = useAperos()
  const { data: aperosInv = [] } = useAperosEnInventario()
  const { data: usos = [] } = useUsosMaquinaria()
  const { data: mants = [] } = useMantenimientoTractor()
  const { data: personalTractoristas = [] } = usePersonal('conductor_maquinaria')

  const [gpsTractorId, setGpsTractorId] = useState<string>('')
  const [gpsFecha, setGpsFecha] = useState<string>(new Date().toISOString().slice(0, 10))
  const { data: gpsRecorrido = [], isLoading: isLoadingGps } = useRecorridoDia(gpsTractorId, gpsFecha)
  const mutAddPosicion = useAddPosicion()
  const gpsMapRef = useRef<L.Map | null>(null)
  const gpsMapContainerRef = useRef<HTMLDivElement>(null)
  const polylineRef = useRef<L.Polyline | null>(null)
  const stopsLayerRef = useRef<L.LayerGroup | null>(null)

  const deleteTractorMut = useDeleteTractor()
  const deleteAperoMut = useDeleteApero()

  const pdfCtx: MaquinariaPdfContext = useMemo(
    () => ({
      firmaPdf,
      tractores,
      aperos,
      usos,
      mants,
      personalTractoristas,
    }),
    [firmaPdf, tractores, aperos, usos, mants, personalTractoristas],
  )

  useEffect(() => {
    if (!pdfMenuOpen) return
    function onDown(ev: MouseEvent) {
      if (pdfMenuRef.current && !pdfMenuRef.current.contains(ev.target as Node)) {
        setPdfMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [pdfMenuOpen])

  async function onElegirPdf(op: 1 | 2 | 3 | 4 | 5) {
    setPdfMenuOpen(false)
    setGenerandoPdf(true)
    try {
      await maquinariaPdfOnElegir(op, pdfCtx)
    } finally {
      setGenerandoPdf(false)
    }
  }

  useEffect(() => {
    if (tab !== 'gps' || !gpsMapContainerRef.current) return

    if (!gpsMapRef.current) {
      gpsMapRef.current = L.map(gpsMapContainerRef.current).setView([38.2, -0.9], 12)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}').addTo(
        gpsMapRef.current
      )
      stopsLayerRef.current = L.layerGroup().addTo(gpsMapRef.current)
    }

    const map = gpsMapRef.current

    if (polylineRef.current) map.removeLayer(polylineRef.current)
    if (stopsLayerRef.current) stopsLayerRef.current.clearLayers()

    if (gpsRecorrido.length > 0) {
      const latlngs = gpsRecorrido.map(p => [p.latitud, p.longitud] as [number, number])
      polylineRef.current = L.polyline(latlngs, { color: '#fb923c', weight: 4 }).addTo(map)

      let currentStop: { start: string; lat: number; lng: number; duration: number } | null = null
      for (let i = 1; i < gpsRecorrido.length; i++) {
        const prev = gpsRecorrido[i - 1]
        const curr = gpsRecorrido[i]
        const isStopped = (curr.velocidad_kmh || 0) < 1

        if (isStopped) {
          if (!currentStop) {
            currentStop = { start: prev.timestamp, lat: curr.latitud, lng: curr.longitud, duration: 0 }
          }
          currentStop.duration += new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()
        } else {
          if (currentStop && currentStop.duration > 5 * 60 * 1000) {
            L.circleMarker([currentStop.lat, currentStop.lng], {
              radius: 6,
              fillColor: '#ef4444',
              color: '#fff',
              weight: 2,
              fillOpacity: 1,
            })
              .bindTooltip(
                `Parada: ${Math.round(currentStop.duration / 60000)} min<br/>Hora: ${new Date(currentStop.start).toLocaleTimeString()}`
              )
              .addTo(stopsLayerRef.current!)
          }
          currentStop = null
        }
      }

      const start = gpsRecorrido[0]
      const end = gpsRecorrido[gpsRecorrido.length - 1]

      const htmlStart = `<div style="background:#22c55e;width:12px;height:12px;border-radius:50%;border:2px solid white"></div>`
      const htmlEnd = `<div style="background:#fb923c;width:12px;height:12px;border-radius:50%;border:2px solid white"></div>`

      L.marker([start.latitud, start.longitud], { icon: L.divIcon({ html: htmlStart, className: '' }) })
        .bindTooltip('Inicio ' + new Date(start.timestamp).toLocaleTimeString())
        .addTo(stopsLayerRef.current!)

      L.marker([end.latitud, end.longitud], { icon: L.divIcon({ html: htmlEnd, className: '' }) })
        .bindTooltip('Fin ' + new Date(end.timestamp).toLocaleTimeString())
        .addTo(stopsLayerRef.current!)

      map.fitBounds(polylineRef.current.getBounds(), { padding: [30, 30] })
    }
  }, [tab, gpsRecorrido])

  const hoyIsoDate = new Date().toISOString().slice(0, 10)

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <MaquinariaPageHeaderKpis
        isDark={isDark}
        onBackDashboard={() => navigate('/dashboard')}
        onOpenModalUso={() => setModalUso(true)}
        pdfMenuRef={pdfMenuRef}
        pdfMenuOpen={pdfMenuOpen}
        setPdfMenuOpen={setPdfMenuOpen}
        generandoPdf={generandoPdf}
        onElegirPdf={onElegirPdf}
        kpis={kpis}
        tab={tab}
        setTab={setTab}
      >
        {tab === 'tractores' && (
          <MaquinariaTabTractores
            tractores={tractores}
            aperos={aperos}
            usos={usos}
            mants={mants}
            deleteTractorMut={deleteTractorMut}
            onNuevoTractor={() => {
              setEditTractor(undefined)
              setModalTractor(true)
            }}
            onEditTractor={t => {
              setEditTractor(t)
              setModalTractor(true)
            }}
          />
        )}

        {tab === 'aperos' && (
          <MaquinariaTabAperos
            aperos={aperos}
            tractores={tractores}
            deleteAperoMut={deleteAperoMut}
            onNuevoApero={() => setModalApero(true)}
          />
        )}

        {tab === 'uso' && (
          <MaquinariaTabUso
            usos={usos}
            tractores={tractores}
            aperos={aperos}
            personalTractoristas={personalTractoristas}
            onNuevoUso={() => setModalUso(true)}
          />
        )}

        {tab === 'gps' && (
          <MaquinariaTabGps
            gpsTractorId={gpsTractorId}
            setGpsTractorId={setGpsTractorId}
            gpsFecha={gpsFecha}
            setGpsFecha={setGpsFecha}
            tractores={tractores}
            isLoadingGps={isLoadingGps}
            gpsRecorrido={gpsRecorrido}
            mutAddPosicion={vars => mutAddPosicion.mutate(vars)}
            gpsMapContainerRef={gpsMapContainerRef}
            hoyIsoDate={hoyIsoDate}
          />
        )}
      </MaquinariaPageHeaderKpis>

      {modalTractor && (
        <ModalTractor
          tractor={editTractor}
          onClose={() => {
            setModalTractor(false)
            setEditTractor(undefined)
          }}
        />
      )}
      {modalApero && <ModalApero tractores={tractores} onClose={() => setModalApero(false)} />}
      {modalUso && (
        <ModalUso
          tractores={tractoresInv.length > 0 ? tractoresInv : tractores}
          aperos={aperosInv.length > 0 ? aperosInv : aperos}
          personal={personalTractoristas}
          onClose={() => setModalUso(false)}
        />
      )}
    </div>
  )
}
