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

// Combinar todas as ferramentas
import { puppeteerTools } from './puppeteer/index.js';
import { githubTools } from './github/index.js';
import { gitTools } from './git/index.js';

export const allTools = [
  ...puppeteerTools,
  ...githubTools,
  ...gitTools
];

// Mapa de handlers por nome da ferramenta
import {
  handleNavigate,
  handleScreenshot,
  handleClick,
  handleType,
  handleGetContent
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

export const toolHandlers = {
  // Puppeteer
  'puppeteer_navigate': handleNavigate,
  'puppeteer_screenshot': handleScreenshot,
  'puppeteer_click': handleClick,
  'puppeteer_type': handleType,
  'puppeteer_get_content': handleGetContent,
  
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
  'git_pull': handleGitPull
} as const;