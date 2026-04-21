import jsPDF from 'jspdf';
import type { Personal, PersonalExterno, CategoriaPersonal } from '@/hooks/usePersonal';
import { CATEGORIA_LABELS, TIPO_EXTERNO_LABELS } from '@/hooks/usePersonal';

const CATEGORIAS_FIJAS_PDF: CategoriaPersonal[] = [
  'operario_campo',
  'encargado',
  'conductor_maquinaria',
  'conductor_camion',
];

export function generarPersonalListadoPdf(
  todoPersonal: Personal[],
  externos: PersonalExterno[],
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  let y = 20;

  const writeLine = (text: string, size = 9, bold = false) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    if (y > 270) { doc.addPage(); y = 20; }
    doc.text(text, 15, y);
    y += size * 0.5 + 2;
  };
  const separator = () => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setDrawColor(200, 200, 200);
    doc.line(15, y, W - 15, y);
    y += 4;
  };

  doc.setFillColor(2, 6, 23);
  doc.rect(0, 0, W, 14, 'F');
  doc.setTextColor(255, 255, 255);
  writeLine('AGRICOLA MARVIC — LISTADO DE PERSONAL', 11, true);
  doc.setTextColor(0, 0, 0);
  writeLine(new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }), 9);
  y += 4;

  for (const cat of CATEGORIAS_FIJAS_PDF) {
    const lista = todoPersonal.filter(p => p.categoria === cat);
    if (lista.length === 0) continue;
    separator();
    writeLine(CATEGORIA_LABELS[cat].toUpperCase(), 10, true);
    y += 1;
    for (const p of lista) {
      writeLine(
        `${p.activo ? 'ACTIVO' : 'BAJA'}  ${p.nombre}${p.codigo_interno ? `  [${p.codigo_interno}]` : ''}${p.dni ? `  DNI: ${p.dni}` : ''}${p.telefono ? `  Tel: ${p.telefono}` : ''}`,
        8,
      );
    }
    y += 2;
  }

  if (externos.length > 0) {
    separator();
    writeLine('MANO DE OBRA EXTERNA', 10, true);
    y += 1;
    for (const e of externos) {
      writeLine(
        `${e.activo ? 'ACTIVO' : 'BAJA'}  ${e.nombre_empresa}${e.codigo_interno ? `  [${e.codigo_interno}]` : ''}  ${TIPO_EXTERNO_LABELS[e.tipo]}${e.nif ? `  NIF: ${e.nif}` : ''}${e.telefono_contacto ? `  Tel: ${e.telefono_contacto}` : ''}`,
        8,
      );
    }
  }

  doc.save(`Personal_MARVIC_${new Date().toISOString().slice(0, 10)}.pdf`);
}
