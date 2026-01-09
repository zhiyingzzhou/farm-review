import { NavLink } from "react-router-dom";
import {
  IconArrowLeft,
  IconBot,
  IconHelpCircle,
  IconRefreshCw,
  IconRocket,
  IconSettings,
  IconTerminal,
  IconExternalLink,
} from "../components/icons";

export default function DocsPage() {
  const docs = [
    {
      title: "快速开始",
      description: "了解如何安装、配置并运行你的第一次代码审查。",
      link: "/docs/quick-start",
      Icon: IconRocket,
    },
    {
      title: "配置指南",
      description: "详解配置选项，包括 AI 提供商、提示词自定义等。",
      link: "/docs/config",
      Icon: IconSettings,
    },
    {
      title: "CLI 命令",
      description: "掌握所有可用的命令行工具参数和用法。",
      link: "/docs/cli",
      Icon: IconTerminal,
    },
    {
      title: "AI 模型",
      description: "支持的模型列表及特定模型的最佳实践。",
      link: "/docs/models",
      Icon: IconBot,
    },
    {
      title: "CI/CD 集成",
      description: "将代码审查自动化集成到你的 GitHub Actions 或 Jenkins 流水线中。",
      link: "/docs/ci-cd",
      Icon: IconRefreshCw,
    },
    {
      title: "部署站点",
      description: "将官网/文档站点部署到 Vercel、Netlify、GitHub Pages 或 Cloudflare Pages。",
      link: "/docs/deploy",
      Icon: IconExternalLink,
    },
    {
      title: "常见问题",
      description: "解答常见疑问和故障排除技巧。",
      link: "/docs/faq",
      Icon: IconHelpCircle,
    },
  ];

  return (
    <div>
      <section className="relative py-20 lg:py-24 overflow-hidden">
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <NavLink to="/" className="btn-ghost inline-flex items-center gap-2 mb-8">
              <IconArrowLeft className="h-4 w-4" />
              返回首页
            </NavLink>

            <h1 className="font-display text-5xl md:text-6xl font-black uppercase tracking-wider mb-6">
              <span className="text-gradient-cyber">使用文档</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              探索 AI 代码审查工具的全部功能，
              <br className="hidden md:block" />
              从入门到精通的完整指南
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 relative">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {docs.map((doc, index) => {
              const Icon = doc.Icon;
              return (
                <NavLink key={doc.title} to={doc.link} className="block" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="card glass-hover group h-full">
                    <div className="p-6">
                      <div className="w-12 h-12 cyber-chamfer bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 group-hover:shadow-neon transition-all duration-300">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-display text-xl font-semibold uppercase tracking-wide leading-none text-foreground">
                        {doc.title}
                      </h3>
                      <p className="text-muted-foreground mt-3">{doc.description}</p>
                    </div>
                  </div>
                </NavLink>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 relative">
        <div className="container">
          <div className="cyber-chamfer holographic-card corner-accents max-w-2xl mx-auto">
            <div className="p-12 text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wider mb-4">
                需要更多帮助?
              </h2>
              <p className="text-muted-foreground mb-8">
                如果文档没有解决你的问题，欢迎提交 Issue 或加入我们的社区。
              </p>
              <a
                href="https://github.com/zhiyingzzhou/ai-code-reviewer/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary h-12 px-8 text-base gap-2"
              >
                提交 Issue
                <IconExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
