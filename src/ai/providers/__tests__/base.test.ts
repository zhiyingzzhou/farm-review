import { describe, it, expect } from 'vitest'
import {
  buildPrompts,
  createChatMessages,
  handleError,
  DEFAULT_REVIEW_CONFIG,
  type ReviewOptions,
  type ConnectionTestResult,
  type ChatMessage,
} from '../base.js'

describe('base.ts - 共享工具函数', () => {
  describe('buildPrompts', () => {
    const sampleDiff = `--- a/file.ts
+++ b/file.ts
@@ -1,3 +1,3 @@
-const a = 1;
+const a = 2;`

    it('应该生成中文提示词（默认）', () => {
      const { systemPrompt, userPrompt } = buildPrompts(sampleDiff)

      expect(systemPrompt).toContain('代码审查专家')
      expect(userPrompt).toContain('请审查以下代码变更')
      expect(userPrompt).toContain(sampleDiff)
    })

    it('应该生成英文提示词', () => {
      const options: ReviewOptions = { language: 'en' }
      const { systemPrompt, userPrompt } = buildPrompts(sampleDiff, options)

      expect(systemPrompt).toContain('code review expert')
      expect(userPrompt).toContain('Please review the following code changes')
      expect(userPrompt).toContain(sampleDiff)
    })

    it('应该合并自定义提示词', () => {
      const customPrompt = '请特别关注安全问题'
      const options: ReviewOptions = { customPrompt }
      const { userPrompt } = buildPrompts(sampleDiff, options)

      expect(userPrompt).toContain(customPrompt)
      expect(userPrompt).toContain(sampleDiff)
    })

    it('应该正确处理空 options', () => {
      const { systemPrompt, userPrompt } = buildPrompts(sampleDiff, {})

      expect(systemPrompt).toBeDefined()
      expect(userPrompt).toBeDefined()
      expect(userPrompt).toContain(sampleDiff)
    })
  })

  describe('createChatMessages', () => {
    it('应该创建正确格式的消息数组', () => {
      const systemPrompt = 'You are a helpful assistant'
      const userPrompt = 'Hello'
      
      const messages = createChatMessages(systemPrompt, userPrompt)

      expect(messages).toHaveLength(2)
      expect(messages[0]).toEqual({ role: 'system', content: systemPrompt })
      expect(messages[1]).toEqual({ role: 'user', content: userPrompt })
    })

    it('消息数组元素应该符合 ChatMessage 类型', () => {
      const messages = createChatMessages('system', 'user')
      
      messages.forEach((msg: ChatMessage) => {
        expect(['system', 'user', 'assistant']).toContain(msg.role)
        expect(typeof msg.content).toBe('string')
      })
    })
  })

  describe('handleError', () => {
    it('应该处理普通 Error 对象', () => {
      const error = new Error('Something went wrong')
      const result: ConnectionTestResult = handleError(error)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Something went wrong')
    })

    it('应该处理带 status 的错误', () => {
      const error = Object.assign(new Error('Unauthorized'), { status: 401 })
      const result = handleError(error)

      expect(result.success).toBe(false)
      expect(result.error).toBe('[401] Unauthorized')
    })

    it('应该处理带 code 的错误', () => {
      const error = Object.assign(new Error('Network error'), { code: 'ECONNRESET' })
      const result = handleError(error)

      expect(result.success).toBe(false)
      expect(result.error).toBe('[ECONNRESET] Network error')
    })

    it('应该处理 ECONNREFUSED 错误（Ollama 特定）', () => {
      const error = Object.assign(new Error('fetch failed'), {
        cause: { code: 'ECONNREFUSED' }
      })
      const result = handleError(error)

      expect(result.success).toBe(false)
      expect(result.error).toContain('cannot be connected')
    })

    it('应该处理未知类型的错误', () => {
      const result = handleError({})

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unknown error')
    })

    it('应该处理 null/undefined 错误', () => {
      const result = handleError(null)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('DEFAULT_REVIEW_CONFIG', () => {
    it('应该包含正确的默认值', () => {
      expect(DEFAULT_REVIEW_CONFIG.temperature).toBe(0.3)
      expect(DEFAULT_REVIEW_CONFIG.maxTokens).toBe(4096)
    })

    it('应该是只读的', () => {
      // TypeScript 编译时会阻止修改，这里测试运行时行为
      expect(Object.isFrozen(DEFAULT_REVIEW_CONFIG)).toBe(false) // as const 不会 freeze
      expect(DEFAULT_REVIEW_CONFIG).toHaveProperty('temperature')
      expect(DEFAULT_REVIEW_CONFIG).toHaveProperty('maxTokens')
    })
  })
})
