// Ciclo de vida de los informes individuales con plazo para el descargo del alumno:
//   creado -> aviso al alumno -> recordatorio a mitad de plazo -> descargo vencido (pasa a revision) -> cierre automatico
// Las reglas son funciones puras (se prueban sin base ni mail); el "ciclo" las aplica con repositorio y mailer inyectados.
const mensajes = require('./mensajes');

const config = () => ({
  descargoDiasHabiles: parseInt(process.env.DESCARGO_DIAS_HABILES || '5', 10),
  cierreDias: parseInt(process.env.CIERRE_DIAS || '15', 10),
});

/** Suma dias habiles (lunes a viernes; no contempla feriados). Conserva la hora. */
function sumarDiasHabiles(desde, dias) {
  const fecha = new Date(desde);
  let sumados = 0;
  while (sumados < dias) {
    fecha.setDate(fecha.getDate() + 1);
    const dia = fecha.getDay();
    if (dia !== 0 && dia !== 6) sumados += 1;
  }
  return fecha;
}

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Decide que corresponde hacer con un informe en este momento.
 * @returns {'cerrar' | 'vencer' | 'recordar' | null}
 */
function evaluarInforme(informe, ahora, { cierreDias }) {
  if (informe.estado === 'cerrado' || informe.alcance !== 'individual') return null;
  // Los informes anteriores a esta funcionalidad (sin plazo de descargo) no se tocan: el ciclo solo rige para los nuevos
  if (!informe.fecha_limite_descargo) return null;

  const creado = new Date(informe.created_at);
  if (ahora >= new Date(creado.getTime() + cierreDias * DIA_MS)) return 'cerrar';

  if (informe.descargo_alumno || informe.descargo_vencido) return null;

  const limite = new Date(informe.fecha_limite_descargo);
  if (ahora >= limite) return 'vencer';

  const mitad = new Date(creado.getTime() + (limite.getTime() - creado.getTime()) / 2);
  if (!informe.recordatorio_enviado && ahora >= mitad) return 'recordar';
  return null;
}

function crearCiclo({ repositorio, mailer, ahora = () => new Date(), configuracion = config() }) {
  const nombreAlumno = (i) => `${i.alumno_nombre} ${i.alumno_apellido}`.trim();

  async function ejecutar() {
    const resumen = { recordados: 0, vencidos: 0, cerrados: 0 };
    const informes = await repositorio.listarActivos();
    const momento = ahora();

    for (const i of informes) {
      const accion = evaluarInforme(i, momento, configuracion);
      if (!accion) continue;
      const informe = { titulo: i.titulo, gravedad: i.gravedad };

      if (accion === 'recordar') {
        await repositorio.marcarRecordatorio(i.id_informe);
        const m = mensajes.recordatorioDescargo({ nombre: i.alumno_nombre, informe, limite: i.fecha_limite_descargo });
        await mailer.enviar({ para: i.alumno_email, ...m });
        resumen.recordados += 1;
      } else if (accion === 'vencer') {
        await repositorio.marcarVencido(i.id_informe);
        const m = mensajes.descargoVencido({ nombre: i.alumno_nombre, informe });
        await mailer.enviar({ para: i.alumno_email, ...m });
        resumen.vencidos += 1;
      } else {
        await repositorio.cerrar(i.id_informe);
        const m = mensajes.cambioEstadoResponsable({ nombreResponsable: i.responsable_nombre || 'familia', nombreAlumno: nombreAlumno(i), informe, estado: 'cerrado' });
        await mailer.enviar({ para: i.responsable_email, ...m });
        resumen.cerrados += 1;
      }
    }
    return resumen;
  }

  return { ejecutar };
}

/** Arranca el control periodico (una vez al arrancar y luego cada hora). Un fallo no tumba el servidor. */
function iniciarCiclo({ repositorio, mailer }) {
  const ciclo = crearCiclo({ repositorio, mailer });
  let corriendo = false;
  const tick = async () => {
    if (corriendo) return;
    corriendo = true;
    try {
      const r = await ciclo.ejecutar();
      if (r.recordados || r.vencidos || r.cerrados) console.log('[ciclo de informes]', r);
    } catch (error) {
      console.error('[ciclo de informes] error:', error.message);
    } finally {
      corriendo = false;
    }
  };
  setTimeout(tick, 15000);
  return setInterval(tick, 60 * 60 * 1000);
}

module.exports = { sumarDiasHabiles, evaluarInforme, crearCiclo, iniciarCiclo, config };
