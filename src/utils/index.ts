import type { AIProvider } from '../types/index.js'

// ============================================================================
// 日期格式化工具
// ============================================================================

/**
 * 格式化为相对时间（如 "刚刚"、"5 分钟前"）
 * 超过 7 天则显示完整日期
 */
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins} 分钟前`
  if (diffHours < 24) return `${diffHours} 小时前`
  if (diffDays < 7) return `${diffDays} 天前`
  
  return date.toLocaleDateString('zh-CN')
}

/**
 * 格式化为本地化日期时间（如 "2025/01/15 14:30"）
 */
export function formatLocalDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ============================================================================
// Provider 工具
// ============================================================================

/**
 * AI Provider 显示名称映射（带 emoji）
 */
const PROVIDER_DISPLAY_NAMES: Record<AIProvider, string> = {
  openai: '🤖 OpenAI',
  claude: '🎭 Anthropic Claude',
  gemini: '💎 Google Gemini',
  azure: '☁️ Azure OpenAI',
  ollama: '🦙 Ollama (本地)',
  zhipu: '智谱',
}

/**
 * 获取 Provider 的用户友好显示名称
 */
export function getProviderDisplayName(provider: AIProvider): string {
  return PROVIDER_DISPLAY_NAMES[provider] || provider
}
