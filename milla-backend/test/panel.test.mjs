import assert from "node:assert/strict";
import { test } from "node:test";
import { tareaDiaria, textoResumen } from "../src/rutas/resumen.js";
import { CONSULTA, cita, entorno, pedir, proximoDiaHabil } from "./apoyo.mjs";

async function entrar(env) {
  const r = await pedir(env, "POST", "/admin/ingresar", { form: { clave: env.ADMIN_PASSWORD } });
  assert.equal(r.status, 303);
  const galleta = r.headers.get("Set-Cookie");
  assert.match(galleta, /HttpOnly; Secure; SameSite=Strict/);
  const cabeceras = { Cookie: galleta.split(";")[0] };
  const pagina = await (await pedir(env, "GET", "/admin", { cabeceras })).text();
  const csrf = pagina.match(/name="csrf" value="([0-9a-f]{32})"/)[1];
  return { cabeceras, csrf };
}

test("panel: sin sesión solo muestra el formulario de entrada y no filtra datos", async () => {
  const env = entorno();
  await pedir(env, "POST", "/api/consultas", { cuerpo: CONSULTA });
  const r = await pedir(env, "GET", "/admin");
  const pagina = await r.text();
  assert.ok(pagina.includes('type="password"'));
  assert.ok(!pagina.includes("persona@example.com"));
  assert.equal((await pedir(env, "GET", "/admin/consultas.csv")).status, 303);
  assert.equal((await pedir(env, "POST", "/admin/consultas/1/estado", { form: { estado: "archivada" } })).status, 303);
  assert.equal(env.DB.sqlite.prepare("SELECT estado FROM consultas").get().estado, "pendiente");
});

test("panel: contraseña incorrecta no entra, y se bloquea tras demasiados intentos", async () => {
  const env = entorno();
  for (let i = 0; i < 10; i++) {
    const r = await pedir(env, "POST", "/admin/ingresar", { form: { clave: "equivocada" } });
    assert.equal(r.status, 401);
    assert.equal(r.headers.get("Set-Cookie"), null);
  }
  assert.equal((await pedir(env, "POST", "/admin/ingresar", { form: { clave: env.ADMIN_PASSWORD } })).status, 429);
});

test("panel: una cookie falsificada o vencida no sirve", async () => {
  const env = entorno();
  const vence = Math.floor(Date.now() / 1000) + 3600;
  const falsa = await pedir(env, "GET", "/admin", { cabeceras: { Cookie: `milla_sesion=${vence}.${"a".repeat(64)}` } });
  assert.ok((await falsa.text()).includes('type="password"'));
  const { cabeceras } = await entrar(env);
  const [, valor] = cabeceras.Cookie.split("=");
  const [, firma] = valor.split(".");
  const alterada = await pedir(env, "GET", "/admin", { cabeceras: { Cookie: `milla_sesion=${vence + 99999}.${firma}` } });
  assert.ok((await alterada.text()).includes('type="password"'));
});

test("panel: muestra las consultas escapando HTML y permite cambiar su estado", async () => {
  const env = entorno();
  const malicioso = `<script>alert(1)</script> ${"texto de relleno para alcanzar el mínimo del formulario del sitio. ".repeat(2)}`;
  await pedir(env, "POST", "/api/consultas", { cuerpo: { ...CONSULTA, nombre: '<img src=x onerror="x">', mensaje: malicioso } });
  const { cabeceras, csrf } = await entrar(env);
  const pagina = await (await pedir(env, "GET", "/admin", { cabeceras })).text();
  assert.ok(!pagina.includes("<script>alert(1)</script>"));
  assert.ok(!pagina.includes("<img src=x"));
  assert.ok(pagina.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));

  // Sin la ficha del formulario (envío desde otro sitio) no se cambia nada.
  assert.equal((await pedir(env, "POST", "/admin/consultas/1/estado", { cabeceras, form: { estado: "archivada" } })).status, 403);
  assert.equal(env.DB.sqlite.prepare("SELECT estado FROM consultas").get().estado, "pendiente");
  assert.equal((await pedir(env, "POST", "/admin/consultas/1/estado", { cabeceras, form: { estado: "respondida", csrf } })).status, 303);
  assert.equal(env.DB.sqlite.prepare("SELECT estado FROM consultas").get().estado, "respondida");
  assert.equal((await pedir(env, "POST", "/admin/consultas/1/estado", { cabeceras, form: { estado: "borrada", csrf } })).status, 422);
});

test("panel: cancelar una cita libera su hora; una cancelada no se reactiva", async () => {
  const env = entorno();
  const fecha = proximoDiaHabil();
  await pedir(env, "POST", "/api/agenda/citas", { cuerpo: cita({ fecha, abogado: "ambos" }) });
  const { cabeceras, csrf } = await entrar(env);
  const dia = await (await pedir(env, "GET", `/admin?fecha=${fecha}`, { cabeceras })).text();
  assert.ok(dia.includes("11:00"));
  assert.equal((await pedir(env, "POST", "/admin/citas/1/estado", { cabeceras, form: { estado: "confirmada", csrf } })).status, 303);
  assert.equal(env.DB.sqlite.prepare("SELECT estado FROM citas").get().estado, "confirmada");
  assert.equal((await pedir(env, "POST", "/admin/citas/1/estado", { cabeceras, form: { estado: "cancelada", csrf } })).status, 303);
  assert.equal(env.DB.sqlite.prepare("SELECT COUNT(*) AS n FROM cita_bloques").get().n, 0);
  const libres = await (await pedir(env, "GET", `/api/agenda/disponibilidad?fecha=${fecha}&abogado=titular`)).json();
  assert.ok(libres.horas.includes("11:00"));
  assert.equal((await pedir(env, "POST", "/admin/citas/1/estado", { cabeceras, form: { estado: "confirmada", csrf } })).status, 409);
  assert.equal((await pedir(env, "POST", "/api/agenda/citas", { cuerpo: cita({ fecha }) })).status, 201);
});

test("panel: el CSV incluye las consultas y neutraliza fórmulas de hoja de cálculo", async () => {
  const env = entorno();
  await pedir(env, "POST", "/api/consultas", { cuerpo: { ...CONSULTA, nombre: '=HYPERLINK("http://x")' } });
  const { cabeceras } = await entrar(env);
  const r = await pedir(env, "GET", "/admin/consultas.csv", { cabeceras });
  assert.match(r.headers.get("Content-Type"), /text\/csv/);
  const bytes = new Uint8Array(await r.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 3)], [0xef, 0xbb, 0xbf], "lleva BOM para que Excel lea bien los acentos");
  const csv = new TextDecoder().decode(bytes);
  assert.ok(csv.startsWith("folio,created_at"));
  assert.ok(csv.includes(`"'=HYPERLINK(""http://x"")"`));
});

test("enlaces cortos: se crean en el panel, redirigen y cuentan clics por día", async () => {
  const env = entorno();
  const { cabeceras, csrf } = await entrar(env);
  assert.equal((await pedir(env, "GET", "/l/promo")).status, 404);
  assert.equal((await pedir(env, "POST", "/admin/enlaces", { cabeceras, form: { slug: "promo", destino: "https://millabogados.com/#contacto", csrf } })).status, 303);
  for (let i = 0; i < 3; i++) {
    const r = await pedir(env, "GET", "/l/promo");
    assert.equal(r.status, 302);
    assert.equal(r.headers.get("Location"), "https://millabogados.com/#contacto");
  }
  assert.equal(env.DB.sqlite.prepare("SELECT clics FROM enlace_clics WHERE slug = 'promo'").get().clics, 3);
  const pagina = await (await pedir(env, "GET", "/admin", { cabeceras })).text();
  assert.ok(pagina.includes("/l/promo"));
  // Reglas: nombre repetido, destino que no es https, nombre con caracteres raros.
  assert.equal((await pedir(env, "POST", "/admin/enlaces", { cabeceras, form: { slug: "promo", destino: "https://example.com", csrf } })).status, 409);
  assert.equal((await pedir(env, "POST", "/admin/enlaces", { cabeceras, form: { slug: "otro", destino: "javascript:alert(1)", csrf } })).status, 422);
  assert.equal((await pedir(env, "POST", "/admin/enlaces", { cabeceras, form: { slug: "../admin", destino: "https://example.com", csrf } })).status, 422);
  // Sin sesión no se pueden crear.
  assert.equal((await pedir(env, "POST", "/admin/enlaces", { form: { slug: "x1", destino: "https://example.com", csrf } })).status, 303);
  assert.equal(env.DB.sqlite.prepare("SELECT COUNT(*) AS n FROM enlaces").get().n, 1);
});

test("panel: salir borra la sesión", async () => {
  const env = entorno();
  const { cabeceras, csrf } = await entrar(env);
  const r = await pedir(env, "POST", "/admin/salir", { cabeceras, form: { csrf } });
  assert.match(r.headers.get("Set-Cookie"), /Max-Age=0/);
});

test("resumen diario: cuenta consultas y citas y se envía por Telegram", async () => {
  const enviados = [];
  const dep = { fetch: async (_url, init) => { enviados.push(JSON.parse(init.body).text); return Response.json({ ok: true }); } };
  const env = entorno({ TELEGRAM_BOT_TOKEN: "1:a", TELEGRAM_CHAT_ID: "9" });
  await pedir(env, "POST", "/api/consultas", { cuerpo: CONSULTA, dep });
  await pedir(env, "POST", "/api/agenda/citas", { cuerpo: cita(), dep });
  const texto = await textoResumen(env);
  assert.ok(texto.includes("Consultas nuevas (24 h): 1"));
  assert.ok(texto.includes("Consultas pendientes: 1"));
  assert.ok(texto.includes("Citas por confirmar: 1"));
  enviados.length = 0;
  assert.equal(await tareaDiaria(env, dep), true);
  assert.equal(enviados.length, 1);
  // Sin Telegram configurado no truena.
  assert.equal(await tareaDiaria(entorno()), false);
});
