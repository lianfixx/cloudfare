// Panel privado con contraseña: consultas, citas del día, enlaces cortos y descarga CSV.
import { ABOGADOS, LIMITES, MATERIAS, TIPOS_CITA, TIPOS_CONSULTA } from "../config.js";
import { ahoraLocal, fechaValida } from "../lib/fechas.js";
import { ErrorHttp, escapar, html, ipDe, redirigir } from "../lib/http.js";
import { cookieDeSalida, crearCookieSesion, dentroDelLimite, fichaCsrf, iguales, sesionValida } from "../lib/seguridad.js";
import { cancelarCita } from "./agenda.js";
import { crearEnlace } from "./enlaces.js";

const ESTADOS_CONSULTA = ["pendiente", "revisada", "respondida", "archivada"];
const ESTADOS_CITA = ["pendiente", "confirmada", "atendida", "cancelada"];

const ESTILO = `
:root{color-scheme:light dark;--fondo:#fffdf7;--tinta:#1f2a37;--oro:#8a6516;--linea:#d9d4c7;--suave:#f3efe4}
@media(prefers-color-scheme:dark){:root{--fondo:#141b24;--tinta:#f1ede2;--oro:#d9ae4f;--linea:#34404f;--suave:#1d2733}}
*{box-sizing:border-box}body{margin:0;background:var(--fondo);color:var(--tinta);font:15px/1.5 system-ui,sans-serif}
main{max-width:1100px;margin:0 auto;padding:24px 16px 64px}h1{font-size:22px;margin:0}h2{font-size:17px;margin:32px 0 8px;color:var(--oro)}
header{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.tabla{overflow-x:auto;border:1px solid var(--linea);border-radius:8px}table{border-collapse:collapse;width:100%;min-width:640px}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--linea);vertical-align:top}th{background:var(--suave);font-size:13px}
td.msj{max-width:380px;white-space:pre-wrap;overflow-wrap:anywhere}
input,select,button{font:inherit;padding:6px 10px;border:1px solid var(--linea);border-radius:6px;background:var(--fondo);color:var(--tinta)}
button{cursor:pointer;background:var(--tinta);color:var(--fondo)}form.linea{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.aviso{padding:10px 12px;border-radius:6px;background:var(--suave);margin:12px 0}.cifras{display:flex;gap:12px;flex-wrap:wrap;margin-top:16px}
.cifra{border:1px solid var(--linea);border-radius:8px;padding:10px 14px;min-width:150px}.cifra b{display:block;font-size:22px}
.entrar{max-width:340px;margin:12vh auto;display:grid;gap:12px}a{color:var(--oro)}small{opacity:.75}
`;

function pagina(titulo, cuerpo) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${escapar(titulo)}</title><style>${ESTILO}</style></head><body><main>${cuerpo}</main></body></html>`;
}

function formularioDeEntrada(mensaje = "") {
  return pagina("Panel · MILLA ABOGADOS", `<form class="entrar" method="post" action="/admin/ingresar">
<h1>Panel de MILLA ABOGADOS</h1>${mensaje ? `<div class="aviso">${escapar(mensaje)}</div>` : ""}
<label for="clave">Contraseña</label><input id="clave" name="clave" type="password" autocomplete="current-password" required>
<button>Entrar</button></form>`);
}

function opciones(lista, actual) {
  return lista.map((o) => `<option${o === actual ? " selected" : ""}>${escapar(o)}</option>`).join("");
}

export async function manejarAdmin(request, env, ruta) {
  const metodo = request.method;

  if (ruta === "/admin/ingresar" && metodo === "POST") return ingresar(request, env);
  if (!(await sesionValida(env, request))) {
    if (metodo === "GET" && ruta === "/admin") return html(formularioDeEntrada());
    return redirigir("/admin", 303);
  }

  if (metodo === "GET" && ruta === "/admin") return tablero(request, env);
  if (metodo === "GET" && ruta === "/admin/consultas.csv") return csvConsultas(env);

  if (metodo === "POST") {
    const form = await request.formData();
    if (!(await iguales(String(form.get("csrf") || ""), await fichaCsrf(env, request)))) {
      throw new ErrorHttp(403, "La sesión del formulario expiró. Vuelve al panel e intenta de nuevo.");
    }
    if (ruta === "/admin/salir") return redirigir("/admin", 303, { "Set-Cookie": cookieDeSalida() });

    let m;
    if ((m = ruta.match(/^\/admin\/consultas\/(\d+)\/estado$/))) {
      const estado = String(form.get("estado"));
      if (!ESTADOS_CONSULTA.includes(estado)) throw new ErrorHttp(422, "Estado no permitido.");
      await env.DB.prepare("UPDATE consultas SET estado = ?1 WHERE id = ?2").bind(estado, Number(m[1])).run();
      return redirigir("/admin", 303);
    }
    if ((m = ruta.match(/^\/admin\/citas\/(\d+)\/estado$/))) {
      const estado = String(form.get("estado"));
      if (!ESTADOS_CITA.includes(estado)) throw new ErrorHttp(422, "Estado no permitido.");
      // Una cita cancelada ya liberó su hora: no se reactiva, se agenda de nuevo.
      const cita = await env.DB.prepare("SELECT estado, fecha FROM citas WHERE id = ?1").bind(Number(m[1])).first();
      if (!cita) throw new ErrorHttp(404, "No existe esa cita.");
      if (cita.estado === "cancelada") throw new ErrorHttp(409, "Esa cita ya está cancelada y su hora quedó libre.");
      if (estado === "cancelada") await cancelarCita(env, Number(m[1]));
      else await env.DB.prepare("UPDATE citas SET estado = ?1 WHERE id = ?2").bind(estado, Number(m[1])).run();
      return redirigir(`/admin?fecha=${cita.fecha}`, 303);
    }
    if (ruta === "/admin/enlaces") {
      await crearEnlace(env, String(form.get("slug") || ""), String(form.get("destino") || ""));
      return redirigir("/admin", 303);
    }
  }
  throw new ErrorHttp(404, "No existe esa página del panel.");
}

async function ingresar(request, env) {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return html(formularioDeEntrada("El panel aún no tiene contraseña configurada."), 503);
  }
  if (!(await dentroDelLimite(env, "admin", ipDe(request), LIMITES.intentosAdminPorHora))) {
    return html(formularioDeEntrada("Demasiados intentos. Espera una hora."), 429);
  }
  const form = await request.formData();
  if (!(await iguales(String(form.get("clave") || ""), env.ADMIN_PASSWORD))) {
    return html(formularioDeEntrada("Contraseña incorrecta."), 401);
  }
  return redirigir("/admin", 303, { "Set-Cookie": await crearCookieSesion(env) });
}

async function tablero(request, env) {
  const url = new URL(request.url);
  const hoy = ahoraLocal().fecha;
  const fecha = fechaValida(url.searchParams.get("fecha") || "") ? url.searchParams.get("fecha") : hoy;
  const csrf = await fichaCsrf(env, request);
  const oculto = `<input type="hidden" name="csrf" value="${csrf}">`;

  const [consultas, citas, enlaces, cifras] = await env.DB.batch([
    env.DB.prepare("SELECT * FROM consultas ORDER BY id DESC LIMIT 100"),
    env.DB.prepare("SELECT * FROM citas WHERE fecha = ?1 ORDER BY hora, id").bind(fecha),
    env.DB.prepare(
      `SELECT e.slug, e.destino, COALESCE(SUM(c.clics), 0) AS total,
              COALESCE(SUM(CASE WHEN c.dia = ?1 THEN c.clics END), 0) AS hoy
       FROM enlaces e LEFT JOIN enlace_clics c ON c.slug = e.slug GROUP BY e.slug ORDER BY e.created_at DESC`,
    ).bind(hoy),
    env.DB.prepare(
      `SELECT (SELECT COUNT(*) FROM consultas WHERE estado = 'pendiente') AS pendientes,
              (SELECT COUNT(*) FROM consultas) AS consultas,
              (SELECT COUNT(*) FROM citas WHERE estado = 'pendiente' AND fecha >= ?1) AS porConfirmar`,
    ).bind(hoy),
  ]);
  const n = cifras.results[0];

  const filasConsultas = consultas.results.map((c) => `<tr>
<td><b>${escapar(c.folio)}</b><br><small>${escapar(c.created_at)}</small></td>
<td>${escapar(TIPOS_CONSULTA[c.tipo] ?? c.tipo)}<br><small>${escapar(MATERIAS[c.materia] ?? c.materia)}</small></td>
<td>${escapar(c.nombre)}<br><small>${escapar(c.email)}${c.telefono ? `<br>${escapar(c.telefono)}` : ""}</small></td>
<td class="msj">${escapar(c.mensaje)}</td>
<td><form class="linea" method="post" action="/admin/consultas/${c.id}/estado">${oculto}
<select name="estado" aria-label="Estado de ${escapar(c.folio)}">${opciones(ESTADOS_CONSULTA, c.estado)}</select><button>Guardar</button></form></td></tr>`).join("");

  const filasCitas = citas.results.map((c) => `<tr>
<td><b>${escapar(c.hora)}</b><br><small>${escapar(c.folio)}</small></td>
<td>${escapar(ABOGADOS[c.abogado] ?? c.abogado)}<br><small>${escapar(TIPOS_CITA[c.tipo] ?? c.tipo)}</small></td>
<td>${escapar(c.nombre)}<br><small>${escapar(c.email)}${c.telefono ? `<br>${escapar(c.telefono)}` : ""}</small></td>
<td class="msj">${escapar(c.descripcion ?? "")}</td>
<td>${c.estado === "cancelada" ? "cancelada" : `<form class="linea" method="post" action="/admin/citas/${c.id}/estado">${oculto}
<select name="estado" aria-label="Estado de ${escapar(c.folio)}">${opciones(ESTADOS_CITA, c.estado)}</select><button>Guardar</button></form>`}</td></tr>`).join("");

  const origen = url.origin;
  const filasEnlaces = enlaces.results.map((e) => `<tr><td><a href="/l/${escapar(e.slug)}">${escapar(origen)}/l/${escapar(e.slug)}</a></td>
<td class="msj">${escapar(e.destino)}</td><td>${e.hoy}</td><td>${e.total}</td></tr>`).join("");

  return html(pagina("Panel · MILLA ABOGADOS", `
<header><h1>Panel de MILLA ABOGADOS</h1><form method="post" action="/admin/salir">${oculto}<button>Salir</button></form></header>
<div class="cifras"><div class="cifra"><b>${n.pendientes}</b>consultas pendientes</div>
<div class="cifra"><b>${n.consultas}</b>consultas en total</div><div class="cifra"><b>${n.porConfirmar}</b>citas por confirmar</div></div>

<h2>Citas del ${escapar(fecha)}</h2>
<form class="linea" method="get" action="/admin"><label for="fecha">Ver otro día</label>
<input id="fecha" type="date" name="fecha" value="${escapar(fecha)}"><button>Ver</button></form>
<div class="tabla"><table><thead><tr><th>Hora</th><th>Con quién</th><th>Persona</th><th>Asunto</th><th>Estado</th></tr></thead>
<tbody>${filasCitas || `<tr><td colspan="5">Sin citas ese día.</td></tr>`}</tbody></table></div>
<small>Cancelar una cita libera su hora de inmediato.</small>

<h2>Consultas del Buzón Jurídico</h2>
<p><a href="/admin/consultas.csv">Descargar todas en CSV</a> · se muestran las 100 más recientes.</p>
<div class="tabla"><table><thead><tr><th>Folio</th><th>Tipo</th><th>Persona</th><th>Mensaje</th><th>Estado</th></tr></thead>
<tbody>${filasConsultas || `<tr><td colspan="5">Aún no hay consultas.</td></tr>`}</tbody></table></div>

<h2>Enlaces cortos</h2>
<form class="linea" method="post" action="/admin/enlaces">${oculto}
<label for="slug">Nombre corto</label><input id="slug" name="slug" placeholder="promo-noviembre" required pattern="[a-z0-9][a-z0-9-]{1,48}">
<label for="destino">Enlace largo</label><input id="destino" name="destino" type="url" placeholder="https://…" required size="36"><button>Crear</button></form>
<div class="tabla"><table><thead><tr><th>Enlace corto</th><th>Lleva a</th><th>Clics hoy</th><th>Clics totales</th></tr></thead>
<tbody>${filasEnlaces || `<tr><td colspan="4">Aún no hay enlaces.</td></tr>`}</tbody></table></div>`));
}

// Excel abre bien el CSV con BOM. Las celdas que empiezan con = + - @ se neutralizan.
function celda(valor) {
  let v = String(valor ?? "");
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return `"${v.replaceAll('"', '""')}"`;
}

async function csvConsultas(env) {
  const { results } = await env.DB.prepare(
    "SELECT folio, created_at, tipo, materia, nombre, email, telefono, estado, mensaje FROM consultas ORDER BY id DESC",
  ).all();
  const columnas = ["folio", "created_at", "tipo", "materia", "nombre", "email", "telefono", "estado", "mensaje"];
  const cuerpo = [columnas.join(","), ...results.map((r) => columnas.map((c) => celda(r[c])).join(","))].join("\r\n");
  return new Response(`﻿${cuerpo}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="consultas-${ahoraLocal().fecha}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
