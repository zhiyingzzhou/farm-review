import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import inquirer from 'inquirer'
import { loadHistory, loadReviewResult } from '../../config/index.js'
import { renderReport } from '../report.js'
import type { ExportFormat } from '../../types/index.js'

interface ExportOptions {
  id?: string
  format: ExportFormat
  output?: string
}

export async function exportCommand(options: ExportOptions): Promise<void> {
  let reviewId = options.id

  // If no ID provided, show selection
  if (!reviewId) {
    const history = loadHistory()

    if (history.length === 0) {
      console.log(chalk.yellow('\n📭 暂无审查历史记录\n'))
      return
    }

    const { selectedId } = await inquirer.prompt<{ selectedId: string }>([
      {
        type: 'list',
        name: 'selectedId',
        message: '选择要导出的审查记录:',
        choices: history.slice(-20).reverse().map(r => ({
          name: `${r.id} - ${r.projectName} (${new Date(r.createdAt).toLocaleDateString('zh-CN')})`,
          value: r.id,
        })),
      },
    ])

    reviewId = selectedId
  }

  const result = loadReviewResult(reviewId)

  if (!result) {
    console.log(chalk.red(`\n❌ 未找到 ID 为 "${reviewId}" 的审查记录\n`))
    return
  }

  // Generate export content
  const { content, extension } = renderReport(result, options.format)

  // Determine output path
  const outputPath = options.output || `code-review-${reviewId}.${extension}`
  const fullPath = path.isAbsolute(outputPath) ? outputPath : path.join(process.cwd(), outputPath)

  // Write file
  fs.writeFileSync(fullPath, content, 'utf-8')

  console.log(chalk.green(`\n✓ 审查报告已导出到: ${chalk.yellow(fullPath)}\n`))
}
