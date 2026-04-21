import React from 'react'
import { Tractor, Truck, Wrench, User, Leaf, ClipboardList } from 'lucide-react'
import { PDF_COLORS } from '@/utils/pdfUtils'

export interface ModuloExport {
  id: string
  label: string
  icon: React.ElementType
  color: [number, number, number]
}

export const MODULOS: ModuloExport[] = [
  { id: 'parte_diario', label: 'Parte Diario', icon: ClipboardList, color: PDF_COLORS.green },
  { id: 'trabajos', label: 'Trabajos', icon: Wrench, color: PDF_COLORS.amber },
  { id: 'maquinaria', label: 'Maquinaria', icon: Tractor, color: PDF_COLORS.orange },
  { id: 'logistica', label: 'Logística', icon: Truck, color: PDF_COLORS.violet },
  { id: 'personal', label: 'Personal', icon: User, color: PDF_COLORS.fuchsia },
  { id: 'campo', label: 'Campo / Parcelas', icon: Leaf, color: PDF_COLORS.green },
]

export function exportarPdfModuloLabel(id: string): string {
  return MODULOS.find(m => m.id === id)?.label ?? id
}
