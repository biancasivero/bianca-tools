/**
 * Git Local Tools Module
 * 
 * Ferramentas para operações Git locais
 */

import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import { 
  successResponse 
} from '../../utils.js';
import {
  GitStatusParams,
  GitCommitParams,
  GitPushParams,
  GitPullParams,
  MCPError,
  ErrorCode
} from '../../types.js';

const execAsync = promisify(exec);

// Schemas de validação
export const GitStatusSchema = z.object({
  detailed: z.boolean().optional().default(false)
});

export const GitCommitSchema = z.object({
  message: z.string().min(1, 'Mensagem de commit é obrigatória'),
  addAll: z.boolean().optional().default(true),
  files: z.array(z.string()).optional()
});

export const GitPushSchema = z.object({
  branch: z.string().optional(),
  force: z.boolean().optional().default(false),
  upstream: z.boolean().optional().default(false)
});

export const GitPullSchema = z.object({
  branch: z.string().optional(),
  rebase: z.boolean().optional().default(false)
});

// Função auxiliar para executar comandos git
async function executeGitCommand(command: string): Promise<{ stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd()
    });
    return { stdout, stderr };
  } catch (error: any) {
    throw new MCPError(
      ErrorCode.INTERNAL_ERROR,
      `Erro ao executar comando git: ${error.message}`
    );
  }
}

// Handlers das ferramentas
export async function handleGitStatus(params: GitStatusParams) {
  const validated = GitStatusSchema.parse(params);
  
  const command = validated.detailed ? 'git status --porcelain -v' : 'git status --porcelain';
  const { stdout } = await executeGitCommand(command);
  
  // Parse do output para formato mais amigável
  const files = stdout.split('\n').filter(Boolean).map(line => {
    const parts = line.trim().split(' ');
    const status = parts[0] || '';
    const path = parts.slice(1).join(' ');
    return {
      status: status.trim(),
      path: path
    };
  });
  
  // Também pegar branch atual
  const { stdout: branchOutput } = await executeGitCommand('git branch --show-current');
  const currentBranch = branchOutput.trim();
  
  return successResponse(
    {
      branch: currentBranch,
      files,
      totalChanges: files.length,
      raw: validated.detailed ? stdout : undefined
    },
    `${files.length} alterações encontradas no branch ${currentBranch}`
  );
}

export async function handleGitCommit(params: GitCommitParams) {
  const validated = GitCommitSchema.parse(params);
  
  // Adicionar arquivos se necessário
  if (validated.addAll) {
    await executeGitCommand('git add -A');
  } else if (validated.files && validated.files.length > 0) {
    const filesStr = validated.files.map(f => `"${f}"`).join(' ');
    await executeGitCommand(`git add ${filesStr}`);
  }
  
  // Fazer o commit
  const message = validated.message.replace(/"/g, '\\"');
  const { stdout } = await executeGitCommand(`git commit -m "${message}"`);
  
  // Extrair informações do commit
  const commitMatch = stdout.match(/\[(\w+) ([a-f0-9]+)\]/);
  const filesMatch = stdout.match(/(\d+) files? changed/);
  
  return successResponse(
    {
      branch: commitMatch?.[1] || 'unknown',
      sha: commitMatch?.[2] || 'unknown',
      filesChanged: filesMatch?.[1] || '0',
      output: stdout
    },
    `Commit realizado com sucesso`
  );
}

export async function handleGitPush(params: GitPushParams) {
  const validated = GitPushSchema.parse(params);
  
  let command = 'git push';
  
  if (validated.upstream && validated.branch) {
    command += ` -u origin ${validated.branch}`;
  } else if (validated.branch) {
    command += ` origin ${validated.branch}`;
  }
  
  if (validated.force) {
    command += ' --force';
  }
  
  const { stdout, stderr } = await executeGitCommand(command);
  const output = stdout || stderr; // Git às vezes retorna no stderr mesmo em sucesso
  
  return successResponse(
    {
      output,
      branch: validated.branch || 'current',
      forced: validated.force
    },
    `Push realizado com sucesso`
  );
}

export async function handleGitPull(params: GitPullParams) {
  const validated = GitPullSchema.parse(params);
  
  let command = 'git pull';
  
  if (validated.branch) {
    command += ` origin ${validated.branch}`;
  }
  
  if (validated.rebase) {
    command += ' --rebase';
  }
  
  const { stdout } = await executeGitCommand(command);
  
  return successResponse(
    {
      output: stdout,
      branch: validated.branch || 'current',
      rebase: validated.rebase
    },
    `Pull realizado com sucesso`
  );
}

// Metadados das ferramentas Git
export const gitTools = [
  {
    name: 'git_status',
    description: 'Check git status of the current repository',
    inputSchema: {
      type: 'object',
      properties: {
        detailed: { 
          type: 'boolean', 
          description: 'Show detailed status information',
          default: false
        }
      }
    }
  },
  {
    name: 'git_commit',
    description: 'Create a git commit with the specified message',
    inputSchema: {
      type: 'object',
      properties: {
        message: { 
          type: 'string', 
          description: 'Commit message' 
        },
        addAll: { 
          type: 'boolean', 
          description: 'Add all changes before committing',
          default: true
        },
        files: { 
          type: 'array',
          items: { type: 'string' },
          description: 'Specific files to add (if addAll is false)'
        }
      },
      required: ['message']
    }
  },
  {
    name: 'git_push',
    description: 'Push commits to remote repository',
    inputSchema: {
      type: 'object',
      properties: {
        branch: { 
          type: 'string', 
          description: 'Branch to push (defaults to current)' 
        },
        force: { 
          type: 'boolean', 
          description: 'Force push',
          default: false
        },
        upstream: {
          type: 'boolean',
          description: 'Set upstream branch',
          default: false
        }
      }
    }
  },
  {
    name: 'git_pull',
    description: 'Pull changes from remote repository',
    inputSchema: {
      type: 'object',
      properties: {
        branch: { 
          type: 'string', 
          description: 'Branch to pull (defaults to current)' 
        },
        rebase: { 
          type: 'boolean', 
          description: 'Use rebase instead of merge',
          default: false
        }
      }
    }
  }
];