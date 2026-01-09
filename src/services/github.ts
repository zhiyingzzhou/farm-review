import fs from 'fs'
import type { ReviewResult } from '../types/index.js'

const GITHUB_API_BASE = 'https://api.github.com'
const COMMENT_MARKER = '<!-- farm-review -->'
const LEGACY_COMMENT_MARKER = '<!-- ai-code-review -->'

export interface GitHubCommentOptions {
  repo?: string
  prNumber?: number
  token?: string
  mode?: 'create' | 'update' | 'create-or-update'
}

export interface GitHubCommentResult {
  success: boolean
  url?: string
  error?: string
}

export async function postReviewCommentToGitHub(
  review: ReviewResult,
  options: GitHubCommentOptions = {}
): Promise<GitHubCommentResult> {
  try {
    const context = resolveGitHubContext(options)
    const body = buildGitHubCommentBody(review)
    const mode = options.mode || 'create-or-update'

    if (mode === 'create') {
      return createComment(context, body)
    }

    const existing = await findExistingComment(context)
    if (existing && (mode === 'update' || mode === 'create-or-update')) {
      return updateComment(context, existing.id, body)
    }

    if (mode === 'update') {
      return { success: false, error: '未找到可更新的历史评论' }
    }

    return createComment(context, body)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

function buildGitHubCommentBody(review: ReviewResult): string {
  const lines: string[] = []
  const totalIssues = review.files.reduce((sum, f) => sum + f.comments.length, 0)
  const criticalIssues = review.files.reduce(
    (sum, f) => sum + f.comments.filter(c => c.severity === 'critical').length,
    0
  )

  lines.push(COMMENT_MARKER)
  lines.push('## FARM Review')
  lines.push('')
  lines.push(`- Provider: \`${review.provider}\` (\`${review.model}\`)`)
  lines.push(`- Review ID: \`${review.id}\``)
  if (review.overallScore !== undefined) {
    lines.push(`- Overall Score: **${review.overallScore}/100**`)
  }
  lines.push(`- Issues: **${totalIssues}** (critical: **${criticalIssues}**)`)
  if (review.securityIssues && review.securityIssues.length > 0) {
    lines.push(`- Security Issues: **${review.securityIssues.length}**`)
  }
  lines.push('')
  lines.push('### 总结')
  lines.push('')
  lines.push(truncate(review.summary, 1200))

  const topComments = collectTopComments(review, 10)
  if (topComments.length > 0) {
    lines.push('')
    lines.push('### Top Issues')
    lines.push('')
    for (const c of topComments) {
      const lineRange = c.endLine ? `${c.line}-${c.endLine}` : `${c.line}`
      lines.push(`- \`${c.file}:${lineRange}\` [${c.severity}/${c.type}] ${truncate(c.message, 200)}`)
    }
  }

  if (review.securityIssues && review.securityIssues.length > 0) {
    lines.push('')
    lines.push('### 安全问题')
    lines.push('')
    for (const issue of review.securityIssues.slice(0, 10)) {
      lines.push(`- \`${issue.file}:${issue.line}\` [${issue.severity}] ${issue.type}: ${truncate(issue.description, 200)}`)
    }
    if (review.securityIssues.length > 10) {
      lines.push(`- ... 以及其他 ${review.securityIssues.length - 10} 条`)
    }
  }

  return lines.join('\n')
}

function collectTopComments(review: ReviewResult, limit: number): Array<{
  file: string
  line: number
  endLine?: number
  type: string
  severity: string
  message: string
}> {
  const severityRank: Record<string, number> = { critical: 3, warning: 2, info: 1 }
  const all = review.files.flatMap(f =>
    f.comments.map(c => ({
      file: f.file,
      line: c.line,
      endLine: c.endLine,
      type: c.type,
      severity: c.severity,
      message: c.message,
    }))
  )
  return all
    .sort((a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0))
    .slice(0, limit)
}

function truncate(text: string, maxLen: number): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxLen) return trimmed
  return trimmed.slice(0, maxLen - 3) + '...'
}

function resolveGitHubContext(options: GitHubCommentOptions): { repo: string; prNumber: number; token: string } {
  const token = options.token || process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  if (!token) {
    throw new Error('缺少 GitHub Token（可通过 --github-token 或 GITHUB_TOKEN 提供）')
  }

  const fromEnvRepo = process.env.GITHUB_REPOSITORY
  const repoFromEvent = readRepoFromEvent()
  const repo = options.repo || repoFromEvent || fromEnvRepo
  if (!repo || !repo.includes('/')) {
    throw new Error('缺少 repo 信息（可通过 --github-repo 或 GITHUB_REPOSITORY 提供）')
  }

  const prNumber = options.prNumber ?? readPrNumberFromEvent()
  if (!prNumber || !Number.isFinite(prNumber)) {
    throw new Error('缺少 PR 编号（可通过 --github-pr 或 GITHUB_EVENT_PATH 提供）')
  }

  return { repo, prNumber, token }
}

function readPrNumberFromEvent(): number | null {
  const event = readGitHubEvent()
  if (!event) return null
  if (typeof event.pull_request?.number === 'number') return event.pull_request.number
  if (typeof event.number === 'number') return event.number
  return null
}

function readRepoFromEvent(): string | null {
  const event = readGitHubEvent()
  if (!event) return null
  if (typeof event.repository?.full_name === 'string') return event.repository.full_name
  return null
}

function readGitHubEvent(): any | null {
  const eventPath = process.env.GITHUB_EVENT_PATH
  if (!eventPath) return null
  try {
    const content = fs.readFileSync(eventPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

async function findExistingComment(context: { repo: string; prNumber: number; token: string }): Promise<{ id: number } | null> {
  const url = `${GITHUB_API_BASE}/repos/${context.repo}/issues/${context.prNumber}/comments?per_page=100`
  const res = await fetch(url, { headers: buildHeaders(context.token) })
  if (!res.ok) return null

  const comments = await res.json().catch(() => [])
  if (!Array.isArray(comments)) return null

  const match = comments.find(
    (c: any) =>
      typeof c?.body === 'string' &&
      (c.body.includes(COMMENT_MARKER) || c.body.includes(LEGACY_COMMENT_MARKER))
  )
  if (!match || typeof match.id !== 'number') return null
  return { id: match.id }
}

async function createComment(
  context: { repo: string; prNumber: number; token: string },
  body: string
): Promise<GitHubCommentResult> {
  const url = `${GITHUB_API_BASE}/repos/${context.repo}/issues/${context.prNumber}/comments`
  const res = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(context.token),
    body: JSON.stringify({ body }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    return { success: false, error: `GitHub API 错误: ${res.status} - ${errorData.message || res.statusText}` }
  }

  const data = await res.json().catch(() => ({}))
  return { success: true, url: data.html_url }
}

async function updateComment(
  context: { repo: string; token: string },
  commentId: number,
  body: string
): Promise<GitHubCommentResult> {
  const url = `${GITHUB_API_BASE}/repos/${context.repo}/issues/comments/${commentId}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: buildHeaders(context.token),
    body: JSON.stringify({ body }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    return { success: false, error: `GitHub API 错误: ${res.status} - ${errorData.message || res.statusText}` }
  }

  const data = await res.json().catch(() => ({}))
  return { success: true, url: data.html_url }
}

function buildHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}
