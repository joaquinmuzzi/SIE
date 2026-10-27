import { useEffect, useState } from 'react';
import api from '../api/axios';
import { ESTADOS, GRAVEDADES, TIPOS, nombreCompleto } from './ui';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const etiquetaMes = (m) => `${MESES[Number(m.slice(5, 7)) - 1]} ${m.slice(2, 4)}`;

const Tarjeta = ({ titulo, children, className = '' }) => (
  <div className={`bg-white border border-slate-200 rounded p-5 ${className}`}>
    <h2 className="font-semibold text-slate-900 mb-4">{titulo}</h2>
    {children}
  </div>
);

// Barras horizontales sin librerias: etiqueta, barra proporcional al maximo y valor
const Barras = ({ filas, color = 'bg-slate-700' }) => {
  const max = Math.max(1, ...filas.map((f) => f.valor));
  if (filas.length === 0) return <p className="text-sm font-normal text-slate-400">Sin datos todavía.</p>;
  return (
    <div className="space-y-2.5">
      {filas.map((f) => (
        <div key={f.etiqueta} className="flex items-center gap-3 text-sm">
          <span className="w-36 shrink-0 truncate text-slate-600" title={f.etiqueta}>{f.etiqueta}</span>
          <div className="flex-1 bg-slate-100 h-5 rounded-sm overflow-hidden">
            <div className={`h-full ${f.color || color}`} style={{ width: `${(f.valor / max) * 100}%` }} />
          </div>
          <span className="w-8 text-right font-semibold text-slate-800">{f.valor}</span>
        </div>
      ))}
    </div>
  );
};

const Kpi = ({ n, texto, punto }) => (
  <div className="bg-white border border-slate-200 rounded p-4">
    <p className="text-3xl font-semibold text-slate-900">{n}</p>
    <p className="flex items-center gap-1.5 text-sm font-normal text-slate-500 mt-1"><span className={`w-2 h-2 ${punto}`} />{texto}</p>
  </div>
);

const EstadisticasPanel = ({ cursos }) => {
  const [curso, setCurso] = useState('');
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    api.get('/reports/stats', { params: curso ? { curso } : {} })
      .then(({ data }) => setDatos(data))
      .catch((err) => setError(err.response?.data?.message || 'No se pudieron cargar las estadísticas'));
  }, [curso]);

  if (error) return <p className="text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-sm px-3 py-2">{error}</p>;
  if (!datos) return <p className="text-slate-400 font-normal">Cargando…</p>;

  const maxMes = Math.max(1, ...datos.porMes.map((m) => m.total));
  const d = datos.descargos;
  const totalDescargos = d.presentados + d.vencidos + d.enPlazo;
  const pct = (n) => (totalDescargos ? (n / totalDescargos) * 100 : 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-semibold text-slate-900">Estadísticas</h1>
        <select
          className="bg-white border border-slate-300 rounded-sm px-3 py-2.5 font-normal focus:outline-none focus:ring-2 focus:ring-brand"
          value={curso}
          onChange={(e) => setCurso(e.target.value)}
        >
          <option value="">Todos los cursos</option>
          {cursos.map((c) => <option key={c._id} value={c.etiqueta}>{c.etiqueta}</option>)}
        </select>
      </div>
      <p className="text-sm font-normal text-slate-500 mt-1">{curso ? `Solo informes del curso ${curso}.` : 'Todos los informes del sistema.'}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
        <Kpi n={datos.total} texto="Informes en total" punto="bg-slate-400" />
        <Kpi n={datos.porEstado.abierto} texto="Abiertos" punto="bg-teal-500" />
        <Kpi n={datos.porEstado.en_revision} texto="En revisión" punto="bg-indigo-500" />
        <Kpi n={datos.porEstado.cerrado} texto="Cerrados" punto="bg-slate-500" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Tarjeta titulo="Informes por mes (últimos 6 meses)">
          <div className="flex items-end gap-3 h-44">
            {datos.porMes.map((m) => (
              <div key={m.mes} className="flex-1 flex flex-col items-center justify-end h-full">
                <span className="text-xs font-semibold text-slate-700 mb-1">{m.total}</span>
                <div className="w-full bg-brand rounded-t-sm" style={{ height: `${(m.total / maxMes) * 100}%`, minHeight: m.total ? 4 : 2 }} />
                <span className="text-[11px] font-normal text-slate-500 mt-1.5">{etiquetaMes(m.mes)}</span>
              </div>
            ))}
          </div>
        </Tarjeta>

        <Tarjeta titulo="Por gravedad">
          <Barras filas={[
            { etiqueta: GRAVEDADES.leve, valor: datos.porGravedad.leve, color: 'bg-slate-400' },
            { etiqueta: GRAVEDADES.alta, valor: datos.porGravedad.alta, color: 'bg-amber-500' },
            { etiqueta: GRAVEDADES.muy_alta, valor: datos.porGravedad.muy_alta, color: 'bg-red-700' },
          ]} />
          <h3 className="text-sm font-semibold text-slate-700 mt-5 mb-3">Por tipo</h3>
          <Barras filas={Object.entries(datos.porTipo).map(([k, v]) => ({ etiqueta: TIPOS[k] || k, valor: v }))} />
        </Tarjeta>

        <Tarjeta titulo="Informes por curso">
          <Barras color="bg-brand" filas={datos.porCurso.map((c) => ({ etiqueta: c.curso || 'Sin curso', valor: c.total }))} />
        </Tarjeta>

        <Tarjeta titulo="Alumnos con más informes">
          {datos.topAlumnos.length === 0 ? <p className="text-sm font-normal text-slate-400">Sin datos todavía.</p> : (
            <ol className="divide-y divide-slate-100">
              {datos.topAlumnos.map((a, i) => (
                <li key={a._id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="w-6 h-6 grid place-items-center rounded-sm bg-slate-100 text-slate-500 text-xs font-semibold">{i + 1}</span>
                  <span className="flex-1 font-medium text-slate-800">{nombreCompleto(a)}<span className="font-normal text-slate-400"> · {a.curso || 'sin curso'}</span></span>
                  <span className="font-semibold text-slate-800">{a.total}</span>
                </li>
              ))}
            </ol>
          )}
        </Tarjeta>

        <Tarjeta titulo="Descargos de los alumnos (informes individuales)" className="lg:col-span-2">
          {totalDescargos === 0 ? <p className="text-sm font-normal text-slate-400">Sin informes individuales todavía.</p> : (
            <>
              <div className="flex h-6 rounded-sm overflow-hidden bg-slate-100">
                <div className="bg-emerald-600" style={{ width: `${pct(d.presentados)}%` }} title="Presentados" />
                <div className="bg-amber-500" style={{ width: `${pct(d.enPlazo)}%` }} title="En plazo" />
                <div className="bg-slate-400" style={{ width: `${pct(d.vencidos)}%` }} title="Vencidos" />
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm font-normal text-slate-600">
                <span><span className="inline-block w-2.5 h-2.5 bg-emerald-600 mr-1.5" />Presentados: <b>{d.presentados}</b></span>
                <span><span className="inline-block w-2.5 h-2.5 bg-amber-500 mr-1.5" />Dentro del plazo: <b>{d.enPlazo}</b></span>
                <span><span className="inline-block w-2.5 h-2.5 bg-slate-400 mr-1.5" />Plazo vencido sin descargo: <b>{d.vencidos}</b></span>
              </div>
            </>
          )}
        </Tarjeta>
      </div>
      <p className="text-xs font-normal text-slate-400 mt-4">Los estados posibles son {Object.values(ESTADOS).join(', ').toLowerCase()}. Los informes a un curso o a toda la comunidad no tienen descargo.</p>
    </div>
  );
};

export default EstadisticasPanel;
