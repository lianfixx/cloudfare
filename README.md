# cloudfare

Entorno para que Claude Code o Codex trabajen con Cloudflare a través del CLI oficial `cf`.
Solo la conexión y las reglas; no incluye proyectos.

Basado en el video «Cloudflare acaba de hacer a Claude Code 10 veces más poderoso» (Santi Muñoz, 9-oct-2026),
su guía en PDF y la documentación oficial de `cf`, leída el 11-nov-2026.

## Contenido

| Archivo | Para qué |
|---|---|
| [`docs/configurar-entorno.md`](docs/configurar-entorno.md) | Guía paso a paso: instalar, iniciar sesión, conectar el agente y verificar |
| [`docs/prompt-preparacion.md`](docs/prompt-preparacion.md) | El prompt para que el agente haga la configuración por ti |
| [`docs/prompt-muse.md`](docs/prompt-muse.md) | Encargo para que Muse replique el entorno y ayude si hay atorones |
| [`docs/referencia.md`](docs/referencia.md) | Comandos, plan gratis, glosario y lo que el video no dice |
| [`scripts/verificar-entorno.sh`](scripts/verificar-entorno.sh) | Revisa que todo esté listo; con `--instalar`, instala lo que falte |
| [`docs/bitacora.md`](docs/bitacora.md) | Todo lo que ha pasado: acciones, errores, decisiones y pendientes. Se llena sola |
| [`CLAUDE.md`](CLAUDE.md) | Reglas para cualquier agente que use Cloudflare |

## Inicio rápido (en tu Mac)

```bash
bash scripts/verificar-entorno.sh             # solo revisa, no cambia nada
bash scripts/verificar-entorno.sh --instalar  # instala cf y agrega la regla a tu CLAUDE.md
cf auth login                                 # este paso lo haces tú en el navegador
```

`cf` está en beta: sus comandos pueden cambiar. Ante la duda, `cf cli search "<tarea>"`.
