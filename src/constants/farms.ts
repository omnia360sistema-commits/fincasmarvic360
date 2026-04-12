export interface FincaData {
  nombre: string;
  sectores: number;
  ha: number;
}

export const FINCAS_DATA: FincaData[] = [
  { nombre: 'LA CONCEPCION', sectores: 23, ha: 27.76 },
  { nombre: 'LONSORDO', sectores: 7, ha: 10.83 },
  { nombre: 'BRAZO DE LA VIRGEN', sectores: 4, ha: 7.05 },
  { nombre: 'COLLADOS', sectores: 18, ha: 45.79 },
  { nombre: 'EL CARMEN', sectores: 4, ha: 13.38 },
  { nombre: 'FRANCES', sectores: 4, ha: 21.35 },
  { nombre: 'LA ALMAJALETA', sectores: 2, ha: 1.08 },
  { nombre: 'LA BARDA', sectores: 28, ha: 74.24 },
  { nombre: 'LA NUEVA', sectores: 14, ha: 17.53 },
  { nombre: 'LOS CLRERIGOS', sectores: 7, ha: 9.32 },
  { nombre: 'MAYORAZGO', sectores: 17, ha: 30.56 },
  { nombre: 'PASO LOBO', sectores: 4, ha: 13.70 },
  { nombre: 'TRIGUEROS', sectores: 3, ha: 2.12 },
];

export const FINCAS_NOMBRES: string[] = FINCAS_DATA.map(f => f.nombre);
