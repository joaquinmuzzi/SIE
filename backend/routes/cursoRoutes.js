const express = require('express');
const router = express.Router();
const { listarCursos, crearCurso, actualizarCurso, eliminarCurso } = require('../controllers/cursoController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, listarCursos);
router.post('/', protect, authorize('gestor', 'directivo'), crearCurso);
router.put('/:id', protect, authorize('gestor', 'directivo'), actualizarCurso);
router.delete('/:id', protect, authorize('gestor', 'directivo'), eliminarCurso);

module.exports = router;
