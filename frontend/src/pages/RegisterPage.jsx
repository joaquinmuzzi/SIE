import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import AuthLayout, { BOTON_AUTH, ENTRADA_AUTH, ERROR_AUTH, ETIQUETA_AUTH } from '../components/AuthLayout';

const RegisterPage = () => {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
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
      const usuarioCreado = await register(nombre, apellido, email, password, rol, dni, telefono, cargo, curso, idPadreSeleccionado);

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

  const campo = (label, value, setter, props = {}) => (
    <div>
      <label className={ETIQUETA_AUTH}>{label}</label>
      <input className={ENTRADA_AUTH} value={value} onChange={(e) => setter(e.target.value)} {...props} />
    </div>
  );

  return (
    <AuthLayout titulo="Crear cuenta" subtitulo="Registrate para acceder a los informes" ancho="max-w-lg">
      {error && <p className={ERROR_AUTH}>{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          {campo('Nombre', nombre, setNombre, { type: 'text', required: true })}
          {campo('Apellido', apellido, setApellido, { type: 'text', required: true })}
        </div>
        {campo('Email', email, setEmail, { type: 'email', required: true })}
        {campo('Contraseña', password, setPassword, { type: 'password', required: true })}
        <div className="grid sm:grid-cols-2 gap-4">
          {campo('DNI', dni, setDni, { type: 'text', placeholder: '7-8 dígitos' })}
          {campo('Teléfono', telefono, setTelefono, { type: 'text' })}
        </div>
        <div>
          <label className={ETIQUETA_AUTH}>Rol</label>
          <select
            className={ENTRADA_AUTH}
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

        {rolesConCargo.includes(rol) && campo('Cargo', cargo, setCargo, { type: 'text', placeholder: 'Ej: Director, Regente, Rector...' })}

        {rol === 'alumno' && campo('Curso', curso, setCurso, { type: 'text', placeholder: 'Ej: 6° 2°' })}

        {rol === 'alumno' && (
          <div>
            <label className={ETIQUETA_AUTH}>Padre / Tutor *</label>
            <select className={ENTRADA_AUTH} value={idPadreSeleccionado} onChange={(e) => setIdPadreSeleccionado(e.target.value)} required>
              <option value="">Seleccionar padre/tutor...</option>
              {padres.map((p) => (
                <option key={p._id} value={p._id}>{p.nombre} {p.apellido} ({p.email})</option>
              ))}
            </select>
            {padres.length === 0 && <p className="text-xs font-normal text-slate-400 mt-1">No hay padres/tutores registrados aún</p>}
          </div>
        )}

        {rol === 'padre' && (
          <div>
            <label className={ETIQUETA_AUTH}>Hijos (opcional)</label>
            <select
              multiple
              className={`${ENTRADA_AUTH} h-32`}
              value={hijosSeleccionados}
              onChange={(e) => setHijosSeleccionados(Array.from(e.target.selectedOptions, (o) => o.value))}
            >
              {alumnosSinPadre.map((a) => (
                <option key={a._id} value={a._id}>{a.nombre} {a.apellido} ({a.email}){a.curso ? ` - ${a.curso}` : ''}</option>
              ))}
            </select>
            <p className="text-xs font-normal text-slate-400 mt-1">Mantené CTRL para seleccionar varios. Solo aparecen alumnos sin padre asignado.</p>
          </div>
        )}

        <button type="submit" className={`${BOTON_AUTH} !mt-6`}>Registrarse</button>
      </form>
      <p className="text-sm font-normal text-slate-500 mt-5 text-center">
        ¿Ya tenés cuenta? <Link to="/login" className="text-brand font-semibold hover:underline">Ingresá</Link>
      </p>
    </AuthLayout>
  );
};

export default RegisterPage;
