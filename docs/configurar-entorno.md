# Configurar el entorno de Cloudflare

Se hace una sola vez por computadora. Ningún paso cuesta dinero.
Comandos tomados de la documentación oficial de `cf` (developers.cloudflare.com/cf/), leída el 11-nov-2026.

## Requisitos

- Cuenta de Cloudflare. Si no tienes, créala en dash.cloudflare.com/sign-up (plan gratis).
- Node.js 22.18 o superior. Bun no está soportado.
- Claude Code o Codex.

Revisa Node:

```bash
node --version
```

## 1. Instalar el CLI

```bash
npm install --global cf
cf --version
```

El paquete instala dos comandos iguales: `cf` y `cloudflare`. Usa `cloudflare` si ya tienes otra herramienta llamada `cf`.
Para actualizar después: `npm install --global cf@latest`.

## 2. Iniciar sesión

```bash
cf auth login
```

Se abre el navegador con un enlace y un código. Inicias sesión y das «Autorizar». Luego confirma:

```bash
cf auth whoami
```

- En una máquina remota o contenedor: `cf auth login --no-browser` y apruebas desde otro dispositivo.
- Para volver a iniciar sesión: `cf auth login --force`.
- `cf` no reutiliza la sesión de Wrangler; aunque ya uses Wrangler, inicia sesión una vez.

## 3. Decirle al agente que use `cf`

Agrega esta línea a tu archivo de instrucciones de usuario. Así aplica en todos tus proyectos:

- Claude Code: `~/.claude/CLAUDE.md`
- Codex: `~/.codex/AGENTS.md`

```md
When interacting with Cloudflare, use the `cf` CLI unless the project has a Wrangler configuration file.
```

`scripts/verificar-entorno.sh --instalar` la agrega por ti si no está.

## 4. Plugin de Cloudflare para Claude Code (opcional, recomendado)

Instala los skills de Cloudflare y registra sus servidores MCP. Dentro de Claude Code:

```text
/plugin marketplace add cloudflare/skills
/plugin install cloudflare@cloudflare
```

El video da a entender que se instalan solos con el CLI; según la documentación, es un paso aparte.

## 5. Verificar

```bash
bash scripts/verificar-entorno.sh
```

Debe marcar todo en verde. Después, prueba con el agente:

> «Con cf, dime qué cuenta de Cloudflare tengo conectada y lista mis Workers. Solo lectura.»

## Opcional: varias cuentas

Si tienes cuentas separadas (por ejemplo, personal y despacho), usa perfiles:

```bash
cf auth create despacho          # crea el perfil e inicia sesión en él
cd ~/proyectos/algun-proyecto
cf auth activate despacho        # ese proyecto usa el perfil despacho
cf auth list                     # ver perfiles
```

## Opcional: agentes sin persona (tareas programadas, CI, sesiones en la nube)

No pueden aprobar `cf auth login`. Usan un token de API:

1. Panel de Cloudflare → Mi perfil → API Tokens → crear token con **solo** los permisos que necesite la tarea.
2. Guárdalo como variable de entorno o secreto del entorno, nunca en el código:
   `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`.

El token tiene prioridad sobre cualquier sesión iniciada. Si algún día quieres que las sesiones en la nube
de Claude publiquen solas, este es el camino; por ahora no está configurado.

## Si algo falla

| Síntoma | Qué hacer |
|---|---|
| `command not found: cf` | Reabre la terminal. Si sigue, revisa que la carpeta global de npm esté en tu `PATH` (`npm prefix -g`). |
| Errores al cargar `cloudflare.config.ts` | Revisa `node --version` (22.18+) y que no lo estés corriendo con Bun. |
| Claude Code bloquea la instalación | Es el modo de permisos. Revisa el comando y apruébalo tú; no lo fuerces a ciegas. |
| El agente no encuentra el comando | Pídele `cf cli search "<tarea>"` o «revisa la documentación de cf». |
| Varias cuentas y pregunta cuál | Elige una; `cf` la recuerda por proyecto. Para cambiarla, `cf auth login --force` desde el proyecto. |
