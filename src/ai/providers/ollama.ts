import { Ollama } from 'ollama'
import type { OllamaConfig } from '../../types/index.js'
import {
  type ReviewOptions,
  type ConnectionTestResult,
  buildPrompts,
  createChatMessages,
  handleError,
  DEFAULT_REVIEW_CONFIG,
} from './base.js'

/**
 * 使用 Ollama 进行代码审查
 */
export async function reviewWithOllama(
  config: OllamaConfig,
  diff: string,
  options: ReviewOptions = {}
): Promise<string> {
  const ollama = new Ollama({ host: config.host })

  const { systemPrompt, userPrompt } = buildPrompts(diff, options)
  const messages = createChatMessages(systemPrompt, userPrompt)

  const response = await ollama.chat({
    model: config.model,
    messages,
    format: 'json',
    options: {
      temperature: DEFAULT_REVIEW_CONFIG.temperature,
    },
  })

  return response.message.content
}

/**
 * 测试 Ollama 连接
 */
export async function testOllamaConnection(
  config: OllamaConfig
): Promise<ConnectionTestResult> {
  try {
    const ollama = new Ollama({ host: config.host })
    await ollama.list()
    return { success: true }
  } catch (err) {
    return handleError(err)
  }
}

/**
 * 列出 Ollama 可用的模型
 */
export async function listOllamaModels(host: string): Promise<string[]> {
  try {
    const ollama = new Ollama({ host })
    const response = await ollama.list()
    return response.models.map(m => m.name)
  } catch {
    return []
  }
}
