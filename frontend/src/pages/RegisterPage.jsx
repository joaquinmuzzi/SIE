import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage = () => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('alumno');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cargo, setCargo] = useState('');
  const [curso, setCurso] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (dni && !/^\d{7,8}$/.test(dni)) {
      setError('El DNI debe contener entre 7 y 8 digitos');
      return;
    }

    if ((rol === 'profesor' || rol === 'preceptor') && !email.endsWith('@bue.edu.ar')) {
      setError('El email del profesor/preceptor debe ser @bue.edu.ar');
      return;
    }

    try {
      await register(nombre, email, password, rol, dni, telefono, cargo, curso);
      navigate('/');
    } catch (err) {
      setError('Error al registrar usuario');
    }
  };

  const rolesConCargo = ['gestor', 'directivo', 'regente'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Registro</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Nombre</label>
            <input
              type="text"
              className="w-full p-2 border rounded focus:outline-blue-500"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              className="w-full p-2 border rounded focus:outline-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Contrasena</label>
            <input
              type="password"
              className="w-full p-2 border rounded focus:outline-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">DNI</label>
            <input
              type="text"
              className="w-full p-2 border rounded focus:outline-blue-500"
              placeholder="7-8 digitos"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Telefono</label>
            <input
              type="text"
              className="w-full p-2 border rounded focus:outline-blue-500"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Rol</label>
            <select
              className="w-full p-2 border rounded focus:outline-blue-500"
              value={rol}
              onChange={(e) => setRol(e.target.value)}
            >
              <option value="alumno">Alumno</option>
              <option value="padre">Padre / Tutor</option>
              <option value="profesor">Profesor</option>
              <option value="preceptor">Preceptor</option>
              <option value="regente">Regente</option>
              <option value="gestor">Gestor (Rector, Vicerrector, etc.)</option>
              <option value="directivo">Directivo</option>
              <option value="secretaria">Secretaria</option>
              <option value="asesoria_pedagogica">Asesoria Pedagogica / DOE / PAT</option>
            </select>
          </div>
          {rolesConCargo.includes(rol) && (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Cargo</label>
              <input
                type="text"
                className="w-full p-2 border rounded focus:outline-blue-500"
                placeholder="Ej: Director, Regente, Rector..."
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
              />
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
          >
            Registrarse
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Ya tienes cuenta? <Link to="/login" className="text-blue-600 hover:underline">Ingresa</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
