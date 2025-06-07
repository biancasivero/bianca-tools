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
import puppeteer, { Browser, Page } from 'puppeteer';
import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

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
  PushFilesParams
} from './types.js';

import { validateToolInput } from './schemas.js';
import { 
  withRetry, 
  withTimeout, 
  successResponse, 
  errorResponse,
  SimpleCache 
} from './utils.js';

// Load environment variables
dotenv.config();

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
async function ensureBrowser(): Promise<{ browser: Browser; page: Page }> {
  try {
    if (!state.browser || !state.browser.isConnected()) {
      state.browser = await puppeteer.launch({
        headless: CONFIG.puppeteer.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      state.page = await state.browser.newPage();
      
      // Set viewport
      await state.page.setViewport({
        width: CONFIG.puppeteer.viewportWidth,
        height: CONFIG.puppeteer.viewportHeight
      });
      
      // Set default timeout
      state.page.setDefaultTimeout(CONFIG.puppeteer.defaultTimeout);
    }
    
    if (!state.page || state.page.isClosed()) {
      state.page = await state.browser.newPage();
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
function ensureGitHub(): Octokit {
  if (!state.octokit) {
    const token = process.env.GITHUB_TOKEN;
    
    if (!token) {
      throw new MCPError(
        ErrorCode.GITHUB_NOT_INITIALIZED,
        'GitHub token not found. Please set GITHUB_TOKEN environment variable.'
      );
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
  const github = ensureGitHub();
  
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
  const github = ensureGitHub();
  
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
  const github = ensureGitHub();
  
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
  const github = ensureGitHub();
  
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
  const github = ensureGitHub();
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
  [ToolName.GITHUB_PUSH_FILES]: handlePushFiles
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
      console.error('Browser closed due to inactivity');
    } catch (error) {
      console.error('Error closing browser:', error);
    }
  }
}, 60000); // Check every minute

/**
 * Handle graceful shutdown
 */
process.on('SIGINT', async () => {
  console.error('Shutting down...');
  
  if (state.browser) {
    await state.browser.close();
  }
  
  process.exit(0);
});

// ==================== Start Server ====================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error(`${CONFIG.server.name} v${CONFIG.server.version} started`);
  console.error(`Total requests processed: ${state.requestCount}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});