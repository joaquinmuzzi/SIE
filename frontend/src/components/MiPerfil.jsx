import { useState } from 'react';
import { CheckCircle, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLES, iniciales, nombreCompleto } from './ui';

const ENTRADA = 'w-full bg-white border border-slate-300 rounded-sm px-3 py-2.5 font-normal focus:outline-none focus:ring-2 focus:ring-brand';

const Dato = ({ titulo, valor }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{titulo}</p>
    <p className="text-slate-800 mt-0.5 break-words">{valor || '—'}</p>
  </div>
);

// Mi perfil: datos personales del usuario logueado. Solo el teléfono lo edita cada uno;
// la contraseña está aparte, en Configuración de la cuenta.
const MiPerfil = () => {
  const { user, actualizarPerfil } = useAuth();
  const [telefono, setTelefono] = useState(user.telefono || '');
  const [error, setError] = useState('');
  const [listo, setListo] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const esAlumno = user.rol === 'alumno';
  const funcionPat = ['profesor', 'preceptor'].includes(user.rol) && user.es_pat;

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    setListo(false);
    setOcupado(true);
    try {
      await actualizarPerfil({ telefono });
      setListo(true);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el teléfono');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold text-slate-900">Mi perfil</h1>

      <div className="bg-white border border-slate-200 rounded p-6 mt-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 shrink-0 rounded-sm bg-brand text-white grid place-items-center text-2xl font-semibold">{iniciales(user)}</div>
          <div className="min-w-0">
            <p className="text-xl font-semibold text-slate-900">{nombreCompleto(user)}</p>
            <p className="text-slate-500">
              {ROLES[user.rol] || user.rol}
              {funcionPat && <span className="ml-2 inline-flex rounded-sm bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-200">Función PAT</span>}
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-[15px] mt-6">
          <Dato titulo="Correo" valor={user.email} />
          <Dato titulo={esAlumno ? 'Curso' : 'Cargo'} valor={esAlumno ? user.curso : user.cargo} />
          <Dato titulo="DNI" valor={user.dni} />
          <Dato titulo="Rol" valor={ROLES[user.rol] || user.rol} />
        </div>
        {funcionPat && (
          <p className="text-sm font-normal text-slate-600 mt-4">Además de tu rol, cumplís la función de PAT: podés redactar el texto del PAT en los informes.</p>
        )}
      </div>

      {esAlumno && (
        <div className="bg-white border border-slate-200 rounded p-6 mt-5">
          <h2 className="font-semibold text-slate-900">Mi responsable</h2>
          <p className="text-xs font-normal text-slate-500 mt-0.5 mb-4">Recibe por correo los avisos de tus informes.</p>
          <div className="grid sm:grid-cols-3 gap-x-8 gap-y-4 text-[15px]">
            <Dato titulo="Nombre" valor={user.responsable_nombre} />
            <Dato titulo="Correo" valor={user.responsable_email} />
            <Dato titulo="Teléfono" valor={user.responsable_telefono} />
          </div>
        </div>
      )}

      <form onSubmit={guardar} className="bg-white border border-slate-200 rounded p-6 mt-5 max-w-xl space-y-3">
        <label className="block font-semibold text-slate-900" htmlFor="telefono">Mi teléfono</label>
        <div className="relative">
          <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input id="telefono" className={`${ENTRADA} pl-9`} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej: 11 4567-8901" />
        </div>
        {error && <p className="text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-sm px-3 py-2">{error}</p>}
        {listo && (
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-sm px-3 py-2">
            <CheckCircle size={16} /> Teléfono actualizado.
          </p>
        )}
        <button disabled={ocupado} className="px-5 py-2.5 rounded-sm font-semibold bg-brand hover:bg-brand-dark text-white disabled:opacity-50">
          {ocupado ? 'Guardando…' : 'Guardar teléfono'}
        </button>
        <p className="text-xs font-normal text-slate-500">El resto de los datos los corrige el gestor o directivo de la escuela.</p>
      </form>
    </div>
  );
};

export default MiPerfil;
