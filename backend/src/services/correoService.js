// ============================================================
// Envio de correo con Resend (API de terceros con clave)
//
// Este es el unico archivo que conoce la clave de Resend.
// La clave nunca sale del backend, como indica el laboratorio 4.
// ============================================================
const { Resend } = require("resend");

const clave = process.env.RESEND_API_KEY;

// Si no hay clave configurada, el sistema sigue funcionando y el
// codigo se imprime en la consola del backend. Asi el proyecto se
// puede probar sin crear la cuenta de Resend.
const resend = clave ? new Resend(clave) : null;

// Correo unico al que se redirigen todos los avisos durante las pruebas.
//
// Por que existe: la cuenta gratuita de Resend, mientras se usa el
// remitente de prueba onboarding@resend.dev, solo entrega correos a la
// direccion con la que se creo la cuenta. Con esta variable se puede
// entrar como cualquiera de los cuatro roles y recibir siempre el
// codigo en la misma bandeja.
//
// En un sistema real esta variable se deja vacia y cada usuario recibe
// su propio correo.
const correoPruebas = process.env.CORREO_PRUEBAS;

async function enviarCodigoVerificacion(correoDestino, codigo) {
  // Si esta configurado el correo de pruebas, el mensaje se manda ahi
  const destinoReal = correoPruebas || correoDestino;
  const fueRedirigido = Boolean(correoPruebas) && correoPruebas !== correoDestino;

  if (!resend) {
    console.log("=================================================");
    console.log(" RESEND_API_KEY no configurada.");
    console.log(" Codigo de verificacion para " + correoDestino + ": " + codigo);
    console.log("=================================================");
    return { simulado: true };
  }

  // Cuando se redirige, el correo indica a que cuenta pertenece el
  // codigo, para no confundirse entre los cuatro roles.
  const aviso = fueRedirigido
    ? "<p style='color:#666;font-size:13px'>Modo de pruebas: este codigo es para la cuenta <b>" +
      correoDestino +
      "</b>.</p>"
    : "";

  const respuesta = await resend.emails.send({
    from: process.env.RESEND_REMITENTE || "Produccion Academica <onboarding@resend.dev>",
    to: destinoReal,
    subject: fueRedirigido
      ? "Codigo de verificacion (" + correoDestino + ")"
      : "Su codigo de verificacion",
    html:
      "<p>Su codigo de verificacion es: <b style='font-size:20px'>" + codigo + "</b></p>" +
      "<p>El codigo vence en 10 minutos.</p>" +
      aviso,
  });

  // Resend no lanza excepciones: hay que revisar el campo error a mano.
  if (respuesta.error) {
    throw new Error(respuesta.error.message);
  }

  if (fueRedirigido) {
    console.log("Codigo de " + correoDestino + " enviado a " + destinoReal + " (modo de pruebas)");
  }

  return respuesta.data;
}

module.exports = { enviarCodigoVerificacion };
