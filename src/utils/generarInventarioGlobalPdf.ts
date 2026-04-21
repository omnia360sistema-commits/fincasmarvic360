import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { loadImageInv } from '@/utils/inventarioPdfHelpers';

type RegConRel = {
  id: string;
  ubicacion_id: string;
  categoria_id: string;
  cantidad: number;
  unidad: string;
  descripcion: string | null;
  foto_url: string | null;
  foto_url_2: string | null;
  notas: string | null;
  created_at: string;
  precio_unitario: number | null;
  responsable: string | null;
  inventario_ubicaciones: { nombre: string } | null;
  inventario_categorias: { nombre: string } | null;
};

export async function generarInventarioGlobalPdf(options: {
  fechaDesde: string;
  fechaHasta: string;
  selUbics: Set<string>;
  selCats: Set<string>;
}): Promise<void> {
  const { fechaDesde, fechaHasta, selUbics, selCats } = options;
  if (selUbics.size === 0 || selCats.size === 0) return;

  const doc    = new jsPDF();
  const margin = 15;
  const maxW   = 180;
  const lh     = 6;
  let y        = 25;
  const logo = await loadImageInv('/MARVIC_logo.png');

  function addLogoToPage() {
    if (!logo) return;
    const lw  = 38;
    const lh2 = lw * (logo.h / logo.w);
    doc.addImage(logo.data, 'JPEG', 210 - margin - lw, 6, lw, lh2);
  }

  const checkPage = (needed = 10) => {
    if (y + needed > 272) { doc.addPage(); y = 25; addLogoToPage(); }
  };

  const writeLine = (text: string, bold = false, size = 9) => {
    checkPage();
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, maxW) as string[];
    doc.text(lines, margin, y);
    y += lines.length * lh;
  };

  const separator = () => {
    checkPage(4);
    doc.setDrawColor(160);
    doc.line(margin, y, margin + maxW, y);
    y += lh;
  };

  addLogoToPage();
  writeLine('INFORME GLOBAL DE INVENTARIO — AGRÍCOLA MARVIC 360', true, 13);
  y += 2;
  writeLine(`Período: ${fechaDesde} → ${fechaHasta}`);
  writeLine(`Generado el: ${new Date().toLocaleString('es-ES')}`);
  y += 4;
  separator();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: registros, error } = await (supabase as any)
    .from('inventario_registros')
    .select('*, inventario_ubicaciones(nombre), inventario_categorias(nombre)')
    .in('ubicacion_id', Array.from(selUbics))
    .in('categoria_id', Array.from(selCats))
    .gte('created_at', fechaDesde + 'T00:00:00')
    .lte('created_at', fechaHasta + 'T23:59:59')
    .order('ubicacion_id')
    .order('categoria_id')
    .order('created_at', { ascending: false });

  if (error) throw error;
  const rows: RegConRel[] = registros ?? [];

  if (rows.length === 0) {
    writeLine('Sin registros para el período y filtros seleccionados.', false, 10);
  } else {
    const porUbic = new Map<string, RegConRel[]>();
    for (const r of rows) {
      if (!porUbic.has(r.ubicacion_id)) porUbic.set(r.ubicacion_id, []);
      porUbic.get(r.ubicacion_id)!.push(r);
    }
    for (const [, regsUbic] of porUbic) {
      const nombreUbic = regsUbic[0]?.inventario_ubicaciones?.nombre ?? '—';
      checkPage(16);
      writeLine(`UBICACIÓN: ${nombreUbic.toUpperCase()}`, true, 11);
      y += 2;
      const porCat = new Map<string, RegConRel[]>();
      for (const r of regsUbic) {
        if (!porCat.has(r.categoria_id)) porCat.set(r.categoria_id, []);
        porCat.get(r.categoria_id)!.push(r);
      }
      for (const [, regsCat] of porCat) {
        const nombreCat = regsCat[0]?.inventario_categorias?.nombre ?? '—';
        checkPage(12);
        writeLine(`Categoría: ${nombreCat} (${regsCat.length} reg.)`, true, 9);
        y += 1;
        for (const r of regsCat) {
          checkPage(10);
          const fecha = new Date(r.created_at).toLocaleDateString('es-ES');
          writeLine(`  ${fecha}  ·  ${r.cantidad} ${r.unidad}${r.descripcion ? `  ·  ${r.descripcion}` : ''}`);
          if (r.precio_unitario) writeLine(`  Precio: ${r.precio_unitario.toFixed(2)} €`);
          if (r.notas)          writeLine(`  Notas: ${r.notas}`);
          y += 1;
        }
        y += 2;
      }
      separator();
    }
    writeLine(`Total registros: ${rows.length}`, true);
  }

  doc.save(`Inventario_Global_${fechaDesde}_${fechaHasta}.pdf`);
}
