// Asesoría virtual: disponibilidad y propuestas de cita sin choques.
import { ABOGADOS, DESPACHO, LIMITES, MATERIAS, TIPOS_CITA } from "../config.js";
import { ErrorHttp, ipDe, json, leerJson } from "../lib/http.js";
import { ahoraLocal, horasDelDia, motivoFechaNoDisponible } from "../lib/fechas.js";
import { dentroDelLimite, nuevoFolio, turnstileValido } from "../lib/seguridad.js";
import { avisar } from "../lib/telegram.js";
import { correo, limpiar, opcional, telefono, texto, unoDe } from "../lib/validar.js";

// «ambos» ocupa a los dos abogados a esa hora.
function ocupados(abogado) {
  return abogado === "ambos" ? ["titular", "socio"] : [abogado];
}

// GET /api/agenda/disponibilidad?fecha=AAAA-MM-DD&abogado=titular|socio|ambos
export async function disponibilidad(request, env) {
  const url = new URL(request.url);
  const fecha = limpiar(url.searchParams.get("fecha") ?? "", 10);
  const abogado = limpiar(url.searchParams.get("abogado") ?? "titular", 10);
  if (!Object.hasOwn(ABOGADOS, abogado)) throw new ErrorHttp(422, "Valor no permitido en abogado.");

  const motivo = motivoFechaNoDisponible(fecha);
  if (motivo) return json({ fecha, abogado, horas: [], motivo });

  const quienes = ocupados(abogado);
  const marcas = quienes.map((_, i) => `?${i + 2}`).join(", ");
  const { results } = await env.DB.prepare(
    `SELECT DISTINCT hora FROM cita_bloques WHERE fecha = ?1 AND abogado IN (${marcas})`,
  ).bind(fecha, ...quienes).all();
  const tomadas = new Set(results.map((r) => r.hora));

  const ahora = ahoraLocal();
  const horas = horasDelDia().filter((h) => !tomadas.has(h) && (fecha > ahora.fecha || h > ahora.hora));
  return json({ fecha, abogado, horas });
}

// POST /api/agenda/citas
export async function crearCita(request, env, ctx, dep = {}) {
  const datos = await leerJson(request);
  const ip = ipDe(request);

  if (typeof datos.company === "string" && datos.company.trim() !== "") {
    return json({ folio: nuevoFolio("CITA", ahoraLocal().fecha), estado: "pendiente", mensaje: MENSAJE_OK }, 201);
  }
  if (!(await dentroDelLimite(env, "cita", ip, LIMITES.citasPorHora))) {
    throw new ErrorHttp(429, `Recibimos varias solicitudes desde tu conexión. Intenta más tarde o escríbenos por WhatsApp al ${DESPACHO.whatsapp}.`);
  }
  if (!(await turnstileValido(env, datos.turnstile_token, ip, dep.fetch))) {
    throw new ErrorHttp(403, "No pudimos verificar que eres una persona. Recarga la página e intenta de nuevo.");
  }
  if (datos.privacidad !== true) {
    throw new ErrorHttp(422, "Necesitamos que aceptes el Aviso de Privacidad.", { campo: "privacidad" });
  }

  const cita = {
    fecha: limpiar(datos.fecha, 10),
    hora: limpiar(datos.hora, 5),
    tipo: unoDe(datos, "tipo", TIPOS_CITA, "el tipo de cita"),
    abogado: unoDe(datos, "abogado", ABOGADOS, "el abogado"),
    nombre: texto(datos, "nombre", { min: 3, max: 255, etiqueta: "el nombre" }),
    email: correo(datos),
    telefono: telefono(datos),
    materia: datos.materia ? unoDe(datos, "materia", MATERIAS, "la materia") : null,
    descripcion: opcional(datos, "descripcion", 3000),
  };

  const motivo = motivoFechaNoDisponible(cita.fecha);
  if (motivo) throw new ErrorHttp(422, motivo, { campo: "fecha" });
  if (!horasDelDia().includes(cita.hora)) throw new ErrorHttp(422, "Esa hora no se ofrece.", { campo: "hora" });
  const ahora = ahoraLocal();
  if (cita.fecha === ahora.fecha && cita.hora <= ahora.hora) throw new ErrorHttp(422, "Esa hora ya pasó.", { campo: "hora" });

  const folio = nuevoFolio("CITA", ahora.fecha);
  const quienes = ocupados(cita.abogado);

  // Todo en un solo lote: o se guardan la cita y sus bloques, o no se guarda nada.
  // Si otra persona tomó la hora un instante antes, la llave primaria de cita_bloques
  // rechaza el lote completo y aquí se responde «ya está ocupada».
  const sentencias = [
    env.DB.prepare(
      `INSERT INTO citas (folio, fecha, hora, tipo, abogado, nombre, email, telefono, materia, descripcion)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
    ).bind(folio, cita.fecha, cita.hora, cita.tipo, cita.abogado, cita.nombre, cita.email, cita.telefono, cita.materia, cita.descripcion),
    ...quienes.map((quien) => env.DB.prepare(
      `INSERT INTO cita_bloques (fecha, hora, abogado, cita_id)
       SELECT ?1, ?2, ?3, id FROM citas WHERE folio = ?4`,
    ).bind(cita.fecha, cita.hora, quien, folio)),
  ];
  try {
    await env.DB.batch(sentencias);
  } catch (e) {
    if (/UNIQUE|PRIMARY/i.test(String(e?.message))) {
      throw new ErrorHttp(409, "Esa hora acaba de ocuparse. Elige otra, por favor.", { campo: "hora" });
    }
    throw e;
  }

  ctx.waitUntil(avisar(env,
    `Nueva propuesta de cita ${folio}\n${cita.fecha} a las ${cita.hora} · ${ABOGADOS[cita.abogado]}\n${TIPOS_CITA[cita.tipo]}\nDe: ${cita.nombre}\nConfírmala o cancélala en el panel.`,
    dep.fetch));

  return json({ folio, estado: "pendiente", mensaje: MENSAJE_OK }, 201);
}

const MENSAJE_OK = "Recibimos tu propuesta de cita. Queda pendiente hasta que el despacho la confirme.";

// Cancela una cita y libera su hora. Solo se llama desde el panel.
export async function cancelarCita(env, id) {
  await env.DB.batch([
    env.DB.prepare("UPDATE citas SET estado = 'cancelada' WHERE id = ?1").bind(id),
    env.DB.prepare("DELETE FROM cita_bloques WHERE cita_id = ?1").bind(id),
  ]);
}
