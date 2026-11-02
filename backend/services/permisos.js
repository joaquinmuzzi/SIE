// Reglas de permisos sobre los informes. Son funciones puras: se prueban sin base de datos.
const GRAVEDADES = ['leve', 'alta', 'muy_alta'];
const ROLES_PAT = ['asesoria_pedagogica', 'doe', 'pat'];
// Un profesor o preceptor puede cumplir la funcion de PAT sin cambiar de rol
const ROLES_CON_FUNCION_PAT = ['profesor', 'preceptor'];

// Solo el gestor y la regencia asignan la gravedad (correccion del docente, 30/10)
const puedeAsignarGravedad = (user) => ['gestor', 'regente'].includes(user.rol);

const cumpleFuncionPat = (user) => ROLES_PAT.includes(user.rol) || (ROLES_CON_FUNCION_PAT.includes(user.rol) && Boolean(user.es_pat));

const esAviso = (alcance) => alcance === 'curso' || alcance === 'todos';

/** Campos de un informe abierto que el usuario puede modificar. */
function camposEditables(user, report) {
  const campos = new Set();
  if (['gestor', 'directivo'].includes(user.rol)) {
    ['titulo', 'estado', 'id_alumno', 'texto_profesor', 'texto_regente', 'texto_pat'].forEach((c) => campos.add(c));
    // Los avisos no tienen tipo de conducta
    if (!esAviso(report.alcance)) campos.add('tipo');
  }
  if (['profesor', 'preceptor'].includes(user.rol) && report.creadoPor && report.creadoPor._id === user.id_usuario) {
    campos.add('texto_profesor');
  }
  if (user.rol === 'regente') campos.add('texto_regente');
  if (cumpleFuncionPat(user)) campos.add('texto_pat');
  // Los avisos (a un curso o a toda la comunidad) no llevan gravedad
  if (puedeAsignarGravedad(user) && !esAviso(report.alcance)) campos.add('gravedad');
  return campos;
}

/** Normaliza la gravedad recibida: un valor valido, null ("sin asignar") o undefined si es invalida. */
function leerGravedad(valor) {
  if (valor === null || valor === '') return null;
  return GRAVEDADES.includes(valor) ? valor : undefined;
}

module.exports = { GRAVEDADES, ROLES_CON_FUNCION_PAT, puedeAsignarGravedad, cumpleFuncionPat, esAviso, camposEditables, leerGravedad };
