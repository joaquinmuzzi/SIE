import { useState } from 'react';
import { ArrowLeft, CheckCircle, Download, MessageSquare, Pencil, Send, Trash2 } from 'lucide-react';
import {
  Avatar, BarraAvance, Etiquetas, ROLES, destinatario, etapaActual, etapas, fechaCorta, intervenciones, nombreCompleto,
} from './ui';

const ReportDetail = ({ report, permisos, onBack, onEdit, onChangeState, onClose, onDownload, onDescargo }) => {
  const [descargo, setDescargo] = useState(report.descargo_alumno || '');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const ejecutar = async (accion) => {
    setError('');
    setOcupado(true);
    try {
      await accion();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo completar la accion');
    } finally {
      setOcupado(false);
    }
  };

  const voces = intervenciones(report);
  const pasos = etapas(report);
  const curso = report.alcance === 'individual' ? report.alumno?.curso : null;
  const tutor = report.alcance === 'individual' ? nombreCompleto(report.padre) : null;

  return (
    <div>
      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft size={18} /> Informes
      </button>

      <div className="bg-white border border-slate-200 rounded p-5 mt-4">
        <div className="flex items-center gap-3">
          <Avatar report={report} />
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{destinatario(report)}</p>
            <p className="text-sm font-normal text-slate-400">{[curso, tutor && `Tutor: ${tutor}`].filter(Boolean).join(' · ') || 'Informe general'}</p>
          </div>
        </div>
        <h1 className="font-semibold text-xl leading-snug mt-4 text-slate-900">{report.titulo}</h1>
        <div className="mt-3">
          <Etiquetas report={report} />
        </div>
        <div className="mt-5">
          <BarraAvance report={report} />
        </div>
        <div className="flex mt-1.5 text-[11px] font-semibold text-slate-400">
          {pasos.map((p, k) => (
            <span key={p} className={`flex-1 ${k < etapaActual(report) ? 'text-slate-800' : ''}`}>{p}</span>
          ))}
        </div>
        <p className="text-sm font-normal text-slate-400 mt-4">
          Creado por {nombreCompleto(report.creadoPor)} ({ROLES[report.creadoPor?.rol] || report.creadoPor?.rol}) · {fechaCorta(report.fecha)}
        </p>
      </div>

      <h2 className="font-semibold text-slate-900 mt-6 mb-3">Intervenciones</h2>
      {voces.length === 0 ? (
        <p className="text-sm font-normal text-slate-400">Todavía no hay intervenciones.</p>
      ) : (
        <div className="space-y-3">
          {voces.map((v) => (
            <div key={v.quien} className={`bg-white border border-slate-200 border-l-4 ${v.borde} rounded-sm p-4`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{v.quien}</p>
              <p className="text-[15px] text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">{v.texto}</p>
            </div>
          ))}
        </div>
      )}

      {permisos.descargo && (
        <form
          className="bg-white border border-slate-200 rounded p-5 mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            ejecutar(() => onDescargo(descargo));
          }}
        >
          <label className="flex items-center gap-2 font-semibold text-slate-900 mb-2">
            <MessageSquare size={18} /> {report.descargo_alumno ? 'Editar mi descargo' : 'Mi descargo'}
          </label>
          <textarea
            className="w-full border border-slate-300 rounded-sm px-3 py-2.5 h-32 focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="Escribí tu versión de lo que pasó..."
            value={descargo}
            onChange={(e) => setDescargo(e.target.value)}
            required
          />
          <button disabled={ocupado} className="mt-3 bg-brand hover:bg-brand-dark text-white font-semibold rounded-sm px-5 py-2.5 flex items-center gap-2 disabled:opacity-50">
            <Send size={16} /> Enviar descargo
          </button>
        </form>
      )}

      {error && <p className="mt-4 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-sm px-3 py-2">{error}</p>}

      <div className="flex flex-wrap gap-3 mt-6">
        {permisos.editar && (
          <button onClick={onEdit} className="flex-1 min-w-[140px] bg-white border border-slate-300 font-semibold rounded-sm py-3 flex items-center justify-center gap-2">
            <Pencil size={16} /> Editar
          </button>
        )}
        {permisos.cambiarEstado && report.estado === 'abierto' && (
          <button disabled={ocupado} onClick={() => ejecutar(() => onChangeState('en_revision'))} className="flex-1 min-w-[140px] bg-slate-900 text-white font-semibold rounded-sm py-3 flex items-center justify-center gap-2 disabled:opacity-50">
            <CheckCircle size={16} /> Poner en revisión
          </button>
        )}
        {permisos.cambiarEstado && report.estado === 'en_revision' && (
          <button disabled={ocupado} onClick={() => ejecutar(() => onChangeState('cerrado'))} className="flex-1 min-w-[140px] bg-brand hover:bg-brand-dark text-white font-semibold rounded-sm py-3 flex items-center justify-center gap-2 disabled:opacity-50">
            <CheckCircle size={16} /> Finalizar informe
          </button>
        )}
        {report.estado === 'cerrado' && (
          <button onClick={onDownload} className="flex-1 min-w-[140px] bg-brand hover:bg-brand-dark text-white font-semibold rounded-sm py-3 flex items-center justify-center gap-2">
            <Download size={16} /> Descargar PDF
          </button>
        )}
        {permisos.cerrar && report.estado !== 'cerrado' && (
          <button disabled={ocupado} onClick={() => ejecutar(onClose)} className="flex-1 min-w-[140px] bg-white border border-red-200 text-red-700 font-semibold rounded-sm py-3 flex items-center justify-center gap-2 disabled:opacity-50">
            <Trash2 size={16} /> Cerrar informe
          </button>
        )}
      </div>
    </div>
  );
};

export default ReportDetail;
