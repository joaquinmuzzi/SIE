import { jsPDF } from 'jspdf';
import { ESCUDO_ET35, ESCUDO_PROPORCION } from './escudoEt35.js';

// PDF de un informe a un alumno: sigue el formulario en papel "Informe de Convivencia" de la escuela.
// Cada punto del formulario se completa con los datos del sistema; lo que falta queda con lineas
// punteadas para completar a mano, igual que las firmas y las fechas de notificacion.
// Es autocontenido (sin JSX) para poder probarlo fuera de la aplicacion.

const ROLES = {
  profesor: 'Profesor', preceptor: 'Preceptor', regente: 'Regente', gestor: 'Gestor', directivo: 'Directivo',
  secretaria: 'Secretaría', asesoria_pedagogica: 'Asesoría / DOE / PAT', doe: 'DOE', pat: 'PAT', alumno: 'Alumno',
};
const INSTANCIAS = [['leve', '1ª Instancia', 'LEVE'], ['alta', '2ª Instancia', 'GRAVE'], ['muy_alta', '3ª Instancia', 'MUY GRAVE']];
const CURSO_RE = /^\s*(\d+)\s*°?\s*(\d+|[A-Za-z])\s*°?\s*$/;
const NEGRO = [20, 20, 20];

const nombre = (p) => [p?.nombre, p?.apellido].filter(Boolean).join(' ');
const fecha = (f) => (f ? new Date(f).toLocaleDateString('es-AR') : '');
const fechaHora = (f) => new Date(f).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

export function generarFormularioConvivencia(report) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const H = 297;
  const M = 20;
  const ancho = W - M * 2;
  const limiteY = H - 20;
  const paso = 5.6;
  let y = 0;
  const color = (c) => doc.setTextColor(c[0], c[1], c[2]);

  const nuevaPagina = () => { doc.addPage(); y = 22; };
  const asegurar = (alto) => { if (y + alto > limiteY) nuevaPagina(); };
  const punteada = (x1, x2, yy) => {
    doc.setDrawColor(90, 90, 90).setLineWidth(0.35).setLineDashPattern([0.25, 1.4], 0);
    doc.line(x1, yy, x2, yy);
    doc.setLineDashPattern([], 0);
  };
  // "rotulo ..... dato .....": el dato se escribe sobre la linea punteada
  const campo = (rotulo, valor, x, x2, yy, negrita = false) => {
    color(NEGRO);
    doc.setFont('helvetica', 'normal').setFontSize(10).text(rotulo, x, yy);
    const xi = x + doc.getTextWidth(rotulo) + 1.5;
    punteada(xi, x2, yy + 0.8);
    if (valor) {
      doc.setFont('helvetica', negrita ? 'bold' : 'normal').setFontSize(10.5);
      doc.text(doc.splitTextToSize(String(valor), x2 - xi - 2)[0], xi + 1.5, yy - 0.6);
    }
  };
  const subtitulo = (texto) => {
    asegurar(18);
    color(NEGRO);
    doc.setFont('helvetica', 'bolditalic').setFontSize(11).text(texto, M, y);
    y += paso;
  };
  // Texto sobre renglones punteados; sin texto, renglones vacios para completar a mano
  const renglones = (texto, vacios) => {
    doc.setFont('helvetica', 'normal').setFontSize(10.5);
    const lineas = texto ? doc.splitTextToSize(texto, ancho - 4) : Array(vacios).fill('');
    lineas.forEach((l) => {
      asegurar(paso);
      punteada(M, W - M, y + 1.2);
      if (l) {
        color(NEGRO);
        doc.setFont('helvetica', 'normal').setFontSize(10.5).text(l, M + 1, y);
      }
      y += paso;
    });
    y += 2;
  };

  // ---- Encabezado institucional
  color(NEGRO);
  const anchoEscudo = 17;
  doc.addImage(ESCUDO_ET35, 'JPEG', W / 2 - anchoEscudo / 2, 8, anchoEscudo, anchoEscudo * ESCUDO_PROPORCION);
  doc.setFont('helvetica', 'bold').setFontSize(8);
  doc.text('GOBIERNO DE LA CIUDAD AUTÓNOMA DE BUENOS AIRES', W / 2, 34, { align: 'center' });
  doc.text('MINISTERIO DE EDUCACIÓN', W / 2, 38, { align: 'center' });
  doc.setFont('helvetica', 'normal').setFontSize(8);
  doc.text('E.T. Nº 35 D.E. 18, "Ing. Eduardo Latzina"', W / 2, 42, { align: 'center' });
  doc.setFont('helvetica', 'bold').setFontSize(12).text('INFORME DE CONVIVENCIA', W / 2, 50, { align: 'center' });
  const tw = doc.getTextWidth('INFORME DE CONVIVENCIA');
  doc.setDrawColor(20, 20, 20).setLineWidth(0.4).line(W / 2 - tw / 2, 51.2, W / 2 + tw / 2, 51.2);
  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(110, 110, 110);
  const ref = `N.º ${String(report._id).padStart(5, '0')}${report.titulo ? ` · ${report.titulo}` : ''}`;
  doc.text(doc.splitTextToSize(ref, ancho)[0], W / 2, 56, { align: 'center' });
  y = 64;

  // ---- 1. Alumno, año y division
  const m = CURSO_RE.exec(report.alumno?.curso || '');
  campo('1.- El alumno/a', nombre(report.alumno), M, 128, y, true);
  campo('de', m ? `${m[1]}°` : '', 130, 152, y);
  campo('Año', m ? `${m[2]}°` : report.alumno?.curso || '', 154, 176, y);
  doc.setFont('helvetica', 'normal').setFontSize(10).text('División', 177, y);
  y += paso + 2;

  // ---- 2. Accion realizada (texto del profesor)
  doc.setFont('helvetica', 'normal').setFontSize(10).text('2.- ha realizado la acción que se describe a continuación:', M, y);
  y += paso;
  renglones(report.texto_profesor, 4);
  asegurar(paso);
  color(NEGRO);
  doc.setFont('helvetica', 'normal').setFontSize(10).text('transgrediendo Normas del Reglamento de Convivencia de la escuela.', M, y);
  y += paso + 2;

  // ---- 3. Solicitud de sancion (quien creo el informe)
  subtitulo('3.- Solicitud de sanción:');
  const cargo = report.creadoPor?.cargo || ROLES[report.creadoPor?.rol] || report.creadoPor?.rol || '';
  campo('Docente:', nombre(report.creadoPor), M + 6, 80, y);
  campo('Cargo/función:', cargo, 82, 128, y);
  campo('Fecha:', fecha(report.fecha), 130, 164, y);
  campo('Firma:', '', 166, W - M, y);
  y += paso + 3;

  // ---- 4 a 7. La regencia escribe en el consejo que corresponde al tipo; si es de conducta, en observaciones
  const regente = report.texto_regente || '';
  const enAula = report.tipo === 'consejo_aula' ? regente : '';
  const enConvivencia = report.tipo === 'consejo_convivencia' ? regente : '';
  const observaciones = [
    !enAula && !enConvivencia && regente && `Regencia: ${regente}`,
    report.texto_pat && `PAT: ${report.texto_pat}`,
  ].filter(Boolean).join('\n');

  subtitulo('4.- Descargo del Alumno/a:');
  renglones(report.descargo_alumno || (report.descargo_vencido ? 'No presentó descargo dentro del plazo.' : ''), 4);
  subtitulo('5.- Informe de Consejo de Aula');
  renglones(enAula, 2);
  subtitulo('6.- Informe de Consejo de Convivencia');
  renglones(enConvivencia, 2);
  subtitulo('7.- Observaciones');
  renglones(observaciones, 3);

  // ---- 8. Instancia: se marca la gravedad asignada por la regencia
  asegurar(42);
  color(NEGRO);
  const rot8 = '8.- Se considera que corresponde:';
  doc.setFont('helvetica', 'normal').setFontSize(10).text(rot8, M, y);
  const w8 = doc.getTextWidth(rot8);
  doc.setFontSize(8).text('(Indicar a continuación)', M + w8 + 2, y);
  y += paso + 5;
  INSTANCIAS.forEach(([clave, inst, grav], k) => {
    const cx = M + 26 + k * 59;
    doc.setFont('helvetica', 'italic').setFontSize(10.5);
    const t1 = `${inst}  `;
    const w1 = doc.getTextWidth(t1);
    doc.setFont('helvetica', 'bolditalic');
    const w = w1 + doc.getTextWidth(grav);
    doc.setFont('helvetica', 'italic').text(t1, cx - w / 2, y);
    doc.setFont('helvetica', 'bolditalic').text(grav, cx - w / 2 + w1, y);
    if (report.gravedad === clave) {
      doc.setDrawColor(20, 20, 20).setLineWidth(0.5).roundedRect(cx - w / 2 - 3, y - 5, w + 6, 7.5, 3, 3);
    }
  });
  y += paso + 5;
  campo('Otra Consideración:', '', M + 8, W - M, y);
  y += paso + 6;
  campo('Firma Directivo:', '', 92, 160, y);
  campo('Fecha:', '', 162, W - M, y);
  y += paso + 6;

  // ---- 9. Notificacion: firmas a mano
  asegurar(24);
  color(NEGRO);
  doc.setFont('helvetica', 'bolditalic').setFontSize(11).text('9.- Notificación:', M, y);
  y += paso + 2;
  campo('Alumno:', '', M + 18, 118, y);
  campo('Fecha:', '', 140, W - M, y);
  y += paso + 1;
  campo('Padre/Madre/Tutor:', '', M + 18, 118, y);
  campo('Fecha:', '', 140, W - M, y);

  // ---- Pie
  const total = doc.getNumberOfPages();
  const generado = fechaHora(new Date());
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(130, 130, 130);
    doc.text(`Generado desde SIE el ${generado}`, M, H - 10);
    doc.text(`Página ${p} de ${total}`, W - M, H - 10, { align: 'right' });
  }
  return doc;
}
