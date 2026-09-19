const { pool } = require('../config/db');

const baseSelect = `
  SELECT
    i.id_informe        AS _id,
    i.titulo,
    i.tipo,
    i.gravedad,
    i.estado,
    i.alcance,
    i.curso_destino,
    i.texto_profesor,
    i.texto_regente,
    i.texto_pat,
    i.descargo_alumno,
    i.fecha,
    i.created_at        AS createdAt,
    i.updated_at        AS updatedAt,
    al.id_usuario       AS "alumno._id",
    al.nombre           AS "alumno.nombre",
    al.apellido         AS "alumno.apellido",
    al.email            AS "alumno.email",
    pa.id_usuario       AS "padre._id",
    pa.nombre           AS "padre.nombre",
    pa.apellido         AS "padre.apellido",
    pa.email            AS "padre.email",
    cp.id_usuario       AS "creadoPor._id",
    cp.nombre           AS "creadoPor.nombre",
    cp.apellido         AS "creadoPor.apellido",
    cp.rol              AS "creadoPor.rol"
  FROM informes i
  LEFT JOIN usuarios al ON i.id_alumno = al.id_usuario
  LEFT JOIN usuarios pa ON i.id_padre = pa.id_usuario
  LEFT JOIN usuarios cp ON i.creado_por_id = cp.id_usuario
`;

function buildWhere(filters) {
  const orConditions = [];
  const orParams = [];

  if (filters && filters.alumnoId) {
    orConditions.push('i.id_alumno = ?');
    orParams.push(filters.alumnoId);
    orConditions.push("i.alcance = 'todos'");
    if (filters.curso) {
      orConditions.push("(i.alcance = 'curso' AND i.curso_destino = ?)");
      orParams.push(filters.curso);
    }
  } else if (filters && filters.padreId) {
    orConditions.push('i.id_padre = ?');
    orParams.push(filters.padreId);
    orConditions.push("i.alcance = 'todos'");
    orConditions.push("(i.alcance = 'curso' AND i.curso_destino IN (SELECT curso FROM usuarios WHERE id_padre = ?))");
    orParams.push(filters.padreId);
  }

  const andConditions = [];
  const andParams = [];

  if (orConditions.length) {
    andConditions.push(`(${orConditions.join(' OR ')})`);
    andParams.push(...orParams);
  }

  if (filters && filters.estado) {
    andConditions.push('i.estado = ?');
    andParams.push(filters.estado);
  }

  const where = andConditions.length ? ` WHERE ${andConditions.join(' AND ')}` : '';
  return { where, params: andParams };
}

function nestPopulated(row) {
  const alumno = {
    _id: row['alumno._id'],
    nombre: row['alumno.nombre'],
    apellido: row['alumno.apellido'],
    email: row['alumno.email'],
  };
  const padre = {
    _id: row['padre._id'],
    nombre: row['padre.nombre'],
    apellido: row['padre.apellido'],
    email: row['padre.email'],
  };
  const creadoPor = {
    _id: row['creadoPor._id'],
    nombre: row['creadoPor.nombre'],
    apellido: row['creadoPor.apellido'],
    rol: row['creadoPor.rol'],
  };
  return {
    _id: row._id,
    titulo: row.titulo,
    tipo: row.tipo,
    gravedad: row.gravedad,
    estado: row.estado,
    alcance: row.alcance,
    curso_destino: row.curso_destino,
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

const Report = {
  async find(filters) {
    const { where, params } = buildWhere(filters);
    let sql = `${baseSelect}${where} ORDER BY i.created_at DESC`;

    if (filters && filters.limit) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(filters.limit, filters.offset || 0);
    }

    const [rows] = await pool.query(sql, params);
    return rows.map(nestPopulated);
  },

  async count(filters) {
    const { where, params } = buildWhere(filters);
    const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM informes i${where}`, params);
    return rows[0].total;
  },

  async findById(id) {
    const [rows] = await pool.query(`${baseSelect} WHERE i.id_informe = ?`, [id]);
    if (!rows.length) return null;
    return nestPopulated(rows[0]);
  },

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO informes
        (titulo, tipo, gravedad, estado, alcance, curso_destino, texto_profesor, texto_regente, texto_pat, id_alumno, id_padre, creado_por_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.titulo,
        data.tipo || 'conducta',
        data.gravedad || 'leve',
        data.estado || 'abierto',
        data.alcance || 'individual',
        data.curso_destino || null,
        data.texto_profesor || null,
        data.texto_regente || null,
        data.texto_pat || null,
        data.id_alumno || null,
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
      'titulo', 'tipo', 'gravedad', 'estado', 'alcance', 'curso_destino',
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

module.exports = Report;
