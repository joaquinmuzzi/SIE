import { useState } from 'react';
import { ArrowLeft, Search, UserCheck } from 'lucide-react';
import { GRAVEDADES, TIPOS, nombreCompleto } from './ui';

const ENTRADA = 'w-full bg-white border border-slate-300 rounded-sm px-3 py-2.5 font-semibold focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-slate-100 disabled:text-slate-500';
const ETIQUETA = 'block text-sm font-extrabold text-slate-700 mb-1';
const GRAVEDAD_ACTIVA = { leve: 'bg-amber-50 text-amber-800 ring-amber-300', alta: 'bg-orange-50 text-orange-800 ring-orange-300', muy_alta: 'bg-red-50 text-red-800 ring-red-300' };
const ALCANCES = [['individual', 'Un alumno'], ['curso', 'Un curso'], ['todos', 'Toda la comunidad']];

const vacio = {
  titulo: '', tipo: 'conducta', gravedad: 'leve', alcance: 'individual', curso_destino: '',
  texto_profesor: '', texto_regente: '', texto_pat: '', id_alumno: '', id_padre: '',
};

const desdeInforme = (r) => ({
  titulo: r.titulo,
  tipo: r.tipo,
  gravedad: r.gravedad,
  alcance: r.alcance || 'individual',
  curso_destino: r.curso_destino || '',
  texto_profesor: r.texto_profesor || '',
  texto_regente: r.texto_regente || '',
  texto_pat: r.texto_pat || '',
  id_alumno: r.alumno?._id || '',
  id_padre: r.padre?._id || '',
});

const ReportForm = ({ report, permisos, alumnos, padres, onCancel, onSubmit }) => {
  const editando = !!report;
  const [form, setForm] = useState(editando ? desdeInforme(report) : vacio);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const bloquearDatos = editando && !permisos.editarDatos;

  const cursos = [...new Set(alumnos.map((a) => a.curso).filter(Boolean))].sort();
  const alumnosFiltrados = alumnos.filter((a) => {
    if (!busqueda) return true;
    return (a.dni || '').includes(busqueda) || nombreCompleto(a).toLowerCase().includes(busqueda.toLowerCase());
  });
  const tutor = editando
    ? nombreCompleto(report.padre)
    : nombreCompleto(padres.find((p) => String(p._id) === String(form.id_padre)));

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const elegirAlumno = (e) => {
    const alumno = alumnos.find((a) => a._id === Number(e.target.value));
    setForm({ ...form, id_alumno: e.target.value, id_padre: alumno?.id_padre ? String(alumno.id_padre) : '' });
  };

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    if (form.alcance === 'individual' && !form.id_padre) {
      setError('El alumno seleccionado no tiene padre/tutor asignado. No se puede crear el informe.');
      return;
    }
    if (form.alcance === 'curso' && !form.curso_destino) {
      setError('Seleccioná un curso destino.');
      return;
    }
    setOcupado(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el informe');
      setOcupado(false);
    }
  };

  return (
    <div>
      <button onClick={onCancel} className="inline-flex items-center gap-1 text-sm font-extrabold text-slate-500 hover:text-slate-900">
        <ArrowLeft size={18} /> Informes
      </button>
      <h1 className="text-3xl font-black text-slate-900 mt-3">{editando ? 'Editar informe' : 'Nuevo informe'}</h1>

      <form onSubmit={enviar} className="bg-white border border-slate-200 rounded p-6 mt-5 space-y-5">
        <div>
          <label className={ETIQUETA}>Título</label>
          <input className={ENTRADA} value={form.titulo} onChange={set('titulo')} disabled={bloquearDatos} required />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={ETIQUETA}>Tipo</label>
            <select className={ENTRADA} value={form.tipo} onChange={set('tipo')} disabled={bloquearDatos}>
              {Object.entries(TIPOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </div>
          <div>
            <span className={ETIQUETA}>Gravedad</span>
            <div className="flex gap-2">
              {Object.entries(GRAVEDADES).map(([v, t]) => (
                <button
                  key={v}
                  type="button"
                  disabled={bloquearDatos}
                  onClick={() => setForm({ ...form, gravedad: v })}
                  className={`flex-1 py-2.5 rounded-sm ring-1 ring-inset text-sm font-extrabold disabled:cursor-not-allowed ${form.gravedad === v ? `${GRAVEDAD_ACTIVA[v]} ring-2` : 'bg-white text-slate-500 ring-slate-200'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        {bloquearDatos && (
          <p className="text-xs font-semibold text-slate-500 -mt-2">Título, tipo y gravedad solo pueden modificarlos un Gestor o Directivo.</p>
        )}

        <div>
          <span className={ETIQUETA}>Dirigido a</span>
          <div className="grid grid-cols-3 bg-slate-100 rounded-sm p-1 text-sm font-extrabold">
            {ALCANCES.map(([v, t]) => (
              <button
                key={v}
                type="button"
                disabled={editando}
                onClick={() => setForm({ ...form, alcance: v, id_alumno: '', id_padre: '', curso_destino: '' })}
                className={`py-2 rounded-sm disabled:cursor-not-allowed ${form.alcance === v ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {form.alcance === 'individual' && editando && (
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <span className={ETIQUETA}>Alumno</span>
              <div className="bg-slate-50 border border-slate-200 rounded-sm px-3 py-2.5 font-semibold text-slate-600">{nombreCompleto(report.alumno) || 'Sin asignar'}</div>
            </div>
            <div>
              <span className={ETIQUETA}>Tutor a notificar</span>
              <div className="bg-slate-50 border border-slate-200 rounded-sm px-3 py-2.5 font-semibold text-slate-600">{tutor || 'Sin asignar'}</div>
            </div>
          </div>
        )}

        {form.alcance === 'individual' && !editando && (
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className={ETIQUETA}>Alumno (buscar por DNI o nombre)</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className={`${ENTRADA} pl-9`} placeholder="Ej: 40123456" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              </div>
              <select className={ENTRADA} value={form.id_alumno} onChange={elegirAlumno} required>
                <option value="">Seleccionar alumno...</option>
                {alumnosFiltrados.map((a) => (
                  <option key={a._id} value={a._id}>{nombreCompleto(a)}{a.dni ? ` · DNI ${a.dni}` : ''}{a.curso ? ` · ${a.curso}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <span className={ETIQUETA}>Tutor a notificar</span>
              {!form.id_alumno ? (
                <div className="bg-slate-50 border border-slate-200 rounded-sm px-3 py-2.5 font-semibold text-slate-400 text-sm">Se completa al elegir el alumno.</div>
              ) : form.id_padre ? (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-sm px-3 py-2.5 font-semibold text-slate-600">
                  <UserCheck size={18} className="text-emerald-600" /> {tutor || 'Cargando...'}
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-sm px-3 py-2.5 text-sm font-semibold text-red-700">
                  El alumno no tiene padre/tutor asignado. Hay que vincularlo antes de crear el informe.
                </div>
              )}
            </div>
          </div>
        )}

        {form.alcance === 'curso' && (
          <div>
            <label className={ETIQUETA}>Curso destino</label>
            <select className={ENTRADA} value={form.curso_destino} onChange={set('curso_destino')} disabled={editando} required>
              <option value="">Seleccionar curso...</option>
              {(editando && form.curso_destino && !cursos.includes(form.curso_destino) ? [form.curso_destino, ...cursos] : cursos).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {form.alcance === 'todos' && (
          <p className="text-sm font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-sm px-3 py-2.5">
            Este informe va a ser visible para todos los alumnos y padres/tutores del sistema.
          </p>
        )}

        {permisos.textoProfesor && (
          <div>
            <label className={ETIQUETA}>Texto del profesor</label>
            <textarea className={`${ENTRADA} h-28`} value={form.texto_profesor} onChange={set('texto_profesor')} />
          </div>
        )}
        {permisos.textoRegente && (
          <div>
            <label className={ETIQUETA}>Texto del regente</label>
            <textarea className={`${ENTRADA} h-28`} value={form.texto_regente} onChange={set('texto_regente')} />
          </div>
        )}
        {permisos.textoPat && (
          <div>
            <label className={ETIQUETA}>Texto del PAT</label>
            <textarea className={`${ENTRADA} h-28`} value={form.texto_pat} onChange={set('texto_pat')} />
          </div>
        )}

        {error && <p className="text-sm font-bold text-red-700 bg-red-50 border border-red-200 rounded-sm px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-sm font-extrabold text-slate-600 border border-slate-300">Cancelar</button>
          <button type="submit" disabled={ocupado} className="px-5 py-2.5 rounded-sm font-extrabold bg-brand hover:bg-brand-dark text-white disabled:opacity-50">
            {editando ? 'Guardar cambios' : 'Crear informe'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportForm;
