import { useEffect, useState } from 'react';
import { CheckCircle, Clock, Edit3, FilePlus, MessageSquare, RefreshCw, Bell } from 'lucide-react';
import api from '../api/axios';
import { ESTADOS, ROLES, nombreCompleto } from './ui';

const CAMPOS = {
  titulo: 'el título', tipo: 'el tipo', gravedad: 'la gravedad', estado: 'el estado', id_alumno: 'el alumno',
  texto_profesor: 'el texto del profesor', texto_regente: 'el texto del regente', texto_pat: 'el texto del PAT',
};

const describir = (e) => {
  switch (e.accion) {
    case 'creado': return { icono: FilePlus, texto: 'Creó el informe' };
    case 'estado': return { icono: RefreshCw, texto: `Cambió el estado de «${ESTADOS[e.estado_anterior] || e.estado_anterior}» a «${ESTADOS[e.estado_nuevo] || e.estado_nuevo}»` };
    case 'editado': return { icono: Edit3, texto: `Editó ${(e.detalle || '').split(', ').map((c) => CAMPOS[c] || c).join(', ')}` };
    case 'descargo': return { icono: MessageSquare, texto: 'Presentó su descargo' };
    case 'recordatorio': return { icono: Bell, texto: 'Se envió el recordatorio de descargo al alumno' };
    case 'plazo_vencido': return { icono: Clock, texto: `Venció el plazo de descargo: el informe pasó a «${ESTADOS[e.estado_nuevo] || e.estado_nuevo}»` };
    case 'cierre_automatico': return { icono: CheckCircle, texto: 'El informe se cerró automáticamente a los 15 días' };
    default: return { icono: Edit3, texto: e.accion };
  }
};

const cuando = (f) => new Date(f).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// Linea de tiempo de un informe: quien hizo que y cuando (las acciones automaticas figuran como «Sistema»)
const HistorialInforme = ({ idInforme }) => {
  const [eventos, setEventos] = useState(null);

  useEffect(() => {
    let vigente = true;
    api.get(`/reports/${idInforme}/historial`).then(({ data }) => vigente && setEventos(data)).catch(() => vigente && setEventos([]));
    return () => { vigente = false; };
  }, [idInforme]);

  if (!eventos || eventos.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="font-semibold text-slate-900 mb-3">Historial</h2>
      <ol className="bg-white border border-slate-200 rounded divide-y divide-slate-100">
        {eventos.map((e) => {
          const { icono: Icono, texto } = describir(e);
          const quien = e.nombre ? `${nombreCompleto(e)}${e.rol ? ` (${ROLES[e.rol] || e.rol})` : ''}` : 'Sistema';
          return (
            <li key={`${e._id}-${e.accion}-${e.fecha}`} className="flex items-start gap-3 px-4 py-3">
              <span className="mt-0.5 w-7 h-7 shrink-0 rounded-sm bg-slate-100 text-slate-500 grid place-items-center"><Icono size={15} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-800"><span className="font-semibold">{quien}</span> · {texto}</p>
                <p className="text-xs font-normal text-slate-400 mt-0.5">{cuando(e.fecha)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default HistorialInforme;
