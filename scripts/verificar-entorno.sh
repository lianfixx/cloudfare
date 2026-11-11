#!/usr/bin/env bash
# Revisa que el entorno de Cloudflare esté listo para Claude Code o Codex.
#   bash scripts/verificar-entorno.sh             solo revisa
#   bash scripts/verificar-entorno.sh --instalar  además instala cf y agrega la regla a tus instrucciones
# Nunca inicia sesión por ti ni toca tu cuenta de Cloudflare.
set -u

INSTALAR=0
[ "${1:-}" = "--instalar" ] && INSTALAR=1

REGLA='When interacting with Cloudflare, use the `cf` CLI unless the project has a Wrangler configuration file.'
FALTAS=0
ok()    { printf '  \033[32m✓\033[0m %s\n' "$1"; }
falta() { printf '  \033[31m✗\033[0m %s\n' "$1"; FALTAS=$((FALTAS + 1)); }
nota()  { printf '  \033[33m·\033[0m %s\n' "$1"; }

echo "Entorno de Cloudflare"

# 1. Node.js 22.18 o superior
if command -v node >/dev/null 2>&1; then
  version=$(node -p 'process.versions.node')
  if node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a>22||(a===22&&b>=18)?0:1)'; then
    ok "Node.js $version"
  else
    falta "Node.js $version: se necesita 22.18 o superior (nodejs.org)"
  fi
else
  falta "Node.js no está instalado (nodejs.org, versión 22.18 o superior)"
fi

# 2. CLI de Cloudflare
CF=""
if command -v cf >/dev/null 2>&1 && cf --version 2>/dev/null | grep -qiE '[0-9]+\.[0-9]+'; then CF=cf
elif command -v cloudflare >/dev/null 2>&1; then CF=cloudflare
fi
if [ -z "$CF" ] && [ "$INSTALAR" = 1 ] && command -v npm >/dev/null 2>&1; then
  echo "  Instalando el CLI de Cloudflare (npm install --global cf)…"
  npm install --global cf >/dev/null 2>&1 && CF=cf
fi
if [ -n "$CF" ]; then
  ok "CLI de Cloudflare: $($CF --version 2>/dev/null | head -1)"
else
  falta "CLI de Cloudflare no instalado: npm install --global cf"
fi

# 3. Sesión iniciada
if [ -n "$CF" ]; then
  if [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
    nota "Se usará CLOUDFLARE_API_TOKEN (tiene prioridad sobre la sesión)"
  fi
  if $CF auth whoami >/dev/null 2>&1; then
    ok "Sesión de Cloudflare activa ($CF auth whoami)"
  else
    falta "Sin sesión: corre '$CF auth login' y aprueba en el navegador"
  fi
fi

# 4. Regla en las instrucciones de usuario del agente
revisar_regla() {
  archivo="$1"; nombre="$2"
  if [ -f "$archivo" ] && grep -qF 'use the `cf` CLI' "$archivo"; then
    ok "Regla de Cloudflare en $nombre"
  elif [ "$INSTALAR" = 1 ]; then
    mkdir -p "$(dirname "$archivo")"
    printf '\n%s\n' "$REGLA" >> "$archivo"
    ok "Regla de Cloudflare agregada a $nombre"
  else
    falta "Falta la regla de Cloudflare en $nombre (usa --instalar)"
  fi
}
[ -d "$HOME/.claude" ] || command -v claude >/dev/null 2>&1 && revisar_regla "$HOME/.claude/CLAUDE.md" "~/.claude/CLAUDE.md"
[ -d "$HOME/.codex" ]  || command -v codex  >/dev/null 2>&1 && revisar_regla "$HOME/.codex/AGENTS.md" "~/.codex/AGENTS.md"
if [ ! -d "$HOME/.claude" ] && [ ! -d "$HOME/.codex" ] && ! command -v claude >/dev/null 2>&1 && ! command -v codex >/dev/null 2>&1; then
  falta "No encontré Claude Code ni Codex en esta computadora"
fi

# 5. Plugin de Claude Code (no se puede revisar desde aquí con certeza)
nota "Plugin de Claude Code: dentro de Claude Code corre /plugin marketplace add cloudflare/skills y /plugin install cloudflare@cloudflare"

echo
if [ "$FALTAS" = 0 ]; then
  echo "Listo. El agente ya puede trabajar con Cloudflare."
else
  echo "Faltan $FALTAS paso(s). Detalle en docs/configurar-entorno.md"
fi
exit "$FALTAS"
