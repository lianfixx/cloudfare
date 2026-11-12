# cloudfare

Entorno para que Claude Code, Codex y Muse trabajen con Cloudflare a través del CLI oficial `cf`.
Solo la conexión, las reglas y el registro; no incluye proyectos.

Basado en el video «Cloudflare acaba de hacer a Claude Code 10 veces más poderoso» (Santi Muñoz, 9-oct-2026)
y en la documentación oficial. Última auditoría: 12-nov-2026, con `cf` 1.0.0-beta.30.

## Pasos en tu Mac

En la **Terminal**:

```bash
node --version                                   # 1. debe ser 22.18 o más (si no: nodejs.org, versión LTS)
curl -fsSL https://claude.ai/install.sh | bash   # 2. Claude Code de terminal; luego cierra y abre la Terminal
cd ~ && git clone https://github.com/lianfixx/cloudfare.git && cd cloudfare   # 3. (si ya lo tienes: cd ~/cloudfare && git pull)
bash scripts/verificar-entorno.sh --instalar     # 4. instala cf y la regla para Claude
cf auth login                                    # 5. apruebas en el navegador
```

Dentro de **Claude Code** (escribe `claude`, y ya dentro):

```text
/plugin marketplace add cloudflare/skills
/plugin install cloudflare@cloudflare
```

Elige **user scope**, luego `/reload-plugins` (debe decir 1 plugin) y `/exit`.

De vuelta en la **Terminal**:

```bash
bash scripts/verificar-entorno.sh                # 6. todo con ✓ y «Listo»
```

Detalle y soluciones a errores: [`docs/configurar-entorno.md`](docs/configurar-entorno.md).

## Contenido

| Archivo | Para qué |
|---|---|
| [`docs/configurar-entorno.md`](docs/configurar-entorno.md) | Guía paso a paso y tabla «Si algo falla» |
| [`docs/referencia.md`](docs/referencia.md) | Comandos, plan gratis, glosario y lo que el video no dice |
| [`docs/prompt-preparacion.md`](docs/prompt-preparacion.md) | Prompt para que Claude o Codex hagan la configuración por ti |
| [`docs/prompt-muse.md`](docs/prompt-muse.md) | Encargo para que Muse replique el entorno con acceso completo y quede de apoyo |
| [`docs/bitacora.md`](docs/bitacora.md) | Todo lo que ha pasado y lo pendiente. Los agentes la llenan solos |
| [`scripts/verificar-entorno.sh`](scripts/verificar-entorno.sh) | Revisa todo; con `--instalar` instala lo que falte. Nunca toca tu cuenta |
| [`CLAUDE.md`](CLAUDE.md) | Reglas para cualquier agente (`AGENTS.md` apunta aquí) |

## Cómo se mantiene al día

- Cada agente que trabaje aquí anota en la bitácora lo que hizo y corrige la guía si algo cambió.
- Una tarea programada revisa cada domingo la versión de `cf` y la documentación oficial, y actualiza este repo.
- El repo es público: nunca lleva claves, correos ni datos de clientes.
