// Envio de mails por la API HTTPS de Resend (Railway bloquea los puertos SMTP salientes en los planes sin Pro).
// Variables: RESEND_API_KEY (re_...) y MAIL_FROM (ej. "SIE - E.T. N.º 35 <alertas@tu-dominio-verificado>").
// Sin RESEND_API_KEY el sistema sigue funcionando: no envia y lo informa (el gestor ve la clave temporal en pantalla).
const ENDPOINT = 'https://api.resend.com/emails';

const configurado = () => Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);

/** @returns {Promise<{enviado: boolean, motivo?: string}>} nunca lanza: un mail que falla no debe romper la operacion */
async function enviar({ para, asunto, texto, html }) {
  if (!para) return { enviado: false, motivo: 'La persona no tiene un correo cargado' };
  if (!configurado()) {
    console.log(`[mail no configurado] no se envio "${asunto}" a ${para}`);
    return { enviado: false, motivo: 'El envio de correos no esta configurado en el servidor' };
  }
  try {
    const respuesta = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'sie-backend/1.0', // Resend rechaza pedidos sin User-Agent
      },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to: [para], subject: asunto, text: texto, html }),
    });
    if (!respuesta.ok) {
      const detalle = await respuesta.text();
      console.error(`[mail] Resend respondio ${respuesta.status} enviando "${asunto}" a ${para}: ${detalle.slice(0, 200)}`);
      return { enviado: false, motivo: `El proveedor de correo rechazo el envio (${respuesta.status})` };
    }
    return { enviado: true };
  } catch (error) {
    console.error(`[mail] error enviando "${asunto}" a ${para}: ${error.message}`);
    return { enviado: false, motivo: 'No se pudo conectar con el proveedor de correo' };
  }
}

module.exports = { enviar, configurado };
