#!/bin/bash

# Script wrapper para BiancaTools MCP Server
# Este script garante que o Node.js encontre todas as dependências

# Diretório base do projeto
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Configurar NODE_PATH para incluir node_modules local
export NODE_PATH="$PROJECT_DIR/node_modules:$NODE_PATH"

# Passar variáveis de ambiente
export GITHUB_TOKEN="${GITHUB_TOKEN}"

# Mudar para o diretório do projeto
cd "$PROJECT_DIR"

# Executar o servidor com todas as variáveis configuradas
exec /opt/homebrew/bin/node --experimental-modules build/index.js "$@"