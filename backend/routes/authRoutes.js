const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getAlumnos } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/alumnos', protect, authorize('directivo'), getAlumnos);

module.exports = router;
