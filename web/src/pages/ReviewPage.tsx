import { useState, useEffect, useMemo, useRef, type ComponentType } from "react";
import { useParams, NavLink } from "react-router-dom";
import { DiffView, DiffModeEnum } from "@git-diff-view/react";
import { DiffFile } from "@git-diff-view/core";
import "@git-diff-view/react/styles/diff-view.css";
import type { IconProps } from "../components/icons";
import { downloadTextFile } from "../utils/download";
import { renderReport } from "../utils/report";
import {
  IconAlertTriangle,
  IconBarChart,
  IconCheck,
  IconExpand,
  IconFileDown,
  IconFileText,
  IconGitCommit,
  IconInfo,
  IconLightbulb,
  IconMessageSquare,
  IconSearch,
  IconShield,
  IconX,
  IconZap,
} from "../components/icons";

// 简单的模糊搜索函数
function fuzzyMatch(text: string, query: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let queryIndex = 0;
  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      queryIndex++;
    }
  }
  return queryIndex === lowerQuery.length;
}

interface ReviewComment {
  id: string;
  file: string;
  line: number;
  endLine?: number;
  type: "issue" | "suggestion" | "security" | "performance" | "style" | "info";
  severity: "critical" | "warning" | "info";
  message: string;
  suggestion?: string;
  code?: string;
}

interface FileReview {
  file: string;
  comments: ReviewComment[];
  summary: string;
  qualityScore?: number;
}

interface SecurityIssue {
  id: string;
  file: string;
  line: number;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  recommendation: string;
}

interface GitCommit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  authorEmail: string;
  date: string;
}

interface ReviewResult {
  id: string;
  commits: GitCommit[];
  files: FileReview[];
  summary: string;
  overallScore?: number;
  securityIssues?: SecurityIssue[];
  createdAt: string;
  provider: string;
  model: string;
  diff: string;
}

// 从完整 diff 中提取单个文件的 diff
function extractFileDiff(fullDiff: string, targetFile: string): string | null {
  const lines = fullDiff.split("\n");
  let inTargetFile = false;
  let fileDiffLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("diff --git")) {
      if (inTargetFile) {
        // 遇到下一个文件，结束当前文件的收集
        break;
      }
      // 检查是否是目标文件
      const match = line.match(/diff --git a\/(.+?) b\/(.+)/);
      if (match) {
        const [, oldPath, newPath] = match;
        if (
          oldPath === targetFile ||
          newPath === targetFile ||
          oldPath.endsWith("/" + targetFile) ||
          newPath.endsWith("/" + targetFile)
        ) {
          inTargetFile = true;
          fileDiffLines.push(line);
        }
      }
    } else if (inTargetFile) {
      fileDiffLines.push(line);
    }
  }

  return fileDiffLines.length > 0 ? fileDiffLines.join("\n") : null;
}

// 将完整的 diff 文本包装为 hunks 数组
// @git-diff-view 需要完整的 diff 字符串（包含 diff --git, ---, +++, @@ 等）
function parseHunksFromDiff(diffText: string): string[] {
  if (!diffText || !diffText.includes("@@")) {
    return [];
  }
  // 返回完整的 diff 文本作为单个 hunk
  return [diffText];
}

// 从 diff 提取文件名
function extractFileNames(diffText: string): {
  oldFileName: string;
  newFileName: string;
} {
  const lines = diffText.split("\n");
  let oldFileName = "";
  let newFileName = "";

  for (const line of lines) {
    if (line.startsWith("--- ")) {
      oldFileName = line.substring(4);
      if (oldFileName.startsWith("a/")) {
        oldFileName = oldFileName.substring(2);
      }
    } else if (line.startsWith("+++ ")) {
      newFileName = line.substring(4);
      if (newFileName.startsWith("b/")) {
        newFileName = newFileName.substring(2);
      }
    }
    if (oldFileName && newFileName) break;
  }

  return { oldFileName, newFileName };
}

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "files" | "security">(
    "overview"
  );
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [diffMode, setDiffMode] = useState<DiffModeEnum>(DiffModeEnum.Split);
  const [fileSearchQuery, setFileSearchQuery] = useState("");
  const [showDiffModal, setShowDiffModal] = useState(false);
  const fileListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/reviews/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setReview(data.data);
          if (data.data.files.length > 0) {
            setSelectedFile(data.data.files[0].file);
          }
        } else {
          setError(data.error || "加载失败");
        }
      })
      .catch(() => setError("加载失败"))
      .finally(() => setLoading(false));
  }, [id]);

  const selectedFileReview = useMemo(() => {
    if (!review || !selectedFile) return null;
    return review.files.find((f) => f.file === selectedFile);
  }, [review, selectedFile]);

  // 提取文件的 diff 数据并创建 DiffFile 实例
  const fileDiffData = useMemo(() => {
    if (!review || !selectedFile) return null;

    const fileDiffText = extractFileDiff(review.diff, selectedFile);
    if (!fileDiffText) return null;

    const hunks = parseHunksFromDiff(fileDiffText);
    const { oldFileName, newFileName } = extractFileNames(fileDiffText);

    // 获取文件语言
    const ext = selectedFile.split('.').pop()?.toLowerCase() || '';
    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript', 
      jsx: 'javascript',
      py: 'python',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      css: 'css',
      scss: 'scss',
      html: 'html',
      json: 'json',
      md: 'markdown',
      yaml: 'yaml',
      yml: 'yaml',
    };
    const fileLang = langMap[ext] || ext;

    // 创建 DiffFile 实例
    let diffFile: DiffFile | null = null;
    if (hunks.length > 0) {
      try {
        diffFile = DiffFile.createInstance({
          oldFile: {
            fileName: oldFileName === '/dev/null' ? '' : oldFileName || selectedFile,
            fileLang: fileLang,
            content: '',
          },
          newFile: {
            fileName: newFileName === '/dev/null' ? '' : newFileName || selectedFile,
            fileLang: fileLang,
            content: '',
          },
          hunks: hunks,
        });
        
        // 初始化 DiffFile
        diffFile.initTheme('dark');
        diffFile.init();
        diffFile.buildSplitDiffLines();
        diffFile.buildUnifiedDiffLines();
      } catch (err) {
        console.error('Failed to create DiffFile:', err);
        diffFile = null;
      }
    }

    // 检测是否只有新增代码（没有删除）
    const isAddOnly = diffFile ? diffFile.deletionLength === 0 && diffFile.additionLength > 0 : false;

    return {
      diffText: fileDiffText,
      hunks,
      oldFileName: oldFileName === '/dev/null' ? '' : oldFileName || selectedFile,
      newFileName: newFileName === '/dev/null' ? '' : newFileName || selectedFile,
      fileLang,
      diffFile,
      isAddOnly,
    };
  }, [review, selectedFile]);

  // 当只有新增代码时，自动切换到统一视图
  useEffect(() => {
    if (fileDiffData?.isAddOnly) {
      setDiffMode(DiffModeEnum.Unified);
    } else if (fileDiffData?.diffFile) {
      setDiffMode(DiffModeEnum.Split);
    }
  }, [fileDiffData]);

  // 过滤后的文件列表（支持模糊搜索）
  const filteredFiles = useMemo(() => {
    if (!review) return [];
    if (!fileSearchQuery.trim()) return review.files;
    return review.files.filter(
      (file) =>
        fuzzyMatch(file.file, fileSearchQuery) ||
        fuzzyMatch(file.file.split("/").pop() || "", fileSearchQuery)
    );
  }, [review, fileSearchQuery]);

  // 是否显示搜索框（超过10个文件）
  const showFileSearch = review && review.files.length > 10;

  const severityColors: Record<string, string> = {
    critical: "text-red-400 bg-red-500/20",
    high: "text-orange-400 bg-orange-500/20",
    medium: "text-yellow-400 bg-yellow-500/20",
    low: "text-green-400 bg-green-500/20",
    warning: "text-yellow-400 bg-yellow-500/20",
    info: "text-blue-400 bg-blue-500/20",
  };

  const typeIcons: Record<ReviewComment["type"], ComponentType<IconProps>> = {
      issue: IconAlertTriangle,
      suggestion: IconLightbulb,
      security: IconShield,
      performance: IconZap,
      style: IconFileText,
      info: IconInfo,
    };

  if (loading) {
    return (
      <div className="container py-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">加载审查结果...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="container py-12">
        <div className="text-center py-20">
          <p className="text-destructive text-lg mb-4 inline-flex items-center justify-center gap-2">
            <IconAlertTriangle className="h-5 w-5" />
            {error || "审查结果不存在"}
          </p>
          <NavLink to="/history" className="btn-primary">
            返回历史记录
          </NavLink>
        </div>
      </div>
    );
  }

  const totalIssues = review.files.reduce(
    (sum, f) => sum + f.comments.length,
    0
  );
  const criticalIssues = review.files.reduce(
    (sum, f) =>
      sum + f.comments.filter((c) => c.severity === "critical").length,
    0
  );

  const exportReview = (format: "markdown" | "html") => {
    const { content, extension } = renderReport(review, format);
    const filename = `farm-review-${review.id}.${extension}`;
    const mimeType =
      extension === "html"
        ? "text/html;charset=utf-8"
        : "text/markdown;charset=utf-8";
    downloadTextFile(content, filename, mimeType);
  };

  return (
    <div className="container py-12">
      {/* Review Header */}
      <div className="card mb-8">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <IconBarChart className="h-8 w-8 text-secondary" />
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-3">
                  代码审查结果
                  <span className="badge-tertiary">{review.provider}</span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  {new Date(review.createdAt).toLocaleString("zh-CN")} · {review.model}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-col gap-4 items-start lg:items-end">
              <div className="flex items-center gap-8 flex-wrap justify-start lg:justify-end">
                {review.overallScore !== undefined && (
                <div className="text-center">
                    <div
                      className={`text-4xl font-bold ${
                        review.overallScore >= 80
                          ? "text-primary neon-text"
                          : review.overallScore >= 60
                          ? "text-yellow-400"
                          : "text-destructive"
                      }`}
                    >
                      {review.overallScore}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      整体评分
                    </div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-4xl font-bold text-foreground">{review.files.length}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">文件</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-destructive">{totalIssues}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">问题</div>
                </div>
                {criticalIssues > 0 && (
                  <div className="text-center">
                    <div className="text-4xl font-bold text-destructive">{criticalIssues}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">严重</div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => exportReview("markdown")}
                  className="btn-secondary h-10 px-4 text-sm gap-2"
                  title="导出 Markdown 报告"
                >
                  <IconFileDown className="h-4 w-4" />
                  导出 Markdown
                </button>
                <button
                  onClick={() => exportReview("html")}
                  className="btn-secondary h-10 px-4 text-sm gap-2"
                  title="导出 HTML 报告"
                >
                  <IconFileDown className="h-4 w-4" />
                  导出 HTML
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Commit Info */}
      <div className="card mb-8">
        <div className="p-6">
          <h2 className="font-display text-lg font-semibold uppercase tracking-wider flex items-center gap-2 mb-4 text-foreground">
            <IconGitCommit className="h-5 w-5 text-destructive" />
            审查的提交
          </h2>
          <div className="space-y-2">
            {review.commits.map((commit) => (
              <div
                key={commit.hash}
                className="flex items-center justify-between gap-6 p-3 cyber-chamfer-sm bg-muted/20 border border-border"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="badge border border-border text-foreground">{commit.shortHash}</span>
                  <span className="text-foreground truncate">{commit.message}</span>
                </div>
                <div className="text-sm text-muted-foreground shrink-0">
                  {commit.author} · {new Date(commit.date).toLocaleDateString("zh-CN")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex items-center justify-start gap-2 p-1 flex-wrap mb-6">
        <button onClick={() => setActiveTab("overview")} className={activeTab === "overview" ? "tab-active" : "tab"}>
          <IconBarChart className="h-4 w-4" />
          概览
        </button>
        <button onClick={() => setActiveTab("files")} className={activeTab === "files" ? "tab-active" : "tab"}>
          <IconFileText className="h-4 w-4" />
          文件审查 ({review.files.length})
        </button>
        {review.securityIssues && review.securityIssues.length > 0 && (
          <button onClick={() => setActiveTab("security")} className={activeTab === "security" ? "tab-active" : "tab"}>
            <IconShield className="h-4 w-4" />
            安全问题 ({review.securityIssues.length})
          </button>
        )}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="card">
          <div className="p-6">
            <h2 className="font-display text-lg font-semibold uppercase tracking-wider flex items-center gap-2 mb-4 text-foreground">
              <IconFileText className="h-5 w-5 text-secondary" />
              审查总结
            </h2>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">{review.summary}</p>
          </div>
        </div>
      )}

      {/* Files Tab */}
      {activeTab === "files" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* File List */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="p-4 pb-2">
                <h3 className="font-display text-sm uppercase tracking-wider text-muted-foreground">
                  文件列表 ({review.files.length})
                </h3>
              </div>
              <div className="p-2">
                {showFileSearch && (
                  <div className="relative p-2 pb-3">
                    <IconSearch className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={fileSearchQuery}
                      onChange={(e) => setFileSearchQuery(e.target.value)}
                      placeholder="搜索文件..."
                      className="input w-full py-2 pl-10 pr-10 text-sm"
                    />
                    {fileSearchQuery && (
                      <button
                        onClick={() => setFileSearchQuery("")}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        title="清除"
                      >
                        <IconX className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}

                <div ref={fileListRef} className="space-y-1 max-h-[60vh] overflow-y-auto">
                  {filteredFiles.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">未找到匹配的文件</div>
                  ) : (
                    filteredFiles.map((file) => (
                      <button
                        key={file.file}
                        onClick={() => setSelectedFile(file.file)}
                        className={`w-full text-left p-3 cyber-chamfer-sm transition-all duration-200 ${
                          selectedFile === file.file
                            ? "bg-primary/10 border border-primary text-primary"
                            : "hover:bg-muted/50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-sm font-medium truncate">{file.file.split("/").pop()}</span>
                          {file.comments.length > 0 && (
                            <span className="badge-danger text-xs">{file.comments.length}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{file.file}</div>
                        {file.qualityScore !== undefined && (
                          <div className="mt-2 h-1 bg-muted cyber-chamfer-sm overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                file.qualityScore >= 90
                                  ? "bg-primary"
                                  : file.qualityScore >= 70
                                  ? "bg-yellow-500"
                                  : "bg-destructive"
                              }`}
                              style={{ width: `${Math.max(0, Math.min(100, file.qualityScore))}%` }}
                            />
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* File Detail */}
          <div className="lg:col-span-3">
            {selectedFileReview ? (
              <div className="card">
                <div className="p-6 border-b border-border">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-mono text-sm font-medium text-foreground break-all">{selectedFile}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{selectedFileReview.summary}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <select
                        value={diffMode}
                        onChange={(e) => setDiffMode(Number(e.target.value) as DiffModeEnum)}
                        className="select py-2 text-sm w-32"
                      >
                        <option value={DiffModeEnum.Unified}>统一视图</option>
                        <option value={DiffModeEnum.Split}>并排视图</option>
                      </select>
                      {fileDiffData?.diffFile && (
                        <button
                          onClick={() => setShowDiffModal(true)}
                          className="btn-secondary h-10 w-10 p-0"
                          title="全屏查看"
                        >
                          <IconExpand className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Review Comments */}
                  {selectedFileReview.comments.length > 0 && (
                    <div className="mb-6 space-y-4">
                      <h4 className="font-display text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <IconMessageSquare className="h-4 w-4" />
                        审查意见 ({selectedFileReview.comments.length})
                      </h4>

                      {selectedFileReview.comments.map((comment) => {
                        const TypeIcon = typeIcons[comment.type];
                        const typeLabelMap: Record<ReviewComment["type"], string> = {
                          issue: "问题",
                          suggestion: "建议",
                          security: "安全",
                          performance: "性能",
                          style: "风格",
                          info: "信息",
                        };
                        const badgeClass =
                          comment.type === "suggestion" || comment.type === "info" || comment.type === "style"
                            ? "badge-tertiary"
                            : comment.type === "performance"
                              ? "badge-secondary"
                              : "badge-danger";

                        return (
                          <div key={comment.id} className="cyber-chamfer holographic-card corner-accents overflow-hidden">
                            <div className="p-4">
                              <div className="flex items-start gap-3 mb-3">
                                <TypeIcon className="h-5 w-5 text-tertiary shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={badgeClass}>{typeLabelMap[comment.type]}</span>
                                    <span className="text-sm text-muted-foreground ml-2">
                                      第 {comment.line}
                                      {comment.endLine ? `-${comment.endLine}` : ""} 行
                                    </span>
                                    <span className={`badge border border-border ${severityColors[comment.severity]}`}>
                                      {comment.severity === "critical"
                                        ? "严重"
                                        : comment.severity === "warning"
                                          ? "警告"
                                          : "提示"}
                                    </span>
                                  </div>
                                  <p className="text-foreground mt-2">{comment.message}</p>
                                </div>
                              </div>

                              {comment.code && (
                                <div className="mt-4 space-y-3">
                                  <div>
                                    <div className="text-xs text-destructive uppercase tracking-wider mb-2 flex items-center gap-1">
                                      <IconX className="h-3.5 w-3.5" />
                                      原始代码:
                                    </div>
                                    <pre className="p-3 bg-destructive/10 border border-destructive/30 cyber-chamfer-sm text-sm font-mono overflow-x-auto">
                                      {comment.code}
                                    </pre>
                                  </div>
                                  {comment.suggestion && (
                                    <div>
                                      <div className="text-xs text-primary uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <IconCheck className="h-3.5 w-3.5" />
                                        建议修改:
                                      </div>
                                      <pre className="p-3 bg-primary/10 border border-primary/30 cyber-chamfer-sm text-sm font-mono overflow-x-auto">
                                        {comment.suggestion}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Diff View */}
                  {fileDiffData?.diffFile ? (
                    <div className="border border-border cyber-chamfer overflow-hidden">
                      <div className="bg-muted/50 p-2 border-b border-border">
                        <div className="font-mono text-xs text-muted-foreground">
                          {fileDiffData.diffText.split("\n")[0] || selectedFile}
                        </div>
                      </div>
                      <div className="diff-view-wrapper bg-background">
                        <DiffView
                          diffFile={fileDiffData.diffFile}
                          diffViewFontSize={13}
                          diffViewMode={diffMode}
                          diffViewWrap={false}
                          diffViewHighlight={true}
                          diffViewAddWidget={false}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">暂无 diff 数据</div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && review.securityIssues && (
        <div className="space-y-4">
          {review.securityIssues.map((issue) => (
            <div key={issue.id} className="card">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <IconShield className="h-7 w-7 text-primary" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display text-lg font-semibold uppercase tracking-wider text-foreground">
                        {issue.type}
                      </h3>
                      <span className={`badge border border-border ${severityColors[issue.severity]}`}>
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm mb-2 flex items-center gap-2">
                      <IconFileText className="h-4 w-4" />
                      {issue.file} · 第 {issue.line} 行
                    </p>
                    <p className="text-foreground mb-4">{issue.description}</p>
                    <div className="p-4 bg-primary/10 border border-primary/20 cyber-chamfer-sm">
                      <p className="text-primary font-medium mb-1 uppercase tracking-wider flex items-center gap-2">
                        <IconShield className="h-4 w-4" />
                        修复建议
                      </p>
                      <p className="text-muted-foreground">{issue.recommendation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Diff Fullscreen Modal */}
      {showDiffModal && fileDiffData?.diffFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="cyber-chamfer bg-background w-full max-w-7xl max-h-[95vh] flex flex-col shadow-2xl border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-lg font-mono">{selectedFile}</h3>
                <select
                  value={diffMode}
                  onChange={(e) => setDiffMode(Number(e.target.value) as DiffModeEnum)}
                  className="select py-1 text-sm w-32"
                >
                  <option value={DiffModeEnum.Unified}>统一视图</option>
                  <option value={DiffModeEnum.Split}>并排视图</option>
                </select>
              </div>
              <button
                onClick={() => setShowDiffModal(false)}
                className="btn-ghost cyber-chamfer-sm p-2 transition-colors text-muted-foreground hover:text-foreground"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="diff-view-wrapper cyber-chamfer overflow-hidden border border-border bg-background">
                <DiffView
                  diffFile={fileDiffData.diffFile}
                  diffViewFontSize={14}
                  diffViewMode={diffMode}
                  diffViewWrap={false}
                  diffViewHighlight={true}
                  diffViewAddWidget={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
