import { jsPDF } from 'jspdf';

// PDF del informe: encabezado institucional, datos en recuadro, una seccion por intervencion y pie con paginacion.
// Es autocontenido (sin JSX) para poder probarlo fuera de la aplicacion.

const MARRON = [122, 31, 43];
const TINTA = [30, 41, 59];
const GRIS = [100, 116, 139];
const LINEA = [226, 232, 240];
const FONDO = [248, 250, 252];

const TIPOS = { conducta: 'Conducta', consejo_aula: 'Consejo de Aula', consejo_convivencia: 'Consejo Escolar de Convivencia' };
const GRAVEDADES = { leve: 'Leve', alta: 'Alta', muy_alta: 'Muy alta' };
const ESTADOS = { abierto: 'Abierto', en_revision: 'En revisión', cerrado: 'Cerrado' };
const ROLES = {
  profesor: 'Profesor', preceptor: 'Preceptor', regente: 'Regente', gestor: 'Gestor', directivo: 'Directivo',
  secretaria: 'Secretaría', asesoria_pedagogica: 'Asesoría / DOE / PAT', doe: 'DOE', pat: 'PAT', alumno: 'Alumno',
};
const ESTILO_GRAVEDAD = { leve: [[71, 85, 105], [241, 245, 249]], alta: [[146, 64, 14], [254, 243, 199]], muy_alta: [[153, 27, 27], [254, 226, 226]] };
const ESTILO_ESTADO = { abierto: [[15, 118, 110], [204, 251, 241]], en_revision: [[67, 56, 202], [224, 231, 255]], cerrado: [[71, 85, 105], [226, 232, 240]] };
const VOCES = [
  ['texto_profesor', 'Intervención del profesor', [2, 132, 199]],
  ['texto_regente', 'Intervención de la regencia', MARRON],
  ['texto_pat', 'Intervención del PAT', [124, 58, 237]],
  ['descargo_alumno', 'Descargo del alumno', [217, 119, 6]],
];

const nombre = (p) => [p?.nombre, p?.apellido].filter(Boolean).join(' ');
const fecha = (f) => (f ? new Date(f).toLocaleDateString('es-AR') : '—');
const fechaHora = (f) => new Date(f).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

export function generarInformePdf(report) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const H = 297;
  const M = 18;
  const ancho = W - M * 2;
  const limiteY = H - 22;
  let y = 0;

  const color = (c) => doc.setTextColor(c[0], c[1], c[2]);
  const relleno = (c) => doc.setFillColor(c[0], c[1], c[2]);

  const nuevaPagina = () => {
    doc.addPage();
    y = M;
  };
  const asegurar = (alto) => {
    if (y + alto > limiteY) nuevaPagina();
  };

  // ---- Encabezado
  relleno(MARRON);
  doc.rect(0, 0, W, 34, 'F');
  relleno([255, 255, 255]);
  doc.rect(M, 9, 16, 16, 'F');
  color(MARRON);
  doc.setFont('helvetica', 'bold').setFontSize(15);
  doc.text('35', M + 8, 19.5, { align: 'center' });
  color([255, 255, 255]);
  doc.setFontSize(13).text('Escuela Técnica N° 35', M + 21, 15.5);
  doc.setFont('helvetica', 'normal').setFontSize(9).text('Sistema de Informes Escolares', M + 21, 21);
  doc.setFont('helvetica', 'bold').setFontSize(10).text('INFORME ESCOLAR', W - M, 14.5, { align: 'right' });
  doc.setFont('helvetica', 'normal').setFontSize(9).text(`N.º ${String(report._id).padStart(5, '0')}`, W - M, 20, { align: 'right' });
  y = 46;

  // ---- Titulo y etiquetas
  color(TINTA);
  doc.setFont('helvetica', 'bold').setFontSize(18);
  const titulo = doc.splitTextToSize(report.titulo || 'Sin título', ancho);
  doc.text(titulo, M, y);
  y += titulo.length * 7.5 + 1;

  const etiqueta = (texto, [txt, fondo], x) => {
    doc.setFont('helvetica', 'bold').setFontSize(8.5);
    const w = doc.getTextWidth(texto) + 7;
    relleno(fondo);
    doc.roundedRect(x, y, w, 6.5, 1, 1, 'F');
    color(txt);
    doc.text(texto, x + 3.5, y + 4.5);
    return x + w + 3;
  };
  let x = M;
  x = etiqueta(`Gravedad: ${GRAVEDADES[report.gravedad] || report.gravedad}`, ESTILO_GRAVEDAD[report.gravedad] || ESTILO_GRAVEDAD.leve, x);
  x = etiqueta(`Estado: ${ESTADOS[report.estado] || report.estado}`, ESTILO_ESTADO[report.estado] || ESTILO_ESTADO.abierto, x);
  etiqueta(TIPOS[report.tipo] || report.tipo, [GRIS, LINEA], x);
  y += 13;

  // ---- Datos del informe (recuadro de dos columnas)
  const individual = report.alcance === 'individual';
  const destinatario = individual ? nombre(report.alumno) || 'Sin asignar' : report.alcance === 'curso' ? `Curso ${report.curso_destino}` : 'Toda la comunidad';
  const datos = [
    ['Dirigido a', destinatario],
    [individual ? 'Curso' : 'Alcance', individual ? report.alumno?.curso || '—' : report.alcance === 'curso' ? 'Informe de curso' : 'Informe general'],
    individual && ['Responsable', report.alumno?.responsable_nombre || 'Sin cargar'],
    ['Fecha de emisión', fecha(report.fecha)],
    ['Creado por', `${nombre(report.creadoPor)}${report.creadoPor?.rol ? ` (${ROLES[report.creadoPor.rol] || report.creadoPor.rol})` : ''}`],
    individual && report.fecha_limite_descargo && [
      'Plazo de descargo',
      `${fecha(report.fecha_limite_descargo)}${report.descargo_alumno ? ' · presentado' : report.descargo_vencido ? ' · vencido' : ''}`,
    ],
  ].filter(Boolean);
  const filas = Math.ceil(datos.length / 2);
  const altoCaja = filas * 13 + 5;
  relleno(FONDO);
  doc.setDrawColor(LINEA[0], LINEA[1], LINEA[2]);
  doc.rect(M, y, ancho, altoCaja, 'FD');
  datos.forEach(([k, v], i) => {
    const cx = M + 5 + (i % 2) * (ancho / 2);
    const cy = y + 7 + Math.floor(i / 2) * 13;
    color(GRIS);
    doc.setFont('helvetica', 'bold').setFontSize(7.5).text(k.toUpperCase(), cx, cy);
    color(TINTA);
    doc.setFont('helvetica', 'normal').setFontSize(10.5);
    doc.text(doc.splitTextToSize(v, ancho / 2 - 8)[0], cx, cy + 5);
  });
  y += altoCaja + 10;

  // ---- Secciones de intervencion
  const lineasDe = (texto) => doc.setFont('helvetica', 'normal').setFontSize(10.5) && doc.splitTextToSize(texto, ancho - 10);
  const paso = 5.4;
  doc.setLineHeightFactor((paso * 72) / 25.4 / 10.5); // el interlineado real coincide con el alto que se reserva
  const secciones = VOCES.filter(([campo]) => report[campo]);
  if (!secciones.length) {
    color(GRIS);
    doc.setFont('helvetica', 'italic').setFontSize(10).text('Este informe todavía no tiene intervenciones.', M, y);
    y += 8;
  }
  secciones.forEach(([campo, rotulo, c]) => {
    asegurar(24);
    color(c);
    doc.setFont('helvetica', 'bold').setFontSize(9).text(rotulo.toUpperCase(), M + 5, y);
    y += 5;
    const lineas = lineasDe(report[campo]);
    let i = 0;
    while (i < lineas.length) {
      asegurar(paso + 2);
      const caben = Math.max(1, Math.floor((limiteY - y) / paso));
      const trozo = lineas.slice(i, i + caben);
      relleno(c);
      doc.rect(M, y - 4, 1.4, trozo.length * paso + 1, 'F');
      color(TINTA);
      doc.setFont('helvetica', 'normal').setFontSize(10.5);
      doc.text(trozo, M + 5, y);
      y += trozo.length * paso;
      i += trozo.length;
      if (i < lineas.length) nuevaPagina();
    }
    y += 8;
  });

  // ---- Pie de todas las paginas
  const total = doc.getNumberOfPages();
  const generado = fechaHora(new Date());
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setDrawColor(LINEA[0], LINEA[1], LINEA[2]).line(M, H - 15, W - M, H - 15);
    color(GRIS);
    doc.setFont('helvetica', 'normal').setFontSize(8);
    doc.text('SIE · Escuela Técnica N° 35 — Documento generado desde el sistema', M, H - 10);
    doc.text(`${generado}  ·  Página ${p} de ${total}`, W - M, H - 10, { align: 'right' });
    if (report.estado === 'cerrado') {
      color(GRIS);
      doc.setFontSize(7.5).text('Informe cerrado: se conserva como antecedente.', M, H - 6);
    }
  }
  return doc;
}
