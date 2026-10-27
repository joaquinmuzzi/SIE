const { pool } = require('../config/db');
const { etiquetaCurso, validarCurso } = require('../services/cursos');

const conEtiqueta = (c) => ({ ...c, etiqueta: etiquetaCurso(c) });

// Cualquier usuario con sesion puede ver el catalogo (lo usan los formularios)
exports.listarCursos = async (req, res) => {
  try {
    const [filas] = await pool.query(
      `SELECT c.id_curso AS _id, c.anio, c.division, c.turno, c.especialidad, COUNT(u.id_usuario) AS alumnos
         FROM cursos c
         LEFT JOIN usuarios u ON u.id_curso = c.id_curso AND u.rol = 'alumno'
        GROUP BY c.id_curso, c.anio, c.division, c.turno, c.especialidad
        ORDER BY c.anio, c.division, c.turno`
    );
    res.json(filas.map((f) => conEtiqueta({ ...f, alumnos: Number(f.alumnos) })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.crearCurso = async (req, res) => {
  try {
    const v = validarCurso(req.body);
    if (!v.ok) return res.status(400).json({ message: v.message });
    const { anio, division, turno, especialidad } = v.curso;

    const [[existe]] = await pool.query('SELECT COUNT(*) AS n FROM cursos WHERE anio = ? AND division = ? AND turno = ?', [anio, division, turno]);
    if (existe.n > 0) return res.status(400).json({ message: `El curso ${etiquetaCurso(v.curso)} ya existe` });

    const [r] = await pool.query('INSERT INTO cursos (anio, division, turno, especialidad) VALUES (?, ?, ?, ?)', [anio, division, turno, especialidad]);
    res.status(201).json(conEtiqueta({ _id: r.insertId, ...v.curso, alumnos: 0 }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Solo se elimina un curso que nadie usa: con alumnos o informes asociados se conserva
exports.eliminarCurso = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: 'El id del curso no es valido' });
    const [[curso]] = await pool.query('SELECT id_curso, anio, division, turno FROM cursos WHERE id_curso = ?', [id]);
    if (!curso) return res.status(404).json({ message: 'Curso no encontrado' });

    const etiqueta = etiquetaCurso(curso);
    const [[alumnos]] = await pool.query("SELECT COUNT(*) AS n FROM usuarios WHERE id_curso = ? AND rol = 'alumno'", [id]);
    const [[informes]] = await pool.query('SELECT COUNT(*) AS n FROM informes WHERE curso_destino = ?', [etiqueta]);
    if (alumnos.n > 0 || informes.n > 0) {
      return res.status(409).json({
        message: `No se puede eliminar el curso ${etiqueta}: tiene ${alumnos.n} alumno(s) y ${informes.n} informe(s) asociado(s).`,
      });
    }
    await pool.query('DELETE FROM cursos WHERE id_curso = ?', [id]);
    res.json({ message: `Curso ${etiqueta} eliminado` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
