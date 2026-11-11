// Buzón Jurídico: POST /api/consultas
import { DESPACHO, LIMITES, MATERIAS, TIPOS_CONSULTA } from "../config.js";
import { ErrorHttp, ipDe, json, leerJson } from "../lib/http.js";
import { ahoraLocal } from "../lib/fechas.js";
import { dentroDelLimite, nuevoFolio, turnstileValido } from "../lib/seguridad.js";
import { avisar } from "../lib/telegram.js";
import { correo, telefono, texto, unoDe } from "../lib/validar.js";

export async function crearConsulta(request, env, ctx, dep = {}) {
  const datos = await leerJson(request);
  const ip = ipDe(request);

  // Campo trampa del formulario: una persona no lo ve; un bot lo llena.
  // Se responde como si todo hubiera salido bien, sin guardar nada.
  if (typeof datos.company === "string" && datos.company.trim() !== "") {
    return json({ folio: nuevoFolio("FOLIO", ahoraLocal().fecha), mensaje: MENSAJE_OK }, 201);
  }

  if (!(await dentroDelLimite(env, "consulta", ip, LIMITES.consultasPorHora))) {
    throw new ErrorHttp(429, `Recibimos varios mensajes desde tu conexión. Intenta más tarde o escríbenos por WhatsApp al ${DESPACHO.whatsapp}.`);
  }
  if (!(await turnstileValido(env, datos.turnstile_token, ip, dep.fetch))) {
    throw new ErrorHttp(403, "No pudimos verificar que eres una persona. Recarga la página e intenta de nuevo.");
  }
  if (datos.privacidad !== true) {
    throw new ErrorHttp(422, "Necesitamos que aceptes el Aviso de Privacidad.", { campo: "privacidad" });
  }

  const consulta = {
    tipo: unoDe(datos, "tipo", TIPOS_CONSULTA, "el tipo de mensaje"),
    materia: unoDe(datos, "materia", MATERIAS, "la materia"),
    nombre: texto(datos, "nombre", { min: 3, max: 255, etiqueta: "el nombre" }),
    email: correo(datos),
    telefono: telefono(datos),
    mensaje: texto(datos, "mensaje", { min: LIMITES.mensajeMin, max: LIMITES.mensajeMax, etiqueta: "el mensaje" }),
  };

  // El folio es único en la base; si chocara (muy raro), se genera otro.
  let folio;
  for (let intento = 0; ; intento++) {
    folio = nuevoFolio("FOLIO", ahoraLocal().fecha);
    try {
      await env.DB.prepare(
        `INSERT INTO consultas (folio, tipo, materia, nombre, email, telefono, mensaje)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
      ).bind(folio, consulta.tipo, consulta.materia, consulta.nombre, consulta.email, consulta.telefono, consulta.mensaje).run();
      break;
    } catch (e) {
      if (intento >= 3 || !/UNIQUE/i.test(String(e?.message))) throw e;
    }
  }

  // El aviso no lleva el mensaje ni datos de contacto: esos se leen en el panel.
  ctx.waitUntil(avisar(env,
    `Nueva consulta ${folio}\n${TIPOS_CONSULTA[consulta.tipo]} · ${MATERIAS[consulta.materia]}\nDe: ${consulta.nombre}\nRevísala en el panel.`,
    dep.fetch));

  return json({ folio, mensaje: MENSAJE_OK }, 201);
}

const MENSAJE_OK = "Tu consulta ha sido registrada. Conserva tu folio para darle seguimiento.";
