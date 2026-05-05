import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Plus, Trash2, Edit } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [reports, setReports] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [alumnos, setAlumnos] = useState([]);
  const [formData, setFormData] = useState({ titulo: '', descripcion: '', usuarioAsignado: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchReports();
    if (user.rol === 'directivo') {
      fetchAlumnos();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/reports/${editingId}`, formData);
      } else {
        await api.post('/reports', formData);
      }
      setShowModal(false);
      setFormData({ titulo: '', descripcion: '', usuarioAsignado: '' });
      setEditingId(null);
      fetchReports();
    } catch (err) {
      alert('Error al guardar informe');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este informe?')) {
      await api.delete(`/reports/${id}`);
      fetchReports();
    }
  };

  const handleEdit = (report) => {
    setFormData({
      titulo: report.titulo,
      descripcion: report.descripcion,
      usuarioAsignado: report.usuarioAsignado._id,
    });
    setEditingId(report._id);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Panel Escolar</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 font-medium">Hola, {user.nombre} ({user.rol})</span>
          <button onClick={logout} className="text-red-500 hover:text-red-700 font-semibold">Cerrar Sesión</button>
        </div>
      </nav>

      <main className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800">Informes Recientes</h2>
          {user.rol === 'directivo' && (
            <button
              onClick={() => { setShowModal(true); setEditingId(null); setFormData({ titulo: '', descripcion: '', usuarioAsignado: '' }); }}
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
              <div key={report._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{report.titulo}</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Para: {report.usuarioAsignado.nombre} | Fecha: {new Date(report.fecha).toLocaleDateString()}
                    </p>
                  </div>
                  {user.rol === 'directivo' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(report)} className="text-gray-400 hover:text-blue-600">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(report._id)} className="text-gray-400 hover:text-red-600">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{report.descripcion}</p>
                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
                  <span className="text-xs text-gray-400">Creado por: {report.creadoPor?.nombre}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal Formulario */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 w-full max-w-lg shadow-2xl">
            <h2 className="text-xl font-bold mb-6">{editingId ? 'Editar Informe' : 'Crear Nuevo Informe'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-1">Título</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-1">Asignar a Alumno/Padre</label>
                <select
                  className="w-full p-2 border rounded"
                  value={formData.usuarioAsignado}
                  onChange={(e) => setFormData({ ...formData, usuarioAsignado: e.target.value })}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {alumnos.map(a => (
                    <option key={a._id} value={a._id}>{a.nombre} ({a.email})</option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold mb-1">Descripción</label>
                <textarea
                  className="w-full p-2 border rounded h-32"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
    </div>
  );
};

export default Dashboard;
