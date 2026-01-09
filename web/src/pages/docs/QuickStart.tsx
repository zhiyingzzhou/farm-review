export default function QuickStart() {
  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wider flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 cyber-chamfer bg-secondary/10 border border-secondary/30">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-secondary"
              aria-hidden="true"
            >
              <path d="M4.5 16.5c-1.5 1.5-1.5 4 0 5.5 1.5-1.5 4-1.5 5.5 0 1.5-1.5 1.5-4 0-5.5-1.5-1.5-4-1.5-5.5 0Z" />
              <path d="M9 18c0-5 5-10 10-10 0 5-5 10-10 10Z" />
              <path d="M12 12l-4-4" />
              <path d="M16 8l-4-4" />
            </svg>
          </span>
          快速开始
        </h1>
        <p className="text-muted-foreground">
          欢迎使用 FARM Review！本指南将帮助你快速在项目中设置并运行第一次代码审查。
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-foreground flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 cyber-chamfer-sm bg-primary/10 border border-primary/30 text-primary neon-text">
            1
          </span>
          先决条件
        </h2>
        <ul className="space-y-2 text-muted-foreground list-disc pl-5">
          <li>Node.js 18.0 或更高版本</li>
          <li>Git 版本控制系统</li>
          <li>有效的 AI 服务 API Key（如 OpenAI、Anthropic 等）</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-foreground flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 cyber-chamfer-sm bg-primary/10 border border-primary/30 text-primary neon-text">
            2
          </span>
          先配置
        </h2>
        <p className="text-muted-foreground">
          首次使用需要配置 AI 服务商与 API Key。运行下面的命令打开本地配置页：
        </p>

        <div className="cyber-chamfer terminal-card overflow-hidden">
          <div className="pt-10 pb-6 px-6 font-mono text-sm">
            <pre className="text-foreground overflow-x-auto">
              <code>npx farm-review config</code>
            </pre>
          </div>
        </div>

        <div className="cyber-chamfer holographic-card corner-accents">
          <div className="p-5 flex gap-3">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-tertiary shrink-0 mt-0.5"
              aria-hidden="true"
            >
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M12 2a7 7 0 0 0-4 12c.7.6 1 1.5 1 2.5V18h6v-1.5c0-1 .3-1.9 1-2.5a7 7 0 0 0-4-12Z" />
            </svg>
            <p className="text-muted-foreground">
              配置会保存到{" "}
              <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs">
                ~/.farm-review/config.json
              </code>
              。配置服务默认只监听本机地址（127.0.0.1）。
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-foreground flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 cyber-chamfer-sm bg-primary/10 border border-primary/30 text-primary neon-text">
            3
          </span>
          运行审查与查看结果
        </h2>
        <p className="text-muted-foreground">
          在 Git 仓库中运行审查命令，默认会启动本地 Web UI 并输出访问链接：
        </p>
        <div className="cyber-chamfer terminal-card overflow-hidden">
          <div className="pt-10 pb-6 px-6 font-mono text-sm">
            <pre className="text-foreground overflow-x-auto">
              <code>npx farm-review review</code>
            </pre>
          </div>
        </div>

        <p className="text-muted-foreground">
          你也可以查看历史记录，或把结果导出为文件：
        </p>
        <div className="cyber-chamfer terminal-card overflow-hidden">
          <div className="pt-10 pb-6 px-6 font-mono text-sm">
            <pre className="text-foreground overflow-x-auto">
              <code>{`npx farm-review history -l
npx farm-review export -i <review-id> -f markdown -o report.md`}</code>
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
