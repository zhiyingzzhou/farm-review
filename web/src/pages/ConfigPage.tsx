import { useState, useEffect, type ComponentType } from "react";
import type { IconProps } from "../components/icons";
import {
  IconBrain,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconCloud,
  IconCpu,
  IconExternalLink,
  IconGem,
  IconLightbulb,
  IconMasks,
  IconPlus,
  IconSave,
  IconSettings,
  IconUpload,
  IconDownload,
  IconFileText,
  IconBot,
} from "../components/icons";

interface ProviderConfig {
  provider: string;
  apiKey: string;
  model: string;
  enabled: boolean;
  baseUrl?: string;
  host?: string;
  deploymentName?: string;
  apiVersion?: string;
  customModels?: string[];
}

interface GistSyncConfig {
  enabled: boolean;
  gistId?: string;
  token?: string;
  autoSync?: boolean;
  lastSyncAt?: string;
}

interface Config {
  defaultProvider: string;
  providers: Record<string, ProviderConfig>;
  server: {
    port: number;
    autoOpen: boolean;
  };
  review: {
    language: "zh" | "en";
    maxFilesPerReview: number;
    ignorePatterns: string[];
    customPrompt?: string;
    enableSecurityCheck: boolean;
    enableQualityScore: boolean;
  };
  gistSync?: GistSyncConfig;
}

interface ProviderInfo {
  name: string;
  description: string;
  icon: ComponentType<IconProps>;
}

const providerInfoData: Record<string, ProviderInfo> = {
  openai: {
    name: "OpenAI",
    description: "GPT-5.2, o3/o4-mini 等最新推理模型",
    icon: IconBot,
  },
  claude: {
    name: "Anthropic Claude",
    description: "Claude 4.5 Opus/Sonnet/Haiku 等模型",
    icon: IconMasks,
  },
  gemini: {
    name: "Google Gemini",
    description: "Gemini 3 Pro/Flash, 2.5 Pro 等模型",
    icon: IconGem,
  },
  azure: {
    name: "Azure OpenAI",
    description: "企业级 OpenAI 服务",
    icon: IconCloud,
  },
  ollama: {
    name: "Ollama (本地)",
    description: "Llama 4, Qwen3, DeepSeek-R1 等本地模型",
    icon: IconCpu,
  },
  zhipu: {
    name: "智谱 GLM",
    description: "GLM-4.7, GLM-Zero 等国产大模型",
    icon: IconBrain,
  },
};

export default function ConfigPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [models, setModels] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; error?: string }>
  >({});
  const [activeProvider, setActiveProvider] = useState("openai");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  // 自定义模型相关
  const [newCustomModel, setNewCustomModel] = useState<Record<string, string>>(
    {}
  );
  // Gist 同步相关
  const [gistToken, setGistToken] = useState("");
  const [gistSyncing, setGistSyncing] = useState(false);
  const [gistRestoring, setGistRestoring] = useState(false);
  const [gistValidating, setGistValidating] = useState(false);
  const [gistUsername, setGistUsername] = useState<string | null>(null);
  const [showGistSettings, setShowGistSettings] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/config").then((res) => res.json()),
      fetch("/api/models").then((res) => res.json()),
    ])
      .then(([configData, modelsData]) => {
        if (configData.success) setConfig(configData.data);
        if (modelsData.success) setModels(modelsData.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        showMessage("success", "配置保存成功！");
      } else {
        showMessage("error", data.error || "保存失败");
      }
    } catch {
      showMessage("error", "保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const testProvider = async (provider: string) => {
    if (!config) return;
    setTesting(provider);
    try {
      const providerConfig = config.providers[provider];
      // 传递当前配置的所有参数，包括模型、baseUrl 等，无需先保存
      const res = await fetch(`/api/config/test/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: providerConfig.apiKey,
          model: providerConfig.model,
          baseUrl: providerConfig.baseUrl,
          host: (providerConfig as any).host,
          deploymentName: (providerConfig as any).deploymentName,
          apiVersion: (providerConfig as any).apiVersion,
        }),
      });
      const data = await res.json();
      setTestResults((prev) => ({ ...prev, [provider]: data.data }));
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [provider]: { success: false, error: "测试失败" },
      }));
    } finally {
      setTesting(null);
    }
  };

  const updateProviderConfig = (
    provider: string,
    updates: Partial<ProviderConfig>
  ) => {
    if (!config) return;
    setConfig({
      ...config,
      providers: {
        ...config.providers,
        [provider]: {
          ...config.providers[provider],
          ...updates,
        },
      },
    });
  };

  const setDefaultProvider = (provider: string) => {
    if (!config) return;
    setConfig({ ...config, defaultProvider: provider });
  };

  // 添加自定义模型
  const addCustomModel = (provider: string) => {
    const model = newCustomModel[provider]?.trim();
    if (!model || !config) return;

    const currentModels = config.providers[provider].customModels || [];
    if (currentModels.includes(model)) {
      showMessage("error", "模型已存在");
      return;
    }

    updateProviderConfig(provider, {
      customModels: [...currentModels, model],
    });
    setNewCustomModel((prev) => ({ ...prev, [provider]: "" }));
    showMessage("success", `已添加模型: ${model}`);
  };

  // 删除自定义模型
  const removeCustomModel = (provider: string, model: string) => {
    if (!config) return;
    const currentModels = config.providers[provider].customModels || [];
    updateProviderConfig(provider, {
      customModels: currentModels.filter((m) => m !== model),
    });
  };

  // 验证 GitHub Token
  const validateGistToken = async () => {
    if (!gistToken.trim()) {
      showMessage("error", "请输入 GitHub Token");
      return;
    }

    setGistValidating(true);
    try {
      const res = await fetch("/api/gist/validate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: gistToken }),
      });
      const data = await res.json();
      if (data.success && data.data.valid) {
        setGistUsername(data.data.username);
        showMessage("success", `验证成功！用户: ${data.data.username}`);
        // 保存 token
        await fetch("/api/gist/save-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: gistToken }),
        });
      } else {
        showMessage("error", data.data?.error || "验证失败");
      }
    } catch {
      showMessage("error", "验证请求失败");
    } finally {
      setGistValidating(false);
    }
  };

  // 同步配置到 Gist
  const syncToGist = async () => {
    if (!gistToken.trim()) {
      showMessage("error", "请先配置 GitHub Token");
      return;
    }

    setGistSyncing(true);
    try {
      const res = await fetch("/api/gist/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: gistToken,
          gistId: config?.gistSync?.gistId,
        }),
      });
      const data = await res.json();
      if (data.success && data.data.success) {
        showMessage("success", "配置已同步到 GitHub Gist!");
        if (config) {
          setConfig({
            ...config,
            gistSync: {
              ...config.gistSync,
              enabled: true,
              gistId: data.data.gistId,
              lastSyncAt: data.data.lastSyncAt,
            },
          });
        }
      } else {
        showMessage("error", data.data?.error || "同步失败");
      }
    } catch {
      showMessage("error", "同步请求失败");
    } finally {
      setGistSyncing(false);
    }
  };

  // 从 Gist 恢复配置
  const restoreFromGist = async () => {
    const gistId = config?.gistSync?.gistId;
    if (!gistToken.trim() || !gistId) {
      showMessage("error", "请先配置 GitHub Token 并确保已同步过配置");
      return;
    }

    if (!confirm("确定要从 Gist 恢复配置吗？当前配置将被覆盖。")) {
      return;
    }

    setGistRestoring(true);
    try {
      const res = await fetch("/api/gist/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: gistToken, gistId }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage("success", "配置已从 Gist 恢复!");
        // 刷新页面以加载新配置
        window.location.reload();
      } else {
        showMessage("error", data.error || "恢复失败");
      }
    } catch {
      showMessage("error", "恢复请求失败");
    } finally {
      setGistRestoring(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">加载配置中...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400">加载配置失败</p>
      </div>
    );
  }

  const providers = Object.keys(config.providers) as string[];

  return (
    <div className="container py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-wider mb-4">
          <span className="inline-flex items-center justify-center gap-3 text-secondary">
            <IconSettings className="h-7 w-7" />
            AI 配置
          </span>
        </h1>
        <p className="text-muted-foreground text-lg">
          配置你的 AI 服务提供商，开始智能代码审查
        </p>
      </div>

      {/* Message Toast */}
      {message && (
        <div
          className={`fixed top-24 right-6 z-50 animate-slide-down
          ${message.type === "success" ? "bg-green-500" : "bg-red-500"}
          text-white px-6 py-3 cyber-chamfer-sm shadow-lg`}
        >
          {message.text}
        </div>
      )}

      {/* Provider Tabs */}
      <div className="card mb-8">
        <div className="p-6">
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {providers.map((provider) => {
            const info = providerInfoData[provider];
            const providerConfig = config.providers[provider];
            const ProviderIcon = info?.icon;
            return (
              <button
                key={provider}
                onClick={() => setActiveProvider(provider)}
                className={`btn cyber-chamfer-sm h-10 px-4 whitespace-nowrap ${
                  activeProvider === provider
                    ? "border-2 border-primary bg-primary/10 text-primary shadow-neon-sm neon-text"
                    : "border border-border bg-muted/50 text-foreground hover:border-primary hover:text-primary hover:shadow-neon-sm"
                }`}
              >
                {ProviderIcon ? <ProviderIcon className="h-4 w-4" /> : null}
                <span className="font-medium">{info?.name}</span>
                {providerConfig.enabled && (
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                )}
              </button>
            );
          })}
          </div>

        {/* Active Provider Config */}
        {providers.map((provider) => {
          if (provider !== activeProvider) return null;

          const info = providerInfoData[provider];
          const providerConfig = config.providers[provider];
          const providerModels = models[provider] || [];
          const testResult = testResults[provider];

          return (
            <div key={provider} className="space-y-6">
              {/* Provider Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    {info?.icon ? <info.icon className="h-6 w-6 text-primary" /> : null}
                    {info?.name}
                  </h2>
                  <p className="text-muted-foreground mt-1">{info?.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <span className="text-muted-foreground">启用</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={providerConfig.enabled}
                      onClick={() =>
                        updateProviderConfig(provider, {
                          enabled: !providerConfig.enabled,
                        })
                      }
                      className={`toggle ${
                        providerConfig.enabled
                          ? "border-primary bg-primary/20 shadow-neon-sm"
                          : ""
                      }`}
                    >
                      <span
                        className={`toggle-dot ${
                          providerConfig.enabled
                            ? "translate-x-5 bg-primary"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </label>
                  {providerConfig.enabled && (
                    <button
                      onClick={() => setDefaultProvider(provider)}
                      className={`btn text-sm ${
                        config.defaultProvider === provider
                          ? "cyber-chamfer-sm border-2 border-primary bg-primary/10 text-primary shadow-neon-sm"
                          : "btn-ghost cyber-chamfer-sm"
                      }`}
                    >
                      {config.defaultProvider === provider ? (
                        <>
                          <IconCheck className="h-4 w-4" />
                          默认
                        </>
                      ) : (
                        "设为默认"
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Config Fields */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* API Key */}
                {provider !== "ollama" && (
                  <div className="md:col-span-2">
                    <label className="label">API Key</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={providerConfig.apiKey || ""}
                        onChange={(e) =>
                          updateProviderConfig(provider, {
                            apiKey: e.target.value,
                          })
                        }
                        className="input pr-20"
                        placeholder={`输入 ${info?.name} API Key`}
                      />
                      <button
                        onClick={() => testProvider(provider)}
                        disabled={
                          testing === provider || !providerConfig.apiKey
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 btn-ghost text-sm py-1.5 px-3"
                      >
                        {testing === provider ? "测试中..." : "测试连接"}
                      </button>
                    </div>
                    {testResult && (
                      <p
                        className={`mt-2 text-sm ${
                          testResult.success ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {testResult.success
                          ? "✓ 连接成功"
                          : `✗ ${testResult.error || "连接失败"}`}
                      </p>
                    )}
                  </div>
                )}

                {/* Base URL for all providers except Ollama */}
                {provider !== "ollama" && (
                  <div>
                    <label className="label">
                      {provider === "azure"
                        ? "Endpoint URL"
                        : "Base URL (可选)"}
                    </label>
                    <input
                      type="text"
                      value={providerConfig.baseUrl || ""}
                      onChange={(e) =>
                        updateProviderConfig(provider, {
                          baseUrl: e.target.value,
                        })
                      }
                      className="input"
                      placeholder={
                        provider === "azure"
                          ? "https://your-resource.openai.azure.com"
                          : provider === "openai"
                          ? "https://api.openai.com/v1"
                          : provider === "claude"
                          ? "https://api.anthropic.com"
                          : provider === "gemini"
                          ? "https://generativelanguage.googleapis.com"
                          : provider === "zhipu"
                          ? "https://open.bigmodel.cn/api/paas/v4"
                          : ""
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      留空使用默认地址，可配置自定义代理
                    </p>
                  </div>
                )}

                {/* Azure specific fields */}
                {provider === "azure" && (
                  <>
                    <div>
                      <label className="label">Deployment Name</label>
                      <input
                        type="text"
                        value={(providerConfig as any).deploymentName || ""}
                        onChange={(e) =>
                          updateProviderConfig(provider, {
                            deploymentName: e.target.value,
                          } as any)
                        }
                        className="input"
                        placeholder="your-deployment-name"
                      />
                    </div>
                    <div>
                      <label className="label">API Version</label>
                      <input
                        type="text"
                        value={(providerConfig as any).apiVersion || ""}
                        onChange={(e) =>
                          updateProviderConfig(provider, {
                            apiVersion: e.target.value,
                          } as any)
                        }
                        className="input"
                        placeholder="2024-02-15-preview"
                      />
                    </div>
                  </>
                )}

                {/* Ollama Host */}
                {provider === "ollama" && (
                  <div>
                    <label className="label">Ollama 服务地址</label>
                    <input
                      type="text"
                      value={(providerConfig as any).host || ""}
                      onChange={(e) =>
                        updateProviderConfig(provider, {
                          host: e.target.value,
                        } as any)
                      }
                      className="input"
                      placeholder="http://localhost:11434"
                    />
                  </div>
                )}

                {/* Model Selection */}
                <div className="md:col-span-2">
                  <label className="label">模型</label>
                  <div className="flex gap-2">
                    <select
                      value={providerConfig.model}
                      onChange={(e) =>
                        updateProviderConfig(provider, {
                          model: e.target.value,
                        })
                      }
                      className="select flex-1"
                    >
                      <optgroup label="预设模型">
                        {providerModels.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </optgroup>
                      {providerConfig.customModels &&
                        providerConfig.customModels.length > 0 && (
                          <optgroup label="自定义模型">
                            {providerConfig.customModels.map((model) => (
                              <option key={model} value={model}>
                                {model}
                              </option>
                            ))}
                          </optgroup>
                        )}
                    </select>
                  </div>

                  {/* 添加自定义模型 */}
                  <div className="mt-3 p-3 bg-muted/30 cyber-chamfer-sm border border-border">
                    <p className="text-sm text-muted-foreground mb-2 inline-flex items-center gap-2">
                      <IconPlus className="h-4 w-4 text-primary" />
                      添加自定义模型
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCustomModel[provider] || ""}
                        onChange={(e) =>
                          setNewCustomModel((prev) => ({
                            ...prev,
                            [provider]: e.target.value,
                          }))
                        }
                        className="input flex-1 text-sm"
                        placeholder="输入模型名称，如 gpt-4-0125-preview"
                        onKeyDown={(e) =>
                          e.key === "Enter" && addCustomModel(provider)
                        }
                      />
                      <button
                        onClick={() => addCustomModel(provider)}
                        className="btn-secondary text-sm px-4"
                        disabled={!newCustomModel[provider]?.trim()}
                      >
                        <IconPlus className="h-4 w-4" />
                        添加
                      </button>
                    </div>

                    {/* 已添加的自定义模型 */}
                    {providerConfig.customModels &&
                      providerConfig.customModels.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {providerConfig.customModels.map((model) => (
                            <span
                              key={model}
                              className="inline-flex items-center gap-2 px-2 py-1 bg-muted/40 border border-border cyber-chamfer-sm text-sm"
                            >
                              {model}
                              <button
                                onClick={() =>
                                  removeCustomModel(provider, model)
                                }
                                className="text-muted-foreground hover:text-destructive ml-1"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Review Settings */}
      <div className="card mb-8">
        <div className="p-6">
          <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-foreground mb-6 flex items-center gap-2">
            <IconFileText className="h-5 w-5 text-secondary" /> 审查设置
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="label">审查语言</label>
            <select
              value={config.review.language}
              onChange={(e) =>
                setConfig({
                  ...config,
                  review: {
                    ...config.review,
                    language: e.target.value as "zh" | "en",
                  },
                })
              }
              className="select"
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="label">单次审查最大文件数</label>
            <input
              type="number"
              value={config.review.maxFilesPerReview}
              onChange={(e) =>
                setConfig({
                  ...config,
                  review: {
                    ...config.review,
                    maxFilesPerReview: parseInt(e.target.value) || 50,
                  },
                })
              }
              className="input"
              min={1}
              max={200}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={config.review.enableSecurityCheck}
                onClick={() =>
                  setConfig({
                    ...config,
                    review: {
                      ...config.review,
                      enableSecurityCheck: !config.review.enableSecurityCheck,
                    },
                  })
                }
                className={`toggle ${
                  config.review.enableSecurityCheck
                    ? "border-primary bg-primary/20 shadow-neon-sm"
                    : ""
                }`}
              >
                <span
                  className={`toggle-dot ${
                    config.review.enableSecurityCheck
                      ? "translate-x-5 bg-primary"
                      : "translate-x-1"
                  }`}
                />
              </button>
              <span>启用安全检测</span>
            </label>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={config.review.enableQualityScore}
                onClick={() =>
                  setConfig({
                    ...config,
                    review: {
                      ...config.review,
                      enableQualityScore: !config.review.enableQualityScore,
                    },
                  })
                }
                className={`toggle ${
                  config.review.enableQualityScore
                    ? "border-primary bg-primary/20 shadow-neon-sm"
                    : ""
                }`}
              >
                <span
                  className={`toggle-dot ${
                    config.review.enableQualityScore
                      ? "translate-x-5 bg-primary"
                      : "translate-x-1"
                  }`}
                />
              </button>
              <span>启用质量评分</span>
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="label">自定义审查提示词 (可选)</label>
            <textarea
              value={config.review.customPrompt || ""}
              onChange={(e) =>
                setConfig({
                  ...config,
                  review: { ...config.review, customPrompt: e.target.value },
                })
              }
              className="input min-h-[120px] resize-y"
              placeholder="添加自定义审查要求，例如：重点检查性能问题、关注代码复用性等..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">忽略文件模式</label>
            <textarea
              value={
                Array.isArray(config.review.ignorePatterns)
                  ? config.review.ignorePatterns.join("\n")
                  : ""
              }
              onChange={(e) =>
                setConfig({
                  ...config,
                  review: {
                    ...config.review,
                    ignorePatterns: e.target.value
                      .split("\n")
                      .filter((p) => p.trim()),
                  },
                })
              }
              className="input min-h-[100px] resize-y font-mono text-sm"
              placeholder="每行一个 glob 模式，例如：&#10;node_modules/**&#10;*.lock&#10;dist/**"
            />
          </div>
          </div>
        </div>
      </div>

      {/* Server Settings */}
      <div className="card mb-8">
        <div className="p-6">
          <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-foreground mb-6 flex items-center gap-2">
            <IconSettings className="h-5 w-5 text-tertiary" /> 服务设置
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="label">服务端口</label>
            <input
              type="number"
              value={config.server.port}
              onChange={(e) =>
                setConfig({
                  ...config,
                  server: {
                    ...config.server,
                    port: parseInt(e.target.value) || 3050,
                  },
                })
              }
              className="input"
              min={1024}
              max={65535}
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={config.server.autoOpen}
                onClick={() =>
                  setConfig({
                    ...config,
                    server: {
                      ...config.server,
                      autoOpen: !config.server.autoOpen,
                    },
                  })
                }
                className={`toggle ${
                  config.server.autoOpen
                    ? "border-primary bg-primary/20 shadow-neon-sm"
                    : ""
                }`}
              >
                <span
                  className={`toggle-dot ${
                    config.server.autoOpen
                      ? "translate-x-5 bg-primary"
                      : "translate-x-1"
                  }`}
                />
              </button>
              <span>自动打开浏览器</span>
            </label>
          </div>
          </div>
        </div>
      </div>

      {/* GitHub Gist Sync */}
      <div className="card mb-8">
        <div
          className="p-6 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setShowGistSettings(!showGistSettings)}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-foreground flex items-center gap-2 mb-0">
              <IconCloud className="h-5 w-5 text-secondary" /> GitHub Gist 配置同步
            </h2>
            <div className="flex items-center gap-3">
              {config?.gistSync?.lastSyncAt && (
                <span className="text-xs text-muted-foreground">
                  上次同步:{" "}
                  {new Date(config.gistSync.lastSyncAt).toLocaleString("zh-CN")}
                </span>
              )}
              <span className={`transition-transform ${showGistSettings ? "rotate-180" : ""}`}>
                <IconChevronDown className="h-5 w-5 text-muted-foreground" />
              </span>
            </div>
          </div>
        </div>

        {showGistSettings && (
          <div className="px-6 pb-6 space-y-4">
            <p className="text-muted-foreground text-sm">
              使用 GitHub Gist 同步你的配置，在多台设备间共享设置。 需要一个具有{" "}
              <code className="bg-muted/40 border border-border px-1">gist</code> 权限的
              GitHub Personal Access Token。
            </p>

            {/* Token 输入 */}
            <div>
              <label className="label">GitHub Personal Access Token</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={gistToken}
                  onChange={(e) => setGistToken(e.target.value)}
                  className="input flex-1"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                />
                <button
                  onClick={validateGistToken}
                  disabled={gistValidating || !gistToken.trim()}
                  className="btn-ghost"
                >
                  {gistValidating ? "验证中..." : "验证"}
                </button>
              </div>
              {gistUsername && (
                <p className="text-green-400 text-sm mt-2 flex items-center gap-2">
                  <IconCheck className="h-4 w-4" />
                  已验证用户: {gistUsername}
                </p>
              )}
            </div>

            {/* Gist ID 显示 */}
            {config?.gistSync?.gistId && (
              <div>
                <label className="label">Gist ID</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={config.gistSync.gistId}
                    readOnly
                    className="input flex-1"
                  />
                  <a
                    href={`https://gist.github.com/${config.gistSync.gistId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost text-sm"
                  >
                    <IconExternalLink className="h-4 w-4" />
                    打开 Gist
                  </a>
                </div>
              </div>
            )}

            {/* 同步按钮 */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={syncToGist}
                disabled={gistSyncing || !gistToken.trim()}
                className="btn-primary"
              >
                {gistSyncing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    同步中...
                  </span>
                ) : (
                  <>
                    <IconUpload className="h-4 w-4" />
                    同步到 Gist
                  </>
                )}
              </button>

              <button
                onClick={restoreFromGist}
                disabled={
                  gistRestoring ||
                  !gistToken.trim() ||
                  !config?.gistSync?.gistId
                }
                className="btn-ghost"
              >
                {gistRestoring ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    恢复中...
                  </span>
                ) : (
                  <>
                    <IconDownload className="h-4 w-4" />
                    从 Gist 恢复
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
              <IconLightbulb className="h-4 w-4 text-tertiary" />
              提示: 同步会包含 API Key，请确保 Gist 设置为私有。
            </p>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveConfig}
          disabled={saving}
          className="btn-primary text-lg px-8 py-3"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              保存中...
            </span>
          ) : (
            <>
              <IconSave className="h-5 w-5" />
              保存配置
            </>
          )}
        </button>
      </div>
    </div>
  );
}
