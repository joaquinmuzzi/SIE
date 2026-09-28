import { ChevronRight } from 'lucide-react';
import { Avatar, BarraAvance, ChipEstado, ChipGravedad, TIPOS, destinatario, fechaCorta, intervenciones } from './ui';

// Columnas compartidas por el encabezado y cada fila; solo con pantalla ancha (con el lateral, en menos espacio se apilan)
export const COLUMNAS = 'xl:grid xl:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_5.5rem_7.5rem_5.5rem_1rem] xl:items-center xl:gap-5';

export const EncabezadoLista = () => (
  <div className={`hidden ${COLUMNAS} px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500`}>
    <span>Destinatario</span>
    <span>Informe</span>
    <span>Gravedad</span>
    <span>Estado</span>
    <span>Fecha</span>
    <span />
  </div>
);

// Fila de la lista de informes: a todo el ancho en compu, apilada en celular
const ReportCard = ({ report, onOpen }) => {
  const n = intervenciones(report).length;
  const curso = report.alcance === 'individual' ? report.alumno?.curso : null;

  return (
    <article
      onClick={() => onOpen(report)}
      className={`${COLUMNAS} flex flex-col gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 transition`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Avatar report={report} size="w-9 h-9 text-sm" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900 truncate">{destinatario(report)}</p>
          {curso && <p className="text-xs text-slate-500">{curso}</p>}
        </div>
        <span className="xl:hidden text-xs text-slate-500">{fechaCorta(report.fecha)}</span>
      </div>

      <div className="min-w-0">
        <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2">{report.titulo}</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {TIPOS[report.tipo] || report.tipo} · {n} {n === 1 ? 'intervención' : 'intervenciones'}
        </p>
      </div>

      <div className="flex xl:block gap-1.5 flex-wrap">
        <ChipGravedad report={report} />
        <span className="xl:hidden"><ChipEstado report={report} /></span>
      </div>

      <div className="space-y-1.5">
        <span className="hidden xl:inline-flex"><ChipEstado report={report} /></span>
        <BarraAvance report={report} />
      </div>

      <span className="hidden xl:block text-sm text-slate-500">{fechaCorta(report.fecha)}</span>
      <ChevronRight size={16} className="hidden xl:block text-slate-400" />
    </article>
  );
};

export default ReportCard;
