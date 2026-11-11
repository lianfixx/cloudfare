# Conectar millabogados.com al backend

Propuesta. El repo `millabogados` tiene sus propias reglas y dueños de código, así que no se modificó.
Estos cambios se hacen allá, en una rama, cuando el backend ya esté publicado y probado.

## Contrato del backend

`POST /api/consultas` (Buzón Jurídico)

```json
{
  "tipo": "consulta_inicial | sugerencia | seguimiento | alianza",
  "materia": "corporativo | civil_familiar | laboral_mercantil | fiscal | amparo | otra",
  "nombre": "…", "email": "…", "telefono": "…",
  "mensaje": "entre 80 y 7000 caracteres",
  "privacidad": true,
  "company": "",
  "turnstile_token": "…"
}
```

Responde `201` con `{ "folio": "FOLIO-AAAAMMDD-XXXX", "mensaje": "…" }`.
Errores: `422` con `{ error, campo }`, `403` si falla Turnstile, `429` si hay demasiados envíos.

`GET /api/agenda/disponibilidad?fecha=AAAA-MM-DD&abogado=titular|socio|ambos` → `{ horas: ["10:00", …] }`

`POST /api/agenda/citas` con `fecha, hora, tipo (consulta|alianza|integral), abogado, nombre, email, telefono, materia, descripcion, privacidad, turnstile_token` → `201` con folio; `409` si la hora se ocupó.

`POST /api/ia/chat` con `{ "mensajes": [{ "rol": "usuario", "texto": "…" }] }` → `{ respuesta, derivado }`

## Cambios en el sitio

1. **Selects del formulario.** Hoy mandan la etiqueta («Consulta inicial»). Agregar `value` con la clave:
   `consulta_inicial`, `sugerencia`, `seguimiento`, `alianza`; y `corporativo`, `civil_familiar`, `laboral_mercantil`, `fiscal`, `amparo`.
2. **Nombres de campo.** El formulario usa `name`, `phone`, `message`, `privacy`; el backend espera `nombre`, `telefono`, `mensaje`, `privacidad`. Se traduce al armar el JSON en `app.js`. El campo trampa `company` se manda tal cual.
3. **Turnstile.** Poner el widget con la clave de sitio (pública) y mandar su token como `turnstile_token`.
4. **Envío.** En el `submit` de `.legal-inbox`, tras la validación que ya existe, hacer `fetch` al backend y mostrar el folio que devuelve, en lugar del folio generado en el navegador.
5. **Política de seguridad del sitio (CSP).** En `server.mjs`, `connect-src` debe incluir la dirección del backend. `form-action 'self'` puede quedarse, porque el envío es por `fetch`.
6. **Orígenes permitidos.** El backend solo acepta `https://millabogados.com` y `https://www.millabogados.com` (variable `ORIGENES_PERMITIDOS`). Para probar desde otra dirección hay que agregarla ahí.

## Orden sugerido

1. Publicar el backend y probarlo con el panel.
2. Conectar el Buzón Jurídico. Enviar una consulta de prueba y verla en el panel y en Telegram.
3. Conectar la agenda cuando el horario esté confirmado.
4. El asistente al final, cuando Emi haya revisado lo que puede decir.
