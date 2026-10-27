// Contraseñas temporales: aleatorias por usuario, sin caracteres que se confunden (0/O, 1/l/I).
const crypto = require('crypto');

const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
const NUMEROS = '23456789';
const ALFABETO = LETRAS + NUMEROS;

const elegir = (conjunto) => conjunto[crypto.randomInt(conjunto.length)];

function generarClaveTemporal(largo = 10) {
  const caracteres = [elegir(LETRAS), elegir(NUMEROS)];
  while (caracteres.length < largo) caracteres.push(elegir(ALFABETO));
  // Mezcla (Fisher-Yates) para que las posiciones obligatorias no sean predecibles
  for (let i = caracteres.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
  }
  return caracteres.join('');
}

module.exports = { generarClaveTemporal };
