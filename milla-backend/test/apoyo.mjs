// Apoyo de pruebas: una base D1 de mentira sobre SQLite de Node, con el mismo esquema real.
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { manejar } from "../src/index.js";
import { ahoraLocal, sumarDias, diaDeLaSemana } from "../src/lib/fechas.js";

class Sentencia {
  constructor(db, sql, valores = []) { this.db = db; this.sql = sql; this.valores = valores; }
  bind(...valores) { return new Sentencia(this.db, this.sql, valores); }
  #ejecutar() {
    const st = this.db.prepare(this.sql);
    const lee = /^\s*(SELECT|WITH)/i.test(this.sql) || /RETURNING/i.test(this.sql);
    if (lee) return { results: st.all(...this.valores), success: true };
    st.run(...this.valores);
    return { results: [], success: true };
  }
  async all() { return this.#ejecutar(); }
  async run() { return this.#ejecutar(); }
  async first() { return this.#ejecutar().results[0] ?? null; }
  _sync() { return this.#ejecutar(); }
}

export function baseDePrueba() {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(new URL("../migrations/0001_inicial.sql", import.meta.url), "utf8"));
  return {
    sqlite: db,
    prepare: (sql) => new Sentencia(db, sql),
    // Igual que D1: el lote es una transacción; si una sentencia falla, no queda nada.
    async batch(sentencias) {
      db.exec("BEGIN");
      try {
        const salida = sentencias.map((s) => s._sync());
        db.exec("COMMIT");
        return salida;
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    },
  };
}

export function entorno(extra = {}) {
  return {
    DB: baseDePrueba(),
    ORIGENES_PERMITIDOS: "https://millabogados.com,https://www.millabogados.com",
    MODELO_IA: "modelo-de-prueba",
    TURNSTILE_OBLIGATORIO: "no",
    ADMIN_PASSWORD: "clave-de-prueba-larga",
    SESSION_SECRET: "secreto-de-sesion-para-pruebas-0123456789",
    ...extra,
  };
}

export function contexto() {
  const pendientes = [];
  return { waitUntil: (p) => pendientes.push(Promise.resolve(p)), terminar: () => Promise.all(pendientes) };
}

export async function pedir(env, metodo, ruta, { cuerpo, form, cabeceras = {}, dep, ip = "203.0.113.7" } = {}) {
  const ctx = contexto();
  const init = { method: metodo, headers: { "CF-Connecting-IP": ip, ...cabeceras }, redirect: "manual" };
  if (cuerpo !== undefined) { init.body = JSON.stringify(cuerpo); init.headers["Content-Type"] = "application/json"; }
  if (form) { init.body = new URLSearchParams(form); }
  const r = await manejar(new Request(`https://api.prueba${ruta}`, init), env, ctx, dep);
  await ctx.terminar();
  return r;
}

// Próximo día hábil (lunes a viernes) a partir de mañana, en hora de Ciudad de México.
export function proximoDiaHabil(desde = 1) {
  let f = sumarDias(ahoraLocal().fecha, desde);
  while (![1, 2, 3, 4, 5].includes(diaDeLaSemana(f))) f = sumarDias(f, 1);
  return f;
}
export function proximoSabado() {
  let f = sumarDias(ahoraLocal().fecha, 1);
  while (diaDeLaSemana(f) !== 6) f = sumarDias(f, 1);
  return f;
}

export const CONSULTA = {
  tipo: "consulta_inicial",
  materia: "civil_familiar",
  nombre: "Persona de Prueba",
  email: "persona@example.com",
  telefono: "+52 55 0000 0000",
  mensaje: "Este es un mensaje de prueba con la longitud mínima que pide el formulario del sitio, sin datos reales.",
  privacidad: true,
};

export function cita(extra = {}) {
  return {
    fecha: proximoDiaHabil(), hora: "11:00", tipo: "consulta", abogado: "titular",
    nombre: "Persona de Prueba", email: "persona@example.com", privacidad: true, ...extra,
  };
}
