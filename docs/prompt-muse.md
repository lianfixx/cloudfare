# Encargo para Muse

Para pegar en Muse, el asistente operador de Emi (Meta). Su objetivo es tener una copia del mismo entorno en su computadora virtual
y poder ayudar a Emi si se atora.

```text
Hola, Muse. Necesito que repliques en tu computadora virtual el entorno de Cloudflare que acabo de
configurar en mi Mac, para que me ayudes si me atoro. Hazlo solo si tu entorno lo permite; si un paso
no se puede, sáltalo y dime cuál y por qué. No inventes resultados.

Contexto: uso Claude Code con el CLI oficial de Cloudflare, cf (está en beta). Todo está documentado
en el repo público https://github.com/lianfixx/cloudfare, rama claude/adoring-gauss-sd3kbr.

Pasos:
1. Revisa que tengas Node.js 22.18 o superior (node --version). Si no, instálalo.
2. Clona el repo:
   git clone -b claude/adoring-gauss-sd3kbr https://github.com/lianfixx/cloudfare.git
   cd cloudfare
   Lee README.md, CLAUDE.md, docs/configurar-entorno.md y docs/referencia.md.
3. Instala el CLI: npm install --global cf    y confirma con: cf --version
4. Corre: bash scripts/verificar-entorno.sh
   y mándame lo que imprime.
5. Sin iniciar sesión, prueba que el CLI funciona:
   cf cli search "list workers"
   cf cli search "create D1 database"
   cf docs search "deploy a static site"
   Mándame lo que salga.
6. Inicio de sesión: NO inicies sesión con mi cuenta de Cloudflare por tu cuenta. Si te lo pido
   después, usa cf auth login --no-browser, pásame el enlace y el código, y yo lo apruebo desde mi
   navegador. Nunca me pidas contraseñas ni tokens en el chat.
7. Claude Code y su plugin (solo si puedes): instala Claude Code con
   curl -fsSL https://claude.ai/install.sh | bash
   No inicies sesión en Claude con mi cuenta. Si no puedes usarlo sin sesión, sáltate este paso
   y dímelo.

Reglas (las mismas de CLAUDE.md del repo):
- Pregúntame antes de cualquier cosa que cueste dinero o que borre algo.
- Antes de un cambio en una cuenta, ensáyalo con --dry-run y enséñame el resultado.
- No subas cambios al repo.

Al terminar, repórtame en una lista: qué pasos funcionaron, cuáles no y con qué error exacto, la
versión de cf que quedó instalada y la salida del script de verificación.

Después, quédate como apoyo: cuando te mande una captura de un error de cf o de Claude Code,
reprodúcelo en tu entorno si puedes y dime el paso exacto para resolverlo.
```

## Por qué así

- **Muse no entra con tu cuenta de Cloudflare.** Si lo hiciera, su computadora virtual tendría acceso a todo lo tuyo. Para ayudarte con errores le basta tener `cf` instalado; si algún día hace falta, tú apruebas el inicio de sesión desde tu navegador.
- **El plugin de Claude Code puede no ser posible ahí**, porque pide iniciar sesión en Claude. No es necesario para que Muse te ayude.
