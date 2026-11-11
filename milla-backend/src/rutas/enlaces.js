// Enlaces cortos con conteo de clics por día: GET /l/:slug
import { ahoraLocal } from "../lib/fechas.js";
import { ErrorHttp, redirigir } from "../lib/http.js";
import { limpiar } from "../lib/validar.js";

export const SLUG_VALIDO = /^[a-z0-9][a-z0-9-]{1,48}$/;

export async function seguirEnlace(env, ctx, slug) {
  if (!SLUG_VALIDO.test(slug)) return null;
  const fila = await env.DB.prepare("SELECT destino FROM enlaces WHERE slug = ?1").bind(slug).first();
  if (!fila) return null;
  ctx.waitUntil(env.DB.prepare(
    `INSERT INTO enlace_clics (slug, dia, clics) VALUES (?1, ?2, 1)
     ON CONFLICT (slug, dia) DO UPDATE SET clics = clics + 1`,
  ).bind(slug, ahoraLocal().fecha).run());
  return redirigir(fila.destino, 302);
}

export async function crearEnlace(env, slugCrudo, destinoCrudo) {
  const slug = limpiar(slugCrudo, 60).toLowerCase().replace(/^\/+/, "");
  const destino = limpiar(destinoCrudo, 2000);
  if (!SLUG_VALIDO.test(slug)) throw new ErrorHttp(422, "El nombre corto solo admite minúsculas, números y guiones (2 a 49 caracteres).");
  let url;
  try { url = new URL(destino); } catch { throw new ErrorHttp(422, "El enlace largo no es una dirección válida."); }
  if (url.protocol !== "https:") throw new ErrorHttp(422, "El enlace largo debe empezar con https://");
  try {
    await env.DB.prepare("INSERT INTO enlaces (slug, destino) VALUES (?1, ?2)").bind(slug, url.toString()).run();
  } catch (e) {
    if (/UNIQUE|PRIMARY/i.test(String(e?.message))) throw new ErrorHttp(409, "Ese nombre corto ya existe.");
    throw e;
  }
  return slug;
}
