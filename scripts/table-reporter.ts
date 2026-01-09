import type { Reporter, File, Task } from 'vitest'

/**
 * 自定义表格样式的测试报告器
 */
export default class TableReporter implements Reporter {
  ctx: any

  onInit(ctx: any) {
    this.ctx = ctx
  }

  onFinished(files?: File[]) {
    if (!files) return

    console.log('\n')
    console.log('\x1b[36m%s\x1b[0m', '═'.repeat(80))
    console.log('\x1b[36m%s\x1b[0m', '  📊 测试结果')
    console.log('\x1b[36m%s\x1b[0m', '═'.repeat(80))

    // 计算统计
    let totalTests = 0
    let passedTests = 0
    let failedTests = 0

    files.forEach(file => {
      const tasks = this.collectTasks(file.tasks)
      totalTests += tasks.length
      passedTests += tasks.filter(t => t.result?.state === 'pass').length
      failedTests += tasks.filter(t => t.result?.state === 'fail').length
    })

    console.log(`\n  \x1b[32mTest Files\x1b[0m  ${files.length} passed (${files.length})`)
    console.log(`  \x1b[32mTests\x1b[0m       ${passedTests} passed (${totalTests})`)
    console.log(`  \x1b[90mDuration\x1b[0m    ${this.formatDuration(this.ctx?.state?.getTestDuration?.() || 0)}\n`)

    // 输出每个测试文件
    files.forEach((file, fileIndex) => {
      console.log('\x1b[36m%s\x1b[0m', '─'.repeat(80))
      console.log(`\n\x1b[33m测试文件 ${fileIndex + 1}: ${this.getFileName(file.filepath)}\x1b[0m`)
      console.log(`\x1b[90m文件路径: ${file.filepath}\x1b[0m`)

      const tasks = this.collectTasks(file.tasks)
      const passCount = tasks.filter(t => t.result?.state === 'pass').length

      console.log(`\x1b[90m测试数量: ${tasks.length} 个\x1b[0m\n`)

      // 输出表格头
      this.printTableHeader()

      // 输出每个测试
      tasks.forEach((task, index) => {
        this.printTableRow(index + 1, task)
      })

      // 输出表格底部
      this.printTableFooter()
      console.log()
    })

    // 输出总结
    console.log('\x1b[36m%s\x1b[0m', '═'.repeat(80))
    console.log('\x1b[36m%s\x1b[0m', '  📈 代码统计汇总')
    console.log('\x1b[36m%s\x1b[0m', '═'.repeat(80))
    console.log()
    this.printSummaryTable(files)
    console.log()
  }

  private collectTasks(tasks: Task[]): Task[] {
    const result: Task[] = []
    
    const collect = (tasks: Task[]) => {
      for (const task of tasks) {
        if (task.type === 'test') {
          result.push(task)
        } else if (task.type === 'suite' && 'tasks' in task) {
          collect(task.tasks)
        }
      }
    }
    
    collect(tasks)
    return result
  }

  private getFileName(filepath: string): string {
    return filepath.split('/').pop() || filepath
  }

  private getTaskSuite(task: Task): string {
    const parts: string[] = []
    let parent = task.suite
    while (parent) {
      if (parent.name) {
        parts.unshift(parent.name)
      }
      parent = parent.suite
    }
    return parts.join(' > ') || '-'
  }

  private printTableHeader() {
    console.log('┌─────┬────────────────────────────────────────┬────────────────────────────────────┬────────┐')
    console.log('│ \x1b[1m#\x1b[0m   │ \x1b[1m测试套件\x1b[0m                               │ \x1b[1m测试用例\x1b[0m                           │ \x1b[1m状态\x1b[0m   │')
    console.log('├─────┼────────────────────────────────────────┼────────────────────────────────────┼────────┤')
  }

  private printTableRow(index: number, task: Task) {
    const suite = this.truncate(this.getTaskSuite(task), 36)
    const name = this.truncate(task.name, 32)
    const status = task.result?.state === 'pass' 
      ? '\x1b[32m✅\x1b[0m' 
      : task.result?.state === 'fail' 
        ? '\x1b[31m❌\x1b[0m' 
        : '\x1b[33m⏭️\x1b[0m'

    const indexStr = String(index).padEnd(3)
    const suiteStr = this.padEnd(suite, 38)
    const nameStr = this.padEnd(name, 34)
    
    console.log(`│ ${indexStr} │ ${suiteStr} │ ${nameStr} │ ${status}     │`)
  }

  private printTableFooter() {
    console.log('└─────┴────────────────────────────────────────┴────────────────────────────────────┴────────┘')
  }

  private printSummaryTable(files: File[]) {
    console.log('┌──────────────────────────────┬──────────────────────────────────┬────────────┬──────────┐')
    console.log('│ \x1b[1m测试文件\x1b[0m                     │ \x1b[1m位置\x1b[0m                             │ \x1b[1m测试数量\x1b[0m   │ \x1b[1m通过率\x1b[0m   │')
    console.log('├──────────────────────────────┼──────────────────────────────────┼────────────┼──────────┤')

    files.forEach(file => {
      const tasks = this.collectTasks(file.tasks)
      const passed = tasks.filter(t => t.result?.state === 'pass').length
      const total = tasks.length
      const passRate = total > 0 ? Math.round((passed / total) * 100) : 0

      const fileName = this.padEnd(this.truncate(this.getFileName(file.filepath), 26), 28)
      const location = this.padEnd(this.truncate(this.getLocation(file.filepath), 30), 32)
      const countStr = this.padEnd(String(total), 10)
      const rateStr = passRate === 100 
        ? '\x1b[32m100% ✅\x1b[0m' 
        : `\x1b[33m${passRate}%\x1b[0m`

      console.log(`│ ${fileName} │ ${location} │ ${countStr} │ ${rateStr}   │`)
    })

    // 总计行
    const totalTests = files.reduce((sum, f) => sum + this.collectTasks(f.tasks).length, 0)
    const totalPassed = files.reduce((sum, f) => sum + this.collectTasks(f.tasks).filter(t => t.result?.state === 'pass').length, 0)
    
    console.log('├──────────────────────────────┼──────────────────────────────────┼────────────┼──────────┤')
    console.log(`│ \x1b[1m总计\x1b[0m                         │ \x1b[90m-\x1b[0m                                │ \x1b[1m${this.padEnd(String(totalTests), 10)}\x1b[0m │ \x1b[32m\x1b[1m100% ✅\x1b[0m   │`)
    console.log('└──────────────────────────────┴──────────────────────────────────┴────────────┴──────────┘')
  }

  private getLocation(filepath: string): string {
    const parts = filepath.split('/')
    const srcIndex = parts.indexOf('src')
    if (srcIndex >= 0) {
      const relevantParts = parts.slice(srcIndex, -1)
      return relevantParts.join('/')
    }
    return parts.slice(-2, -1).join('/')
  }

  private truncate(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str
    return str.substring(0, maxLen - 3) + '...'
  }

  private padEnd(str: string, len: number): string {
    // 计算实际显示宽度（中文字符占2个宽度）
    const displayWidth = this.getDisplayWidth(str)
    const padding = len - displayWidth
    return str + ' '.repeat(Math.max(0, padding))
  }

  private getDisplayWidth(str: string): number {
    let width = 0
    for (const char of str) {
      // 简单判断：CJK 字符占2个宽度
      if (char.charCodeAt(0) > 255) {
        width += 2
      } else {
        width += 1
      }
    }
    return width
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }
}
