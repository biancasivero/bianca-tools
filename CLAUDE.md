
Sempre responda em pt br
caso enfrente algum problema recorra a documentação oficial encontrada na web
quando achar que definitivamente um processo antigo rodando ou um cache persistente pedir para o usuario tentar abrir outro chat no terminal.

# BiancaTools - Servidor MCP Avançado com TypeScript

## 🔄 COMANDO COMPLETO PARA REINSTALAR APÓS MODIFICAÇÕES:
```bash
cd /Users/phiz/Desktop/BIANCA-SANITY/mcp-run-ts-tools && rm -rf build && rm -rf node_modules && npm install && npm run build && claude mcp remove BiancaTools -s user && claude mcp add BiancaTools /Users/phiz/Desktop/BIANCA-SANITY/mcp-run-ts-tools/run.sh --env GITHUB_TOKEN=ghp_xyx --env MEM0_API_KEY=m0-xyz --env MEM0_BASE_URL=https://api.mem0.ai -s user

```


lembrando que o valor da variavel real está no .env

### 🧹 Versão com Limpeza Completa (quando houver problemas):
```bash
cd /Users/phiz/Desktop/BIANCA-SANITY/mcp-run-ts-tools && rm -rf build && rm -rf node_modules && claude mcp remove BiancaTools -s user && npm install typescript && npm run build && claude mcp add BiancaTools /Users/phiz/Desktop/BIANCA-SANITY/mcp-run-ts-tools/run.sh --env GITHUB_TOKEN=ghp_xyz --env MEM0_API_KEY=m0-xyz --env MEM0_BASE_URL=https://api.mem0.ai -s user
```

consultar o .env para trocar pela real quando for usar

## 🚀 Instalação no Claude Code CLI (Terminal)

### Forma 1: Comando Direto (Recomendado)
```bash
cd /Users/phiz/Desktop/BIANCA-SANITY/mcp-run-ts-tools 
npm install && npm run build && claude mcp add BiancaTools "node /Users/phiz/Desktop/BIANCA-SANITY/mcp-run-ts-tools/build/index.js" --env GITHUB_TOKEN=ghp_xyz
```

### Forma 2: Via caminho relativo
```bash
# Primeiro, instale o servidor localmente
cd /Users/phiz/Desktop/BIANCA-SANITY/mcp-run-ts-tools
npm install
npm run build

# Depois adicione usando o caminho relativo
claude mcp add BiancaTools "node $(pwd)/build/index.js" --env GITHUB_TOKEN=ghp_xyz
```

**⚠️ IMPORTANTE**: 
- Estes comandos são para o **Claude Code CLI** (linha de comando), NÃO para o Claude Desktop App!
- **SEMPRE execute os comandos na pasta correta** (`cd /Users/phiz/Desktop/BIANCA-SANITY/mcp-run-ts-tools`) antes de instalar ou fazer build
- As aspas em volta do comando node são necessárias para o comando funcionar corretamente 

## Visão Geral

BiancaTools é um servidor MCP (Model Context Protocol) de alta performance que oferece ferramentas diversas para automação web (Puppeteer), gerenciamento GitHub (Octokit) e extensibilidade para futuras integrações. Desenvolvido com TypeScript avançado, oferecendo type safety completo, validação robusta e arquitetura modular.

## Arquitetura

### Stack Tecnológica
- **TypeScript** 5.3.3 com strict mode completo
- **@modelcontextprotocol/sdk** v1.12.1
- **Puppeteer** v24.10.0 (automação headless)
- **Octokit REST** v22.0.0 (GitHub API v3)
- **Zod** v3.25.56 (validação de schemas)
- **Jest** v29.7.0 + ts-jest (testes unitários)
- **Dotenv** para gestão de variáveis de ambiente

### Estrutura do Projeto
```
mcp-run-ts-tools/
├── src/
│   ├── index.ts          # Servidor principal BiancaTools
│   ├── index-refactored.ts # Versão refatorada com módulos organizados
│   ├── types.ts          # Tipos, interfaces e enums TypeScript
│   ├── schemas.ts        # Validação Zod para todas as ferramentas
│   ├── utils.ts          # Funções utilitárias com generics
│   ├── middleware.ts     # Sistema de middlewares tipados
│   ├── factory.ts        # Factory pattern para ferramentas
│   ├── handlers.ts       # Handlers extraídos e modulares
│   ├── tools/            # 🆕 Ferramentas organizadas por categoria
│   │   ├── index.ts      # Exporta todas as ferramentas
│   │   ├── puppeteer/    # 🌐 Ferramentas de automação web
│   │   │   └── index.ts  # Navigate, Screenshot, Click, Type, GetContent
│   │   └── github/       # 🐙 Ferramentas GitHub
│   │       └── index.ts  # CreateIssue, ListIssues, CreatePR, CreateRepo, PushFiles
│   └── __tests__/
│       └── utils.test.ts # Testes unitários com Jest
├── build/                # JavaScript compilado
├── jest.config.js       # Configuração de testes
├── tsconfig.json        # TypeScript com strict mode
├── .env                 # Variáveis de ambiente (não commitado)
└── package.json         # Scripts npm e dependências
```

### 🆕 Nova Organização Modular

As ferramentas agora estão organizadas por categoria em `/src/tools/`:

#### 🌐 Puppeteer (`/src/tools/puppeteer/`)
- Módulo independente para automação web
- Browser singleton com cleanup automático
- Validação Zod específica para cada ferramenta
- Handlers isolados e testáveis

#### 🐙 GitHub (`/src/tools/github/`)
- Módulo independente para integração GitHub
- Cliente Octokit configurado com token
- Validação robusta de parâmetros
- Suporte completo à API v3

#### 🔧 Estrutura Modular
- **Separação de responsabilidades**: Cada categoria tem seu próprio módulo
- **Facilita manutenção**: Mudanças em uma categoria não afetam outras
- **Extensibilidade**: Adicionar novas categorias é simples
- **Type safety**: Tipos e validações específicos por módulo

## Ferramentas Disponíveis (21 total) ✨

### 🌐 Puppeteer (5 ferramentas)
1. **puppeteer_navigate** - Navega para URLs
2. **puppeteer_screenshot** - Captura screenshots (PNG/JPG)
3. **puppeteer_click** - Clica em elementos via seletor CSS
4. **puppeteer_type** - Digita texto em campos
5. **puppeteer_get_content** - Extrai HTML da página

### 🐙 GitHub (6 ferramentas)
1. **github_create_issue** - Cria issues em repositórios
2. **github_list_issues** - Lista issues (open/closed/all)
3. **github_create_pr** - Cria pull requests
4. **github_create_repo** - Cria novos repositórios
5. **github_push_files** - Envia arquivos via Git Tree API
6. **github_commit** - Faz commit de arquivos (cria ou atualiza)

### 📁 Git Local (4 ferramentas)
1. **git_status** - Verifica status do repositório local
2. **git_commit** - Faz commit de alterações locais
3. **git_push** - Envia commits para repositório remoto
4. **git_pull** - Baixa alterações do repositório remoto

### 🧠 Mem0 Memory (4 ferramentas) 🆕
1. **mem0_add_memory** - Adiciona memórias ao sistema persistente
2. **mem0_search_memory** - Busca semântica em memórias armazenadas
3. **mem0_list_memories** - Lista todas as memórias do usuário
4. **mem0_delete_memories** - Remove memórias específicas ou todas

### 🖥️ Browser (1 ferramenta) 🆕
1. **browser_open_url** - Abre URLs no navegador padrão do sistema ou em navegadores específicos (Chrome, Safari, Firefox)

### 🤖 Claude CLI (1 ferramenta) 🆕
1. **claude_execute** - Executa Claude Code com capacidades completas de:
   - Operações de arquivo (criar, ler, editar, mover, copiar, deletar)
   - Análise e geração de código
   - Comandos Git e GitHub avançados
   - Execução de comandos terminal
   - Busca web e análise de conteúdo
   - Workflows multi-etapas complexos

## Características Técnicas Avançadas

### 🎯 Type Safety Completo
- **100% TypeScript**: Todo código tipado com strict mode
- **Discriminated Unions**: Para respostas de API type-safe
- **Type Guards**: Validação de tipos em runtime
- **Generics**: Funções reutilizáveis com tipos preservados

### 🛡️ Validação e Segurança
- **Zod Schemas**: Validação automática de entrada para todas as ferramentas
- **Custom Error Classes**: MCPError com códigos de erro específicos
- **Dotenv Integration**: Gestão segura de tokens e credenciais
- **Result Pattern**: Tratamento funcional de erros

### ⚡ Performance e Otimização
- **Browser Singleton**: Instância única do Puppeteer
- **Lazy Loading**: Recursos criados sob demanda
- **Cache System**: SimpleCache com TTL configurável
- **Resource Cleanup**: Fechamento automático após inatividade
- **Batch Processing**: Processamento em lotes para operações múltiplas

### 🔧 Arquitetura Modular
- **Factory Pattern**: ToolFactory para registro dinâmico de ferramentas
- **Middleware System**: Pipeline configurável para todas as operações
- **Handler Separation**: Lógica de negócio isolada em handlers
- **Path Aliases**: Imports limpos com @types, @utils, etc.

### 🚀 Middlewares Disponíveis
1. **loggingMiddleware**: Logs detalhados de todas as operações
2. **metricsMiddleware**: Coleta métricas de performance e uso
3. **rateLimitMiddleware**: Controle de taxa de requisições
4. **cachingMiddleware**: Cache inteligente para operações read-only
5. **errorHandlingMiddleware**: Tratamento centralizado de erros
6. **validationMiddleware**: Validação adicional de parâmetros

### 📊 Sistema de Métricas
```typescript
// Acesso às métricas coletadas
const metrics = getMetrics(ToolName.PUPPETEER_NAVIGATE);
// Retorna: totalRequests, successfulRequests, failedRequests, averageResponseTime
```

### API Git Avançada
O `github_push_files` implementa commit direto sem clone:
1. Obtém SHA do branch atual
2. Cria blobs base64 para cada arquivo
3. Constrói árvore Git com os blobs
4. Cria commit apontando para a árvore
5. Atualiza referência do branch

## Casos de Uso

### 1. QA Automatizado
```javascript
// Capturar bug visual e reportar
await puppeteer_navigate({ url: "https://app.com/page" });
await puppeteer_screenshot({ path: "bug.png" });
await github_create_issue({
  owner: "empresa",
  repo: "app",
  title: "Bug visual encontrado",
  body: "Screenshot anexado: bug.png"
});
```

### 2. Deploy de Projeto Completo
```javascript
// Criar repo e enviar código
await github_create_repo({
  name: "novo-projeto",
  private: true,
  gitignore_template: "Node"
});

await github_push_files({
  owner: "usuario",
  repo: "novo-projeto",
  files: [
    { path: "index.js", content: "console.log('Hello');" },
    { path: "package.json", content: "{...}" }
  ],
  message: "Initial commit"
});
```

### 3. Monitoramento com Alertas
```javascript
// Verificar site e criar issue se houver problema
await puppeteer_navigate({ url: "https://site.com" });
const html = await puppeteer_get_content();

if (html.includes("error")) {
  await github_create_issue({
    owner: "team",
    repo: "monitoring",
    title: `Alerta: Site com erro ${new Date().toISOString()}`
  });
}
```

### 4. Workflow Git Completo 🆕
```javascript
// Verificar status
const status = await git_status({ detailed: true });
console.log(`${status.totalChanges} arquivos modificados`);

// Fazer commit local
await git_commit({
  message: "feat: Adicionar novas funcionalidades",
  addAll: true
});

// Enviar para repositório remoto
await git_push({ branch: "main" });
```

### 5. Commit Seletivo 🆕
```javascript
// Verificar alterações
await git_status();

// Adicionar apenas arquivos específicos
await git_commit({
  message: "fix: Corrigir bug crítico",
  addAll: false,
  files: ["src/fix.js", "src/utils.js"]
});

// Push com upstream
await git_push({ 
  branch: "hotfix", 
  upstream: true 
});
```

### 6. Claude Code Agent - Tarefas Complexas 🆕
```javascript
// Análise de código e refatoração
await claude_execute({
  prompt: "Analise o arquivo app.js e refatore para melhorar performance",
  workFolder: "/Users/phiz/projeto"
});

// Workflow completo de release
await claude_execute({
  prompt: `Por favor:
    1. Atualize a versão no package.json para 2.0.0
    2. Gere o CHANGELOG.md com as mudanças desde a v1.0.0
    3. Faça commit com mensagem "chore: release v2.0.0"
    4. Crie uma tag v2.0.0
    5. Push para o repositório`,
  workFolder: "/Users/phiz/meu-projeto"
});

// Análise de imagem e documentação
await claude_execute({
  prompt: "Analise o screenshot bug.png e crie uma issue detalhada no GitHub descrevendo o problema",
  workFolder: "/Users/phiz/Desktop"
});
```

### 7. Combinando Ferramentas - BiancaTools + Claude 🆕
```javascript
// Capturar screenshot, analisar com Claude e criar issue
await puppeteer_navigate({ url: "https://app.com/dashboard" });
await puppeteer_screenshot({ path: "/tmp/dashboard.png" });

await claude_execute({
  prompt: "Analise /tmp/dashboard.png e identifique problemas de UI/UX",
  workFolder: "/tmp"
});

// Claude pode então criar a issue automaticamente via suas próprias ferramentas
```

## 📋 Quando Usar `claude_execute` vs Ferramentas Específicas

### ✅ USE `claude_execute` QUANDO:

1. **Análise e Geração de Código Complexa**
   - Refatoração de código existente
   - Análise de performance ou segurança
   - Geração de código baseada em padrões do projeto

2. **Workflows Multi-etapas**
   - Processos que envolvem 3+ operações sequenciais
   - Tarefas que requerem decisões contextuais
   - Releases completos (versão, changelog, tag, push)

3. **Análise de Conteúdo Visual**
   - Análise de screenshots ou imagens
   - Identificação de problemas de UI/UX
   - Documentação de bugs visuais

4. **Operações de Arquivos Complexas**
   - Reorganização de estrutura de diretórios
   - Refatoração em massa de múltiplos arquivos
   - Análise de dependências entre arquivos

5. **Integração com Web**
   - Busca e análise de informações online
   - Criação de resumos de documentação externa
   - Comparação com best practices atuais

### ❌ NÃO USE `claude_execute` QUANDO:

1. **Operações Simples e Diretas**
   - Commits simples → Use `git_commit`
   - Criar uma issue → Use `github_create_issue`
   - Capturar screenshot → Use `puppeteer_screenshot`
   - Push simples → Use `git_push`

2. **Performance é Crítica**
   - Ferramentas específicas são mais rápidas
   - Operações em lote repetitivas
   - Scripts automatizados de CI/CD

3. **Operações Bem Definidas**
   - Quando você sabe exatamente o que fazer
   - Não há necessidade de análise ou decisão
   - Operações atômicas independentes

### 🎯 Regra Geral:
**Use ferramentas específicas para operações diretas e `claude_execute` para tarefas que requerem "inteligência" - análise, decisões contextuais, ou coordenação complexa.**

## Instalação e Uso

### Setup Completo
```bash
# Clonar ou navegar até o diretório
cd /Users/phiz/Desktop/BIANCA-SANITY/mcp-run-ts-tools

# Instalar dependências
npm install

# Compilar TypeScript
npm run build



### Scripts NPM Disponíveis
- `npm run build` - Compila TypeScript com strict mode
- `npm run dev` - Modo watch para desenvolvimento
- `npm start` - Executa servidor BiancaTools
- `npm test` - Executa testes unitários Jest
- `npm run test:watch` - Testes em modo watch
- `npm run test:coverage` - Relatório de cobertura de testes

## Notas Técnicas

### Puppeteer
- Adiciona `.png` automaticamente se extensão não fornecida
- Suporta screenshots de página inteira com `fullPage: true`
- Browser persiste entre chamadas para performance

### GitHub API
- Usa Octokit REST (não GraphQL)
- Token com escopos administrativos completos
- Suporta templates de gitignore e licença
- Commit direto sem working directory local

### MCP Protocol
- Comunicação via StdioServerTransport
- Schemas de entrada validados por ferramenta
- Respostas em JSON formatado
- Tratamento de erros com mensagens descritivas

## 🔧 Extensibilidade

### Adicionando Novas Ferramentas

```typescript
// 1. Adicionar ao enum ToolName em types.ts
export enum ToolName {
  // ... existing tools
  MY_CUSTOM_TOOL = 'my_custom_tool'
}

// 2. Criar schema de validação em schemas.ts
export const MyCustomToolSchema = z.object({
  param1: z.string(),
  param2: z.number().optional()
});

// 3. Criar handler em handlers.ts
export async function handleMyCustomTool(params: MyCustomToolParams) {
  // Implementação da ferramenta
  return successResponse(result, 'Operação concluída');
}

// 4. Registrar no ToolFactory em factory.ts
ToolFactory.register({
  name: ToolName.MY_CUSTOM_TOOL,
  description: 'Minha ferramenta customizada',
  handler: handleMyCustomTool,
  metadata: {
    category: 'utility',
    isReadOnly: false,
    requiresAuth: false
  }
});
```

### Adicionando Middlewares Customizados

```typescript
// Criar middleware customizado
export const myMiddleware: Middleware = async (ctx, next) => {
  console.log(`Executando ${ctx.toolName}`);
  const result = await next();
  console.log(`Finalizado ${ctx.toolName}`);
  return result;
};

// Registrar no MiddlewareManager
middlewareManager.use(myMiddleware);
```

## 🚀 Melhorias TypeScript Implementadas

1. **Tipos Customizados** (types.ts)
   - Enums para todas as constantes
   - Interfaces type-safe para parâmetros
   - Discriminated unions para respostas

2. **Validação Robusta** (schemas.ts)
   - Schemas Zod para todas as ferramentas
   - Mensagens de erro em português
   - Type inference automático

3. **Utilitários Avançados** (utils.ts)
   - withRetry com backoff exponencial
   - withTimeout para operações assíncronas
   - SimpleCache genérico com TTL
   - Result pattern para error handling

4. **Factory Pattern** (factory.ts)
   - Registro dinâmico de ferramentas
   - Conversão automática Zod → JSON Schema
   - Metadata para categorização

5. **Middleware System** (middleware.ts)
   - Pipeline configurável
   - Middlewares built-in
   - Composição flexível

6. **Testes Unitários** (Jest + TypeScript)
   - Configuração completa
   - Exemplos de testes
   - Scripts de coverage

## Ambiente de Desenvolvimento

### Requisitos
- Node.js 18+
- Token GitHub com permissões adequadas
- Claude Desktop instalado

### Configuração TypeScript
- Strict mode completo habilitado
- Path aliases configurados
- Decorators suportados
- Source maps para debugging

### Boas Práticas
- Use variáveis de ambiente via .env
- Execute testes antes de commits
- Mantenha type coverage em 100%
- Documente novas ferramentas com JSDoc

### Type Safety
- ✅ 100% do código tipado