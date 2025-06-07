# BiancaTools - Servidor MCP Avançado com TypeScript

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
│   ├── types.ts          # Tipos, interfaces e enums TypeScript
│   ├── schemas.ts        # Validação Zod para todas as ferramentas
│   ├── utils.ts          # Funções utilitárias com generics
│   ├── middleware.ts     # Sistema de middlewares tipados
│   ├── factory.ts        # Factory pattern para ferramentas
│   ├── handlers.ts       # Handlers extraídos e modulares
│   └── __tests__/
│       └── utils.test.ts # Testes unitários com Jest
├── build/                # JavaScript compilado
├── mcp.json             # Configuração para Claude Desktop
├── jest.config.js       # Configuração de testes
├── tsconfig.json        # TypeScript com strict mode
├── .env                 # Variáveis de ambiente (não commitado)
└── package.json         # Scripts npm e dependências
```

## Ferramentas Disponíveis (10 total)

### 🌐 Puppeteer (5 ferramentas)
1. **puppeteer_navigate** - Navega para URLs
2. **puppeteer_screenshot** - Captura screenshots (PNG/JPG)
3. **puppeteer_click** - Clica em elementos via seletor CSS
4. **puppeteer_type** - Digita texto em campos
5. **puppeteer_get_content** - Extrai HTML da página

### 🐙 GitHub (5 ferramentas)
1. **github_create_issue** - Cria issues em repositórios
2. **github_list_issues** - Lista issues (open/closed/all)
3. **github_create_pr** - Cria pull requests
4. **github_create_repo** - Cria novos repositórios
5. **github_push_files** - Envia arquivos via Git Tree API

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

## Instalação e Uso

### Setup Completo
```bash
# Clonar ou navegar até o diretório
cd /Users/phiz/Desktop/BIANCA-SANITY/mcp-run-ts-tools

# Instalar dependências
npm install

# Configurar variáveis de ambiente
echo "GITHUB_TOKEN=seu_token_aqui" > .env

# Compilar TypeScript
npm run build

# Adicionar ao Claude Desktop
claude mcp add BiancaTools -- node /Users/phiz/Desktop/BIANCA-SANITY/mcp-run-ts-tools/build/index.js
```

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

Para uso em produção, sempre use variáveis de ambiente seguras e configure rate limiting apropriado.