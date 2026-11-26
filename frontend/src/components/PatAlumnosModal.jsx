import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Search, X } from 'lucide-react';
import { nombreCompleto } from './ui';

const ENTRADA = 'w-full bg-white border border-slate-300 rounded-sm px-3 py-2 font-normal text-sm focus:outline-none focus:ring-2 focus:ring-brand';

// Orden natural de cursos: 1° 1°, 1° 2°, ..., 6° 3°; los alumnos sin curso al final
const claveCurso = (c) => (c ? c.replace(/\d+/g, (n) => n.padStart(3, '0')) : '~');

// Ventana para asignar la función de PAT y elegir los alumnos que la persona tiene a cargo
const PatAlumnosModal = ({ pat, usuarios, onCerrar, onGuardar }) => {
  const alumnos = useMemo(() => usuarios.filter((u) => u.rol === 'alumno'), [usuarios]);
  const nombres = useMemo(() => Object.fromEntries(usuarios.map((u) => [u._id, nombreCompleto(u)])), [usuarios]);
  const [elegidos, setElegidos] = useState(() => new Set(alumnos.filter((a) => a.id_pat === pat._id).map((a) => a._id)));
  const [busqueda, setBusqueda] = useState('');
  const [curso, setCurso] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onCerrar]);

  const cursos = useMemo(() => [...new Set(alumnos.map((a) => a.curso).filter(Boolean))].sort((a, b) => claveCurso(a).localeCompare(claveCurso(b))), [alumnos]);
  const visibles = alumnos.filter((a) => {
    const t = busqueda.trim().toLowerCase();
    return (!curso || a.curso === curso) && (!t || `${nombreCompleto(a)} ${a.dni || ''} ${a.curso || ''}`.toLowerCase().includes(t));
  });
  const grupos = visibles.reduce((g, a) => {
    const k = a.curso || 'Sin curso';
    (g[k] = g[k] || []).push(a);
    return g;
  }, {});
  const ordenGrupos = Object.keys(grupos).sort((a, b) => claveCurso(a === 'Sin curso' ? '' : a).localeCompare(claveCurso(b === 'Sin curso' ? '' : b)));

  const alternar = (ids, marcar) => setElegidos((prev) => {
    const s = new Set(prev);
    ids.forEach((id) => (marcar ? s.add(id) : s.delete(id)));
    return s;
  });

  const guardar = async () => {
    setGuardando(true);
    setError('');
    try {
      await onGuardar([...elegidos]);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron guardar los alumnos a cargo');
      setGuardando(false);
    }
  };

  const reasignados = alumnos.filter((a) => elegidos.has(a._id) && a.id_pat && a.id_pat !== pat._id).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div role="dialog" aria-modal="true" aria-labelledby="pat-titulo" className="bg-white w-full sm:max-w-2xl max-h-[92vh] flex flex-col rounded-t sm:rounded shadow-xl">
        <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-slate-200">
          <div>
            <h2 id="pat-titulo" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <BadgeCheck size={20} className="text-violet-700" /> Alumnos a cargo de {nombreCompleto(pat)}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {pat.es_pat ? 'Elegí los alumnos que acompaña como PAT.' : 'Al guardar se le asigna la función de PAT con estos alumnos a cargo.'}
            </p>
          </div>
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-700" aria-label="Cerrar"><X size={20} /></button>
        </header>

        <div className="px-5 py-3 flex flex-col sm:flex-row gap-2 border-b border-slate-200">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${ENTRADA} pl-8`} placeholder="Buscar alumno por nombre, DNI o curso" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} autoFocus />
          </div>
          <select className={`${ENTRADA} sm:w-44`} value={curso} onChange={(e) => setCurso(e.target.value)}>
            <option value="">Todos los cursos</option>
            {cursos.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-2">
          {ordenGrupos.length === 0 && <p className="py-10 text-center text-sm text-slate-400">No hay alumnos para mostrar.</p>}
          {ordenGrupos.map((g) => {
            const ids = grupos[g].map((a) => a._id);
            const todos = ids.every((id) => elegidos.has(id));
            return (
              <section key={g} className="py-2">
                <div className="flex items-center justify-between sticky top-0 bg-white py-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{g} <span className="text-slate-400 normal-case">· {ids.filter((id) => elegidos.has(id)).length}/{ids.length}</span></p>
                  <button onClick={() => alternar(ids, !todos)} className="text-xs font-semibold text-violet-700 hover:underline">
                    {todos ? 'Quitar el curso' : 'Elegir todo el curso'}
                  </button>
                </div>
                {grupos[g].map((a) => {
                  const otro = a.id_pat && a.id_pat !== pat._id ? nombres[a.id_pat] : null;
                  return (
                    <label key={a._id} className="flex items-center gap-3 px-2 py-2 rounded-sm hover:bg-slate-50 cursor-pointer">
                      <input type="checkbox" className="accent-violet-700 w-4 h-4" checked={elegidos.has(a._id)} onChange={(e) => alternar([a._id], e.target.checked)} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-slate-800 truncate">{nombreCompleto(a)}</span>
                        {otro && <span className="block text-xs text-amber-700">Hoy a cargo de {otro}</span>}
                      </span>
                      {a.dni && <span className="text-xs text-slate-400">DNI {a.dni}</span>}
                    </label>
                  );
                })}
              </section>
            );
          })}
        </div>

        <footer className="px-5 py-3 border-t border-slate-200">
          {reasignados > 0 && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2 mb-3">
              {reasignados === 1 ? '1 alumno elegido tiene' : `${reasignados} alumnos elegidos tienen`} otro PAT: al guardar pasan a estar a cargo de {nombreCompleto(pat)}.
            </p>
          )}
          {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-sm px-3 py-2 mb-3">{error}</p>}
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-600">{elegidos.size} {elegidos.size === 1 ? 'alumno elegido' : 'alumnos elegidos'}</span>
            <div className="flex gap-2">
              <button onClick={onCerrar} className="px-4 py-2 rounded-sm border border-slate-300 text-sm font-semibold text-slate-600">Cancelar</button>
              <button onClick={guardar} disabled={guardando} className="px-4 py-2 rounded-sm bg-violet-700 hover:bg-violet-800 text-white text-sm font-semibold disabled:opacity-50">
                {guardando ? 'Guardando...' : pat.es_pat ? 'Guardar' : 'Asignar PAT'}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PatAlumnosModal;
