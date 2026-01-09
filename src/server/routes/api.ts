import { Router } from 'express'
import { 
  loadConfig, 
  saveConfig, 
  updateConfig,
  loadHistory,
  loadReviewResult,
  getAllReviewResults,
  deleteReviewResult,
} from '../../config/index.js'
import { testConnection, getAvailableModels } from '../../ai/index.js'
import { availableModels, providerInfo } from '../../config/schema.js'
import { 
  syncToGist, 
  fetchFromGist, 
  validateGitHubToken, 
  listUserGists 
} from '../../services/gist-sync.js'
import type { AIProvider, AppConfig } from '../../types/index.js'

export const apiRouter = Router()
const MASKED_SECRET = '••••••••'

function toSafeConfig(config: AppConfig): AppConfig {
  return {
    ...config,
    providers: Object.fromEntries(
      Object.entries(config.providers).map(([key, value]) => [
        key,
        {
          ...value,
          apiKey: value.apiKey ? MASKED_SECRET : '',
        },
      ])
    ) as AppConfig['providers'],
    gistSync: config.gistSync
      ? {
          ...config.gistSync,
          token: config.gistSync.token ? MASKED_SECRET : '',
        }
      : undefined,
  }
}

// Get current config
apiRouter.get('/config', (req, res) => {
  try {
    const config = loadConfig()
    res.json({ success: true, data: toSafeConfig(config) })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
})

// Update config
apiRouter.post('/config', (req, res) => {
  try {
    const updates = req.body as Partial<AppConfig>
    const currentConfig = loadConfig()
    
    // Handle API key updates - only update if not masked
    if (updates.providers) {
      for (const [key, value] of Object.entries(updates.providers)) {
        if (value && typeof value === 'object' && 'apiKey' in value) {
          if (value.apiKey === MASKED_SECRET) {
            // Keep existing API key
            (value as { apiKey: string }).apiKey = currentConfig.providers[key as AIProvider]?.apiKey || ''
          }
        }
      }
    }

    // Handle Gist token updates - only update if not masked
    if (updates.gistSync && typeof updates.gistSync === 'object' && 'token' in updates.gistSync) {
      if (updates.gistSync.token === MASKED_SECRET) {
        updates.gistSync.token = currentConfig.gistSync?.token || ''
      }
    }
    
    const newConfig = updateConfig(updates)
    res.json({ success: true, data: toSafeConfig(newConfig) })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
})

// Update specific provider config
apiRouter.put('/config/provider/:provider', (req, res) => {
  try {
    const provider = req.params.provider as AIProvider
    const providerConfig = req.body
    const currentConfig = loadConfig()
    
    // Handle API key - don't overwrite with masked value
    if (providerConfig.apiKey === MASKED_SECRET) {
      providerConfig.apiKey = currentConfig.providers[provider]?.apiKey || ''
    }
    
    const newConfig = updateConfig({
      providers: {
        ...currentConfig.providers,
        [provider]: {
          ...currentConfig.providers[provider],
          ...providerConfig,
        },
      },
    })
    
    res.json({ success: true, data: toSafeConfig(newConfig).providers[provider] })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
})

// Set default provider
apiRouter.put('/config/default-provider', (req, res) => {
  try {
    const { provider } = req.body as { provider: AIProvider }
    const newConfig = updateConfig({ defaultProvider: provider })
    res.json({ success: true, data: toSafeConfig(newConfig) })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
})

// Test provider connection
apiRouter.post('/config/test/:provider', async (req, res) => {
  try {
    const provider = req.params.provider as AIProvider
    const config = loadConfig()
    const { apiKey, model, baseUrl, host, deploymentName, apiVersion } = req.body
    
    // 使用请求中传入的参数进行测试（不保存到配置）
    // API Key
    if (apiKey !== undefined && apiKey !== MASKED_SECRET) {
      config.providers[provider].apiKey = apiKey
    }
    // Model
    if (model) {
      config.providers[provider].model = model
    }
    // Base URL
    if (baseUrl !== undefined) {
      config.providers[provider].baseUrl = baseUrl
    }
    // Ollama Host
    if (host && provider === 'ollama') {
      (config.providers[provider] as { host: string }).host = host
    }
    // Azure specific
    if (provider === 'azure') {
      if (deploymentName) {
        (config.providers[provider] as { deploymentName: string }).deploymentName = deploymentName
      }
      if (apiVersion) {
        (config.providers[provider] as { apiVersion: string }).apiVersion = apiVersion
      }
    }
    
    const result = await testConnection(config, provider)
    res.json({ success: true, data: result })
  } catch (error) {
    res.json({ 
      success: true, 
      data: { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      } 
    })
  }
})

// Get available models for provider
apiRouter.get('/models/:provider', async (req, res) => {
  try {
    const provider = req.params.provider as AIProvider
    const config = loadConfig()
    const models = await getAvailableModels(provider, config)
    res.json({ success: true, data: models })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
})

// Get all available models
apiRouter.get('/models', (req, res) => {
  res.json({ success: true, data: availableModels })
})

// Get provider info
apiRouter.get('/providers', (req, res) => {
  res.json({ success: true, data: providerInfo })
})

// Get review history
apiRouter.get('/history', (req, res) => {
  try {
    const history = loadHistory()
    res.json({ success: true, data: history })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
})

// Get all review results
apiRouter.get('/reviews', (req, res) => {
  try {
    const reviews = getAllReviewResults()
    res.json({ success: true, data: reviews })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
})

// Get specific review result
apiRouter.get('/reviews/:id', (req, res) => {
  try {
    const result = loadReviewResult(req.params.id)
    if (!result) {
      res.status(404).json({ success: false, error: 'Review not found' })
      return
    }
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
})

// Delete review result
apiRouter.delete('/reviews/:id', (req, res) => {
  try {
    const success = deleteReviewResult(req.params.id)
    if (!success) {
      res.status(404).json({ success: false, error: 'Review not found' })
      return
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
})

// Health check
apiRouter.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } })
})

// ============ GitHub Gist 同步 API ============

// 验证 GitHub Token
apiRouter.post('/gist/validate-token', async (req, res) => {
  try {
    const { token } = req.body as { token: string }
    
    if (!token) {
      res.status(400).json({ success: false, error: '缺少 Token' })
      return
    }
    
    const result = await validateGitHubToken(token)
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
})

// 获取用户的 Gist 列表
apiRouter.post('/gist/list', async (req, res) => {
  try {
    const { token } = req.body as { token: string }
    
    if (!token) {
      res.status(400).json({ success: false, error: '缺少 Token' })
      return
    }
    
    const result = await listUserGists(token)
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
})

// 同步配置到 Gist
apiRouter.post('/gist/sync', async (req, res) => {
  try {
    const { token, gistId } = req.body as { token: string; gistId?: string }
    
    if (!token) {
      res.status(400).json({ success: false, error: '缺少 Token' })
      return
    }
    
    const config = loadConfig()
    const result = await syncToGist(config, token, gistId)
    
    if (result.success && result.gistId) {
      // 保存 Gist ID 到配置
      updateConfig({
        gistSync: {
          ...config.gistSync,
          enabled: true,
          gistId: result.gistId,
          lastSyncAt: result.lastSyncAt,
        },
      })
    }
    
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
})

// 从 Gist 恢复配置
apiRouter.post('/gist/restore', async (req, res) => {
  try {
    const { token, gistId } = req.body as { token: string; gistId: string }
    
    if (!token || !gistId) {
      res.status(400).json({ success: false, error: '缺少 Token 或 Gist ID' })
      return
    }
    
    const result = await fetchFromGist(token, gistId)
    
    if (!result.success || !result.config) {
      res.status(400).json({ success: false, error: result.error || '获取配置失败' })
      return
    }
    
    // 获取当前配置中的敏感信息
    const currentConfig = loadConfig()
    
    // 合并配置，保留本地的 token
    const restoredConfig = {
      ...result.config,
      gistSync: {
        ...result.config.gistSync,
        token: currentConfig.gistSync?.token,
        gistId,
        lastSyncAt: new Date().toISOString(),
      },
    }
    
    // 更新配置
    const newConfig = updateConfig(restoredConfig as Partial<AppConfig>)
    
    res.json({ 
      success: true, 
      data: { 
        message: '配置已恢复',
        config: toSafeConfig(newConfig),
      } 
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
})

// 保存 Gist Token（安全存储）
apiRouter.post('/gist/save-token', (req, res) => {
  try {
    const { token, gistId } = req.body as { token: string; gistId?: string }
    const currentConfig = loadConfig()
    
    updateConfig({
      gistSync: {
        ...currentConfig.gistSync,
        enabled: !!token,
        token: token || '',
        gistId: gistId || currentConfig.gistSync?.gistId || '',
      },
    })
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
})
