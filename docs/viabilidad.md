# Dónde aplicarlo en los proyectos de Emi

Criterio: se aplica si el proyecto necesita publicar algo, recibir datos del público o correr una
automatización, y si hoy no lo tiene resuelto. Revisado el 11-nov-2026.

| Proyecto | ¿Viable? | Qué se hizo o qué procede |
|---|---|---|
| **MILLA ABOGADOS** (`millabogados`) | **Sí, y es el mejor caso** | El sitio estaba completo pero el formulario no guardaba nada y la agenda era un marcador. Se construyó el backend completo en [`milla-backend/`](../milla-backend/). Falta publicarlo y conectar el formulario. |
| **Acción Tlalnepantla** (`ACCION-TLALNEPANTLA-`) | **Ya lo usa** | El sitio ya corre con Worker, D1 y R2 (vía Sites), con Turnstile previsto. No hay nada que migrar. Lo único aprovechable sería un enlace corto con estadísticas para campañas; se puede reutilizar el módulo de este repo. No se tocó. |
| **Selector de modelos** (`selector-modelos`) | **No aplica como infraestructura** | Es documentación y reglas, no un servicio. Propuesta para que Emi la apruebe (sus reglas piden aprobación): agregar al mapa una fila «Cloudflare: publicar o cambiar algo acotado → Sonnet · medium; backend nuevo → Opus · medium». No se cambió nada. |
| **Mes de Sistemas Digitales** (`mes.`) | **Por evaluar** | Es una app; solo vi la lista de archivos. Si tiene versión web, se publica como estático gratis. No se revisó a fondo. |
| **Videos MILLA y Vox** | **Uso puntual** | Proyecto 8 de la guía: un Quick Tunnel para enseñar una vista previa de Remotion desde la Mac sin publicarla. No requiere cuenta. Prompt en [`prompts.md`](prompts.md). |
| **INDEP, DOF, matriz Castorena, maestría** | **No conviene** | Son flujos de Claude con skills, Drive y tareas programadas. Pasarlos a Workers no mejora nada y movería datos de expedientes a otra plataforma. |
| **Escritos, asesorías, estilo** | **No aplica** | Son repos de contenido y reglas. |

## Los ocho proyectos de la guía, uno por uno

| # | Proyecto de la guía | En MILLA | Dónde |
|---|---|---|---|
| 1 | Página web publicada | El sitio ya existe. Pasarlo a Cloudflare es opcional y es decisión de Emi (implica DNS). | Pendiente de decisión |
| 2 | Link en bio | No hay necesidad hoy. | — |
| 3 | Formulario que guarda y avisa | **Hecho**: Buzón Jurídico con folio, D1, Turnstile, límite por visitante y aviso por Telegram. | `src/rutas/consultas.js` |
| 4 | Reservas sin choques | **Hecho**: propuestas de cita por abogado; «ambos» ocupa a los dos; llave única en la base. | `src/rutas/agenda.js` |
| 5 | Lista de espera | No hay lanzamiento que la pida. La descarga en CSV y el Turnstile de ese proyecto sí se usaron. | `src/rutas/admin.js` |
| 6 | Chatbot de preguntas frecuentes | **Hecho**: Workers AI, solo con los datos del despacho; si no sabe o no hay cuota, deriva a WhatsApp. | `src/rutas/ia.js` |
| 7 | Links cortos con estadísticas | **Hecho**: se crean en el panel; clics por día. Con D1 nada más, sin KV, para no crear otro recurso. | `src/rutas/enlaces.js` |
| 8 | Link temporal | No es código; es un comando. | `prompts.md` |
| + | Resumen cada mañana (idea extra) | **Hecho**: tarea programada a las 8:00 de Ciudad de México. | `src/rutas/resumen.js` |
| + | Proteger formularios (idea extra) | **Hecho**: Turnstile validado en el servidor antes de guardar. | `src/lib/seguridad.js` |
| + | Regalar un PDF, encuesta | No se pidió. | — |

## Lo que se dejó fuera a propósito

- **Firmas electrónicas** (sección 5 del `BACKEND_SPEC`): tiene implicaciones legales y de proveedor que no se resuelven con un Worker.
- **Correo de confirmación al cliente y recordatorios**: requieren dominio de correo y, para escribir a cualquiera, plan de pago. Además, enviar correos automáticos a clientes es una decisión de Emi.
- **Enlaces de videollamada**: requieren conectar Google o Zoom.
- **Subida de archivos con R2**: R2 pide tarjeta, y recibir documentos de clientes por un formulario público necesita reglas que Emi debe definir.
- **Editor de contenido y varios usuarios en el panel**: el panel tiene una sola contraseña. Suficiente para empezar; no para un equipo.
