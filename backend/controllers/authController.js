const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { generarClaveTemporal } = require('../services/claves');
const mailer = require('../services/mailer');
const mensajes = require('../services/mensajes');
const { crearLimitador } = require('../services/limiteIntentos');

// 5 contrasenas actuales equivocadas en 15 minutos bloquean el cambio de clave de ese usuario
const limiteCambioClave = crearLimitador({ max: 5, ventanaMs: 15 * 60 * 1000 });

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Los padres/tutores no tienen cuenta: sus datos de contacto viven en la ficha del alumno
const ROLES_CON_CUENTA = [
  'gestor', 'directivo', 'regente', 'profesor', 'preceptor',
  'asesoria_pedagogica', 'doe', 'pat', 'secretaria', 'alumno',
];
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const datosPublicos = (user) => ({
  _id: user.id_usuario,
  nombre: user.nombre,
  apellido: user.apellido,
  email: user.email,
  rol: user.rol,
  dni: user.dni,
  telefono: user.telefono,
  cargo: user.cargo,
  curso: user.curso,
  responsable_nombre: user.responsable_nombre,
  responsable_email: user.responsable_email,
  responsable_telefono: user.responsable_telefono,
  debe_cambiar_clave: Boolean(user.debe_cambiar_clave),
});

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      if (user.rol === 'padre' || user.rol === 'tutor') {
        return res.status(403).json({ message: 'Los padres y tutores no tienen acceso al sistema: reciben los avisos por correo.' });
      }
      res.json({ ...datosPublicos(user), token: generateToken(user.id_usuario) });
    } else {
      res.status(401).json({ message: 'Email o contrasena invalidos' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Alta de cuenta por el gestor/directivo: la clave temporal se genera aca y le llega al mail del usuario
exports.createUser = async (req, res) => {
  const { nombre, apellido, email, rol, dni, telefono, cargo, curso, responsable_nombre, responsable_email, responsable_telefono } = req.body;

  try {
    if (!nombre || !apellido || !email) {
      return res.status(400).json({ message: 'Nombre, apellido y correo son obligatorios' });
    }
    if (!EMAIL_VALIDO.test(email)) {
      return res.status(400).json({ message: 'El correo no es valido' });
    }
    if (!ROLES_CON_CUENTA.includes(rol)) {
      return res.status(400).json({ message: 'Rol invalido' });
    }
    if (rol === 'gestor' && req.user.rol !== 'gestor') {
      return res.status(403).json({ message: 'Solo un gestor puede crear otro gestor' });
    }
    if (dni && !/^\d{7,8}$/.test(dni)) {
      return res.status(400).json({ message: 'El DNI debe contener entre 7 y 8 digitos' });
    }
    if ((rol === 'profesor' || rol === 'preceptor') && !email.endsWith('@bue.edu.ar')) {
      return res.status(400).json({ message: 'El email del profesor/preceptor debe ser @bue.edu.ar' });
    }
    if (rol === 'alumno') {
      if (!responsable_nombre || !responsable_email) {
        return res.status(400).json({ message: 'Para un alumno hay que cargar el nombre y el correo de su responsable' });
      }
      if (!EMAIL_VALIDO.test(responsable_email)) {
        return res.status(400).json({ message: 'El correo del responsable no es valido' });
      }
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const clave = generarClaveTemporal();
    const user = await User.create({
      nombre, apellido, email, password: clave, rol, dni, telefono, cargo, curso,
      debe_cambiar_clave: true,
      responsable_nombre: rol === 'alumno' ? responsable_nombre : null,
      responsable_email: rol === 'alumno' ? responsable_email : null,
      responsable_telefono: rol === 'alumno' ? responsable_telefono : null,
    });

    const mail = await mailer.enviar({ para: email, ...mensajes.claveTemporal({ nombre, email, clave }) });
    const respuesta = { ...datosPublicos(user), mail };
    // Solo si el correo no pudo salir, la clave se le muestra una vez al gestor para que se la entregue
    if (!mail.enviado) respuesta.claveTemporal = clave;
    res.status(201).json(respuesta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.rol === 'padre' || user.rol === 'tutor') {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    if (user.rol === 'gestor' && req.user.rol !== 'gestor') {
      return res.status(403).json({ message: 'Solo un gestor puede restablecer la clave de otro gestor' });
    }
    const clave = generarClaveTemporal();
    await User.setPassword(user.id_usuario, clave, true);
    const mail = await mailer.enviar({ para: user.email, ...mensajes.claveTemporal({ nombre: user.nombre, email: user.email, clave, restablecida: true }) });
    const respuesta = { message: mail.enviado ? 'Se envio una clave temporal al correo del usuario' : 'No se pudo enviar el correo: entregale la clave temporal al usuario', mail };
    if (!mail.enviado) respuesta.claveTemporal = clave;
    res.json(respuesta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Solo se puede eliminar una cuenta sin informes asociados: los informes quedan como antecedente
exports.deleteUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'El id del usuario no es valido' });
    }
    if (id === req.user.id_usuario) {
      return res.status(400).json({ message: 'No podes eliminar tu propia cuenta' });
    }
    const user = await User.findById(id);
    if (!user || user.rol === 'padre' || user.rol === 'tutor') {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    if (user.rol === 'gestor') {
      if (req.user.rol !== 'gestor') {
        return res.status(403).json({ message: 'Solo un gestor puede eliminar a otro gestor' });
      }
      const [[gestores]] = await pool.query("SELECT COUNT(*) AS n FROM usuarios WHERE rol = 'gestor'");
      if (gestores.n <= 1) {
        return res.status(400).json({ message: 'No se puede eliminar al unico gestor del sistema' });
      }
    }
    const [[informes]] = await pool.query('SELECT COUNT(*) AS n FROM informes WHERE id_alumno = ? OR creado_por_id = ?', [id, id]);
    if (informes.n > 0) {
      return res.status(409).json({
        message: `No se puede eliminar a ${user.nombre} ${user.apellido}: tiene ${informes.n} informe(s) asociado(s) y los informes se conservan como antecedente.`,
      });
    }
    await pool.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
    res.json({ message: `Cuenta de ${user.nombre} ${user.apellido} eliminada` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  const { actual, nueva } = req.body;
  try {
    const espera = limiteCambioClave.bloqueadoPor(req.user.id_usuario);
    if (espera) {
      return res.status(429).json({ message: `Demasiados intentos con la contrasena actual. Probá de nuevo en ${espera} minuto(s).` });
    }
    const user = await User.findById(req.user.id_usuario);
    if (!actual || !nueva || !(await user.matchPassword(actual))) {
      limiteCambioClave.registrarFallo(req.user.id_usuario);
      return res.status(400).json({ message: 'La contrasena actual no es correcta' });
    }
    if (String(nueva).length < 8 || !/[A-Za-z]/.test(nueva) || !/\d/.test(nueva)) {
      return res.status(400).json({ message: 'La contrasena nueva debe tener al menos 8 caracteres, con letras y numeros' });
    }
    if (nueva === actual) {
      return res.status(400).json({ message: 'La contrasena nueva debe ser distinta de la actual' });
    }
    await User.setPassword(user.id_usuario, nueva, false);
    limiteCambioClave.limpiar(req.user.id_usuario);
    // Aviso al dueño de la cuenta por si el cambio no lo hizo el: no bloquea la respuesta
    mailer.enviar({ para: user.email, ...mensajes.claveCambiada({ nombre: user.nombre }) }).catch(() => {});
    res.json({ message: 'Contrasena actualizada' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAlumnos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_usuario AS _id, nombre, apellido, email, dni, telefono, curso,
              responsable_nombre, responsable_email, responsable_telefono
         FROM usuarios WHERE rol = 'alumno'`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_usuario AS _id, nombre, apellido, email, rol, dni, telefono, cargo, curso,
              responsable_nombre, responsable_email, responsable_telefono, debe_cambiar_clave
         FROM usuarios WHERE rol NOT IN ('padre', 'tutor') ORDER BY apellido, nombre`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
