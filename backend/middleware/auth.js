const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
      if (!req.user) {
        return res.status(401).json({ message: 'No autorizado, usuario no encontrado' });
      }
      delete req.user.password;
      // Con contraseña temporal solo se puede usar el cambio de contraseña
      if (req.user.debe_cambiar_clave && !req.originalUrl.split('?')[0].endsWith('/auth/change-password')) {
        return res.status(403).json({ message: 'Tenés que cambiar tu contraseña temporal antes de continuar', codigo: 'CAMBIAR_CLAVE' });
      }
      next();
    } catch (error) {
      res.status(401).json({ message: 'No autorizado, token fallido' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'No autorizado, sin token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        message: `El rol ${req.user.rol} no tiene permiso para acceder a esta ruta`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
