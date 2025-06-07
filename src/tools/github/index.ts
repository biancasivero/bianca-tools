/**
 * GitHub Tools Module
 * 
 * Ferramentas de integração com GitHub usando Octokit
 */

import { Octokit } from '@octokit/rest';
import { z } from 'zod';
import { 
  successResponse 
} from '../../utils.js';
import {
  CreateIssueParams,
  ListIssuesParams,
  CreatePRParams,
  CreateRepoParams,
  PushFilesParams,
  CommitParams,
  IssueState,
  MCPError,
  ErrorCode
} from '../../types.js';

// Configurações
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.warn('⚠️  GITHUB_TOKEN não configurado. Ferramentas GitHub não funcionarão.');
}

// Cliente Octokit
const octokit = GITHUB_TOKEN ? new Octokit({ auth: GITHUB_TOKEN }) : null;

// Schemas de validação
export const CreateIssueSchema = z.object({
  owner: z.string().min(1, 'Owner é obrigatório'),
  repo: z.string().min(1, 'Repositório é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório'),
  body: z.string().optional(),
  labels: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional()
});

export const ListIssuesSchema = z.object({
  owner: z.string().min(1, 'Owner é obrigatório'),
  repo: z.string().min(1, 'Repositório é obrigatório'),
  state: z.nativeEnum(IssueState).optional().default(IssueState.OPEN),
  labels: z.array(z.string()).optional(),
  sort: z.enum(['created', 'updated', 'comments']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  per_page: z.number().min(1).max(100).optional().default(30),
  page: z.number().min(1).optional().default(1)
});

export const CreatePRSchema = z.object({
  owner: z.string().min(1, 'Owner é obrigatório'),
  repo: z.string().min(1, 'Repositório é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório'),
  head: z.string().min(1, 'Branch head é obrigatório'),
  base: z.string().optional().default('main'),
  body: z.string().optional(),
  draft: z.boolean().optional().default(false)
});

export const CreateRepoSchema = z.object({
  name: z.string().min(1, 'Nome do repositório é obrigatório'),
  description: z.string().optional(),
  private: z.boolean().optional().default(false),
  auto_init: z.boolean().optional().default(true),
  gitignore_template: z.string().optional(),
  license_template: z.string().optional()
});

export const PushFilesSchema = z.object({
  owner: z.string().min(1, 'Owner é obrigatório'),
  repo: z.string().min(1, 'Repositório é obrigatório'),
  files: z.array(z.object({
    path: z.string().min(1, 'Caminho do arquivo é obrigatório'),
    content: z.string(),
    encoding: z.enum(['utf-8', 'base64']).optional().default('utf-8')
  })).min(1, 'Pelo menos um arquivo é necessário'),
  message: z.string().min(1, 'Mensagem de commit é obrigatória'),
  branch: z.string().optional().default('main')
});

export const CommitSchema = z.object({
  owner: z.string().min(1, 'Owner é obrigatório'),
  repo: z.string().min(1, 'Repositório é obrigatório'),
  message: z.string().min(1, 'Mensagem de commit é obrigatória'),
  files: z.array(z.object({
    path: z.string().min(1, 'Caminho do arquivo é obrigatório'),
    content: z.string()
  })).min(1, 'Pelo menos um arquivo é necessário'),
  branch: z.string().optional().default('main'),
  author: z.object({
    name: z.string(),
    email: z.string().email()
  }).optional()
});

// Validação do token
function ensureGitHubAuth() {
  if (!octokit) {
    throw new MCPError(
      ErrorCode.GITHUB_AUTH_FAILED,
      'GitHub não configurado. Configure GITHUB_TOKEN.'
    );
  }
}

// Handlers das ferramentas
export async function handleCreateIssue(params: CreateIssueParams) {
  ensureGitHubAuth();
  const validated = CreateIssueSchema.parse(params);
  
  const response = await octokit!.issues.create({
    owner: validated.owner,
    repo: validated.repo,
    title: validated.title,
    body: validated.body,
    labels: validated.labels,
    assignees: validated.assignees
  });
  
  return successResponse(
    {
      url: response.data.html_url,
      number: response.data.number,
      id: response.data.id
    },
    `Issue #${response.data.number} criada com sucesso`
  );
}

export async function handleListIssues(params: ListIssuesParams) {
  ensureGitHubAuth();
  const validated = ListIssuesSchema.parse(params);
  
  const response = await octokit!.issues.listForRepo({
    owner: validated.owner,
    repo: validated.repo,
    state: validated.state,
    labels: validated.labels?.join(','),
    sort: validated.sort,
    direction: validated.direction,
    per_page: validated.per_page,
    page: validated.page
  });
  
  const issues = response.data.map(issue => ({
    number: issue.number,
    title: issue.title,
    state: issue.state,
    url: issue.html_url,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
    user: issue.user?.login,
    labels: issue.labels.map(l => typeof l === 'string' ? l : l.name)
  }));
  
  return successResponse(
    { issues, total: issues.length },
    `Encontradas ${issues.length} issues`
  );
}

export async function handleCreatePR(params: CreatePRParams) {
  ensureGitHubAuth();
  const validated = CreatePRSchema.parse(params);
  
  const response = await octokit!.pulls.create({
    owner: validated.owner,
    repo: validated.repo,
    title: validated.title,
    head: validated.head,
    base: validated.base,
    body: validated.body,
    draft: validated.draft
  });
  
  return successResponse(
    {
      url: response.data.html_url,
      number: response.data.number,
      id: response.data.id
    },
    `PR #${response.data.number} criado com sucesso`
  );
}

export async function handleCreateRepo(params: CreateRepoParams) {
  ensureGitHubAuth();
  const validated = CreateRepoSchema.parse(params);
  
  const response = await octokit!.repos.createForAuthenticatedUser({
    name: validated.name,
    description: validated.description,
    private: validated.private,
    auto_init: validated.auto_init,
    gitignore_template: validated.gitignore_template,
    license_template: validated.license_template
  });
  
  return successResponse(
    {
      url: response.data.html_url,
      clone_url: response.data.clone_url,
      ssh_url: response.data.ssh_url
    },
    `Repositório '${response.data.name}' criado com sucesso`
  );
}

export async function handlePushFiles(params: PushFilesParams) {
  ensureGitHubAuth();
  const validated = PushFilesSchema.parse(params);
  
  // Obter SHA do branch atual
  const { data: ref } = await octokit!.git.getRef({
    owner: validated.owner,
    repo: validated.repo,
    ref: `heads/${validated.branch}`
  });
  
  const currentCommitSha = ref.object.sha;
  
  // Obter árvore do commit atual
  const { data: currentCommit } = await octokit!.git.getCommit({
    owner: validated.owner,
    repo: validated.repo,
    commit_sha: currentCommitSha
  });
  
  // Criar blobs para cada arquivo
  const blobs = await Promise.all(
    validated.files.map(async (file) => {
      const { data: blob } = await octokit!.git.createBlob({
        owner: validated.owner,
        repo: validated.repo,
        content: file.encoding === 'base64' ? file.content : Buffer.from(file.content).toString('base64'),
        encoding: 'base64'
      });
      
      return {
        path: file.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blob.sha
      };
    })
  );
  
  // Criar nova árvore
  const { data: newTree } = await octokit!.git.createTree({
    owner: validated.owner,
    repo: validated.repo,
    tree: blobs,
    base_tree: currentCommit.tree.sha
  });
  
  // Criar novo commit
  const { data: newCommit } = await octokit!.git.createCommit({
    owner: validated.owner,
    repo: validated.repo,
    message: validated.message,
    tree: newTree.sha,
    parents: [currentCommitSha]
  });
  
  // Atualizar referência do branch
  await octokit!.git.updateRef({
    owner: validated.owner,
    repo: validated.repo,
    ref: `heads/${validated.branch}`,
    sha: newCommit.sha
  });
  
  return successResponse(
    {
      commit_sha: newCommit.sha,
      commit_url: newCommit.html_url,
      files_pushed: validated.files.length
    },
    `${validated.files.length} arquivo(s) enviados com sucesso`
  );
}

export async function handleCommit(params: CommitParams) {
  ensureGitHubAuth();
  const validated = CommitSchema.parse(params);
  
  try {
    // Obter conteúdo atual dos arquivos para determinar se é create ou update
    const fileOps = await Promise.all(
      validated.files.map(async (file) => {
        try {
          // Tentar obter arquivo existente
          const { data: existingFile } = await octokit!.repos.getContent({
            owner: validated.owner,
            repo: validated.repo,
            path: file.path,
            ref: validated.branch
          });
          
          // Se existir, é update
          return {
            ...file,
            sha: Array.isArray(existingFile) ? undefined : existingFile.sha
          };
        } catch (error: any) {
          // Se não existir (404), é create
          if (error.status === 404) {
            return file;
          }
          throw error;
        }
      })
    );
    
    // Criar ou atualizar cada arquivo
    const results = await Promise.all(
      fileOps.map(async (file) => {
        const content = Buffer.from(file.content).toString('base64');
        
        if ('sha' in file && file.sha) {
          // Atualizar arquivo existente
          const { data } = await octokit!.repos.createOrUpdateFileContents({
            owner: validated.owner,
            repo: validated.repo,
            path: file.path,
            message: validated.message,
            content,
            sha: file.sha,
            branch: validated.branch,
            committer: validated.author,
            author: validated.author
          });
          return { path: file.path, action: 'updated', sha: data.content?.sha };
        } else {
          // Criar novo arquivo
          const { data } = await octokit!.repos.createOrUpdateFileContents({
            owner: validated.owner,
            repo: validated.repo,
            path: file.path,
            message: validated.message,
            content,
            branch: validated.branch,
            committer: validated.author,
            author: validated.author
          });
          return { path: file.path, action: 'created', sha: data.content?.sha };
        }
      })
    );
    
    return successResponse(
      {
        message: validated.message,
        branch: validated.branch,
        files: results,
        commit_url: `https://github.com/${validated.owner}/${validated.repo}/commit/${validated.branch}`
      },
      `Commit realizado com sucesso: ${results.length} arquivo(s) modificados`
    );
  } catch (error: any) {
    throw new MCPError(
      ErrorCode.GITHUB_API_ERROR,
      `Erro ao fazer commit: ${error.message}`
    );
  }
}

// Metadados das ferramentas GitHub
export const githubTools = [
  {
    name: 'github_create_issue',
    description: 'Create a new issue in a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        title: { type: 'string', description: 'Issue title' },
        body: { type: 'string', description: 'Issue body' },
        labels: { type: 'array', items: { type: 'string' }, description: 'Issue labels' },
        assignees: { type: 'array', items: { type: 'string' }, description: 'Issue assignees' }
      },
      required: ['owner', 'repo', 'title']
    }
  },
  {
    name: 'github_list_issues',
    description: 'List issues in a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        state: { type: 'string', enum: ['open', 'closed', 'all'], default: 'open' },
        labels: { type: 'array', items: { type: 'string' }, description: 'Filter by labels' },
        sort: { type: 'string', enum: ['created', 'updated', 'comments'] },
        direction: { type: 'string', enum: ['asc', 'desc'] },
        per_page: { type: 'number', minimum: 1, maximum: 100, default: 30 },
        page: { type: 'number', minimum: 1, default: 1 }
      },
      required: ['owner', 'repo']
    }
  },
  {
    name: 'github_create_pr',
    description: 'Create a pull request',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        title: { type: 'string', description: 'PR title' },
        head: { type: 'string', description: 'Head branch' },
        base: { type: 'string', description: 'Base branch', default: 'main' },
        body: { type: 'string', description: 'PR body' },
        draft: { type: 'boolean', description: 'Create as draft', default: false }
      },
      required: ['owner', 'repo', 'title', 'head']
    }
  },
  {
    name: 'github_create_repo',
    description: 'Create a new GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Repository name' },
        description: { type: 'string', description: 'Repository description' },
        private: { type: 'boolean', description: 'Make repository private', default: false },
        auto_init: { type: 'boolean', description: 'Initialize with README', default: true },
        gitignore_template: { type: 'string', description: 'Gitignore template' },
        license_template: { type: 'string', description: 'License template' }
      },
      required: ['name']
    }
  },
  {
    name: 'github_push_files',
    description: 'Push files to a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'File path in repo' },
              content: { type: 'string', description: 'File content' },
              encoding: { type: 'string', enum: ['utf-8', 'base64'], default: 'utf-8' }
            },
            required: ['path', 'content']
          },
          description: 'Array of files to push'
        },
        message: { type: 'string', description: 'Commit message' },
        branch: { type: 'string', description: 'Branch name', default: 'main' }
      },
      required: ['owner', 'repo', 'files', 'message']
    }
  },
  {
    name: 'github_commit',
    description: 'Commit files to a GitHub repository (create or update)',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        message: { type: 'string', description: 'Commit message' },
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'File path' },
              content: { type: 'string', description: 'File content' }
            },
            required: ['path', 'content']
          },
          description: 'Files to commit'
        },
        branch: { type: 'string', description: 'Branch name', default: 'main' },
        author: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Author name' },
            email: { type: 'string', description: 'Author email' }
          },
          description: 'Commit author info'
        }
      },
      required: ['owner', 'repo', 'message', 'files']
    }
  }
];