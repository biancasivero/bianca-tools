import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

// Iniciar o servidor
const server = spawn('node', ['../build/index.js'], {
  env: process.env
});

// Criar cliente MCP
const transport = new StdioClientTransport({
  command: 'node',
  args: ['../build/index.js']
});

const client = new Client({
  name: 'test-client',
  version: '1.0.0'
}, {
  capabilities: {}
});

async function testGitHubTools() {
  try {
    await client.connect(transport);
    console.log('✅ Conectado ao servidor MCP');

    // Listar ferramentas disponíveis
    const tools = await client.listTools();
    console.log('\n📋 Ferramentas disponíveis:');
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    // Exemplo: Listar issues de um repositório
    console.log('\n🔍 Testando listagem de issues...');
    const issuesResult = await client.callTool({
      name: 'github_list_issues',
      arguments: {
        owner: 'octocat',
        repo: 'Hello-World',
        state: 'open'
      }
    });
    
    console.log('Issues encontradas:', issuesResult);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await transport.close();
    server.kill();
    process.exit(0);
  }
}

// Executar teste
testGitHubTools();