export type ActivoAssignTab = 'tractor' | 'apero' | 'maquinaria_apero'
export type PanelView = 'estado' | 'historico'
export type InformeTipo = 'historico' | 'categoria' | 'mes'

export type RegistroConCategoria = {
  id: string
  ubicacion_id: string
  categoria_id: string
  cantidad: number
  unidad: string
  descripcion: string | null
  foto_url: string | null
  foto_url_2: string | null
  notas: string | null
  created_at: string
  precio_unitario: number | null
  producto_id: string | null
  created_by: string | null
  inventario_categorias: { nombre: string; orden: number } | null
}
