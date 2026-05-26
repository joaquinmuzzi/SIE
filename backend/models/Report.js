const { pool } = require('../config/db');

const Report = {
  async find(filters) {
    let sql = `
      SELECT
        i.id_informe     AS _id,
        i.titulo,
        i.descripcion,
        i.fecha,
        i.created_at     AS createdAt,
        i.updated_at     AS updatedAt,
        ua.id_usuario    AS "usuarioAsignado._id",
        ua.nombre        AS "usuarioAsignado.nombre",
        ua.email         AS "usuarioAsignado.email",
        cp.id_usuario    AS "creadoPor._id",
        cp.nombre        AS "creadoPor.nombre"
      FROM informes i
      LEFT JOIN usuarios ua ON i.usuario_asignado_id = ua.id_usuario
      LEFT JOIN usuarios cp ON i.creado_por_id = cp.id_usuario
    `;
    const params = [];

    if (filters && filters.usuarioAsignado) {
      sql += ' WHERE i.usuario_asignado_id = ?';
      params.push(filters.usuarioAsignado);
    }

    sql += ' ORDER BY i.created_at DESC';

    const [rows] = await pool.query(sql, params);
    return rows.map(nestPopulated);
  },

  async findById(id) {
    const [rows] = await pool.query(
      `
      SELECT
        i.id_informe     AS _id,
        i.titulo,
        i.descripcion,
        i.fecha,
        i.created_at     AS createdAt,
        i.updated_at     AS updatedAt,
        ua.id_usuario    AS "usuarioAsignado._id",
        ua.nombre        AS "usuarioAsignado.nombre",
        ua.email         AS "usuarioAsignado.email",
        cp.id_usuario    AS "creadoPor._id",
        cp.nombre        AS "creadoPor.nombre"
      FROM informes i
      LEFT JOIN usuarios ua ON i.usuario_asignado_id = ua.id_usuario
      LEFT JOIN usuarios cp ON i.creado_por_id = cp.id_usuario
      WHERE i.id_informe = ?
      `,
      [id]
    );
    if (!rows.length) return null;
    return nestPopulated(rows[0]);
  },

  async create(data) {
    const [result] = await pool.query(
      'INSERT INTO informes (titulo, descripcion, usuario_asignado_id, creado_por_id) VALUES (?, ?, ?, ?)',
      [data.titulo, data.descripcion, data.usuarioAsignado, data.creadoPor]
    );
    return Report.findById(result.insertId);
  },

  async update(id, data) {
    const fields = [];
    const params = [];
    if (data.titulo !== undefined) { fields.push('titulo = ?'); params.push(data.titulo); }
    if (data.descripcion !== undefined) { fields.push('descripcion = ?'); params.push(data.descripcion); }
    if (data.usuarioAsignado !== undefined) { fields.push('usuario_asignado_id = ?'); params.push(data.usuarioAsignado); }
    if (!fields.length) return Report.findById(id);

    params.push(id);
    await pool.query(`UPDATE informes SET ${fields.join(', ')} WHERE id_informe = ?`, params);
    return Report.findById(id);
  },

  async deleteById(id) {
    const [result] = await pool.query('DELETE FROM informes WHERE id_informe = ?', [id]);
    return result.affectedRows > 0;
  },
};

function nestPopulated(row) {
  const usuarioAsignado = {
    _id: row['usuarioAsignado._id'],
    nombre: row['usuarioAsignado.nombre'],
    email: row['usuarioAsignado.email'],
  };
  const creadoPor = {
    _id: row['creadoPor._id'],
    nombre: row['creadoPor.nombre'],
  };
  return {
    _id: row._id,
    titulo: row.titulo,
    descripcion: row.descripcion,
    fecha: row.fecha,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    usuarioAsignado,
    creadoPor,
  };
}

module.exports = Report;
