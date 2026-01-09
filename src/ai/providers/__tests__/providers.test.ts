import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { 
  OpenAIConfig, 
  ClaudeConfig, 
  GeminiConfig, 
  AzureConfig, 
  OllamaConfig, 
  ZhipuConfig 
} from '../../../types/index.js'

// Mock 所有 SDK
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: '{"summary": "test"}' } }]
        })
      }
    },
    models: {
      list: vi.fn().mockResolvedValue({ data: [] })
    }
  })),
  AzureOpenAI: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: '{"summary": "test"}' } }]
        })
      }
    }
  }))
}))

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: '{"summary": "test"}' }]
      })
    }
  }))
}))

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: { text: () => '{"summary": "test"}' }
      })
    })
  }))
}))

vi.mock('ollama', () => ({
  Ollama: vi.fn().mockImplementation(() => ({
    chat: vi.fn().mockResolvedValue({
      message: { content: '{"summary": "test"}' }
    }),
    list: vi.fn().mockResolvedValue({
      models: [{ name: 'llama2' }, { name: 'codellama' }]
    })
  }))
}))

describe('AI Providers', () => {
  const sampleDiff = `--- a/file.ts
+++ b/file.ts
@@ -1,3 +1,3 @@
-const a = 1;
+const a = 2;`

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('OpenAI Provider', () => {
    const config: OpenAIConfig = {
      provider: 'openai',
      apiKey: 'test-key',
      model: 'gpt-4',
      enabled: true
    }

    it('应该成功调用 reviewWithOpenAI', async () => {
      const { reviewWithOpenAI } = await import('../openai.js')
      const result = await reviewWithOpenAI(config, sampleDiff)
      
      expect(result).toContain('summary')
    })

    it('应该成功测试连接', async () => {
      const { testOpenAIConnection } = await import('../openai.js')
      const result = await testOpenAIConnection(config)
      
      expect(result.success).toBe(true)
    })
  })

  describe('Claude Provider', () => {
    const config: ClaudeConfig = {
      provider: 'claude',
      apiKey: 'test-key',
      model: 'claude-3-opus-20240229',
      enabled: true
    }

    it('应该成功调用 reviewWithClaude', async () => {
      const { reviewWithClaude } = await import('../claude.js')
      const result = await reviewWithClaude(config, sampleDiff)
      
      expect(result).toContain('summary')
    })

    it('应该成功测试连接', async () => {
      const { testClaudeConnection } = await import('../claude.js')
      const result = await testClaudeConnection(config)
      
      expect(result.success).toBe(true)
    })
  })

  describe('Gemini Provider', () => {
    const config: GeminiConfig = {
      provider: 'gemini',
      apiKey: 'test-key',
      model: 'gemini-pro',
      enabled: true
    }

    it('应该成功调用 reviewWithGemini', async () => {
      const { reviewWithGemini } = await import('../gemini.js')
      const result = await reviewWithGemini(config, sampleDiff)
      
      expect(result).toContain('summary')
    })

    it('应该成功测试连接', async () => {
      const { testGeminiConnection } = await import('../gemini.js')
      const result = await testGeminiConnection(config)
      
      expect(result.success).toBe(true)
    })
  })

  describe('Azure Provider', () => {
    const config: AzureConfig = {
      provider: 'azure',
      apiKey: 'test-key',
      baseUrl: 'https://example.openai.azure.com',
      model: 'gpt-4',
      deploymentName: 'my-deployment',
      apiVersion: '2024-02-01',
      enabled: true
    }

    it('应该成功调用 reviewWithAzure', async () => {
      const { reviewWithAzure } = await import('../azure.js')
      const result = await reviewWithAzure(config, sampleDiff)
      
      expect(result).toContain('summary')
    })

    it('应该成功测试连接', async () => {
      const { testAzureConnection } = await import('../azure.js')
      const result = await testAzureConnection(config)
      
      expect(result.success).toBe(true)
    })
  })

  describe('Ollama Provider', () => {
    const config: OllamaConfig = {
      provider: 'ollama',
      host: 'http://localhost:11434',
      model: 'llama2',
      enabled: true
    }

    it('应该成功调用 reviewWithOllama', async () => {
      const { reviewWithOllama } = await import('../ollama.js')
      const result = await reviewWithOllama(config, sampleDiff)
      
      expect(result).toContain('summary')
    })

    it('应该成功测试连接', async () => {
      const { testOllamaConnection } = await import('../ollama.js')
      const result = await testOllamaConnection(config)
      
      expect(result.success).toBe(true)
    })

    it('应该成功列出模型', async () => {
      const { listOllamaModels } = await import('../ollama.js')
      const models = await listOllamaModels('http://localhost:11434')
      
      expect(models).toContain('llama2')
      expect(models).toContain('codellama')
    })
  })

  describe('Zhipu Provider', () => {
    const config: ZhipuConfig = {
      provider: 'zhipu',
      apiKey: 'test-key',
      model: 'glm-4-flash',
      enabled: true
    }

    it('应该成功调用 reviewWithZhipu', async () => {
      const { reviewWithZhipu } = await import('../zhipu.js')
      const result = await reviewWithZhipu(config, sampleDiff)
      
      expect(result).toContain('summary')
    })

    it('应该成功测试连接', async () => {
      const { testZhipuConnection } = await import('../zhipu.js')
      const result = await testZhipuConnection(config)
      
      expect(result.success).toBe(true)
    })
  })
})

describe('Provider 导出一致性', () => {
  it('所有 provider 应该导出 review 和 testConnection 函数', async () => {
    const openai = await import('../openai.js')
    const claude = await import('../claude.js')
    const gemini = await import('../gemini.js')
    const azure = await import('../azure.js')
    const ollama = await import('../ollama.js')
    const zhipu = await import('../zhipu.js')

    // 检查所有 provider 都导出了 review 函数
    expect(typeof openai.reviewWithOpenAI).toBe('function')
    expect(typeof claude.reviewWithClaude).toBe('function')
    expect(typeof gemini.reviewWithGemini).toBe('function')
    expect(typeof azure.reviewWithAzure).toBe('function')
    expect(typeof ollama.reviewWithOllama).toBe('function')
    expect(typeof zhipu.reviewWithZhipu).toBe('function')

    // 检查所有 provider 都导出了 testConnection 函数
    expect(typeof openai.testOpenAIConnection).toBe('function')
    expect(typeof claude.testClaudeConnection).toBe('function')
    expect(typeof gemini.testGeminiConnection).toBe('function')
    expect(typeof azure.testAzureConnection).toBe('function')
    expect(typeof ollama.testOllamaConnection).toBe('function')
    expect(typeof zhipu.testZhipuConnection).toBe('function')
  })

  it('Ollama 应该额外导出 listOllamaModels', async () => {
    const ollama = await import('../ollama.js')
    expect(typeof ollama.listOllamaModels).toBe('function')
  })
})
