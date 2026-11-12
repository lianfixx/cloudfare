# Referencia

Verificado el 12-nov-2026 contra la documentación oficial y contra `cf` 1.0.0-beta.30.
`cf` está en beta: si algo de aquí no coincide, manda lo que diga `cf cli search` o `--help`.

## Comandos que verás pasar

| Comando | Qué hace |
|---|---|
| `cf auth login` | Iniciar sesión (abre el navegador). `--no-browser` para aprobar desde otro dispositivo |
| `cf auth whoami` | Ver si hay sesión. Lee `"authenticated"`: el comando no marca error aunque no haya sesión |
| `cf auth scopes` | Ver qué permisos tiene la sesión |
| `cf auth logout` | Cerrar sesión y borrar las credenciales guardadas |
| `cf auth create` / `activate` / `list` | Perfiles para varias cuentas |
| `cf cli search "<tarea>"` | Busca el comando correcto entre más de 2,900. Local, sin credenciales; devuelve 5 opciones en JSON |
| `cf docs search "<pregunta>"` | Busca en la documentación de Cloudflare |
| `cf schema <producto> <acción>` | Muestra qué datos pide un comando de la API |
| `<comando> --dry-run` | Ensaya sin enviar nada a tu cuenta |
| `cf init <carpeta>` | Crea un proyecto nuevo |
| `cf dev` | Lo prueba en tu computadora |
| `cf deploy` | Lo publica. `--secrets-file <archivo>` sube secretos con la publicación |
| `cf workers secrets update` | Agrega o cambia un secreto de un Worker ya publicado |
| `cf migrate --dry-run` | Previsualiza la conversión de un proyecto Wrangler |
| `cloudflared tunnel --url http://localhost:3000` | Enlace temporal `trycloudflare.com` a algo de tu computadora. Sin cuenta, solo para pruebas; requiere instalar `cloudflared` |

Los resultados salen en JSON por la salida estándar; los mensajes y errores, por la de error.

## Plan gratis

| Servicio | Gratis | Fuente |
|---|---|---|
| Workers | 100,000 peticiones al día · 10 ms de CPU por petición | Docs, 12-nov-2026 |
| Cron (tareas programadas) | 5 por cuenta, en hora UTC | Docs, 12-nov-2026 |
| D1 (base de datos) | 5 GB en total · 5 millones de filas leídas y 100,000 escritas al día | Docs, 12-nov-2026 |
| KV | 100,000 lecturas y 1,000 escrituras al día · 1 GB | Docs, 12-nov-2026 |
| R2 (archivos) | 10 GB-mes · 1 millón de operaciones de escritura al mes. Se activa en el panel; según la guía del video puede pedir método de pago | Docs, 12-nov-2026 |
| Workers AI | 10,000 neuronas al día | Docs, 12-nov-2026 |
| Turnstile | Hasta 20 widgets | Docs, 12-nov-2026 |
| Páginas estáticas | Ilimitadas | Guía del video (8-oct-2026) |
| Plan de pago | Workers Paid: 5 USD al mes por cuenta | Docs, 12-nov-2026 |

Los límites diarios se reinician a las 00:00 UTC (18:00 de Ciudad de México). En el plan gratis, al pasar un límite la operación da error; no se cobra.

## Glosario

- **CLI:** darle órdenes a la computadora escribiendo. `cf` es el de Cloudflare.
- **Deploy:** publicar para que cualquiera lo abra con un enlace.
- **Worker:** código que corre en la red de Cloudflare cuando alguien lo usa.
- **D1:** base de datos en tablas. **KV:** casilleros llave → valor. **R2:** bodega de archivos.
- **Workers AI:** modelos de IA de Cloudflare; se miden en neuronas.
- **Turnstile:** el «no soy un robot» de Cloudflare.
- **Secreto:** una clave guardada aparte, nunca en el código.
- **MCP:** la conexión que deja al agente usar un servicio (aquí, tu cuenta de Cloudflare) directamente.
- **Plugin:** paquete para Claude Code o Codex con guías (skills) y conexiones MCP.
- **Wrangler:** el CLI anterior para Workers. Convive con `cf`, pero no se mezclan en un mismo proyecto.

## Lo que el video no dice o dice mal

1. Los skills de Cloudflare no vienen con el CLI: se instalan con el plugin.
2. Hace falta Claude Code **de terminal**; la app de escritorio no instala el comando `claude`.
3. `cf auth whoami` no marca error cuando no hay sesión; hay que leer su respuesta.
4. Sin sesión, `cf` sugiere publicar con una cuenta temporal de 60 minutos. Sigue siendo publicar: se pregunta antes.
5. No se debe correr `cf deploy` en un proyecto con configuración de Wrangler sin migrarlo antes.
6. Un borrado sin `--force` en una sesión no interactiva imprime `Aborted.` y sale con código 0.
7. Un agente sin persona no puede iniciar sesión: necesita un token de API.
8. «Más del 80 % del internet está en Cloudflare» no tiene fuente. La documentación habla de «más de 2,900 comandos», no de 3,000 funciones. R2 da 10 GB, no 5.

## Enlaces oficiales

- Documentación de `cf`: developers.cloudflare.com/cf/
- Instalar e iniciar sesión: developers.cloudflare.com/cf/get-started/
- `cf` con agentes: developers.cloudflare.com/cf/agents/
- Claude Code con Cloudflare: developers.cloudflare.com/agent-setup/claude-code/
- Codex con Cloudflare: developers.cloudflare.com/agent-setup/codex/
- Skills: github.com/cloudflare/skills
- Precios de Workers: developers.cloudflare.com/workers/platform/pricing/
- Límites de Workers: developers.cloudflare.com/workers/platform/limits/
