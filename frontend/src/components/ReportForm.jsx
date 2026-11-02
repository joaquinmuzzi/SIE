import { useState } from 'react';
import { ArrowLeft, Clock, MailWarning, Plus, Search, UserCheck } from 'lucide-react';
import { GRAVEDADES, PLAZOS, TIPOS, ChipGravedad, nombreCompleto } from './ui';
import { FRASES, TITULOS_AVISO, TITULOS_INFORME, agregarFrase } from '../utils/sugerencias';

const ENTRADA = 'w-full bg-white border border-slate-300 rounded-sm px-3 py-2.5 font-normal focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-slate-100 disabled:text-slate-500';
const ETIQUETA = 'block text-sm font-semibold text-slate-700 mb-1';
const GRAVEDAD_ACTIVA = { leve: 'bg-slate-100 text-slate-800 ring-slate-400', alta: 'bg-amber-50 text-amber-800 ring-amber-300', muy_alta: 'bg-red-50 text-red-800 ring-red-300' };
// Un aviso va a un curso o a toda la comunidad; un informe, siempre a un alumno
const ALCANCES_AVISO = [['curso', 'Un curso'], ['todos', 'Toda la comunidad']];

const vacio = (modo) => ({
  titulo: '', tipo: 'conducta', gravedad: '', alcance: modo === 'aviso' ? 'curso' : 'individual', curso_destino: '',
  texto_profesor: '', texto_regente: '', texto_pat: '', id_alumno: '',
});

// Frases habituales que se agregan al texto con un clic (autocompletado simple, sin IA)
const Frases = ({ campo, valor, onAgregar }) => (
  <div className="flex flex-wrap gap-1.5 mt-2" aria-label="Frases frecuentes">
    {FRASES[campo].map((f) => (
      <button
        key={f}
        type="button"
        onClick={() => onAgregar(agregarFrase(valor, f))}
        className="inline-flex items-center gap-1 rounded-sm border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-white"
      >
        <Plus size={12} /> {f}
      </button>
    ))}
  </div>
);

const desdeInforme = (r) => ({
  titulo: r.titulo,
  tipo: r.tipo,
  gravedad: r.gravedad || '',
  alcance: r.alcance || 'individual',
  curso_destino: r.curso_destino || '',
  texto_profesor: r.texto_profesor || '',
  texto_regente: r.texto_regente || '',
  texto_pat: r.texto_pat || '',
  id_alumno: r.alumno?._id || '',
});

const ReportForm = ({ report, modo = 'informe', permisos, alumnos, cursos: catalogo = [], onCancel, onSubmit }) => {
  const editando = !!report;
  const esAviso = modo === 'aviso';
  const nombre = esAviso ? 'aviso' : 'informe';
  const [form, setForm] = useState(editando ? desdeInforme(report) : vacio(modo));
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const bloquearDatos = editando && !permisos.editarDatos;

  // Los cursos salen del catalogo oficial, no de lo que haya escrito cada alumno
  const cursos = catalogo.map((c) => c.etiqueta);
  const alumnosFiltrados = alumnos.filter((a) => {
    if (!busqueda) return true;
    return (a.dni || '').includes(busqueda) || nombreCompleto(a).toLowerCase().includes(busqueda.toLowerCase());
  });
  // El responsable (padre, madre o tutor) no tiene cuenta: se le avisa por el correo cargado en la ficha del alumno
  const alumnoElegido = alumnos.find((a) => String(a._id) === String(form.id_alumno));
  const responsable = editando ? report.alumno : alumnoElegido;

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const elegirAlumno = (e) => {
    setForm({ ...form, id_alumno: e.target.value });
  };

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    if (form.alcance === 'individual' && !form.id_alumno) {
      setError('Seleccioná un alumno.');
      return;
    }
    if (form.alcance === 'curso' && !form.curso_destino) {
      setError('Seleccioná un curso destino.');
      return;
    }
    setOcupado(true);
    // La gravedad solo la envían el gestor y la regencia, y solo en los informes
    const datos = { ...form };
    if (esAviso || !permisos.gravedad) delete datos.gravedad;
    try {
      await onSubmit(datos);
    } catch (err) {
      setError(err.response?.data?.message || `Error al guardar el ${nombre}`);
      setOcupado(false);
    }
  };

  return (
    <div>
      <button onClick={onCancel} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft size={18} /> Volver
      </button>
      <h1 className="text-3xl font-semibold text-slate-900 mt-3">{editando ? `Editar ${nombre}` : `Nuevo ${nombre}`}</h1>

      <form onSubmit={enviar} className="bg-white border border-slate-200 rounded p-6 mt-5 space-y-5">
        <div>
          <label className={ETIQUETA} htmlFor="titulo">Título</label>
          <input id="titulo" className={ENTRADA} value={form.titulo} onChange={set('titulo')} disabled={bloquearDatos} required list="titulos-sugeridos" autoComplete="off" />
          {/* Autocompletado: titulos frecuentes segun el tipo (el navegador los sugiere al escribir) */}
          <datalist id="titulos-sugeridos">
            {(esAviso ? TITULOS_AVISO : TITULOS_INFORME[form.tipo] || []).map((t) => <option key={t} value={t} />)}
          </datalist>
          {!bloquearDatos && <p className="text-xs font-normal text-slate-500 mt-1">Empezá a escribir y elegí una sugerencia, o escribí un título propio.</p>}
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={ETIQUETA}>Tipo</label>
            <select className={ENTRADA} value={form.tipo} onChange={set('tipo')} disabled={bloquearDatos}>
              {Object.entries(TIPOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </div>
          {!esAviso && (permisos.gravedad ? (
            <div>
              <span className={ETIQUETA}>Gravedad</span>
              <div className="flex gap-2">
                {Object.entries(GRAVEDADES).map(([v, t]) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={form.gravedad === v}
                    onClick={() => setForm({ ...form, gravedad: form.gravedad === v ? '' : v })}
                    className={`flex-1 py-2.5 rounded-sm ring-1 ring-inset text-sm font-semibold ${form.gravedad === v ? `${GRAVEDAD_ACTIVA[v]} ring-2` : 'bg-white text-slate-500 ring-slate-200'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="text-xs font-normal text-slate-500 mt-1">{form.gravedad ? 'Volvé a tocar la gravedad elegida para dejarla sin asignar.' : 'Sin asignar.'}</p>
            </div>
          ) : (
            <div>
              <span className={ETIQUETA}>Gravedad</span>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-sm px-3 py-2.5">
                <ChipGravedad report={{ gravedad: form.gravedad }} />
                <span className="text-xs font-normal text-slate-500">La asignan la regencia o el gestor.</span>
              </div>
            </div>
          ))}
        </div>
        {bloquearDatos && (
          <p className="text-xs font-normal text-slate-500 -mt-2">El título y el tipo solo pueden modificarlos un Gestor o Directivo.</p>
        )}

        {esAviso && (
        <div>
          <span className={ETIQUETA}>Dirigido a</span>
          <div className="grid grid-cols-2 bg-slate-100 rounded-sm p-1 text-sm font-semibold">
            {ALCANCES_AVISO.map(([v, t]) => (
              <button
                key={v}
                type="button"
                disabled={editando}
                onClick={() => setForm({ ...form, alcance: v, id_alumno: '', curso_destino: '' })}
                className={`py-2 rounded-sm disabled:cursor-not-allowed ${form.alcance === v ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        )}

        {form.alcance === 'individual' && editando && (
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <span className={ETIQUETA}>Alumno</span>
              <div className="bg-slate-50 border border-slate-200 rounded-sm px-3 py-2.5 font-normal text-slate-600">{nombreCompleto(report.alumno) || 'Sin asignar'}</div>
            </div>
            <div>
              <span className={ETIQUETA}>Responsable a notificar</span>
              <div className="bg-slate-50 border border-slate-200 rounded-sm px-3 py-2.5 font-normal text-slate-600">{responsable?.responsable_nombre || 'Sin cargar'}</div>
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
              <span className={ETIQUETA}>Responsable a notificar (por correo)</span>
              {!form.id_alumno ? (
                <div className="bg-slate-50 border border-slate-200 rounded-sm px-3 py-2.5 font-normal text-slate-400 text-sm">Se completa al elegir el alumno.</div>
              ) : responsable?.responsable_email ? (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-sm px-3 py-2.5 font-normal text-slate-600">
                  <UserCheck size={18} className="text-emerald-600 shrink-0" />
                  <span className="min-w-0">{responsable.responsable_nombre}<span className="block text-xs text-slate-400 truncate">{responsable.responsable_email}</span></span>
                </div>
              ) : (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2.5 text-sm font-normal text-amber-800">
                  <MailWarning size={18} className="shrink-0 mt-0.5" /> Este alumno no tiene un responsable con correo cargado: el informe se crea, pero nadie va a recibir el aviso.
                </div>
              )}
            </div>
          </div>
        )}

        {form.alcance === 'individual' && !editando && (
          <p className="flex items-start gap-2 text-sm font-normal text-slate-600 bg-slate-50 border border-slate-200 rounded-sm px-3 py-2.5">
            <Clock size={16} className="shrink-0 mt-0.5 text-slate-400" />
            Al crearlo, el alumno recibe un aviso y tiene {PLAZOS.descargo} días hábiles para presentar su descargo. Pasado el plazo, el informe pasa solo a revisión y, si nadie lo cierra, se cierra automáticamente a los {PLAZOS.cierre} días hábiles.
          </p>
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
          <p className="text-sm font-normal text-slate-500 bg-slate-50 border border-slate-200 rounded-sm px-3 py-2.5">
            Este aviso va a ser visible para todos los alumnos del sistema.
          </p>
        )}

        {permisos.textoProfesor && (
          <div>
            <label className={ETIQUETA}>{esAviso ? 'Texto del aviso' : 'Texto del profesor'}</label>
            <textarea className={`${ENTRADA} h-28`} value={form.texto_profesor} onChange={set('texto_profesor')} />
            {!esAviso && <Frases campo="texto_profesor" valor={form.texto_profesor} onAgregar={(t) => setForm({ ...form, texto_profesor: t })} />}
          </div>
        )}
        {permisos.textoRegente && (
          <div>
            <label className={ETIQUETA}>Texto del regente</label>
            <textarea className={`${ENTRADA} h-28`} value={form.texto_regente} onChange={set('texto_regente')} />
            {!esAviso && <Frases campo="texto_regente" valor={form.texto_regente} onAgregar={(t) => setForm({ ...form, texto_regente: t })} />}
          </div>
        )}
        {permisos.textoPat && (
          <div>
            <label className={ETIQUETA}>Texto del PAT</label>
            <textarea className={`${ENTRADA} h-28`} value={form.texto_pat} onChange={set('texto_pat')} />
            {!esAviso && <Frases campo="texto_pat" valor={form.texto_pat} onAgregar={(t) => setForm({ ...form, texto_pat: t })} />}
          </div>
        )}

        {error && <p className="text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-sm px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-sm font-semibold text-slate-600 border border-slate-300">Cancelar</button>
          <button type="submit" disabled={ocupado} className="px-5 py-2.5 rounded-sm font-semibold bg-brand hover:bg-brand-dark text-white disabled:opacity-50">
            {editando ? 'Guardar cambios' : `Crear ${nombre}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportForm;
