import { ErrorHttp } from "./http.js";

// Quita caracteres de control y espacios sobrantes. El HTML se escapa al mostrar, no aquí.
export function limpiar(valor, max) {
  if (typeof valor !== "string") return "";
  return valor.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
}

export function texto(datos, campo, { min = 1, max = 255, etiqueta = campo } = {}) {
  const v = limpiar(datos[campo], max + 1);
  if (v.length < min) throw new ErrorHttp(422, `Falta ${etiqueta} o es demasiado corto.`, { campo });
  if (v.length > max) throw new ErrorHttp(422, `${etiqueta} es demasiado largo.`, { campo });
  return v;
}

export function opcional(datos, campo, max = 255) {
  const v = limpiar(datos[campo], max);
  return v || null;
}

export function correo(datos, campo = "email") {
  const v = limpiar(datos[campo], 255).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) throw new ErrorHttp(422, "El correo no es válido.", { campo });
  return v;
}

export function telefono(datos, campo = "telefono") {
  const v = limpiar(datos[campo], 40);
  if (!v) return null;
  if (!/^[+\d][\d\s().-]{6,39}$/.test(v)) throw new ErrorHttp(422, "El teléfono no es válido.", { campo });
  return v;
}

export function unoDe(datos, campo, catalogo, etiqueta = campo) {
  const v = limpiar(datos[campo], 60);
  if (!Object.hasOwn(catalogo, v)) throw new ErrorHttp(422, `Valor no permitido en ${etiqueta}.`, { campo });
  return v;
}
