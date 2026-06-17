const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getAlumnos,
  getUsers,
  getPadres,
  getAlumnosSinPadre,
  linkHijos,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/alumnos', protect, authorize('gestor', 'directivo', 'profesor', 'preceptor'), getAlumnos);
router.get('/padres', protect, getPadres);
router.get('/alumnos-sin-padre', protect, getAlumnosSinPadre);
router.post('/link-hijos', protect, linkHijos);
router.get('/users', protect, authorize('gestor', 'directivo'), getUsers);

module.exports = router;
