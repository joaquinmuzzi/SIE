const Report = require('../models/Report');

exports.getReports = async (req, res) => {
  try {
    const filters = req.user.rol !== 'directivo' ? { usuarioAsignado: req.user.id_usuario } : undefined;
    const reports = await Report.find(filters);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createReport = async (req, res) => {
  const { titulo, descripcion, usuarioAsignado } = req.body;

  try {
    const report = await Report.create({
      titulo,
      descripcion,
      usuarioAsignado,
      creadoPor: req.user.id_usuario,
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

    const updatedReport = await Report.update(req.params.id, {
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      usuarioAsignado: req.body.usuarioAsignado,
    });
    res.json(updatedReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const deleted = await Report.deleteById(req.params.id);
    if (deleted) {
      res.json({ message: 'Informe eliminado' });
    } else {
      res.status(404).json({ message: 'Informe no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
