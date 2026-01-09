import Anthropic from '@anthropic-ai/sdk'
import type { ClaudeConfig } from '../../types/index.js'
import {
  type ReviewOptions,
  type ConnectionTestResult,
  buildPrompts,
  handleError,
  DEFAULT_REVIEW_CONFIG,
} from './base.js'

/**
 * 使用 Claude 进行代码审查
 */
export async function reviewWithClaude(
  config: ClaudeConfig,
  diff: string,
  options: ReviewOptions = {}
): Promise<string> {
  const client = new Anthropic({
    apiKey: config.apiKey,
    baseURL: config.baseUrl || 'https://api.anthropic.com',
  })

  const { systemPrompt, userPrompt } = buildPrompts(diff, options)

  const response = await client.messages.create({
    model: config.model,
    max_tokens: DEFAULT_REVIEW_CONFIG.maxTokens,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt },
    ],
  })

  const textBlock = response.content.find(block => block.type === 'text')
  return textBlock?.type === 'text' ? textBlock.text : ''
}

/**
 * 测试 Claude 连接
 */
export async function testClaudeConnection(
  config: ClaudeConfig
): Promise<ConnectionTestResult> {
  try {
    const client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || 'https://api.anthropic.com',
    })

    await client.messages.create({
      model: config.model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }],
    })
    return { success: true }
  } catch (err) {
    return handleError(err)
  }
}
