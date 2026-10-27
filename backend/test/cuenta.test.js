// Tests del tope de intentos y del aviso de cambio de contraseña.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { crearLimitador } = require('../services/limiteIntentos');
const mensajes = require('../services/mensajes');

const MIN = 60 * 1000;

describe('limitador de intentos', () => {
  const montar = (opciones = {}) => {
    let t = 1_000_000;
    const limitador = crearLimitador({ max: 5, ventanaMs: 15 * MIN, ahora: () => t, ...opciones });
    return { limitador, avanzar: (ms) => { t += ms; } };
  };

  test('[correcto] hasta 4 fallos no bloquea', () => {
    const { limitador } = montar();
    for (let i = 0; i < 4; i++) limitador.registrarFallo(7);
    assert.equal(limitador.bloqueadoPor(7), 0);
  });
  test('[correcto] el 5.º fallo bloquea e informa los minutos que faltan', () => {
    const { limitador } = montar();
    for (let i = 0; i < 5; i++) limitador.registrarFallo(7);
    assert.equal(limitador.bloqueadoPor(7), 15);
  });
  test('[correcto] pasada la ventana se desbloquea solo', () => {
    const { limitador, avanzar } = montar();
    for (let i = 0; i < 5; i++) limitador.registrarFallo(7);
    avanzar(15 * MIN + 1);
    assert.equal(limitador.bloqueadoPor(7), 0);
  });
  test('[correcto] un intento correcto limpia los fallos', () => {
    const { limitador } = montar();
    for (let i = 0; i < 4; i++) limitador.registrarFallo(7);
    limitador.limpiar(7);
    limitador.registrarFallo(7);
    assert.equal(limitador.bloqueadoPor(7), 0);
  });
  test('[invalido] el bloqueo de un usuario no afecta a otro', () => {
    const { limitador } = montar();
    for (let i = 0; i < 5; i++) limitador.registrarFallo(7);
    assert.equal(limitador.bloqueadoPor(8), 0);
  });
  test('[limite] los fallos viejos no cuentan: 4 hace 20 minutos + 1 ahora no bloquea', () => {
    const { limitador, avanzar } = montar();
    for (let i = 0; i < 4; i++) limitador.registrarFallo(7);
    avanzar(20 * MIN);
    limitador.registrarFallo(7);
    assert.equal(limitador.bloqueadoPor(7), 0);
  });
  test('[limite] el tiempo restante baja a medida que pasa el tiempo (mínimo 1)', () => {
    const { limitador, avanzar } = montar();
    for (let i = 0; i < 5; i++) limitador.registrarFallo(7);
    avanzar(10 * MIN);
    assert.equal(limitador.bloqueadoPor(7), 5);
    avanzar(5 * MIN - 1000);
    assert.equal(limitador.bloqueadoPor(7), 1);
  });
});

describe('aviso de contraseña cambiada', () => {
  test('[correcto] saluda por nombre, explica qué hacer si no fue la persona y no incluye ninguna contraseña', () => {
    const m = mensajes.claveCambiada({ nombre: 'Lucas' });
    assert.match(m.asunto, /contraseña fue cambiada/);
    assert.match(m.texto, /Hola Lucas/);
    assert.match(m.texto, /no reconocés este cambio/);
    assert.doesNotMatch(m.texto, /Contraseña temporal/i);
  });
  test('[limite] el nombre con caracteres HTML se escapa en la versión HTML', () => {
    const m = mensajes.claveCambiada({ nombre: '<b>Lu</b>' });
    assert.doesNotMatch(m.html, /<b>Lu<\/b>/);
    assert.match(m.html, /&lt;b&gt;Lu&lt;\/b&gt;/);
  });
});
