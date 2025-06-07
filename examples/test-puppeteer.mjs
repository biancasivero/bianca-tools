import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testPuppeteerTools() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['../build/index.js'],
    env: process.env
  });

  const client = new Client({
    name: 'puppeteer-test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log('✅ Conectado ao servidor MCP');

    // Navegar para uma página
    console.log('\n🌐 Navegando para example.com...');
    await client.callTool({
      name: 'puppeteer_navigate',
      arguments: {
        url: 'https://example.com'
      }
    });

    // Capturar screenshot
    console.log('📸 Capturando screenshot...');
    const screenshotResult = await client.callTool({
      name: 'puppeteer_screenshot',
      arguments: {
        path: 'example-screenshot.png',
        fullPage: true
      }
    });
    console.log(screenshotResult);

    // Obter conteúdo HTML
    console.log('📄 Obtendo conteúdo HTML...');
    const contentResult = await client.callTool({
      name: 'puppeteer_get_content',
      arguments: {}
    });
    console.log('Primeiros 200 caracteres:', contentResult.content[0].text.substring(0, 200) + '...');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await transport.close();
    process.exit(0);
  }
}

// Executar teste
testPuppeteerTools();