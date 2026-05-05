const express = require('express');
const router = express.Router();
const { 
  getReports, 
  createReport, 
  updateReport, 
  deleteReport 
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getReports)
  .post(protect, authorize('directivo'), createReport);

router.route('/:id')
  .put(protect, authorize('directivo'), updateReport)
  .delete(protect, authorize('directivo'), deleteReport);

module.exports = router;
