import { AzureOpenAI } from 'openai'
import type { AzureConfig } from '../../types/index.js'
import {
  type ReviewOptions,
  type ConnectionTestResult,
  buildPrompts,
  createChatMessages,
  handleError,
  DEFAULT_REVIEW_CONFIG,
} from './base.js'

/**
 * 使用 Azure OpenAI 进行代码审查
 */
export async function reviewWithAzure(
  config: AzureConfig,
  diff: string,
  options: ReviewOptions = {}
): Promise<string> {
  const client = new AzureOpenAI({
    apiKey: config.apiKey,
    endpoint: config.baseUrl,
    apiVersion: config.apiVersion,
    deployment: config.deploymentName,
  })

  const { systemPrompt, userPrompt } = buildPrompts(diff, options)
  const messages = createChatMessages(systemPrompt, userPrompt)

  const response = await client.chat.completions.create({
    model: config.deploymentName,
    messages,
    temperature: DEFAULT_REVIEW_CONFIG.temperature,
    max_tokens: DEFAULT_REVIEW_CONFIG.maxTokens,
    response_format: { type: 'json_object' },
  })

  return response.choices[0]?.message?.content || ''
}

/**
 * 测试 Azure OpenAI 连接
 */
export async function testAzureConnection(
  config: AzureConfig
): Promise<ConnectionTestResult> {
  try {
    const client = new AzureOpenAI({
      apiKey: config.apiKey,
      endpoint: config.baseUrl,
      apiVersion: config.apiVersion,
      deployment: config.deploymentName,
    })

    await client.chat.completions.create({
      model: config.deploymentName,
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 10,
    })
    return { success: true }
  } catch (err) {
    return handleError(err)
  }
}
