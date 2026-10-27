// Historial de cada informe: quien hizo que y cuando (cambios de estado, edicion, descargo y acciones automaticas).
const { pool } = require('../config/db');

/** Nunca debe romper la operacion principal: quien llama lo ejecuta sin esperar y con .catch. */
async function registrar({ idInforme, usuarioId = null, accion, estadoAnterior = null, estadoNuevo = null, detalle = null }) {
  await pool.query(
    'INSERT INTO informe_historial (id_informe, usuario_id, accion, estado_anterior, estado_nuevo, detalle) VALUES (?, ?, ?, ?, ?, ?)',
    [idInforme, usuarioId, accion, estadoAnterior, estadoNuevo, detalle]
  );
}

async function listar(idInforme) {
  const [filas] = await pool.query(
    `SELECT h.id_historial AS _id, h.accion, h.estado_anterior, h.estado_nuevo, h.detalle, h.created_at AS fecha,
            u.nombre, u.apellido, u.rol
       FROM informe_historial h
       LEFT JOIN usuarios u ON u.id_usuario = h.usuario_id
      WHERE h.id_informe = ?
      ORDER BY h.created_at ASC, h.id_historial ASC`,
    [idInforme]
  );
  return filas;
}

module.exports = { registrar, listar };
