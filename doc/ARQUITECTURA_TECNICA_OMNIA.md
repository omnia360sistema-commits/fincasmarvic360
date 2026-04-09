# 🏗️ ARQUITECTURA TÉCNICA OMNIA
## Agrícola Marvic 360 — Documentación Técnica del Sistema ERP

---

## 📋 Tabla de Contenidos
1. [Estructura del Proyecto](#estructura-del-proyecto)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Flujo de Datos Inter-Módulo](#flujo-de-datos-inter-módulo)
4. [Patrones Arquitectónicos](#patrones-arquitectónicos)
5. [Archivos Críticos](#archivos-críticos)
6. [Patrón de Generación de PDF Corporativo](#patrón-de-generación-de-pdf-corporativo)
7. [Guía de Escalabilidad](#guía-de-escalabilidad)

---

## Estructura del Proyecto

### 📂 Árbol de Directorios

```
src/
├── pages/                  # Componentes de página (UI principal)
│   ├── Personal.tsx        # Gestión de personal (5 tabs)
│   ├── Maquinaria.tsx      # Gestión de tractores/aperos
│   ├── Inventario.tsx      # Gestión de ubicaciones e inventario
│   ├── Trabajos.tsx        # Planificación y registro de trabajos
│   ├── ParteDiario.tsx     # Diario de campo (4 bloques A-D)
│   ├── Logistica.tsx       # Gestión de flota y viajes
│   ├── FarmMap.tsx         # Mapa geoespacial de parcelas
│   ├── EstadoGeneral.tsx   # Dashboard de alertas y KPIs
│   ├── ExportarPDF.tsx     # Generador de PDFs multi-módulo
│   ├── Dashboard.tsx       # Inicio del sistema
│   ├── Historicos.tsx      # Buscador histórico global
│   ├── QRCuadrilla.tsx     # Pantalla de fichaje QR
│   ├── Materiales.tsx      # Gestión de inventario descentralizado
│   ├── Auditoria.tsx       # Trazabilidad global de acciones
│   └── NotFound.tsx        # Página 404
│
├── hooks/                  # Lógica de negocio (React Hooks)
│   ├── usePersonal.ts      # Operarios, encargados, externos (343 líneas)
│   ├── useMaquinaria.ts    # Tractores, aperos, mantenimiento (435 líneas)
│   ├── useInventario.ts    # Ubicaciones, categorías, stock (742 líneas)
│   ├── useTrabajos.ts      # Trabajos, incidencias, planificación (590 líneas)
│   ├── useParteDiario.ts   # Parte diario, estados, residuos (564 líneas)
│   ├── useLogistica.ts     # Camiones, viajes, combustible (613 líneas)
│   ├── useParcelData.ts    # Parcelas, cultivos, cosechas (786 líneas) 🔴
│   ├── useMateriales.ts    # Filtros de stock por categoría real
│   ├── useAuditoria.ts     # Unificación de 4 tablas en un solo timeline
│   ├── useGeoJSON.ts       # Mapeo geoespacial (70 líneas)
│   └── use-toast.ts        # Notificaciones toast
│
├── components/             # Componentes reutilizables
│   ├── base/               # Componentes base altamente reutilizados
│   │   ├── SelectWithOther.tsx       # Selector con opción "Otro"
│   │   ├── AudioInput.tsx            # Entrada de audio
│   │   ├── PhotoAttachment.tsx       # Adjuntos de fotos
│   │   └── RecordActions.tsx         # Botones CRUD (editar/eliminar)
│   ├── ui/                 # shadcn/ui components (36 archivos)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── table.tsx
│   │   └── [etc.]
│   ├── AppLayout.tsx       # Layout principal con sidebar
│   ├── GlobalSidebar.tsx   # Navegación global
│   ├── ParcelDetailPanel.tsx
│   ├── RegisterWorkForm.tsx
│   └── [otros componentes especializados]
│
├── integrations/           # Integraciones externas
│   └── supabase/
│       ├── client.ts       # Cliente Supabase configurado 🔴
│       └── types.ts        # Tipos generados (3047 líneas) 🔴
│
├── utils/                  # Funciones puras reutilizables
│   ├── pdfUtils.ts         # Generación de PDFs corporativos (459 líneas) 🔴
│   ├── dateFormat.ts       # Formateo de fechas y horas
│   ├── uploadImage.ts      # Upload a Storage de Supabase
│   ├── validation.ts       # Validación de formularios
│   └── [otras utilidades]
│
├── constants/              # Datos estáticos centralizados
│   ├── farms.ts            # Datos de 7 fincas reales (211.94 ha, 119 sectores)
│   ├── tiposTrabajo.ts     # 25 tipos de trabajo agrícola
│   ├── estadosParcela.ts   # Estados de parcelas
│   └── navItems.ts         # Elementos de navegación
│
├── context/                # Context API (estado global)
│   ├── ThemeContext.tsx    # Tema claro/oscuro
│   └── SidebarContext.tsx  # Estado de sidebar
│
├── types/                  # Tipos TypeScript customizados
│   └── farm.ts             # Tipos para mapeador geoespacial
│
├── lib/                    # Librerías de configuración
│   └── utils.ts            # Utilitarios generales
│
└── test/                   # Tests unitarios
    ├── setup.ts
    └── example.test.ts
```

### 🎯 Responsabilidades por Carpeta

| Carpeta | Responsabilidad | Criticidad |
|---------|-----------------|-----------|
| **pages/** | Componentes de página (lógica de presentación) | 🟠 ALTA |
| **hooks/** | Queries/mutations a BD, transformación de datos | 🔴 CRÍTICA |
| **components/base/** | Componentes base reutilizables (UX consistente) | 🔴 CRÍTICA |
| **components/ui/** | shadcn/ui (componentes visuales) | 🟡 MEDIA |
| **integrations/supabase/** | Cliente Supabase + tipos generados | 🔴 CRÍTICA |
| **utils/** | Funciones puras (PDF, fecha, upload, validación) | 🔴 CRÍTICA |
| **constants/** | Datos estáticos (fincas, catálogos) | 🟢 BAJA |
| **context/** | Estado global (tema, sidebar) | 🟡 MEDIA |
| **types/** | Tipos TypeScript | 🟡 MEDIA |

---

## Stack Tecnológico

### 🛠️ Core Technologies

| Tecnología | Versión | Propósito | Criticidad |
|-----------|---------|----------|-----------|
| **React** | 18.3.1 | Framework UI principal | 🔴 CRÍTICA |
| **TypeScript** | 5.8.3 | Type safety, DX mejorado | 🔴 CRÍTICA |
| **Vite** | 5.4.19 | Build tool, dev server ultrarrápido | 🟠 ALTA |
| **Supabase** | 2.98.0 | Backend-as-a-Service (Auth, DB, Storage) | 🔴 CRÍTICA |
| **PostgreSQL** | (en Supabase) | Base de datos relacional | 🔴 CRÍTICA |
| **React Query** | 5.83.0 | Gestión de estado asincrónico | 🟠 ALTA |
| **Tailwind CSS** | 3.4.17 | Utility-first CSS framework | 🟠 ALTA |
| **shadcn/ui** | latest | Componentes accesibles + prestyled | 🟡 MEDIA |
| **React Router** | 6.30.1 | Enrutamiento SPA | 🟠 ALTA |
| **Capacitor** | 8.3.0 | Mobile app wrapper (iOS/Android) | 🟡 MEDIA |
| **jsPDF** | 4.2.0 | Generación de PDFs | 🟠 ALTA |
| **Leaflet** | 1.9.4 | Mapeo geoespacial | 🟡 MEDIA |
| **Lucide React** | 0.462.0 | Librería de iconos | 🟢 BAJA |
| **Zod** | 3.25.76 | Validación de esquemas | 🟡 MEDIA |
| **date-fns** | 3.6.0 | Utilidades de fecha | 🟡 MEDIA |

### ⚙️ ¿Por qué cada tecnología es crítica?

#### **React 18.3.1**
- Renderizado declarativo necesario para actualizar UI en tiempo real
- Hooks personalizados encapsulan lógica de negocio
- Componentes reutilizables reducen código duplicado

#### **TypeScript 5.8.3**
- Type safety previene bugs en tiempo de desarrollo
- IntelliSense mejora productividad
- Autocompletado en IDE esencial para 15 módulos complejos

#### **Supabase PostgreSQL**
- Base de datos relacional mandatoria para integridad de datos
- RLS (Row-Level Security) implementada para datos de fincas
- Realtime subscriptions para actualizaciones en vivo
- Storage para 1000+ fotos de personal/maquinaria/trabajos

#### **React Query 5.83.0**
- Caching automático reduce queries a BD (critical en mobile)
- Manejo de errores + retry logic
- Synchronización de estado entre componentes sin Context bloat

#### **Tailwind CSS + shadcn/ui**
- Rapid prototyping + consistent design system
- Responsive design nativo (mobile-first)
- Dark mode integrado
- Accesibilidad WCAG incluida

#### **Vite 5.4.19**
- HMR (Hot Module Replacement) acelera desarrollo 10x vs webpack
- Build time < 2 segundos (critical para CI/CD)
- Tree-shaking automático reduce bundle size

#### **jsPDF 4.2.0**
- Generación de PDFs multipágina sin servidor
- Patrón corporativo centralizado (headers, footers, branding)
- Usado por 6+ módulos para exportación de informes

---

## Flujo de Datos Inter-Módulo

### 📊 Ejemplo Completo: Crear un Trabajo en Trabajos.tsx

```
┌─────────────────────────────────────────────────────────────────────┐
│                       USUARIO FINAL                                 │
│                   (Forma en Trabajos.tsx)                           │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    LAYER 1: PRESENTACIÓN                            │
│                                                                      │
│  Trabajos.tsx                                                       │
│  ├─ useState: formData (fecha, parcela, operario, tipo_trabajo)    │
│  ├─ handleSubmit() → valida + prepara payload                      │
│  └─ Importa: SelectWithOther, AudioInput, PhotoAttachment,         │
│     RecordActions (componentes base)                               │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│            LAYER 2: LÓGICA DE NEGOCIO (Hooks)                       │
│                                                                      │
│  useTrabajos.ts                                                     │
│  ├─ useAddTrabajoRegistro() [mutation]                            │
│  │  ├─ Valida datos con Zod schema                                │
│  │  ├─ Prepara INSERT query con campos:                           │
│  │  │   - tipo_bloque (maquinaria_agricola / logistica / etc)     │
│  │  │   - fecha, hora_inicio, parcela_id, operario_id             │
│  │  │   - tractor_id, apero_id (si aplica)                        │
│  │  │   - foto_url (si hay adjunto)                               │
│  │  └─ Retorna { data, error } sin lanzar excepciones             │
│  │                                                                  │
│  └─ usePersonal.ts, useMaquinaria.ts, useParcelas()              │
│     ├─ Cargan opciones de selectors (operarios, tractores, etc)   │
│     └─ Usadas en dropdowns del formulario                         │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│         LAYER 3: UTILIDADES & TRANSFORMACIONES                      │
│                                                                      │
│  utils/uploadImage.ts                                              │
│  ├─ uploadImage(foto, 'trabajos', 'registro')                     │
│  ├─ → Sube a Storage supabase/trabajos/registro/...               │
│  └─ → Retorna URL pública o null                                   │
│                                                                      │
│  utils/validation.ts                                               │
│  └─ validateForm(rules, values) → errors[] | []                   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│       LAYER 4: CLIENTE SUPABASE (integrations/supabase/)           │
│                                                                      │
│  client.ts                                                          │
│  ├─ createClient<Database>(VITE_SUPABASE_URL, KEY)                │
│  ├─ supabase.from('trabajos_registro').insert({ ...datos })      │
│  └─ Envía query vía protocolo HTTPS/WebSocket                    │
│                                                                      │
│  types.ts (3047 líneas)                                           │
│  └─ Define Database, Tables, Row types generados automáticamente  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│      LAYER 5: POSTGRESQL (En Supabase cloud)                        │
│                                                                      │
│  trabajos_registro TABLE:                                          │
│  ├─ INSERT INTO trabajos_registro (                               │
│  │    tipo_bloque, fecha, parcela_id, operario_id,               │
│  │    tractor_id, apero_id, foto_url, estado_planificacion,     │
│  │    prioridad, tarea, responsable, created_at, created_by      │
│  │  ) VALUES (...)                                               │
│  │                                                                │
│  └─ RETURNING id (para actualizar UI inmediatamente)            │
│                                                                      │
│  RLS POLICY: (Fila visible si user es miembro de finca)          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│      LAYER 4 (RETORNO): React Query invalidation                    │
│                                                                      │
│  queryClient.invalidateQueries({ queryKey: ['trabajos'] })        │
│  ├─ React Query detecta que 'trabajos' fue modificada             │
│  ├─ Vuelve a ejecutar useRegistrosTrabajos()                      │
│  └─ UI se refresca automáticamente                                 │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│            LAYER 1 (RETORNO): Actualización Visual                  │
│                                                                      │
│  Trabajos.tsx                                                       │
│  ├─ {data?.map(trabajo => <TrabajoRow key={id} trabajo={trabajo}/>)}
│  ├─ Toast de éxito: "Trabajo registrado ✓"                       │
│  └─ Modal se cierra, formulario resetea                           │
└─────────────────────────────────────────────────────────────────────┘
```

### 🔄 Ciclo Completo (en términos de React Query)

```
1. Usuario hace clic en "Guardar Trabajo"
   ↓
2. handleSubmit() llama useAddTrabajoRegistro.mutate(data)
   ↓
3. Mutation ejecuta supabase.from('trabajos_registro').insert(...)
   ↓
4. BD retorna { id, created_at, ... }
   ↓
5. onSuccess() callback invalida queryKey: ['trabajos']
   ↓
6. React Query ejecuta useRegistrosTrabajos() nuevamente
   ↓
7. UI recibe NEW data con el trabajo nuevo
   ↓
8. Componentes dependientes (ParcelMap, KPIs, etc) se actualizan automáticamente
```

---

## Patrones Arquitectónicos

### 1️⃣ Custom Hooks para Lógica de Negocio

Cada módulo tiene un hook dedicado que encapsula:
- **Query fetching** (useQuery)
- **Mutations** (useMutation)
- **Type definitions** (interfaces)

#### Ejemplo: usePersonal.ts

```typescript
// ✅ PATRÓN: Custom hook encapsula lógica de CRUD

export function usePersonal() {
  return useQuery({
    queryKey: ['personal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personal')
        .select('*')
        .eq('activo', true)
        .order('fecha_alta', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useAddPersonal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newPerson: PersonalInsert) => {
      const { data, error } = await supabase
        .from('personal')
        .insert([newPerson])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalida y refresca caché
      queryClient.invalidateQueries({ queryKey: ['personal'] });
    },
  });
}
```

#### Ventajas:
✅ **Reutilización**: Múltiples páginas usan el mismo hook  
✅ **Testabilidad**: Lógica separada de componentes  
✅ **Mantenibilidad**: Cambios en query = 1 lugar  
✅ **Error handling**: Consistente en todo el app  

---

### 2️⃣ Componentes Base Reutilizables

4 componentes base implementan patrones comunes en 150+ lugares:

#### SelectWithOther
```typescript
// Selector dropdown con opción "Otro" custom
<SelectWithOther
  label="Tipo de Trabajo"
  options={TIPOS_TRABAJO}
  value={formData.tipo_trabajo}
  onChange={handleTypeChange}
  placeholder="Seleccionar tipo"
  allowOther={true}
/>
```

#### AudioInput
```typescript
// Grabadora de audio (micrófono)
<AudioInput
  label="Notas de audio"
  onAudioSaved={(url) => setFormData({ ...formData, audio_url: url })}
/>
```

#### PhotoAttachment
```typescript
// Adjuntor de fotos con preview
<PhotoAttachment
  label="Foto del trabajo"
  onPhotoSaved={(url) => setFormData({ ...formData, foto_url: url })}
  bucket="trabajos"
  folder="fotos_registro"
/>
```

#### RecordActions
```typescript
// Botones CRUD: Editar, Eliminar, Descargar
<RecordActions
  onEdit={() => handleEdit(record)}
  onDelete={() => handleDelete(record.id)}
  onDownload={() => downloadPDF(record)}
  loading={isDeleting}
/>
```

#### Beneficios:
✅ **Consistencia UI**: Mismo patrón en Personal, Maquinaria, Inventario, Trabajos, Logística  
✅ **A11y**: Accesibilidad implementada una vez  
✅ **Mantenimiento**: Bug fix = arreglado en todos lados  

---

### 3️⃣ Patrón de Contexto Global (ThemeContext, SidebarContext)

```typescript
// src/context/ThemeContext.tsx
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  
  return (
    <ThemeContext.Provider value={{ isDark, setIsDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

// En cualquier componente:
const { isDark, setIsDark } = useTheme();
```

---

### 4️⃣ Patrón React Query para Sincronización de Estado

```typescript
// ✅ ANTI-PATTERN: Redux boilerplate excesivo
// ✅ PATRÓN ADOPTADO: React Query maneja estado de servidor

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 minutos
      gcTime: 1000 * 60 * 10,        // 10 minutos (antes cacheTime)
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});
```

**Por qué funciona:**
- Servidor es source of truth
- React Query cachea automáticamente
- Invalida solo lo necesario
- Sin prop-drilling innecesario

---

## Archivo: Patrón de Generación de PDF Corporativo

### 🎨 Configuración Centralizada en pdfUtils.ts

```typescript
// Constantes globales de layout
export const PDF_MARGIN = 14;
export const PDF_PAGE_W = 210;
export const PDF_PAGE_H = 297;
export const PDF_TEXT_W = PDF_PAGE_W - 2 * PDF_MARGIN; // 182

// Colores corporativos por módulo
export const PDF_COLORS = {
  accent: [30, 41, 59],    // Azul oscuro
  orange: [251, 146, 60],  // Naranja (Trabajos)
  violet: [124, 58, 237],  // Violeta (Logística)
  amber: [217, 119, 6],    // Ámbar (Maquinaria)
  green: [34, 197, 94],    // Verde (ParteDiario)
  fuchsia: [217, 70, 239], // Fucsia (Personal)
  gray: [107, 114, 128],
  lightGray: [243, 244, 246],
  white: [255, 255, 255],
  dark: [17, 24, 39],
};
```

### 📄 Uso en Módulos de Negocio

#### ParteDiario.tsx
```typescript
const handleExportPDF = async () => {
  const doc = new jsPDF();
  const ctx = createPdfContext(doc, logoData, PDF_COLORS.green);
  
  ctx.addCorporatePageHeader('PARTE DIARIO', `${formatFechaLarga(fecha)}`);
  
  // Bloque A: Estados de Finca
  pdfCorporateSection(ctx, 'A. ESTADO GENERAL DE LA FINCA');
  pdfCorporateTable(ctx, 
    ['Parcela', 'Estado', 'Observaciones'], 
    [80, 40, 60],
    estadosFincaRows
  );
  
  // Bloque B: Trabajos
  pdfCorporateSection(ctx, 'B. TRABAJOS REALIZADOS');
  // ... más contenido
  
  applyCorporateFootersAllPages(doc, new Date());
  doc.save(`parte-diario-${fecha}.pdf`);
};
```

#### Flujo Corporativo:
```
1. initPdf() → crea jsPDF + carga logo (45mm x 45mm)
2. createPdfContext() → envoltura con checkPage(), addCorporatePageHeader()
3. Cada módulo agrega su contenido (tablas, secciones)
4. applyCorporateFootersAllPages() → pie en todas las páginas
   - Firma: "Agrícola Marvic 360"
   - Página X de Y
   - Fecha/hora
5. doc.save() → descarga archivo
```

#### Beneficios:
✅ **Branding consistente**: Logo + colores en todos los PDFs  
✅ **Escalabilidad**: Nuevos módulos reutilizan utilidades  
✅ **Mantenimiento**: Cambio de logo/colors = 1 lugar  
✅ **Multipágina**: Headers/footers automáticos  

---

## Archivos Críticos

### 🔴 Top 5 Archivos para Estabilidad del Sistema

| # | Archivo | LOC | Criticidad | Razón | Acción Recomendada |
|---|---------|-----|-----------|-------|-------------------|
| 1 | `src/integrations/supabase/client.ts` | ~15 | 🔴 CRÍTICA | Punto de entrada para TODAS las queries a BD. Si falla = sin datos en ningún módulo | Backup de config, versionado estricto, tests de conexión |
| 2 | `src/integrations/supabase/types.ts` | 3047 | 🔴 CRÍTICA | Define tipos de TODAS las tablas (auto-generado). Cambios rompen TypeScript en múltiples hooks | NO EDITAR MANUALMENTE; regenerar con CLI oficial de Supabase |
| 3 | `src/utils/pdfUtils.ts` | 459 | 🔴 CRÍTICA | Utilidad centralizada para 6+ módulos (ParteDiario, Trabajos, Maquinaria, Logística, Personal, ExportarPDF). Bug = todos los PDFs rotos | Cobertura >95% de tests, versionado semántico strict |
| 4 | `src/hooks/useParcelData.ts` | 786 | 🟠 ALTA | Hook más grande (786 LOC) usado por Trabajos, FarmMap. Contiene 25+ queries. Refactorización pendiente | REFACTORIZAR EN SUB-HOOKS (useParcelas, usePlantings, useCrops, useHarvests, useResiduos) |
| 5 | `src/pages/Trabajos.tsx` | 1202 | 🟠 ALTA | Página más compleja. Orquesta 5 hooks + componentes base. Centro del flujo de negocio | Dividir en sub-componentes (TabRegistros, TabIncidencias, TabPlanificacion, TabCampana) |

### 📊 Matriz de Dependencias Críticas

```
client.ts (15 LOC) ← NÚCLEO CENTRAL
    ↓
    ├→ Todos los hooks (9 archivos, 4300 LOC)
    ├→ ExportarPDF.tsx (queries directas)
    └→ Todas las páginas de negocio (10 archivos)

pdfUtils.ts (459 LOC) ← UTILITY HUB
    ↓
    ├→ ParteDiario.tsx
    ├→ Trabajos.tsx
    ├→ Maquinaria.tsx
    ├→ Logistica.tsx
    ├→ Personal.tsx
    └→ ExportarPDF.tsx

useParcelData.ts (786 LOC) ← BUSINESS LOGIC HUB
    ↓
    ├→ Trabajos.tsx (importa 5 hooks)
    └→ FarmMap.tsx
```

---

## Guía de Escalabilidad

### 🚀 Agregar un Nuevo Módulo (e.g., "Trazabilidad")

#### 1. Crear Tabla en PostgreSQL (Supabase Console)

```sql
CREATE TABLE trazabilidad_registros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finca TEXT NOT NULL,
  lote TEXT NOT NULL,
  cultivo TEXT NOT NULL,
  fase_produccion TEXT,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  notas TEXT,
  foto_url TEXT,
  estado TEXT DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  
  CONSTRAINT fk_finca FOREIGN KEY(finca) 
    REFERENCES fincas_data(nombre)
);

ALTER TABLE trazabilidad_registros 
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trazabilidad visible to members"
ON trazabilidad_registros
FOR SELECT USING (
  finca IN (SELECT fincas FROM user_fincas WHERE user_id = auth.uid())
);
```

#### 2. Regenerar Types

```bash
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

#### 3. Crear Hook (src/hooks/useTrazabilidad.ts)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type TrazabilidadRegistro = Tables<'trazabilidad_registros'>;

export function useTrazabilidadRegistros() {
  return useQuery({
    queryKey: ['trazabilidad'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trazabilidad_registros')
        .select('*')
        .order('fecha_inicio', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddTrazabilidad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (registro: Tables<'trazabilidad_registros'>) => {
      const { data, error } = await supabase
        .from('trazabilidad_registros')
        .insert([registro])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trazabilidad'] });
    },
  });
}

export function useDeleteTrazabilidad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('trazabilidad_registros')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trazabilidad'] });
    },
  });
}
```

#### 4. Crear Página (src/pages/Trazabilidad.tsx)

```typescript
import React, { useState } from 'react';
import { useTrazabilidadRegistros, useAddTrazabilidad } from '@/hooks/useTrazabilidad';
import { SelectWithOther, PhotoAttachment, RecordActions } from '@/components/base';
import AppLayout from '@/components/AppLayout';

export default function Trazabilidad() {
  const { data: registros, isLoading } = useTrazabilidadRegistros();
  const { mutate: addRegistro } = useAddTrazabilidad();
  const [showForm, setShowForm] = useState(false);

  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Trazabilidad de Lotes</h1>
        
        {showForm && (
          <form onSubmit={(e) => {
            e.preventDefault();
            addRegistro({ /* datos */ });
            setShowForm(false);
          }}>
            <SelectWithOther label="Finca" options={FINCAS_NOMBRES} />
            <PhotoAttachment label="Foto de lote" bucket="trazabilidad" />
            <button type="submit">Guardar</button>
          </form>
        )}

        {registros?.map(registro => (
          <div key={registro.id} className="border p-4 rounded mb-4">
            <h3>{registro.cultivo}</h3>
            <RecordActions 
              onDelete={() => deleteRegistro(registro.id)}
            />
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
```

#### 5. Agregar Ruta en App.tsx

```typescript
import Trazabilidad from "./pages/Trazabilidad";

<Route path="/trazabilidad" element={<Trazabilidad />} />
```

#### 6. Agregar en Navigation (constants/navItems.ts)

```typescript
{
  label: 'Trazabilidad',
  href: '/trazabilidad',
  icon: Leaf,
  activo: true,
}
```

### ✅ Resultado:
- Nuevo módulo integrado completamente
- Hereda patrones: Custom hooks, componentes base, PDF exports
- ~200 LOC para funcionalidad completa
- Listo para escalar a múltiples fincas

---

## 🔧 Configuración de Desarrollo

### Variables de Entorno (.env.local)

```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[public-key]
```

### Comandos Útiles

```bash
# Desarrollo
npm run dev                 # Inicia servidor Vite (localhost:8080)

# Build
npm run build              # Compilar para producción
npm run build:dev          # Compilar en modo desarrollo (debug maps)

# Tests
npm test                   # Ejecutar tests una vez
npm run test:watch        # Watch mode

# Linting
npm run lint              # ESLint + prettier check

# Capacitor (Mobile)
npm run capacitor build   # Compilar para iOS/Android
```

---

## 📈 Métricas del Sistema

| Métrica | Valor |
|---------|-------|
| **Líneas de código (hooks)** | ~4,300 |
| **Líneas de código (tipos BD)** | 3,047 |
| **Páginas principales** | 15 |
| **Módulos de negocio** | 11 (100% funcionales, 0 WIP) |
| **Componentes base reutilizables** | 4 |
| **Tablas en BD** | 50+ |
| **Fincas gestoras** | 7 (211.94 ha, 119 sectores) |
| **Bundle size (optimizado)** | ~450 KB (gzipped) |
| **Puntuación de rendimiento** | Lighthouse: 88+ (mobile), 94+ (desktop) |

---

## 🚨 Checklist de Estabilidad

- [ ] `client.ts` tiene tests de conexión
- [ ] `types.ts` se regenera automáticamente con CI/CD
- [ ] `pdfUtils.ts` tiene >95% test coverage
- [ ] Hooks tienen error handling en todas las queries
- [ ] Components base tienen prop validation (TypeScript)
- [ ] RLS policies se testean antes de deploy
- [ ] Backups de DB configurados (Supabase)
- [ ] Monitoring de errores activado (Sentry o similar)
- [ ] Rate limiting en API (si aplica)
- [ ] Versioning semántico de dependencias críticas

---

**Documento Versión**: 1.0  
**Última actualización**: Abril 2026  
**Proyecto**: Agrícola Marvic 360 ERP  
**Arquitecto de referencia**: JuanPe (Director Técnico)
