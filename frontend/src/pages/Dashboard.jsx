import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Plus, Trash2, Edit, MessageSquare, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [reports, setReports] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDescargoModal, setShowDescargoModal] = useState(false);
  const [alumnos, setAlumnos] = useState([]);
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [descargoReportId, setDescargoReportId] = useState(null);
  const [descargoText, setDescargoText] = useState('');
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'conducta',
    gravedad: 'leve',
    texto_profesor: '',
    texto_regente: '',
    texto_pat: '',
    id_alumno: '',
    id_padre: '',
  });

  const canCreate = ['gestor', 'directivo', 'profesor', 'preceptor', 'regente'].includes(user.rol);
  const canDelete = ['gestor', 'directivo'].includes(user.rol);
  const canChangeState = ['gestor', 'directivo', 'regente'].includes(user.rol);
  const isAlumno = user.rol === 'alumno';

  const canEditProfesor = ['gestor', 'directivo', 'profesor', 'preceptor'].includes(user.rol);
  const canEditRegente = ['gestor', 'directivo', 'regente'].includes(user.rol);
  const canEditPat = ['gestor', 'directivo', 'asesoria_pedagogica', 'doe', 'pat'].includes(user.rol);

  useEffect(() => {
    fetchReports();
    if (canCreate) {
      fetchAlumnos();
      fetchUsers();
    }
  }, []);

  const fetchReports = async () => {
    try {
      const { data } = await api.get('/reports');
      setReports(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAlumnos = async () => {
    try {
      const { data } = await api.get('/auth/alumnos');
      setAlumnos(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/auth/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/reports/${editingId}`, formData);
      } else {
        await api.post('/reports', formData);
      }
      setShowModal(false);
      resetForm();
      fetchReports();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al guardar informe');
    }
  };

  const handleDescargo = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/reports/${descargoReportId}/descargo`, { descargo_alumno: descargoText });
      setShowDescargoModal(false);
      setDescargoText('');
      setDescargoReportId(null);
      fetchReports();
    } catch (err) {
      alert('Error al guardar descargo');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Cerrar este informe?')) {
      await api.delete(`/reports/${id}`);
      fetchReports();
    }
  };

  const handleChangeState = async (id, nuevoEstado) => {
    try {
      await api.patch(`/reports/${id}/state`, { estado: nuevoEstado });
      fetchReports();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const handleEdit = (report) => {
    setFormData({
      titulo: report.titulo,
      tipo: report.tipo,
      gravedad: report.gravedad,
      texto_profesor: report.texto_profesor || '',
      texto_regente: report.texto_regente || '',
      texto_pat: report.texto_pat || '',
      id_alumno: report.alumno?._id || '',
      id_padre: report.padre?._id || '',
    });
    setEditingId(report._id);
    setShowModal(true);
  };

  const openDescargo = (report) => {
    setDescargoReportId(report._id);
    setDescargoText(report.descargo_alumno || '');
    setShowDescargoModal(true);
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      tipo: 'conducta',
      gravedad: 'leve',
      texto_profesor: '',
      texto_regente: '',
      texto_pat: '',
      id_alumno: '',
      id_padre: '',
    });
    setEditingId(null);
  };

  const handleAlumnoChange = (e) => {
    const idAlumno = e.target.value;
    const alumnoSeleccionado = alumnos.find((a) => a._id === Number(idAlumno));
    const idPadreAuto = alumnoSeleccionado?.id_padre || '';
    setFormData({ ...formData, id_alumno: idAlumno, id_padre: idPadreAuto ? String(idPadreAuto) : '' });
  };

  const gravedadBadge = (gravedad) => {
    const styles = {
      leve: 'bg-yellow-100 text-yellow-800',
      grave: 'bg-orange-100 text-orange-800',
      muy_grave: 'bg-red-100 text-red-800',
    };
    const labels = { leve: 'Leve', grave: 'Grave', muy_grave: 'Muy Grave' };
    return (
      <span className={`text-xs font-bold px-2 py-1 rounded-full ${styles[gravedad] || styles.leve}`}>
        {labels[gravedad] || gravedad}
      </span>
    );
  };

  const estadoBadge = (estado) => {
    const styles = {
      abierto: 'bg-green-100 text-green-800',
      en_revision: 'bg-blue-100 text-blue-800',
      cerrado: 'bg-gray-200 text-gray-600',
    };
    const labels = { abierto: 'Abierto', en_revision: 'En Revision', cerrado: 'Cerrado' };
    return (
      <span className={`text-xs font-bold px-2 py-1 rounded-full ${styles[estado] || styles.abierto}`}>
        {labels[estado] || estado}
      </span>
    );
  };

  const tipoBadge = (tipo) => {
    const labels = {
      conducta: 'Conducta',
      consejo_aula: 'Consejo de Aula',
      consejo_convivencia: 'Consejo de Convivencia',
    };
    return (
      <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
        {labels[tipo] || tipo}
      </span>
    );
  };

  const padres = users.filter((u) => u.rol === 'padre' || u.rol === 'tutor');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Panel Escolar</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 font-medium">
            Hola, {user.nombre} ({user.rol})
          </span>
          <button onClick={logout} className="text-red-500 hover:text-red-700 font-semibold">
            Cerrar Sesion
          </button>
        </div>
      </nav>

      <main className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800">Informes Recientes</h2>
          {canCreate && (
            <button
              onClick={() => { setShowModal(true); resetForm(); }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus size={20} /> Nuevo Informe
            </button>
          )}
        </div>

        <div className="grid gap-6">
          {reports.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No hay informes para mostrar.</p>
          ) : (
            reports.map((report) => (
              <div key={report._id} className={`bg-white p-6 rounded-xl shadow-sm border relative ${report.estado === 'cerrado' ? 'border-gray-300 opacity-70' : 'border-gray-100'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold text-gray-900">{report.titulo}</h3>
                      {tipoBadge(report.tipo)}
                      {gravedadBadge(report.gravedad)}
                      {estadoBadge(report.estado)}
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      Alumno: {report.alumno?.nombre} | Padre: {report.padre?.nombre || 'Sin asignar'} | Fecha: {new Date(report.fecha).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {canCreate && report.estado !== 'cerrado' && (
                      <button onClick={() => handleEdit(report)} className="text-gray-400 hover:text-blue-600">
                        <Edit size={18} />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDelete(report._id)} className="text-gray-400 hover:text-red-600">
                        <Trash2 size={18} />
                      </button>
                    )}
                    {canChangeState && report.estado === 'abierto' && (
                      <button
                        onClick={() => handleChangeState(report._id, 'en_revision')}
                        className="text-gray-400 hover:text-blue-600"
                        title="Poner en revision"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    {canChangeState && report.estado === 'en_revision' && (
                      <button
                        onClick={() => handleChangeState(report._id, 'cerrado')}
                        className="text-gray-400 hover:text-green-600"
                        title="Finalizar informe"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Campos de texto */}
                {report.texto_profesor && (
                  <div className="mb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Profesor:</span>
                    <p className="text-gray-700 whitespace-pre-wrap bg-blue-50 p-3 rounded mt-1">{report.texto_profesor}</p>
                  </div>
                )}
                {report.texto_regente && (
                  <div className="mb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Regente:</span>
                    <p className="text-gray-700 whitespace-pre-wrap bg-green-50 p-3 rounded mt-1">{report.texto_regente}</p>
                  </div>
                )}
                {report.texto_pat && (
                  <div className="mb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">PAT:</span>
                    <p className="text-gray-700 whitespace-pre-wrap bg-purple-50 p-3 rounded mt-1">{report.texto_pat}</p>
                  </div>
                )}

                {/* Descargo del alumno */}
                {report.descargo_alumno && (
                  <div className="mb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">Descargo del Alumno:</span>
                    <p className="text-gray-700 whitespace-pre-wrap bg-orange-50 p-3 rounded mt-1">{report.descargo_alumno}</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                  <span className="text-xs text-gray-400">Creado por: {report.creadoPor?.nombre} ({report.creadoPor?.rol})</span>
                  {isAlumno && report.alumno?._id === user._id && report.estado !== 'cerrado' && (
                    <button
                      onClick={() => openDescargo(report)}
                      className="text-orange-600 hover:text-orange-800 text-sm font-semibold flex items-center gap-1"
                    >
                      <MessageSquare size={14} />
                      {report.descargo_alumno ? 'Editar Descargo' : 'Agregar Descargo'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal Crear/Editar Informe */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-8 w-full max-w-2xl shadow-2xl my-8">
            <h2 className="text-xl font-bold mb-6">{editingId ? 'Editar Informe' : 'Crear Nuevo Informe'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Titulo</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Tipo</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  >
                    <option value="conducta">Conducta</option>
                    <option value="consejo_aula">Consejo de Aula</option>
                    <option value="consejo_convivencia">Consejo de Convivencia</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Gravedad</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={formData.gravedad}
                    onChange={(e) => setFormData({ ...formData, gravedad: e.target.value })}
                  >
                    <option value="leve">Leve</option>
                    <option value="grave">Grave</option>
                    <option value="muy_grave">Muy Grave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Alumno Afectado</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={formData.id_alumno}
                    onChange={handleAlumnoChange}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {alumnos.map((a) => (
                      <option key={a._id} value={a._id}>{a.nombre} ({a.email})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold mb-1">Padre / Tutor a Notificar *</label>
                <select
                  className="w-full p-2 border rounded"
                  value={formData.id_padre}
                  onChange={(e) => setFormData({ ...formData, id_padre: e.target.value })}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {padres.map((p) => (
                    <option key={p._id} value={p._id}>{p.nombre} ({p.email})</option>
                  ))}
                </select>
              </div>

              {canEditProfesor && (
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-1">Texto del Profesor</label>
                  <textarea
                    className="w-full p-2 border rounded h-24"
                    value={formData.texto_profesor}
                    onChange={(e) => setFormData({ ...formData, texto_profesor: e.target.value })}
                  />
                </div>
              )}
              {canEditRegente && (
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-1">Texto del Regente</label>
                  <textarea
                    className="w-full p-2 border rounded h-24"
                    value={formData.texto_regente}
                    onChange={(e) => setFormData({ ...formData, texto_regente: e.target.value })}
                  />
                </div>
              )}
              {canEditPat && (
                <div className="mb-6">
                  <label className="block text-sm font-bold mb-1">Texto del PAT</label>
                  <textarea
                    className="w-full p-2 border rounded h-24"
                    value={formData.texto_pat}
                    onChange={(e) => setFormData({ ...formData, texto_pat: e.target.value })}
                  />
                </div>
              )}

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Descargo del Alumno */}
      {showDescargoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 w-full max-w-lg shadow-2xl">
            <h2 className="text-xl font-bold mb-6">Mi Descargo</h2>
            <form onSubmit={handleDescargo}>
              <div className="mb-6">
                <label className="block text-sm font-bold mb-1">Respuesta / Descargo</label>
                <textarea
                  className="w-full p-2 border rounded h-40"
                  placeholder="Escribi tu descargo aqui..."
                  value={descargoText}
                  onChange={(e) => setDescargoText(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => { setShowDescargoModal(false); setDescargoText(''); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  Enviar Descargo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
