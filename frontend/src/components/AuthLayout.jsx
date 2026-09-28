// Pantallas de acceso: tarjeta centrada sobre formas rectas con los colores institucionales
const AuthLayout = ({ titulo, subtitulo, ancho = 'max-w-sm', children }) => (
  <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-slate-100">
    <div className="absolute -top-40 -right-32 w-[520px] h-[520px] bg-brand rotate-12" />
    <div className="absolute top-24 right-40 w-44 h-44 bg-brand-dark rotate-12 hidden sm:block" />
    <div className="absolute -bottom-32 -left-24 w-96 h-96 bg-slate-900 -rotate-12" />
    <div className={`relative w-full ${ancho} bg-white rounded shadow-xl shadow-slate-900/10 p-8 my-8`}>
      <div className="w-12 h-12 rounded-sm bg-brand text-white grid place-items-center font-semibold mb-5">35</div>
      <h1 className="text-2xl font-semibold text-slate-900">{titulo}</h1>
      <p className="text-slate-500 font-normal mt-1 mb-6">{subtitulo}</p>
      {children}
    </div>
  </div>
);

export const ENTRADA_AUTH =
  'w-full bg-slate-50 border border-slate-200 rounded-sm px-3 py-3 font-normal focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white';
export const ETIQUETA_AUTH = 'block text-sm font-medium text-slate-700 mb-1';
export const BOTON_AUTH = 'w-full bg-brand hover:bg-brand-dark text-white font-semibold rounded-sm py-3 text-lg transition';
export const ERROR_AUTH = 'text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-sm px-3 py-2 mb-4';

export default AuthLayout;
