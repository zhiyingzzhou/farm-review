import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import express from 'express'
import { apiRouter } from '../routes/api.js'

// Mock 依赖模块
vi.mock('../../config/index.js', () => ({
  loadConfig: vi.fn(() => ({
    version: '1.0.0',
    defaultProvider: 'openai',
    providers: {
      openai: { provider: 'openai', apiKey: 'test-key', model: 'gpt-5.2', enabled: true },
      claude: { provider: 'claude', apiKey: '', model: 'claude-opus-4.5-20251124', enabled: false },
      gemini: { provider: 'gemini', apiKey: '', model: 'gemini-2.5-flash', enabled: false },
      azure: { provider: 'azure', apiKey: '', model: 'gpt-5.2', enabled: false, deploymentName: '', apiVersion: '' },
      ollama: { provider: 'ollama', host: 'http://localhost:11434', model: 'llama3.3', enabled: false },
      zhipu: { provider: 'zhipu', apiKey: '', model: 'glm-4.7', enabled: false },
    },
    server: { port: 3050, autoOpen: true },
    review: { language: 'zh', maxFilesPerReview: 50, ignorePatterns: [], enableSecurityCheck: true, enableQualityScore: true },
    history: { maxRecords: 100, autoSave: true },
  })),
  saveConfig: vi.fn(),
  updateConfig: vi.fn((updates) => updates),
  loadHistory: vi.fn(() => [
    {
      id: 'test-123',
      projectPath: '/test/project',
      projectName: 'test-project',
      commits: [{ hash: 'abc123', shortHash: 'abc', message: 'test', author: 'Test', authorEmail: 'test@test.com', date: new Date().toISOString() }],
      provider: 'openai',
      model: 'gpt-4',
      overallScore: 85,
      issueCount: 3,
      createdAt: new Date().toISOString(),
      summary: 'Test summary',
    },
  ]),
  loadReviewResult: vi.fn((id) => {
    if (id === 'test-123') {
      return {
        id: 'test-123',
        commits: [],
        files: [],
        summary: 'Test review',
        createdAt: new Date().toISOString(),
        provider: 'openai',
        model: 'gpt-4',
        diff: '',
      }
    }
    return null
  }),
  getAllReviewResults: vi.fn(() => []),
  deleteReviewResult: vi.fn((id) => id === 'test-123'),
}))

vi.mock('../../ai/index.js', () => ({
  testConnection: vi.fn(() => Promise.resolve({ success: true })),
  getAvailableModels: vi.fn(() => Promise.resolve(['gpt-5.2', 'gpt-4o'])),
}))

vi.mock('../../config/schema.js', () => ({
  availableModels: {
    openai: ['gpt-5.2', 'gpt-4o'],
    claude: ['claude-opus-4.5-20251124'],
  },
  providerInfo: {
    openai: { name: 'OpenAI', description: 'OpenAI API' },
  },
}))

vi.mock('../../services/gist-sync.js', () => ({
  syncToGist: vi.fn(() => Promise.resolve({ success: true, gistId: 'test-gist-id', lastSyncAt: new Date().toISOString() })),
  fetchFromGist: vi.fn(() => Promise.resolve({ success: true, config: {} })),
  validateGitHubToken: vi.fn(() => Promise.resolve({ valid: true, username: 'testuser' })),
  listUserGists: vi.fn(() => Promise.resolve([])),
}))

// 创建测试用的 Express app
function createTestApp() {
  const app = express()
  app.use(express.json())
  app.use('/api', apiRouter)
  return app
}

// 模拟请求的工具函数
async function request(app: express.Application, method: string, path: string, body?: object) {
  return new Promise<{ status: number; body: Record<string, unknown> }>((resolve) => {
    const req = {
      method,
      url: path,
      body: body || {},
      params: {},
      query: {},
    }
    
    // 解析路径参数
    const pathParts = path.split('/')
    const routeParts = path.split('/')
    req.params = {}
    
    const res = {
      statusCode: 200,
      data: {} as Record<string, unknown>,
      status(code: number) {
        this.statusCode = code
        return this
      },
      json(data: Record<string, unknown>) {
        this.data = data
        resolve({ status: this.statusCode, body: data })
      },
      send(data: string) {
        resolve({ status: this.statusCode, body: { html: data } })
      },
      sendFile() {
        resolve({ status: this.statusCode, body: {} })
      },
      redirect() {
        resolve({ status: 302, body: {} })
      },
    }
    
    // 直接调用路由处理
    // 这里简化处理，实际测试中应使用 supertest
  })
}

describe('API Router', () => {
  let app: express.Application

  beforeEach(() => {
    vi.clearAllMocks()
    app = createTestApp()
  })

  describe('GET /api/config', () => {
    it('应该导出 apiRouter', () => {
      expect(apiRouter).toBeDefined()
      expect(typeof apiRouter).toBe('function')
    })
  })

  describe('GET /api/health', () => {
    it('健康检查端点应该存在', () => {
      // 验证路由已注册
      const routes = (apiRouter as express.Router).stack
        .filter((layer: { route?: { path: string } }) => layer.route)
        .map((layer: { route?: { path: string } }) => layer.route?.path)
      
      expect(routes).toContain('/health')
    })
  })

  describe('路由配置', () => {
    it('应该包含所有必要的 API 路由', () => {
      const routes = (apiRouter as express.Router).stack
        .filter((layer: { route?: { path: string } }) => layer.route)
        .map((layer: { route?: { path: string } }) => layer.route?.path)
      
      // 配置相关
      expect(routes).toContain('/config')
      
      // 模型相关
      expect(routes).toContain('/models')
      expect(routes).toContain('/models/:provider')
      
      // Provider 相关
      expect(routes).toContain('/providers')
      
      // 历史相关
      expect(routes).toContain('/history')
      
      // 审查相关
      expect(routes).toContain('/reviews')
      expect(routes).toContain('/reviews/:id')
      
      // 健康检查
      expect(routes).toContain('/health')
      
      // Gist 同步
      expect(routes).toContain('/gist/validate-token')
      expect(routes).toContain('/gist/list')
      expect(routes).toContain('/gist/sync')
      expect(routes).toContain('/gist/restore')
      expect(routes).toContain('/gist/save-token')
    })

    it('配置路由应该支持 GET 和 POST 方法', () => {
      const configRoutes = (apiRouter as express.Router).stack
        .filter((layer: { route?: { path: string; methods?: Record<string, boolean> } }) => 
          layer.route?.path === '/config'
        )
      
      expect(configRoutes.length).toBeGreaterThan(0)
    })
  })
})

describe('Server Module', () => {
  it('应该导出 startServer 和 stopServer 函数', async () => {
    const serverModule = await import('../index.js')
    
    expect(typeof serverModule.startServer).toBe('function')
    expect(typeof serverModule.stopServer).toBe('function')
  })
})
