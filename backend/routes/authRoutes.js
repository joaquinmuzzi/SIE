const express = require('express');
const router = express.Router();
const {
  loginUser,
  createUser,
  resetPassword,
  changePassword,
  getAlumnos,
  getUsers,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// No hay registro publico: las cuentas las crea el gestor o el directivo y la clave temporal llega por mail
router.post('/login', loginUser);
router.post('/change-password', protect, changePassword);
router.get('/alumnos', protect, authorize('gestor', 'directivo', 'profesor', 'preceptor', 'regente'), getAlumnos);
router.get('/users', protect, authorize('gestor', 'directivo'), getUsers);
router.post('/users', protect, authorize('gestor', 'directivo'), createUser);
router.post('/users/:id/reset-password', protect, authorize('gestor', 'directivo'), resetPassword);

module.exports = router;
