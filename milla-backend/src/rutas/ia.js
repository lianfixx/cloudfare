// Asistente de preguntas frecuentes con Workers AI: POST /api/ia/chat
import { DESPACHO, LIMITES, PROMPT_IA } from "../config.js";
import { ErrorHttp, ipDe, json, leerJson } from "../lib/http.js";
import { dentroDelLimite } from "../lib/seguridad.js";
import { limpiar } from "../lib/validar.js";

const DERIVACION = `Por ahora no puedo responder. Escríbenos por WhatsApp al ${DESPACHO.whatsapp} y te atendemos.`;

export async function chat(request, env) {
  const datos = await leerJson(request, 16_000);
  if (!(await dentroDelLimite(env, "ia", ipDe(request), LIMITES.mensajesIaPorHora))) {
    throw new ErrorHttp(429, `Llegaste al límite de mensajes por hora. Escríbenos por WhatsApp al ${DESPACHO.whatsapp}.`);
  }

  // Solo se aceptan turnos de usuario y asistente; el navegador no puede mandar instrucciones de sistema.
  const historial = Array.isArray(datos.mensajes) ? datos.mensajes : [];
  const mensajes = historial.slice(-8)
    .map((m) => ({ role: m?.rol === "asistente" ? "assistant" : "user", content: limpiar(m?.texto, 1200) }))
    .filter((m) => m.content);
  if (!mensajes.length || mensajes.at(-1).role !== "user") {
    throw new ErrorHttp(422, "Falta el mensaje.");
  }

  // Sin IA disponible (o con las neuronas del día agotadas) se deriva a WhatsApp; nunca se inventa.
  if (!env.AI) return json({ respuesta: DERIVACION, derivado: true });
  try {
    const salida = await env.AI.run(env.MODELO_IA, {
      messages: [{ role: "system", content: PROMPT_IA }, ...mensajes],
      max_tokens: 350,
      temperature: 0.2,
    });
    const respuesta = limpiar(salida?.response ?? salida?.choices?.[0]?.message?.content ?? "", 2000);
    if (!respuesta) return json({ respuesta: DERIVACION, derivado: true });
    return json({ respuesta, derivado: false, aviso: "Orientación general del despacho; no es asesoría legal." });
  } catch {
    return json({ respuesta: DERIVACION, derivado: true });
  }
}
