import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import api from '../api/axios';
import ReportCard from './ReportCard';

const PAGE_SIZE = 8;
const FILTROS = [['', 'Todos'], ['abierto', 'Abiertos'], ['en_revision', 'En revisión'], ['cerrado', 'Cerrados']];

// Una de las dos tarjetas del panel: informes (a un alumno) o avisos (a un curso o a toda la comunidad).
// Cada tarjeta tiene su propio filtro por estado y su paginación; la búsqueda y el curso se comparten.
const PanelLista = ({ grupo, titulo, descripcion, icono: Icono, vacio, busqueda, curso, version, onOpen, onNuevo, textoNuevo, onCounts }) => {
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ abierto: 0, en_revision: 0, cerrado: 0 });
  const [estado, setEstado] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => { setPage(1); }, [busqueda, curso]);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    const params = { grupo, page, limit: PAGE_SIZE };
    if (estado) params.estado = estado;
    if (busqueda) params.q = busqueda;
    if (curso) params.curso = curso;
    api.get('/reports', { params })
      .then(({ data }) => {
        if (!vigente) return;
        setReports(data.reports);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
        if (data.counts) {
          setCounts(data.counts);
          onCounts?.(grupo, data.counts);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupo, page, estado, busqueda, curso, version]);

  const filtrando = busqueda || curso || estado;

  return (
    <section className="bg-white border border-slate-200 rounded flex flex-col min-w-0" aria-label={titulo}>
      <header className="px-4 pt-4 pb-3 border-b border-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Icono size={18} className="text-brand" /> {titulo}
              <span className="text-sm font-medium text-slate-400">{total}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{descripcion}</p>
          </div>
          {onNuevo && (
            <button onClick={onNuevo} className="shrink-0 inline-flex items-center gap-1.5 rounded-sm bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-3 py-2">
              <Plus size={16} /> {textoNuevo}
            </button>
          )}
        </div>
        <div className="flex gap-1.5 mt-3 overflow-x-auto pb-0.5">
          {FILTROS.map(([valor, texto]) => (
            <button
              key={texto}
              onClick={() => { setEstado(valor); setPage(1); }}
              className={`px-3 py-1.5 rounded-sm font-semibold text-xs whitespace-nowrap ${estado === valor ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}
            >
              {texto}
              {valor && <span className={estado === valor ? 'text-slate-400' : 'text-slate-300'}> {counts[valor]}</span>}
            </button>
          ))}
        </div>
      </header>

      {!cargando && reports.length === 0 ? (
        <p className="text-center text-sm font-normal text-slate-400 px-4 py-12">
          {filtrando ? 'No hay resultados con estos filtros.' : vacio}
        </p>
      ) : (
        <div className={`divide-y divide-slate-200 ${cargando ? 'opacity-60' : ''}`}>
          {reports.map((report) => <ReportCard key={report._id} report={report} onOpen={onOpen} />)}
        </div>
      )}

      {totalPages > 1 && (
        <footer className="mt-auto flex justify-between items-center gap-3 px-4 py-3 border-t border-slate-200">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm border border-slate-300 text-sm font-medium text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={15} /> Anterior
          </button>
          <span className="text-xs font-medium text-slate-500">Página {page} de {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm border border-slate-300 text-sm font-medium text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Siguiente <ChevronRight size={15} />
          </button>
        </footer>
      )}
    </section>
  );
};

export default PanelLista;
