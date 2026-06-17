const { pool } = require('../config/db');

const Report = {
  async find(filters) {
    let sql = `
      SELECT
        i.id_informe        AS _id,
        i.titulo,
        i.tipo,
        i.gravedad,
        i.estado,
        i.texto_profesor,
        i.texto_regente,
        i.texto_pat,
        i.descargo_alumno,
        i.fecha,
        i.created_at        AS createdAt,
        i.updated_at        AS updatedAt,
        al.id_usuario       AS "alumno._id",
        al.nombre           AS "alumno.nombre",
        al.email            AS "alumno.email",
        pa.id_usuario       AS "padre._id",
        pa.nombre           AS "padre.nombre",
        pa.email            AS "padre.email",
        cp.id_usuario       AS "creadoPor._id",
        cp.nombre           AS "creadoPor.nombre",
        cp.rol              AS "creadoPor.rol"
      FROM informes i
      LEFT JOIN usuarios al ON i.id_alumno = al.id_usuario
      LEFT JOIN usuarios pa ON i.id_padre = pa.id_usuario
      LEFT JOIN usuarios cp ON i.creado_por_id = cp.id_usuario
    `;
    const params = [];
    const conditions = [];

    if (filters) {
      if (filters.alumno) {
        conditions.push('i.id_alumno = ?');
        params.push(filters.alumno);
      }
      if (filters.padre) {
        conditions.push('i.id_padre = ?');
        params.push(filters.padre);
      }
      if (filters.estado) {
        conditions.push('i.estado = ?');
        params.push(filters.estado);
      }
    }

    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY i.created_at DESC';

    const [rows] = await pool.query(sql, params);
    return rows.map(nestPopulated);
  },

  async findById(id) {
    const [rows] = await pool.query(
      `
      SELECT
        i.id_informe        AS _id,
        i.titulo,
        i.tipo,
        i.gravedad,
        i.estado,
        i.texto_profesor,
        i.texto_regente,
        i.texto_pat,
        i.descargo_alumno,
        i.fecha,
        i.created_at        AS createdAt,
        i.updated_at        AS updatedAt,
        al.id_usuario       AS "alumno._id",
        al.nombre           AS "alumno.nombre",
        al.email            AS "alumno.email",
        pa.id_usuario       AS "padre._id",
        pa.nombre           AS "padre.nombre",
        pa.email            AS "padre.email",
        cp.id_usuario       AS "creadoPor._id",
        cp.nombre           AS "creadoPor.nombre",
        cp.rol              AS "creadoPor.rol"
      FROM informes i
      LEFT JOIN usuarios al ON i.id_alumno = al.id_usuario
      LEFT JOIN usuarios pa ON i.id_padre = pa.id_usuario
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
      `INSERT INTO informes
        (titulo, tipo, gravedad, estado, texto_profesor, texto_regente, texto_pat, id_alumno, id_padre, creado_por_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.titulo,
        data.tipo || 'conducta',
        data.gravedad || 'leve',
        data.estado || 'abierto',
        data.texto_profesor || null,
        data.texto_regente || null,
        data.texto_pat || null,
        data.id_alumno,
        data.id_padre || null,
        data.creado_por_id,
      ]
    );
    return Report.findById(result.insertId);
  },

  async update(id, data) {
    const fields = [];
    const params = [];
    const allowed = [
      'titulo', 'tipo', 'gravedad', 'estado',
      'texto_profesor', 'texto_regente', 'texto_pat',
      'descargo_alumno', 'id_alumno', 'id_padre',
    ];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    }
    if (!fields.length) return Report.findById(id);

    params.push(id);
    await pool.query(`UPDATE informes SET ${fields.join(', ')} WHERE id_informe = ?`, params);
    return Report.findById(id);
  },

  async softDelete(id) {
    await pool.query("UPDATE informes SET estado = 'cerrado' WHERE id_informe = ?", [id]);
    return Report.findById(id);
  },
};

function nestPopulated(row) {
  const alumno = {
    _id: row['alumno._id'],
    nombre: row['alumno.nombre'],
    email: row['alumno.email'],
  };
  const padre = {
    _id: row['padre._id'],
    nombre: row['padre.nombre'],
    email: row['padre.email'],
  };
  const creadoPor = {
    _id: row['creadoPor._id'],
    nombre: row['creadoPor.nombre'],
    rol: row['creadoPor.rol'],
  };
  return {
    _id: row._id,
    titulo: row.titulo,
    tipo: row.tipo,
    gravedad: row.gravedad,
    estado: row.estado,
    texto_profesor: row.texto_profesor,
    texto_regente: row.texto_regente,
    texto_pat: row.texto_pat,
    descargo_alumno: row.descargo_alumno,
    fecha: row.fecha,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    alumno,
    padre,
    creadoPor,
  };
}

module.exports = Report;
