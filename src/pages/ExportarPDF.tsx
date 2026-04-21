import React, { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { generarPDFGlobal } from '@/utils/exportarPdfGenerarGlobal'
import { generarPDFAgronomico } from '@/utils/exportarPdfGenerarAgro'
import { ExportarPdfPageLayout, type ExportarPdfTab } from '@/components/ExportarPDF/ExportarPdfPageLayout'

const HOY = new Date().toISOString().split('T')[0]
const HACE30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

export default function ExportarPDF() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tipoUrl = searchParams.get('tipo')
  const tab: ExportarPdfTab = tipoUrl === 'agronomico' ? 'agronomico' : 'global'

  const setTab = useCallback(
    (t: ExportarPdfTab) => {
      setSearchParams(
        prev => {
          const p = new URLSearchParams(prev)
          p.set('tipo', t)
          return p
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )
  const [desde, setDesde] = useState(HACE30)
  const [hasta, setHasta] = useState(HOY)
  const [modulos, setModulos] = useState<Set<string>>(new Set(['parte_diario', 'trabajos']))
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fincaAgro, setFincaAgro] = useState('')
  const [tipoAgro, setTipoAgro] = useState('suelo')

  const { data: preview } = useQuery({
    queryKey: ['export_preview', desde, hasta],
    queryFn: async () => {
      const [p, t, m, l, pers1, pers2, c1, c2, c3] = await Promise.all([
        supabase.from('partes_diarios').select('id', { count: 'exact', head: true }).gte('fecha', desde).lte('fecha', hasta),
        supabase.from('trabajos_registro').select('id', { count: 'exact', head: true }).gte('fecha', desde).lte('fecha', hasta),
        supabase.from('trabajos_registro').select('id', { count: 'exact', head: true }).not('tractor_id', 'is', null).gte('fecha', desde).lte('fecha', hasta),
        supabase.from('logistica_viajes').select('id', { count: 'exact', head: true }).gte('hora_salida', desde).lte('hora_salida', hasta + 'T23:59:59'),
        supabase.from('personal').select('id', { count: 'exact', head: true }).gte('created_at', desde).lte('created_at', hasta + 'T23:59:59'),
        supabase.from('personal_externo').select('id', { count: 'exact', head: true }).gte('created_at', desde).lte('created_at', hasta + 'T23:59:59'),
        supabase.from('registros_estado_parcela').select('id', { count: 'exact', head: true }).gte('fecha', desde).lte('fecha', hasta),
        supabase.from('plantings').select('id', { count: 'exact', head: true }).gte('date', desde).lte('date', hasta),
        supabase.from('harvests').select('id', { count: 'exact', head: true }).gte('date', desde).lte('date', hasta),
      ])
      return {
        parte_diario: p.count ?? 0,
        trabajos: t.count ?? 0,
        maquinaria: m.count ?? 0,
        logistica: l.count ?? 0,
        personal: (pers1.count ?? 0) + (pers2.count ?? 0),
        campo: (c1.count ?? 0) + (c2.count ?? 0) + (c3.count ?? 0),
      }
    },
    staleTime: 30000,
  })

  const toggleModulo = (id: string) => {
    setModulos(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleGenerar = async () => {
    if (tab === 'global' && modulos.size === 0) {
      setError('Selecciona al menos un módulo')
      return
    }
    setError(null)
    setGenerando(true)
    try {
      if (tab === 'global') {
        await generarPDFGlobal(desde, hasta, modulos)
      } else {
        await generarPDFAgronomico(tipoAgro, desde, hasta, fincaAgro)
      }
    } catch (e) {
      setError('Error al generar el PDF. Inténtalo de nuevo.')
      console.error(e)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <ExportarPdfPageLayout
      tab={tab}
      setTab={setTab}
      desde={desde}
      setDesde={setDesde}
      hasta={hasta}
      setHasta={setHasta}
      modulos={modulos}
      toggleModulo={toggleModulo}
      preview={preview}
      fincaAgro={fincaAgro}
      setFincaAgro={setFincaAgro}
      tipoAgro={tipoAgro}
      setTipoAgro={setTipoAgro}
      error={error}
      generando={generando}
      onGenerar={() => {
        void handleGenerar()
      }}
    />
  )
}
