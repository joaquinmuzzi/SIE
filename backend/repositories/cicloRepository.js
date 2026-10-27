// Acceso a datos del ciclo de vida de los informes.
const { pool } = require('../config/db');

async function listarActivos() {
  const [filas] = await pool.query(
    `SELECT i.id_informe, i.titulo, i.gravedad, i.estado, i.alcance, i.descargo_alumno,
            i.fecha_limite_descargo, i.recordatorio_enviado, i.descargo_vencido, i.created_at,
            al.nombre AS alumno_nombre, al.apellido AS alumno_apellido, al.email AS alumno_email,
            al.responsable_nombre, al.responsable_email
       FROM informes i
       JOIN usuarios al ON al.id_usuario = i.id_alumno
      WHERE i.estado <> 'cerrado' AND i.alcance = 'individual'`
  );
  return filas;
}

const marcarRecordatorio = (id) =>
  pool.query('UPDATE informes SET recordatorio_enviado = 1 WHERE id_informe = ?', [id]);

// Al vencer el plazo, el informe pasa a revision (si seguia abierto) y ya no admite descargo
const marcarVencido = (id) =>
  pool.query("UPDATE informes SET descargo_vencido = 1, estado = IF(estado = 'abierto', 'en_revision', estado) WHERE id_informe = ?", [id]);

const cerrar = (id) =>
  pool.query("UPDATE informes SET estado = 'cerrado' WHERE id_informe = ?", [id]);

module.exports = { listarActivos, marcarRecordatorio, marcarVencido, cerrar };
