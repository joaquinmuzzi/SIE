const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.registerUser = async (req, res) => {
  const { nombre, email, password, rol, dni, telefono, cargo, curso, id_padre, tiene_acceso } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    if (dni && !/^\d{7,8}$/.test(dni)) {
      return res.status(400).json({ message: 'El DNI debe contener entre 7 y 8 digitos' });
    }

    if ((rol === 'profesor' || rol === 'preceptor') && !email.endsWith('@bue.edu.ar')) {
      return res.status(400).json({ message: 'El email del profesor/preceptor debe ser @bue.edu.ar' });
    }

    const user = await User.create({ nombre, email, password, rol, dni, telefono, cargo, curso, id_padre, tiene_acceso });

    if (user) {
      res.status(201).json({
        _id: user.id_usuario,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        dni: user.dni,
        telefono: user.telefono,
        cargo: user.cargo,
        curso: user.curso,
        id_padre: user.id_padre,
        tiene_acceso: user.tiene_acceso,
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
        dni: user.dni,
        telefono: user.telefono,
        cargo: user.cargo,
        curso: user.curso,
        id_padre: user.id_padre,
        tiene_acceso: user.tiene_acceso,
        token: generateToken(user.id_usuario),
      });
    } else {
      res.status(401).json({ message: 'Email o contrasena invalidos' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAlumnos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_usuario AS _id, nombre, email, dni, telefono, curso, id_padre FROM usuarios WHERE rol = 'alumno'`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_usuario AS _id, nombre, email, rol, dni, telefono, cargo, curso, id_padre, tiene_acceso FROM usuarios`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
