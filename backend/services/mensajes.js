// Textos de los correos del sistema. Los avisos de informes llevan solo un resumen
// (titulo, gravedad, plazo): el contenido completo se ve unicamente dentro de la app.
const APP_URL = () => process.env.APP_URL || 'https://sistemadegestiondeinformes.netlify.app';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const GRAVEDAD = { leve: 'Leve', alta: 'Alta', muy_alta: 'Muy alta' };
const ESTADO = { abierto: 'Abierto', en_revision: 'En revisión', cerrado: 'Cerrado' };
const fechaLarga = (d) => new Date(d).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' });

function armar(asunto, parrafos, boton) {
  const texto = [...parrafos, boton ? `${boton.texto}: ${boton.url}` : '', '', 'Sistema de Informes Escolares - E.T. N.º 35'].filter((x) => x !== '').join('\n\n');
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;color:#1f2937">
    <h2 style="color:#7f1d1d;border-bottom:2px solid #7f1d1d;padding-bottom:8px">Sistema de Informes Escolares</h2>
    ${parrafos.map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('')}
    ${boton ? `<p><a href="${esc(boton.url)}" style="background:#7f1d1d;color:#fff;padding:10px 18px;text-decoration:none">${esc(boton.texto)}</a></p>` : ''}
    <p style="color:#6b7280;font-size:12px">E.T. N.º 35 · Este es un mensaje automático, no lo respondas.</p></div>`;
  return { asunto, texto, html };
}

const claveTemporal = ({ nombre, email, clave, restablecida }) =>
  armar(restablecida ? 'SIE: tu contraseña fue restablecida' : 'SIE: tu cuenta fue creada', [
    `Hola ${nombre}:`,
    restablecida ? 'Se restableció la contraseña de tu cuenta del Sistema de Informes Escolares.' : 'Se creó tu cuenta en el Sistema de Informes Escolares.',
    `Usuario: ${email}\nContraseña temporal: ${clave}`,
    'Es una contraseña temporal y de un solo uso: al ingresar por primera vez el sistema te va a pedir que elijas una nueva.',
  ], { texto: 'Ingresar al sistema', url: APP_URL() });

const avisoDescargoAlumno = ({ nombre, informe, limite }) =>
  armar('SIE: tenés un informe y podés presentar tu descargo', [
    `Hola ${nombre}:`,
    `Se registró un informe a tu nombre: «${informe.titulo}» (gravedad: ${GRAVEDAD[informe.gravedad] || informe.gravedad}).`,
    `Tenés derecho a dar tu versión de los hechos. Podés escribir tu descargo en el sistema hasta el ${fechaLarga(limite)}. Pasada esa fecha, el informe sigue su curso sin tu testimonio.`,
  ], { texto: 'Escribir mi descargo', url: APP_URL() });

const recordatorioDescargo = ({ nombre, informe, limite }) =>
  armar('SIE: recordatorio, falta tu descargo', [
    `Hola ${nombre}:`,
    `Todavía no presentaste tu descargo sobre el informe «${informe.titulo}». El plazo vence el ${fechaLarga(limite)}.`,
  ], { texto: 'Escribir mi descargo', url: APP_URL() });

const descargoVencido = ({ nombre, informe }) =>
  armar('SIE: venció el plazo del descargo', [
    `Hola ${nombre}:`,
    `Venció el plazo para presentar tu descargo sobre el informe «${informe.titulo}». El informe pasó a revisión y ya no se pueden cargar descargos.`,
    'Si necesitás hacer una aclaración, hablá con la regencia de tu turno.',
  ]);

const avisoResponsable = ({ nombreResponsable, nombreAlumno, informe, limite }) =>
  armar(`SIE: nuevo informe de ${nombreAlumno}`, [
    `Hola ${nombreResponsable}:`,
    `Se registró un informe sobre ${nombreAlumno}: «${informe.titulo}» (gravedad: ${GRAVEDAD[informe.gravedad] || informe.gravedad}).`,
    limite ? `${nombreAlumno} puede presentar su descargo hasta el ${fechaLarga(limite)}.` : '',
    'Para conocer el detalle, comunicate con la escuela.',
  ].filter(Boolean));

const cambioEstadoResponsable = ({ nombreResponsable, nombreAlumno, informe, estado }) =>
  armar(`SIE: el informe de ${nombreAlumno} cambió de estado`, [
    `Hola ${nombreResponsable}:`,
    `El informe «${informe.titulo}» sobre ${nombreAlumno} ahora está: ${ESTADO[estado] || estado}.`,
  ]);

module.exports = { claveTemporal, avisoDescargoAlumno, recordatorioDescargo, descargoVencido, avisoResponsable, cambioEstadoResponsable };
