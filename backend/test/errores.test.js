const test = require('node:test');
const assert = require('node:assert');
const { responderError, MENSAJE_INTERNO } = require('../services/errores');

const respuesta = () => {
  const r = { codigo: null, cuerpo: null };
  r.status = (c) => { r.codigo = c; return r; };
  r.json = (b) => { r.cuerpo = b; return r; };
  return r;
};
const silenciar = (fn) => { const e = console.error; console.error = () => {}; try { fn(); } finally { console.error = e; } };

test('un dato demasiado largo de MySQL se traduce a un 400 en castellano', () => {
  const r = respuesta();
  responderError(r, { code: 'ER_DATA_TOO_LONG', sqlMessage: "Data too long for column 'titulo' at row 1" });
  assert.strictEqual(r.codigo, 400);
  assert.doesNotMatch(r.cuerpo.message, /Data too long/);
});

test('una clave foranea inexistente se traduce a un 400', () => {
  const r = respuesta();
  responderError(r, { code: 'ER_NO_REFERENCED_ROW_2', sqlMessage: 'Cannot add or update a child row' });
  assert.strictEqual(r.codigo, 400);
  assert.doesNotMatch(r.cuerpo.message, /child row/);
});

test('un error de MySQL desconocido no muestra el mensaje crudo', () => {
  const r = respuesta();
  silenciar(() => responderError(r, { code: 'ER_LOCK_DEADLOCK', sqlMessage: 'Deadlock found' }));
  assert.strictEqual(r.codigo, 500);
  assert.strictEqual(r.cuerpo.message, MENSAJE_INTERNO);
});

test('un error interno no muestra su mensaje, uno de validacion si', () => {
  const r = respuesta();
  silenciar(() => responderError(r, new Error('Cannot read properties of undefined')));
  assert.strictEqual(r.cuerpo.message, MENSAJE_INTERNO);
  const r2 = respuesta();
  responderError(r2, new Error('Dato invalido'), 400);
  assert.deepStrictEqual([r2.codigo, r2.cuerpo.message], [400, 'Dato invalido']);
});
