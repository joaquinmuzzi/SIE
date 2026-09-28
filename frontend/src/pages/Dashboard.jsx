import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { jsPDF } from 'jspdf';
import { Plus, Trash2, Edit, MessageSquare, CheckCircle, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 10;

const nombreCompleto = (persona) => {
  if (!persona) return '';
  return [persona.nombre, persona.apellido].filter(Boolean).join(' ');
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showDescargoModal, setShowDescargoModal] = useState(false);
  const [alumnos, setAlumnos] = useState([]);
  const [padres, setPadres] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingReport, setEditingReport] = useState(null);
  const [descargoReportId, setDescargoReportId] = useState(null);
  const [descargoText, setDescargoText] = useState('');
  const [busquedaAlumno, setBusquedaAlumno] = useState('');
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'conducta',
    gravedad: 'leve',
    alcance: 'individual',
    curso_destino: '',
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
  const isAdmin = ['gestor', 'directivo'].includes(user.rol);

  // Profesores y preceptores solo editan los informes que crearon; regencia, PAT/DOE y gestores editan cualquiera abierto
  const canEditReport = (report) => {
    if (report.estado === 'cerrado') return false;
    if (isAdmin || user.rol === 'regente' || ['asesoria_pedagogica', 'doe', 'pat'].includes(user.rol)) return true;
    if (['profesor', 'preceptor'].includes(user.rol)) return report.creadoPor?._id === user._id;
    return false;
  };
  // Titulo, tipo y gravedad solo los cambia quien crea el informe o un gestor/directivo
  const canEditMeta = !editingId || isAdmin;

  const cursosDisponibles = [...new Set(alumnos.map((a) => a.curso).filter(Boolean))].sort();

  const alumnosFiltrados = alumnos.filter((a) => {
    if (!busquedaAlumno) return true;
    const term = busquedaAlumno.toLowerCase();
    return (a.dni || '').includes(busquedaAlumno) || nombreCompleto(a).toLowerCase().includes(term);
  });

  useEffect(() => {
    fetchReports(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (canCreate) {
      fetchAlumnos();
      fetchPadres();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReports = async (pageToFetch = 1) => {
    try {
      const { data } = await api.get('/reports', { params: { page: pageToFetch, limit: PAGE_SIZE } });
      setReports(data.reports);
      setTotalPages(data.totalPages || 1);
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

  const fetchPadres = async () => {
    try {
      const { data } = await api.get('/auth/padres');
      setPadres(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.alcance === 'individual' && !formData.id_padre) {
      alert('El alumno seleccionado no tiene padre/tutor asignado. No se puede crear el informe.');
      return;
    }
    if (formData.alcance === 'curso' && !formData.curso_destino) {
      alert('Selecciona un curso destino.');
      return;
    }
    try {
      if (editingId) {
        await api.put(`/reports/${editingId}`, formData);
      } else {
        await api.post('/reports', formData);
      }
      setShowModal(false);
      resetForm();
      fetchReports(page);
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
      fetchReports(page);
    } catch (err) {
      alert('Error al guardar descargo');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Cerrar este informe?')) {
      await api.delete(`/reports/${id}`);
      fetchReports(page);
    }
  };

  const handleChangeState = async (id, nuevoEstado) => {
    try {
      await api.patch(`/reports/${id}/state`, { estado: nuevoEstado });
      fetchReports(page);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const handleEdit = (report) => {
    setFormData({
      titulo: report.titulo,
      tipo: report.tipo,
      gravedad: report.gravedad,
      alcance: report.alcance || 'individual',
      curso_destino: report.curso_destino || '',
      texto_profesor: report.texto_profesor || '',
      texto_regente: report.texto_regente || '',
      texto_pat: report.texto_pat || '',
      id_alumno: report.alumno?._id || '',
      id_padre: report.padre?._id || '',
    });
    setEditingId(report._id);
    setEditingReport(report);
    setBusquedaAlumno('');
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
      alcance: 'individual',
      curso_destino: '',
      texto_profesor: '',
      texto_regente: '',
      texto_pat: '',
      id_alumno: '',
      id_padre: '',
    });
    setBusquedaAlumno('');
    setEditingId(null);
    setEditingReport(null);
  };

  const handleAlcanceChange = (e) => {
    setFormData({
      ...formData,
      alcance: e.target.value,
      id_alumno: '',
      id_padre: '',
      curso_destino: '',
    });
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
      alta: 'bg-orange-100 text-orange-800',
      muy_alta: 'bg-red-100 text-red-800',
    };
    const labels = { leve: 'Leve', alta: 'Alta', muy_alta: 'Muy Alta' };
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
      consejo_convivencia: 'Consejo Escolar de Convivencia',
    };
    return (
      <span className="text-xs font-medium px-2 py-1 rounded-full bg-brand-light text-brand-dark">
        {labels[tipo] || tipo}
      </span>
    );
  };

  const destinatarioTexto = (report) => {
    if (report.alcance === 'todos') return 'Toda la comunidad';
    if (report.alcance === 'curso') return `Curso ${report.curso_destino}`;
    return `Alumno: ${nombreCompleto(report.alumno) || 'Sin asignar'} | Padre: ${nombreCompleto(report.padre) || 'Sin asignar'}`;
  };

  const downloadPdf = (report) => {
    const doc = new jsPDF();
    const marginX = 15;
    const pageWidth = doc.internal.pageSize.getWidth() - marginX * 2;
    let y = 20;

    const addLine = (text, size = 11, bold = false) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(text, pageWidth);
      lines.forEach((line) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, marginX, y);
        y += size / 2 + 3;
      });
      y += 2;
    };

    addLine('Informe Escolar', 16, true);
    addLine(report.titulo, 13, true);
    addLine(`Tipo: ${tipoLabel(report.tipo)}  |  Gravedad: ${gravedadLabel(report.gravedad)}  |  Estado: ${estadoLabel(report.estado)}`);
    addLine(`Fecha: ${new Date(report.fecha).toLocaleDateString()}`);
    addLine(`Dirigido a: ${destinatarioTexto(report)}`);
    addLine(`Creado por: ${nombreCompleto(report.creadoPor)} (${report.creadoPor?.rol || ''})`);

    if (report.texto_profesor) {
      addLine('Intervencion del Profesor:', 12, true);
      addLine(report.texto_profesor);
    }
    if (report.texto_regente) {
      addLine('Intervencion del Regente:', 12, true);
      addLine(report.texto_regente);
    }
    if (report.texto_pat) {
      addLine('Intervencion del PAT:', 12, true);
      addLine(report.texto_pat);
    }
    if (report.descargo_alumno) {
      addLine('Descargo del Alumno:', 12, true);
      addLine(report.descargo_alumno);
    }

    doc.save(`informe-${report._id}.pdf`);
  };

  const tipoLabel = (tipo) => ({
    conducta: 'Conducta',
    consejo_aula: 'Consejo de Aula',
    consejo_convivencia: 'Consejo Escolar de Convivencia',
  }[tipo] || tipo);

  const gravedadLabel = (gravedad) => ({ leve: 'Leve', alta: 'Alta', muy_alta: 'Muy Alta' }[gravedad] || gravedad);

  const estadoLabel = (estado) => ({ abierto: 'Abierto', en_revision: 'En Revision', cerrado: 'Cerrado' }[estado] || estado);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center border-b-4 border-brand">
        <h1 className="text-xl font-extrabold text-gray-900">
          Panel <span className="text-brand">Escolar</span>
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 font-medium">
            Hola, {nombreCompleto(user)} ({user.rol})
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
              className="bg-brand text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-dark font-semibold"
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
                      {destinatarioTexto(report)} | Fecha: {new Date(report.fecha).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {report.estado === 'cerrado' && (
                      <button onClick={() => downloadPdf(report)} className="text-gray-400 hover:text-brand" title="Descargar PDF">
                        <Download size={18} />
                      </button>
                    )}
                    {canEditReport(report) && (
                      <button onClick={() => handleEdit(report)} className="text-gray-400 hover:text-brand">
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
                  <span className="text-xs text-gray-400">Creado por: {nombreCompleto(report.creadoPor)} ({report.creadoPor?.rol})</span>
                  {isAlumno && report.alcance === 'individual' && report.alumno?._id === user._id && report.estado !== 'cerrado' && (
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

        {reports.length > 0 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded border text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-brand hover:text-brand"
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <span className="text-sm text-gray-500">Pagina {page} de {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded border text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-brand hover:text-brand"
            >
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>

      {/* Modal Crear/Editar Informe */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-8 w-full max-w-2xl shadow-2xl my-8">
            <h2 className="text-xl font-bold mb-6">{editingId ? 'Editar Informe' : 'Crear Nuevo Informe'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Titulo</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-gray-100 disabled:text-gray-500"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    disabled={!canEditMeta}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Tipo</label>
                  <select
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-gray-100 disabled:text-gray-500"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    disabled={!canEditMeta}
                  >
                    <option value="conducta">Conducta</option>
                    <option value="consejo_aula">Consejo de Aula</option>
                    <option value="consejo_convivencia">Consejo Escolar de Convivencia</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Gravedad</label>
                  <select
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-gray-100 disabled:text-gray-500"
                    value={formData.gravedad}
                    onChange={(e) => setFormData({ ...formData, gravedad: e.target.value })}
                    disabled={!canEditMeta}
                  >
                    <option value="leve">Leve</option>
                    <option value="alta">Alta</option>
                    <option value="muy_alta">Muy Alta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Alcance</label>
                  <select
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-gray-100 disabled:text-gray-500"
                    value={formData.alcance}
                    onChange={handleAlcanceChange}
                    disabled={!!editingId}
                  >
                    <option value="individual">Alumno individual</option>
                    <option value="curso">Un curso especifico</option>
                    <option value="todos">Toda la comunidad</option>
                  </select>
                </div>
              </div>

              {!canEditMeta && (
                <p className="text-xs text-gray-500 -mt-2 mb-4">
                  Titulo, tipo y gravedad solo pueden modificarlos un Gestor o Directivo.
                </p>
              )}

              {formData.alcance === 'individual' && editingId && (
                <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">Alumno Afectado</label>
                    <div className="w-full p-2 border rounded bg-gray-50 text-gray-700">
                      {nombreCompleto(editingReport?.alumno) || 'Sin asignar'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Padre / Tutor a Notificar</label>
                    <div className="w-full p-2 border rounded bg-gray-50 text-gray-700">
                      {nombreCompleto(editingReport?.padre) || 'Sin asignar'}
                    </div>
                  </div>
                </div>
              )}

              {formData.alcance === 'individual' && !editingId && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-1">Buscar Alumno (DNI o nombre)</label>
                    <div className="relative">
                      <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        className="w-full p-2 pl-8 border rounded focus:outline-none focus:ring-2 focus:ring-brand"
                        placeholder="Ej: 40123456"
                        value={busquedaAlumno}
                        onChange={(e) => setBusquedaAlumno(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-1">Alumno Afectado</label>
                    <select
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand"
                      value={formData.id_alumno}
                      onChange={handleAlumnoChange}
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {alumnosFiltrados.map((a) => (
                        <option key={a._id} value={a._id}>{nombreCompleto(a)} {a.dni ? `- DNI ${a.dni}` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-1">Padre / Tutor a Notificar</label>
                    {!formData.id_alumno ? (
                      <div className="w-full p-2 border rounded bg-gray-50 text-gray-400 text-sm">
                        Se completa al elegir el alumno.
                      </div>
                    ) : formData.id_padre ? (
                      <div className="w-full p-2 border rounded bg-gray-50 text-gray-700">
                        {nombreCompleto(padres.find((p) => String(p._id) === String(formData.id_padre))) || 'Cargando...'}
                      </div>
                    ) : (
                      <div className="w-full p-2 border rounded bg-red-50 text-red-600 text-sm">
                        El alumno seleccionado no tiene padre/tutor asignado. Edite el alumno para vincularlo.
                      </div>
                    )}
                  </div>
                </>
              )}

              {formData.alcance === 'curso' && (
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-1">Curso Destino</label>
                  <select
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand"
                    value={formData.curso_destino}
                    onChange={(e) => setFormData({ ...formData, curso_destino: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar curso...</option>
                    {cursosDisponibles.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.alcance === 'todos' && (
                <div className="mb-4 text-sm text-gray-500 bg-gray-50 border rounded p-3">
                  Este informe sera visible para todos los alumnos y padres/tutores del sistema.
                </div>
              )}

              {canEditProfesor && (
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-1">Texto del Profesor</label>
                  <textarea
                    className="w-full p-2 border rounded h-24 focus:outline-none focus:ring-2 focus:ring-brand"
                    value={formData.texto_profesor}
                    onChange={(e) => setFormData({ ...formData, texto_profesor: e.target.value })}
                  />
                </div>
              )}
              {canEditRegente && (
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-1">Texto del Regente</label>
                  <textarea
                    className="w-full p-2 border rounded h-24 focus:outline-none focus:ring-2 focus:ring-brand"
                    value={formData.texto_regente}
                    onChange={(e) => setFormData({ ...formData, texto_regente: e.target.value })}
                  />
                </div>
              )}
              {canEditPat && (
                <div className="mb-6">
                  <label className="block text-sm font-bold mb-1">Texto del PAT</label>
                  <textarea
                    className="w-full p-2 border rounded h-24 focus:outline-none focus:ring-2 focus:ring-brand"
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
                  className="px-4 py-2 bg-brand text-white rounded hover:bg-brand-dark font-semibold"
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
                  className="w-full p-2 border rounded h-40 focus:outline-none focus:ring-2 focus:ring-brand"
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
