// Respuesta de error comun a los controladores: los errores de MySQL nunca llegan crudos (y en ingles)
// al usuario; se traducen a un mensaje claro, o a uno generico si no se reconocen.

const MENSAJES_SQL = {
  ER_DATA_TOO_LONG: 'Uno de los campos supera el largo permitido',
  ER_NO_REFERENCED_ROW: 'Alguno de los datos indicados no existe',
  ER_NO_REFERENCED_ROW_2: 'Alguno de los datos indicados no existe',
  ER_ROW_IS_REFERENCED: 'No se puede borrar: hay otros datos que dependen de este',
  ER_ROW_IS_REFERENCED_2: 'No se puede borrar: hay otros datos que dependen de este',
  ER_DUP_ENTRY: 'Ya existe un registro con esos datos',
  ER_TRUNCATED_WRONG_VALUE: 'Alguno de los datos tiene un formato invalido',
  ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: 'Alguno de los datos tiene un formato invalido',
  WARN_DATA_TRUNCATED: 'Alguno de los datos tiene un formato invalido',
  ER_BAD_NULL_ERROR: 'Falta completar un dato obligatorio',
};

const MENSAJE_INTERNO = 'Ocurrio un error inesperado. Proba de nuevo en unos minutos.';

function responderError(res, error, estado = 500) {
  const esSql = Boolean(error && (error.sqlMessage || error.sqlState || /^ER_|^WARN_/.test(error.code || '')));
  if (esSql) {
    const traducido = MENSAJES_SQL[error.code];
    if (traducido) return res.status(400).json({ message: traducido });
    console.error('[sql]', error.code, error.sqlMessage || error.message);
    return res.status(500).json({ message: MENSAJE_INTERNO });
  }
  if (estado >= 500) console.error('[error]', error && error.message);
  return res.status(estado).json({ message: estado >= 500 ? MENSAJE_INTERNO : error.message });
}

module.exports = { responderError, MENSAJES_SQL, MENSAJE_INTERNO };
