# Puesta en marcha

Lo que sigue necesita a Emi: iniciar sesión, crear claves y aprobar la publicación.
Ningún paso cuesta dinero en el plan gratis. Nada de esto se ha ejecutado todavía.

Los comandos de `cf` vienen de la documentación oficial leída el 11-nov-2026. `cf` está en beta:
el agente debe confirmar cada uno con `cf cli search` y `--help`, y ensayar con `--dry-run`.

## 0. Una sola vez: preparar el agente

En Claude Code o Codex en tu Mac, dentro de este repo, pega el prompt de preparación de la guía
(está en [`prompts.md`](prompts.md)). Hace cuatro cosas:

1. Revisa que tengas Node 22.18 o superior.
2. Instala el CLI: `npm install --global cf`.
3. Agrega a tu `CLAUDE.md` de usuario la línea de Cloudflare (este repo ya la trae).
4. Corre `cf auth login`. Se abre el navegador; inicias sesión y autorizas. Confirma con `cf auth whoami`.

Opcional, en Claude Code: `/plugin marketplace add cloudflare/skills` y `/plugin install cloudflare@cloudflare`.

> En la sesión en la nube donde se escribió este código, la instalación de `cf` quedó bloqueada por el
> clasificador de permisos y no se forzó. Por eso el código está probado con Node, pero no con `cf dev`.

## 1. Probar en tu computadora

```bash
cd milla-backend
npm install
npm test                         # deben pasar las 24 pruebas
cp .dev.vars.ejemplo .dev.vars   # pon una contraseña de prueba
cf dev                           # abre la dirección local que imprime
```

Aplica el esquema a la base local. Pide al agente:
«Aplica `migrations/0001_inicial.sql` a la base D1 local con `cf d1 migrations apply --local`; revisa antes la ayuda del comando».

Este es el primer momento en que el código corre en el runtime real de Cloudflare. Si `cf dev` marca algo
en `cloudflare.config.ts`, es el lugar más probable: el formato es de una beta.

## 2. Crear lo que hace falta en tu cuenta

| Qué | Cómo | Costo |
|---|---|---|
| Base de datos D1 | `cf d1 create --name milla-backend --dry-run`, y luego sin `--dry-run` | Gratis |
| Esquema | `cf d1 migrations apply` contra la base remota, con la carpeta `migrations/` | Gratis |
| Turnstile | Panel de Cloudflare → Turnstile → crear widget para `millabogados.com`. Da una clave de sitio (pública) y una secreta | Gratis hasta 20 widgets |
| Bot de Telegram | En Telegram, habla con `@BotFather` → `/newbot`. Te da el token. Escríbele algo a tu bot y pide al agente que te ayude a obtener tu `chat_id` | Gratis |

## 3. Secretos

```bash
cd milla-backend
cp secretos.ejemplo.json secretos.json    # está en .gitignore
```

Llénalo tú, en tu editor. No pegues las claves en el chat.

| Secreto | De dónde sale |
|---|---|
| `ADMIN_PASSWORD` | La inventas. Una frase larga. |
| `SESSION_SECRET` | 32 caracteres o más al azar: `openssl rand -hex 32` |
| `TURNSTILE_SECRET` | La clave secreta del widget |
| `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` | Del paso anterior |

## 4. Publicar

```bash
cf deploy --dry-run                          # ensayo: no toca tu cuenta
cf deploy --secrets-file secretos.json       # publica
```

Te da una dirección `milla-backend.<tu-subdominio>.workers.dev`. Pruébala:

- `…/api/salud` debe responder `{"ok":true}`.
- `…/admin` debe pedir la contraseña.

## 5. Antes de conectarlo al sitio: decisiones de Emi

1. **Horario de citas.** `src/config.js` trae lunes a viernes, 10:00 a 17:00, bloques de una hora. Está marcado `POR CONFIRMAR`.
2. **Lo que el asistente puede decir.** Hoy solo sabe materias, zona y contacto. Si quieres que responda horarios o costos orientativos, hay que escribirlos en `CONOCIMIENTO_IA`.
3. **Aviso de Privacidad.** El formulario ya pide aceptarlo. Revisa que el aviso publicado cubra el guardado de consultas y citas, y que mencione al asistente.
4. **Retención.** No hay borrado automático de consultas. Define cuánto tiempo se conservan.
5. **Dirección definitiva.** Para usar `api.millabogados.com` en vez de `workers.dev`, el dominio debe estar administrado en Cloudflare. Mover el DNS afecta al sitio y al correo: se hace con calma y con respaldo de los registros actuales.

Después, sigue [`conectar-sitio-milla.md`](conectar-sitio-milla.md).

## Si algo sale mal

- **Volver atrás:** Cloudflare guarda las versiones del Worker; se regresa a la anterior desde el panel o con `cf` (pide al agente el comando vigente).
- **Límite del plan gratis:** las operaciones dan error hasta las 00:00 UTC; no se cobra. El asistente ya deriva a WhatsApp si se acaban las neuronas.
- **Borrar todo:** el Worker y la base se eliminan desde el panel. La base no se recupera: exporta antes el CSV.
