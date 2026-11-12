# Configurar el entorno de Cloudflare

Se hace una sola vez por computadora y no cuesta dinero.
Comandos verificados contra la documentación oficial y contra `cf` 1.0.0-beta.30 el 12-nov-2026.

Hay dos tipos de comandos, y confundirlos es el error más común:

- **En la Terminal** (la línea termina en `%` o `$`): todo lo que empieza con `cf`, `bash`, `git`, `node`, `curl`.
- **Dentro de Claude Code** (después de escribir `claude`): todo lo que empieza con `/`.

## 1. Requisitos

| Qué | Cómo revisarlo | Si falta |
|---|---|---|
| Cuenta de Cloudflare | — | Créala gratis en dash.cloudflare.com/sign-up |
| Node.js 22.18 o superior | `node --version` | Descarga la versión **LTS** de nodejs.org e instálala. Bun no sirve |
| Claude Code **de terminal** | `claude --version` | `curl -fsSL https://claude.ai/install.sh \| bash` y luego cierra y abre la Terminal |

La app de escritorio de Claude y Claude Code en la web no instalan el comando `claude`; hace falta el instalador de arriba.
Si usas Codex: `npm install -g @openai/codex`.

## 2. Bajar este repo

```bash
cd ~
git clone https://github.com/lianfixx/cloudfare.git
cd cloudfare
```

Si ya lo tenías, solo actualízalo: `cd ~/cloudfare && git pull`.

## 3. Instalar el CLI y la regla para el agente

```bash
bash scripts/verificar-entorno.sh --instalar
```

Hace dos cosas:

- Instala el CLI de Cloudflare (`npm install --global cf`). Deja dos comandos iguales: `cf` y `cloudflare`. Si ya tenías otro `cf` (por ejemplo, el de Cloud Foundry), usa `cloudflare`.
- Agrega a tus instrucciones de usuario (`~/.claude/CLAUDE.md` y, si usas Codex, `~/.codex/AGENTS.md`) esta línea:

  ```md
  When interacting with Cloudflare, use the `cf` CLI unless the project has a Wrangler configuration file.
  ```

  Por eso Claude Code debe estar instalado antes de este paso. Si lo instalaste después, repite el comando; no duplica nada.

## 4. Iniciar sesión en Cloudflare

```bash
cf auth login
```

Se abre el navegador con un código. Inicias sesión, revisas que el código coincida y das **Autorizar**. Luego:

```bash
cf auth whoami
```

Debe decir `"authenticated": true`. Si dice `false`, no hay sesión aunque el comando no marque error.

- En una máquina remota o sin navegador: `cf auth login --no-browser` y apruebas el enlace desde otro dispositivo.
- Para volver a iniciar sesión: `cf auth login --force`.
- Para ver qué permisos tiene la sesión: `cf auth scopes`.
- `cf` no reutiliza la sesión de Wrangler.

## 5. Plugin de Cloudflare (opcional, recomendado)

Le da al agente las guías oficiales de Cloudflare y conecta los servidores MCP de Cloudflare.

**Claude Code.** Abre `claude` en la Terminal y, **ya dentro**, escribe una línea, espera a que termine y luego la otra:

```text
/plugin marketplace add cloudflare/skills
```

```text
/plugin install cloudflare@cloudflare
```

Cuando pregunte el alcance, elige **«Install for you (user scope)»**. La pantalla trae preseleccionado «local scope», que solo sirve en una carpeta.
Después `/reload-plugins` debe decir **1 plugin**. Sal con `/exit`.
La primera vez que el agente use un servidor MCP de Cloudflare, te pedirá autorizarlo en el navegador con tu cuenta.

**Codex.** Dentro de Codex, `/plugins`, busca **Cloudflare** e instálalo. En la app de Codex: **Plugins → Cloudflare**.

## 6. Verificar

```bash
bash scripts/verificar-entorno.sh
```

Todo debe salir con ✓ y terminar en **«Listo»**. Cada ✗ dice qué hacer.

## 7. Prueba real

Abre `claude` dentro de `~/cloudfare` y pídele:

> Con cf, dime qué cuenta de Cloudflare tengo conectada y lista mis Workers. Solo lectura, no cambies nada.

## Quitar el acceso

```bash
cf auth logout
cf auth whoami      # debe decir "authenticated": false
```

## Opcional: varias cuentas

```bash
cf auth create despacho          # crea el perfil e inicia sesión en él
cd ~/proyectos/algun-proyecto
cf auth activate despacho        # ese proyecto usa el perfil despacho
cf auth list                     # ver perfiles
```

## Opcional: agentes sin persona (tareas programadas, CI, sesiones en la nube)

No pueden aprobar `cf auth login`. Usan un token de API:

1. Panel de Cloudflare → Mi perfil → API Tokens → crear token con **solo** los permisos que necesite la tarea y con fecha de vencimiento.
2. Guárdalo como variable o secreto del entorno, nunca en el código: `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`.

El token tiene prioridad sobre cualquier sesión. Hoy no hay ninguno configurado; la tarea semanal no lo necesita.

## Si algo falla

| Síntoma | Causa y solución |
|---|---|
| `zsh: no such file or directory: /plugin` | Escribiste un comando de Claude Code en la Terminal. Primero `claude`, y ya dentro, `/plugin …` |
| `zsh: command not found: claude` | Falta Claude Code de terminal: `curl -fsSL https://claude.ai/install.sh \| bash`, cierra y abre la Terminal. Si sigue: `echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc` |
| `command not found: cf` | Cierra y abre la Terminal. Si sigue, la carpeta global de npm no está en tu `PATH` (`npm prefix -g`) |
| `EACCES` al instalar con npm | npm no tiene permiso en su carpeta. No uses `sudo`: instala Node desde nodejs.org o con nvm y repite |
| `cf` hace otra cosa (Cloud Foundry) | Usa `cloudflare` en vez de `cf`; es el mismo CLI |
| El script dice que falta la regla aunque corriste `--instalar` | Instalaste Claude Code después. Repite `--instalar` |
| `/reload-plugins` dice 0 plugins | Solo agregaste el catálogo. Falta `/plugin install cloudflare@cloudflare` con alcance user |
| Errores al cargar `cloudflare.config.ts` | `node --version` debe ser 22.18+ y no debes usar Bun |
| Claude Code bloquea un comando | Es el modo de permisos. Lee el comando y apruébalo tú si es lo que pediste; no lo fuerces a ciegas |
| El agente no encuentra un comando | Pídele `cf cli search "<tarea>"` o «revisa la documentación de cf» |
| Varias cuentas y pregunta cuál | Elige una; `cf` la recuerda por proyecto. Para cambiarla, `cf auth login --force` desde el proyecto |
