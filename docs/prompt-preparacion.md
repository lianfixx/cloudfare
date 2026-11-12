# Prompt de preparación

Para que Claude Code o Codex hagan la configuración por ti en tu Mac.
Antes necesitas tener Claude Code de terminal (o Codex) instalado: es el que va a recibir este prompt.
Ábrelo dentro de la carpeta del repo (`cd ~/cloudfare` y luego `claude`) y pega:

```text
Quiero dejar listo Cloudflare en esta computadora. Explícame cada paso en palabras simples.
1. Revisa que tenga Node.js 22.18 o superior. Si no, dime cómo instalarlo.
2. Corre: bash scripts/verificar-entorno.sh --instalar
   Instala el CLI de Cloudflare y agrega la regla de Cloudflare a mis instrucciones de usuario.
3. Corre cf auth login y avísame para que yo apruebe en el navegador. Después corre cf auth whoami
   y confirma que diga "authenticated": true (si dice false, no hay sesión aunque no marque error).
4. Dime exactamente qué escribir para instalar el plugin oficial de Cloudflare
   (en Claude Code: /plugin marketplace add cloudflare/skills y /plugin install cloudflare@cloudflare
   con alcance user; en Codex: /plugins y buscar Cloudflare). Esos comandos los escribo yo.
5. Corre bash scripts/verificar-entorno.sh y enséñame el resultado.
6. Prueba de solo lectura: lista mis Workers con cf.
7. Anota lo que pasó en docs/bitacora.md, como dice CLAUDE.md, y súbelo.
Reglas: pregúntame antes de cualquier cosa que cueste dinero, que borre algo o que publique algo.
Nunca me pidas claves, contraseñas ni códigos en el chat.
```
