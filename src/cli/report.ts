import { marked } from 'marked'
import type { ReviewResult, ExportFormat } from '../types/index.js'
import { REPORT_HTML_TEMPLATE, REPORT_MARKDOWN_TEMPLATE } from './templates/generated'

export function renderReport(
  result: ReviewResult,
  format: ExportFormat
): { content: string; extension: string } {
  switch (format) {
    case 'markdown':
      return { content: generateMarkdown(result), extension: 'md' }
    case 'html':
      return { content: generateHTML(result), extension: 'html' }
    case 'json':
      return { content: JSON.stringify(result, null, 2), extension: 'json' }
    default:
      return { content: generateMarkdown(result), extension: 'md' }
  }
}

function generateMarkdown(result: ReviewResult): string {
  const content = applyTemplate(REPORT_MARKDOWN_TEMPLATE, {
    title: 'FARM Review 报告',
    metadata: renderMetadataTable(result),
    overall: renderOverallSection(result),
    commits: renderCommitsSection(result),
    security: renderSecuritySection(result),
    files: renderFilesSection(result),
  })

  return normalizeMarkdown(content)
}

function generateHTML(result: ReviewResult): string {
  const markdown = generateMarkdown(result)
  // marked 的类型返回是 string | Promise<string>（当 async=true 时）
  // 我们导出报告需要同步生成，因此显式指定 async=false
  const htmlContent = marked(markdown, { async: false })

  return applyTemplate(REPORT_HTML_TEMPLATE, {
    title: `FARM Review 报告 - ${result.id}`,
    content: htmlContent,
  })
}

function applyTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    if (key in values) return values[key]
    return match
  })
}

function normalizeMarkdown(markdown: string): string {
  return markdown
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()
    .concat('\n')
}

function escapeTableCell(value: string): string {
  return value.replace(/\r?\n/g, '<br>').replace(/\|/g, '\\|')
}

function renderMetadataTable(result: ReviewResult): string {
  const rows: Array<[string, string]> = [
    ['审查 ID', result.id],
    ['生成时间', new Date(result.createdAt).toLocaleString('zh-CN')],
    ['AI 服务', result.provider],
    ['模型', result.model],
  ]

  return [
    '| 字段 | 值 |',
    '| --- | --- |',
    ...rows.map(([label, value]) => `| ${label} | ${escapeTableCell(String(value))} |`),
  ].join('\n')
}

function renderOverallSection(result: ReviewResult): string {
  const scoreLine =
    result.overallScore !== undefined ? `**整体评分：** ${result.overallScore}/100\n\n` : ''
  return `${scoreLine}${(result.summary || '').trim()}`.trim()
}

function renderCommitsSection(result: ReviewResult): string {
  if (!result.commits || result.commits.length === 0) return ''

  const rows = result.commits
    .map(
      c =>
        `| \`${c.shortHash}\` | ${escapeTableCell(c.message)} | ${escapeTableCell(c.author)} | ${new Date(c.date).toLocaleDateString('zh-CN')} |`
    )
    .join('\n')

  return [
    '## 涉及提交',
    '',
    '| Hash | 提交信息 | 作者 | 时间 |',
    '|------|---------|------|------|',
    rows,
    '',
  ].join('\n')
}

function renderSecuritySection(result: ReviewResult): string {
  const issues = result.securityIssues || []
  if (issues.length === 0) return ''

  const blocks = issues.map(issue =>
    [
      `### ${issue.type}`,
      '',
      `- **文件:** \`${issue.file}\``,
      `- **行号:** ${issue.line}`,
      `- **严重程度:** ${issue.severity}`,
      `- **描述:** ${issue.description}`,
      `- **建议:** ${issue.recommendation}`,
      '',
    ].join('\n')
  )

  return ['## 安全问题', '', ...blocks].join('\n')
}

function renderFilesSection(result: ReviewResult): string {
  return result.files.map(renderFileSection).join('\n\n').trim()
}

function renderFileSection(file: ReviewResult['files'][number]): string {
  const parts: string[] = []
  parts.push(`### \`${file.file}\``)
  parts.push('')
  if (file.qualityScore !== undefined) {
    parts.push(`**质量评分：** ${file.qualityScore}/100`)
    parts.push('')
  }
  parts.push((file.summary || '').trim())
  parts.push('')

  if (file.comments.length > 0) {
    parts.push('#### 审查意见')
    parts.push('')
    parts.push(file.comments.map(c => renderCommentBlock(c)).join('\n\n'))
  }

  return parts.join('\n').trim()
}

function renderCommentBlock(comment: ReviewResult['files'][number]['comments'][number]): string {
  const typeLabel = {
    issue: '问题',
    suggestion: '建议',
    security: '安全',
    performance: '性能',
    style: '风格',
    info: '信息',
  }[comment.type] || comment.type

  const severityLabel = {
    critical: '严重',
    warning: '警告',
    info: '提示',
  }[comment.severity]

  const lineRange = comment.endLine ? `${comment.line}-${comment.endLine}` : `${comment.line}`
  const blocks: string[] = [
    `**[${severityLabel}][${typeLabel}] 第 ${lineRange} 行**`,
    '',
    (comment.message || '').trim(),
  ]

  if (comment.code) {
    blocks.push('', '**相关代码：**', '', '```', comment.code.trimEnd(), '```')
  }

  if (comment.suggestion) {
    blocks.push('', '**建议：**', '', '```', comment.suggestion.trimEnd(), '```')
  }

  return blocks.join('\n').trim()
}
