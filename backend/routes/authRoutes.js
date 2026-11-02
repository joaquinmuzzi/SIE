const express = require('express');
const router = express.Router();
const {
  loginUser,
  createUser,
  resetPassword,
  deleteUser,
  changePassword,
  getAlumnos,
  getUsers,
  setFuncionPat,
  getPerfil,
  updatePerfil,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// No hay registro publico: las cuentas las crea el gestor o el directivo y la clave temporal llega por mail
router.post('/login', loginUser);
router.post('/change-password', protect, changePassword);
router.route('/me').get(protect, getPerfil).put(protect, updatePerfil);
router.get('/alumnos', protect, authorize('gestor', 'directivo', 'profesor', 'preceptor', 'regente'), getAlumnos);
router.get('/users', protect, authorize('gestor', 'directivo'), getUsers);
router.post('/users', protect, authorize('gestor', 'directivo'), createUser);
router.post('/users/:id/reset-password', protect, authorize('gestor', 'directivo'), resetPassword);
router.delete('/users/:id', protect, authorize('gestor', 'directivo'), deleteUser);
router.patch('/users/:id/pat', protect, authorize('gestor', 'directivo'), setFuncionPat);

module.exports = router;
