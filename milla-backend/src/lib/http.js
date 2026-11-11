// Respuestas, CORS y cabeceras de seguridad.

const SEGURIDAD = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
};

export function origenesPermitidos(env) {
  return String(env.ORIGENES_PERMITIDOS || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
}

export function cabecerasCors(request, env) {
  const origen = request.headers.get("Origin");
  if (!origen || !origenesPermitidos(env).includes(origen)) return {};
  return {
    "Access-Control-Allow-Origin": origen,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function json(datos, status = 200, extra = {}) {
  return new Response(JSON.stringify(datos), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...SEGURIDAD, ...extra },
  });
}

export function error(status, mensaje, extra = {}) {
  return json({ error: mensaje, ...extra }, status);
}

export function html(cuerpo, status = 200, extra = {}) {
  return new Response(cuerpo, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
      ...SEGURIDAD, ...extra,
    },
  });
}

export function redirigir(url, status = 302, extra = {}) {
  return new Response(null, { status, headers: { Location: url, "Cache-Control": "no-store", ...extra } });
}

// Lee JSON con tope de tamaño para que nadie mande cuerpos enormes.
export async function leerJson(request, maxBytes = 32_000) {
  const texto = await request.text();
  if (texto.length > maxBytes) throw new ErrorHttp(413, "El mensaje es demasiado grande.");
  try {
    const datos = JSON.parse(texto);
    if (!datos || typeof datos !== "object" || Array.isArray(datos)) throw new Error();
    return datos;
  } catch {
    throw new ErrorHttp(400, "El cuerpo debe ser JSON válido.");
  }
}

export class ErrorHttp extends Error {
  constructor(status, mensaje, extra = {}) {
    super(mensaje);
    this.status = status;
    this.extra = extra;
  }
}

export function escapar(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

export function ipDe(request) {
  return request.headers.get("CF-Connecting-IP") || "local";
}
