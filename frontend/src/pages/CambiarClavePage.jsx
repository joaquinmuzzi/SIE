import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthLayout, { BOTON_AUTH, ENTRADA_AUTH, ERROR_AUTH, ETIQUETA_AUTH } from '../components/AuthLayout';

// Primer ingreso con contraseña temporal: hay que elegir una propia antes de usar el sistema
const CambiarClavePage = () => {
  const { user, cambiarClave, logout } = useAuth();
  const navigate = useNavigate();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetida, setRepetida] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    if (nueva !== repetida) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }
    setOcupado(true);
    try {
      await cambiarClave(actual, nueva);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cambiar la contraseña');
      setOcupado(false);
    }
  };

  const campo = (label, valor, setter, ayuda) => (
    <>
      <label className={ETIQUETA_AUTH}>{label}</label>
      <div className="relative mb-4">
        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="password" className={`${ENTRADA_AUTH} pl-10`} value={valor} onChange={(e) => setter(e.target.value)} required />
      </div>
      {ayuda && <p className="text-xs font-normal text-slate-500 -mt-3 mb-4">{ayuda}</p>}
    </>
  );

  return (
    <AuthLayout
      titulo={user?.debe_cambiar_clave ? 'Elegí tu contraseña' : 'Cambiar contraseña'}
      subtitulo={user?.debe_cambiar_clave ? 'Ingresaste con una contraseña temporal. Para continuar, elegí una propia.' : 'Ingresá la actual y la nueva.'}
    >
      {error && <p className={ERROR_AUTH}>{error}</p>}
      <form onSubmit={enviar}>
        {campo(user?.debe_cambiar_clave ? 'Contraseña temporal (la del correo)' : 'Contraseña actual', actual, setActual)}
        {campo('Contraseña nueva', nueva, setNueva, 'Mínimo 8 caracteres, con letras y números.')}
        {campo('Repetir contraseña nueva', repetida, setRepetida)}
        <button disabled={ocupado} className={`${BOTON_AUTH} disabled:opacity-50`}>Guardar y continuar</button>
      </form>
      <button onClick={() => { logout(); navigate('/login'); }} className="w-full text-sm font-medium text-slate-500 hover:text-slate-800 mt-4">
        Salir
      </button>
    </AuthLayout>
  );
};

export default CambiarClavePage;
