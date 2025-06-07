#!/usr/bin/env node

/**
 * BiancaTools - MCP Server
 * 
 * A Model Context Protocol server that provides diverse tools including
 * web automation through Puppeteer, GitHub integration, and more capabilities
 * for Claude Code.
 * 
 * @version 2.0.0
 * @license MIT
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

// Lazy loading de dependências pesadas
let puppeteer: any;
let Octokit: any;


// Import custom types and utilities
import {
  ToolName,
  ServerState,
  MCPError,
  ErrorCode,
  NavigateParams,
  ScreenshotParams,
  ClickParams,
  TypeParams,
  CreateIssueParams,
  ListIssuesParams,
  CreatePRParams,
  CreateRepoParams,
  PushFilesParams,
  CommitParams,
  GitStatusParams,
  GitCommitParams,
  GitPushParams,
  GitPullParams
} from './types.js';

import { validateToolInput } from './schemas.js';
import { 
  withRetry, 
  withTimeout, 
  successResponse, 
  errorResponse,
  SimpleCache 
} from './utils.js';

// Import Mem0 handlers
import {
  handleAddMemory,
  handleSearchMemory,
  handleListMemories,
  handleDeleteMemories
} from './tools/mem0/index.js';

// Load environment variables
dotenv.config();

// Promisify exec for async/await
const execAsync = promisify(exec);

// ==================== Configuration ====================

const CONFIG = {
  puppeteer: {
    headless: true,
    defaultTimeout: 30000,
    viewportWidth: 1280,
    viewportHeight: 800
  },
  github: {
    apiVersion: '2022-11-28'
  },
  server: {
    name: 'BiancaTools',
    version: '2.0.0',
    description: 'BiancaTools - Diverse MCP tools for web automation, GitHub, and more'
  },
  cache: {
    ttl: 300000 // 5 minutes
  }
} as const;

// ==================== Server State ====================

const state: ServerState = {
  browser: undefined,
  page: undefined,
  octokit: undefined,
  lastActivity: Date.now(),
  requestCount: 0
};

// Cache for GitHub API responses
const cache = new SimpleCache<any>(CONFIG.cache.ttl);

// ==================== Helper Functions ====================

/**
 * Ensures the Puppeteer browser and page are initialized
 * @returns Browser and page instances
 * @throws {MCPError} If browser initialization fails
 */
async function ensureBrowser(): Promise<{ browser: any; page: any }> {
  try {
    // Lazy load puppeteer apenas quando necessário
    if (!puppeteer) {
      const puppeteerModule = await import('puppeteer');
      puppeteer = puppeteerModule.default;
    }
    
    if (!state.browser || !(state.browser as any).isConnected()) {
      state.browser = await puppeteer.launch({
        headless: CONFIG.puppeteer.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      state.page = await (state.browser as any).newPage();
      
      // Set viewport
      await (state.page as any).setViewport({
        width: CONFIG.puppeteer.viewportWidth,
        height: CONFIG.puppeteer.viewportHeight
      });
      
      // Set default timeout
      (state.page as any).setDefaultTimeout(CONFIG.puppeteer.defaultTimeout);
    }
    
    if (!state.page || (state.page as any).isClosed()) {
      state.page = await (state.browser as any).newPage();
    }
    
    state.lastActivity = Date.now();
    return { browser: state.browser, page: state.page };
  } catch (error) {
    throw new MCPError(
      ErrorCode.BROWSER_NOT_INITIALIZED,
      'Failed to initialize browser',
      error
    );
  }
}

/**
 * Ensures the GitHub client is initialized
 * @returns Octokit instance
 * @throws {MCPError} If GitHub token is missing or invalid
 */
async function ensureGitHub(): Promise<any> {
  if (!state.octokit) {
    const token = process.env.GITHUB_TOKEN;
    
    if (!token) {
      throw new MCPError(
        ErrorCode.GITHUB_NOT_INITIALIZED,
        'GitHub token not found. Please set GITHUB_TOKEN environment variable.'
      );
    }
    
    // Lazy load Octokit apenas quando necessário
    if (!Octokit) {
      const octokitModule = await import('@octokit/rest');
      Octokit = octokitModule.Octokit;
    }
    
    state.octokit = new Octokit({
      auth: token,
      baseUrl: process.env.GITHUB_API_URL,
      userAgent: `${CONFIG.server.name}/${CONFIG.server.version}`
    });
  }
  
  state.lastActivity = Date.now();
  return state.octokit;
}

// ==================== Tool Handlers ====================

/**
 * Navigate to a URL
 * @param params Navigation parameters
 * @returns Success response with navigation confirmation
 */
async function handleNavigate(params: NavigateParams) {
  const { page } = await ensureBrowser();
  
  await withTimeout(
    async () => {
      await page.goto(params.url, { waitUntil: 'networkidle2' });
    },
    CONFIG.puppeteer.defaultTimeout,
    `Navigation to ${params.url} timed out`
  );
  
  return successResponse(null, `Navigated to ${params.url}`);
}

/**
 * Take a screenshot of the current page
 * @param params Screenshot parameters
 * @returns Success response with file path
 */
async function handleScreenshot(params: ScreenshotParams) {
  const { page } = await ensureBrowser();
  
  // Ensure proper file extension
  let path = params.path;
  if (!path.match(/\.(png|jpg|jpeg|webp)$/i)) {
    path = `${path}.png`;
  }
  
  await page.screenshot({
    path: path as any,
    fullPage: params.fullPage
  });
  
  return successResponse({ path }, `Screenshot saved to ${path}`);
}

/**
 * Click on an element
 * @param params Click parameters
 * @returns Success response with confirmation
 */
async function handleClick(params: ClickParams) {
  const { page } = await ensureBrowser();
  
  await withTimeout(
    async () => {
      await page.waitForSelector(params.selector, { visible: true });
      await page.click(params.selector);
    },
    5000,
    `Element ${params.selector} not found or not clickable`
  );
  
  return successResponse(null, `Clicked on element: ${params.selector}`);
}

/**
 * Type text into an element
 * @param params Type parameters
 * @returns Success response with confirmation
 */
async function handleType(params: TypeParams) {
  const { page } = await ensureBrowser();
  
  await withTimeout(
    async () => {
      await page.waitForSelector(params.selector, { visible: true });
      await page.type(params.selector, params.text);
    },
    5000,
    `Element ${params.selector} not found`
  );
  
  return successResponse(null, `Typed text into element: ${params.selector}`);
}

/**
 * Get the HTML content of the current page
 * @returns Success response with page content
 */
async function handleGetContent() {
  const { page } = await ensureBrowser();
  const content = await page.content();
  return successResponse(content);
}

/**
 * Create a GitHub issue
 * @param params Issue parameters
 * @returns Success response with created issue data
 */
async function handleCreateIssue(params: CreateIssueParams) {
  const github = await ensureGitHub();
  
  const response = await withRetry(
    async () => github.issues.create({
      owner: params.owner,
      repo: params.repo,
      title: params.title,
      body: params.body,
      labels: params.labels,
      assignees: params.assignees
    }),
    { retries: 2, delay: 1000 }
  );
  
  return successResponse(response.data, `Issue #${response.data.number} created successfully`);
}

/**
 * List GitHub issues
 * @param params List parameters
 * @returns Success response with issues array
 */
async function handleListIssues(params: ListIssuesParams) {
  const github = await ensureGitHub();
  
  // Use cache for repeated requests
  const cacheKey = `issues:${params.owner}/${params.repo}:${params.state}`;
  
  const response = await cache.getOrCompute(
    cacheKey,
    async () => {
      return await github.issues.listForRepo({
        owner: params.owner,
        repo: params.repo,
        state: params.state as any,
        labels: params.labels?.join(','),
        sort: params.sort,
        direction: params.direction,
        per_page: params.per_page,
        page: params.page
      });
    }
  );
  
  return successResponse(response.data, `Found ${response.data.length} issues`);
}

/**
 * Create a pull request
 * @param params PR parameters
 * @returns Success response with created PR data
 */
async function handleCreatePR(params: CreatePRParams) {
  const github = await ensureGitHub();
  
  const response = await withRetry(
    async () => github.pulls.create({
      owner: params.owner,
      repo: params.repo,
      title: params.title,
      body: params.body,
      head: params.head,
      base: params.base || 'main',
      draft: params.draft
    }),
    { retries: 2, delay: 1000 }
  );
  
  return successResponse(response.data, `Pull request #${response.data.number} created successfully`);
}

/**
 * Create a GitHub repository
 * @param params Repository parameters
 * @returns Success response with created repo data
 */
async function handleCreateRepo(params: CreateRepoParams) {
  const github = await ensureGitHub();
  
  const response = await github.repos.createForAuthenticatedUser({
    name: params.name,
    description: params.description,
    private: params.private,
    auto_init: params.auto_init,
    gitignore_template: params.gitignore_template,
    license_template: params.license_template
  });
  
  return successResponse(response.data, `Repository ${response.data.full_name} created successfully`);
}

/**
 * Push files to a GitHub repository
 * @param params Push parameters
 * @returns Success response with commit details
 */
async function handlePushFiles(params: PushFilesParams) {
  const github = await ensureGitHub();
  const { owner, repo, branch = 'main', files, message } = params;
  
  // Get the latest commit SHA
  const { data: ref } = await github.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`
  });
  const latestCommitSha = ref.object.sha;
  
  // Get the tree SHA
  const { data: commit } = await github.git.getCommit({
    owner,
    repo,
    commit_sha: latestCommitSha
  });
  const treeSha = commit.tree.sha;
  
  // Create blobs for each file
  const blobs = await Promise.all(
    files.map(async (file) => {
      const content = file.encoding === 'base64' 
        ? file.content 
        : Buffer.from(file.content).toString('base64');
        
      const { data: blob } = await github.git.createBlob({
        owner,
        repo,
        content,
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
  
  // Create a new tree
  const { data: newTree } = await github.git.createTree({
    owner,
    repo,
    tree: blobs,
    base_tree: treeSha
  });
  
  // Create a new commit
  const { data: newCommit } = await github.git.createCommit({
    owner,
    repo,
    message,
    tree: newTree.sha,
    parents: [latestCommitSha]
  });
  
  // Update the reference
  await github.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: newCommit.sha
  });
  
  return successResponse(
    { commit: newCommit, files: files.length },
    `Pushed ${files.length} files to ${owner}/${repo}@${branch}`
  );
}

async function handleCommit(params: CommitParams) {
  const validated = await validateToolInput(ToolName.GITHUB_COMMIT, params);
  const { owner, repo, message, files, branch = 'main', author } = validated;
  
  if (!state.octokit) {
    throw new MCPError(ErrorCode.GITHUB_NOT_INITIALIZED, 'GitHub not initialized');
  }
  
  const github = state.octokit;
  
  const results = await Promise.all(
    files.map(async (file) => {
      const content = Buffer.from(file.content).toString('base64');
      
      try {
        // Check if file exists
        const { data: existingFile } = await github.repos.getContent({
          owner,
          repo,
          path: file.path,
          ref: branch
        });
        
        // Update existing file
        const { data } = await github.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: file.path,
          message,
          content,
          sha: Array.isArray(existingFile) ? undefined : existingFile.sha,
          branch,
          committer: author,
          author
        });
        
        return { path: file.path, action: 'updated', sha: data.content?.sha };
      } catch (error: any) {
        if (error.status === 404) {
          // Create new file
          const { data } = await github.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: file.path,
            message,
            content,
            branch,
            committer: author,
            author
          });
          
          return { path: file.path, action: 'created', sha: data.content?.sha };
        }
        throw error;
      }
    })
  );
  
  return successResponse(
    { files: results, message, branch },
    `Committed ${results.length} files to ${owner}/${repo}@${branch}`
  );
}

// ==================== Git Local Handlers ====================

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

async function handleGitStatus(params: GitStatusParams) {
  const validated = await validateToolInput(ToolName.GIT_STATUS, params);
  
  const command = validated.detailed ? 'git status --porcelain -v' : 'git status --porcelain';
  const { stdout } = await executeGitCommand(command);
  
  const files = stdout.split('\n').filter(Boolean).map(line => {
    const parts = line.trim().split(' ');
    const status = parts[0] || '';
    const path = parts.slice(1).join(' ');
    return {
      status: status.trim(),
      path: path
    };
  });
  
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

async function handleGitCommit(params: GitCommitParams) {
  const validated = await validateToolInput(ToolName.GIT_COMMIT, params);
  
  if (validated.addAll) {
    await executeGitCommand('git add -A');
  } else if (validated.files && validated.files.length > 0) {
    const filesStr = validated.files.map(f => `"${f}"`).join(' ');
    await executeGitCommand(`git add ${filesStr}`);
  }
  
  const message = validated.message.replace(/"/g, '\\"');
  const { stdout } = await executeGitCommand(`git commit -m "${message}"`);
  
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

async function handleGitPush(params: GitPushParams) {
  const validated = await validateToolInput(ToolName.GIT_PUSH, params);
  
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
  const output = stdout || stderr;
  
  return successResponse(
    {
      output,
      branch: validated.branch || 'current',
      forced: validated.force
    },
    `Push realizado com sucesso`
  );
}

async function handleGitPull(params: GitPullParams) {
  const validated = await validateToolInput(ToolName.GIT_PULL, params);
  
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

// ==================== Tool Registry ====================

const toolHandlers: Record<ToolName, (args: any) => Promise<any>> = {
  [ToolName.PUPPETEER_NAVIGATE]: handleNavigate,
  [ToolName.PUPPETEER_SCREENSHOT]: handleScreenshot,
  [ToolName.PUPPETEER_CLICK]: handleClick,
  [ToolName.PUPPETEER_TYPE]: handleType,
  [ToolName.PUPPETEER_GET_CONTENT]: handleGetContent,
  [ToolName.GITHUB_CREATE_ISSUE]: handleCreateIssue,
  [ToolName.GITHUB_LIST_ISSUES]: handleListIssues,
  [ToolName.GITHUB_CREATE_PR]: handleCreatePR,
  [ToolName.GITHUB_CREATE_REPO]: handleCreateRepo,
  [ToolName.GITHUB_PUSH_FILES]: handlePushFiles,
  [ToolName.GITHUB_COMMIT]: handleCommit,
  [ToolName.GIT_STATUS]: handleGitStatus,
  [ToolName.GIT_COMMIT]: handleGitCommit,
  [ToolName.GIT_PUSH]: handleGitPush,
  [ToolName.GIT_PULL]: handleGitPull,
  [ToolName.MEM0_ADD_MEMORY]: handleAddMemory,
  [ToolName.MEM0_SEARCH_MEMORY]: handleSearchMemory,
  [ToolName.MEM0_LIST_MEMORIES]: handleListMemories,
  [ToolName.MEM0_DELETE_MEMORIES]: handleDeleteMemories
};

// ==================== Server Setup ====================

const server = new Server(CONFIG.server, {
  capabilities: {
    tools: {}
  }
});

/**
 * Handle tool list requests
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Puppeteer tools
      {
        name: ToolName.PUPPETEER_NAVIGATE,
        description: 'Navigate to a URL',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'URL to navigate to' }
          },
          required: ['url']
        }
      },
      {
        name: ToolName.PUPPETEER_SCREENSHOT,
        description: 'Take a screenshot of the current page',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to save the screenshot' },
            fullPage: { type: 'boolean', description: 'Capture full page', default: false }
          },
          required: ['path']
        }
      },
      {
        name: ToolName.PUPPETEER_CLICK,
        description: 'Click on an element',
        inputSchema: {
          type: 'object',
          properties: {
            selector: { type: 'string', description: 'CSS selector of element to click' }
          },
          required: ['selector']
        }
      },
      {
        name: ToolName.PUPPETEER_TYPE,
        description: 'Type text into an element',
        inputSchema: {
          type: 'object',
          properties: {
            selector: { type: 'string', description: 'CSS selector of element' },
            text: { type: 'string', description: 'Text to type' }
          },
          required: ['selector', 'text']
        }
      },
      {
        name: ToolName.PUPPETEER_GET_CONTENT,
        description: 'Get the HTML content of the current page',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      // GitHub tools
      {
        name: ToolName.GITHUB_CREATE_ISSUE,
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
        name: ToolName.GITHUB_LIST_ISSUES,
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
        name: ToolName.GITHUB_CREATE_PR,
        description: 'Create a pull request',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            title: { type: 'string', description: 'PR title' },
            body: { type: 'string', description: 'PR body' },
            head: { type: 'string', description: 'Head branch' },
            base: { type: 'string', description: 'Base branch', default: 'main' },
            draft: { type: 'boolean', description: 'Create as draft', default: false }
          },
          required: ['owner', 'repo', 'title', 'head']
        }
      },
      {
        name: ToolName.GITHUB_CREATE_REPO,
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
        name: ToolName.GITHUB_PUSH_FILES,
        description: 'Push files to a GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            branch: { type: 'string', description: 'Branch name', default: 'main' },
            files: {
              type: 'array',
              description: 'Array of files to push',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'string', description: 'File path in repo' },
                  content: { type: 'string', description: 'File content' },
                  encoding: { type: 'string', enum: ['utf-8', 'base64'], default: 'utf-8' }
                },
                required: ['path', 'content']
              }
            },
            message: { type: 'string', description: 'Commit message' }
          },
          required: ['owner', 'repo', 'files', 'message']
        }
      },
      {
        name: ToolName.GITHUB_COMMIT,
        description: 'Commit files to a GitHub repository (create or update)',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            message: { type: 'string', description: 'Commit message' },
            files: {
              type: 'array',
              description: 'Files to commit',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'string', description: 'File path' },
                  content: { type: 'string', description: 'File content' }
                },
                required: ['path', 'content']
              }
            },
            branch: { type: 'string', description: 'Branch name', default: 'main' },
            author: {
              type: 'object',
              description: 'Commit author info',
              properties: {
                name: { type: 'string', description: 'Author name' },
                email: { type: 'string', description: 'Author email' }
              }
            }
          },
          required: ['owner', 'repo', 'message', 'files']
        }
      },
      // Git Local tools
      {
        name: ToolName.GIT_STATUS,
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
        name: ToolName.GIT_COMMIT,
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
        name: ToolName.GIT_PUSH,
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
        name: ToolName.GIT_PULL,
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
      },
      // Mem0 Memory tools
      {
        name: ToolName.MEM0_ADD_MEMORY,
        description: 'Adiciona uma nova memória ao sistema de memória persistente local',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'Conteúdo da memória a ser armazenada'
            },
            user_id: {
              type: 'string',
              description: 'ID do usuário'
            },
            metadata: {
              type: 'object',
              description: 'Metadados adicionais para a memória (opcional)'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags para categorizar a memória (opcional)'
            },
            category: {
              type: 'string',
              description: 'Categoria da memória (opcional)'
            }
          },
          required: ['content', 'user_id']
        }
      },
      {
        name: ToolName.MEM0_SEARCH_MEMORY,
        description: 'Busca memórias usando pesquisa semântica',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Consulta para buscar memórias relacionadas'
            },
            user_id: {
              type: 'string',
              description: 'ID do usuário'
            },
            limit: {
              type: 'number',
              description: 'Número máximo de resultados (máximo: 100, padrão: 10)',
              minimum: 1,
              maximum: 100,
              default: 10
            },
            filters: {
              type: 'object',
              description: 'Filtros adicionais para a busca (opcional)'
            }
          },
          required: ['query', 'user_id']
        }
      },
      {
        name: ToolName.MEM0_LIST_MEMORIES,
        description: 'Lista todas as memórias armazenadas para um usuário',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'ID do usuário'
            },
            limit: {
              type: 'number',
              description: 'Número máximo de memórias a listar (máximo: 100, padrão: 50)',
              minimum: 1,
              maximum: 100,
              default: 50
            }
          },
          required: ['user_id']
        }
      },
      {
        name: ToolName.MEM0_DELETE_MEMORIES,
        description: 'Remove memórias do sistema',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'ID do usuário'
            },
            memory_id: {
              type: 'string',
              description: 'ID específico da memória a deletar (se não fornecido, deleta todas do usuário)'
            }
          },
          required: ['user_id']
        }
      }
    ]
  };
});

/**
 * Handle tool execution requests
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  state.requestCount++;
  
  if (!args) {
    return errorResponse(ErrorCode.INVALID_PARAMS, 'No arguments provided');
  }
  
  const toolName = name as ToolName;
  const handler = toolHandlers[toolName];
  
  if (!handler) {
    return errorResponse(ErrorCode.NOT_FOUND, `Tool ${name} not found`);
  }
  
  try {
    // Validate input
    const validatedArgs = validateToolInput(toolName, args);
    
    // Execute handler
    const result = await handler(validatedArgs);
    
    // Ensure we return the expected format
    if (!result.content) {
      result.content = [];
    }
    
    return result;
  } catch (error) {
    if (error instanceof MCPError) {
      return errorResponse(error.code, error.message, error.details);
    }
    
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return errorResponse(ErrorCode.UNKNOWN, message);
  }
});

// ==================== Cleanup and Resource Management ====================

/**
 * Cleanup browser resources after inactivity
 */
setInterval(async () => {
  const inactivityTimeout = 5 * 60 * 1000; // 5 minutes
  
  if (state.browser && Date.now() - state.lastActivity > inactivityTimeout) {
    try {
      await state.browser.close();
      state.browser = undefined;
      state.page = undefined;
      // console.error('Browser closed due to inactivity');
    } catch (error) {
      console.error('Error closing browser:', error);
    }
  }
}, 60000); // Check every minute

/**
 * Handle graceful shutdown
 */
process.on('SIGINT', async () => {
  // console.error('Shutting down...');
  
  if (state.browser) {
    await state.browser.close();
  }
  
  process.exit(0);
});

// ==================== Start Server ====================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Não logar nada no início para não interferir com o MCP
  // console.error(`${CONFIG.server.name} v${CONFIG.server.version} started`);
  // console.error(`Total requests processed: ${state.requestCount}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});