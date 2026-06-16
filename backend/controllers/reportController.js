const Report = require('../models/Report');

exports.getReports = async (req, res) => {
  try {
    const rol = req.user.rol;
    let filters = {};

    if (rol === 'alumno') {
      filters.alumno = req.user.id_usuario;
    } else if (rol === 'padre' || rol === 'tutor') {
      filters.padre = req.user.id_usuario;
    }

    const reports = await Report.find(filters);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createReport = async (req, res) => {
  const {
    titulo, tipo, gravedad,
    texto_profesor, texto_regente, texto_pat,
    id_alumno, id_padre,
  } = req.body;

  try {
    const report = await Report.create({
      titulo,
      tipo,
      gravedad,
      texto_profesor,
      texto_regente,
      texto_pat,
      id_alumno,
      id_padre,
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
