import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  IconAlertTriangle,
  IconHistory,
  IconSearch,
  IconFileDown,
  IconFileText,
  IconTrash,
} from "../components/icons";
import { downloadTextFile } from "../utils/download";
import { renderReport } from "../utils/report";

interface HistoryItem {
  id: string;
  projectPath: string;
  projectName: string;
  commits: Array<{
    shortHash: string;
    message: string;
  }>;
  provider: string;
  model: string;
  overallScore?: number;
  issueCount: number;
  createdAt: string;
  summary: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<"date" | "score" | "issues">("date");
  const [exportingId, setExportingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setHistory(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const deleteReview = async (id: string) => {
    if (!confirm("确定要删除这条审查记录吗？")) return;

    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setHistory((prev) => prev.filter((h) => h.id !== id));
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const sanitizeFilename = (name: string) =>
    name
      .trim()
      .replace(/[\/\\?%*:|"<>]/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const exportReview = async (
    item: HistoryItem,
    format: "markdown" | "html"
  ) => {
    setExportingId(item.id);
    try {
      const res = await fetch(`/api/reviews/${item.id}`);
      const data = await res.json();
      if (!data?.success) {
        throw new Error(data?.error || "导出失败");
      }

      const { content, extension } = renderReport(data.data, format);
      const baseName = sanitizeFilename(`farm-review-${item.projectName}-${item.id}`);
      const filename = `${baseName}.${extension}`;
      const mimeType =
        extension === "html"
          ? "text/html;charset=utf-8"
          : "text/markdown;charset=utf-8";
      downloadTextFile(content, filename, mimeType);
    } catch (error) {
      console.error("Export failed:", error);
      alert("导出失败，请稍后重试");
    } finally {
      setExportingId(null);
    }
  };

  const filteredHistory = history
    .filter(
      (h) =>
        !filter ||
        h.projectName.toLowerCase().includes(filter.toLowerCase()) ||
        h.provider.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "score":
          return (b.overallScore || 0) - (a.overallScore || 0);
        case "issues":
          return b.issueCount - a.issueCount;
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">加载历史记录...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-wider mb-4">
          <span className="inline-flex items-center justify-center gap-3 text-secondary">
            <IconHistory className="h-7 w-7" />
            审查历史
          </span>
        </h1>
        <p className="text-muted-foreground text-lg">查看和管理所有代码审查记录</p>
      </div>

      {/* Filters */}
      <div className="card mb-8">
        <div className="p-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <IconSearch className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input pl-9"
                placeholder="搜索项目名称或 AI 服务..."
              />
            </div>
          </div>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "date" | "score" | "issues")
            }
            className="select w-auto"
          >
            <option value="date">按时间排序</option>
            <option value="score">按评分排序</option>
            <option value="issues">按问题数排序</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      {history.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card glass-hover">
            <div className="p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary neon-text mb-2">{history.length}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">总审查次数</div>
            </div>
          </div>
          <div className="card glass-hover">
            <div className="p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-tertiary neon-text-tertiary mb-2">
              {Math.round(
                history.reduce((sum, h) => sum + (h.overallScore || 0), 0) /
                  history.length
              )}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">平均评分</div>
            </div>
          </div>
          <div className="card glass-hover">
            <div className="p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-destructive mb-2">
              {history.reduce((sum, h) => sum + h.issueCount, 0)}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">总问题数</div>
            </div>
          </div>
          <div className="card glass-hover">
            <div className="p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-secondary neon-text-secondary mb-2">
              {new Set(history.map((h) => h.projectName)).size}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">项目数量</div>
            </div>
          </div>
        </div>
      )}

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="card">
          <div className="p-12 text-center">
            <div className="flex justify-center mb-4">
              <IconAlertTriangle className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground uppercase tracking-wider mb-2">
              暂无审查记录
            </h3>
            <p className="text-muted-foreground mb-6">
              {filter
                ? "没有找到匹配的记录"
                : "运行 `farm review` 开始你的第一次代码审查"}
            </p>
            {filter && (
              <button onClick={() => setFilter("")} className="btn-secondary h-10 px-6">
                清除筛选
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="card glass-hover group"
            >
              <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Project Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-10 h-10 cyber-chamfer bg-muted flex items-center justify-center"
                    >
                      <IconFileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground">
                        {item.projectName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                  </div>

                  {/* Commits */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {item.commits.slice(0, 3).map((commit) => (
                      <span
                        key={commit.shortHash}
                        className="text-xs bg-muted/40 border border-border px-2 py-1 cyber-chamfer-sm font-mono"
                        title={commit.message}
                      >
                        {commit.shortHash}
                      </span>
                    ))}
                    {item.commits.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{item.commits.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Summary */}
                  <p className="text-muted-foreground text-sm mt-3 line-clamp-2">
                    {item.summary}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 lg:gap-8">
                  {item.overallScore !== undefined && (
                    <div className="text-center">
                      <div
                        className={`text-2xl font-bold ${
                          item.overallScore >= 80
                            ? "text-green-400"
                            : item.overallScore >= 60
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {item.overallScore}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase">评分</div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {item.issueCount}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase">问题</div>
                  </div>
                  <div className="badge-secondary">{item.provider}</div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 lg:ml-4">
                  <NavLink
                    to={`/review/${item.id}`}
                    className="btn-primary h-10 px-6"
                  >
                    查看详情
                  </NavLink>
                  <button
                    onClick={() => exportReview(item, "markdown")}
                    className="btn-secondary cyber-chamfer-sm h-10 px-3 text-xs gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                    title="导出 Markdown 报告"
                    disabled={exportingId === item.id}
                  >
                    <IconFileDown className="h-4 w-4" />
                    MD
                  </button>
                  <button
                    onClick={() => exportReview(item, "html")}
                    className="btn-secondary cyber-chamfer-sm h-10 px-3 text-xs gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                    title="导出 HTML 报告"
                    disabled={exportingId === item.id}
                  >
                    <IconFileDown className="h-4 w-4" />
                    HTML
                  </button>
                  <button
                    onClick={() => deleteReview(item.id)}
                    className="btn-ghost cyber-chamfer-sm h-10 px-3 text-destructive hover:text-destructive/80 
                             opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                    title="删除"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Info */}
      {filteredHistory.length > 0 && (
        <div className="text-center text-muted-foreground text-sm">
          显示 {filteredHistory.length} 条记录
          {filter && ` (筛选自 ${history.length} 条)`}
        </div>
      )}
    </div>
  );
}
