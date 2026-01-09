export interface DiffProcessOptions {
  ignorePatterns?: string[]
  maxFiles?: number
}

export interface DiffProcessResult {
  diff: string
  fileCount: number
  ignoredFileCount: number
  trimmedFileCount: number
  insertions: number
  deletions: number
}

interface DiffBlock {
  filePath: string
  text: string
  insertions: number
  deletions: number
  changeSize: number
}

export interface DiffBatch {
  diff: string
  fileCount: number
  insertions: number
  deletions: number
}

export interface DiffBatchResult {
  batches: DiffBatch[]
  totalFileCount: number
  ignoredFileCount: number
  insertions: number
  deletions: number
}

export function processDiffForReview(
  diffText: string,
  options: DiffProcessOptions = {}
): DiffProcessResult {
  const blocks = splitDiffByFile(diffText)

  const ignoreMatchers = (options.ignorePatterns || [])
    .map(p => p.trim())
    .filter(Boolean)
    .map(createGlobMatcher)

  const includedAfterIgnore: DiffBlock[] = []
  let ignoredFileCount = 0

  for (const block of blocks) {
    const ignored = ignoreMatchers.some(match => match(block.filePath))
    if (ignored) {
      ignoredFileCount += 1
      continue
    }
    includedAfterIgnore.push(block)
  }

  const maxFiles = Number.isFinite(options.maxFiles) ? (options.maxFiles as number) : undefined
  const normalizedMaxFiles = maxFiles && maxFiles > 0 ? Math.floor(maxFiles) : undefined

  let finalBlocks = includedAfterIgnore
  let trimmedFileCount = 0

  if (normalizedMaxFiles !== undefined && includedAfterIgnore.length > normalizedMaxFiles) {
    const sortedByChange = [...includedAfterIgnore].sort((a, b) => b.changeSize - a.changeSize)
    const selected = new Set(sortedByChange.slice(0, normalizedMaxFiles).map(b => b.filePath))
    trimmedFileCount = includedAfterIgnore.length - selected.size
    finalBlocks = includedAfterIgnore.filter(b => selected.has(b.filePath))
  }

  const diff = finalBlocks.map(b => b.text.trimEnd()).join('\n')
  const insertions = finalBlocks.reduce((sum, b) => sum + b.insertions, 0)
  const deletions = finalBlocks.reduce((sum, b) => sum + b.deletions, 0)

  return {
    diff,
    fileCount: finalBlocks.length,
    ignoredFileCount,
    trimmedFileCount,
    insertions,
    deletions,
  }
}

export function createDiffBatchesForReview(
  diffText: string,
  options: DiffProcessOptions = {}
): DiffBatchResult {
  const blocks = splitDiffByFile(diffText)

  const ignoreMatchers = (options.ignorePatterns || [])
    .map(p => p.trim())
    .filter(Boolean)
    .map(createGlobMatcher)

  const included: DiffBlock[] = []
  let ignoredFileCount = 0

  for (const block of blocks) {
    const ignored = ignoreMatchers.some(match => match(block.filePath))
    if (ignored) {
      ignoredFileCount += 1
      continue
    }
    included.push(block)
  }

  const maxFiles = Number.isFinite(options.maxFiles) ? (options.maxFiles as number) : undefined
  const batchSize = maxFiles && maxFiles > 0 ? Math.floor(maxFiles) : included.length || 1

  const batches: DiffBatch[] = []
  for (let i = 0; i < included.length; i += batchSize) {
    const chunk = included.slice(i, i + batchSize)
    const diff = chunk.map(b => b.text.trimEnd()).join('\n')
    const insertions = chunk.reduce((sum, b) => sum + b.insertions, 0)
    const deletions = chunk.reduce((sum, b) => sum + b.deletions, 0)
    batches.push({ diff, fileCount: chunk.length, insertions, deletions })
  }

  const insertions = included.reduce((sum, b) => sum + b.insertions, 0)
  const deletions = included.reduce((sum, b) => sum + b.deletions, 0)

  return {
    batches,
    totalFileCount: included.length,
    ignoredFileCount,
    insertions,
    deletions,
  }
}

function splitDiffByFile(diffText: string): DiffBlock[] {
  if (!diffText.trim()) return []

  const parts = diffText.split(/^diff --git /m)
  const merged = new Map<string, DiffBlock>()

  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue

    const text = `diff --git ${trimmed}`
    const firstLine = trimmed.split('\n', 1)[0] || ''
    const filePath = extractFilePath(firstLine)
    if (!filePath) continue

    const { insertions, deletions } = countChanges(text)

    const existing = merged.get(filePath)
    if (!existing) {
      merged.set(filePath, {
        filePath,
        text,
        insertions,
        deletions,
        changeSize: insertions + deletions,
      })
      continue
    }

    merged.set(filePath, {
      ...existing,
      text: mergeDiffText(existing.text, text),
      insertions: existing.insertions + insertions,
      deletions: existing.deletions + deletions,
      changeSize: existing.changeSize + insertions + deletions,
    })
  }

  return Array.from(merged.values())
}

function extractFilePath(diffHeaderLine: string): string | null {
  // e.g. "diff --git a/foo.ts b/foo.ts"（这里 headerLine 不包含前缀 "diff --git "）
  const match = diffHeaderLine.match(/^a\/(.+?) b\/(.+)$/)
  if (!match) return null
  const oldPath = match[1]
  const newPath = match[2]
  return newPath || oldPath
}

function countChanges(blockText: string): { insertions: number; deletions: number } {
  let insertions = 0
  let deletions = 0

  for (const line of blockText.split('\n')) {
    if (line.startsWith('+++ ') || line.startsWith('--- ')) continue
    if (line.startsWith('+')) insertions += 1
    else if (line.startsWith('-')) deletions += 1
  }

  return { insertions, deletions }
}

function mergeDiffText(existingText: string, nextText: string): string {
  const appendix = extractAppendix(nextText)
  if (!appendix) return existingText
  return `${existingText.trimEnd()}\n${appendix}`
}

function extractAppendix(blockText: string): string {
  const lines = blockText.split('\n')

  const hunkIndex = lines.findIndex(line => line.startsWith('@@'))
  if (hunkIndex >= 0) {
    return lines.slice(hunkIndex).join('\n').trimEnd()
  }

  const binaryIndex = lines.findIndex(
    line => line.startsWith('GIT binary patch') || line.startsWith('Binary files ')
  )
  if (binaryIndex >= 0) {
    return lines.slice(binaryIndex).join('\n').trimEnd()
  }

  const meta = lines
    .slice(1)
    .filter(
      line =>
        !line.startsWith('diff --git ') &&
        !line.startsWith('index ') &&
        !line.startsWith('--- ') &&
        !line.startsWith('+++ ')
    )
    .join('\n')
    .trimEnd()

  return meta
}

function createGlobMatcher(pattern: string): (filePath: string) => boolean {
  const anchored = pattern.startsWith('/')
  const normalized = anchored ? pattern.slice(1) : pattern

  if (!normalized.includes('/')) {
    const re = globToRegExp(normalized, true)
    return (filePath: string) => {
      const baseName = filePath.split('/').pop() || filePath
      return re.test(baseName)
    }
  }

  const re = globToRegExp(normalized, anchored)
  return (filePath: string) => re.test(filePath)
}

function globToRegExp(glob: string, anchoredStart: boolean): RegExp {
  const prefix = anchoredStart ? '^' : '(?:^|.*/)'
  let regex = prefix

  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i]
    if (char === '*') {
      const next = glob[i + 1]
      if (next === '*') {
        regex += '.*'
        i += 1
      } else {
        regex += '[^/]*'
      }
      continue
    }
    if (char === '?') {
      regex += '[^/]'
      continue
    }
    regex += escapeRegExp(char)
  }

  regex += '$'
  return new RegExp(regex)
}

function escapeRegExp(char: string): string {
  return char.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
}
