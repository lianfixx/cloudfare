# Reglas para cualquier IA que trabaje en este repositorio

Valen para Claude Code, Codex y cualquier otro agente. `AGENTS.md` apunta aquí.

## Cloudflare

When interacting with Cloudflare, use the `cf` CLI unless the project has a Wrangler configuration file.

- `cf` está en beta. Antes de usar un comando, búscalo con `cf cli search "<tarea>"` y revísalo con `--help`. No confíes en la memoria: los comandos cambian.
- Antes de cualquier cambio en la cuenta, corre el comando con `--dry-run` y muestra el resultado.
- No corras `cf dev`, `cf build` ni `cf deploy` en un proyecto que tenga `wrangler.jsonc` o `wrangler.toml`; primero `cf migrate --dry-run`.
- `cf` todavía no puede subir un secreto suelto. Los secretos se suben con `cf deploy --secrets-file secretos.json`.

## Seguridad

- Pregunta a Emi antes de hacer cualquier cosa que cueste dinero o que borre algo. Esto incluye pasar al plan de pago, activar R2 (pide tarjeta), comprar dominios y todo comando con `delete` o `--force`.
- En una sesión sin terminal interactiva, un borrado sin `--force` imprime `Aborted.` y termina con código 0: que el comando «salga bien» no significa que se borró.
- Ninguna clave va en el código, en el chat ni en un commit. `secretos.json`, `.dev.vars` y `.env` están en `.gitignore`.
- El repositorio es público. No subas datos de clientes, consultas reales ni exportaciones del panel.
- Publicar (deploy) es una acción hacia afuera: confirma con Emi antes de la primera publicación y antes de cambiar DNS.

## Datos del despacho

- `milla-backend/src/config.js` es la única fuente de datos de MILLA ABOGADOS para el backend. Lo marcado `POR CONFIRMAR` no está validado por Emi.
- El asistente solo puede afirmar lo que está en `CONOCIMIENTO_IA`. No agregues horarios, costos ni domicilios que Emi no haya dado.
- A los clientes no se les envía nada de forma automática. Los avisos son internos.

## Antes de entregar

- `cd milla-backend && npm test` debe pasar completo.
- Si cambias el esquema, agrega una migración nueva en `milla-backend/migrations/`; no edites una ya aplicada.
