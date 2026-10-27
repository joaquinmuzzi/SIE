// Tests del catalogo de cursos: etiquetas, lectura de cursos escritos a mano y validacion.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { etiquetaCurso, leerEtiqueta, validarCurso, catalogoBase } = require('../services/cursos');

describe('etiquetaCurso', () => {
  test('[correcto] division numerica: "6° 2°"', () => assert.equal(etiquetaCurso({ anio: 6, division: '2', turno: 'Mañana' }), '6° 2°'));
  test('[correcto] division con letra: "3° A"', () => assert.equal(etiquetaCurso({ anio: 3, division: 'A', turno: 'Mañana' }), '3° A'));
  test('[correcto] el turno no forma parte del nombre del curso', () => {
    assert.equal(etiquetaCurso({ anio: 6, division: '2', turno: 'Tarde' }), '6° 2°');
    assert.equal(etiquetaCurso({ anio: 6, division: '2', turno: 'Mañana' }), '6° 2°');
  });
});

describe('leerEtiqueta (cursos que estaban como texto libre)', () => {
  test('[correcto] "6° 2°"', () => assert.deepEqual(leerEtiqueta('6° 2°'), { anio: 6, division: '2' }));
  test('[correcto] sin espacios ni segundo grado: "6°2"', () => assert.deepEqual(leerEtiqueta('6°2'), { anio: 6, division: '2' }));
  test('[correcto] letra en minuscula se normaliza: "3° a"', () => assert.deepEqual(leerEtiqueta('3° a'), { anio: 3, division: 'A' }));
  test('[invalido] año fuera de rango', () => { assert.equal(leerEtiqueta('7° 1°'), null); assert.equal(leerEtiqueta('0° 1°'), null); });
  test('[invalido] texto que no es un curso', () => { assert.equal(leerEtiqueta('quinto B'), null); assert.equal(leerEtiqueta(''), null); assert.equal(leerEtiqueta(null), null); });
  test('[limite] la etiqueta de un curso se lee de vuelta', () => {
    const c = leerEtiqueta(etiquetaCurso({ anio: 4, division: '1', turno: 'Mañana' }));
    assert.deepEqual(c, { anio: 4, division: '1' });
  });
});

describe('validarCurso', () => {
  test('[correcto] normaliza division y completa el turno', () => {
    assert.deepEqual(validarCurso({ anio: '5', division: ' b ' }), { ok: true, curso: { anio: 5, division: 'B', turno: 'Mañana', especialidad: '' } });
  });
  test('[correcto] acepta especialidad conocida', () => assert.equal(validarCurso({ anio: 6, division: '1', especialidad: 'Computación' }).ok, true));
  for (const [nombre, datos] of [
    ['año 0', { anio: 0, division: '1' }], ['año 7', { anio: 7, division: '1' }], ['año no numerico', { anio: 'x', division: '1' }],
    ['division vacia', { anio: 1, division: '' }], ['division muy larga', { anio: 1, division: 'ABCD' }], ['division con simbolos', { anio: 1, division: '1-2' }],
    ['turno inexistente', { anio: 1, division: '1', turno: 'Madrugada' }], ['especialidad inexistente', { anio: 1, division: '1', especialidad: 'Cocina' }],
  ]) test(`[invalido] ${nombre}`, () => assert.equal(validarCurso(datos).ok, false));
});

describe('catalogoBase', () => {
  const base = catalogoBase();
  const porAnio = (n) => base.filter((c) => c.anio === n).length;
  test('[correcto] divisiones por año: 1°=10, 2°=9, 3°=9, 6°=3 (4° y 5° provisorios con 2)', () => {
    assert.deepEqual([1, 2, 3, 4, 5, 6].map(porAnio), [10, 9, 9, 2, 2, 3]);
    assert.equal(base.length, 35);
  });
  test('[correcto] las divisiones van de 1 a N sin saltos', () => {
    assert.deepEqual(base.filter((c) => c.anio === 2).map((c) => c.division), ['1', '2', '3', '4', '5', '6', '7', '8', '9']);
    assert.equal(etiquetaCurso(base.at(-1)), '6° 3°');
  });
  test('[correcto] todos son válidos para el catálogo y no hay repetidos', () => {
    assert.ok(base.every((c) => validarCurso(c).ok));
    assert.equal(new Set(base.map(etiquetaCurso)).size, base.length);
  });
  test('[correcto] 6° 1° y 6° 2° cursan a la tarde y el resto del catálogo a la mañana', () => {
    const tarde = base.filter((c) => c.turno === 'Tarde').map(etiquetaCurso);
    assert.deepEqual(tarde, ['6° 1°', '6° 2°']);
  });
  test('[correcto] incluye los cursos de la demo (4° 1°, 5° 1° y 6° 2°)', () => {
    const e = base.map(etiquetaCurso);
    for (const c of ['4° 1°', '5° 1°', '6° 2°']) assert.ok(e.includes(c), c);
  });
});
