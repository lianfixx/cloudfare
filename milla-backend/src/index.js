// Worker de MILLA ABOGADOS. Rutas:
//   POST /api/consultas                 Buzón Jurídico (D1 + Turnstile + aviso por Telegram)
//   GET  /api/agenda/disponibilidad     Horas libres de un día
//   POST /api/agenda/citas              Propuesta de cita, sin choques
//   POST /api/ia/chat                   Asistente de preguntas frecuentes (Workers AI)
//   GET  /l/:slug                       Enlace corto con conteo de clics
//   /admin                              Panel privado con contraseña
// Tarea programada: resumen diario por Telegram.
import { ErrorHttp, cabecerasCors, error, escapar, html, json } from "./lib/http.js";
import { manejarAdmin } from "./rutas/admin.js";
import { crearCita, disponibilidad } from "./rutas/agenda.js";
import { crearConsulta } from "./rutas/consultas.js";
import { seguirEnlace } from "./rutas/enlaces.js";
import { chat } from "./rutas/ia.js";
import { tareaDiaria } from "./rutas/resumen.js";

async function enrutar(request, env, ctx, dep) {
  const url = new URL(request.url);
  const ruta = url.pathname.replace(/\/+$/, "") || "/";
  const metodo = request.method;

  if (ruta.startsWith("/api/")) {
    if (metodo === "OPTIONS") return new Response(null, { status: 204 });
    if (ruta === "/api/salud" && metodo === "GET") return json({ ok: true });
    if (ruta === "/api/consultas" && metodo === "POST") return crearConsulta(request, env, ctx, dep);
    if (ruta === "/api/agenda/disponibilidad" && metodo === "GET") return disponibilidad(request, env);
    if (ruta === "/api/agenda/citas" && metodo === "POST") return crearCita(request, env, ctx, dep);
    if (ruta === "/api/ia/chat" && metodo === "POST") return chat(request, env);
    throw new ErrorHttp(404, "No existe esa ruta.");
  }

  if (ruta === "/admin" || ruta.startsWith("/admin/")) return manejarAdmin(request, env, ruta);

  if (metodo === "GET" && ruta.startsWith("/l/")) {
    const destino = await seguirEnlace(env, ctx, ruta.slice(3));
    if (destino) return destino;
  }
  throw new ErrorHttp(404, "No existe esa página.");
}

export async function manejar(request, env, ctx, dep = {}) {
  const esApi = new URL(request.url).pathname.startsWith("/api/");
  let respuesta;
  try {
    respuesta = await enrutar(request, env, ctx, dep);
  } catch (e) {
    if (e instanceof ErrorHttp) {
      respuesta = esApi ? error(e.status, e.message, e.extra) : html(`<!doctype html><meta charset="utf-8"><title>${e.status}</title><p>${escapar(e.message)}</p><p><a href="/admin">Volver al panel</a></p>`, e.status);
    } else {
      console.error("Error no previsto:", e?.stack || e);
      respuesta = esApi ? error(500, "Ocurrió un error. Intenta de nuevo en unos minutos.") : html("<!doctype html><meta charset=\"utf-8\"><p>Ocurrió un error.</p>", 500);
    }
  }
  if (esApi) {
    const cors = cabecerasCors(request, env);
    if (Object.keys(cors).length) {
      respuesta = new Response(respuesta.body, respuesta);
      for (const [k, v] of Object.entries(cors)) respuesta.headers.set(k, v);
    }
  }
  return respuesta;
}

export default {
  fetch: (request, env, ctx) => manejar(request, env, ctx),
  scheduled: (_evento, env, ctx) => ctx.waitUntil(tareaDiaria(env)),
};
