import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import AuthLayout, { BOTON_AUTH, ENTRADA_AUTH, ERROR_AUTH, ETIQUETA_AUTH } from '../components/AuthLayout';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const usuario = await login(email, password);
      navigate(usuario.debe_cambiar_clave ? '/cambiar-clave' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales inválidas');
    }
  };

  return (
    <AuthLayout titulo="Iniciar sesión" subtitulo="Informes de la Escuela Técnica N° 35">
      {error && <p className={ERROR_AUTH}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <label className={ETIQUETA_AUTH}>Email</label>
        <div className="relative mb-4">
          <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="email" className={`${ENTRADA_AUTH} pl-10`} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <label className={ETIQUETA_AUTH}>Contraseña</label>
        <div className="relative mb-6">
          <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="password" className={`${ENTRADA_AUTH} pl-10`} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className={BOTON_AUTH}>Ingresar</button>
      </form>
      <p className="text-sm font-normal text-slate-500 mt-5 text-center">
        ¿Todavía no tenés cuenta? La crea el gestor de la escuela y la contraseña temporal te llega por correo.
      </p>
    </AuthLayout>
  );
};

export default LoginPage;
