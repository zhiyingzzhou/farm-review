import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import ora from 'ora'
import inquirer from 'inquirer'
import open from 'open'
import { nanoid } from 'nanoid'
import { GitService } from '../../git/index.js'
import { processDiffForReview, createDiffBatchesForReview } from '../../git/diff-utils.js'
import { loadConfig, saveReviewResult, addHistoryRecord } from '../../config/index.js'
import { performReview } from '../../ai/index.js'
import { startServer } from '../../server/index.js'
import { formatRelativeDate, getProviderDisplayName } from '../../utils/index.js'
import { postReviewCommentToGitHub } from '../../services/github.js'
import { renderReport } from '../report.js'
import type { AIProvider, ReviewResult, ReviewHistory, GitCommit, ExportFormat } from '../../types/index.js'

interface ReviewOptions {
  commits?: string
  range?: string
  base?: string
  head?: string
  provider?: AIProvider
  count: string
  port: string
  open: boolean
  ui: boolean
  failOn: string
  format?: ExportFormat
  output?: string
  comment?: boolean
  commentMode?: string
  githubRepo?: string
  githubPr?: string
  githubToken?: string
  allFiles?: boolean
  batchSize?: string
}

export async function reviewCommand(options: ReviewOptions): Promise<void> {
  const config = loadConfig()
  const git = new GitService()

  // Check if current directory is a git repo
  const isRepo = await git.isGitRepo()
  if (!isRepo) {
    console.log(chalk.red('\n❌ 当前目录不是 Git 仓库，请在 Git 仓库中执行此命令\n'))
    process.exit(1)
  }

  // Show current branch and recent commits
  const currentBranch = await git.getCurrentBranch()
  const projectName = await git.getProjectName()
  
  console.log(chalk.cyan('\n═'.repeat(50)))
  console.log(chalk.cyan.bold('  📊 当前仓库信息'))
  console.log(chalk.cyan('═'.repeat(50)))
  console.log(chalk.white(`  项目名称: ${chalk.yellow.bold(projectName)}`))
  console.log(chalk.white(`  当前分支: ${chalk.green.bold(currentBranch)}`))
  console.log()

  const isRangeMode = Boolean(options.range || options.base || options.head)
  if (isRangeMode && options.commits) {
    console.log(chalk.red('\n❌ `--range/--base/--head` 不能与 `--commits` 同时使用\n'))
    process.exit(1)
  }

  let selectedCommits: GitCommit[] = []
  let diffSource: { type: 'commits'; commitHashes: string[] } | { type: 'range'; range: string }

  if (isRangeMode) {
    let rangeInfo: { range: string; baseRef: string; headRef: string; isTripleDots: boolean }
    try {
      rangeInfo = resolveRangeOptions(options)
    } catch (error) {
      console.log(chalk.red(`\n❌ ${error instanceof Error ? error.message : '无效的范围参数'}\n`))
      process.exit(1)
    }
    const { range, baseRef, headRef, isTripleDots } = rangeInfo

    console.log(chalk.green(`\n✓ 将审查范围: ${chalk.yellow(range)}\n`))
    diffSource = { type: 'range', range }

    try {
      const fromRef = isTripleDots ? await git.getMergeBase(baseRef, headRef) : baseRef
      const commits = await git.getCommitsBetween(fromRef, headRef)
      selectedCommits = commits.map(c => ({ ...c, branch: currentBranch }))
      if (selectedCommits.length > 0) {
        console.log(chalk.gray(`  - 该范围包含 ${selectedCommits.length} 个提交`))
      }
    } catch {
      // 获取提交列表失败不应阻塞 diff 审查
      selectedCommits = []
    }
  } else {
    // Select commits to review
    if (options.commits) {
      // Use specified commits (不受 --count 限制)
      const commitRefs = Array.from(
        new Set(
          options.commits
            .split(',')
            .map(c => c.trim())
            .filter(Boolean)
        )
      )

      if (commitRefs.length === 0) {
        console.log(chalk.red('\n❌ 没有提供有效的提交 Hash\n'))
        process.exit(1)
      }

      const resolvedCommits: GitCommit[] = []
      const missingRefs: string[] = []

      for (const ref of commitRefs) {
        const commit = await git.getCommit(ref)
        if (!commit) {
          missingRefs.push(ref)
          continue
        }
        resolvedCommits.push({ ...commit, branch: currentBranch })
      }

      if (missingRefs.length > 0) {
        console.log(chalk.red(`\n❌ 未找到以下提交: ${missingRefs.join(', ')}\n`))
        process.exit(1)
      }

      selectedCommits = resolvedCommits
    } else {
      // Get recent commits for interactive selection
      const commitCount = parseInt(options.count) || 10
      const recentCommits = await git.getRecentCommits(commitCount)

      if (recentCommits.length === 0) {
        console.log(chalk.red('\n❌ 没有找到提交记录\n'))
        process.exit(1)
      }

      // Interactive selection
      const choices = recentCommits.map(commit => ({
        name: `${chalk.yellow(commit.shortHash)} - ${commit.message.substring(0, 50)}${commit.message.length > 50 ? '...' : ''} ${chalk.gray(`(${commit.author}, ${formatRelativeDate(commit.date)})`)}`,
        value: commit,
        short: commit.shortHash,
      }))

      const { commits } = await inquirer.prompt<{ commits: GitCommit[] }>([
        {
          type: 'checkbox',
          name: 'commits',
          message: '请选择要审查的提交 (空格选择，回车确认):',
          choices,
          pageSize: 15,
          validate: (answer: GitCommit[]) => {
            if (answer.length === 0) {
              return '请至少选择一个提交'
            }
            return true
          },
        },
      ])

      selectedCommits = commits
    }

    if (selectedCommits.length === 0) {
      console.log(chalk.red('\n❌ 没有选择任何提交\n'))
      process.exit(1)
    }

    console.log(chalk.green(`\n✓ 已选择 ${selectedCommits.length} 个提交进行审查\n`))
    diffSource = { type: 'commits', commitHashes: selectedCommits.map(c => c.hash) }
  }

  // Select AI provider
  let provider = options.provider as AIProvider
  
  if (!provider) {
    // Get enabled providers
    const enabledProviders = Object.entries(config.providers)
      .filter(([_, cfg]) => cfg.enabled)
      .map(([name]) => name)

    if (enabledProviders.length === 0) {
      console.log(chalk.red('\n❌ 没有配置任何 AI 服务，请先运行 `farm-review config` 进行配置\n'))
      process.exit(1)
    }

    if (enabledProviders.length === 1) {
      provider = enabledProviders[0] as AIProvider
    } else {
      const { selectedProvider } = await inquirer.prompt<{ selectedProvider: AIProvider }>([
        {
          type: 'list',
          name: 'selectedProvider',
          message: '请选择 AI 服务:',
          choices: enabledProviders.map(p => ({
            name: getProviderDisplayName(p as AIProvider),
            value: p,
          })),
          default: config.defaultProvider,
        },
      ])
      provider = selectedProvider
    }
  }

  console.log(chalk.blue(`\n🤖 使用 ${getProviderDisplayName(provider)} 进行代码审查...\n`))

  // Get diff
  const spinner = ora('正在获取代码变更...').start()
  
  try {
    const rawDiff = diffSource.type === 'range'
      ? await git.getDiffForRange(diffSource.range)
      : await git.getDiff(diffSource.commitHashes)
    
    if (!rawDiff || rawDiff.trim().length === 0) {
      spinner.fail(chalk.red('没有找到代码变更'))
      process.exit(1)
    }

    const reviewAllFiles = Boolean(options.allFiles)
    const batchSize = Number.isFinite(Number.parseInt(options.batchSize || '', 10))
      ? Number.parseInt(options.batchSize || '', 10)
      : config.review.maxFilesPerReview

    const diffBatches = reviewAllFiles
      ? createDiffBatchesForReview(rawDiff, {
          ignorePatterns: config.review.ignorePatterns,
          maxFiles: batchSize,
        })
      : null

    const processed = !reviewAllFiles
      ? processDiffForReview(rawDiff, {
          ignorePatterns: config.review.ignorePatterns,
          maxFiles: config.review.maxFilesPerReview,
        })
      : null

    if (reviewAllFiles) {
      if (!diffBatches || diffBatches.totalFileCount === 0 || diffBatches.batches.length === 0) {
        spinner.fail(chalk.red('变更内容已被忽略规则过滤，请调整 ignorePatterns'))
        process.exit(1)
      }

      spinner.succeed(
        chalk.green(
          `获取到 ${diffBatches.totalFileCount} 个文件的变更 (+${diffBatches.insertions} -${diffBatches.deletions})`
        )
      )
      if (diffBatches.ignoredFileCount > 0) {
        console.log(chalk.gray(`  - 已按 ignorePatterns 忽略 ${diffBatches.ignoredFileCount} 个文件`))
      }
      if (diffBatches.batches.length > 1) {
        console.log(chalk.gray(`  - 已分批审查：${diffBatches.batches.length} 批（batchSize=${batchSize}）`))
      }
    } else {
      if (!processed || !processed.diff || processed.diff.trim().length === 0) {
        spinner.fail(chalk.red('变更内容已被忽略规则过滤，请调整 ignorePatterns 或 maxFilesPerReview'))
        process.exit(1)
      }

      spinner.succeed(chalk.green(`获取到 ${processed.fileCount} 个文件的变更 (+${processed.insertions} -${processed.deletions})`))
      if (processed.ignoredFileCount > 0) {
        console.log(chalk.gray(`  - 已按 ignorePatterns 忽略 ${processed.ignoredFileCount} 个文件`))
      }
      if (processed.trimmedFileCount > 0) {
        console.log(chalk.gray(`  - 超过 maxFilesPerReview，已裁剪 ${processed.trimmedFileCount} 个文件`))
      }
    }

    // Perform review
    spinner.start('正在进行 AI 代码审查...')

    const reviewOptions = {
      language: config.review.language,
      customPrompt: config.review.customPrompt,
      includeSecurityCheck: config.review.enableSecurityCheck,
      includeQualityScore: config.review.enableQualityScore,
    } as const

    const reviewResult = reviewAllFiles && diffBatches
      ? await performReviewInBatches(config, provider, diffBatches.batches, spinner, reviewOptions)
      : await performReview(config, (processed as { diff: string }).diff, provider, reviewOptions)

    spinner.succeed(chalk.green('代码审查完成！'))

    // Create review result
    const reviewId = nanoid(10)
    const result: ReviewResult = {
      id: reviewId,
      commits: selectedCommits,
      files: reviewResult.files.map(f => ({
        file: f.file,
        comments: f.comments.map(c => ({
          id: nanoid(8),
          file: f.file,
          line: c.line,
          endLine: c.endLine,
          type: c.type as 'issue' | 'suggestion' | 'security' | 'performance' | 'style' | 'info',
          severity: c.severity as 'critical' | 'warning' | 'info',
          message: c.message,
          suggestion: c.suggestion,
          code: c.code,
        })),
        summary: f.summary,
        qualityScore: f.qualityScore,
      })),
      summary: reviewResult.summary,
      overallScore: reviewResult.overallScore,
      securityIssues: reviewResult.securityIssues?.map(s => ({
        id: nanoid(8),
        file: s.file,
        line: s.line,
        type: s.type,
        severity: s.severity as 'critical' | 'high' | 'medium' | 'low',
        description: s.description,
        recommendation: s.recommendation,
      })),
      createdAt: new Date().toISOString(),
      provider,
      model: config.providers[provider].model,
      diff: reviewAllFiles && diffBatches
        ? diffBatches.batches.map(b => b.diff.trimEnd()).join('\n')
        : (processed as { diff: string }).diff,
    }

    // Save result
    saveReviewResult(result)

    // Add to history
    const historyRecord: ReviewHistory = {
      id: reviewId,
      projectPath: process.cwd(),
      projectName,
      commits: selectedCommits,
      provider,
      model: config.providers[provider].model,
      overallScore: reviewResult.overallScore,
      issueCount: reviewResult.files.reduce((sum, f) => sum + f.comments.length, 0),
      createdAt: new Date().toISOString(),
      summary: reviewResult.summary,
    }

    if (config.history.autoSave) {
      addHistoryRecord(historyRecord)
    }

    // Show summary
    console.log(chalk.cyan('\n═'.repeat(50)))
    console.log(chalk.cyan.bold('  📝 审查结果摘要'))
    console.log(chalk.cyan('═'.repeat(50)))
    
    if (reviewResult.overallScore !== undefined) {
      const scoreColor = reviewResult.overallScore >= 80 ? chalk.green : 
                         reviewResult.overallScore >= 60 ? chalk.yellow : chalk.red
      console.log(chalk.white(`  整体评分: ${scoreColor.bold(reviewResult.overallScore + '/100')}`))
    }
    
    console.log(chalk.white(`  审查文件: ${chalk.yellow(result.files.length)} 个`))
    console.log(chalk.white(`  发现问题: ${chalk.yellow(historyRecord.issueCount)} 个`))
    
    if (result.securityIssues && result.securityIssues.length > 0) {
      console.log(chalk.red(`  安全问题: ${result.securityIssues.length} 个`))
    }
    
    console.log(chalk.white(`\n  ${reviewResult.summary.substring(0, 200)}${reviewResult.summary.length > 200 ? '...' : ''}`))

    // Optional export
    await exportIfNeeded(result, options)

    // Optional UI
    const shouldStartUi = options.ui !== false
    if (shouldStartUi) {
      const port = parseInt(options.port) || config.server.port
      const baseUrl = `http://127.0.0.1:${port}`
      
      console.log(chalk.blue('\n🚀 启动结果查看服务...\n'))
      
      await startServer(port)
      
      const resultUrl = `${baseUrl}/review/${reviewId}`
      console.log(chalk.cyan('═'.repeat(50)))
      console.log(chalk.cyan.bold('  🎉 查看详细审查结果'))
      console.log(chalk.cyan('═'.repeat(50)))
      console.log(chalk.white(`\n  访问地址: ${chalk.yellow.bold(resultUrl)}`))
      console.log(chalk.gray('\n  提示: 按 Ctrl+C 停止服务\n'))

      if (options.open !== false && config.server.autoOpen) {
        await open(resultUrl)
      }
    } else {
      // CI 模式下，输出 reviewId 方便后续 export / 追踪
      console.log(chalk.gray(`\n  Review ID: ${reviewId}\n`))
      await commentIfNeeded(result, options)
      applyFailOnIfNeeded(result, options.failOn)
    }

  } catch (error) {
    spinner.fail(chalk.red('审查失败'))
    console.error(chalk.red(error instanceof Error ? error.message : '未知错误'))
    process.exit(1)
  }
}

async function performReviewInBatches(
  config: ReturnType<typeof loadConfig>,
  provider: AIProvider,
  batches: Array<{ diff: string; fileCount: number }>,
  spinner: ReturnType<typeof ora>,
  options: {
    language: 'zh' | 'en'
    customPrompt?: string
    includeSecurityCheck: boolean
    includeQualityScore: boolean
  }
): Promise<Awaited<ReturnType<typeof performReview>>> {
  const parts: Array<Awaited<ReturnType<typeof performReview>>> = []

  for (let i = 0; i < batches.length; i += 1) {
    const batch = batches[i]
    spinner.text = `正在进行 AI 代码审查... (${i + 1}/${batches.length}, files=${batch.fileCount})`
    parts.push(await performReview(config, batch.diff, provider, options))
  }

  // 合并多批次结果
  const fileMap = new Map<string, Awaited<ReturnType<typeof performReview>>['files'][number]>()
  const summaries: string[] = []
  const securityIssues: NonNullable<Awaited<ReturnType<typeof performReview>>['securityIssues']> = []
  const overallScores: number[] = []

  for (const part of parts) {
    summaries.push(part.summary)
    if (typeof part.overallScore === 'number') overallScores.push(part.overallScore)
    if (Array.isArray(part.securityIssues)) securityIssues.push(...part.securityIssues)

    for (const file of part.files) {
      const existing = fileMap.get(file.file)
      if (!existing) {
        fileMap.set(file.file, file)
        continue
      }

      fileMap.set(file.file, {
        ...existing,
        summary: [existing.summary, file.summary].filter(Boolean).join('\n'),
        qualityScore: mergeScore(existing.qualityScore, file.qualityScore),
        comments: [...existing.comments, ...file.comments],
      })
    }
  }

  const merged: Awaited<ReturnType<typeof performReview>> = {
    summary: summaries.filter(Boolean).join('\n\n---\n\n'),
    files: Array.from(fileMap.values()),
    securityIssues,
  }

  if (overallScores.length > 0) {
    merged.overallScore = Math.round(overallScores.reduce((sum, s) => sum + s, 0) / overallScores.length)
  }

  return merged
}

function mergeScore(a?: number, b?: number): number | undefined {
  if (typeof a !== 'number') return b
  if (typeof b !== 'number') return a
  return Math.round((a + b) / 2)
}

function resolveRangeOptions(options: Pick<ReviewOptions, 'range' | 'base' | 'head'>): {
  range: string
  baseRef: string
  headRef: string
  isTripleDots: boolean
} {
  if (options.range) {
    const raw = options.range.trim()
    const tripleIndex = raw.indexOf('...')
    if (tripleIndex >= 0) {
      const baseRef = raw.slice(0, tripleIndex).trim()
      const headRef = raw.slice(tripleIndex + 3).trim()
      if (!baseRef || !headRef) {
        throw new Error('无效的 --range，示例：origin/main...HEAD')
      }
      return { range: `${baseRef}...${headRef}`, baseRef, headRef, isTripleDots: true }
    }

    const doubleIndex = raw.indexOf('..')
    if (doubleIndex >= 0) {
      const baseRef = raw.slice(0, doubleIndex).trim()
      const headRef = raw.slice(doubleIndex + 2).trim()
      if (!baseRef || !headRef) {
        throw new Error('无效的 --range，示例：origin/main..HEAD')
      }
      return { range: `${baseRef}..${headRef}`, baseRef, headRef, isTripleDots: false }
    }

    throw new Error('无效的 --range，示例：origin/main...HEAD 或 origin/main..HEAD')
  }

  if (!options.base) {
    throw new Error('使用 --head 时必须同时提供 --base')
  }

  const baseRef = options.base.trim()
  const headRef = (options.head || 'HEAD').trim()
  if (!baseRef || !headRef) {
    throw new Error('无效的 --base/--head')
  }

  // 默认使用三点范围（merge-base..head），更贴近 PR 的语义
  return { range: `${baseRef}...${headRef}`, baseRef, headRef, isTripleDots: true }
}

async function exportIfNeeded(result: ReviewResult, options: Pick<ReviewOptions, 'format' | 'output'>): Promise<void> {
  const format = resolveExportFormat(options.format, options.output)
  if (!format) return

  const { content, extension } = renderReport(result, format)
  const outputPath = options.output || `code-review-${result.id}.${extension}`
  const fullPath = path.isAbsolute(outputPath) ? outputPath : path.join(process.cwd(), outputPath)

  fs.writeFileSync(fullPath, content, 'utf-8')
  console.log(chalk.green(`\n✓ 审查报告已导出到: ${chalk.yellow(fullPath)}\n`))
}

function resolveExportFormat(format?: ExportFormat, output?: string): ExportFormat | null {
  if (format) return format
  if (!output) return null

  const ext = path.extname(output).toLowerCase()
  if (ext === '.md' || ext === '.markdown') return 'markdown'
  if (ext === '.html' || ext === '.htm') return 'html'
  if (ext === '.json') return 'json'

  return 'markdown'
}

function applyFailOnIfNeeded(result: ReviewResult, failOnRaw: string | undefined): void {
  const failOn = (failOnRaw || 'none').toLowerCase()
  if (failOn === 'none') return

  const threshold = failOnSeverityThreshold(failOn)
  if (threshold === null) {
    console.log(chalk.yellow(`⚠️  无效的 --fail-on: ${failOnRaw}，已忽略（可选：none/info/warning/critical）`))
    return
  }

  const maxSeverity = getMaxFindingSeverity(result)
  if (maxSeverity >= threshold) {
    process.exitCode = 2
    console.log(chalk.red(`❌ 发现 ${failOn} 级别及以上问题，退出码=2`))
  }
}

function failOnSeverityThreshold(level: string): number | null {
  switch (level) {
    case 'info':
      return 1
    case 'warning':
      return 2
    case 'critical':
      return 3
    default:
      return null
  }
}

function getMaxFindingSeverity(result: ReviewResult): number {
  let max = 0

  for (const file of result.files) {
    for (const comment of file.comments) {
      const sev = commentSeverity(comment.severity)
      if (sev > max) max = sev
    }
  }

  for (const issue of result.securityIssues || []) {
    const sev = securitySeverity(issue.severity)
    if (sev > max) max = sev
  }

  return max
}

function commentSeverity(severity: ReviewResult['files'][number]['comments'][number]['severity']): number {
  switch (severity) {
    case 'info':
      return 1
    case 'warning':
      return 2
    case 'critical':
      return 3
    default:
      return 0
  }
}

function securitySeverity(severity: string): number {
  switch (severity) {
    case 'low':
      return 1
    case 'medium':
      return 2
    case 'high':
      return 3
    case 'critical':
      return 3
    default:
      return 0
  }
}

async function commentIfNeeded(
  result: ReviewResult,
  options: Pick<ReviewOptions, 'comment' | 'commentMode' | 'githubRepo' | 'githubPr' | 'githubToken'>
): Promise<void> {
  if (!options.comment) return

  const prNumber = options.githubPr ? Number.parseInt(options.githubPr, 10) : undefined
  const mode = normalizeCommentMode(options.commentMode)

  const response = await postReviewCommentToGitHub(result, {
    repo: options.githubRepo,
    prNumber: Number.isFinite(prNumber as number) ? (prNumber as number) : undefined,
    token: options.githubToken,
    mode,
  })

  if (response.success) {
    console.log(chalk.green(`✓ 已回写 GitHub 评论: ${response.url || 'ok'}`))
  } else {
    console.log(chalk.yellow(`⚠️  回写 GitHub 评论失败: ${response.error || 'unknown error'}`))
  }
}

function normalizeCommentMode(mode?: string): 'create' | 'update' | 'create-or-update' {
  const value = (mode || 'create-or-update').toLowerCase()
  if (value === 'create') return 'create'
  if (value === 'update') return 'update'
  return 'create-or-update'
}
