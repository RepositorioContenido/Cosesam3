#!/bin/bash
# ============================================================================
#  OVA SENA - generar contenido
# ============================================================================
#  Lee  content.json   (EDITÁ ESTE ARCHIVO)
#  Escribe js/content.js
#
#  Si el contenido tiene errores, NO genera nada y te dice cuál es el problema.
# ============================================================================
cd "$(dirname "$0")" || exit 1

NODE_BIN="$(command -v node)"
if [ -z "$NODE_BIN" ]; then
  if [ -x "$HOME/.local/bin/node" ]; then
    NODE_BIN="$HOME/.local/bin/node"
  else
    echo ""
    echo "  No se encontró Node.js."
    echo "  Instalalo desde https://nodejs.org y volvé a correr este archivo."
    echo ""
    read -r -p "  Presioná Enter para cerrar."
    exit 1
  fi
fi

"$NODE_BIN" tools/generar-content.js
STATUS=$?

echo ""
if [ $STATUS -eq 0 ]; then
  read -r -p "  Listo. Presioná Enter para cerrar."
else
  read -r -p "  No se generó nada. Presioná Enter para cerrar."
fi
