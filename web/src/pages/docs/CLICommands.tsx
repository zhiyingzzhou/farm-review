export default function CLICommands() {
  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wider flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 cyber-chamfer bg-secondary/10 border border-secondary/30 text-secondary neon-text-secondary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="m4 17 6-6-6-6" />
              <path d="M12 19h8" />
            </svg>
          </span>
          CLI 命令详解
        </h1>
        <p className="text-muted-foreground">
          FARM Review 提供了丰富的命令行选项，满足不同场景下的审查需求。
        </p>
      </header>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-foreground flex items-center gap-3">
            <span className="px-2 py-1 cyber-chamfer-sm bg-primary/10 border border-primary/30 text-primary font-mono text-sm">
              review
            </span>
            代码审查
          </h2>
          <p className="text-muted-foreground">
            这是最核心的命令，用于分析代码变更并生成审查报告。
          </p>
        </div>

        <div className="cyber-chamfer terminal-card overflow-hidden">
          <div className="pt-10 pb-6 px-6 font-mono text-sm">
            <pre className="text-foreground overflow-x-auto">
              <code>npx farm-review review [options]</code>
            </pre>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-display text-base font-semibold uppercase tracking-wider text-foreground">
            可选参数
          </h3>
          <div className="overflow-x-auto cyber-chamfer-sm border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-primary neon-text">参数 / 别名</th>
                  <th className="p-3 text-primary neon-text">默认值</th>
                  <th className="p-3 text-primary neon-text">描述</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-mono text-secondary">--commits &lt;hash&gt;</td>
                  <td className="p-3 font-mono text-muted-foreground">-</td>
                  <td className="p-3 text-muted-foreground">
                    指定要审查的特定提交 Hash（支持短 Hash），多个提交用逗号分隔。
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-secondary">--range &lt;base...head&gt;</td>
                  <td className="p-3 font-mono text-muted-foreground">-</td>
                  <td className="p-3 text-muted-foreground">
                    直接审查一个 ref 范围（如 <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs">origin/main...HEAD</code>），更适合 CI。
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-secondary">--base / --head</td>
                  <td className="p-3 font-mono text-muted-foreground">HEAD</td>
                  <td className="p-3 text-muted-foreground">
                    与 <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs">--range</code> 类似的范围写法，默认使用三点范围（merge-base..head）。
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-secondary">--count &lt;number&gt;</td>
                  <td className="p-3 font-mono text-muted-foreground">10</td>
                  <td className="p-3 text-muted-foreground">
                    指定获取最近提交的数量，用于交互式选择。
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-secondary">--provider &lt;name&gt;</td>
                  <td className="p-3 font-mono text-muted-foreground">配置默认值</td>
                  <td className="p-3 text-muted-foreground">
                    指定本次审查使用的 AI 提供商（如{" "}
                    <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs">
                      openai
                    </code>
                    、{" "}
                    <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs">
                      claude
                    </code>
                    ）。
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-secondary">--port &lt;number&gt;</td>
                  <td className="p-3 font-mono text-muted-foreground">3050</td>
                  <td className="p-3 text-muted-foreground">指定结果查看服务器的端口。</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-secondary">--no-open</td>
                  <td className="p-3 font-mono text-muted-foreground">false</td>
                  <td className="p-3 text-muted-foreground">审查完成后不自动打开浏览器。</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-secondary">--no-ui</td>
                  <td className="p-3 font-mono text-muted-foreground">false</td>
                  <td className="p-3 text-muted-foreground">不启动结果查看 Web 服务（CI 推荐）。</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-secondary">--fail-on &lt;level&gt;</td>
                  <td className="p-3 font-mono text-muted-foreground">none</td>
                  <td className="p-3 text-muted-foreground">
                    当发现指定级别及以上问题时返回非零退出码（none/info/warning/critical）。
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-secondary">--format / --output</td>
                  <td className="p-3 font-mono text-muted-foreground">-</td>
                  <td className="p-3 text-muted-foreground">审查完成后自动导出报告（markdown/html/json）。</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-secondary">--comment</td>
                  <td className="p-3 font-mono text-muted-foreground">false</td>
                  <td className="p-3 text-muted-foreground">在 GitHub Pull Request 上回写审查摘要（需 Token 与 PR 上下文）。</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-secondary">--all-files</td>
                  <td className="p-3 font-mono text-muted-foreground">false</td>
                  <td className="p-3 text-muted-foreground">不裁剪文件，改为按批次审查全部文件（更慢/更贵）。</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-secondary">--batch-size &lt;number&gt;</td>
                  <td className="p-3 font-mono text-muted-foreground">maxFilesPerReview</td>
                  <td className="p-3 text-muted-foreground">分批大小（默认使用配置的 maxFilesPerReview）。</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-foreground flex items-center gap-3">
            <span className="px-2 py-1 cyber-chamfer-sm bg-primary/10 border border-primary/30 text-primary font-mono text-sm">
              history
            </span>
            历史记录
          </h2>
          <p className="text-muted-foreground">
            启动本地 Web 服务器，查看过往的所有审查记录和详细报告。
          </p>
        </div>

        <div className="cyber-chamfer terminal-card overflow-hidden">
          <div className="pt-10 pb-6 px-6 font-mono text-sm">
            <pre className="text-foreground overflow-x-auto">
              <code>npx farm-review history [options]</code>
            </pre>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-display text-base font-semibold uppercase tracking-wider text-foreground">
            可选参数
          </h3>
          <ul className="space-y-2 text-muted-foreground list-disc pl-5">
            <li>
              <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs">
                --port &lt;number&gt;
              </code>
              ：指定 Web 服务器端口（默认：3050）
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-foreground flex items-center gap-3">
            <span className="px-2 py-1 cyber-chamfer-sm bg-primary/10 border border-primary/30 text-primary font-mono text-sm">
              config
            </span>
            快速配置
          </h2>
          <p className="text-muted-foreground">
            启动本地配置页面，帮助你快速设置 API Key、选择默认模型等。配置默认保存在用户主目录（~/.farm-review/config.json）。
          </p>
        </div>

        <div className="cyber-chamfer terminal-card overflow-hidden">
          <div className="pt-10 pb-6 px-6 font-mono text-sm">
            <pre className="text-foreground overflow-x-auto">
              <code>npx farm-review config</code>
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
