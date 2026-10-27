const Report = require('../models/Report');
const mailer = require('../services/mailer');
const mensajes = require('../services/mensajes');
const { sumarDiasHabiles, config } = require('../services/ciclo');
const { pool } = require('../config/db');
const { etiquetaCurso } = require('../services/cursos');
const historial = require('../repositories/historialRepository');

// El historial es un registro auxiliar: si falla, no debe romper la operacion
const anotar = (datos) => historial.registrar(datos).catch((e) => console.error('[historial]', e.message));

const nombreCompleto = (u) => `${u.nombre || ''} ${u.apellido || ''}`.trim();

// Avisos por mail de un informe individual: nunca hacen fallar la operacion principal
async function avisarNuevoInforme(informe) {
  const alumno = informe.alumno;
  const resumen = { titulo: informe.titulo, gravedad: informe.gravedad };
  await mailer.enviar({ para: alumno.email, ...mensajes.avisoDescargoAlumno({ nombre: alumno.nombre, informe: resumen, limite: informe.fecha_limite_descargo }) });
  await mailer.enviar({
    para: alumno.responsable_email,
    ...mensajes.avisoResponsable({ nombreResponsable: alumno.responsable_nombre || 'familia', nombreAlumno: nombreCompleto(alumno), informe: resumen, limite: informe.fecha_limite_descargo }),
  });
}

async function avisarCambioEstado(informe) {
  const alumno = informe.alumno;
  if (informe.alcance !== 'individual' || !alumno || !alumno.responsable_email) return;
  await mailer.enviar({
    para: alumno.responsable_email,
    ...mensajes.cambioEstadoResponsable({ nombreResponsable: alumno.responsable_nombre || 'familia', nombreAlumno: nombreCompleto(alumno), informe: { titulo: informe.titulo }, estado: informe.estado }),
  });
}

exports.getReports = async (req, res) => {
  try {
    const rol = req.user.rol;
    let filters = {};

    if (rol === 'alumno') {
      filters.alumnoId = req.user.id_usuario;
      filters.curso = req.user.curso;
    }

    if (['abierto', 'en_revision', 'cerrado'].includes(req.query.estado)) {
      filters.estado = req.query.estado;
    }
    const q = String(req.query.q || '').trim().slice(0, 100);
    if (q) {
      filters.q = q;
    }
    const cursoFiltro = String(req.query.curso || '').trim().slice(0, 40);
    if (cursoFiltro && rol !== 'alumno') {
      filters.cursoFiltro = cursoFiltro;
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    filters.limit = limit;
    filters.offset = (page - 1) * limit;

    const [reports, total, counts] = await Promise.all([
      Report.find(filters),
      Report.count(filters),
      Report.countByEstado(filters),
    ]);

    res.json({
      reports,
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      counts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createReport = async (req, res) => {
  const {
    titulo, tipo, gravedad,
    texto_profesor, texto_regente, texto_pat,
    id_alumno,
    alcance, curso_destino,
  } = req.body;

  try {
    const alcanceFinal = alcance || 'individual';
    const alcancesValidos = ['individual', 'curso', 'todos'];
    if (!alcancesValidos.includes(alcanceFinal)) {
      return res.status(400).json({ message: 'Alcance invalido. Valores permitidos: individual, curso, todos' });
    }

    if (alcanceFinal === 'individual' && !id_alumno) {
      return res.status(400).json({ message: 'El alumno es obligatorio para crear un informe individual' });
    }
    if (alcanceFinal === 'curso') {
      if (!curso_destino) {
        return res.status(400).json({ message: 'El curso destino es obligatorio para un informe de curso' });
      }
      const [cursos] = await pool.query('SELECT anio, division, turno FROM cursos');
      if (!cursos.some((c) => etiquetaCurso(c) === curso_destino)) {
        return res.status(400).json({ message: 'El curso destino no existe en el catalogo de cursos' });
      }
    }

    const report = await Report.create({
      titulo,
      tipo,
      gravedad,
      texto_profesor,
      texto_regente,
      texto_pat,
      alcance: alcanceFinal,
      curso_destino: alcanceFinal === 'curso' ? curso_destino : null,
      id_alumno: alcanceFinal === 'individual' ? id_alumno : null,
      // Plazo para que el alumno presente su descargo (dias habiles, configurable)
      fecha_limite_descargo: alcanceFinal === 'individual' ? sumarDiasHabiles(new Date(), config().descargoDiasHabiles) : null,
      creado_por_id: req.user.id_usuario,
    });
    if (report.alcance === 'individual' && report.alumno._id) {
      avisarNuevoInforme(report).catch((e) => console.error('[aviso informe]', e.message));
    }
    anotar({ idInforme: report._id, usuarioId: req.user.id_usuario, accion: 'creado', estadoNuevo: report.estado });
    res.status(201).json(report);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Informe no encontrado' });
    }

    if (report.estado === 'cerrado') {
      return res.status(400).json({ message: 'No se puede editar un informe cerrado' });
    }

    const rol = req.user.rol;
    const updateData = {};

    if (rol === 'gestor' || rol === 'directivo') {
      updateData.titulo = req.body.titulo;
      updateData.tipo = req.body.tipo;
      updateData.gravedad = req.body.gravedad;
      updateData.estado = req.body.estado;
      updateData.id_alumno = req.body.id_alumno;
      updateData.texto_profesor = req.body.texto_profesor;
      updateData.texto_regente = req.body.texto_regente;
      updateData.texto_pat = req.body.texto_pat;
    } else if (rol === 'profesor' || rol === 'preceptor') {
      if (report.creadoPor._id !== req.user.id_usuario) {
        return res.status(403).json({ message: 'Solo el docente que creo el informe puede editar su texto' });
      }
      if (req.body.texto_profesor !== undefined) {
        updateData.texto_profesor = req.body.texto_profesor;
      }
    } else if (rol === 'regente') {
      if (req.body.texto_regente !== undefined) {
        updateData.texto_regente = req.body.texto_regente;
      }
    } else if (rol === 'asesoria_pedagogica' || rol === 'doe' || rol === 'pat') {
      if (req.body.texto_pat !== undefined) {
        updateData.texto_pat = req.body.texto_pat;
      }
    } else {
      return res.status(403).json({ message: `El rol ${rol} no puede editar informes` });
    }

    const updatedReport = await Report.update(req.params.id, updateData);
    const campos = Object.keys(updateData).filter((k) => updateData[k] !== undefined);
    if (campos.length) {
      anotar({ idInforme: report._id, usuarioId: req.user.id_usuario, accion: 'editado', detalle: campos.join(', ').slice(0, 250) });
    }
    if (updatedReport.estado !== report.estado) {
      anotar({ idInforme: report._id, usuarioId: req.user.id_usuario, accion: 'estado', estadoAnterior: report.estado, estadoNuevo: updatedReport.estado });
    }
    res.json(updatedReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addDescargo = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Informe no encontrado' });
    }

    if (req.user.rol !== 'alumno') {
      return res.status(403).json({ message: 'Solo el alumno puede agregar su descargo' });
    }

    if (report.alumno._id !== req.user.id_usuario) {
      return res.status(403).json({ message: 'No puedes agregar un descargo en un informe que no es tuyo' });
    }

    if (report.estado === 'cerrado') {
      return res.status(400).json({ message: 'El informe ya esta cerrado: no se puede agregar un descargo' });
    }
    const vencido = report.descargo_vencido || (report.fecha_limite_descargo && new Date() > new Date(report.fecha_limite_descargo));
    if (vencido) {
      return res.status(400).json({ message: 'Venció el plazo para presentar el descargo de este informe' });
    }
    if (!String(req.body.descargo_alumno || '').trim()) {
      return res.status(400).json({ message: 'El descargo no puede estar vacio' });
    }

    const updatedReport = await Report.update(req.params.id, {
      descargo_alumno: req.body.descargo_alumno,
    });
    anotar({ idInforme: report._id, usuarioId: req.user.id_usuario, accion: 'descargo' });
    res.json(updatedReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Informe no encontrado' });
    }

    const updatedReport = await Report.softDelete(req.params.id);
    if (report.estado !== 'cerrado') {
      anotar({ idInforme: report._id, usuarioId: req.user.id_usuario, accion: 'estado', estadoAnterior: report.estado, estadoNuevo: 'cerrado' });
    }
    res.json({ message: 'Informe cerrado', informe: updatedReport });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.changeState = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Informe no encontrado' });
    }

    const { estado } = req.body;
    const validStates = ['abierto', 'en_revision', 'cerrado'];
    if (!validStates.includes(estado)) {
      return res.status(400).json({ message: 'Estado invalido. Valores permitidos: abierto, en_revision, cerrado' });
    }

    const updatedReport = await Report.update(req.params.id, { estado });
    if (estado !== report.estado) {
      anotar({ idInforme: report._id, usuarioId: req.user.id_usuario, accion: 'estado', estadoAnterior: report.estado, estadoNuevo: estado });
      avisarCambioEstado(updatedReport).catch((e) => console.error('[aviso estado]', e.message));
    }
    res.json(updatedReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
