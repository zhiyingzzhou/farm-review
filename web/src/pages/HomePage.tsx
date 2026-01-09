import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  IconArrowRight,
  IconBarChart,
  IconBot,
  IconFileDown,
  IconFileText,
  IconGitCompare,
  IconSettings,
  IconShield,
  IconSparkles,
  IconSquare,
  IconZap,
  IconBookOpen,
} from "../components/icons";
import { isPublicSite } from "../env";

interface HistoryItem {
  id: string;
  projectName: string;
  overallScore?: number;
  issueCount: number;
  createdAt: string;
  provider: string;
}

export default function HomePage() {
  const [recentReviews, setRecentReviews] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPublicSite) {
      setLoading(false);
      return;
    }

    let canceled = false;
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => {
        if (!canceled && data.success) {
          setRecentReviews(data.data.slice(-5).reverse());
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!canceled) setLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, []);

  const features = [
    {
      Icon: IconBot,
      title: "多 AI 支持",
      description: "支持 OpenAI、Claude、Gemini、Azure、Ollama 等多种 AI 服务",
    },
    {
      Icon: IconShield,
      title: "安全检测",
      description: "自动检测代码中的安全漏洞和潜在风险",
    },
    {
      Icon: IconBarChart,
      title: "质量评分",
      description: "提供整体代码质量评分和详细改进建议",
    },
    {
      Icon: IconGitCompare,
      title: "Diff 可视化",
      description: "使用 git-diff-view 展示代码变更和审查意见",
    },
    {
      Icon: IconFileDown,
      title: "导出报告",
      description: "支持导出 Markdown、HTML、JSON 格式报告",
    },
    {
      Icon: IconZap,
      title: "简单易用",
      description: "通过 npx 快速启动，无需复杂配置",
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="container relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="badge-success mb-6 animate-pulse-neon">
              <IconSparkles className="h-3 w-3 mr-1" />
              v1.0.0 正式发布
            </div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-wider mb-6">
              <span className="text-primary neon-text cyber-glitch" data-text="AI 驱动的">
                AI 驱动的
              </span>
              <br />
              <span className="text-gradient-cyber">代码审查工具</span>
            </h1>

            <p className="page-subtitle max-w-2xl mb-10">
              使用先进的 AI 技术自动审查代码，发现潜在问题，
              <br className="hidden md:block" />
              提供改进建议，提升代码质量
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {isPublicSite ? (
                <NavLink to="/docs/quick-start" className="btn-primary h-12 px-8 text-base gap-2">
                  <IconArrowRight className="h-5 w-5" />
                  安装与使用
                </NavLink>
              ) : (
                <NavLink to="/config" className="btn-primary h-12 px-8 text-base gap-2">
                  <IconSettings className="h-5 w-5" />
                  开始配置
                </NavLink>
              )}
              <NavLink to="/docs" className="btn-secondary h-12 px-8 text-base gap-2">
                <IconBookOpen className="h-5 w-5" />
                查看文档
              </NavLink>
            </div>
          </div>

          {/* Terminal Demo */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="cyber-chamfer terminal-card overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-7 flex items-center gap-2 px-4 bg-muted border-b border-border z-10">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="ml-4 text-xs text-muted-foreground uppercase tracking-wider">
                  Terminal
                </span>
              </div>

              <div className="pt-10 pb-6 font-mono text-sm text-left px-6">
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    <span className="text-tertiary">$</span> npx farm-review review
                  </p>
                  <p className="text-primary flex items-center gap-2">
                    <IconSparkles className="h-4 w-4" />
                    <span>FARM Review - 智能代码审查工具</span>
                  </p>
                  <div className="mt-4 space-y-1">
                    <p>
                      <IconSquare className="h-3 w-3 text-secondary inline-block" />{" "}
                      <span className="text-muted-foreground">扫描代码变更</span>
                    </p>
                    <p>
                      项目名称: <span className="text-primary">my-project</span>
                    </p>
                    <p>
                      当前分支: <span className="text-primary">main</span>
                    </p>
                  </div>
                  <div className="mt-4 space-y-1">
                    <p className="text-muted-foreground">? 请选择要审查的提交:</p>
                    <p className="text-primary">
                      <span className="text-secondary">›</span> abc1234 - feat: add new feature
                    </p>
                    <p className="text-muted-foreground">&nbsp; def5678 - fix: resolve bug</p>
                  </div>
                  <p className="mt-4 text-primary">
                    ✓ 代码审查完成! 整体评分: <span className="text-secondary font-bold">85/100</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Install & Usage (public site) */}
      {isPublicSite && (
        <section className="py-16 relative">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wider mb-3">
                  <span className="text-gradient-secondary">安装与使用</span>
                </h2>
                <p className="text-muted-foreground">
                  三步上手：安装 → 配置 → 审查（建议先读「快速开始」）
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card glass-hover">
                  <div className="p-6 space-y-3">
                    <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-foreground">
                      1) 安装
                    </h3>
                    <div className="cyber-chamfer terminal-card overflow-hidden">
                      <div className="pt-10 pb-6 px-6 font-mono text-sm">
                        <pre className="text-foreground overflow-x-auto">
                          <code>npm i -g farm-review</code>
                        </pre>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      也可以用 <code className="font-mono">npx farm-review</code> 直接运行。
                    </p>
                  </div>
                </div>

                <div className="card glass-hover">
                  <div className="p-6 space-y-3">
                    <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-foreground">
                      2) 配置
                    </h3>
                    <div className="cyber-chamfer terminal-card overflow-hidden">
                      <div className="pt-10 pb-6 px-6 font-mono text-sm">
                        <pre className="text-foreground overflow-x-auto">
                          <code>farm config</code>
                        </pre>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      打开本地配置页，设置 Provider / API Key / 模型等。
                    </p>
                  </div>
                </div>

                <div className="card glass-hover">
                  <div className="p-6 space-y-3">
                    <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-foreground">
                      3) 审查
                    </h3>
                    <div className="cyber-chamfer terminal-card overflow-hidden">
                      <div className="pt-10 pb-6 px-6 font-mono text-sm">
                        <pre className="text-foreground overflow-x-auto">
                          <code>farm review</code>
                        </pre>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      在 Git 仓库里运行，交互选择提交或用 <code className="font-mono">--range</code> 指定范围。
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                <NavLink to="/docs/quick-start" className="btn-primary h-10 px-6 text-sm gap-2">
                  快速开始
                  <IconArrowRight className="h-4 w-4" />
                </NavLink>
                <NavLink to="/docs/cli" className="btn-secondary h-10 px-6 text-sm gap-2">
                  CLI 参数
                  <IconBookOpen className="h-4 w-4" />
                </NavLink>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-wider mb-4">
              <span className="text-gradient-secondary">强大功能</span>
            </h2>
            <p className="text-muted-foreground text-lg">为你的代码审查工作流程提供全方位支持</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.Icon;
              return (
                <div key={feature.title} className="card glass-hover group" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="p-6">
                    <div className="w-12 h-12 cyber-chamfer bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 group-hover:shadow-neon transition-all duration-300">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-display text-xl font-semibold uppercase tracking-wide leading-none text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground mt-3">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recent Reviews Section */}
      {!isPublicSite && !loading && recentReviews.length > 0 && (
        <section className="py-20 relative">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-secondary">
                最近审查
              </h2>
              <NavLink to="/history" className="btn-ghost gap-2">
                查看全部
                <IconArrowRight className="h-4 w-4" />
              </NavLink>
            </div>

            <div className="space-y-4">
              {recentReviews.map((review) => (
                <NavLink key={review.id} to={`/review/${review.id}`} className="block">
                  <div className="card glass-hover">
                    <div className="p-6 flex items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 cyber-chamfer bg-muted flex items-center justify-center">
                          <IconFileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-display font-semibold text-foreground">{review.projectName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(review.createdAt).toLocaleString("zh-CN")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary neon-text">
                            {review.overallScore ?? "--"}
                          </div>
                          <div className="text-xs text-muted-foreground uppercase">评分</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-destructive">{review.issueCount}</div>
                          <div className="text-xs text-muted-foreground uppercase">问题</div>
                        </div>
                        <div className="badge badge-secondary">{review.provider}</div>
                      </div>
                    </div>
                  </div>
                </NavLink>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container">
          <div className="cyber-chamfer holographic-card corner-accents max-w-2xl mx-auto">
            <div className="p-12 text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wider mb-4">
                准备好开始了吗?
              </h2>
              <p className="text-muted-foreground mb-8">
                {isPublicSite ? "从快速开始开始，了解安装、配置和常用命令。" : "配置你的 AI 服务，开始进行本地代码审查。"}
              </p>
              <NavLink
                to={isPublicSite ? "/docs/quick-start" : "/config"}
                className="btn-primary h-12 px-8 text-base gap-2"
              >
                {isPublicSite ? "快速开始" : "开始"}
                <IconArrowRight className="h-4 w-4" />
              </NavLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
