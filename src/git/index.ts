import simpleGit, { SimpleGit, LogResult } from 'simple-git'
import type { GitCommit, GitBranch, GitDiff } from '../types/index.js'

// 自定义 log format 返回的字段类型
interface CustomLogFields {
  hash: string
  shortHash: string
  message: string
  author: string
  authorEmail: string
  date: string
}

export class GitService {
  private git: SimpleGit

  constructor(workDir: string = process.cwd()) {
    this.git = simpleGit(workDir)
  }

  async isGitRepo(): Promise<boolean> {
    try {
      await this.git.revparse(['--git-dir'])
      return true
    } catch {
      return false
    }
  }

  async getCurrentBranch(): Promise<string> {
    const branch = await this.git.revparse(['--abbrev-ref', 'HEAD'])
    return branch.trim()
  }

  async getBranches(): Promise<GitBranch[]> {
    const summary = await this.git.branch()
    return summary.all.map(name => ({
      name,
      current: name === summary.current,
      commit: '', // Could be fetched if needed
    }))
  }

  async getRecentCommits(count: number = 20): Promise<GitCommit[]> {
    const log: LogResult<CustomLogFields> = await this.git.log({
      maxCount: count,
      format: {
        hash: '%H',
        shortHash: '%h',
        message: '%s',
        author: '%an',
        authorEmail: '%ae',
        date: '%ci',
      },
    })

    const currentBranch = await this.getCurrentBranch()

    return log.all.map(commit => {
      // simple-git 自定义 format 返回的字段名和定义的 key 一致
      const c = commit as unknown as {
        hash: string
        shortHash: string
        message: string
        author: string
        authorEmail: string
        date: string
      }
      return {
        hash: c.hash,
        shortHash: c.shortHash || c.hash.substring(0, 7),
        message: c.message,
        author: c.author || 'Unknown',
        authorEmail: c.authorEmail || '',
        date: c.date,
        branch: currentBranch,
      }
    })
  }

  async getCommit(commitRef: string): Promise<GitCommit | null> {
    try {
      const output = await this.git.raw([
        'show',
        '-s',
        '--format=%H%n%h%n%s%n%an%n%ae%n%ci',
        commitRef,
      ])

      const [hash, shortHash, message, author, authorEmail, date] = output.trim().split('\n')
      if (!hash) return null

      return {
        hash,
        shortHash: shortHash || hash.substring(0, 7),
        message,
        author: author || 'Unknown',
        authorEmail: authorEmail || '',
        date,
      }
    } catch {
      return null
    }
  }

  async getMergeBase(baseRef: string, headRef: string): Promise<string> {
    const output = await this.git.raw(['merge-base', baseRef, headRef])
    return output.trim()
  }

  async getDiffForRange(range: string): Promise<string> {
    return this.git.diff([range])
  }

  async getCommitsBetween(fromCommit: string, toCommit: string): Promise<GitCommit[]> {
    const log: LogResult<CustomLogFields> = await this.git.log({
      from: fromCommit,
      to: toCommit,
      format: {
        hash: '%H',
        shortHash: '%h',
        message: '%s',
        author: '%an',
        authorEmail: '%ae',
        date: '%ci',
      },
    })

    return log.all.map(commit => {
      const c = commit as unknown as {
        hash: string
        shortHash: string
        message: string
        author: string
        authorEmail: string
        date: string
      }
      return {
        hash: c.hash,
        shortHash: c.shortHash || c.hash.substring(0, 7),
        message: c.message,
        author: c.author || 'Unknown',
        authorEmail: c.authorEmail || '',
        date: c.date,
      }
    })
  }

  async getDiff(commits: string[]): Promise<string> {
    if (commits.length === 0) {
      return ''
    }

    if (commits.length === 1) {
      // Single commit - diff against its parent
      try {
        const diff = await this.git.diff([`${commits[0]}^`, commits[0]])
        return diff
      } catch {
        // 兼容根提交等无父提交场景
        return this.git.show([commits[0], '--format=', '--patch'])
      }
    }

    // Multiple commits - 仅审查“选中的提交”，逐个拼接每个提交的 patch（避免把区间中间提交也带进来）
    const orderedCommits = [...commits].reverse()
    const diffs: string[] = []

    for (const commit of orderedCommits) {
      const patch = await this.git.show([commit, '--format=', '--patch'])
      if (patch.trim()) {
        diffs.push(patch.trimEnd())
      }
    }

    return diffs.join('\n')
  }

  async getDiffStats(commits: string[]): Promise<{ files: string[]; insertions: number; deletions: number }> {
    if (commits.length === 0) {
      return { files: [], insertions: 0, deletions: 0 }
    }

    const orderedCommits = commits.length === 1 ? commits : [...commits].reverse()

    let insertions = 0
    let deletions = 0
    const files = new Set<string>()

    for (const commit of orderedCommits) {
      try {
        const stat = await this.git.diffSummary([`${commit}^..${commit}`])
        stat.files.forEach(f => files.add(f.file))
        insertions += stat.insertions
        deletions += stat.deletions
      } catch {
        // 兼容无父提交等情况：使用 numstat 兜底
        const numstat = await this.git.show([commit, '--format=', '--numstat'])
        for (const line of numstat.split('\n')) {
          const trimmed = line.trim()
          if (!trimmed) continue
          const [addedRaw, deletedRaw, file] = trimmed.split('\t')
          if (!file) continue
          files.add(file)
          const added = Number.parseInt(addedRaw, 10)
          const deleted = Number.parseInt(deletedRaw, 10)
          if (Number.isFinite(added)) insertions += added
          if (Number.isFinite(deleted)) deletions += deleted
        }
      }
    }

    return { files: Array.from(files), insertions, deletions }
  }

  async getFileDiff(commits: string[], filePath: string): Promise<string> {
    if (commits.length === 0) {
      return ''
    }

    if (commits.length === 1) {
      try {
        const diff = await this.git.diff([`${commits[0]}^`, commits[0], '--', filePath])
        return diff
      } catch {
        return this.git.show([commits[0], '--format=', '--patch', '--', filePath])
      }
    }

    const orderedCommits = [...commits].reverse()
    const diffs: string[] = []

    for (const commit of orderedCommits) {
      const patch = await this.git.show([commit, '--format=', '--patch', '--', filePath])
      if (patch.trim()) {
        diffs.push(patch.trimEnd())
      }
    }

    return diffs.join('\n')
  }

  async getChangedFiles(commits: string[]): Promise<string[]> {
    if (commits.length === 0) {
      return []
    }

    const orderedCommits = commits.length === 1 ? commits : [...commits].reverse()
    const files = new Set<string>()

    for (const commit of orderedCommits) {
      const output = await this.git.show([commit, '--format=', '--name-only'])
      output
        .split('\n')
        .map(f => f.trim())
        .filter(Boolean)
        .forEach(f => files.add(f))
    }

    return Array.from(files)
  }

  async getFileContent(commitHash: string, filePath: string): Promise<string> {
    try {
      const content = await this.git.show([`${commitHash}:${filePath}`])
      return content
    } catch {
      return ''
    }
  }

  async getRemoteUrl(): Promise<string | null> {
    try {
      const remotes = await this.git.getRemotes(true)
      const origin = remotes.find(r => r.name === 'origin')
      return origin?.refs.fetch || null
    } catch {
      return null
    }
  }

  async getProjectName(): Promise<string> {
    const remoteUrl = await this.getRemoteUrl()
    if (remoteUrl) {
      // Extract project name from URL
      const match = remoteUrl.match(/\/([^/]+?)(?:\.git)?$/)
      if (match) {
        return match[1]
      }
    }
    // Fallback to directory name
    const cwd = process.cwd()
    return cwd.split('/').pop() || 'unknown'
  }

  parseDiff(diffText: string): GitDiff[] {
    const diffs: GitDiff[] = []
    const fileDiffs = diffText.split(/^diff --git /m).filter(d => d.trim())

    for (const fileDiff of fileDiffs) {
      const lines = fileDiff.split('\n')
      const headerMatch = lines[0].match(/a\/(.+) b\/(.+)/)
      
      if (!headerMatch) continue

      const oldFile = headerMatch[1]
      const newFile = headerMatch[2]
      
      let status: GitDiff['status'] = 'modified'
      if (fileDiff.includes('new file mode')) {
        status = 'added'
      } else if (fileDiff.includes('deleted file mode')) {
        status = 'deleted'
      } else if (fileDiff.includes('rename from')) {
        status = 'renamed'
      }

      const hunks: { oldStart: number; oldLines: number; newStart: number; newLines: number; content: string }[] = []
      const hunkMatches = fileDiff.matchAll(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*?)(?=@@ -|\n$|$)/gs)
      
      for (const match of hunkMatches) {
        hunks.push({
          oldStart: parseInt(match[1], 10),
          oldLines: parseInt(match[2] || '1', 10),
          newStart: parseInt(match[3], 10),
          newLines: parseInt(match[4] || '1', 10),
          content: match[5] || '',
        })
      }

      diffs.push({
        oldFile,
        newFile,
        status,
        hunks,
      })
    }

    return diffs
  }
}

export const gitService = new GitService()
