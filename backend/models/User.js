const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const User = {
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id]);
    if (!rows.length) return null;
    return attachMethods(rows[0]);
  },

  async findOne(conditions) {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE ? LIMIT 1', conditions);
    if (!rows.length) return null;
    return attachMethods(rows[0]);
  },

  async find(conditions) {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE ?', conditions);
    return rows;
  },

  async create(data) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(data.password, salt);
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      [data.nombre, data.email, hash, data.rol || 'alumno']
    );
    return { id_usuario: result.insertId, nombre: data.nombre, email: data.email, rol: data.rol || 'alumno' };
  },
};

function attachMethods(user) {
  user.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };
  return user;
}

module.exports = User;
