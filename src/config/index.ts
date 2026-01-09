import fs from 'fs'
import path from 'path'
import os from 'os'
import type { AppConfig, ReviewHistory, ReviewResult } from '../types/index.js'
import { defaultConfig } from './schema.js'

const CONFIG_DIR = path.join(os.homedir(), '.farm-review')
const LEGACY_CONFIG_DIR = path.join(os.homedir(), '.ai-code-review')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')
const HISTORY_FILE = path.join(CONFIG_DIR, 'history.json')
const REVIEWS_DIR = path.join(CONFIG_DIR, 'reviews')

function migrateLegacyConfigDir(): void {
  if (fs.existsSync(CONFIG_DIR)) return
  if (!fs.existsSync(LEGACY_CONFIG_DIR)) return
  try {
    fs.cpSync(LEGACY_CONFIG_DIR, CONFIG_DIR, { recursive: true })
  } catch {
    // ignore
  }
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((v): v is string => typeof v === 'string')
      .map(v => v.trim())
      .filter(Boolean)
  }
  if (typeof value === 'string') {
    return value
      .split(/\r?\n/)
      .flatMap(line => line.split(','))
      .map(v => v.trim())
      .filter(Boolean)
  }
  return []
}

function normalizeNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
  }
  return fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normalizeConfig(config: AppConfig): AppConfig {
  const next: AppConfig = { ...config }

  const rawReview = isRecord((config as unknown as { review?: unknown }).review)
    ? ((config as unknown as { review: Record<string, unknown> }).review)
    : {}
  const rawIgnorePatterns = rawReview.ignorePatterns
  const normalizedIgnorePatterns = normalizeStringArray(rawIgnorePatterns)
  next.review = {
    ...defaultConfig.review,
    ...(rawReview as unknown as AppConfig['review']),
    language:
      rawReview.language === 'zh' || rawReview.language === 'en'
        ? (rawReview.language as AppConfig['review']['language'])
        : defaultConfig.review.language,
    maxFilesPerReview: normalizeNumber(rawReview.maxFilesPerReview, defaultConfig.review.maxFilesPerReview),
    ignorePatterns:
      rawIgnorePatterns === undefined
        ? defaultConfig.review.ignorePatterns
        : Array.isArray(rawIgnorePatterns) || typeof rawIgnorePatterns === 'string'
          ? normalizedIgnorePatterns
          : defaultConfig.review.ignorePatterns,
    enableSecurityCheck: normalizeBoolean(
      rawReview.enableSecurityCheck,
      defaultConfig.review.enableSecurityCheck
    ),
    enableQualityScore: normalizeBoolean(
      rawReview.enableQualityScore,
      defaultConfig.review.enableQualityScore
    ),
  }

  const rawServer = isRecord((config as unknown as { server?: unknown }).server)
    ? ((config as unknown as { server: Record<string, unknown> }).server)
    : {}
  next.server = {
    ...defaultConfig.server,
    ...(rawServer as unknown as AppConfig['server']),
    port: normalizeNumber(rawServer.port, defaultConfig.server.port),
    autoOpen: normalizeBoolean(rawServer.autoOpen, defaultConfig.server.autoOpen),
  }

  const rawHistory = isRecord((config as unknown as { history?: unknown }).history)
    ? ((config as unknown as { history: Record<string, unknown> }).history)
    : {}
  next.history = {
    ...defaultConfig.history,
    ...(rawHistory as unknown as AppConfig['history']),
    maxRecords: normalizeNumber(rawHistory.maxRecords, defaultConfig.history.maxRecords),
    autoSave: normalizeBoolean(rawHistory.autoSave, defaultConfig.history.autoSave),
  }

  const rawProviders = isRecord((config as unknown as { providers?: unknown }).providers)
    ? ((config as unknown as { providers: Record<string, unknown> }).providers)
    : {}

  next.providers = Object.fromEntries(
    Object.entries(defaultConfig.providers).map(([key, defaults]) => {
      const rawProvider = rawProviders[key]
      const mergedProvider = isRecord(rawProvider)
        ? { ...defaults, ...(rawProvider as Record<string, unknown>) }
        : defaults
      const customModels = normalizeStringArray((mergedProvider as { customModels?: unknown }).customModels)
      return [key, { ...(mergedProvider as typeof defaults), customModels }]
    })
  ) as AppConfig['providers']

  return next
}

export function ensureConfigDir(): void {
  migrateLegacyConfigDir()
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
  if (!fs.existsSync(REVIEWS_DIR)) {
    fs.mkdirSync(REVIEWS_DIR, { recursive: true })
  }
}

export function loadConfig(): AppConfig {
  ensureConfigDir()
  
  if (!fs.existsSync(CONFIG_FILE)) {
    saveConfig(defaultConfig)
    return defaultConfig
  }

  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf-8')
    const config = JSON.parse(content) as Partial<AppConfig>
    // Merge with default config to ensure all fields exist
    const merged = deepMerge(
      defaultConfig as unknown as Record<string, unknown>,
      config as unknown as Record<string, unknown>
    ) as unknown as AppConfig
    return normalizeConfig(merged)
  } catch {
    return defaultConfig
  }
}

export function saveConfig(config: AppConfig): void {
  ensureConfigDir()
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
}

export function updateConfig(updates: Partial<AppConfig>): AppConfig {
  const config = loadConfig()
  const merged = deepMerge(
    config as unknown as Record<string, unknown>,
    updates as unknown as Record<string, unknown>
  ) as unknown as AppConfig
  const newConfig = normalizeConfig(merged)
  saveConfig(newConfig)
  return newConfig
}

export function loadHistory(): ReviewHistory[] {
  ensureConfigDir()
  
  if (!fs.existsSync(HISTORY_FILE)) {
    return []
  }

  try {
    const content = fs.readFileSync(HISTORY_FILE, 'utf-8')
    return JSON.parse(content) as ReviewHistory[]
  } catch {
    return []
  }
}

export function saveHistory(history: ReviewHistory[]): void {
  ensureConfigDir()
  const config = loadConfig()
  // Keep only the last N records
  const trimmedHistory = history.slice(-config.history.maxRecords)
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmedHistory, null, 2), 'utf-8')
}

export function addHistoryRecord(record: ReviewHistory): void {
  const history = loadHistory()
  history.push(record)
  saveHistory(history)
}

export function saveReviewResult(result: ReviewResult): void {
  ensureConfigDir()
  const filePath = path.join(REVIEWS_DIR, `${result.id}.json`)
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8')
}

export function loadReviewResult(id: string): ReviewResult | null {
  const filePath = path.join(REVIEWS_DIR, `${id}.json`)
  if (!fs.existsSync(filePath)) {
    return null
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content) as ReviewResult
  } catch {
    return null
  }
}

export function getAllReviewResults(): ReviewResult[] {
  ensureConfigDir()
  const files = fs.readdirSync(REVIEWS_DIR).filter(f => f.endsWith('.json'))
  const results: ReviewResult[] = []
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(REVIEWS_DIR, file), 'utf-8')
      results.push(JSON.parse(content) as ReviewResult)
    } catch {
      // Skip invalid files
    }
  }
  
  return results.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function deleteHistoryRecord(id: string): boolean {
  const history = loadHistory()
  const nextHistory = history.filter(record => record.id !== id)
  if (nextHistory.length === history.length) {
    return false
  }
  saveHistory(nextHistory)
  return true
}

export function deleteReviewResult(id: string): boolean {
  const filePath = path.join(REVIEWS_DIR, `${id}.json`)
  let deletedReviewFile = false
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    deletedReviewFile = true
  }

  // 同步删除 history.json 中的记录，避免“历史存在但详情 404”
  const deletedHistory = deleteHistoryRecord(id)
  return deletedReviewFile || deletedHistory
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target }
  
  // 首先合并 target 中的所有键（确保新增的 provider 不会丢失）
  for (const key in target) {
    if (!(key in source)) {
      result[key] = target[key]
    } else if (target[key] instanceof Object && source[key] instanceof Object && 
               !Array.isArray(target[key]) && !Array.isArray(source[key])) {
      result[key] = deepMerge(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>
      )
    } else if (source[key] !== undefined) {
      result[key] = source[key]
    }
  }
  
  // 合并 source 中新增的键
  for (const key in source) {
    if (!(key in target)) {
      result[key] = source[key]
    }
  }
  
  return result
}

export { CONFIG_DIR, CONFIG_FILE, HISTORY_FILE, REVIEWS_DIR }
