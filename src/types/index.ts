// AI Provider Types
export type AIProvider = 'openai' | 'claude' | 'gemini' | 'azure' | 'ollama' | 'zhipu'

export interface AIProviderConfig {
  provider: AIProvider
  apiKey?: string
  baseUrl?: string
  model: string
  customModels?: string[]  // 用户自定义的模型列表
  enabled: boolean
}

export interface OpenAIConfig extends AIProviderConfig {
  provider: 'openai'
  organization?: string
}

export interface ClaudeConfig extends AIProviderConfig {
  provider: 'claude'
}

export interface GeminiConfig extends AIProviderConfig {
  provider: 'gemini'
}

export interface AzureConfig extends AIProviderConfig {
  provider: 'azure'
  deploymentName: string
  apiVersion: string
}

export interface OllamaConfig extends AIProviderConfig {
  provider: 'ollama'
  host: string  // Ollama 使用 host 而不是 baseUrl
}

export interface ZhipuConfig extends AIProviderConfig {
  provider: 'zhipu'
}

// GitHub Gist Sync Types
export interface GistSyncConfig {
  enabled: boolean
  gistId?: string          // 已同步的 Gist ID
  token?: string           // GitHub Personal Access Token
  autoSync?: boolean       // 是否自动同步
  lastSyncAt?: string      // 上次同步时间
}

// Config Types
export interface AppConfig {
  version: string
  defaultProvider: AIProvider
  providers: {
    openai: OpenAIConfig
    claude: ClaudeConfig
    gemini: GeminiConfig
    azure: AzureConfig
    ollama: OllamaConfig
    zhipu: ZhipuConfig
  }
  server: {
    port: number
    autoOpen: boolean
  }
  review: {
    language: 'zh' | 'en'
    maxFilesPerReview: number
    ignorePatterns: string[]
    customPrompt?: string
    enableSecurityCheck: boolean
    enableQualityScore: boolean
  }
  history: {
    maxRecords: number
    autoSave: boolean
  }
  gistSync?: GistSyncConfig  // GitHub Gist 同步配置
}

// Git Types
export interface GitCommit {
  hash: string
  shortHash: string
  message: string
  author: string
  authorEmail: string
  date: string
  branch?: string
}

export interface GitDiff {
  oldFile: string
  newFile: string
  hunks: GitHunk[]
  status: 'added' | 'deleted' | 'modified' | 'renamed'
}

export interface GitHunk {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  content: string
}

export interface GitBranch {
  name: string
  current: boolean
  commit: string
}

// Review Types
export interface ReviewRequest {
  commits: string[]
  provider?: AIProvider
  includeSecurityCheck?: boolean
  includeQualityScore?: boolean
}

export interface ReviewComment {
  id: string
  file: string
  line: number
  endLine?: number
  type: 'issue' | 'suggestion' | 'security' | 'performance' | 'style' | 'info'
  severity: 'critical' | 'warning' | 'info'
  message: string
  suggestion?: string
  code?: string
}

export interface FileReview {
  file: string
  comments: ReviewComment[]
  summary: string
  qualityScore?: number
}

export interface ReviewResult {
  id: string
  commits: GitCommit[]
  files: FileReview[]
  summary: string
  overallScore?: number
  securityIssues?: SecurityIssue[]
  createdAt: string
  provider: AIProvider
  model: string
  diff: string
}

export interface SecurityIssue {
  id: string
  file: string
  line: number
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  recommendation: string
}

// History Types
export interface ReviewHistory {
  id: string
  projectPath: string
  projectName: string
  commits: GitCommit[]
  provider: AIProvider
  model: string
  overallScore?: number
  issueCount: number
  createdAt: string
  summary: string
}

// API Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// Export Report Types
export type ExportFormat = 'markdown' | 'html' | 'json'

export interface ExportOptions {
  format: ExportFormat
  includeDiff: boolean
  includeComments: boolean
  includeSummary: boolean
}

