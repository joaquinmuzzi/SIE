import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../api/axios';

const ENTRADA = 'w-full bg-white border border-slate-300 rounded-sm px-3 py-2.5 font-normal focus:outline-none focus:ring-2 focus:ring-brand';
const ETIQUETA = 'block text-sm font-semibold text-slate-700 mb-1';
const VACIO = { anio: '1', division: '', turno: 'Mañana', especialidad: '' };

// Catalogo de cursos (año, division, turno, especialidad): de aca salen los desplegables de toda la aplicacion
const CursosPanel = ({ cursos, recargar }) => {
  const [form, setForm] = useState(VACIO);
  const [aviso, setAviso] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const crear = async (e) => {
    e.preventDefault();
    setAviso(null);
    setOcupado(true);
    try {
      const { data } = await api.post('/cursos', form);
      setAviso({ tipo: 'ok', texto: `Curso ${data.etiqueta} creado.` });
      setForm({ ...VACIO, anio: form.anio, turno: form.turno });
      recargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.response?.data?.message || 'No se pudo crear el curso' });
    } finally {
      setOcupado(false);
    }
  };

  const eliminar = async (c) => {
    if (!window.confirm(`¿Eliminar el curso ${c.etiqueta}?`)) return;
    setAviso(null);
    try {
      const { data } = await api.delete(`/cursos/${c._id}`);
      setAviso({ tipo: 'ok', texto: data.message });
      recargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.response?.data?.message || 'No se pudo eliminar el curso' });
    }
  };

  const estilos = { ok: 'bg-emerald-50 border-emerald-200 text-emerald-800', error: 'bg-red-50 border-red-200 text-red-700' };

  return (
    <div>
      <p className="text-sm font-normal text-slate-500">
        Lista oficial de cursos de la escuela. Los desplegables de «Nueva cuenta» (curso del alumno) y de los informes a un curso salen de acá, para que no haya cursos mal escritos.
      </p>

      {aviso && <div className={`mt-4 border rounded-sm px-4 py-3 text-sm font-medium ${estilos[aviso.tipo]}`}>{aviso.texto}</div>}

      <form onSubmit={crear} className="bg-white border border-slate-200 rounded p-5 mt-5">
        <p className="font-semibold text-slate-900 mb-3">Agregar curso</p>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className={ETIQUETA}>Año</label>
            <select className={ENTRADA} value={form.anio} onChange={set('anio')}>
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}°</option>)}
            </select>
          </div>
          <div>
            <label className={ETIQUETA}>División</label>
            <input className={ENTRADA} value={form.division} onChange={set('division')} placeholder="Ej: 1 o A" maxLength={3} required />
          </div>
          <div>
            <label className={ETIQUETA}>Turno</label>
            <select className={ENTRADA} value={form.turno} onChange={set('turno')}>
              {['Mañana', 'Tarde', 'Noche'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={ETIQUETA}>Especialidad</label>
            <select className={ENTRADA} value={form.especialidad} onChange={set('especialidad')}>
              <option value="">Sin especialidad</option>
              <option>Computación</option>
              <option>Automotores</option>
            </select>
          </div>
          <button disabled={ocupado} className="px-4 py-2.5 rounded-sm font-semibold bg-brand hover:bg-brand-dark text-white flex items-center justify-center gap-2 disabled:opacity-50">
            <Plus size={16} /> Agregar
          </button>
        </div>
      </form>

      <div className="mt-5 bg-white border border-slate-200 rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Curso</th><th className="px-4 py-3">Turno</th><th className="px-4 py-3">Especialidad</th>
              <th className="px-4 py-3">Alumnos</th><th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-normal">
            {cursos.map((c) => (
              <tr key={c._id}>
                <td className="px-4 py-3 font-medium text-slate-900">{c.etiqueta}</td>
                <td className="px-4 py-3 text-slate-600">{c.turno}</td>
                <td className="px-4 py-3 text-slate-600">{c.especialidad || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{c.alumnos}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => eliminar(c)} className="inline-flex items-center gap-1 text-slate-400 hover:text-red-700 font-medium" title="Eliminar (solo si no tiene alumnos ni informes)">
                    <Trash2 size={15} /> Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {cursos.length === 0 && <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-400">Todavía no hay cursos cargados.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CursosPanel;
