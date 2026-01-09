/**
 * AI Provider 基础模块
 * 提供共享的类型定义、工具函数和抽象接口
 */

import { REVIEW_SYSTEM_PROMPT_ZH, REVIEW_SYSTEM_PROMPT_EN } from '../prompts.js'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 代码审查选项
 */
export interface ReviewOptions {
  /** 输出语言 */
  language?: 'zh' | 'en'
  /** 自定义提示词 */
  customPrompt?: string
  /** 是否包含安全检测输出 */
  includeSecurityCheck?: boolean
  /** 是否包含质量评分输出 */
  includeQualityScore?: boolean
}

/**
 * 连接测试结果
 */
export interface ConnectionTestResult {
  success: boolean
  error?: string
}

/**
 * 聊天消息格式
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 构建系统提示词和用户提示词
 * @param diff - Git diff 内容
 * @param options - 审查选项
 * @returns 系统提示词和用户提示词
 */
export function buildPrompts(
  diff: string,
  options: ReviewOptions = {}
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = options.language === 'en'
    ? REVIEW_SYSTEM_PROMPT_EN
    : REVIEW_SYSTEM_PROMPT_ZH

  const toggles: string[] = []
  if (options.includeSecurityCheck === false) {
    toggles.push(
      options.language === 'en'
        ? 'No security check for this run: set `securityIssues` to an empty array and do not use `type=security` in comments.'
        : '本次不需要安全检测：`securityIssues` 固定输出空数组，且 comments 中不要使用 `type=security`。'
    )
  }
  if (options.includeQualityScore === false) {
    toggles.push(
      options.language === 'en'
        ? 'No quality scoring for this run: omit `overallScore` and per-file `qualityScore` fields.'
        : '本次不需要质量评分：不要输出 `overallScore` 和每个文件的 `qualityScore` 字段。'
    )
  }

  const reviewRequest = options.language === 'en'
    ? 'Please review the following code changes and output the result in JSON format:'
    : '请审查以下代码变更，并以JSON格式输出结果：'

  const userPrompt = options.customPrompt
    ? `${options.customPrompt}\n\n${reviewRequest}\n\n\`\`\`diff\n${diff}\n\`\`\``
    : `${reviewRequest}\n\n\`\`\`diff\n${diff}\n\`\`\``

  const systemWithToggles = toggles.length > 0
    ? `${systemPrompt}\n\n## 本次审查开关\n${toggles.map(t => `- ${t}`).join('\n')}\n`
    : systemPrompt

  return { systemPrompt: systemWithToggles, userPrompt }
}

/**
 * 创建聊天消息数组
 * @param systemPrompt - 系统提示词
 * @param userPrompt - 用户提示词
 * @returns 消息数组
 */
export function createChatMessages(
  systemPrompt: string,
  userPrompt: string
): ChatMessage[] {
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
}

/**
 * 统一的错误处理函数
 * @param err - 捕获的错误
 * @returns 标准化的连接测试结果
 */
export function handleError(err: unknown): ConnectionTestResult {
  // 处理 null/undefined 情况
  if (err === null || err === undefined) {
    return { success: false, error: 'Unknown error' }
  }

  const error = err as Error & { 
    status?: number
    code?: string
    cause?: { code?: string }
  }
  
  let errorMessage = error.message || 'Unknown error'
  
  // 处理 HTTP 状态码
  if (error.status) {
    errorMessage = `[${error.status}] ${errorMessage}`
  }
  
  // 处理错误代码
  if (error.code) {
    errorMessage = `[${error.code}] ${errorMessage}`
  }
  
  // 处理 Ollama 特定的连接错误
  if (error.cause?.code === 'ECONNREFUSED') {
    errorMessage = 'Service is not running or cannot be connected'
  }
  
  return { success: false, error: errorMessage }
}

/**
 * 默认的审查配置
 */
export const DEFAULT_REVIEW_CONFIG = {
  temperature: 0.3,
  maxTokens: 4096,
} as const
