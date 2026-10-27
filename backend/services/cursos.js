// Catalogo de cursos: etiqueta legible y lectura de las etiquetas que ya existian como texto libre.
// Etiqueta: "6° 2°" (año 6, division 2) o "3° A" (division con letra). Las divisiones no se repiten entre turnos,
// asi que el turno es un dato del curso y no forma parte de su nombre.
const TURNOS = ['Mañana', 'Tarde', 'Noche'];
const ESPECIALIDADES = ['Computación', 'Automotores'];

function etiquetaCurso({ anio, division }) {
  return /^\d+$/.test(String(division)) ? `${anio}° ${division}°` : `${anio}° ${division}`;
}

/** Interpreta un curso escrito a mano ("6° 2°", "6°2", "3° a"). Devuelve null si no se puede leer. */
function leerEtiqueta(texto) {
  const m = /^\s*([1-6])\s*°\s*([A-Za-z0-9]{1,3})\s*°?\s*$/.exec(String(texto ?? ''));
  return m ? { anio: Number(m[1]), division: m[2].toUpperCase() } : null;
}

/** Valida y normaliza los datos de un curso nuevo. @returns {{ok: true, curso: object} | {ok: false, message: string}} */
function validarCurso({ anio, division, turno, especialidad }) {
  const a = Number(anio);
  if (!Number.isInteger(a) || a < 1 || a > 6) return { ok: false, message: 'El año debe ser un número del 1 al 6' };
  const d = String(division ?? '').trim().toUpperCase();
  if (!/^[A-Z0-9]{1,3}$/.test(d)) return { ok: false, message: 'La división debe tener de 1 a 3 letras o números' };
  const t = turno || 'Mañana';
  if (!TURNOS.includes(t)) return { ok: false, message: 'El turno debe ser Mañana, Tarde o Noche' };
  const e = especialidad || '';
  if (e && !ESPECIALIDADES.includes(e)) return { ok: false, message: 'La especialidad debe ser Computación o Automotores' };
  return { ok: true, curso: { anio: a, division: d, turno: t, especialidad: e } };
}

// Divisiones por año del catalogo inicial. 1°, 2°, 3° y 6° son datos de la escuela; 4° y 5° quedan provisoriamente con 2.
const DIVISIONES_POR_ANIO = { 1: 10, 2: 9, 3: 9, 4: 2, 5: 2, 6: 3 };
// Cursos que se sabe que cursan a la tarde (6° 1° y 6° 2°); el resto queda en turno mañana hasta que el gestor lo ajuste
const TURNO_TARDE = ['6-1', '6-2'];

/** Catalogo inicial: divisiones numeradas por año (turno mañana, sin especialidad hasta que el gestor lo ajuste). */
function catalogoBase() {
  const cursos = [];
  for (const [anio, cantidad] of Object.entries(DIVISIONES_POR_ANIO)) {
    for (let d = 1; d <= cantidad; d++) {
      const turno = TURNO_TARDE.includes(`${anio}-${d}`) ? 'Tarde' : 'Mañana';
      cursos.push({ anio: Number(anio), division: String(d), turno, especialidad: '' });
    }
  }
  return cursos;
}

module.exports = { TURNOS, ESPECIALIDADES, etiquetaCurso, leerEtiqueta, validarCurso, catalogoBase };
