# Changelog - BiancaTools

## [2.1.0] - 2025-01-07

### 🎉 Novo
- **Ferramenta `github_commit`** - Faz commits de arquivos individuais (cria ou atualiza)
  - Detecta automaticamente se o arquivo existe
  - Usa a Contents API do GitHub
  - Mais simples que `github_push_files` para arquivos únicos

### 🔧 Melhorias
- **Estrutura modular** - Ferramentas organizadas por categoria:
  - `/src/tools/puppeteer/` - Automação web (5 ferramentas)
  - `/src/tools/github/` - Integração GitHub (6 ferramentas)
- **Documentação atualizada** - Instruções para Claude Code CLI
- **TypeScript strict** - 100% type safety

### 🗑️ Removido
- Arquivo `mcp.json` (método descontinuado)
- Exemplos antigos
- Arquivos de teste obsoletos

### 📊 Total de Ferramentas: 11

#### Puppeteer (5)
1. `puppeteer_navigate` - Navega para URLs
2. `puppeteer_screenshot` - Captura screenshots
3. `puppeteer_click` - Clica em elementos
4. `puppeteer_type` - Digita texto
5. `puppeteer_get_content` - Obtém HTML

#### GitHub (6)
1. `github_create_issue` - Cria issues
2. `github_list_issues` - Lista issues
3. `github_create_pr` - Cria PRs
4. `github_create_repo` - Cria repositórios
5. `github_push_files` - Envia múltiplos arquivos
6. `github_commit` - Commita arquivos ✨

---

## [2.0.0] - 2025-01-06

### Inicial
- 10 ferramentas (5 Puppeteer + 5 GitHub)
- TypeScript com validação Zod
- Servidor MCP completo