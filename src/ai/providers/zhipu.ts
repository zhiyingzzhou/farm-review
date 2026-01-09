import OpenAI from 'openai'
import type { ZhipuConfig } from '../../types/index.js'
import {
  type ReviewOptions,
  type ConnectionTestResult,
  buildPrompts,
  createChatMessages,
  handleError,
  DEFAULT_REVIEW_CONFIG,
} from './base.js'

// 智谱GLM API 兼容 OpenAI 格式
// 文档: https://docs.bigmodel.cn/cn/api/introduction
const ZHIPU_API_BASE = 'https://open.bigmodel.cn/api/paas/v4'

/**
 * 使用智谱 GLM 进行代码审查
 */
export async function reviewWithZhipu(
  config: ZhipuConfig,
  diff: string,
  options: ReviewOptions = {}
): Promise<string> {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl || ZHIPU_API_BASE,
  })

  const { systemPrompt, userPrompt } = buildPrompts(diff, options)
  const messages = createChatMessages(systemPrompt, userPrompt)

  const response = await client.chat.completions.create({
    model: config.model,
    messages,
    temperature: DEFAULT_REVIEW_CONFIG.temperature,
    max_tokens: DEFAULT_REVIEW_CONFIG.maxTokens,
  })

  return response.choices[0]?.message?.content || ''
}

/**
 * 测试智谱 GLM 连接
 */
export async function testZhipuConnection(
  config: ZhipuConfig
): Promise<ConnectionTestResult> {
  try {
    const client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || ZHIPU_API_BASE,
    })

    // 发送一个简单的测试请求
    const response = await client.chat.completions.create({
      model: config.model || 'glm-4-flash',
      messages: [
        { role: 'user', content: '你好' },
      ],
      max_tokens: 10,
    })

    if (response.choices[0]?.message?.content) {
      return { success: true }
    }
    return { success: false, error: JSON.stringify(response) }
  } catch (err) {
    return handleError(err)
  }
}
