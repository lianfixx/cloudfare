# Reglas para cualquier agente que use Cloudflare

Valen para Claude Code, Codex y cualquier otro agente. `AGENTS.md` apunta aquí.

When interacting with Cloudflare, use the `cf` CLI unless the project has a Wrangler configuration file.

## Cómo usar `cf`

- `cf` está en beta. No confíes en la memoria: busca el comando con `cf cli search "<tarea>"` y revísalo con `--help` antes de usarlo.
- Para documentación, `cf docs search "<pregunta>"`. No incluyas en la búsqueda dominios, correos, IDs de cuenta ni tokens.
- Antes de cualquier cambio en la cuenta, córrelo con `--dry-run` y muestra el resultado.
- No corras `cf dev`, `cf build`, `cf deploy` ni `cf init .` en un proyecto con `wrangler.jsonc`, `wrangler.json` o `wrangler.toml`. Primero `cf migrate --dry-run`.
- `cf` todavía no sube un secreto suelto: se suben con `cf deploy --secrets-file <archivo>` o con `npx wrangler secret put`.

## Seguridad

- Pregunta a Emi antes de hacer cualquier cosa que cueste dinero o que borre algo: plan de pago, activar R2 (pide tarjeta), comprar dominios, cambiar DNS, y todo comando con `delete` o `--force`.
- En una sesión sin terminal interactiva, un borrado sin `--force` imprime `Aborted.` y termina con código 0. Que el comando «salga bien» no significa que se borró.
- `--force` en algunos comandos también es un parámetro de la API (por ejemplo, borra un Worker aunque otros dependan de él). Revísalo antes de aprobarlo.
- `cf auth login` lo aprueba Emi en el navegador. Nunca pidas ni pegues claves en el chat.
- Ninguna clave va en el código ni en un commit. `.env`, `.dev.vars` y archivos de secretos van en `.gitignore`.
- Publicar es una acción hacia afuera: confirma con Emi antes de la primera publicación de cada proyecto.
