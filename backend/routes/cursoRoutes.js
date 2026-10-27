const express = require('express');
const router = express.Router();
const { listarCursos, crearCurso, eliminarCurso } = require('../controllers/cursoController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, listarCursos);
router.post('/', protect, authorize('gestor', 'directivo'), crearCurso);
router.delete('/:id', protect, authorize('gestor', 'directivo'), eliminarCurso);

module.exports = router;
