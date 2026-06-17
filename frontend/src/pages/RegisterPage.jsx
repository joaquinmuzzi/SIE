import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const RegisterPage = () => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('alumno');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cargo, setCargo] = useState('');
  const [curso, setCurso] = useState('');
  const [idPadreSeleccionado, setIdPadreSeleccionado] = useState('');
  const [hijosSeleccionados, setHijosSeleccionados] = useState([]);
  const [padres, setPadres] = useState([]);
  const [alumnosSinPadre, setAlumnosSinPadre] = useState([]);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (rol === 'alumno') {
      api.get('/auth/padres').then(({ data }) => setPadres(data)).catch(() => {});
    }
    if (rol === 'padre') {
      api.get('/auth/alumnos-sin-padre').then(({ data }) => setAlumnosSinPadre(data)).catch(() => {});
    }
  }, [rol]);

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

    if (rol === 'alumno' && !idPadreSeleccionado) {
      setError('Debes seleccionar un padre/tutor');
      return;
    }

    try {
      const usuarioCreado = await register(nombre, email, password, rol, dni, telefono, cargo, curso, idPadreSeleccionado);

      if (rol === 'padre' && usuarioCreado && usuarioCreado._id && hijosSeleccionados.length > 0) {
        await api.post('/auth/link-hijos', {
          id_padre: usuarioCreado._id,
          alumno_ids: hijosSeleccionados.map(Number),
        });
      }

      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar usuario');
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
              onChange={(e) => {
                setRol(e.target.value);
                setIdPadreSeleccionado('');
                setHijosSeleccionados([]);
              }}
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

          {rol === 'alumno' && (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Curso</label>
              <input
                type="text"
                className="w-full p-2 border rounded focus:outline-blue-500"
                placeholder="Ej: 1ro A, 2do B..."
                value={curso}
                onChange={(e) => setCurso(e.target.value)}
              />
            </div>
          )}

          {rol === 'alumno' && (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Padre / Tutor *</label>
              <select
                className="w-full p-2 border rounded focus:outline-blue-500"
                value={idPadreSeleccionado}
                onChange={(e) => setIdPadreSeleccionado(e.target.value)}
                required
              >
                <option value="">Seleccionar padre/tutor...</option>
                {padres.map((p) => (
                  <option key={p._id} value={p._id}>{p.nombre} ({p.email})</option>
                ))}
              </select>
              {padres.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No hay padres/tutores registrados aun</p>
              )}
            </div>
          )}

          {rol === 'padre' && (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Hijos (opcional)</label>
              <select
                multiple
                className="w-full p-2 border rounded focus:outline-blue-500 h-32"
                value={hijosSeleccionados}
                onChange={(e) => setHijosSeleccionados(Array.from(e.target.selectedOptions, (o) => o.value))}
              >
                {alumnosSinPadre.map((a) => (
                  <option key={a._id} value={a._id}>{a.nombre} ({a.email}){a.curso ? ` - ${a.curso}` : ''}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Mantene CTRL/CMD para seleccionar varios. Solo aparecen alumnos sin padre asignado.</p>
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
