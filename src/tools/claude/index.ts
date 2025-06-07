/**
 * Claude CLI integration for BiancaTools
 * Adapted from one-shot tool to work as a module
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join, resolve as pathResolve } from 'path';
import * as path from 'path';
import { 
  ClaudeExecuteParams, 
  ContentBlock, 
  MCPError, 
  ErrorCode,
  ToolName 
} from '../../types.js';
import { ClaudeExecuteSchema } from '../../schemas.js';

// Timeout padrão de 30 minutos
const EXECUTION_TIMEOUT_MS = 30 * 60 * 1000;

// Debug mode baseado em variável de ambiente
const debugMode = process.env.MCP_CLAUDE_DEBUG === 'true';

function debugLog(message?: any, ...optionalParams: any[]): void {
  if (debugMode) {
    console.error('[Claude Debug]', message, ...optionalParams);
  }
}

/**
 * Encontra o comando/caminho do Claude CLI
 */
function findClaudeCli(): string {
  debugLog('Procurando Claude CLI...');

  // Verifica variável de ambiente customizada
  const customCliName = process.env.CLAUDE_CLI_NAME;
  if (customCliName) {
    debugLog(`Usando nome customizado: ${customCliName}`);
    
    // Se for caminho absoluto, usa diretamente
    if (path.isAbsolute(customCliName)) {
      debugLog(`CLAUDE_CLI_NAME é caminho absoluto: ${customCliName}`);
      return customCliName;
    }
    
    // Rejeita caminhos relativos
    if (customCliName.startsWith('./') || customCliName.startsWith('../') || customCliName.includes('/')) {
      throw new MCPError(
        ErrorCode.INVALID_PARAMS,
        'CLAUDE_CLI_NAME inválido: Caminhos relativos não são permitidos. Use um nome simples (ex: "claude") ou caminho absoluto'
      );
    }
  }
  
  const cliName = customCliName || 'claude';

  // Tenta caminho local: ~/.claude/local/claude
  const userPath = join(homedir(), '.claude', 'local', 'claude');
  debugLog(`Verificando caminho local: ${userPath}`);

  if (existsSync(userPath)) {
    debugLog(`Claude CLI encontrado em: ${userPath}`);
    return userPath;
  }

  // Fallback para comando no PATH
  debugLog(`Claude CLI não encontrado localmente. Usando comando "${cliName}" do PATH`);
  console.warn(`[Aviso] Claude CLI não encontrado em ~/.claude/local/claude. Usando "${cliName}" do PATH.`);
  return cliName;
}

/**
 * Executa comando assíncrono com spawn
 */
async function spawnAsync(
  command: string, 
  args: string[], 
  options?: { timeout?: number; cwd?: string }
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    debugLog(`Executando: ${command} ${args.join(' ')}`);
    debugLog(`CWD: ${options?.cwd || 'não especificado'}`);
    
    const process = spawn(command, args, {
      shell: false,
      timeout: options?.timeout,
      cwd: options?.cwd,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => { 
      stdout += data.toString(); 
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
      debugLog(`Stderr: ${data.toString()}`);
    });

    process.on('error', (error: NodeJS.ErrnoException) => {
      debugLog('Erro no processo:', error);
      let errorMessage = `Erro ao executar: ${error.message}`;
      if (error.path) {
        errorMessage += ` | Path: ${error.path}`;
      }
      if (error.syscall) {
        errorMessage += ` | Syscall: ${error.syscall}`;
      }
      if (stderr) {
        errorMessage += `\\nStderr: ${stderr.trim()}`;
      }
      reject(new MCPError(
        ErrorCode.INTERNAL_ERROR,
        errorMessage
      ));
    });

    process.on('close', (code) => {
      debugLog(`Processo finalizado com código: ${code}`);
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const errorMessage = `Comando falhou com código ${code}\\nStderr: ${stderr.trim()}\\nStdout: ${stdout.trim()}`;
        reject(new MCPError(
          ErrorCode.INTERNAL_ERROR,
          errorMessage
        ));
      }
    });
  });
}

/**
 * Handler para executar comandos no Claude CLI
 */
export async function handleClaudeExecute(params: ClaudeExecuteParams): Promise<ContentBlock[]> {
  // Validação com Zod
  const validatedParams = ClaudeExecuteSchema.parse(params);
  
  // Encontra o CLI
  const claudeCliPath = findClaudeCli();
  
  // Determina diretório de trabalho
  let effectiveCwd = homedir(); // Padrão é home do usuário
  
  if (validatedParams.workFolder) {
    const resolvedCwd = pathResolve(validatedParams.workFolder);
    debugLog(`WorkFolder especificado: ${validatedParams.workFolder}, resolvido para: ${resolvedCwd}`);
    
    if (existsSync(resolvedCwd)) {
      effectiveCwd = resolvedCwd;
      debugLog(`Usando workFolder como CWD: ${effectiveCwd}`);
    } else {
      throw new MCPError(
        ErrorCode.INVALID_PARAMS,
        `Diretório de trabalho não existe: ${resolvedCwd}`
      );
    }
  }
  
  try {
    debugLog(`Executando Claude CLI com prompt: "${validatedParams.prompt}" em CWD: "${effectiveCwd}"`);
    
    const claudeProcessArgs = ['--dangerously-skip-permissions', '-p', validatedParams.prompt];
    debugLog(`Comando completo: ${claudeCliPath} ${claudeProcessArgs.join(' ')}`);
    
    const { stdout, stderr } = await spawnAsync(
      claudeCliPath,
      claudeProcessArgs,
      { 
        timeout: EXECUTION_TIMEOUT_MS, 
        cwd: effectiveCwd 
      }
    );
    
    debugLog('Saída do Claude CLI:', stdout.trim());
    if (stderr) {
      debugLog('Stderr do Claude CLI:', stderr.trim());
    }
    
    return [{
      type: 'text',
      text: stdout
    }];
    
  } catch (error: any) {
    debugLog('Erro ao executar Claude CLI:', error);
    
    // Verifica se foi timeout
    if (error.signal === 'SIGTERM' || error.message?.includes('ETIMEDOUT') || error.code === 'ETIMEDOUT') {
      throw new MCPError(
        ErrorCode.TIMEOUT,
        `Claude CLI expirou após ${EXECUTION_TIMEOUT_MS / 1000}s. ${error.message || ''}`
      );
    }
    
    // Re-throw se já for MCPError
    if (error instanceof MCPError) {
      throw error;
    }
    
    // Erro genérico
    throw new MCPError(
      ErrorCode.INTERNAL_ERROR,
      `Falha ao executar Claude CLI: ${error.message || 'Erro desconhecido'}`
    );
  }
}

// Exporta a ferramenta
export const claudeTool = {
  name: ToolName.CLAUDE_EXECUTE,
  description: `Claude Code Agent: Assistente versátil para operações de código, arquivos, Git e terminal via Claude CLI.

• Operações de arquivo: Criar, ler, editar, mover, copiar, deletar, listar arquivos, analisar imagens
• Código: Gerar, analisar, refatorar, corrigir
• Git: Stage, commit, push, tag (qualquer workflow)
• Terminal: Executar comandos CLI ou abrir URLs
• Busca web e resumo de conteúdo
• Workflows multi-etapas (bumps de versão, updates de changelog, etc.)
• Integração GitHub (criar PRs, verificar CI)

Use workFolder para execução contextual em diretórios específicos.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      prompt: {
        type: 'string',
        description: 'O prompt em linguagem natural para o Claude executar'
      },
      workFolder: {
        type: 'string',
        description: 'Obrigatório ao usar operações de arquivo. O diretório de trabalho para execução (caminho absoluto)'
      }
    },
    required: ['prompt']
  }
};