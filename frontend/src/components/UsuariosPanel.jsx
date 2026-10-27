import { useEffect, useState } from 'react';
import { KeyRound, MailCheck, MailWarning, UserPlus } from 'lucide-react';
import api from '../api/axios';
import { ROLES, nombreCompleto } from './ui';

const ENTRADA = 'w-full bg-white border border-slate-300 rounded-sm px-3 py-2.5 font-normal focus:outline-none focus:ring-2 focus:ring-brand';
const ETIQUETA = 'block text-sm font-semibold text-slate-700 mb-1';
const ROLES_CREABLES = ['alumno', 'profesor', 'preceptor', 'regente', 'asesoria_pedagogica', 'secretaria', 'directivo', 'gestor'];
const ROLES_CON_CARGO = ['gestor', 'directivo', 'regente'];
const VACIO = {
  nombre: '', apellido: '', email: '', rol: 'alumno', dni: '', telefono: '', cargo: '', curso: '',
  responsable_nombre: '', responsable_email: '', responsable_telefono: '',
};

// Alta de cuentas (gestor/directivo): la clave temporal se genera sola y le llega al correo de la persona
const UsuariosPanel = ({ user }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [abierto, setAbierto] = useState(false);
  const [aviso, setAviso] = useState(null); // { tipo: 'ok' | 'atencion' | 'error', texto, clave }
  const [ocupado, setOcupado] = useState(false);
  const [filtro, setFiltro] = useState('');

  const cargar = () => api.get('/auth/users').then(({ data }) => setUsuarios(data)).catch(() => {});
  useEffect(() => { cargar(); }, []);

  const roles = ROLES_CREABLES.filter((r) => r !== 'gestor' || user.rol === 'gestor');
  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const resultado = (data, verbo) => {
    if (data.mail?.enviado) {
      setAviso({ tipo: 'ok', texto: `${verbo}. Se envió la contraseña temporal por correo.` });
    } else {
      setAviso({
        tipo: 'atencion',
        texto: `${verbo}, pero el correo no pudo salir (${data.mail?.motivo || 'sin detalle'}). Entregale esta contraseña temporal a la persona:`,
        clave: data.claveTemporal,
      });
    }
  };

  const crear = async (e) => {
    e.preventDefault();
    setAviso(null);
    setOcupado(true);
    try {
      const { data } = await api.post('/auth/users', form);
      resultado(data, `Cuenta creada para ${nombreCompleto(data)}`);
      setForm(VACIO);
      setAbierto(false);
      cargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.response?.data?.message || 'No se pudo crear la cuenta' });
    } finally {
      setOcupado(false);
    }
  };

  const restablecer = async (u) => {
    if (!window.confirm(`¿Restablecer la contraseña de ${nombreCompleto(u)}? Va a recibir una nueva contraseña temporal por correo.`)) return;
    setAviso(null);
    try {
      const { data } = await api.post(`/auth/users/${u._id}/reset-password`);
      resultado(data, `Contraseña restablecida para ${nombreCompleto(u)}`);
      cargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.response?.data?.message || 'No se pudo restablecer la contraseña' });
    }
  };

  const visibles = usuarios.filter((u) => {
    const t = filtro.trim().toLowerCase();
    return !t || `${nombreCompleto(u)} ${u.email} ${u.dni || ''} ${u.curso || ''}`.toLowerCase().includes(t);
  });

  const estilos = {
    ok: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    atencion: 'bg-amber-50 border-amber-200 text-amber-900',
    error: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-slate-900">Usuarios</h1>
        <button onClick={() => setAbierto(!abierto)} className="bg-brand hover:bg-brand-dark text-white font-semibold rounded-sm px-4 py-2.5 flex items-center gap-2">
          <UserPlus size={18} /> Nueva cuenta
        </button>
      </div>
      <p className="text-sm font-normal text-slate-500 mt-1">
        No hay registro público: las cuentas se crean acá y la contraseña temporal le llega por correo a cada persona, que debe cambiarla al ingresar.
      </p>

      {aviso && (
        <div className={`mt-4 border rounded-sm px-4 py-3 text-sm font-medium flex gap-3 ${estilos[aviso.tipo]}`}>
          {aviso.tipo === 'ok' ? <MailCheck size={18} className="shrink-0 mt-0.5" /> : <MailWarning size={18} className="shrink-0 mt-0.5" />}
          <div>
            <p>{aviso.texto}</p>
            {aviso.clave && <p className="mt-2 font-mono text-base bg-white border border-amber-300 rounded-sm inline-block px-3 py-1 select-all">{aviso.clave}</p>}
          </div>
        </div>
      )}

      {abierto && (
        <form onSubmit={crear} className="bg-white border border-slate-200 rounded p-6 mt-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className={ETIQUETA}>Nombre</label><input className={ENTRADA} value={form.nombre} onChange={set('nombre')} required /></div>
            <div><label className={ETIQUETA}>Apellido</label><input className={ENTRADA} value={form.apellido} onChange={set('apellido')} required /></div>
            <div><label className={ETIQUETA}>Correo (acá llega la contraseña)</label><input type="email" className={ENTRADA} value={form.email} onChange={set('email')} required /></div>
            <div>
              <label className={ETIQUETA}>Rol</label>
              <select className={ENTRADA} value={form.rol} onChange={set('rol')}>
                {roles.map((r) => <option key={r} value={r}>{ROLES[r] || r}</option>)}
              </select>
            </div>
            <div><label className={ETIQUETA}>DNI</label><input className={ENTRADA} value={form.dni} onChange={set('dni')} placeholder="7 u 8 dígitos" /></div>
            <div><label className={ETIQUETA}>Teléfono</label><input className={ENTRADA} value={form.telefono} onChange={set('telefono')} /></div>
            {ROLES_CON_CARGO.includes(form.rol) && (
              <div><label className={ETIQUETA}>Cargo</label><input className={ENTRADA} value={form.cargo} onChange={set('cargo')} /></div>
            )}
            {form.rol === 'alumno' && (
              <div><label className={ETIQUETA}>Curso</label><input className={ENTRADA} value={form.curso} onChange={set('curso')} placeholder="Ej: 5° 1°" /></div>
            )}
          </div>

          {form.rol === 'alumno' && (
            <div className="border-t border-slate-200 pt-4">
              <p className="font-semibold text-slate-800">Responsable del alumno (padre, madre o tutor)</p>
              <p className="text-xs font-normal text-slate-500 mb-3">No tiene cuenta: recibe por correo los avisos de los informes de este alumno.</p>
              <div className="grid sm:grid-cols-3 gap-4">
                <div><label className={ETIQUETA}>Nombre y apellido</label><input className={ENTRADA} value={form.responsable_nombre} onChange={set('responsable_nombre')} required /></div>
                <div><label className={ETIQUETA}>Correo</label><input type="email" className={ENTRADA} value={form.responsable_email} onChange={set('responsable_email')} required /></div>
                <div><label className={ETIQUETA}>Teléfono</label><input className={ENTRADA} value={form.responsable_telefono} onChange={set('responsable_telefono')} /></div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setAbierto(false)} className="px-5 py-2.5 rounded-sm font-semibold text-slate-600 border border-slate-300">Cancelar</button>
            <button disabled={ocupado} className="px-5 py-2.5 rounded-sm font-semibold bg-brand hover:bg-brand-dark text-white disabled:opacity-50">
              {ocupado ? 'Creando…' : 'Crear y enviar contraseña'}
            </button>
          </div>
        </form>
      )}

      <input
        className={`${ENTRADA} mt-5`}
        placeholder="Buscar por nombre, correo, DNI o curso"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      />
      <div className="mt-4 bg-white border border-slate-200 rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Contraseña</th><th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-normal">
            {visibles.map((u) => (
              <tr key={u._id}>
                <td className="px-4 py-3 font-medium text-slate-900">{nombreCompleto(u)}{u.curso && <span className="block text-xs font-normal text-slate-400">{u.curso}</span>}</td>
                <td className="px-4 py-3 text-slate-600">{ROLES[u.rol] || u.rol}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3">{u.debe_cambiar_clave ? <span className="text-amber-700 font-medium">Temporal, sin estrenar</span> : <span className="text-slate-500">Propia</span>}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => restablecer(u)} className="inline-flex items-center gap-1 text-slate-500 hover:text-brand font-medium" title="Enviar una nueva contraseña temporal">
                    <KeyRound size={15} /> Restablecer
                  </button>
                </td>
              </tr>
            ))}
            {visibles.length === 0 && <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-400">No hay usuarios para mostrar.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsuariosPanel;
