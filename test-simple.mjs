import { spawn } from 'child_process';
import dotenv from 'dotenv';

// Carregar variáveis do .env
dotenv.config();

const server = spawn('node', ['build/index.js'], {
  env: {
    ...process.env
    // SSE_FULL_URL será carregado do .env se necessário
  }
});

server.stdout.on('data', (data) => {
  console.log('STDOUT:', data.toString());
});

server.stderr.on('data', (data) => {
  console.error('STDERR:', data.toString());
});

server.on('close', (code) => {
  console.log('Server closed with code:', code);
});

setTimeout(() => {
  server.kill();
  process.exit(0);
}, 3000);