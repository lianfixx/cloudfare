# Bitácora del entorno de Cloudflare

Registro de todo lo que pasa en este entorno: quién hizo qué, qué falló, qué se decidió y qué se aprendió.
Lo llenan los agentes (Claude, Muse, Codex) **solos, sin que Emi tenga que pedirlo**. Solo se agrega al final.
Nunca se escriben claves, tokens, contraseñas ni datos de clientes.

Formato: `fecha | quién | qué pasó | resultado | aprendizaje o pendiente`

## Historial

- 2026-11-11 | Claude (nube) | Análisis del video de Santi Muñoz sobre `cf` y de su guía en PDF | hecho | El enlace enviado era de otro video («Contraté a Claude como animador»); el correcto es bSOi-Y38Guo.
- 2026-11-11 | Claude (nube) | Se construyó un backend de MILLA (buzón, citas, asistente) | descartado por Emi | Emi solo quiere el entorno de Cloudflare, no los proyectos del video. El código queda en el historial (commit 832c1ce).
- 2026-11-11 | Claude (nube) | Repo reducido al entorno: guía, reglas, referencia y `scripts/verificar-entorno.sh` | hecho | En la nube, la instalación de `cf` la bloqueó el clasificador de permisos; no se forzó.
- 2026-11-11 | Emi (Mac) | Escribió `/plugin …` en zsh | error | Los comandos con `/` solo funcionan dentro de Claude Code.
- 2026-11-11 | Emi (Mac) | `claude` → command not found | resuelto | Faltaba instalar Claude Code de terminal: `curl -fsSL https://claude.ai/install.sh \| bash`.
- 2026-11-11 | Emi (Mac) | Instaló el plugin `cloudflare` | hecho | Se eligió «user scope»; la pantalla traía preseleccionado «local scope».
- 2026-11-11 | Claude (Mac) | Mejoró `verificar-entorno.sh` para revisar el plugin | hecho | Commit 12b2c9e.
- 2026-11-11 | Emi | Decisión: Muse (no Manus) replica el entorno con acceso completo a Cloudflare | decidido | Mismas reglas que Claude: pregunta antes de gastar, borrar, cambiar DNS o publicar.
- 2026-11-11 | Emi | Decisión: todo se registra y se actualiza solo, sin que Emi haga nada | vigente | Regla en CLAUDE.md, encargo de Muse y tarea semanal de actualización.
- 2026-11-11 | Claude (nube) | Tarea programada semanal «Actualizar entorno Cloudflare» (domingos 11:58, Ciudad de México) | creada | Revisa versión de cf, documentación oficial y esta bitácora; corrige los docs y anota aquí. Avisa al celular.
- 2026-11-11 | Claude (nube) | Observación al selector: este trabajo con Fable fue sobrado (Opus medium bastaba) | registrada | selector-modelos/perfil/observaciones.md

## Pendientes

- Confirmar en la Mac que `scripts/verificar-entorno.sh` termina en «Listo».
- Recibir el reporte de Muse y registrarlo aquí.
- Confirmar que la primera corrida semanal (15-nov-2026) pudo hacer push a esta rama.
