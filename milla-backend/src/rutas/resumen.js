// Resumen diario por Telegram (tarea programada) y limpieza del contador de intentos.
import { ahoraLocal } from "../lib/fechas.js";
import { limpiarLimites } from "../lib/seguridad.js";
import { avisar } from "../lib/telegram.js";

export async function textoResumen(env, ahora = new Date()) {
  const hoy = ahoraLocal(ahora).fecha;
  const [pendientes, nuevas, citasHoy, porConfirmar] = await env.DB.batch([
    env.DB.prepare("SELECT COUNT(*) AS n FROM consultas WHERE estado = 'pendiente'"),
    env.DB.prepare("SELECT COUNT(*) AS n FROM consultas WHERE created_at >= ?1").bind(new Date(ahora.getTime() - 24 * 3600_000).toISOString().slice(0, 19) + "Z"),
    env.DB.prepare("SELECT hora, abogado, estado FROM citas WHERE fecha = ?1 AND estado != 'cancelada' ORDER BY hora").bind(hoy),
    env.DB.prepare("SELECT COUNT(*) AS n FROM citas WHERE estado = 'pendiente' AND fecha >= ?1").bind(hoy),
  ]);
  const lineas = [
    `Resumen MILLA · ${hoy}`,
    `Consultas nuevas (24 h): ${nuevas.results[0].n}`,
    `Consultas pendientes: ${pendientes.results[0].n}`,
    `Citas por confirmar: ${porConfirmar.results[0].n}`,
    citasHoy.results.length
      ? `Citas de hoy:\n${citasHoy.results.map((c) => `  ${c.hora} · ${c.abogado} · ${c.estado}`).join("\n")}`
      : "Citas de hoy: ninguna",
  ];
  return lineas.join("\n");
}

export async function tareaDiaria(env, dep = {}) {
  await limpiarLimites(env);
  return avisar(env, await textoResumen(env), dep.fetch);
}
