export interface FincaData {
  nombre: string;
  sectores: number;
  ha: number;
}

export const FINCAS_DATA: FincaData[] = [
  { nombre: 'LA CONCEPCION',            sectores: 24, ha: 28.37 },
  { nombre: 'LONSORDO',                 sectores: 16, ha: 10.54 },
  { nombre: 'FINCA COLLADOS',           sectores: 18, ha: 46.06 },
  { nombre: 'FINCA BRAZO DE LA VIRGEN', sectores:  4, ha:  7.08 },
  { nombre: 'FINCA LA BARDA',           sectores: 28, ha: 74.70 },
  { nombre: 'FINCA LA NUEVA',           sectores: 13, ha: 15.66 },
  { nombre: 'FINCA MAYORAZGO',          sectores: 16, ha: 29.53 },
];

export const FINCAS_NOMBRES: string[] = FINCAS_DATA.map(f => f.nombre);
