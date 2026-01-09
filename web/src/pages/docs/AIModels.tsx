import type { ComponentType } from "react";
import type { IconProps } from "../../components/icons";
import {
  IconBot,
  IconBrain,
  IconCloud,
  IconCpu,
  IconGem,
  IconMasks,
} from "../../components/icons";

export default function AIModels() {
  const providers: Array<{
    name: string;
    description: string;
    Icon: ComponentType<IconProps>;
    models: string[];
  }> = [
    {
       name: "OpenAI",
       description: "GPT-5.2, o3/o4-mini 等最新推理模型",
       Icon: IconBot,
       models: ["gpt-5.2", "gpt-5.1", "o3", "o3-mini", "gpt-4o", "gpt-4.1"]
    },
    {
       name: "Anthropic Claude",
       description: "Claude 4.5 Opus/Sonnet/Haiku 等模型",
       Icon: IconMasks,
       models: ["claude-opus-4.5-20251124", "claude-sonnet-4.5-20250929", "claude-3-5-sonnet-20241022"]
    },
    {
       name: "Google Gemini",
       description: "Gemini 3 Pro/Flash, 2.5 Pro 等模型",
       Icon: IconGem,
       models: ["gemini-3-pro-preview", "gemini-3-flash-preview", "gemini-2.5-flash"]
    },
    {
       name: "Ollama (本地)",
       description: "Llama 4, Qwen3, DeepSeek-R1 等本地模型",
       Icon: IconCpu,
       models: ["llama4-scout", "llama3.3", "deepseek-r1", "qwen3"]
    },
     {
       name: "智谱 GLM",
       description: "GLM-4.7, GLM-Zero 等国产大模型",
       Icon: IconBrain,
       models: ["glm-4.7", "glm-4.6", "glm-zero-preview"]
    },
     {
       name: "Azure OpenAI",
       description: "企业级 OpenAI 服务",
       Icon: IconCloud,
       models: ["gpt-5", "gpt-4o", "o3"]
    }
  ];

  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wider flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 cyber-chamfer bg-secondary/10 border border-secondary/30 text-secondary neon-text-secondary">
            <IconBot className="h-5 w-5" />
          </span>
          AI 模型支持
        </h1>
        <p className="text-muted-foreground">
          FARM Review 紧跟 AI 技术前沿，支持最新的推理模型和长上下文模型。
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {providers.map((provider) => {
          const Icon = provider.Icon;
          return (
            <div key={provider.name} className="card glass-hover">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 cyber-chamfer bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground uppercase tracking-wider">
                      {provider.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {provider.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-5">
                  {provider.models.slice(0, 6).map((m) => (
                    <span
                      key={m}
                      className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-xs font-mono text-primary"
                    >
                      {m}
                    </span>
                  ))}
                  {provider.models.length > 6 && (
                    <span className="px-2 py-1 text-xs text-muted-foreground">
                      +{provider.models.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
