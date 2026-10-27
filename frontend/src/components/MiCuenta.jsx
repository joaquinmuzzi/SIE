import { useState } from 'react';
import { CheckCircle, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLES, nombreCompleto } from './ui';

const ENTRADA = 'w-full bg-white border border-slate-300 rounded-sm px-3 py-2.5 font-normal focus:outline-none focus:ring-2 focus:ring-brand';
const ETIQUETA = 'block text-sm font-semibold text-slate-700 mb-1';

const Dato = ({ titulo, valor }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{titulo}</p>
    <p className="text-slate-800 mt-0.5 break-words">{valor || '—'}</p>
  </div>
);

// Datos de la cuenta (solo lectura) y cambio de contraseña del usuario logueado
const MiCuenta = () => {
  const { user, cambiarClave } = useAuth();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetida, setRepetida] = useState('');
  const [error, setError] = useState('');
  const [listo, setListo] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setListo(false);
    if (nueva !== repetida) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }
    setOcupado(true);
    try {
      await cambiarClave(actual, nueva);
      setActual('');
      setNueva('');
      setRepetida('');
      setListo(true);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cambiar la contraseña');
    } finally {
      setOcupado(false);
    }
  };

  const campo = (titulo, valor, setter, ayuda, autocompletar) => (
    <div>
      <label className={ETIQUETA}>{titulo}</label>
      <div className="relative">
        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="password" className={`${ENTRADA} pl-9`} value={valor} autoComplete={autocompletar} onChange={(e) => setter(e.target.value)} required />
      </div>
      {ayuda && <p className="text-xs font-normal text-slate-500 mt-1">{ayuda}</p>}
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-semibold text-slate-900">Mi cuenta</h1>

      <div className="bg-white border border-slate-200 rounded p-6 mt-5">
        <h2 className="font-semibold text-slate-900 mb-4">Mis datos</h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-[15px]">
          <Dato titulo="Nombre" valor={nombreCompleto(user)} />
          <Dato titulo="Correo" valor={user.email} />
          <Dato titulo="Rol" valor={ROLES[user.rol] || user.rol} />
          <Dato titulo={user.rol === 'alumno' ? 'Curso' : 'Cargo'} valor={user.rol === 'alumno' ? user.curso : user.cargo} />
          {user.dni && <Dato titulo="DNI" valor={user.dni} />}
        </div>
        <p className="text-xs font-normal text-slate-500 mt-4">Si algún dato es incorrecto, pedile al gestor o directivo de la escuela que lo corrija.</p>
      </div>

      <form onSubmit={enviar} className="bg-white border border-slate-200 rounded p-6 mt-5 space-y-4 max-w-xl">
        <h2 className="font-semibold text-slate-900">Cambiar contraseña</h2>
        {campo('Contraseña actual', actual, setActual, null, 'current-password')}
        {campo('Contraseña nueva', nueva, setNueva, 'Mínimo 8 caracteres, con letras y números.', 'new-password')}
        {campo('Repetir contraseña nueva', repetida, setRepetida, null, 'new-password')}

        {error && <p className="text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-sm px-3 py-2">{error}</p>}
        {listo && (
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-sm px-3 py-2">
            <CheckCircle size={16} /> Contraseña actualizada. Te enviamos un correo para avisarte del cambio.
          </p>
        )}
        <button disabled={ocupado} className="px-5 py-2.5 rounded-sm font-semibold bg-brand hover:bg-brand-dark text-white disabled:opacity-50">
          {ocupado ? 'Guardando…' : 'Guardar contraseña'}
        </button>
        <p className="text-xs font-normal text-slate-500">
          Si olvidaste tu contraseña actual, pedile al gestor o directivo que la restablezca.
        </p>
      </form>
    </div>
  );
};

export default MiCuenta;
