#!/bin/bash
# Script wrapper para BiancaTools MCP Server

# Diretório onde o script está localizado
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Mudar para o diretório do projeto para garantir que os módulos sejam encontrados
cd "$SCRIPT_DIR"

# Executar o servidor Node.js com as variáveis de ambiente
exec /opt/homebrew/bin/node build/index.js