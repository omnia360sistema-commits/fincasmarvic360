import { useState, useMemo, useRef } from 'react'
import {
  useParcelas,
  useCropCatalog,
} from '@/hooks/useParcelData'
import {
  useInsertPlanting,
  useInsertHarvest,
} from '@/hooks/useOperaciones'
import {
  useInsertAnalisisSuelo,
  useInsertLecturaSensor,
  useInsertAnalisisAgua,
} from '@/hooks/useAnalisis'
import { useZonasRiego, useAddZonaRiego, useAddRegistroRiego } from '@/hooks/useRiego'
import { toast } from '@/hooks/use-toast'
import { persistEstadoUnificado } from '@/components/RegisterEstadoUnificado/registerEstadoUnificadoPersist'
import { RegisterEstadoUnificadoFormBody } from '@/components/RegisterEstadoUnificado/RegisterEstadoUnificadoFormBody'

interface Props {
  parcelId?: string
  farmName?: string
  parcelName?: string
  onClose: () => void
}

export default function RegisterEstadoUnificadoForm({
  parcelId: propParcelId,
  farmName: propFarmName,
  parcelName: propParcelName,
  onClose,
}: Props) {
  const [selFinca, setSelFinca] = useState('')
  const [selParcelId, setSelParcelId] = useState('')

  const activeFinca = propFarmName || selFinca
  const activeParcelId = propParcelId || selParcelId

  const { data: parcelas = [] } = useParcelas(propFarmName ? undefined : selFinca || undefined)
  const { data: catalogo = [] } = useCropCatalog()

  const [estado, setEstado] = useState('')
  const [observaciones, setObservaciones] = useState('')

  const [cultivo, setCultivo] = useState('')
  const [variedad, setVariedad] = useState('')
  const [fechaPlantacion, setFechaPlantacion] = useState(new Date().toISOString().slice(0, 10))

  const cultivoObj = useMemo(() => catalogo.find(c => c.nombre_interno === cultivo) ?? null, [catalogo, cultivo])
  const cosechaEstimada = useMemo(() => {
    if (!fechaPlantacion || !cultivoObj) return ''
    const d = new Date(fechaPlantacion)
    d.setDate(d.getDate() + (cultivoObj.ciclo_dias ?? 90))
    return d.toISOString().slice(0, 10)
  }, [fechaPlantacion, cultivoObj])

  const [cosechaCultivo, setCosechaCultivo] = useState('')
  const [cosechaKg, setCosechaKg] = useState('')
  const [cosechaFecha, setCosechaFecha] = useState(new Date().toISOString().slice(0, 10))

  const [showRiego, setShowRiego] = useState(false)
  const [riegoZona, setRiegoZona] = useState('')
  const [riegoFechaInicio, setRiegoFechaInicio] = useState('')
  const [riegoFechaFin, setRiegoFechaFin] = useState('')
  const [riegoLitros, setRiegoLitros] = useState('')
  const [riegoPresion, setRiegoPresion] = useState('')
  const [riegoOrigen, setRiegoOrigen] = useState('')
  const [riegoNotas, setRiegoNotas] = useState('')
  const { data: zonasRiego = [] } = useZonasRiego(activeParcelId)

  const [showSuelo, setShowSuelo] = useState(false)
  const [suelo, setSuelo] = useState({
    ph: '', conductividad_ec: '', salinidad_ppm: '', temperatura_suelo: '',
    nitrogeno_ppm: '', fosforo_ppm: '', potasio_ppm: '', textura: '',
    materia_organica: '', sodio_ppm: '',
  })
  const patchSuelo = (k: keyof typeof suelo, v: string) => setSuelo(prev => ({ ...prev, [k]: v }))

  const [showAgua, setShowAgua] = useState(false)
  const [agua, setAgua] = useState({
    fuente: '', ph: '', conductividad_ec: '', salinidad_ppm: '',
  })
  const patchAgua = (k: keyof typeof agua, v: string) => setAgua(prev => ({ ...prev, [k]: v }))

  const [showSensor, setShowSensor] = useState(false)
  const [sensor, setSensor] = useState({
    indice_salud: '', nivel_estres: '', clorofila: '', ndvi: '',
  })
  const setSen = (k: keyof typeof sensor, v: string) => setSensor(prev => ({ ...prev, [k]: v }))

  const [foto, setFoto] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const mutPlanting = useInsertPlanting()
  const mutHarvest = useInsertHarvest()
  const mutSuelo = useInsertAnalisisSuelo()
  const mutSensor = useInsertLecturaSensor()
  const mutAgua = useInsertAnalisisAgua()
  const mutAddZona = useAddZonaRiego()
  const mutAddRiego = useAddRegistroRiego()

  async function handleSubmit() {
    if (!activeParcelId) {
      toast({ title: 'Error', description: 'Selecciona una parcela', variant: 'destructive' })
      return
    }
    if (!estado) {
      toast({ title: 'Error', description: 'Selecciona el estado de la parcela', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const { warnings } = await persistEstadoUnificado({
        activeParcelId,
        activeFinca,
        estado,
        observaciones,
        foto,
        cultivo,
        variedad,
        fechaPlantacion,
        cultivoObj,
        cosechaEstimada,
        cosechaCultivo,
        cosechaKg,
        cosechaFecha,
        showRiego,
        riegoZona,
        riegoFechaInicio,
        riegoFechaFin,
        riegoLitros,
        riegoPresion,
        riegoOrigen,
        riegoNotas,
        zonasRiego,
        showSuelo,
        suelo,
        showAgua,
        agua,
        showSensor,
        sensor,
        mutPlanting,
        mutHarvest,
        mutSuelo,
        mutSensor,
        mutAgua,
        mutAddZona,
        mutAddRiego,
      })

      if (warnings.length > 0) {
        toast({ title: '⚠️ Guardado parcial', description: `Fallaron: ${warnings.join(', ')}` })
      } else {
        toast({ title: '✅ Registro guardado', description: `Parcela marcada como ${estado}` })
      }
      onClose()
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Error desconocido', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <RegisterEstadoUnificadoFormBody
      propParcelId={propParcelId}
      propFarmName={propFarmName}
      propParcelName={propParcelName}
      selFinca={selFinca}
      setSelFinca={setSelFinca}
      selParcelId={selParcelId}
      setSelParcelId={setSelParcelId}
      parcelas={parcelas}
      estado={estado}
      setEstado={setEstado}
      observaciones={observaciones}
      setObservaciones={setObservaciones}
      cultivo={cultivo}
      setCultivo={setCultivo}
      catalogo={catalogo}
      cultivoObj={cultivoObj}
      cosechaEstimada={cosechaEstimada}
      fechaPlantacion={fechaPlantacion}
      setFechaPlantacion={setFechaPlantacion}
      variedad={variedad}
      setVariedad={setVariedad}
      cosechaCultivo={cosechaCultivo}
      setCosechaCultivo={setCosechaCultivo}
      cosechaKg={cosechaKg}
      setCosechaKg={setCosechaKg}
      cosechaFecha={cosechaFecha}
      setCosechaFecha={setCosechaFecha}
      showRiego={showRiego}
      setShowRiego={setShowRiego}
      riegoZona={riegoZona}
      setRiegoZona={setRiegoZona}
      riegoFechaInicio={riegoFechaInicio}
      setRiegoFechaInicio={setRiegoFechaInicio}
      riegoFechaFin={riegoFechaFin}
      setRiegoFechaFin={setRiegoFechaFin}
      riegoLitros={riegoLitros}
      setRiegoLitros={setRiegoLitros}
      riegoPresion={riegoPresion}
      setRiegoPresion={setRiegoPresion}
      riegoOrigen={riegoOrigen}
      setRiegoOrigen={setRiegoOrigen}
      riegoNotas={riegoNotas}
      setRiegoNotas={setRiegoNotas}
      zonasRiego={zonasRiego}
      showSuelo={showSuelo}
      setShowSuelo={setShowSuelo}
      suelo={suelo}
      setSu={(k, v) => patchSuelo(k as keyof typeof suelo, v)}
      showAgua={showAgua}
      setShowAgua={setShowAgua}
      agua={agua}
      setAg={(k, v) => patchAgua(k as keyof typeof agua, v)}
      showSensor={showSensor}
      setShowSensor={setShowSensor}
      sensor={sensor}
      setSen={(k, v) => patchSensor(k as keyof typeof sensor, v)}
      foto={foto}
      setFoto={setFoto}
      fileRef={fileRef}
      saving={saving}
      activeParcelId={activeParcelId}
      onClose={onClose}
      onSubmit={() => {
        void handleSubmit()
      }}
    />
  )
}
