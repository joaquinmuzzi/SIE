// Tests del ciclo de vida de los informes (plazo de descargo) y de las claves temporales.
// Sin base de datos ni mails reales: repositorio y mailer son dobles.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { sumarDiasHabiles, evaluarInforme, crearCiclo } = require('../services/ciclo');
const { generarClaveTemporal } = require('../services/claves');

const CFG = { descargoDiasHabiles: 5, cierreDias: 15 };
const d = (s) => new Date(s);

describe('sumarDiasHabiles', () => {
  test('[correcto] 5 dias habiles desde un lunes caen el lunes siguiente', () => {
    assert.equal(sumarDiasHabiles(d('2026-10-26T10:00:00'), 5).toDateString(), d('2026-11-02T10:00:00').toDateString());
  });
  test('[correcto] desde un viernes, 1 dia habil es el lunes', () => {
    assert.equal(sumarDiasHabiles(d('2026-10-30T10:00:00'), 1).getDay(), 1);
  });
  test('[limite] desde un sabado, 1 dia habil es el lunes', () => {
    assert.equal(sumarDiasHabiles(d('2026-10-31T10:00:00'), 1).getDay(), 1);
  });
  test('[limite] 0 dias devuelve la misma fecha', () => {
    assert.equal(sumarDiasHabiles(d('2026-10-26T10:00:00'), 0).getTime(), d('2026-10-26T10:00:00').getTime());
  });
});

const informe = (extra = {}) => ({
  estado: 'abierto', alcance: 'individual', descargo_alumno: null, descargo_vencido: 0, recordatorio_enviado: 0,
  created_at: '2026-10-26T10:00:00', fecha_limite_descargo: '2026-11-02T10:00:00', ...extra,
});

describe('evaluarInforme', () => {
  test('[correcto] recien creado: no hace nada', () => assert.equal(evaluarInforme(informe(), d('2026-10-26T12:00:00'), CFG), null));
  test('[correcto] pasada la mitad del plazo: recordar', () => assert.equal(evaluarInforme(informe(), d('2026-10-30T10:00:00'), CFG), 'recordar'));
  test('[correcto] el recordatorio no se repite', () => assert.equal(evaluarInforme(informe({ recordatorio_enviado: 1 }), d('2026-10-31T10:00:00'), CFG), null));
  test('[correcto] vencido el plazo sin descargo: vencer', () => assert.equal(evaluarInforme(informe(), d('2026-11-02T10:00:01'), CFG), 'vencer'));
  test('[correcto] a los 15 dias se cierra solo', () => assert.equal(evaluarInforme(informe({ descargo_vencido: 1, estado: 'en_revision' }), d('2026-11-10T10:00:00'), CFG), 'cerrar'));
  test('[invalido] con descargo presentado no se recuerda ni se vence', () => {
    assert.equal(evaluarInforme(informe({ descargo_alumno: 'mi version' }), d('2026-10-31T10:00:00'), CFG), null);
    assert.equal(evaluarInforme(informe({ descargo_alumno: 'mi version' }), d('2026-11-05T10:00:00'), CFG), null);
  });
  test('[invalido] un informe cerrado no se toca nunca', () => assert.equal(evaluarInforme(informe({ estado: 'cerrado' }), d('2027-01-01T00:00:00'), CFG), null));
  test('[invalido] los informes generales (curso/todos) no tienen plazo', () => {
    assert.equal(evaluarInforme(informe({ alcance: 'todos', fecha_limite_descargo: null }), d('2026-10-31T10:00:00'), CFG), null);
  });
  test('[limite] informes anteriores a la funcionalidad (sin fecha limite) no se tocan nunca', () => {
    const viejo = informe({ fecha_limite_descargo: null });
    assert.equal(evaluarInforme(viejo, d('2026-11-05T10:00:00'), CFG), null);
    assert.equal(evaluarInforme(viejo, d('2027-03-01T10:00:00'), CFG), null);
  });
  test('[limite] justo en el instante del vencimiento ya vence', () => assert.equal(evaluarInforme(informe(), d('2026-11-02T10:00:00'), CFG), 'vencer'));
});

describe('ciclo: aplica las acciones y avisa por mail', () => {
  const fila = (extra = {}) => ({
    id_informe: 7, titulo: 'Uso del celular', gravedad: 'leve', estado: 'abierto', alcance: 'individual', descargo_alumno: null,
    fecha_limite_descargo: '2026-11-02T10:00:00', recordatorio_enviado: 0, descargo_vencido: 0, created_at: '2026-10-26T10:00:00',
    alumno_nombre: 'Lucas', alumno_apellido: 'Gomez', alumno_email: 'lucas@x.com', responsable_nombre: 'Marta', responsable_email: 'marta@x.com', ...extra,
  });
  const montar = (filas, ahora) => {
    const llamadas = [];
    const mails = [];
    const repositorio = {
      listarActivos: async () => filas,
      marcarRecordatorio: async (id) => llamadas.push(['recordatorio', id]),
      marcarVencido: async (id) => llamadas.push(['vencido', id]),
      cerrar: async (id) => llamadas.push(['cerrar', id]),
    };
    const mailer = { enviar: async (m) => { mails.push(m); return { enviado: true }; } };
    return { llamadas, mails, ciclo: crearCiclo({ repositorio, mailer, ahora: () => d(ahora), configuracion: CFG }) };
  };

  test('[correcto] recordatorio: marca y manda un mail al alumno', async () => {
    const { ciclo, llamadas, mails } = montar([fila()], '2026-10-30T10:00:00');
    assert.deepEqual(await ciclo.ejecutar(), { recordados: 1, vencidos: 0, cerrados: 0 });
    assert.deepEqual(llamadas, [['recordatorio', 7]]);
    assert.equal(mails.length, 1);
    assert.equal(mails[0].para, 'lucas@x.com');
  });
  test('[correcto] vencimiento: marca vencido y avisa al alumno', async () => {
    const { ciclo, llamadas, mails } = montar([fila()], '2026-11-03T10:00:00');
    assert.deepEqual(await ciclo.ejecutar(), { recordados: 0, vencidos: 1, cerrados: 0 });
    assert.deepEqual(llamadas, [['vencido', 7]]);
    assert.match(mails[0].asunto, /venci/i);
  });
  test('[correcto] cierre automatico: cierra y avisa al responsable', async () => {
    const { ciclo, llamadas, mails } = montar([fila({ estado: 'en_revision', descargo_vencido: 1 })], '2026-11-12T10:00:00');
    assert.deepEqual(await ciclo.ejecutar(), { recordados: 0, vencidos: 0, cerrados: 1 });
    assert.deepEqual(llamadas, [['cerrar', 7]]);
    assert.equal(mails[0].para, 'marta@x.com');
  });
  test('[limite] sin nada que hacer no toca la base ni manda mails', async () => {
    const { ciclo, llamadas, mails } = montar([fila()], '2026-10-26T11:00:00');
    assert.deepEqual(await ciclo.ejecutar(), { recordados: 0, vencidos: 0, cerrados: 0 });
    assert.equal(llamadas.length + mails.length, 0);
  });
  test('[limite] el mail de aviso no incluye el contenido del informe, solo el resumen', async () => {
    const { ciclo, mails } = montar([fila()], '2026-10-30T10:00:00');
    await ciclo.ejecutar();
    assert.doesNotMatch(mails[0].texto, /texto_profesor|descargo_alumno/);
  });
});

describe('claves temporales', () => {
  test('[correcto] 10 caracteres con al menos una letra y un numero', () => {
    for (let i = 0; i < 200; i++) {
      const c = generarClaveTemporal();
      assert.equal(c.length, 10);
      assert.match(c, /[A-Za-z]/);
      assert.match(c, /\d/);
    }
  });
  test('[correcto] no usa caracteres ambiguos (0, O, 1, l, I)', () => {
    for (let i = 0; i < 200; i++) assert.doesNotMatch(generarClaveTemporal(), /[0O1lI]/);
  });
  test('[correcto] son distintas entre si', () => {
    assert.equal(new Set(Array.from({ length: 200 }, () => generarClaveTemporal())).size, 200);
  });
});
