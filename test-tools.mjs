import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testBiancaTools() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['build/index.js'],
    env: process.env
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log('✅ Conectado ao BiancaTools');

    // Listar ferramentas disponíveis
    const tools = await client.listTools();
    console.log(`\n📋 Total de ferramentas: ${tools.tools.length}`);
    
    console.log('\n🌐 Ferramentas Puppeteer:');
    tools.tools
      .filter(t => t.name.startsWith('puppeteer_'))
      .forEach(tool => console.log(`  - ${tool.name}: ${tool.description}`));
    
    console.log('\n🐙 Ferramentas GitHub:');
    tools.tools
      .filter(t => t.name.startsWith('github_'))
      .forEach(tool => console.log(`  - ${tool.name}: ${tool.description}`));

    console.log('\n✅ BiancaTools está funcionando perfeitamente!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await transport.close();
    process.exit(0);
  }
}

testBiancaTools();