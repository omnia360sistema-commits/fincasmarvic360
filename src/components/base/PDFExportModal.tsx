import { useState } from 'react'
import { FileText, X, Calendar, Check } from 'lucide-react'

/**
 * Modal reutilizable para exportación PDF con rango de fechas y filtros.
 *
 * Uso:
 *   const [open, setOpen] = useState(false)
 *   <button onClick={() => setOpen(true)}>Descargar PDF</button>
 *   <PDFExportModal
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     title="Informe de Trabajos"
 *     accentColor="#6d9b7d"
 *     filtros={[
 *       { key: 'incluir_fotos', label: 'Incluir fotos', default: true },
 *       { key: 'solo_urgentes', label: 'Solo urgentes', default: false },
 *     ]}
 *     onExport={async ({ desde, hasta, filtros }) => {
 *       // genera el PDF con esos parámetros
 *     }}
 *   />
 */

export interface PDFExportFiltro {
  key: string
  label: string
  default?: boolean
}

export interface PDFExportParams {
  desde: string  // YYYY-MM-DD
  hasta: string
  filtros: Record<string, boolean>
}

interface Props {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  accentColor?: string
  filtros?: PDFExportFiltro[]
  onExport: (params: PDFExportParams) => Promise<void> | void
}

export function PDFExportModal({
  open,
  onClose,
  title,
  subtitle,
  accentColor = '#6d9b7d',
  filtros = [],
  onExport,
}: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const [desde, setDesde] = useState(oneMonthAgo)
  const [hasta, setHasta] = useState(today)
  const [filtroValues, setFiltroValues] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(filtros.map(f => [f.key, f.default ?? true])),
  )
  const [exporting, setExporting] = useState(false)

  if (!open) return null

  const handleQuickRange = (days: number) => {
    const now = new Date()
    const past = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    setDesde(past.toISOString().slice(0, 10))
    setHasta(now.toISOString().slice(0, 10))
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      await onExport({ desde, hasta, filtros: filtroValues })
      onClose()
    } catch (e) {
      console.error('[PDFExportModal] Error:', e)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className="px-5 py-4 border-b border-border flex items-center justify-between"
          style={{ borderBottomColor: `${accentColor}30` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <FileText className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div>
              <h3 className="text-foreground font-bold text-sm uppercase tracking-wider">
                {title}
              </h3>
              {subtitle && (
                <p className="text-muted-foreground text-xs mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Rango de fechas */}
          <div>
            <label className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
              <Calendar className="w-3.5 h-3.5" />
              Rango de fechas
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] text-muted-foreground mb-1">Desde</label>
                <input
                  type="date"
                  value={desde}
                  onChange={e => setDesde(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-foreground/40"
                />
              </div>
              <div>
                <label className="block text-[9px] text-muted-foreground mb-1">Hasta</label>
                <input
                  type="date"
                  value={hasta}
                  onChange={e => setHasta(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-foreground/40"
                />
              </div>
            </div>
            {/* Shortcuts de rango */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                { label: 'Hoy', days: 0 },
                { label: '7 días', days: 7 },
                { label: '30 días', days: 30 },
                { label: '90 días', days: 90 },
                { label: '1 año', days: 365 },
              ].map(({ label, days }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleQuickRange(days)}
                  className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider border border-border rounded text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtros opcionales */}
          {filtros.length > 0 && (
            <div>
              <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                Opciones del informe
              </label>
              <div className="space-y-1.5">
                {filtros.map(f => (
                  <label
                    key={f.key}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        filtroValues[f.key]
                          ? 'border-transparent'
                          : 'border-border'
                      }`}
                      style={
                        filtroValues[f.key]
                          ? { backgroundColor: accentColor }
                          : undefined
                      }
                    >
                      {filtroValues[f.key] && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={filtroValues[f.key] ?? false}
                      onChange={e =>
                        setFiltroValues(prev => ({
                          ...prev,
                          [f.key]: e.target.checked,
                        }))
                      }
                      className="sr-only"
                    />
                    <span className="text-sm text-foreground">{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex gap-2 bg-secondary/30">
          <button
            onClick={onClose}
            disabled={exporting}
            className="flex-1 py-2 rounded-lg border border-border text-muted-foreground text-[11px] font-black uppercase tracking-widest hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || !desde || !hasta}
            className="flex-1 py-2 rounded-lg text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ backgroundColor: accentColor }}
          >
            {exporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                Descargar PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
