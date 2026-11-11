# cloudfare

Infraestructura en Cloudflare para los proyectos de Emi, hecha a partir del video
«Cloudflare acaba de hacer a Claude Code 10 veces más poderoso» de Santi Muñoz (9-oct-2026)
y de su guía en PDF con ocho proyectos.

## Qué hay aquí

| Carpeta | Qué es | Estado |
|---|---|---|
| [`milla-backend/`](milla-backend/) | Backend de MILLA ABOGADOS: Buzón Jurídico, agenda sin choques, asistente, panel privado, enlaces cortos y resumen diario | Código completo con 24 pruebas que pasan. **Sin publicar**: falta que Emi inicie sesión en Cloudflare |
| [`docs/analisis-video.md`](docs/analisis-video.md) | Análisis razonado del video y del PDF, con lo que se verificó y lo que no | Completo |
| [`docs/viabilidad.md`](docs/viabilidad.md) | En qué proyectos de Emi conviene aplicarlo y en cuáles no | Completo |
| [`docs/puesta-en-marcha.md`](docs/puesta-en-marcha.md) | Los pasos que solo Emi puede hacer para publicar | Pendiente de Emi |
| [`docs/conectar-sitio-milla.md`](docs/conectar-sitio-milla.md) | Cómo conectar el formulario de millabogados.com al backend | Propuesta; no se tocó el repo del sitio |
| [`docs/prompts.md`](docs/prompts.md) | Los prompts de la guía, adaptados a los proyectos de Emi | Completo |

## Probar el backend

```bash
cd milla-backend
npm test        # 24 pruebas, sin instalar nada; usa Node 22.18 o superior
```

Las pruebas corren con Node y una base SQLite en memoria que imita a D1.
Todavía no se ha corrido dentro del runtime de Cloudflare (`cf dev`); ese es el primer paso de la puesta en marcha.

## Reglas

Lee [`CLAUDE.md`](CLAUDE.md) antes de tocar algo. Lo esencial: usar `cf`, ensayar con `--dry-run`,
preguntar antes de gastar o borrar, y ninguna clave en el código.
