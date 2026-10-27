// Tope de intentos fallidos por clave (ej. por usuario): tras `max` fallos dentro de la ventana, se bloquea hasta que
// pasa el tiempo. Vive en memoria: alcanza para frenar la adivinanza de contrasenas con una sesion robada.
function crearLimitador({ max = 5, ventanaMs = 15 * 60 * 1000, ahora = () => Date.now() } = {}) {
  const fallos = new Map(); // clave -> [marcas de tiempo]

  const vigentes = (clave) => {
    const desde = ahora() - ventanaMs;
    const lista = (fallos.get(clave) || []).filter((t) => t > desde);
    if (lista.length) fallos.set(clave, lista);
    else fallos.delete(clave);
    return lista;
  };

  return {
    /** Minutos que faltan para poder reintentar, o 0 si no esta bloqueado. */
    bloqueadoPor(clave) {
      const lista = vigentes(clave);
      if (lista.length < max) return 0;
      return Math.max(1, Math.ceil((lista[0] + ventanaMs - ahora()) / 60000));
    },
    registrarFallo(clave) {
      fallos.set(clave, [...vigentes(clave), ahora()]);
    },
    limpiar(clave) {
      fallos.delete(clave);
    },
  };
}

module.exports = { crearLimitador };
