import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  IconArrowLeft,
  IconBot,
  IconExternalLink,
  IconHelpCircle,
  IconRefreshCw,
  IconRocket,
  IconSettings,
  IconTerminal,
} from "./icons";

const sidebarLinks = [
  { path: "/docs/quick-start", title: "快速开始", Icon: IconRocket },
  { path: "/docs/config", title: "配置指南", Icon: IconSettings },
  { path: "/docs/cli", title: "CLI 命令", Icon: IconTerminal },
  { path: "/docs/models", title: "AI 模型", Icon: IconBot },
  { path: "/docs/ci-cd", title: "CI/CD 集成", Icon: IconRefreshCw },
  { path: "/docs/deploy", title: "部署站点", Icon: IconExternalLink },
  { path: "/docs/faq", title: "常见问题", Icon: IconHelpCircle },
];

export default function DocLayout() {
  const location = useLocation();
  const isOverview = location.pathname === "/docs" || location.pathname === "/docs/";

  if (isOverview) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-2">
            <div className="mb-6 px-4">
              <NavLink
                to="/docs"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-mono uppercase tracking-wider"
              >
                <IconArrowLeft className="h-4 w-4" />
                返回文档概览
              </NavLink>
            </div>
            {sidebarLinks.map((link) => (
              <NavLink key={link.path} to={link.path}>
                {({ isActive }) => {
                  const Icon = link.Icon;
                  return (
                    <span
                      className={`btn cyber-chamfer-sm w-full justify-start px-4 py-3 ${
                        isActive
                          ? "border-2 border-primary bg-primary/10 text-primary shadow-neon-sm neon-text"
                          : "border border-border bg-muted/20 text-foreground hover:border-primary hover:text-primary hover:shadow-neon-sm"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{link.title}</span>
                    </span>
                  );
                }}
              </NavLink>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="card p-8 min-h-[calc(100vh-12rem)] animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
