const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.registerUser = async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const user = await User.create({ nombre, email, password, rol });

    if (user) {
      res.status(201).json({
        _id: user.id_usuario,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        token: generateToken(user.id_usuario),
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user.id_usuario,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        token: generateToken(user.id_usuario),
      });
    } else {
      res.status(401).json({ message: 'Email o contraseña inválidos' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAlumnos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_usuario AS _id, nombre, email FROM usuarios WHERE rol IN ('alumno', 'padre')`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
