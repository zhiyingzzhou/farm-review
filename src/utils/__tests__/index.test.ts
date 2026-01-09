import { describe, it, expect } from 'vitest'
import { formatRelativeDate, formatLocalDate, getProviderDisplayName } from '../index.js'

describe('Utils', () => {
  describe('formatRelativeDate', () => {
    it('应该返回"刚刚"', () => {
      const now = new Date()
      expect(formatRelativeDate(now.toISOString())).toBe('刚刚')
    })

    it('应该返回分钟前', () => {
      const now = new Date()
      const d = new Date(now.getTime() - 5 * 60 * 1000)
      expect(formatRelativeDate(d.toISOString())).toBe('5 分钟前')
    })

    it('应该返回小时前', () => {
      const now = new Date()
      const d = new Date(now.getTime() - 2 * 60 * 60 * 1000)
      expect(formatRelativeDate(d.toISOString())).toBe('2 小时前')
    })

    it('应该返回天前', () => {
      const now = new Date()
      const d = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      expect(formatRelativeDate(d.toISOString())).toBe('3 天前')
    })

    it('应该返回完整日期（超过7天）', () => {
      const now = new Date()
      const d = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
      // 这里的具体格式取决于系统 locale，只验证不是相对时间格式
      const result = formatRelativeDate(d.toISOString())
      expect(result).not.toContain('前')
      expect(result).not.toBe('刚刚')
    })
  })

  describe('formatLocalDate', () => {
    it('应该返回格式化的日期字符串', () => {
      const d = new Date('2025-01-01T12:00:00Z')
      const result = formatLocalDate(d.toISOString())
      // 简单验证包含年份
      expect(result).toContain('2025')
    })
  })

  describe('getProviderDisplayName', () => {
    it('应该返回映射的名称', () => {
      expect(getProviderDisplayName('openai')).toBe('🤖 OpenAI')
      expect(getProviderDisplayName('ollama')).toBe('🦙 Ollama (本地)')
    })

    it('未知 provider 应该返回原始 key', () => {
      expect(getProviderDisplayName('unknown' as any)).toBe('unknown')
    })
  })
})
