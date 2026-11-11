# Referencia

## Comandos que verás pasar

| Comando | Qué hace |
|---|---|
| `cf auth login` / `cf auth whoami` | Iniciar sesión / ver con qué cuenta estás |
| `cf cli search "<tarea>"` | Busca el comando correcto entre más de 2,900. Local, sin credenciales |
| `cf docs search "<pregunta>"` | Busca en la documentación de Cloudflare |
| `cf schema <producto> <acción>` | Muestra qué pide un comando de la API |
| `<comando> --dry-run` | Ensaya sin enviar nada a tu cuenta |
| `cf init <carpeta>` | Crea un proyecto nuevo |
| `cf dev` | Lo prueba en tu computadora |
| `cf deploy` | Lo publica |
| `cf migrate --dry-run` | Previsualiza la conversión de un proyecto Wrangler |
| `cloudflared tunnel --url http://localhost:3000` | Enlace temporal `trycloudflare.com` a algo de tu compu; sin cuenta, solo pruebas |

Los resultados salen en JSON por la salida estándar; los mensajes y errores, por la de error.

## Plan gratis

Según la guía, verificado por su autor el 8-oct-2026. Workers AI lo confirmé el 11-nov-2026.

| Servicio | Gratis |
|---|---|
| Workers | 100,000 peticiones al día · 10 ms de CPU por petición |
| Páginas estáticas | Ilimitadas |
| D1 (base de datos) | 5 GB · 5 millones de filas leídas y 100,000 escritas al día |
| KV | 100,000 lecturas y 1,000 escrituras al día · 1 GB |
| R2 (archivos) | 10 GB-mes. Hay que activarlo en el panel y pide método de pago |
| Workers AI | 10,000 neuronas al día |
| Turnstile | Hasta 20 widgets |
| Cron | Hasta 5 por cuenta, en hora UTC |
| Plan de pago | Workers Paid desde 5 USD al mes |

Al pasar un límite del plan gratis, las operaciones dan error hasta las 00:00 UTC en vez de cobrar.

## Glosario

- **CLI:** darle órdenes a la computadora escribiendo. `cf` es el de Cloudflare.
- **Deploy:** publicar para que cualquiera lo abra con un enlace.
- **Worker:** código que corre en la red de Cloudflare cuando alguien lo usa.
- **D1:** base de datos en tablas. **KV:** casilleros llave → valor. **R2:** bodega de archivos.
- **Workers AI:** modelos de IA de Cloudflare; se miden en neuronas.
- **Turnstile:** el «no soy un robot» de Cloudflare.
- **Secreto:** una clave guardada aparte, nunca en el código.
- **Wrangler:** el CLI anterior para Workers. Convive con `cf`, pero no se mezclan en un mismo proyecto.

## Lo que el video no dice

1. `cf` todavía no sube un secreto suelto; se usa `cf deploy --secrets-file` o Wrangler.
2. No se debe correr `cf deploy` en un proyecto con configuración de Wrangler sin migrarlo antes.
3. Un borrado sin `--force` en una sesión no interactiva imprime `Aborted.` y sale con código 0.
4. Los skills de Cloudflare no vienen con el CLI: se instalan con el plugin.
5. Un agente sin persona no puede iniciar sesión: necesita un token de API.
6. «Más del 80 % del internet está en Cloudflare» no tiene fuente; la documentación habla de «más de 2,900 comandos», no de 3,000 funciones.

## Enlaces oficiales

- Documentación de `cf`: developers.cloudflare.com/cf/
- Instalar e iniciar sesión: developers.cloudflare.com/cf/get-started/
- `cf` con agentes: developers.cloudflare.com/cf/agents/
- Claude Code con Cloudflare: developers.cloudflare.com/agent-setup/claude-code/
- Codex con Cloudflare: developers.cloudflare.com/agent-setup/codex/
- Skills: github.com/cloudflare/skills
- Precios de Workers: developers.cloudflare.com/workers/platform/pricing/
