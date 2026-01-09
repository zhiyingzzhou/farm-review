import chalk from 'chalk'
import open from 'open'
import inquirer from 'inquirer'
import { loadHistory, loadReviewResult, deleteReviewResult, loadConfig } from '../../config/index.js'
import { startServer } from '../../server/index.js'
import { formatLocalDate } from '../../utils/index.js'

interface HistoryOptions {
  list?: boolean
  view?: string
  delete?: string
  port: string
}

export async function historyCommand(options: HistoryOptions): Promise<void> {
  const history = loadHistory()
  const config = loadConfig()

  if (history.length === 0) {
    console.log(chalk.yellow('\n📭 暂无审查历史记录\n'))
    console.log(chalk.gray('提示: 使用 `farm-review review` 进行代码审查\n'))
    return
  }

  // List all history
  if (options.list || (!options.view && !options.delete)) {
    console.log(chalk.cyan('\n═'.repeat(60)))
    console.log(chalk.cyan.bold('  📚 审查历史记录'))
    console.log(chalk.cyan('═'.repeat(60)))

    for (const record of history.slice(-20).reverse()) {
      const scoreColor = record.overallScore 
        ? (record.overallScore >= 80 ? chalk.green : record.overallScore >= 60 ? chalk.yellow : chalk.red)
        : chalk.gray

      console.log(`
  ${chalk.yellow.bold(record.id)} - ${chalk.white(record.projectName)}
    分支: ${chalk.green(record.commits[0]?.branch || 'N/A')} | 提交: ${chalk.cyan(record.commits.length)} 个
    评分: ${scoreColor(record.overallScore ? record.overallScore + '/100' : 'N/A')} | 问题: ${chalk.yellow(record.issueCount)} 个
    时间: ${chalk.gray(formatLocalDate(record.createdAt))} | AI: ${chalk.blue(record.provider)}
`)
    }

    // Interactive selection
    const { action } = await inquirer.prompt<{ action: string }>([
      {
        type: 'list',
        name: 'action',
        message: '选择操作:',
        choices: [
          { name: '📖 查看详情', value: 'view' },
          { name: '🗑️  删除记录', value: 'delete' },
          { name: '❌ 退出', value: 'exit' },
        ],
      },
    ])

    if (action === 'exit') {
      return
    }

    const { selectedId } = await inquirer.prompt<{ selectedId: string }>([
      {
        type: 'list',
        name: 'selectedId',
        message: `选择要${action === 'view' ? '查看' : '删除'}的记录:`,
        choices: history.slice(-20).reverse().map(r => ({
          name: `${r.id} - ${r.projectName} (${formatLocalDate(r.createdAt)})`,
          value: r.id,
        })),
      },
    ])

    if (action === 'view') {
      await viewHistory(selectedId, parseInt(options.port) || config.server.port)
    } else if (action === 'delete') {
      await deleteHistory(selectedId)
    }

    return
  }

  // View specific history
  if (options.view) {
    await viewHistory(options.view, parseInt(options.port) || config.server.port)
    return
  }

  // Delete specific history
  if (options.delete) {
    await deleteHistory(options.delete)
    return
  }
}

async function viewHistory(id: string, port: number): Promise<void> {
  const result = loadReviewResult(id)

  if (!result) {
    console.log(chalk.red(`\n❌ 未找到 ID 为 "${id}" 的审查记录\n`))
    return
  }

  console.log(chalk.blue('\n🚀 启动结果查看服务...\n'))

  await startServer(port)

  const resultUrl = `http://127.0.0.1:${port}/review/${id}`
  console.log(chalk.cyan('═'.repeat(50)))
  console.log(chalk.cyan.bold('  📖 查看审查结果'))
  console.log(chalk.cyan('═'.repeat(50)))
  console.log(chalk.white(`\n  访问地址: ${chalk.yellow.bold(resultUrl)}`))
  console.log(chalk.gray('\n  提示: 按 Ctrl+C 停止服务\n'))

  const config = loadConfig()
  if (config.server.autoOpen) {
    const openModule = await import('open')
    await openModule.default(resultUrl)
  }
}

async function deleteHistory(id: string): Promise<void> {
  const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
    {
      type: 'confirm',
      name: 'confirm',
      message: `确定要删除 ID 为 "${id}" 的审查记录吗？`,
      default: false,
    },
  ])

  if (!confirm) {
    console.log(chalk.gray('\n已取消删除\n'))
    return
  }

  const success = deleteReviewResult(id)
  
  if (success) {
    console.log(chalk.green(`\n✓ 已删除审查记录 ${id}\n`))
  } else {
    console.log(chalk.red(`\n❌ 未找到 ID 为 "${id}" 的审查记录\n`))
  }
}

