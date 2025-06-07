/**
 * Type definitions for MCP Puppeteer + GitHub Server
 */

import { Browser, Page } from 'puppeteer';
import { Octokit } from '@octokit/rest';

// ==================== Enums ====================

export enum ToolName {
  // Puppeteer Tools
  PUPPETEER_NAVIGATE = 'puppeteer_navigate',
  PUPPETEER_SCREENSHOT = 'puppeteer_screenshot',
  PUPPETEER_CLICK = 'puppeteer_click',
  PUPPETEER_TYPE = 'puppeteer_type',
  PUPPETEER_GET_CONTENT = 'puppeteer_get_content',
  
  // GitHub Tools
  GITHUB_CREATE_ISSUE = 'github_create_issue',
  GITHUB_LIST_ISSUES = 'github_list_issues',
  GITHUB_CREATE_PR = 'github_create_pr',
  GITHUB_CREATE_REPO = 'github_create_repo',
  GITHUB_PUSH_FILES = 'github_push_files'
}

export enum IssueState {
  OPEN = 'open',
  CLOSED = 'closed',
  ALL = 'all'
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// ==================== Configuration Types ====================

export interface ServerConfig {
  name: string;
  version: string;
  description: string;
  logLevel?: LogLevel;
}

export interface PuppeteerConfig {
  headless?: boolean;
  defaultTimeout?: number;
  viewportWidth?: number;
  viewportHeight?: number;
}

export interface GitHubConfig {
  token: string;
  apiVersion?: string;
  baseUrl?: string;
}

// ==================== Tool Parameter Types ====================

// Puppeteer Tool Parameters
export interface NavigateParams {
  url: string;
}

export interface ScreenshotParams {
  path: string;
  fullPage?: boolean;
}

export interface ClickParams {
  selector: string;
}

export interface TypeParams {
  selector: string;
  text: string;
}

// GitHub Tool Parameters
export interface CreateIssueParams {
  owner: string;
  repo: string;
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
}

export interface ListIssuesParams {
  owner: string;
  repo: string;
  state?: IssueState;
  labels?: string[];
  sort?: 'created' | 'updated' | 'comments';
  direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface CreatePRParams {
  owner: string;
  repo: string;
  title: string;
  body?: string;
  head: string;
  base?: string;
  draft?: boolean;
}

export interface CreateRepoParams {
  name: string;
  description?: string;
  private?: boolean;
  auto_init?: boolean;
  gitignore_template?: string;
  license_template?: string;
}

export interface PushFilesParams {
  owner: string;
  repo: string;
  branch?: string;
  files: FileContent[];
  message: string;
}

export interface FileContent {
  path: string;
  content: string;
  encoding?: 'utf-8' | 'base64';
}

// ==================== Response Types ====================

export type ToolResult<T = any> = 
  | { success: true; data: T; content: ContentBlock[] }
  | { success: false; error: MCPError; content: ContentBlock[] };

export interface ContentBlock {
  type: 'text' | 'image' | 'resource';
  text?: string;
  uri?: string;
  mimeType?: string;
}

// ==================== Error Types ====================

export enum ErrorCode {
  // General errors
  UNKNOWN = 'UNKNOWN',
  INVALID_PARAMS = 'INVALID_PARAMS',
  NOT_FOUND = 'NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  
  // Puppeteer errors
  BROWSER_NOT_INITIALIZED = 'BROWSER_NOT_INITIALIZED',
  PAGE_LOAD_FAILED = 'PAGE_LOAD_FAILED',
  ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
  SCREENSHOT_FAILED = 'SCREENSHOT_FAILED',
  
  // GitHub errors
  GITHUB_NOT_INITIALIZED = 'GITHUB_NOT_INITIALIZED',
  GITHUB_AUTH_FAILED = 'GITHUB_AUTH_FAILED',
  GITHUB_API_ERROR = 'GITHUB_API_ERROR',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

export class MCPError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

// ==================== State Management Types ====================

export interface ServerState {
  browser?: Browser;
  page?: Page;
  octokit?: Octokit;
  lastActivity: number;
  requestCount: number;
}

// ==================== Tool Definition Types ====================

export interface ToolDefinition {
  name: ToolName;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: any) => Promise<ToolResult>;
}

// ==================== Type Guards ====================

export function isNavigateParams(params: any): params is NavigateParams {
  return typeof params?.url === 'string';
}

export function isScreenshotParams(params: any): params is ScreenshotParams {
  return typeof params?.path === 'string';
}

export function isCreateIssueParams(params: any): params is CreateIssueParams {
  return (
    typeof params?.owner === 'string' &&
    typeof params?.repo === 'string' &&
    typeof params?.title === 'string'
  );
}

export function isGitHubError(error: any): error is { status: number; message: string } {
  return typeof error?.status === 'number' && typeof error?.message === 'string';
}

export function isMCPError(error: any): error is MCPError {
  return error instanceof MCPError;
}

// ==================== Utility Types ====================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type AsyncReturnType<T extends (...args: any) => Promise<any>> = 
  T extends (...args: any) => Promise<infer U> ? U : never;

export type ExtractToolParams<T extends ToolName> = 
  T extends ToolName.PUPPETEER_NAVIGATE ? NavigateParams :
  T extends ToolName.PUPPETEER_SCREENSHOT ? ScreenshotParams :
  T extends ToolName.PUPPETEER_CLICK ? ClickParams :
  T extends ToolName.PUPPETEER_TYPE ? TypeParams :
  T extends ToolName.GITHUB_CREATE_ISSUE ? CreateIssueParams :
  T extends ToolName.GITHUB_LIST_ISSUES ? ListIssuesParams :
  T extends ToolName.GITHUB_CREATE_PR ? CreatePRParams :
  T extends ToolName.GITHUB_CREATE_REPO ? CreateRepoParams :
  T extends ToolName.GITHUB_PUSH_FILES ? PushFilesParams :
  never;