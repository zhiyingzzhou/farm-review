import type { AIProvider, AppConfig } from '../types/index.js'
import { reviewWithOpenAI, testOpenAIConnection } from './providers/openai.js'
import { reviewWithClaude, testClaudeConnection } from './providers/claude.js'
import { reviewWithGemini, testGeminiConnection } from './providers/gemini.js'
import { reviewWithAzure, testAzureConnection } from './providers/azure.js'
import { reviewWithOllama, testOllamaConnection, listOllamaModels } from './providers/ollama.js'
import { reviewWithZhipu, testZhipuConnection } from './providers/zhipu.js'
import { parseReviewResponse } from './prompts.js'

export interface ReviewOptions {
  language?: 'zh' | 'en'
  customPrompt?: string
  includeSecurityCheck?: boolean
  includeQualityScore?: boolean
}

export async function performReview(
  config: AppConfig,
  diff: string,
  provider?: AIProvider,
  options: ReviewOptions = {}
): Promise<ReturnType<typeof parseReviewResponse>> {
  const selectedProvider = provider || config.defaultProvider
  const providerConfig = config.providers[selectedProvider]

  if (!providerConfig.enabled) {
    throw new Error(`Provider ${selectedProvider} is not enabled. Please configure it first.`)
  }

  const reviewOptions = {
    language: options.language || config.review.language,
    customPrompt: options.customPrompt || config.review.customPrompt,
    includeSecurityCheck: options.includeSecurityCheck ?? config.review.enableSecurityCheck,
    includeQualityScore: options.includeQualityScore ?? config.review.enableQualityScore,
  }

  let response: string

  switch (selectedProvider) {
    case 'openai':
      response = await reviewWithOpenAI(config.providers.openai, diff, reviewOptions)
      break
    case 'claude':
      response = await reviewWithClaude(config.providers.claude, diff, reviewOptions)
      break
    case 'gemini':
      response = await reviewWithGemini(config.providers.gemini, diff, reviewOptions)
      break
    case 'azure':
      response = await reviewWithAzure(config.providers.azure, diff, reviewOptions)
      break
    case 'ollama':
      response = await reviewWithOllama(config.providers.ollama, diff, reviewOptions)
      break
    case 'zhipu':
      response = await reviewWithZhipu(config.providers.zhipu, diff, reviewOptions)
      break
    default:
      throw new Error(`Unknown provider: ${selectedProvider}`)
  }

  const parsed = parseReviewResponse(response)
  return applyReviewToggles(parsed, {
    includeSecurityCheck: reviewOptions.includeSecurityCheck,
    includeQualityScore: reviewOptions.includeQualityScore,
  })
}

function applyReviewToggles(
  result: ReturnType<typeof parseReviewResponse>,
  options: { includeSecurityCheck: boolean; includeQualityScore: boolean }
): ReturnType<typeof parseReviewResponse> {
  const next: ReturnType<typeof parseReviewResponse> = { ...result }

  if (Array.isArray(next.files)) {
    next.files = next.files.map(file => {
      const nextFile = { ...file }

      if (!options.includeQualityScore) {
        delete (nextFile as { qualityScore?: number }).qualityScore
      }

      if (!options.includeSecurityCheck && Array.isArray(nextFile.comments)) {
        nextFile.comments = nextFile.comments.filter(c => c.type !== 'security')
      }

      return nextFile
    })
  }

  if (!options.includeQualityScore) {
    delete (next as { overallScore?: number }).overallScore
  }

  if (!options.includeSecurityCheck) {
    next.securityIssues = []
  } else if (!Array.isArray(next.securityIssues)) {
    // 保持结构稳定，方便前端渲染
    next.securityIssues = []
  }

  return next
}

export async function testConnection(
  config: AppConfig,
  provider: AIProvider
): Promise<{ success: boolean; error?: string }> {
  try {
    let result: { success: boolean; error?: string } = { success: false, error: 'Unknown provider' }
    
    switch (provider) {
      case 'openai':
        result = await testOpenAIConnection(config.providers.openai)
        break
      case 'claude':
        result = await testClaudeConnection(config.providers.claude)
        break
      case 'gemini':
        result = await testGeminiConnection(config.providers.gemini)
        break
      case 'azure':
        result = await testAzureConnection(config.providers.azure)
        break
      case 'ollama':
        result = await testOllamaConnection(config.providers.ollama)
        break
      case 'zhipu':
        result = await testZhipuConnection(config.providers.zhipu)
        break
    }

    return result
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function getAvailableModels(
  provider: AIProvider,
  config?: AppConfig
): Promise<string[]> {
  if (provider === 'ollama' && config) {
    return listOllamaModels(config.providers.ollama.host)
  }
  
  // For other providers, return predefined models
  const { availableModels } = await import('../config/schema.js')
  return availableModels[provider] || []
}

export { parseReviewResponse } from './prompts.js'
