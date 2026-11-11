// Folios, huellas, Turnstile, límite de intentos y sesión del panel.

const codificador = new TextEncoder();

function aHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256(texto) {
  return aHex(await crypto.subtle.digest("SHA-256", codificador.encode(texto)));
}

async function hmac(secreto, mensaje) {
  const llave = await crypto.subtle.importKey("raw", codificador.encode(secreto), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return aHex(await crypto.subtle.sign("HMAC", llave, codificador.encode(mensaje)));
}

// Comparación que tarda lo mismo acierte o no, para no filtrar la contraseña por tiempo.
export async function iguales(a, b) {
  const [ha, hb] = await Promise.all([sha256(`cmp:${a}`), sha256(`cmp:${b}`)]);
  let diferencia = 0;
  for (let i = 0; i < ha.length; i++) diferencia |= ha.charCodeAt(i) ^ hb.charCodeAt(i);
  return diferencia === 0;
}

// FOLIO-AAAAMMDD-XXXX (formato del BACKEND_SPEC). Sin letras que se confunden.
export function nuevoFolio(prefijo, fechaLocal) {
  const alfabeto = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const azar = crypto.getRandomValues(new Uint8Array(4));
  const sufijo = [...azar].map((n) => alfabeto[n % alfabeto.length]).join("");
  return `${prefijo}-${fechaLocal.replaceAll("-", "")}-${sufijo}`;
}

// Valida el token de Turnstile en el servidor antes de guardar nada.
export async function turnstileValido(env, token, ip, fetchFn = fetch) {
  if (String(env.TURNSTILE_OBLIGATORIO || "si").toLowerCase() === "no") return true;
  if (!env.TURNSTILE_SECRET || !token || typeof token !== "string" || token.length > 2048) return false;
  try {
    const cuerpo = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token });
    if (ip && ip !== "local") cuerpo.set("remoteip", ip);
    const r = await fetchFn("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: cuerpo });
    const datos = await r.json();
    return datos.success === true;
  } catch {
    return false;
  }
}

// Cuenta intentos por visitante y hora. Guarda una huella de la IP, no la IP.
// Devuelve true si el visitante sigue dentro del límite.
export async function dentroDelLimite(env, accion, ip, maximo, ahora = new Date()) {
  const ventana = ahora.toISOString().slice(0, 13); // AAAA-MM-DDTHH
  const clave = `${accion}:${(await sha256(`${env.SESSION_SECRET || ""}:${ip}`)).slice(0, 24)}`;
  const fila = await env.DB.prepare(
    `INSERT INTO limites (clave, ventana, cuenta) VALUES (?1, ?2, 1)
     ON CONFLICT (clave, ventana) DO UPDATE SET cuenta = cuenta + 1
     RETURNING cuenta`,
  ).bind(clave, ventana).first();
  return (fila?.cuenta ?? 1) <= maximo;
}

export async function limpiarLimites(env, ahora = new Date()) {
  const corte = new Date(ahora.getTime() - 48 * 3600_000).toISOString().slice(0, 13);
  await env.DB.prepare("DELETE FROM limites WHERE ventana < ?1").bind(corte).run();
}

// --- Sesión del panel: cookie firmada, válida 8 horas ---
const COOKIE = "milla_sesion";
const DURACION_S = 8 * 3600;

export async function crearCookieSesion(env, ahora = Date.now()) {
  const vence = Math.floor(ahora / 1000) + DURACION_S;
  const firma = await hmac(env.SESSION_SECRET, `admin.${vence}`);
  return `${COOKIE}=${vence}.${firma}; Path=/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${DURACION_S}`;
}

export function cookieDeSalida() {
  return `${COOKIE}=; Path=/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function sesionValida(env, request, ahora = Date.now()) {
  if (!env.SESSION_SECRET) return false;
  const galleta = (request.headers.get("Cookie") || "").split(";").map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE}=`));
  if (!galleta) return false;
  const [vence, firma] = galleta.slice(COOKIE.length + 1).split(".");
  if (!/^\d+$/.test(vence || "") || !firma) return false;
  if (Number(vence) * 1000 < ahora) return false;
  return iguales(firma, await hmac(env.SESSION_SECRET, `admin.${vence}`));
}

// Ficha oculta contra envíos desde otro sitio (CSRF) en los formularios del panel.
export async function fichaCsrf(env, request) {
  const galleta = (request.headers.get("Cookie") || "").split(";").map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE}=`)) || "";
  return (await hmac(env.SESSION_SECRET, `csrf.${galleta}`)).slice(0, 32);
}
