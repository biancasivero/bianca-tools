# 📚 Guia Completo de Instalação e Configuração - BiancaTools

## 📋 Índice
1. [Formas de Instalação](#formas-de-instalação)
2. [Configuração do Token GitHub](#configuração-do-token-github)
3. [Escopos do Token GitHub](#escopos-do-token-github)
4. [Troubleshooting](#troubleshooting)

---

## 🚀 Formas de Instalação

### Método 1: Usando arquivo mcp.json (RECOMENDADO)

#### 1. Localize o arquivo mcp.json
```bash
cd /Users/phiz/Desktop/BIANCA-SANITY/mcp-run-ts-tools
```

#### 2. Verifique o conteúdo
```json
{
  "name": "BiancaTools",
  "description": "BiancaTools - Diverse MCP tools for web automation, GitHub, and more",
  "command": "node",
  "args": ["/Users/phiz/Desktop/BIANCA-SANITY/mcp-run-ts-tools/build/index.js"],
  "env": {
    "GITHUB_TOKEN": ""
  }
}
```

#### 3. Adicione ao Claude usando o arquivo
```bash
claude mcp add /Users/phiz/Desktop/BIANCA-SANITY/mcp-run-ts-tools/mcp.json
```

### Método 2: Comando direto com nome customizado

```bash
claude mcp add BiancaTools -- node /Users/phiz/Desktop/BIANCA-SANITY/mcp-run-ts-tools/build/index.js
```

### 📊 Comparação dos Métodos

| Aspecto | Método 1 (mcp.json) | Método 2 (Comando direto) |
|---------|---------------------|---------------------------|
| **Facilidade** | ⭐⭐⭐⭐⭐ Muito fácil | ⭐⭐⭐ Médio |
| **Configuração** | Centralizada no arquivo | Manual via parâmetros |
| **Manutenção** | Fácil de atualizar | Precisa reexecutar comando |
| **Variáveis de ambiente** | Suportado nativamente | Requer configuração extra |
| **Recomendado para** | Todos os usuários | Usuários avançados |

### ✅ Verificando a instalação

Após a instalação, verifique se o servidor está listado:
```bash
claude mcp list
```

Você deve ver "BiancaTools" na lista de servidores instalados.

---

## 🔐 Configuração do Token GitHub

### 1. Criar o Token no GitHub

1. Acesse [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Clique em "Generate new token (classic)"
3. Nome: `BiancaTools MCP`
4. Expiração: Escolha conforme sua necessidade
5. Selecione os escopos necessários (veja seção abaixo)
6. Clique em "Generate token"
7. **COPIE O TOKEN IMEDIATAMENTE** (não será mostrado novamente)

### 2. Configurar o Token no Projeto

#### Opção A: Variável de ambiente (temporária)
```bash
export GITHUB_TOKEN="ghp_seuTokenAqui"
npm start
```

#### Opção B: Arquivo .env (RECOMENDADO)
```bash
echo "GITHUB_TOKEN=ghp_seuTokenAqui" > .env
```

#### Opção C: No arquivo mcp.json
```json
{
  "env": {
    "GITHUB_TOKEN": "ghp_seuTokenAqui"
  }
}
```

### ⚠️ Segurança

- **NUNCA** commite tokens em repositórios
- **SEMPRE** adicione `.env` ao `.gitignore`
- **USE** tokens com menor privilégio possível
- **ROTACIONE** tokens regularmente

---

## 🔑 Escopos do Token GitHub

### 📂 Repositórios
- **`repo`** ⚠️ - Acesso completo a repositórios privados
  - `repo:status` - Acessar status de commits
  - `repo_deployment` - Acessar deployments
  - `public_repo` - Acessar repositórios públicos
  - `repo:invite` - Acessar/aceitar convites
  - `security_events` - Eventos de segurança
- **`workflow`** - Atualizar workflows do GitHub Actions
- **`write:packages`** - Upload de packages
  - `read:packages` - Download de packages
- **`delete:packages`** - Deletar packages
- **`admin:org`** ⚠️ - Administração completa de organizações
  - `write:org` - Read/write org e teams
  - `read:org` - Read org e membership
  - `manage_runners:org` - Gerenciar runners
- **`admin:public_key`** - Administração completa de chaves
  - `write:public_key` - Criar chaves
  - `read:public_key` - Listar chaves
- **`admin:repo_hook`** - Administração completa de hooks
  - `write:repo_hook` - Write repository hooks
  - `read:repo_hook` - Read repository hooks
- **`admin:org_hook`** - Administração de hooks da organização
- **`gist`** - Criar gists
- **`notifications`** - Acessar notificações
- **`user`** - Atualizar TODOS os dados do usuário
  - `read:user` - Read TODOS os dados do perfil
  - `user:email` - Acessar email do usuário
  - `user:follow` - Follow/unfollow usuários
- **`delete_repo`** ⚠️ - Deletar repositórios
- **`write:discussion`** - Read/write discussions de equipe
  - `read:discussion` - Read discussions de equipe
- **`admin:enterprise`** ⚠️ - Administração completa enterprise
  - `manage_runners:enterprise` - Gerenciar runners
  - `manage_billing:enterprise` - Gerenciar billing
  - `read:enterprise` - Read dados enterprise
- **`audit_log`** - Read audit log enterprise
  - `read:audit_log` - Read audit log
- **`codespace`** - Administração completa de codespaces
  - `codespace:secrets` - Administração de secrets
- **`copilot`** - Gerenciar Copilot Business
  - `manage_billing:copilot` - Gerenciar billing Copilot
  - `read:copilot` - Read dados Copilot Business
- **`project`** - Acesso completo a projects
  - `read:project` - Read access a projects

### ⚠️ **Escopos Críticos**

Os seguintes escopos concedem permissões muito amplas e devem ser usados com extrema cautela:

1. **`repo`** - Acesso total a TODOS os repositórios (públicos e privados)
2. **`admin:org`** - Controle total sobre organizações
3. **`delete_repo`** - Capacidade de DELETAR repositórios
4. **`admin:enterprise`** - Controle total sobre contas enterprise
5. **`user`** - Pode modificar QUALQUER dado do perfil do usuário

### 🛡️ Recomendações de Segurança

Para uso em **produção**, considere:
1. Criar um usuário de serviço dedicado
2. Usar apenas os escopos mínimos necessários
3. Rotacionar tokens regularmente
4. Monitorar uso do token via audit logs
5. Usar GitHub Apps ao invés de tokens pessoais quando possível

### Escopos Mínimos para BiancaTools

Para funcionalidade básica:
- `public_repo` - Para repositórios públicos
- `read:user` - Para identificação básica

Para funcionalidade completa:
- `repo` - Para criar issues, PRs em repos privados
- `workflow` - Se precisar modificar GitHub Actions
- `write:packages` - Se precisar publicar packages

---

## 🔧 Troubleshooting

### Erro: "GitHub token not found"
**Solução**: Configure o token usando uma das opções acima

### Erro: "Insufficient permissions"
**Solução**: Verifique se o token tem os escopos necessários

### Erro: "Bad credentials"
**Solução**: 
- Verifique se o token não expirou
- Confirme que copiou o token corretamente
- Tente gerar um novo token

### Erro ao iniciar o servidor
**Solução**:
```bash
# Recompilar o projeto
npm run build

# Verificar se o arquivo existe
ls -la build/index.js

# Testar manualmente
node build/index.js
```

### Logs e Debug

Para ativar logs detalhados:
```bash
DEBUG=* npm start
```

### Suporte

Em caso de problemas:
1. Verifique este guia
2. Consulte o arquivo CLAUDE.md
3. Abra uma issue no repositório