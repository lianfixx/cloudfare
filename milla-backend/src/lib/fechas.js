import { AGENDA, DESPACHO } from "../config.js";

// Fecha y hora actuales en Ciudad de México, como textos comparables.
export function ahoraLocal(ahora = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: DESPACHO.zonaHoraria, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(ahora).map((x) => [x.type, x.value]),
  );
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
}

export function fechaValida(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const d = new Date(`${fecha}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === fecha;
}

export function diaDeLaSemana(fecha) {
  return new Date(`${fecha}T00:00:00Z`).getUTCDay(); // 0 = domingo
}

export function sumarDias(fecha, dias) {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

// Horas que se ofrecen en un día hábil, según la configuración.
export function horasDelDia() {
  const horas = [];
  for (let m = AGENDA.horaInicio * 60; m + AGENDA.minutosPorCita <= AGENDA.horaFin * 60; m += AGENDA.minutosPorCita) {
    horas.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return horas;
}

// Devuelve null si la fecha se puede reservar, o el motivo por el que no.
export function motivoFechaNoDisponible(fecha, ahora = new Date()) {
  if (!fechaValida(fecha)) return "La fecha no es válida.";
  const hoy = ahoraLocal(ahora).fecha;
  if (fecha < hoy) return "Esa fecha ya pasó.";
  if (fecha > sumarDias(hoy, AGENDA.diasDeAnticipacionMaxima)) return "Esa fecha está demasiado lejos.";
  if (!AGENDA.diasHabiles.includes(diaDeLaSemana(fecha))) return "Ese día no se ofrecen citas.";
  return null;
}
