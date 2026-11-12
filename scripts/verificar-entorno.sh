#!/usr/bin/env bash
# Revisa que el entorno de Cloudflare esté listo para Claude Code o Codex.
#   bash scripts/verificar-entorno.sh             solo revisa, no cambia nada
#   bash scripts/verificar-entorno.sh --instalar  además instala el CLI y agrega la regla a tus instrucciones
#   bash scripts/verificar-entorno.sh --ayuda     muestra esta ayuda
# Nunca inicia sesión por ti ni toca tu cuenta de Cloudflare.
# Termina con código 0 si todo está listo; si no, con el número de pasos que faltan.
set -u

INSTALAR=0
case "${1:-}" in
  "") ;;
  --instalar) INSTALAR=1 ;;
  -h|--help|--ayuda) sed -n '2,7p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
  *) echo "Opción desconocida: $1 (usa --instalar o --ayuda)"; exit 64 ;;
esac

REGLA='When interacting with Cloudflare, use the `cf` CLI unless the project has a Wrangler configuration file.'
FALTAS=0
if [ -t 1 ]; then V=$'\033[32m'; R=$'\033[31m'; A=$'\033[33m'; N=$'\033[0m'; else V=""; R=""; A=""; N=""; fi
ok()    { printf '  %s✓%s %s\n' "$V" "$N" "$1"; }
falta() { printf '  %s✗%s %s\n' "$R" "$N" "$1"; FALTAS=$((FALTAS + 1)); }
nota()  { printf '  %s·%s %s\n' "$A" "$N" "$1"; }
existe() { command -v "$1" >/dev/null 2>&1; }

echo "Entorno de Cloudflare"

# 1. Node.js 22.18 o superior (lo pide cf)
NODE_OK=0
if existe node; then
  version=$(node -p 'process.versions.node' 2>/dev/null)
  if node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a>22||(a===22&&b>=18)?0:1)' 2>/dev/null; then
    ok "Node.js $version"; NODE_OK=1
  else
    falta "Node.js $version: se necesita 22.18 o superior. Instala la versión LTS de nodejs.org"
  fi
else
  falta "Node.js no está instalado. Instala la versión LTS de nodejs.org (22.18 o superior)"
fi

# 2. CLI de Cloudflare. El paquete instala dos comandos iguales: cloudflare y cf.
#    Se prefiere «cloudflare» porque «cf» también es el nombre de otras herramientas (Cloud Foundry).
CF=""
es_cloud_foundry() { "$1" --version </dev/null 2>&1 | grep -qiE 'cloud ?foundry|^cf version'; }
if existe cloudflare; then CF=cloudflare
elif existe cf && ! es_cloud_foundry cf; then CF=cf
fi
if existe cf && es_cloud_foundry cf; then
  nota "El comando «cf» de esta computadora no es el de Cloudflare (¿Cloud Foundry?). Usa «cloudflare» en su lugar"
fi
if [ -z "$CF" ] && [ "$INSTALAR" = 1 ]; then
  if [ "$NODE_OK" = 1 ] && existe npm; then
    echo "  Instalando el CLI de Cloudflare (npm install --global cf)…"
    if salida=$(npm install --global cf 2>&1); then
      hash -r 2>/dev/null
      if existe cloudflare; then CF=cloudflare; elif existe cf; then CF=cf; fi
    else
      printf '%s\n' "$salida" | tail -5 | sed 's/^/    /'
      if printf '%s' "$salida" | grep -q EACCES; then
        nota "npm no tiene permiso en su carpeta global. No uses sudo: instala Node desde nodejs.org o con nvm y repite"
      fi
    fi
  else
    nota "No instalo el CLI hasta que Node.js 22.18+ esté listo"
  fi
fi
if [ -n "$CF" ]; then
  instalada=$($CF --version </dev/null 2>/dev/null | head -1)
  ok "CLI de Cloudflare ($CF) ${instalada}"
  if existe npm; then
    ultima=$(npm view cf version --fetch-timeout=5000 --fetch-retries=0 2>/dev/null | tail -1)
    if [ -n "$ultima" ] && [ -n "$instalada" ] && ! printf '%s' "$instalada" | grep -qF "$ultima"; then
      nota "Hay una versión más nueva de cf ($ultima): npm install --global cf@latest"
    fi
  fi
else
  falta "CLI de Cloudflare no instalado: npm install --global cf"
fi

# 3. Sesión iniciada (</dev/null para que nunca se quede esperando una respuesta)
if [ -n "$CF" ]; then
  [ -n "${CLOUDFLARE_API_TOKEN:-}" ] && nota "Se usará CLOUDFLARE_API_TOKEN: tiene prioridad sobre la sesión"
  # Ojo: «cf auth whoami» termina con código 0 aunque no haya sesión (responde "authenticated": false).
  # Por eso se lee la respuesta en vez de confiar en el código de salida.
  sesion=$($CF auth whoami </dev/null 2>/dev/null)
  if printf '%s' "$sesion" | grep -qE '"authenticated"[[:space:]]*:[[:space:]]*true'; then
    ok "Sesión de Cloudflare activa ($CF auth whoami para ver la cuenta)"
  elif [ -n "$sesion" ] && ! printf '%s' "$sesion" | grep -q '"authenticated"'; then
    nota "No pude leer la respuesta de «$CF auth whoami». Revísala tú: debe decir \"authenticated\": true"
  else
    falta "Sin sesión de Cloudflare: corre «$CF auth login» y aprueba en el navegador"
  fi
fi

# 4. Agentes: Claude Code de terminal y/o Codex
CLAUDE_CLI=0; CODEX_CLI=0
existe claude && CLAUDE_CLI=1
existe codex && CODEX_CLI=1
if [ "$CLAUDE_CLI" = 1 ]; then
  ok "Claude Code de terminal: $(claude --version </dev/null 2>/dev/null | head -1)"
elif [ "$CODEX_CLI" = 0 ]; then
  falta "Claude Code de terminal no instalado: curl -fsSL https://claude.ai/install.sh | bash  (luego cierra y abre la terminal)"
fi
[ "$CODEX_CLI" = 1 ] && ok "Codex: $(codex --version </dev/null 2>/dev/null | head -1)"

# 5. Regla de Cloudflare en las instrucciones de usuario (con o sin comillas invertidas en `cf`)
revisar_regla() {
  archivo="$1"; nombre="$2"
  if [ -f "$archivo" ] && grep -qE 'use the `?cf`? CLI' "$archivo"; then
    ok "Regla de Cloudflare en $nombre"
  elif [ "$INSTALAR" = 1 ]; then
    mkdir -p "$(dirname "$archivo")" && printf '\n%s\n' "$REGLA" >> "$archivo" && ok "Regla de Cloudflare agregada a $nombre"
  else
    falta "Falta la regla de Cloudflare en $nombre: repite con --instalar"
  fi
}
if [ "$CLAUDE_CLI" = 1 ] || [ -d "$HOME/.claude" ]; then revisar_regla "$HOME/.claude/CLAUDE.md" "~/.claude/CLAUDE.md"; fi
if [ "$CODEX_CLI" = 1 ] || [ -d "$HOME/.codex" ]; then revisar_regla "$HOME/.codex/AGENTS.md" "~/.codex/AGENTS.md"; fi

# 6. Plugin de Cloudflare en Claude Code (cualquier marketplace: cloudflare@...). Es opcional.
if [ -d "$HOME/.claude" ] && [ "$NODE_OK" = 1 ]; then
  estado=$(node -e '
    const fs = require("fs"), dir = process.argv[1];
    const leer = f => { try { return JSON.parse(fs.readFileSync(dir + "/" + f, "utf8")); } catch { return {}; } };
    const ids = Object.keys(leer("plugins/installed_plugins.json").plugins || {}).filter(k => k.startsWith("cloudflare@"));
    if (!ids.length) { console.log("no"); process.exit(); }
    const activos = leer("settings.json").enabledPlugins || {};
    const id = ids.find(k => activos[k] !== false);
    console.log(id ? "si " + id : "apagado " + ids[0]);
  ' "$HOME/.claude" 2>/dev/null)
  case "$estado" in
    si\ *)      ok "Plugin de Cloudflare en Claude Code (${estado#si })" ;;
    apagado\ *) nota "Plugin ${estado#apagado } instalado pero desactivado: actívalo con /plugin dentro de Claude Code" ;;
    *)          nota "Plugin de Cloudflare (opcional) no instalado: dentro de Claude Code, /plugin marketplace add cloudflare/skills y luego /plugin install cloudflare@cloudflare (alcance: user)" ;;
  esac
fi
[ "$CODEX_CLI" = 1 ] && nota "Plugin para Codex (opcional): dentro de Codex corre /plugins, busca Cloudflare e instálalo"

echo
if [ "$FALTAS" = 0 ]; then
  echo "Listo. El agente ya puede trabajar con Cloudflare."
else
  echo "Faltan $FALTAS paso(s). Detalle en docs/configurar-entorno.md"
fi
exit "$FALTAS"
