const express = require('express');
const router = express.Router();
const {
  getReports,
  createReport,
  updateReport,
  addDescargo,
  deleteReport,
  changeState,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getReports)
  .post(protect, authorize('gestor', 'directivo', 'profesor', 'preceptor', 'regente'), createReport);

router.route('/:id')
  .put(protect, updateReport)
  .delete(protect, authorize('gestor', 'directivo'), deleteReport);

router.patch('/:id/state', protect, authorize('gestor', 'directivo', 'regente'), changeState);

router.post('/:id/descargo', protect, authorize('alumno'), addDescargo);

module.exports = router;
