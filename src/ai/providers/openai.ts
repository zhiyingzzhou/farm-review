import OpenAI from 'openai'
import type { OpenAIConfig } from '../../types/index.js'
import {
  type ReviewOptions,
  type ConnectionTestResult,
  buildPrompts,
  createChatMessages,
  handleError,
  DEFAULT_REVIEW_CONFIG,
} from './base.js'

/**
 * 使用 OpenAI 进行代码审查
 */
export async function reviewWithOpenAI(
  config: OpenAIConfig,
  diff: string,
  options: ReviewOptions = {}
): Promise<string> {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl || 'https://api.openai.com/v1',
    organization: config.organization,
  })

  const { systemPrompt, userPrompt } = buildPrompts(diff, options)
  const messages = createChatMessages(systemPrompt, userPrompt)

  const response = await client.chat.completions.create({
    model: config.model,
    messages,
    temperature: DEFAULT_REVIEW_CONFIG.temperature,
    max_tokens: DEFAULT_REVIEW_CONFIG.maxTokens,
    response_format: { type: 'json_object' },
  })

  return response.choices[0]?.message?.content || ''
}

/**
 * 测试 OpenAI 连接
 */
export async function testOpenAIConnection(
  config: OpenAIConfig
): Promise<ConnectionTestResult> {
  try {
    const client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || 'https://api.openai.com/v1',
      organization: config.organization,
    })

    await client.models.list()
    return { success: true }
  } catch (err) {
    return handleError(err)
  }
}
