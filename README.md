# MCP Puppeteer + GitHub Server

Um servidor MCP (Model Context Protocol) combinado que fornece automação web através do Puppeteer e integração com GitHub para Claude Code.

## Visão Geral

Este servidor MCP combina duas poderosas ferramentas:
- **Puppeteer**: Automação web, screenshots, extração de dados
- **GitHub**: Criação de issues, pull requests, gerenciamento de repositórios

## Configuração

### 1. Instalar Dependências

```bash
npm install
npm run build
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Token do GitHub (obrigatório para ferramentas GitHub)
GITHUB_TOKEN=seu_token_github_aqui

# URL SSE (opcional)
# SSE_FULL_URL=sua_url_sse
```

O token precisa ter as permissões necessárias para as operações que você deseja realizar (criar repos, issues, etc).

## Ferramentas Disponíveis

### Puppeteer Tools

#### puppeteer_navigate
Navega para uma URL específica.
- `url` (string): URL para navegar

#### puppeteer_screenshot
Captura uma screenshot da página atual.
- `path` (string): Caminho para salvar (adiciona .png se necessário)
- `fullPage` (boolean, opcional): Capturar página inteira

#### puppeteer_click
Clica em um elemento da página.
- `selector` (string): Seletor CSS do elemento

#### puppeteer_type
Digita texto em um campo de entrada.
- `selector` (string): Seletor CSS do campo
- `text` (string): Texto para digitar

#### puppeteer_get_content
Obtém o conteúdo HTML da página atual.

### GitHub Tools

#### github_create_issue
Cria uma nova issue em um repositório.
- `owner` (string): Dono do repositório
- `repo` (string): Nome do repositório
- `title` (string): Título da issue
- `body` (string, opcional): Corpo da issue

#### github_list_issues
Lista issues de um repositório.
- `owner` (string): Dono do repositório
- `repo` (string): Nome do repositório
- `state` (string, opcional): 'open', 'closed', ou 'all'

#### github_create_pr
Cria um pull request.
- `owner` (string): Dono do repositório
- `repo` (string): Nome do repositório
- `title` (string): Título do PR
- `body` (string, opcional): Descrição do PR
- `head` (string): Branch de origem
- `base` (string, opcional): Branch de destino (padrão: 'main')

#### github_create_repo
Cria um novo repositório GitHub.
- `name` (string): Nome do repositório
- `description` (string, opcional): Descrição do repositório
- `private` (boolean, opcional): Tornar repositório privado (padrão: false)
- `auto_init` (boolean, opcional): Inicializar com README (padrão: true)
- `gitignore_template` (string, opcional): Template do gitignore (ex: Node, Python)
- `license_template` (string, opcional): Template de licença (ex: mit, apache-2.0)

#### github_push_files
Envia arquivos para um repositório GitHub.
- `owner` (string): Dono do repositório
- `repo` (string): Nome do repositório
- `branch` (string, opcional): Branch de destino (padrão: 'main')
- `files` (array): Array de arquivos com `path` e `content`
- `message` (string): Mensagem do commit

## Exemplos de Uso

### Automação Web + GitHub

```javascript
// 1. Capturar screenshot de um bug
await puppeteer_navigate({ url: "https://myapp.com/buggy-page" });
await puppeteer_screenshot({ path: "bug-screenshot.png" });

// 2. Criar issue no GitHub com o screenshot
await github_create_issue({
  owner: "meuusuario",
  repo: "meuapp",
  title: "Bug na página X",
  body: "Encontrei um bug na página. Veja o screenshot: bug-screenshot.png"
});
```

### Monitorar Site e Reportar

```javascript
// 1. Verificar se site está online
await puppeteer_navigate({ url: "https://example.com" });
const content = await puppeteer_get_content();

// 2. Se houver problema, criar issue
if (content.includes("error")) {
  await github_create_issue({
    owner: "team",
    repo: "monitoring",
    title: "Site fora do ar",
    body: "Detectado erro no site às " + new Date().toISOString()
  });
}
```

## Arquitetura

```
mcp-run-ts-tools/
├── src/
│   └── index.ts          # Servidor combinado Puppeteer + GitHub
├── build/                # Arquivos JavaScript compilados
├── node_modules/         # Dependências
├── mcp.json             # Configuração MCP
├── package.json         # Metadados e dependências
├── tsconfig.json        # Configuração TypeScript
└── README.md            # Esta documentação
```

## Como Adicionar Mais Ferramentas

Para adicionar outras ferramentas MCP ao servidor:

1. Instale a dependência:
```bash
npm install @modelcontextprotocol/server-filesystem
```

2. Importe e adicione as ferramentas no `src/index.ts`
3. Compile: `npm run build`
4. Reinicie o Claude

## Desenvolvimento

```bash
# Modo watch para desenvolvimento
npm run dev

# Build
npm run build

# Executar localmente
npm start
```

## Resolução de Problemas

### GitHub token não funciona
1. Verifique se o token tem as permissões corretas
2. Confirme que a variável GITHUB_TOKEN está definida
3. Teste o token: `curl -H "Authorization: token SEU_TOKEN" https://api.github.com/user`

### Puppeteer não abre páginas
1. Verifique se há bloqueios de firewall
2. Tente com uma URL diferente
3. Verifique os logs de erro

### Servidor não inicia
1. Execute `npm install` novamente
2. Verifique se o build foi feito: `npm run build`
3. Confirme o caminho no mcp.json