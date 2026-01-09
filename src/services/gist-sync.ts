import type { AppConfig, GistSyncConfig } from '../types/index.js'

const GIST_FILENAME = 'farm-review-config.json'
const GITHUB_API_BASE = 'https://api.github.com'

export interface GistSyncResult {
  success: boolean
  gistId?: string
  gistUrl?: string
  error?: string
  lastSyncAt?: string
}

// 准备导出的配置（移除敏感信息）
function prepareConfigForExport(config: AppConfig): Partial<AppConfig> {
  const exportConfig = JSON.parse(JSON.stringify(config)) as AppConfig
  
  // 保留 API Keys（用户选择同步就包含密钥）
  // 但移除 gistSync 的 token（避免循环）
  if (exportConfig.gistSync) {
    delete exportConfig.gistSync.token
  }
  
  return exportConfig
}

// 创建新的 Gist
export async function createGist(
  config: AppConfig,
  token: string,
  description: string = 'FARM Review 配置备份'
): Promise<GistSyncResult> {
  try {
    const exportConfig = prepareConfigForExport(config)
    
    const response = await fetch(`${GITHUB_API_BASE}/gists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        description,
        public: false,  // 私有 Gist
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(exportConfig, null, 2),
          },
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`GitHub API 错误: ${response.status} - ${errorData.message || response.statusText}`)
    }

    const gist = await response.json()
    
    return {
      success: true,
      gistId: gist.id,
      gistUrl: gist.html_url,
      lastSyncAt: new Date().toISOString(),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }
  }
}

// 更新现有的 Gist
export async function updateGist(
  config: AppConfig,
  token: string,
  gistId: string
): Promise<GistSyncResult> {
  try {
    const exportConfig = prepareConfigForExport(config)
    
    const response = await fetch(`${GITHUB_API_BASE}/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(exportConfig, null, 2),
          },
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // 如果 Gist 不存在，创建新的
      if (response.status === 404) {
        return createGist(config, token)
      }
      
      throw new Error(`GitHub API 错误: ${response.status} - ${errorData.message || response.statusText}`)
    }

    const gist = await response.json()
    
    return {
      success: true,
      gistId: gist.id,
      gistUrl: gist.html_url,
      lastSyncAt: new Date().toISOString(),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }
  }
}

// 同步配置到 Gist（自动判断创建或更新）
export async function syncToGist(
  config: AppConfig,
  token: string,
  gistId?: string
): Promise<GistSyncResult> {
  if (gistId) {
    return updateGist(config, token, gistId)
  }
  return createGist(config, token)
}

// 从 Gist 获取配置
export async function fetchFromGist(
  token: string,
  gistId: string
): Promise<{ success: boolean; config?: Partial<AppConfig>; error?: string }> {
  try {
    const response = await fetch(`${GITHUB_API_BASE}/gists/${gistId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`GitHub API 错误: ${response.status} - ${errorData.message || response.statusText}`)
    }

    const gist = await response.json()
    const file = gist.files[GIST_FILENAME]
    
    if (!file) {
      throw new Error(`Gist 中未找到配置文件: ${GIST_FILENAME}`)
    }

    const config = JSON.parse(file.content) as Partial<AppConfig>
    
    return {
      success: true,
      config,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }
  }
}

// 验证 GitHub Token
export async function validateGitHubToken(token: string): Promise<{ valid: boolean; username?: string; error?: string }> {
  try {
    const response = await fetch(`${GITHUB_API_BASE}/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        return { valid: false, error: 'Token 无效或已过期' }
      }
      return { valid: false, error: `验证失败: ${response.status}` }
    }

    const user = await response.json()
    return { valid: true, username: user.login }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : '网络错误',
    }
  }
}

// 获取用户的所有 Gist（用于选择已有配置）
export async function listUserGists(
  token: string
): Promise<{ success: boolean; gists?: Array<{ id: string; description: string; url: string; hasConfig: boolean }>; error?: string }> {
  try {
    const response = await fetch(`${GITHUB_API_BASE}/gists`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub API 错误: ${response.status}`)
    }

    const gists = await response.json()
    
    const formattedGists = gists.map((gist: { id: string; description: string; html_url: string; files: Record<string, unknown> }) => ({
      id: gist.id,
      description: gist.description || '无描述',
      url: gist.html_url,
      hasConfig: GIST_FILENAME in gist.files,
    }))

    return {
      success: true,
      gists: formattedGists,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }
  }
}
