import { GoogleGenerativeAI } from '@google/generative-ai'
import type { GeminiConfig } from '../../types/index.js'
import {
  type ReviewOptions,
  type ConnectionTestResult,
  buildPrompts,
  handleError,
  DEFAULT_REVIEW_CONFIG,
} from './base.js'

/**
 * 使用 Gemini 进行代码审查
 */
export async function reviewWithGemini(
  config: GeminiConfig,
  diff: string,
  options: ReviewOptions = {}
): Promise<string> {
  const genAI = new GoogleGenerativeAI(config.apiKey || '')
  const model = genAI.getGenerativeModel({
    model: config.model,
    generationConfig: {
      temperature: DEFAULT_REVIEW_CONFIG.temperature,
      maxOutputTokens: DEFAULT_REVIEW_CONFIG.maxTokens,
      responseMimeType: 'application/json',
    },
  }, config.baseUrl ? { baseUrl: config.baseUrl } : undefined)

  const { systemPrompt, userPrompt } = buildPrompts(diff, options)

  const result = await model.generateContent([
    { text: systemPrompt },
    { text: userPrompt },
  ])

  return result.response.text()
}

/**
 * 测试 Gemini 连接
 */
export async function testGeminiConnection(
  config: GeminiConfig
): Promise<ConnectionTestResult> {
  try {
    const genAI = new GoogleGenerativeAI(config.apiKey || '')
    const model = genAI.getGenerativeModel(
      { model: config.model },
      config.baseUrl ? { baseUrl: config.baseUrl } : undefined
    )

    await model.generateContent('Hi')
    return { success: true }
  } catch (err) {
    return handleError(err)
  }
}
