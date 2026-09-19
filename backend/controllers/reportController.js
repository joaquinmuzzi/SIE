const Report = require('../models/Report');

exports.getReports = async (req, res) => {
  try {
    const rol = req.user.rol;
    let filters = {};

    if (rol === 'alumno') {
      filters.alumnoId = req.user.id_usuario;
      filters.curso = req.user.curso;
    } else if (rol === 'padre' || rol === 'tutor') {
      filters.padreId = req.user.id_usuario;
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    filters.limit = limit;
    filters.offset = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      Report.find(filters),
      Report.count(filters),
    ]);

    res.json({
      reports,
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createReport = async (req, res) => {
  const {
    titulo, tipo, gravedad,
    texto_profesor, texto_regente, texto_pat,
    id_alumno, id_padre,
    alcance, curso_destino,
  } = req.body;

  try {
    const alcanceFinal = alcance || 'individual';
    const alcancesValidos = ['individual', 'curso', 'todos'];
    if (!alcancesValidos.includes(alcanceFinal)) {
      return res.status(400).json({ message: 'Alcance invalido. Valores permitidos: individual, curso, todos' });
    }

    if (alcanceFinal === 'individual' && !id_padre) {
      return res.status(400).json({ message: 'El padre/tutor es obligatorio para crear un informe individual' });
    }
    if (alcanceFinal === 'curso' && !curso_destino) {
      return res.status(400).json({ message: 'El curso destino es obligatorio para un informe de curso' });
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
      id_padre: alcanceFinal === 'individual' ? id_padre : null,
      creado_por_id: req.user.id_usuario,
    });
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

    const rol = req.user.rol;
    const updateData = {};

    if (rol === 'gestor' || rol === 'directivo') {
      updateData.titulo = req.body.titulo;
      updateData.tipo = req.body.tipo;
      updateData.gravedad = req.body.gravedad;
      updateData.estado = req.body.estado;
      updateData.id_alumno = req.body.id_alumno;
      updateData.id_padre = req.body.id_padre;
      updateData.texto_profesor = req.body.texto_profesor;
      updateData.texto_regente = req.body.texto_regente;
      updateData.texto_pat = req.body.texto_pat;
    } else if (rol === 'profesor' || rol === 'preceptor') {
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
    }

    const updatedReport = await Report.update(req.params.id, updateData);
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

    const updatedReport = await Report.update(req.params.id, {
      descargo_alumno: req.body.descargo_alumno,
    });
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
    res.json(updatedReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
