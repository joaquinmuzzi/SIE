const Report = require('../models/Report');

// @desc    Obtener informes
// @route   GET /api/reports
exports.getReports = async (req, res) => {
  try {
    let query = {};
    if (req.user.rol !== 'directivo') {
      query = { usuarioAsignado: req.user._id };
    }
    const reports = await Report.find(query)
      .populate('usuarioAsignado', 'nombre email')
      .populate('creadoPor', 'nombre')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Crear informe
// @route   POST /api/reports
exports.createReport = async (req, res) => {
  const { titulo, descripcion, usuarioAsignado } = req.body;

  try {
    const report = await Report.create({
      titulo,
      descripcion,
      usuarioAsignado,
      creadoPor: req.user._id,
    });
    res.status(201).json(report);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Actualizar informe
// @route   PUT /api/reports/:id
exports.updateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (report) {
      report.titulo = req.body.titulo || report.titulo;
      report.descripcion = req.body.descripcion || report.descripcion;
      report.usuarioAsignado = req.body.usuarioAsignado || report.usuarioAsignado;
      
      const updatedReport = await report.save();
      res.json(updatedReport);
    } else {
      res.status(404).json({ message: 'Informe no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Eliminar informe
// @route   DELETE /api/reports/:id
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (report) {
      await report.deleteOne();
      res.json({ message: 'Informe eliminado' });
    } else {
      res.status(404).json({ message: 'Informe no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
