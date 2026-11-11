# milla-backend

Backend de MILLA ABOGADOS para Cloudflare Workers con base de datos D1.
Implementa lo que pedía `BACKEND_SPEC.md` del repo del sitio, sin dependencias en producción.

## Rutas

| Ruta | Qué hace |
|---|---|
| `POST /api/consultas` | Buzón Jurídico: valida, verifica Turnstile, guarda, devuelve folio y avisa por Telegram |
| `GET /api/agenda/disponibilidad` | Horas libres de un día para un abogado |
| `POST /api/agenda/citas` | Propuesta de cita. Dos personas no pueden tomar la misma hora |
| `POST /api/ia/chat` | Asistente con Workers AI, limitado a los datos del despacho |
| `GET /l/:slug` | Enlace corto; cuenta clics por día |
| `/admin` | Panel con contraseña: consultas, citas del día, enlaces y descarga en CSV |
| Tarea programada | Resumen diario por Telegram a las 8:00 de Ciudad de México |

## Estructura

```
src/config.js        Datos del despacho, catálogos, horario y texto del asistente
src/index.js         Enrutador, CORS y manejo de errores
src/rutas/           Una ruta por archivo
src/lib/             Validación, fechas, seguridad, Telegram
migrations/          Esquema de la base
test/                24 pruebas con Node y SQLite en memoria
```

## Decisiones

- **Sin choques de agenda por diseño.** Cada cita ocupa un renglón por abogado en `cita_bloques`, cuya llave primaria es fecha + hora + abogado. La base rechaza el segundo intento aunque lleguen al mismo tiempo.
- **Turnstile falla cerrado.** Sin clave secreta o sin token, no se guarda nada.
- **El aviso de Telegram no lleva el mensaje ni el contacto.** Solo folio, tipo, materia y nombre. Lo demás se lee en el panel.
- **No se guarda la IP.** El límite por visitante usa una huella.
- **El asistente no inventa.** Si la IA no está, falla o se acabó la cuota del día, responde con el WhatsApp.
- **No se guardan las conversaciones del asistente.**
- **A los clientes no se les envía nada automático.**

## Límites conocidos

- Probado con Node, **no dentro del runtime de Cloudflare**. El primer `cf dev` es la prueba que falta.
- `cloudflare.config.ts` sigue el formato de una beta y no se pudo validar con el CLI.
- Una sola contraseña para el panel; sin usuarios ni bitácora.
- Sin correo al cliente, sin recordatorios, sin enlaces de videollamada, sin firmas.
- El horario de citas y lo que sabe el asistente están marcados `POR CONFIRMAR` en `src/config.js`.

Publicación: [`../docs/puesta-en-marcha.md`](../docs/puesta-en-marcha.md).
