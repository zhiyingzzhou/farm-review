import open from 'open'
import chalk from 'chalk'
import ora from 'ora'
import { startServer } from '../../server/index.js'
import { loadConfig } from '../../config/index.js'

interface ConfigOptions {
  port: string
  open: boolean
}

export async function configCommand(options: ConfigOptions): Promise<void> {
  const config = loadConfig()
  const port = parseInt(options.port) || config.server.port
  const baseUrl = `http://127.0.0.1:${port}`

  console.log(chalk.blue('📋 启动配置服务...\n'))

  const spinner = ora('正在启动 Web 服务...').start()

  try {
    await startServer(port)
    spinner.succeed(chalk.green(`服务已启动在 ${baseUrl}`))

    console.log('\n' + chalk.cyan('═'.repeat(50)))
    console.log(chalk.cyan.bold('  🔧 AI 配置页面'))
    console.log(chalk.cyan('═'.repeat(50)))
    console.log(chalk.white(`\n  访问地址: ${chalk.yellow.bold(`${baseUrl}/config`)}`))
    console.log(chalk.gray('\n  提示: 按 Ctrl+C 停止服务\n'))

    if (options.open !== false && config.server.autoOpen) {
      await open(`${baseUrl}/config`)
    }

  } catch (error) {
    spinner.fail(chalk.red('启动失败'))
    console.error(chalk.red(error instanceof Error ? error.message : '未知错误'))
    process.exit(1)
  }
}
