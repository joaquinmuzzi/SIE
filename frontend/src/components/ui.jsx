import { Users } from 'lucide-react';

export const nombreCompleto = (persona) => {
  if (!persona) return '';
  return [persona.nombre, persona.apellido].filter(Boolean).join(' ');
};

export const iniciales = (persona) =>
  [persona?.nombre, persona?.apellido]
    .filter(Boolean)
    .map((p) => p.trim()[0])
    .join('')
    .toUpperCase();

export const ROLES = {
  profesor: 'Profesor',
  preceptor: 'Preceptor',
  regente: 'Regente',
  gestor: 'Gestor',
  directivo: 'Directivo',
  secretaria: 'Secretaría',
  asesoria_pedagogica: 'Asesoría / DOE / PAT',
  alumno: 'Alumno',
  padre: 'Padre / Tutor',
  tutor: 'Padre / Tutor',
};

export const TIPOS = {
  conducta: 'Conducta',
  consejo_aula: 'Consejo de Aula',
  consejo_convivencia: 'Consejo Escolar de Convivencia',
};

export const GRAVEDADES = { leve: 'Leve', alta: 'Alta', muy_alta: 'Muy alta' };
export const ESTADOS = { abierto: 'Abierto', en_revision: 'En revisión', cerrado: 'Cerrado' };

// Tonos apagados; el rojo queda reservado para la gravedad "Muy alta"
export const GRAVEDAD_ESTILO = {
  leve: 'bg-slate-50 text-slate-600 ring-slate-200',
  alta: 'bg-amber-50 text-amber-800 ring-amber-200',
  muy_alta: 'bg-red-50 text-red-800 ring-red-200',
};
const ESTADO_ESTILO = {
  abierto: 'bg-teal-50 text-teal-800 ring-teal-200',
  en_revision: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  cerrado: 'bg-slate-100 text-slate-500 ring-slate-200',
};

export const Chip = ({ className = 'bg-white text-slate-500 ring-slate-200', children }) => (
  <span className={`inline-flex items-center whitespace-nowrap rounded-sm px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}>
    {children}
  </span>
);

export const ChipGravedad = ({ report }) => (
  <Chip className={GRAVEDAD_ESTILO[report.gravedad] || GRAVEDAD_ESTILO.leve}>{GRAVEDADES[report.gravedad] || report.gravedad}</Chip>
);

export const ChipEstado = ({ report }) => (
  <Chip className={ESTADO_ESTILO[report.estado] || ESTADO_ESTILO.abierto}>{ESTADOS[report.estado] || report.estado}</Chip>
);

export const Etiquetas = ({ report }) => (
  <div className="flex flex-wrap gap-1.5">
    <ChipGravedad report={report} />
    <ChipEstado report={report} />
    <Chip>{TIPOS[report.tipo] || report.tipo}</Chip>
  </div>
);

// Destinatario del informe: alumno, curso o toda la comunidad
export const destinatario = (report) => {
  if (report.alcance === 'todos') return 'Toda la comunidad';
  if (report.alcance === 'curso') return `Curso ${report.curso_destino}`;
  return nombreCompleto(report.alumno) || 'Sin asignar';
};

export const Avatar = ({ report, size = 'w-11 h-11' }) =>
  report.alcance === 'individual' ? (
    <div className={`${size} shrink-0 rounded-sm bg-slate-700 text-white grid place-items-center font-semibold`}>
      {iniciales(report.alumno) || '?'}
    </div>
  ) : (
    <div className={`${size} shrink-0 rounded-sm bg-slate-200 text-slate-600 grid place-items-center`}>
      <Users size={18} />
    </div>
  );

// Etapas del informe: los generales (curso o comunidad) no tienen descargo
export const etapas = (report) =>
  report.alcance === 'individual'
    ? ['Emitido', 'Con descargo', 'En revisión', 'Cerrado']
    : ['Emitido', 'En revisión', 'Cerrado'];

export const etapaActual = (report) => {
  const total = etapas(report).length;
  if (report.estado === 'cerrado') return total;
  if (report.estado === 'en_revision') return total - 1;
  if (report.alcance === 'individual' && report.descargo_alumno) return 2;
  return 1;
};

export const BarraAvance = ({ report }) => (
  <div className="flex gap-1">
    {etapas(report).map((e, k) => (
      <span key={e} className={`h-1 flex-1 ${k < etapaActual(report) ? 'bg-slate-700' : 'bg-slate-200'}`} />
    ))}
  </div>
);

export const intervenciones = (report) =>
  [
    report.texto_profesor && { quien: 'Profesor', texto: report.texto_profesor, borde: 'border-l-sky-600' },
    report.texto_regente && { quien: 'Regente', texto: report.texto_regente, borde: 'border-l-brand' },
    report.texto_pat && { quien: 'PAT', texto: report.texto_pat, borde: 'border-l-violet-600' },
    report.descargo_alumno && { quien: 'Descargo del alumno', texto: report.descargo_alumno, borde: 'border-l-amber-500' },
  ].filter(Boolean);

export const fechaCorta = (fecha) => new Date(fecha).toLocaleDateString('es-AR');
