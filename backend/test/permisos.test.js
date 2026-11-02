// Tests de los permisos sobre los informes: gravedad solo para gestor y regencia, y funcion de PAT para docentes.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { puedeAsignarGravedad, cumpleFuncionPat, camposEditables, leerGravedad } = require('../services/permisos');

const usuario = (rol, extra = {}) => ({ id_usuario: 10, rol, es_pat: 0, ...extra });
const informe = (extra = {}) => ({ alcance: 'individual', creadoPor: { _id: 10 }, ...extra });

describe('gravedad', () => {
  test('[correcto] el gestor y el regente asignan la gravedad', () => {
    assert.equal(puedeAsignarGravedad(usuario('gestor')), true);
    assert.equal(puedeAsignarGravedad(usuario('regente')), true);
  });
  test('[invalido] directivo, profesor, preceptor, PAT y alumno no la asignan', () => {
    for (const rol of ['directivo', 'profesor', 'preceptor', 'asesoria_pedagogica', 'secretaria', 'alumno']) {
      assert.equal(puedeAsignarGravedad(usuario(rol)), false, rol);
    }
  });
  test('[correcto] el regente puede editar la gravedad de un informe a un alumno', () => {
    assert.ok(camposEditables(usuario('regente'), informe()).has('gravedad'));
  });
  test('[invalido] el profesor que creo el informe no edita la gravedad', () => {
    const campos = camposEditables(usuario('profesor'), informe());
    assert.ok(campos.has('texto_profesor'));
    assert.ok(!campos.has('gravedad'));
  });
  test('[limite] los avisos (curso o comunidad) no llevan gravedad', () => {
    assert.ok(!camposEditables(usuario('gestor'), informe({ alcance: 'curso' })).has('gravedad'));
    assert.ok(!camposEditables(usuario('regente'), informe({ alcance: 'todos' })).has('gravedad'));
  });
  test('[correcto] leerGravedad acepta los valores validos y "sin asignar"', () => {
    assert.equal(leerGravedad('muy_alta'), 'muy_alta');
    assert.equal(leerGravedad(''), null);
    assert.equal(leerGravedad(null), null);
  });
  test('[invalido] leerGravedad rechaza valores desconocidos', () => assert.equal(leerGravedad('gravisima'), undefined));
});

describe('funcion de PAT', () => {
  test('[correcto] un profesor marcado como PAT redacta el texto del PAT en cualquier informe', () => {
    const campos = camposEditables(usuario('profesor', { es_pat: 1, id_usuario: 99 }), informe());
    assert.ok(campos.has('texto_pat'));
    assert.ok(!campos.has('texto_profesor'), 'no es el autor: no edita el texto del profesor');
  });
  test('[correcto] en sus propios informes edita las dos cosas', () => {
    const campos = camposEditables(usuario('profesor', { es_pat: 1 }), informe());
    assert.ok(campos.has('texto_profesor') && campos.has('texto_pat'));
  });
  test('[invalido] un profesor sin la funcion no redacta el texto del PAT', () => {
    assert.equal(cumpleFuncionPat(usuario('profesor')), false);
    assert.equal(camposEditables(usuario('profesor', { id_usuario: 99 }), informe()).size, 0);
  });
  test('[limite] la marca no da la funcion a otros roles (alumno, secretaria)', () => {
    assert.equal(cumpleFuncionPat(usuario('alumno', { es_pat: 1 })), false);
    assert.equal(cumpleFuncionPat(usuario('secretaria', { es_pat: 1 })), false);
  });
  test('[correcto] Asesoria / DOE / PAT sigue redactando el texto del PAT', () => {
    assert.ok(camposEditables(usuario('asesoria_pedagogica'), informe()).has('texto_pat'));
  });
});
