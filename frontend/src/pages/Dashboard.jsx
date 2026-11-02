import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { generarInformePdf } from '../utils/informePdf';
import { FileText, Megaphone, Search } from 'lucide-react';
import AppShell from '../components/AppShell';
import PanelLista from '../components/PanelLista';
import ReportDetail from '../components/ReportDetail';
import ReportForm from '../components/ReportForm';
import UsuariosPanel from '../components/UsuariosPanel';
import MiCuenta from '../components/MiCuenta';
import MiPerfil from '../components/MiPerfil';
import EstadisticasPanel from '../components/EstadisticasPanel';
import { ROLES_GRAVEDAD, esAviso } from '../components/ui';

const SIN_CONTEO = { abierto: 0, en_revision: 0, cerrado: 0 };

const Dashboard = () => {
  const { user, logout, refrescar } = useAuth();
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [cursoFiltro, setCursoFiltro] = useState('');
  // Contadores de cada tarjeta; el lateral muestra la suma
  const [conteos, setConteos] = useState({ informes: SIN_CONTEO, avisos: SIN_CONTEO });
  // Al cambiar algo se incrementa y las dos tarjetas vuelven a pedir sus listas
  const [version, setVersion] = useState(0);
  const [alumnos, setAlumnos] = useState([]);
  const [cursos, setCursos] = useState([]);
  // vista: 'lista' | 'detalle' | 'form' | 'usuarios' | 'perfil' | 'cuenta' | 'estadisticas'
  const [vista, setVista] = useState('lista');
  const [seleccionado, setSeleccionado] = useState(null);
  const [editando, setEditando] = useState(null);
  // Qué se crea desde el formulario: 'informe' (a un alumno) o 'aviso' (a un curso o a toda la comunidad)
  const [modoNuevo, setModoNuevo] = useState('informe');

  const canCreate = ['gestor', 'directivo', 'profesor', 'preceptor', 'regente'].includes(user.rol);
  const canDelete = ['gestor', 'directivo'].includes(user.rol);
  const canChangeState = ['gestor', 'directivo', 'regente'].includes(user.rol);
  const isAdmin = ['gestor', 'directivo'].includes(user.rol);
  // Asesoría / DOE / PAT, o un profesor o preceptor al que el gestor le asignó la función de PAT
  const esPat = ['asesoria_pedagogica', 'doe', 'pat'].includes(user.rol) || (['profesor', 'preceptor'].includes(user.rol) && user.es_pat);
  const asignaGravedad = ROLES_GRAVEDAD.includes(user.rol);

  // Profesores y preceptores solo editan los informes que crearon; regencia, PAT y gestores editan cualquiera abierto
  const canEditReport = (report) => {
    if (report.estado === 'cerrado') return false;
    if (isAdmin || user.rol === 'regente' || esPat) return true;
    if (['profesor', 'preceptor'].includes(user.rol)) return report.creadoPor?._id === user._id;
    return false;
  };

  // El alumno puede escribir su descargo hasta que venza el plazo que fija el sistema
  const puedeDescargo = (report) =>
    user.rol === 'alumno' && report.alcance === 'individual' && report.alumno?._id === user._id && report.estado !== 'cerrado'
    && !report.descargo_vencido && !(report.fecha_limite_descargo && new Date() > new Date(report.fecha_limite_descargo));

  useEffect(() => {
    const t = setTimeout(() => setBusquedaAplicada(busqueda.trim()), 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  useEffect(() => {
    // Datos vigentes del usuario (por ejemplo, si le asignaron la función de PAT después de iniciar sesión)
    refrescar().catch(() => {});
    if (canCreate) {
      api.get('/auth/alumnos').then(({ data }) => setAlumnos(data)).catch(() => {});
    }
    // El catalogo lo usan los formularios y el filtro por curso (todo el personal)
    if (user.rol !== 'alumno') api.get('/cursos').then(({ data }) => setCursos(data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recibirConteo = (grupo, counts) => setConteos((c) => ({ ...c, [grupo]: counts }));
  const counts = Object.fromEntries(Object.keys(SIN_CONTEO).map((k) => [k, conteos.informes[k] + conteos.avisos[k]]));

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

  const nuevo = (modo) => {
    setModoNuevo(modo);
    setEditando(null);
    setVista('form');
    window.scrollTo(0, 0);
  };

  const editar = () => {
    setEditando(seleccionado);
    setVista('form');
    window.scrollTo(0, 0);
  };

  // Tras cada accion se muestra el informe actualizado y se refrescan las listas
  const actualizado = (report) => {
    setSeleccionado(report);
    setVista('detalle');
    setVersion((v) => v + 1);
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
    const que = esAviso(seleccionado) ? 'aviso' : 'informe';
    if (!window.confirm(`¿Cerrar este ${que}? Va a quedar como antecedente y ya no se podrá editar.`)) return;
    const { data } = await api.delete(`/reports/${seleccionado._id}`);
    actualizado(data.informe);
  };

  const enviarDescargo = async (texto) => {
    const { data } = await api.post(`/reports/${seleccionado._id}/descargo`, { descargo_alumno: texto });
    actualizado(data);
  };

  const downloadPdf = (report) => {
    generarInformePdf(report).save(`${esAviso(report) ? 'aviso' : 'informe'}-${String(report._id).padStart(5, '0')}.pdf`);
  };

  let contenido;
  if (vista === 'usuarios') {
    contenido = <UsuariosPanel user={user} />;
  } else if (vista === 'perfil') {
    contenido = <MiPerfil />;
  } else if (vista === 'cuenta') {
    contenido = <MiCuenta />;
  } else if (vista === 'estadisticas') {
    contenido = <EstadisticasPanel cursos={cursos} />;
  } else if (vista === 'form') {
    contenido = (
      <ReportForm
        report={editando}
        modo={editando ? (esAviso(editando) ? 'aviso' : 'informe') : modoNuevo}
        permisos={{
          editarDatos: isAdmin,
          gravedad: asignaGravedad,
          // El docente redacta su texto en los informes que crea; en uno ajeno (con la función PAT) solo ve el campo del PAT
          textoProfesor: isAdmin || (['profesor', 'preceptor'].includes(user.rol) && (!editando || editando.creadoPor?._id === user._id)),
          textoRegente: ['gestor', 'directivo', 'regente'].includes(user.rol),
          textoPat: isAdmin || esPat,
        }}
        alumnos={alumnos}
        cursos={cursos}
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
        <h1 className="hidden lg:block text-3xl font-semibold text-slate-900">Inicio</h1>
        {user.rol !== 'alumno' && (
          <button onClick={() => setVista('estadisticas')} className="lg:hidden w-full bg-white border border-slate-200 rounded-sm py-2.5 font-semibold text-sm text-slate-600">
            Ver estadísticas
          </button>
        )}
        <div className="flex flex-col sm:flex-row gap-3 mt-5">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full bg-white border border-slate-200 rounded-sm pl-11 pr-4 py-3 font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="Buscar por título, alumno, DNI o curso"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          {user.rol !== 'alumno' && cursos.length > 0 && (
            <select
              className="w-full sm:w-56 bg-white border border-slate-200 rounded-sm px-3 py-3 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand"
              value={cursoFiltro}
              onChange={(e) => setCursoFiltro(e.target.value)}
              aria-label="Filtrar por curso"
            >
              <option value="">Todos los cursos</option>
              {cursos.map((c) => <option key={c._id} value={c.etiqueta}>{c.etiqueta}</option>)}
            </select>
          )}
        </div>

        <div className="grid xl:grid-cols-2 gap-5 mt-5 items-start">
          <PanelLista
            grupo="informes"
            titulo="Informes"
            descripcion={user.rol === 'alumno' ? 'Los informes a tu nombre' : 'Informes individuales sobre un alumno'}
            icono={FileText}
            vacio="No hay informes para mostrar."
            busqueda={busquedaAplicada}
            curso={cursoFiltro}
            version={version}
            onOpen={abrir}
            onNuevo={canCreate ? () => nuevo('informe') : undefined}
            textoNuevo="Nuevo informe"
            onCounts={recibirConteo}
          />
          <PanelLista
            grupo="avisos"
            titulo="Avisos"
            descripcion={user.rol === 'alumno' ? 'Avisos a tu curso y a toda la comunidad' : 'Avisos a un curso y a toda la comunidad'}
            icono={Megaphone}
            vacio="No hay avisos para mostrar."
            busqueda={busquedaAplicada}
            curso={cursoFiltro}
            version={version}
            onOpen={abrir}
            onNuevo={canCreate ? () => nuevo('aviso') : undefined}
            textoNuevo="Nuevo aviso"
            onCounts={recibirConteo}
          />
        </div>
      </>
    );
  }

  return (
    <AppShell
      user={user}
      counts={counts}
      canCreate={canCreate}
      vista={vista}
      ancho={vista === 'lista'}
      onNuevo={() => nuevo('informe')}
      onNuevoAviso={() => nuevo('aviso')}
      onInicio={irALista}
      onUsuarios={isAdmin ? () => setVista('usuarios') : undefined}
      onPerfil={() => setVista('perfil')}
      onCuenta={() => setVista('cuenta')}
      onEstadisticas={user.rol !== 'alumno' ? () => setVista('estadisticas') : undefined}
      onLogout={logout}
    >
      {contenido}
    </AppShell>
  );
};

export default Dashboard;
