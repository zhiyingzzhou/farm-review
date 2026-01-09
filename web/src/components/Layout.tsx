import { Outlet, Link, useLocation } from "react-router-dom";
import { IconBookOpen, IconGithub, IconHeart, IconHistory, IconHome, IconSettings } from "./icons";
import { isPublicSite } from "../env";

const GITHUB_REPO_URL = "https://github.com/zhiyingzzhou/ai-code-reviewer";

const navItems = isPublicSite
  ? [
      { path: "/", label: "首页", Icon: IconHome },
      { path: "/docs", label: "文档", Icon: IconBookOpen },
    ]
  : [
      { path: "/", label: "首页", Icon: IconHome },
      { path: "/config", label: "配置", Icon: IconSettings },
      { path: "/history", label: "历史", Icon: IconHistory },
      { path: "/docs", label: "文档", Icon: IconBookOpen },
    ];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="relative min-h-screen flex flex-col bg-background circuit-grid">
      {/* Scanline overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-30">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)]" />
      </div>

      {/* Gradient mesh background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-tertiary/3 rounded-full blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative h-10 w-10 cyber-chamfer bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/50 flex items-center justify-center group-hover:shadow-neon transition-all duration-300">
              <span className="text-lg font-bold text-primary neon-text">FR</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold tracking-wider text-foreground">
                FARM Review
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-widest">
                智能代码审查
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const isActive =
                item.path === "/"
                  ? location.pathname === "/"
                  : location.pathname === item.path || location.pathname.startsWith(item.path + "/");
              const Icon = item.Icon;
              return (
                <Link key={item.path} to={item.path}>
                  <span
                    className={`btn cyber-chamfer-sm h-8 px-4 text-xs gap-2 ${
                      isActive
                        ? "border-2 border-primary bg-primary/10 text-primary shadow-neon-sm neon-text"
                        : "border border-border bg-muted/50 text-foreground hover:border-primary hover:text-primary hover:shadow-neon-sm"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </span>
                </Link>
              );
            })}
            {isPublicSite && (
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn cyber-chamfer-sm h-8 px-4 text-xs gap-2 border border-border bg-muted/50 text-foreground hover:border-primary hover:text-primary hover:shadow-neon-sm"
              >
                <IconGithub className="h-4 w-4" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="relative flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-background/50">
        <div className="container py-8">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Made with</span>
            <IconHeart className="h-4 w-4 text-secondary fill-secondary animate-pulse" />
            <span>by</span>
            <span className="text-foreground font-medium">FARM Review Team</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
