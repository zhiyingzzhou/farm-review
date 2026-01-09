export default function Configuration() {
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
              <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
              <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.03.03a2.2 2.2 0 0 1-1.56 3.76 2.2 2.2 0 0 1-1.56-.65l-.03-.03a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.09 1.63V21a2.2 2.2 0 0 1-4.4 0v-.04a1.8 1.8 0 0 0-1.09-1.63 1.8 1.8 0 0 0-1.98.36l-.03.03a2.2 2.2 0 0 1-3.11 0 2.2 2.2 0 0 1 0-3.11l.03-.03A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-1.63-1.09H2.93a2.2 2.2 0 0 1 0-4.4h.04A1.8 1.8 0 0 0 4.6 8.42a1.8 1.8 0 0 0-.36-1.98l-.03-.03a2.2 2.2 0 0 1 3.11-3.11l.03.03a1.8 1.8 0 0 0 1.98.36A1.8 1.8 0 0 0 10.42 2.9V2.86a2.2 2.2 0 0 1 4.4 0v.04a1.8 1.8 0 0 0 1.09 1.63 1.8 1.8 0 0 0 1.98-.36l.03-.03a2.2 2.2 0 0 1 3.11 3.11l-.03.03a1.8 1.8 0 0 0-.36 1.98 1.8 1.8 0 0 0 1.63 1.09h.04a2.2 2.2 0 0 1 0 4.4h-.04A1.8 1.8 0 0 0 19.4 15Z" />
            </svg>
          </span>
          配置指南
        </h1>
        <p className="text-muted-foreground">
          FARM Review 支持通过可视化配置页面与本地配置文件进行定制。
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-foreground">
          配置文件
        </h2>
        <p className="text-muted-foreground">
          配置文件默认存储在{" "}
          <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-sm">
            ~/.farm-review/config.json
          </code>
          ，推荐直接运行{" "}
          <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-sm">
            npx farm-review config
          </code>{" "}
          使用 Web 页面进行配置。
        </p>
        <div className="cyber-chamfer terminal-card overflow-hidden">
          <div className="pt-10 pb-6 px-6 font-mono text-sm">
            <pre className="text-foreground overflow-x-auto">
              <code>{`{
  // 默认 AI 提供商
  "defaultProvider": "openai",
  
  // AI 提供商配置
  "providers": {
    "openai": {
      "enabled": true,
      "model": "gpt-4o",
      "baseUrl": "https://api.openai.com/v1" // 可选: 自定义代理地址
    },
    "claude": {
        "enabled": false,
        "model": "claude-3-5-sonnet-20241022"
    },
    "ollama": {
        "enabled": false,
        "model": "llama3.2",
        "host": "http://localhost:11434"
    }
  },

  // 审查选项
  "review": {
    "language": "zh", // 审查报告语言: zh, en, etc.
    "maxFilesPerReview": 50, // 单次最大审查文件数
    "enableSecurityCheck": true, // 是否开启安全漏洞检测
    "enableQualityScore": true, // 是否计算代码质量评分
    "ignorePatterns": [ // 忽略的文件 Glob 模式
      "**/*.lock",
      "dist/**",
      "node_modules/**"
    ]
  },

  // CLI 历史记录服务
  "server": {
    "port": 3050,
    "autoOpen": true // 审查完成后自动打开浏览器
  }
	}`}</code>
            </pre>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-foreground">
          安全提示
        </h2>
        <p className="text-muted-foreground">
          API Key 会保存在本机的配置文件中，请确保你的设备与用户目录权限安全；如需停用某个 Provider，可在配置页将 API Key 清空并保存。
        </p>
        <ul className="space-y-2 text-muted-foreground list-disc pl-5">
          <li>配置服务默认仅监听本机地址，避免局域网访问。</li>
          <li>不要把配置文件加入版本控制（Git）或分享到公共渠道。</li>
          <li>如果你曾把 Token/Key 写进 Git remote URL，请立即在对应平台撤销并轮换。</li>
        </ul>
      </section>
    </div>
  );
}
