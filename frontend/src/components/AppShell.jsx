import { Inbox, LogOut, Plus } from 'lucide-react';
import { ROLES, iniciales, nombreCompleto } from './ui';

const Contador = ({ n, texto, punto }) => (
  <div className="bg-white/5 rounded-sm px-3 py-2.5">
    <p className="text-xl font-semibold text-white">{n}</p>
    <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
      <span className={`w-1.5 h-1.5 ${punto}`} />
      {texto}
    </p>
  </div>
);

// Estructura comun del panel: lateral fijo de alto completo en compu, encabezado y barra inferior en celular
const AppShell = ({ user, counts, canCreate, onNuevo, onInicio, onLogout, children }) => {
  const rol = ROLES[user.rol] || user.rol;
  const detalle = user.cargo || user.curso;

  return (
    <div className="min-h-screen">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-72 flex-col bg-slate-900 text-slate-300 px-6 py-7">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 shrink-0 rounded-sm bg-white text-brand grid place-items-center text-sm font-bold">35</div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">Escuela Técnica N° 35</p>
            <p className="text-xs text-slate-400">Sistema de Informes Escolares</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-8">
          <div className="w-12 h-12 shrink-0 rounded-sm bg-brand text-white grid place-items-center text-lg font-semibold">
            {iniciales(user)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{nombreCompleto(user)}</p>
            <p className="text-sm text-slate-400 truncate">{rol}</p>
            {detalle && <p className="text-xs text-slate-500 truncate" title={detalle}>{detalle}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-6">
          <Contador n={counts.abierto} texto="Abiertos" punto="bg-teal-400" />
          <Contador n={counts.en_revision} texto="Revisión" punto="bg-indigo-400" />
          <Contador n={counts.cerrado} texto="Cerrados" punto="bg-slate-500" />
        </div>

        {canCreate && (
          <button
            onClick={onNuevo}
            className="w-full mt-6 bg-brand hover:bg-brand-dark text-white font-semibold rounded-sm py-2.5 flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Nuevo informe
          </button>
        )}

        <nav className="mt-6 space-y-1 font-medium">
          <button onClick={onInicio} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm bg-white/10 text-white border-l-2 border-brand">
            <Inbox size={18} /> Informes
          </button>
        </nav>

        <button onClick={onLogout} className="mt-auto flex items-center gap-3 px-3 py-2.5 rounded-sm text-slate-400 hover:text-white hover:bg-white/5 font-medium">
          <LogOut size={18} /> Cerrar sesión
        </button>
      </aside>

      <div className="lg:pl-72">
        <main className="max-w-5xl mx-auto px-5 pt-6 pb-28 lg:px-10 lg:py-10">
          <div className="flex items-center gap-3 lg:hidden mb-5">
            <div className="w-11 h-11 shrink-0 rounded-sm bg-brand text-white grid place-items-center font-semibold">{iniciales(user)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-500 truncate">{[rol, detalle].filter(Boolean).join(' · ')}</p>
              <p className="font-semibold text-lg -mt-0.5 truncate">{nombreCompleto(user)}</p>
            </div>
            <button onClick={onLogout} title="Cerrar sesión" className="w-11 h-11 rounded-sm bg-white border border-slate-200 grid place-items-center text-slate-500">
              <LogOut size={18} />
            </button>
          </div>
          {children}
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 h-20 px-6 grid grid-cols-3 items-center">
        <button onClick={onInicio} className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-brand">
          <Inbox size={18} /> Informes
        </button>
        {canCreate ? (
          <button
            onClick={onNuevo}
            title="Nuevo informe"
            className="justify-self-center -mt-10 w-16 h-16 rounded-sm bg-brand text-white grid place-items-center shadow-lg shadow-slate-900/20"
          >
            <Plus size={28} />
          </button>
        ) : (
          <span />
        )}
        <button onClick={onLogout} className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-slate-500">
          <LogOut size={18} /> Salir
        </button>
      </nav>
    </div>
  );
};

export default AppShell;
