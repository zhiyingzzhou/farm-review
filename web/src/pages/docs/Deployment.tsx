import { IconExternalLink, IconGithub } from "../../components/icons";

export default function Deployment() {
  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wider flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 cyber-chamfer bg-secondary/10 border border-secondary/30 text-secondary neon-text-secondary">
            <IconExternalLink className="h-5 w-5" aria-hidden="true" />
          </span>
          部署文档站点
        </h1>
        <p className="text-muted-foreground">
          本项目的“官网 / Docs”是纯静态站点（不依赖本地 /api），可以单独部署到公网。下面给出 Vercel、Netlify、GitHub Pages、Cloudflare Pages 的最小配置与注意事项。
        </p>
      </header>

      <section className="card">
        <div className="p-6 space-y-4">
          <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-foreground">
            通用设置
          </h2>
          <ul className="space-y-2 text-muted-foreground list-disc pl-5">
            <li>
              构建命令：{" "}
              <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs">
                npm run build:site
              </code>
            </li>
            <li>
              输出目录：{" "}
              <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs">
                dist/site
              </code>
            </li>
            <li>
              需要 SPA fallback（把所有路径重写到{" "}
              <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs">
                /index.html
              </code>
              ），Vercel/Netlify/Cloudflare 已在仓库内提供配置文件。
            </li>
          </ul>
        </div>
      </section>

      <section className="card">
        <div className="p-6 space-y-4">
          <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-foreground">
            Vercel
          </h2>
          <ul className="space-y-2 text-muted-foreground list-disc pl-5">
            <li>
              配置文件：{" "}
              <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs">
                vercel.json
              </code>{" "}
              （已包含构建输出与 SPA rewrite）
            </li>
            <li>导入仓库后直接部署即可；如需手动配置：Build Command=build:site，Output Directory=dist/site</li>
          </ul>
        </div>
      </section>

      <section className="card">
        <div className="p-6 space-y-4">
          <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-foreground">
            Netlify
          </h2>
          <ul className="space-y-2 text-muted-foreground list-disc pl-5">
            <li>
              配置文件：{" "}
              <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs">
                netlify.toml
              </code>{" "}
              与{" "}
              <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs">
                public/_redirects
              </code>
            </li>
            <li>UI 里建站时：Build Command=build:site，Publish directory=dist/site</li>
          </ul>
        </div>
      </section>

      <section className="card">
        <div className="p-6 space-y-4">
          <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-foreground">
            Cloudflare Pages
          </h2>
          <ul className="space-y-2 text-muted-foreground list-disc pl-5">
            <li>Dashboard 里新建 Pages 项目：Build Command=build:site，Build output directory=dist/site</li>
            <li>
              SPA fallback：复用{" "}
              <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs">
                public/_redirects
              </code>
              （Cloudflare Pages 兼容该规则）
            </li>
            <li>
              可选：使用{" "}
              <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs">
                wrangler.toml
              </code>{" "}
              +{" "}
              <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs">
                npx wrangler pages deploy dist/site
              </code>{" "}
              通过 CLI 部署
            </li>
          </ul>
        </div>
      </section>

      <section className="card">
        <div className="p-6 space-y-4">
          <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
            <IconGithub className="h-5 w-5" aria-hidden="true" />
            GitHub Pages
          </h2>
          <ul className="space-y-2 text-muted-foreground list-disc pl-5">
            <li>
              已提供工作流：{" "}
              <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs">
                .github/workflows/deploy-site.yml
              </code>
            </li>
            <li>
              在仓库 Settings → Pages → Source 选择{" "}
              <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs">
                GitHub Actions
              </code>
              ，推送到 main/master 会自动部署
            </li>
            <li>
              GitHub Pages 不支持通用 rewrite，工作流使用{" "}
              <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs">
                npm run build:gh-pages
              </code>{" "}
              （HashRouter），站点 URL 形如{" "}
              <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs">
                /#/docs
              </code>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

