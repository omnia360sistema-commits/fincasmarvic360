import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Database, Download, Server, FileJson,
  FileSpreadsheet, Loader2, Calendar, FileText
} from 'lucide-react'
import { RecordActions } from '@/components/base'
import { toast } from '@/hooks/use-toast'
import { FINCAS_NOMBRES as FINCAS } from '@/constants/farms'
import {
  useErpExportacionesHistorial,
  useDeleteErpExportacion,
  useInsertErpExportacion,
  fetchProduccionErpRows,
  fetchCostesErpExportPayload,
  fetchAnalisisErpRows,
} from '@/hooks/useIntegracionERP'

export default function IntegracionERP() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0]
  })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0])
  const [fincaFiltro, setFincaFiltro] = useState('')

  const [loadingProd, setLoadingProd] = useState(false)
  const [loadingCostes, setLoadingCostes] = useState(false)
  const [loadingAgro, setLoadingAgro] = useState(false)

  const { data: historial = [], isLoading: loadingHistorial } = useErpExportacionesHistorial()
  const deleteExport = useDeleteErpExportacion()
  const insertExport = useInsertErpExportacion()

  useEffect(() => {
    const s = searchParams.get('seccion')
    if (!s) return
    const id =
      s === 'produccion' ? 'erp-seccion-produccion' :
      s === 'costes' ? 'erp-seccion-costes' :
      s === 'biologicos' ? 'erp-seccion-biologicos' :
      s === 'historial' ? 'erp-seccion-historial' : null
    if (!id) return
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [searchParams])

  async function registrarExportacion(tipo: string, formato: string, registros: number) {
    const notas = `Período: ${fechaInicio} a ${fechaFin}${fincaFiltro ? ` | Finca: ${fincaFiltro}` : ''}`
    try {
      await insertExport.mutateAsync({ tipo, formato, registros, notas })
    } catch {
      /* toast en el hook; no interrumpir el flujo de exportación ya completada */
    }
  }

  // ── Helpers de Exportación ──
  const downloadFile = (content: string, filename: string, isJson: boolean) => {
    const blob = new Blob([content], { type: isJson ? 'application/json' : 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const convertToCSV = (objArray: Record<string, unknown>[]) => {
    if (objArray.length === 0) return ''
    const headers = Object.keys(objArray[0]).join(',')
    const rows = objArray.map(obj => Object.values(obj).map(val => `"${val ?? ''}"`).join(','))
    return [headers, ...rows].join('\n')
  }

  // ── Funciones de Exportación ──

  const exportarProduccion = async (formato: 'csv' | 'json') => {
    setLoadingProd(true)
    try {
      const exportData = await fetchProduccionErpRows(fechaInicio, fechaFin)

      const resultStr = formato === 'json' ? JSON.stringify(exportData, null, 2) : convertToCSV(exportData)
      downloadFile(resultStr, `ERP_Produccion_${new Date().getTime()}.${formato}`, formato === 'json')
      
      toast({ title: `✅ ${exportData.length} registros exportados` })
      await registrarExportacion('Producción', formato, exportData.length)
    } catch (e: unknown) {
      toast({ title: 'Error exportando Producción', description: e instanceof Error ? e.message : 'Error desconocido', variant: 'destructive' })
    } finally {
      setLoadingProd(false)
    }
  }

  const exportarCostes = async (formato: 'csv' | 'json') => {
    setLoadingCostes(true)
    try {
      const { exportData, totalRegistros } = await fetchCostesErpExportPayload(fechaInicio, fechaFin)
      let resultStr = ''

      if (formato === 'json') {
        resultStr = JSON.stringify(exportData, null, 2)
      } else {
        // En CSV separamos por líneas de sección o devolvemos solo un volcado estructurado plano
        resultStr = `SECCION,FECHA,CONCEPTO,CANTIDAD,COSTE\n`
        exportData.mano_de_obra.forEach(r => resultStr += `Mano Obra,${r.fecha},${r.operacion},${r.horas_totales},0\n`)
        exportData.maquinaria.forEach(r => resultStr += `Maquinaria,${r.fecha},Uso Tractor,${r.horas_motor},0\n`)
        exportData.insumos.forEach(r => resultStr += `Insumos,${r.fecha},Entrada Stock,${r.cantidad},${r.coste_total}\n`)
      }

      downloadFile(resultStr, `ERP_Costes_${new Date().getTime()}.${formato}`, formato === 'json')
      toast({ title: `✅ ${totalRegistros} registros de costes exportados` })
      await registrarExportacion('Costes', formato, totalRegistros)
    } catch (e: unknown) {
      toast({ title: 'Error exportando Costes', description: e instanceof Error ? e.message : 'Error desconocido', variant: 'destructive' })
    } finally {
      setLoadingCostes(false)
    }
  }

  const exportarAnalisis = async (formato: 'csv' | 'json') => {
    setLoadingAgro(true)
    try {
      const exportData = await fetchAnalisisErpRows(fechaInicio, fechaFin)

      const resultStr = formato === 'json' ? JSON.stringify(exportData, null, 2) : convertToCSV(exportData)
      downloadFile(resultStr, `ERP_Analisis_${new Date().getTime()}.${formato}`, formato === 'json')
      
      toast({ title: `✅ ${exportData.length} registros agronómicos exportados` })
      await registrarExportacion('Análisis Agronómico', formato, exportData.length)
    } catch (e: unknown) {
      toast({ title: 'Error exportando Análisis', description: e instanceof Error ? e.message : 'Error desconocido', variant: 'destructive' })
    } finally {
      setLoadingAgro(false)
    }
  }

  // ── Render ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">
      {/* CABECERA */}
      <header className="bg-slate-900/80 border-b border-white/10 pl-14 pr-4 py-2.5 flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
        </button>
        <div className="w-px h-4 bg-white/10" />
        <Database className="w-4 h-4 text-indigo-400" />
        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Integración ERP</span>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl w-full mx-auto space-y-6">

        {/* Controles de Filtro Globales */}
        <div className="bg-slate-900/60 border border-white/10 rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <h2 className="text-[11px] font-black uppercase tracking-widest text-white">Filtros de Extracción</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Desde</label>
              <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500/50 outline-none" />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Hasta</label>
              <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500/50 outline-none" />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Finca (Opcional)</label>
              <select value={fincaFiltro} onChange={e => setFincaFiltro(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500/50 outline-none">
                <option value="">Todas las fincas</option>
                {FINCAS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Secciones de Exportación */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Producción */}
          <div id="erp-seccion-produccion" className="scroll-mt-24 bg-slate-900/60 border border-indigo-500/20 rounded-xl p-5 flex flex-col h-full shadow-lg">
            <div className="flex-1">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-3 border border-indigo-500/20">
                <Server className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-[13px] font-black text-white uppercase tracking-wider mb-2">Producción y Destinos</h3>
              <p className="text-[10px] text-slate-400 mb-4">Exporta las cosechas del período vinculadas a sus tickets de pesaje, lote y destino final.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-auto">
              <button onClick={() => exportarProduccion('csv')} disabled={loadingProd} className="flex items-center justify-center gap-1.5 py-2 rounded border border-white/10 bg-slate-800 hover:bg-slate-700 text-[9px] font-black uppercase tracking-widest text-white transition-colors disabled:opacity-50">
                {loadingProd ? <Loader2 className="w-3 h-3 animate-spin"/> : <FileSpreadsheet className="w-3 h-3"/>} CSV
              </button>
              <button onClick={() => exportarProduccion('json')} disabled={loadingProd} className="flex items-center justify-center gap-1.5 py-2 rounded border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-[9px] font-black uppercase tracking-widest text-indigo-400 transition-colors disabled:opacity-50">
                {loadingProd ? <Loader2 className="w-3 h-3 animate-spin"/> : <FileJson className="w-3 h-3"/>} JSON
              </button>
            </div>
          </div>

          {/* Costes */}
          <div id="erp-seccion-costes" className="scroll-mt-24 bg-slate-900/60 border border-amber-500/20 rounded-xl p-5 flex flex-col h-full shadow-lg">
            <div className="flex-1">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3 border border-amber-500/20">
                <Database className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-[13px] font-black text-white uppercase tracking-wider mb-2">Costes de Campo</h3>
              <p className="text-[10px] text-slate-400 mb-4">Exporta el consumo de insumos, horas de maquinaria y mano de obra operativa para contabilidad.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-auto">
              <button onClick={() => exportarCostes('csv')} disabled={loadingCostes} className="flex items-center justify-center gap-1.5 py-2 rounded border border-white/10 bg-slate-800 hover:bg-slate-700 text-[9px] font-black uppercase tracking-widest text-white transition-colors disabled:opacity-50">
                {loadingCostes ? <Loader2 className="w-3 h-3 animate-spin"/> : <FileSpreadsheet className="w-3 h-3"/>} CSV
              </button>
              <button onClick={() => exportarCostes('json')} disabled={loadingCostes} className="flex items-center justify-center gap-1.5 py-2 rounded border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-[9px] font-black uppercase tracking-widest text-amber-400 transition-colors disabled:opacity-50">
                {loadingCostes ? <Loader2 className="w-3 h-3 animate-spin"/> : <FileJson className="w-3 h-3"/>} JSON
              </button>
            </div>
          </div>

          {/* Análisis */}
          <div id="erp-seccion-biologicos" className="scroll-mt-24 bg-slate-900/60 border border-green-500/20 rounded-xl p-5 flex flex-col h-full shadow-lg">
            <div className="flex-1">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-3 border border-green-500/20">
                <FileText className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-[13px] font-black text-white uppercase tracking-wider mb-2">Activos Biológicos</h3>
              <p className="text-[10px] text-slate-400 mb-4">Exporta el historial de análisis de suelo, agua y sensores para enriquecer el ERP financiero.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-auto">
              <button onClick={() => exportarAnalisis('csv')} disabled={loadingAgro} className="flex items-center justify-center gap-1.5 py-2 rounded border border-white/10 bg-slate-800 hover:bg-slate-700 text-[9px] font-black uppercase tracking-widest text-white transition-colors disabled:opacity-50">
                {loadingAgro ? <Loader2 className="w-3 h-3 animate-spin"/> : <FileSpreadsheet className="w-3 h-3"/>} CSV
              </button>
              <button onClick={() => exportarAnalisis('json')} disabled={loadingAgro} className="flex items-center justify-center gap-1.5 py-2 rounded border border-green-500/40 bg-green-500/10 hover:bg-green-500/20 text-[9px] font-black uppercase tracking-widest text-green-400 transition-colors disabled:opacity-50">
                {loadingAgro ? <Loader2 className="w-3 h-3 animate-spin"/> : <FileJson className="w-3 h-3"/>} JSON
              </button>
            </div>
          </div>

        </div>

        {/* Estado de Integración / Historial */}
        <div id="erp-seccion-historial" className="scroll-mt-24 bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden shadow-lg mt-6">
          <div className="px-5 py-4 border-b border-white/10 bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-slate-400" />
              <h2 className="text-[11px] font-black uppercase tracking-widest text-white">Historial de Exportaciones</h2>
            </div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{historial.length} Registros</span>
          </div>
          
          <div className="p-0">
            {loadingHistorial ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              </div>
            ) : historial.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Database className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs uppercase tracking-widest font-black">Sin exportaciones registradas</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/80 border-b border-white/10">
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Generado</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Módulo</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Formato</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Registros</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Filtros Aplicados</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {historial.map((h) => {
                    const formato = h.formato ?? '—'
                    const registros = h.registros_exportados ?? 0
                    const notasFiltros = h.notas ?? ''
                    const generadoAt = h.generado_at
                    return (
                    <tr key={h.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-4 py-3 text-[11px] text-slate-300 whitespace-nowrap">
                        {generadoAt
                          ? new Date(generadoAt).toLocaleString('es-ES', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' })
                          : (h.fecha ? h.fecha : '—')}
                      </td>
                      <td className="px-4 py-3 text-[11px] font-bold text-white whitespace-nowrap">{h.tipo ?? '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                          formato === 'json' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-slate-700 text-white border-slate-500'
                        }`}>
                          {formato}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-center font-mono text-emerald-400">{registros}</td>
                      <td className="px-4 py-3 text-[10px] text-slate-500 truncate max-w-[200px]" title={notasFiltros}>{notasFiltros || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <RecordActions 
                          onEdit={() => {}}
                          onDelete={() => deleteExport.mutate(h.id)} 
                          confirmMessage="¿Eliminar este registro del historial?"
                        />
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}