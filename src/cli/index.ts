#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import { configCommand } from './commands/config.js'
import { reviewCommand } from './commands/review.js'
import { historyCommand } from './commands/history.js'
import { exportCommand } from './commands/export.js'

const program = new Command()

console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🤖 FARM Review - 智能代码审查工具              ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
`))

program
  .name('farm-review')
  .description('FARM Review - AI-powered code review tool with web interface')
  .version('1.0.0')

program
  .command('config')
  .description('打开配置页面配置 AI 服务')
  .option('-p, --port <port>', '指定服务端口', '3050')
  .option('--no-open', '不自动打开浏览器')
  .action(configCommand)

program
  .command('review')
  .description('执行代码审查')
  .option('-c, --commits <commits>', '指定要审查的提交 (逗号分隔)')
  .option('--range <range>', '审查一个 ref 范围（如 origin/main...HEAD）')
  .option('--base <ref>', '审查基准 ref（与 --head 组合使用）')
  .option('--head <ref>', '审查目标 ref（默认 HEAD）')
  .option('-p, --provider <provider>', '指定 AI 服务商 (openai/claude/gemini/azure/ollama/zhipu)')
  .option('-n, --count <count>', '选择最近的 N 次提交', '10')
  .option('--port <port>', '指定服务端口', '3050')
  .option('--no-open', '不自动打开浏览器')
  .option('--no-ui', '不启动结果查看服务（CI 推荐）')
  .option('--fail-on <level>', '发现指定级别及以上问题时返回非零退出码 (none/info/warning/critical)', 'none')
  .option('-f, --format <format>', '自动导出报告格式 (markdown/html/json)')
  .option('-o, --output <path>', '自动导出报告到指定路径')
  .option('--comment', '在 GitHub Pull Request 上回写审查结果（需要 Token）')
  .option('--comment-mode <mode>', '评论模式 (create/update/create-or-update)', 'create-or-update')
  .option('--github-repo <repo>', 'GitHub 仓库，如 owner/repo（默认读取 GITHUB_REPOSITORY）')
  .option('--github-pr <number>', 'GitHub PR 编号（默认从 GITHUB_EVENT_PATH 读取）')
  .option('--github-token <token>', 'GitHub Token（默认读取 GITHUB_TOKEN）')
  .option('--all-files', '不丢弃超出 maxFilesPerReview 的文件，改为分批审查全部文件（更慢/更贵）')
  .option('--batch-size <number>', '分批大小（默认使用 maxFilesPerReview）')
  .action(reviewCommand)

program
  .command('history')
  .description('查看审查历史')
  .option('-l, --list', '列出所有历史记录')
  .option('-v, --view <id>', '查看指定审查结果')
  .option('-d, --delete <id>', '删除指定审查结果')
  .option('--port <port>', '指定服务端口', '3050')
  .action(historyCommand)

program
  .command('export')
  .description('导出审查报告')
  .option('-i, --id <id>', '指定审查 ID')
  .option('-f, --format <format>', '导出格式 (markdown/html/json)', 'markdown')
  .option('-o, --output <path>', '输出文件路径')
  .action(exportCommand)

program.parse()
