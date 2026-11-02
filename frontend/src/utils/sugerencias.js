// Autocompletado simple (sin IA): titulos frecuentes y frases habituales que se pueden insertar al redactar.

export const TITULOS_INFORME = {
  conducta: [
    'Falta de respeto a un docente',
    'Falta de respeto a un compañero',
    'Uso del celular en clase',
    'Agresión física a un compañero',
    'Agresión verbal a un compañero',
    'Retiro del aula sin autorización',
    'Daño a las instalaciones de la escuela',
    'Incumplimiento de las normas del taller',
    'Llegadas tarde reiteradas',
    'Interrupción reiterada de la clase',
  ],
  consejo_aula: [
    'Convocatoria a Consejo de Aula',
    'Seguimiento de conducta en Consejo de Aula',
  ],
  consejo_convivencia: [
    'Convocatoria a Consejo Escolar de Convivencia',
    'Resolución del Consejo Escolar de Convivencia',
  ],
};

export const TITULOS_AVISO = [
  'Recordatorio de normas de convivencia',
  'Uso del celular en el aula',
  'Cuidado de las instalaciones y del taller',
  'Uso obligatorio del uniforme y de los elementos de seguridad',
  'Puntualidad en el ingreso y después de los recreos',
  'Convocatoria a Consejo de Aula',
  'Jornada de convivencia',
];

export const FRASES = {
  texto_profesor: [
    'El alumno interrumpió la clase en reiteradas oportunidades.',
    'Se le llamó la atención en reiteradas oportunidades.',
    'No respetó las indicaciones del docente.',
    'Se retiró del aula sin autorización.',
    'Se solicita la intervención de la regencia.',
  ],
  texto_regente: [
    'Se conversó con el alumno sobre lo sucedido.',
    'Se citó a la familia a la escuela.',
    'Se le recordaron las normas de convivencia.',
    'Se aplica un apercibimiento.',
    'Se deriva el caso al equipo de orientación (PAT).',
  ],
  texto_pat: [
    'Se realizó una entrevista con el alumno.',
    'Se acordó un seguimiento semanal.',
    'Se mantuvo una entrevista con la familia.',
    'Se sugieren estrategias de acompañamiento en el aula.',
  ],
};

/** Agrega una frase al final del texto, con el separador justo. */
export const agregarFrase = (texto, frase) => {
  const base = (texto || '').trimEnd();
  if (!base) return frase;
  return `${base}${/[.!?:]$/.test(base) ? ' ' : '. '}${frase}`;
};
