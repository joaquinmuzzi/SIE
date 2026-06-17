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

exports.getPadres = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_usuario AS _id, nombre, email, dni, telefono FROM usuarios WHERE rol = 'padre' OR rol = 'tutor'`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAlumnosSinPadre = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_usuario AS _id, nombre, email, dni, curso FROM usuarios WHERE rol = 'alumno' AND id_padre IS NULL`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.linkHijos = async (req, res) => {
  try {
    const { id_padre, alumno_ids } = req.body;
    if (!id_padre || !alumno_ids || !alumno_ids.length) {
      return res.status(400).json({ message: 'Se requiere id_padre y al menos un alumno' });
    }

    for (const id_alumno of alumno_ids) {
      await pool.query('UPDATE usuarios SET id_padre = ? WHERE id_usuario = ?', [id_padre, id_alumno]);
    }

    res.json({ message: `${alumno_ids.length} alumno(s) vinculado(s) correctamente` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
