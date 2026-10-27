// Historial de un informe y estadisticas generales.
const { pool } = require('../config/db');
const Report = require('../models/Report');
const historial = require('../repositories/historialRepository');

const ROLES_PERSONAL = ['gestor', 'directivo', 'regente', 'profesor', 'preceptor', 'asesoria_pedagogica', 'doe', 'pat', 'secretaria'];

// El personal ve todos los informes; el alumno solo los suyos, los de su curso y los generales
function puedeVer(usuario, informe) {
  if (ROLES_PERSONAL.includes(usuario.rol)) return true;
  if (usuario.rol !== 'alumno') return false;
  if (informe.alcance === 'todos') return true;
  if (informe.alcance === 'curso') return informe.curso_destino === usuario.curso;
  return informe.alumno?._id === usuario.id_usuario;
}

exports.getHistorial = async (req, res) => {
  try {
    const informe = await Report.findById(req.params.id);
    if (!informe) return res.status(404).json({ message: 'Informe no encontrado' });
    if (!puedeVer(req.user, informe)) return res.status(403).json({ message: 'No tenes permiso para ver este informe' });

    const eventos = await historial.listar(informe._id);
    // Los informes anteriores a esta funcion no tienen el alta registrada: se muestra desde los datos del informe
    if (!eventos.some((e) => e.accion === 'creado')) {
      eventos.unshift({
        _id: 0, accion: 'creado', estado_anterior: null, estado_nuevo: 'abierto', detalle: null, fecha: informe.fecha,
        nombre: informe.creadoPor?.nombre, apellido: informe.creadoPor?.apellido, rol: informe.creadoPor?.rol,
      });
    }
    res.json(eventos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const agrupar = (filas, clave) => Object.fromEntries(filas.map((f) => [f[clave], Number(f.total)]));

exports.getEstadisticas = async (req, res) => {
  try {
    if (!ROLES_PERSONAL.includes(req.user.rol)) {
      return res.status(403).json({ message: 'Las estadisticas son solo para el personal de la escuela' });
    }
    const curso = String(req.query.curso || '').trim();
    const where = curso ? 'WHERE (al.curso = ? OR i.curso_destino = ?)' : '';
    const params = curso ? [curso, curso] : [];
    const desde = `FROM informes i LEFT JOIN usuarios al ON i.id_alumno = al.id_usuario ${where}`;
    const y = (extra) => (where ? `${where} AND ${extra}` : `WHERE ${extra}`);
    const base = 'FROM informes i LEFT JOIN usuarios al ON i.id_alumno = al.id_usuario';

    const q = async (sql, p = params) => (await pool.query(sql, p))[0];

    const [porEstado, porGravedad, porTipo, porCurso, porMes, top, [descargos]] = await Promise.all([
      q(`SELECT i.estado AS clave, COUNT(*) AS total ${desde} GROUP BY i.estado`),
      q(`SELECT i.gravedad AS clave, COUNT(*) AS total ${desde} GROUP BY i.gravedad`),
      q(`SELECT i.tipo AS clave, COUNT(*) AS total ${desde} GROUP BY i.tipo`),
      q(`SELECT COALESCE(al.curso, i.curso_destino) AS clave, COUNT(*) AS total ${base} ${y("i.alcance <> 'todos'")}
          GROUP BY COALESCE(al.curso, i.curso_destino) ORDER BY total DESC, clave LIMIT 10`),
      q(`SELECT DATE_FORMAT(i.fecha, '%Y-%m') AS clave, COUNT(*) AS total ${base} ${y("i.fecha >= DATE_SUB(DATE_FORMAT(NOW(), '%Y-%m-01'), INTERVAL 5 MONTH)")}
          GROUP BY DATE_FORMAT(i.fecha, '%Y-%m')`),
      q(`SELECT al.id_usuario AS _id, al.nombre, al.apellido, al.curso, COUNT(*) AS total ${base} ${y("i.id_alumno IS NOT NULL")}
          GROUP BY al.id_usuario, al.nombre, al.apellido, al.curso ORDER BY total DESC, al.apellido LIMIT 5`),
      q(`SELECT SUM(i.descargo_alumno IS NOT NULL AND i.descargo_alumno <> '') AS presentados,
                SUM(i.descargo_vencido = 1 AND (i.descargo_alumno IS NULL OR i.descargo_alumno = '')) AS vencidos,
                SUM(i.fecha_limite_descargo IS NOT NULL AND i.descargo_vencido = 0 AND i.estado <> 'cerrado' AND (i.descargo_alumno IS NULL OR i.descargo_alumno = '')) AS en_plazo
           ${base} ${y("i.alcance = 'individual'")}`),
    ]);

    // Ultimos 6 meses completos, incluso los que no tuvieron informes
    const meses = [];
    const hoy = new Date();
    for (let k = 5; k >= 0; k--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - k, 1);
      meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    const mensual = agrupar(porMes, 'clave');

    res.json({
      curso: curso || null,
      total: Object.values(agrupar(porEstado, 'clave')).reduce((a, b) => a + b, 0),
      porEstado: { abierto: 0, en_revision: 0, cerrado: 0, ...agrupar(porEstado, 'clave') },
      porGravedad: { leve: 0, alta: 0, muy_alta: 0, ...agrupar(porGravedad, 'clave') },
      porTipo: agrupar(porTipo, 'clave'),
      porCurso: porCurso.map((f) => ({ curso: f.clave, total: Number(f.total) })),
      porMes: meses.map((mes) => ({ mes, total: mensual[mes] || 0 })),
      topAlumnos: top.map((f) => ({ _id: f._id, nombre: f.nombre, apellido: f.apellido, curso: f.curso, total: Number(f.total) })),
      descargos: { presentados: Number(descargos?.presentados || 0), vencidos: Number(descargos?.vencidos || 0), enPlazo: Number(descargos?.en_plazo || 0) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
