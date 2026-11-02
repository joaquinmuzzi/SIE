import { ChevronRight } from 'lucide-react';
import { Avatar, BarraAvance, ChipEstado, ChipGravedad, TIPOS, destinatario, esAviso, fechaCorta, intervenciones } from './ui';

// Fila de una lista (informes o avisos): pensada para el ancho de media pantalla del panel
const ReportCard = ({ report, onOpen }) => {
  const n = intervenciones(report).length;
  const curso = report.alcance === 'individual' ? report.alumno?.curso : null;

  return (
    <article onClick={() => onOpen(report)} className="flex items-start gap-3 px-4 py-3.5 cursor-pointer hover:bg-slate-50 transition">
      <Avatar report={report} size="w-9 h-9 text-sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-medium text-slate-900 truncate">
            {destinatario(report)}
            {curso && <span className="font-normal text-slate-500"> · {curso}</span>}
          </p>
          <span className="shrink-0 text-xs text-slate-500">{fechaCorta(report.fecha)}</span>
        </div>
        <h3 className="text-[15px] font-semibold text-slate-800 leading-snug line-clamp-2 mt-0.5">{report.titulo}</h3>
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {!esAviso(report) && <ChipGravedad report={report} />}
          <ChipEstado report={report} />
          <span className="text-xs text-slate-500">
            {TIPOS[report.tipo] || report.tipo} · {n} {n === 1 ? 'intervención' : 'intervenciones'}
          </span>
        </div>
        <div className="mt-2.5 max-w-[14rem]">
          <BarraAvance report={report} />
        </div>
      </div>
      <ChevronRight size={16} className="mt-2 shrink-0 text-slate-300" />
    </article>
  );
};

export default ReportCard;
