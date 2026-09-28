import { ChevronRight } from 'lucide-react';
import { Avatar, BarraAvance, Etiquetas, destinatario, etapaActual, etapas, fechaCorta, intervenciones } from './ui';

const ReportCard = ({ report, onOpen }) => {
  const n = intervenciones(report).length;
  const curso = report.alcance === 'individual' ? report.alumno?.curso : null;

  return (
    <article
      onClick={() => onOpen(report)}
      className={`bg-white rounded border border-slate-200 p-5 cursor-pointer hover:border-slate-400 transition ${report.estado === 'cerrado' ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-3">
        <Avatar report={report} />
        <div className="min-w-0 flex-1">
          <p className="font-extrabold text-slate-900 truncate">{destinatario(report)}</p>
          <p className="text-sm font-semibold text-slate-400">{[curso, fechaCorta(report.fecha)].filter(Boolean).join(' · ')}</p>
        </div>
        <span className="w-9 h-9 shrink-0 rounded-sm bg-slate-100 grid place-items-center text-slate-500">
          <ChevronRight size={18} />
        </span>
      </div>
      <h3 className="font-extrabold text-lg leading-snug mt-4 text-slate-900">{report.titulo}</h3>
      <div className="mt-3">
        <Etiquetas report={report} />
      </div>
      <div className="mt-4">
        <BarraAvance report={report} />
        <p className="text-xs font-bold text-slate-400 mt-1.5">
          {etapas(report)[etapaActual(report) - 1]} · {n} {n === 1 ? 'intervención' : 'intervenciones'}
        </p>
      </div>
    </article>
  );
};

export default ReportCard;
