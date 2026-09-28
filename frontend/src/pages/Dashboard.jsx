import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { jsPDF } from 'jspdf';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import AppShell from '../components/AppShell';
import ReportCard from '../components/ReportCard';
import ReportDetail from '../components/ReportDetail';
import ReportForm from '../components/ReportForm';
import { ESTADOS, GRAVEDADES, TIPOS, destinatario, nombreCompleto } from '../components/ui';

const PAGE_SIZE = 10;
const FILTROS = [['', 'Todos'], ['abierto', 'Abiertos'], ['en_revision', 'En revisión'], ['cerrado', 'Cerrados']];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ abierto: 0, en_revision: 0, cerrado: 0 });
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [cargando, setCargando] = useState(true);
  const [alumnos, setAlumnos] = useState([]);
  const [padres, setPadres] = useState([]);
  // vista: 'lista' | 'detalle' | 'form'
  const [vista, setVista] = useState('lista');
  const [seleccionado, setSeleccionado] = useState(null);
  const [editando, setEditando] = useState(null);

  const canCreate = ['gestor', 'directivo', 'profesor', 'preceptor', 'regente'].includes(user.rol);
  const canDelete = ['gestor', 'directivo'].includes(user.rol);
  const canChangeState = ['gestor', 'directivo', 'regente'].includes(user.rol);
  const isAdmin = ['gestor', 'directivo'].includes(user.rol);
  const esPat = ['asesoria_pedagogica', 'doe', 'pat'].includes(user.rol);

  // Profesores y preceptores solo editan los informes que crearon; regencia, PAT/DOE y gestores editan cualquiera abierto
  const canEditReport = (report) => {
    if (report.estado === 'cerrado') return false;
    if (isAdmin || user.rol === 'regente' || esPat) return true;
    if (['profesor', 'preceptor'].includes(user.rol)) return report.creadoPor?._id === user._id;
    return false;
  };

  const puedeDescargo = (report) =>
    user.rol === 'alumno' && report.alcance === 'individual' && report.alumno?._id === user._id && report.estado !== 'cerrado';

  useEffect(() => {
    const t = setTimeout(() => {
      setBusquedaAplicada(busqueda.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, estadoFiltro, busquedaAplicada]);

  useEffect(() => {
    if (canCreate) {
      api.get('/auth/alumnos').then(({ data }) => setAlumnos(data)).catch(() => {});
      api.get('/auth/padres').then(({ data }) => setPadres(data)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReports = async () => {
    setCargando(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (estadoFiltro) params.estado = estadoFiltro;
      if (busquedaAplicada) params.q = busquedaAplicada;
      const { data } = await api.get('/reports', { params });
      setReports(data.reports);
      setTotalPages(data.totalPages || 1);
      if (data.counts) setCounts(data.counts);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const irALista = () => {
    setVista('lista');
    setSeleccionado(null);
    setEditando(null);
  };

  const abrir = (report) => {
    setSeleccionado(report);
    setVista('detalle');
    window.scrollTo(0, 0);
  };

  const nuevo = () => {
    setEditando(null);
    setVista('form');
    window.scrollTo(0, 0);
  };

  const editar = () => {
    setEditando(seleccionado);
    setVista('form');
    window.scrollTo(0, 0);
  };

  // Tras cada accion se muestra el informe actualizado y se refresca la lista
  const actualizado = (report) => {
    setSeleccionado(report);
    setVista('detalle');
    fetchReports();
  };

  const guardar = async (form) => {
    if (editando) {
      const { data } = await api.put(`/reports/${editando._id}`, form);
      setEditando(null);
      actualizado(data);
    } else {
      const { data } = await api.post('/reports', form);
      actualizado(data);
    }
  };

  const cambiarEstado = async (estado) => {
    const { data } = await api.patch(`/reports/${seleccionado._id}/state`, { estado });
    actualizado(data);
  };

  const cerrar = async () => {
    if (!window.confirm('¿Cerrar este informe? Va a quedar como antecedente y ya no se podrá editar.')) return;
    const { data } = await api.delete(`/reports/${seleccionado._id}`);
    actualizado(data.informe);
  };

  const enviarDescargo = async (texto) => {
    const { data } = await api.post(`/reports/${seleccionado._id}/descargo`, { descargo_alumno: texto });
    actualizado(data);
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
    addLine(`Tipo: ${TIPOS[report.tipo] || report.tipo}  |  Gravedad: ${GRAVEDADES[report.gravedad] || report.gravedad}  |  Estado: ${ESTADOS[report.estado] || report.estado}`);
    addLine(`Fecha: ${new Date(report.fecha).toLocaleDateString()}`);
    addLine(`Dirigido a: ${destinatario(report)}${report.alcance === 'individual' ? ` | Padre: ${nombreCompleto(report.padre) || 'Sin asignar'}` : ''}`);
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

  let contenido;
  if (vista === 'form') {
    contenido = (
      <ReportForm
        report={editando}
        permisos={{
          editarDatos: isAdmin,
          textoProfesor: ['gestor', 'directivo', 'profesor', 'preceptor'].includes(user.rol),
          textoRegente: ['gestor', 'directivo', 'regente'].includes(user.rol),
          textoPat: isAdmin || esPat,
        }}
        alumnos={alumnos}
        padres={padres}
        onCancel={editando ? () => abrir(editando) : irALista}
        onSubmit={guardar}
      />
    );
  } else if (vista === 'detalle' && seleccionado) {
    contenido = (
      <ReportDetail
        key={`${seleccionado._id}-${seleccionado.updatedAt}`}
        report={seleccionado}
        permisos={{
          editar: canEditReport(seleccionado),
          cambiarEstado: canChangeState,
          cerrar: canDelete,
          descargo: puedeDescargo(seleccionado),
        }}
        onBack={irALista}
        onEdit={editar}
        onChangeState={cambiarEstado}
        onClose={cerrar}
        onDownload={() => downloadPdf(seleccionado)}
        onDescargo={enviarDescargo}
      />
    );
  } else {
    contenido = (
      <>
        <h1 className="hidden lg:block text-3xl font-black text-slate-900">Informes</h1>
        <div className="relative mt-5 lg:mt-5">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full bg-white border border-slate-200 rounded-sm pl-11 pr-4 py-3 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="Buscar por título, alumno, DNI o curso"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {FILTROS.map(([valor, texto]) => (
            <button
              key={texto}
              onClick={() => {
                setEstadoFiltro(valor);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-sm font-extrabold text-sm whitespace-nowrap ${estadoFiltro === valor ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}
            >
              {texto}
              {valor && <span className={estadoFiltro === valor ? 'text-slate-400' : 'text-slate-300'}> {counts[valor]}</span>}
            </button>
          ))}
        </div>

        {!cargando && reports.length === 0 ? (
          <p className="text-center font-semibold text-slate-400 py-16">
            {busquedaAplicada || estadoFiltro ? 'No hay informes que coincidan con la búsqueda.' : 'No hay informes para mostrar.'}
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 mt-5">
            {reports.map((report) => (
              <ReportCard key={report._id} report={report} onOpen={abrir} />
            ))}
          </div>
        )}

        {reports.length > 0 && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-2 rounded-sm border border-slate-300 bg-white font-bold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <span className="text-sm font-bold text-slate-500">Página {page} de {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-2 rounded-sm border border-slate-300 bg-white font-bold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <AppShell user={user} counts={counts} canCreate={canCreate} onNuevo={nuevo} onInicio={irALista} onLogout={logout}>
      {contenido}
    </AppShell>
  );
};

export default Dashboard;
