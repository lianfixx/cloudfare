# Prompt de preparación

Pégalo en Claude Code o Codex, en tu Mac. Tomado de la guía del video, con los pasos que faltaban.

```text
Quiero usar Cloudflare desde aquí. Explícame cada paso en palabras simples.
1. Revisa si tengo Node.js 22.18 o superior. Si no, dime cómo instalarlo.
2. Instala el CLI de Cloudflare con: npm install --global cf
   Confirma con cf --version.
3. Agrega esta línea a mi archivo de instrucciones de usuario (~/.claude/CLAUDE.md en Claude Code,
   ~/.codex/AGENTS.md en Codex), solo si no está ya:
   "When interacting with Cloudflare, use the cf CLI unless the project has a Wrangler configuration file."
4. Corre cf auth login y avísame para que yo apruebe el acceso en el navegador.
   Después confirma con cf auth whoami.
5. Si estás en Claude Code, dime cómo instalar el plugin oficial de Cloudflare
   (/plugin marketplace add cloudflare/skills y /plugin install cloudflare@cloudflare).
6. Haz una prueba de solo lectura: lista mis Workers con cf.
Regla para todo lo que hagamos: pregúntame antes de hacer cualquier cosa que cueste dinero o que
borre algo. Nunca me pidas claves en el chat.
```
