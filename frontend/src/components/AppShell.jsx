import { Inbox, LogOut, Plus } from 'lucide-react';
import { ROLES, iniciales, nombreCompleto } from './ui';

const Contador = ({ n, texto, color }) => (
  <div className="bg-white/5 rounded-md py-3">
    <p className={`text-2xl font-black ${color}`}>{n}</p>
    <p className="text-[11px] font-bold text-slate-400">{texto}</p>
  </div>
);

// Estructura comun del panel: lateral oscuro en compu, encabezado y barra inferior en celular
const AppShell = ({ user, counts, canCreate, onNuevo, onInicio, onLogout, children }) => {
  const detalleRol = [ROLES[user.rol] || user.rol, user.cargo || user.curso].filter(Boolean).join(' · ');

  return (
    <div className="min-h-screen lg:flex lg:max-w-6xl lg:mx-auto lg:gap-8 lg:p-8">
      <aside className="hidden lg:block w-72 shrink-0">
        <div className="bg-slate-900 text-slate-300 rounded-lg p-6 sticky top-8">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 shrink-0 rounded-md bg-brand text-white grid place-items-center text-xl font-black">
              {iniciales(user)}
            </div>
            <div className="min-w-0">
              <p className="font-black text-lg text-white truncate">{nombreCompleto(user)}</p>
              <p className="font-bold text-slate-400 text-sm truncate">{detalleRol}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-6 text-center">
            <Contador n={counts.abierto} texto="Abiertos" color="text-emerald-400" />
            <Contador n={counts.en_revision} texto="Revisión" color="text-sky-400" />
            <Contador n={counts.cerrado} texto="Cerrados" color="text-slate-300" />
          </div>
          {canCreate && (
            <button
              onClick={onNuevo}
              className="w-full mt-6 bg-brand hover:bg-brand-dark text-white font-extrabold rounded-md py-3 flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Nuevo informe
            </button>
          )}
          <nav className="mt-6 space-y-1 font-extrabold">
            <button onClick={onInicio} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md bg-white/10 text-white">
              <Inbox size={18} /> Informes
            </button>
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-400 hover:text-white">
              <LogOut size={18} /> Cerrar sesión
            </button>
          </nav>
          <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-2 text-sm font-bold text-slate-400">
            <div className="w-7 h-7 rounded bg-white text-brand grid place-items-center text-xs font-black">35</div>
            E.T. N° 35 · SIE
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-5 pt-6 pb-28 lg:p-0">
        <div className="flex items-center gap-3 lg:hidden mb-5">
          <div className="w-11 h-11 shrink-0 rounded-md bg-brand text-white grid place-items-center font-black">{iniciales(user)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-400 truncate">{detalleRol}</p>
            <p className="font-black text-lg -mt-0.5 truncate">{nombreCompleto(user)}</p>
          </div>
          <button onClick={onLogout} title="Cerrar sesión" className="w-11 h-11 rounded-md bg-white border border-slate-200 grid place-items-center text-slate-500">
            <LogOut size={18} />
          </button>
        </div>
        {children}
      </main>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 h-20 px-6 grid grid-cols-3 items-center">
        <button onClick={onInicio} className="flex flex-col items-center gap-0.5 text-[11px] font-extrabold text-brand">
          <Inbox size={18} /> Informes
        </button>
        {canCreate ? (
          <button
            onClick={onNuevo}
            title="Nuevo informe"
            className="justify-self-center -mt-10 w-16 h-16 rounded-lg bg-brand text-white grid place-items-center shadow-lg shadow-brand/30"
          >
            <Plus size={28} />
          </button>
        ) : (
          <span />
        )}
        <button onClick={onLogout} className="flex flex-col items-center gap-0.5 text-[11px] font-extrabold text-slate-400">
          <LogOut size={18} /> Salir
        </button>
      </nav>
    </div>
  );
};

export default AppShell;
