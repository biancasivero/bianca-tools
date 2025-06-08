/**
 * Tools Index
 * 
 * Exporta todas as ferramentas organizadas por categoria
 */

// Puppeteer Tools
export {
  puppeteerTools,
  handleNavigate,
  handleScreenshot,
  handleClick,
  handleType,
  handleGetContent,
  handleOpenBrowser,
  startBrowserCleanup
} from './puppeteer/index.js';

// GitHub Tools  
export {
  githubTools,
  handleCreateIssue,
  handleListIssues,
  handleCreatePR,
  handleCreateRepo,
  handlePushFiles,
  handleCommit
} from './github/index.js';

// Git Local Tools
export {
  gitTools,
  handleGitStatus,
  handleGitCommit,
  handleGitPush,
  handleGitPull
} from './git/index.js';

// Mem0 Memory Tools
export {
  mem0Tools,
  handleAddMemory,
  handleSearchMemory,
  handleListMemories,
  handleDeleteMemories
} from './mem0/index.js';

// Browser Tools
export {
  browserTools,
  handleOpenUrl
} from './browser/index.js';


// Combinar todas as ferramentas
import { puppeteerTools } from './puppeteer/index.js';
import { githubTools } from './github/index.js';
import { gitTools } from './git/index.js';
import { mem0Tools } from './mem0/index.js';
import { browserTools } from './browser/index.js';

export const allTools = [
  ...puppeteerTools,
  ...githubTools,
  ...gitTools,
  ...mem0Tools,
  ...browserTools
];

// Mapa de handlers por nome da ferramenta
import {
  handleNavigate,
  handleScreenshot,
  handleClick,
  handleType,
  handleGetContent,
  handleOpenBrowser
} from './puppeteer/index.js';

import {
  handleCreateIssue,
  handleListIssues,
  handleCreatePR,
  handleCreateRepo,
  handlePushFiles,
  handleCommit
} from './github/index.js';

import {
  handleGitStatus,
  handleGitCommit,
  handleGitPush,
  handleGitPull
} from './git/index.js';

import {
  handleAddMemory,
  handleSearchMemory,
  handleListMemories,
  handleDeleteMemories
} from './mem0/index.js';

import {
  handleOpenUrl
} from './browser/index.js';


export const toolHandlers = {
  // Puppeteer
  'puppeteer_navigate': handleNavigate,
  'puppeteer_screenshot': handleScreenshot,
  'puppeteer_click': handleClick,
  'puppeteer_type': handleType,
  'puppeteer_get_content': handleGetContent,
  'open_browser': handleOpenBrowser,
  
  // GitHub
  'github_create_issue': handleCreateIssue,
  'github_list_issues': handleListIssues,
  'github_create_pr': handleCreatePR,
  'github_create_repo': handleCreateRepo,
  'github_push_files': handlePushFiles,
  'github_commit': handleCommit,
  
  // Git Local
  'git_status': handleGitStatus,
  'git_commit': handleGitCommit,
  'git_push': handleGitPush,
  'git_pull': handleGitPull,
  
  // Mem0 Memory
  'mem0_add_memory': handleAddMemory,
  'mem0_search_memory': handleSearchMemory,
  'mem0_list_memories': handleListMemories,
  'mem0_delete_memories': handleDeleteMemories,
  
  // Browser
  'browser_open_url': handleOpenUrl
} as const;