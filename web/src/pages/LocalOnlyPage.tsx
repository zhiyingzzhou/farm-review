import { NavLink } from "react-router-dom";
import { IconArrowLeft, IconTerminal } from "../components/icons";

type LocalOnlyType = "config" | "history" | "review";

const typeCopy: Record<
  LocalOnlyType,
  { title: string; description: string; command: string }
> = {
  config: {
    title: "配置页面仅支持本地运行",
    description:
      "配置会读写你电脑上的本地文件（如 API Key），因此不提供公网站点版本。",
    command: "npx farm-review config",
  },
  history: {
    title: "历史记录仅支持本地运行",
    description:
      "历史记录来自你本机的审查存档（~/.farm-review），因此不提供公网站点版本。",
    command: "npx farm-review history -l",
  },
  review: {
    title: "审查结果仅支持本地运行",
    description:
      "审查结果页面需要读取你本机的审查数据，并渲染对应 diff，因此不提供公网站点版本。",
    command: "npx farm-review review --no-open",
  },
};

export default function LocalOnlyPage({ type }: { type: LocalOnlyType }) {
  const copy = typeCopy[type];

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <NavLink to="/" className="btn-ghost inline-flex items-center gap-2 mb-6">
          <IconArrowLeft className="h-4 w-4" />
          返回首页
        </NavLink>

        <div className="card">
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-foreground">
                {copy.title}
              </h1>
              <p className="text-muted-foreground">{copy.description}</p>
            </div>

            <div className="cyber-chamfer terminal-card overflow-hidden">
              <div className="pt-10 pb-6 px-6 font-mono text-sm">
                <p className="text-muted-foreground mb-2 flex items-center gap-2">
                  <IconTerminal className="h-4 w-4" />
                  在你的项目目录运行：
                </p>
                <pre className="text-foreground overflow-x-auto">
                  <code>{copy.command}</code>
                </pre>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <NavLink to="/docs/quick-start" className="btn-secondary h-10 px-5 text-sm">
                查看安装与使用
              </NavLink>
              <NavLink to="/docs" className="btn-ghost h-10 px-5 text-sm">
                打开文档目录
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
