# Análisis del video y de la guía

Hecho el 11-nov-2026. Fuentes: transcripción automática completa del video, la guía en PDF de 26 páginas
y la documentación oficial de Cloudflare leída ese mismo día.

## Aviso: el enlace no era de este video

El enlace que llegó (`youtu.be/5REPWhjX64A`) abre **«Contraté a Claude como animador y esto pasó»**
(20:16, sin subtítulos disponibles), que trata de animaciones, no de Cloudflare.
El PDF corresponde a otro video del mismo canal:

- **«Cloudflare acaba de hacer a Claude Code 10 veces más poderoso»**
- Santiago Muñoz (@SantiMunozIA) · publicado el 9-oct-2026 · 23:43
- `https://www.youtube.com/watch?v=bSOi-Y38Guo`

Este análisis es del video de Cloudflare. El de animación no se analizó porque no tiene transcripción;
si interesa para los videos de MILLA o de Vox, hay que verlo aparte.

## Qué dice el video, en orden

| Minuto | Contenido |
|---|---|
| 0:00 | Tesis: Cloudflare es la infraestructura de sitios, plataformas y agentes; quien no la domine se queda atrás. |
| 0:53 | Qué es Cloudflare: una red de computadoras donde vive tu web sin servidor propio. |
| 1:37 | Las piezas: Workers (código y automatizaciones), páginas estáticas, D1 (base de datos), KV (casilleros), R2 (archivos), Workers AI, seguridad. |
| 2:51 | La novedad: el CLI `cf`, que cubre todas las funciones de Cloudflare. Un CLI deja que el agente opere la plataforma por ti. |
| 4:49 | Conexión: un prompt que instala `cf`, agrega una línea a `CLAUDE.md` y corre `cf auth login`. |
| 5:53 | Autenticación: se abre el navegador, inicias sesión y autorizas. Si Claude Code bloquea un comando, le dices que lo autorizas. |
| 8:36 | Proyecto 1: sitio de «Café Luna» publicado con un prompt. Basta decir «hazlo con Cloudflare». |
| 10:40 | El sitio ya está en internet. Dominios: los compra él en Cloudflare y le pide al agente configurarlos. |
| 11:47 | Proyecto 2: formulario con base de datos D1, sin nombrar D1. Después le pide al agente consultar la base. |
| 15:32 | Workers como automatizaciones (lo que haría n8n): al llenar el formulario, llega un correo. Usa Composio para Gmail. |
| 17:41 | Precios: el plan gratis da 100,000 solicitudes al día; el de pago cuesta 5 USD al mes. Dice tener unas 100 automatizaciones, 10 sitios y 3 plataformas por 5 USD. |
| 20:13 | El agente prueba lo que construye. Agrega R2 para subir una foto en el formulario; R2 pide registrar tarjeta. |
| 22:00 | Prueba final de punta a punta. Cierre y comunidad. |

La guía en PDF va más lejos que el video: trae el prompt de preparación, ocho proyectos con su prompt
(web, link en bio, formulario de pedidos, reservas sin choques, lista de espera, chatbot, acortador, link temporal),
un glosario, los límites del plan gratis y cuatro ideas más.

## La idea de fondo

El video no enseña Cloudflare; enseña un cambio de quién opera la infraestructura.
Antes hacía falta alguien que supiera el panel. Ahora el agente busca el comando, lo ensaya y lo corre,
y la persona aporta tres cosas: la idea, la aprobación de cada paso y el criterio de flujo
(«cuando pase esto, haz esto otro»). Lo dice en el minuto 16:42: aquí no hay cuadritos como en n8n,
el flujo lo tienes que traer pensado.

Eso encaja con cómo ya trabaja Emi: repos con reglas para la IA, skills y tareas programadas.
La pieza que faltaba era dónde publicar y dónde guardar datos sin administrar un servidor.

## Qué verifiqué y qué no

| Afirmación | Resultado |
|---|---|
| Existe el CLI `cf` y está en beta | **Cierto.** Paquete `cf` en npm, versión `1.0.0-beta.29` al 10-nov-2026. Anuncio oficial del 28-sep-2026. |
| Se instala con `npm install --global cf` y pide Node 22.18+ | **Cierto**, según la documentación. Bun no está soportado. |
| Tiene «más de 3,000 funciones» | **Aproximado.** La documentación dice «más de 2,900 comandos». |
| La línea para `CLAUDE.md` | **Cierta y textual** de la documentación. Ya está en `CLAUDE.md` de este repo. |
| Al instalar el CLI se instalan solos los skills | **No lo sustenta la documentación.** El plugin se instala aparte: `/plugin marketplace add cloudflare/skills` y `/plugin install cloudflare@cloudflare` (PDF, pág. 6). El propio autor duda al decirlo. |
| Workers gratis: 100,000 solicitudes al día; pago desde 5 USD al mes | **Coincide** con la tabla de la guía, verificada por su autor el 8-oct-2026. No la volví a contrastar renglón por renglón. |
| Workers AI gratis: 10,000 neuronas al día | **Cierto**, confirmado hoy en la página de precios. |
| R2 gratis: «creo que 5 GB» | **Impreciso en el video.** La guía dice 10 GB-mes, y que hay que activarlo en el panel. Pide método de pago. |
| En el plan gratis, pasar un límite da error en vez de cobrar | Lo afirma la guía. Es el comportamiento que conozco del plan gratis, pero **no lo probé**. |
| «Más del 80 % del internet está en Cloudflare» | **Sin sustento.** No encontré fuente; tómalo como exageración. |
| «Ni Vercel ni Supabase son más baratos» | Opinión del autor. No comparé precios. |
| Sus 100 automatizaciones por 5 USD | Testimonio; no se puede comprobar. |

## Lo que el video no cuenta y sí importa

1. **`cf` todavía no sube un secreto suelto.** La documentación lo dice: se suben con `cf deploy --secrets-file`
   o con Wrangler. Para un formulario con claves de Telegram o Turnstile, esto es un paso real.
2. **No se mezcla con Wrangler.** Correr `cf deploy` en un proyecto con `wrangler.jsonc` puede generar
   una configuración que ignore la existente. Primero `cf migrate`.
3. **Un borrado puede «salir bien» sin borrar.** Sin terminal interactiva y sin `--force`, imprime `Aborted.`
   y termina con código 0.
4. **Iniciar sesión es un paso humano.** `cf auth login` abre el navegador; en una máquina remota se usa
   `--no-browser`, que da un enlace y un código. Un agente sin persona necesita un token de API.
5. **El correo no es gratis ni inmediato.** El video lo resuelve con Composio y su Gmail; la guía lo dice claro:
   avisar por correo pide un dominio en Cloudflare y, para escribirle a cualquiera, plan de pago.
   Por eso aquí el aviso es por Telegram.
6. **«Te autorizo» no es un trámite.** El autor sugiere decirle al agente «te autorizo» cuando el clasificador
   bloquea algo. En esta sesión pasó justo eso al instalar `cf`, y no lo forcé: es una decisión de Emi, no mía.
7. **Privacidad.** El ejemplo guarda nombres y teléfonos sin hablar de aviso de privacidad, retención ni de quién
   ve la base. Para un despacho eso no es opcional.

## Qué conviene tomar y qué no

**Tomar:**
- El método: describir el resultado, exigir ensayo y explicación, aprobar cada paso.
- D1 para todo lo que hoy sería una hoja de cálculo detrás de un formulario.
- La regla de la guía: preguntar antes de gastar o borrar, y claves como secretos.
- Turnstile validado en el servidor antes de guardar.
- La llave única en la base de datos para que dos citas no se crucen. Es la única forma que resiste dos envíos simultáneos.

**No tomar tal cual:**
- «Hazlo rápido, pon los campos que quieras». Para un café sirve; para un despacho, no.
- Composio con la cuenta personal de Gmail para avisos de un formulario público.
- R2 para subir archivos desde un formulario público sin límites de tamaño, tipo y revisión.
- Guardar las conversaciones del asistente. Aquí no se guardan.

## Qué se hizo con esto

Se aplicó en el proyecto donde encaja mejor: MILLA ABOGADOS ya tenía el sitio hecho y un documento
(`BACKEND_SPEC.md`) que pedía exactamente los proyectos 3, 4, 6 y 7 de la guía y recomendaba Workers + D1.
El detalle está en [`viabilidad.md`](viabilidad.md) y el código en [`../milla-backend/`](../milla-backend/).
