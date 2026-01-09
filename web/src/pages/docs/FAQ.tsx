import { useState } from "react";
import { IconChevronDown, IconHelpCircle } from "../../components/icons";

export default function FAQ() {
  const faqs = [
    {
        q: "AI 审查的代码安全吗？代码会被泄露吗？",
        a: "如果你使用 OpenAI 或 Anthropic 的 API，代码会发送到他们的服务器进行处理。请查阅相关服务商的隐私政策。我们支持 Ollama 本地模型，如果你处理敏感代码，强烈建议使用 Ollama，数据完全保留在本地。"
    },
    {
        q: "支持哪些编程语言？",
        a: "理论上支持所有纯文本代码文件。对于主流语言（JS/TS, Python, Java, Go, Rust, C++ 等），AI 的理解能力更强，建议更准确。"
    },
    {
        q: "如何忽略特定的文件或目录？",
        a: "你可以在配置文件中的 `exclude` 字段添加 glob 模式，例如 `**/*.test.ts` 或 `legacy/**`。默认情况下，工具会自动忽略 `node_modules`, `.git`, `dist` 等常见目录。"
    },
    {
        q: "审查速度很慢怎么办？",
        a: "审查速度主要取决于两点：代码变更量 (Diff Size) 和 AI 模型的响应速度。尝试减少单次提交的代码量，或者切换到更快的模型 (如 gpt-3.5-turbo, claude-3-haiku)。"
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wider flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 cyber-chamfer bg-secondary/10 border border-secondary/30 text-secondary neon-text-secondary">
            <IconHelpCircle className="h-5 w-5" />
          </span>
          常见问题
        </h1>
        <p className="text-muted-foreground">这里汇集了用户最常问到的问题。</p>
      </header>

      <div className="space-y-4">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={faq.q}
              className={`cyber-chamfer border border-border bg-muted/20 transition-all ${
                isOpen ? "shadow-neon-sm border-primary/60" : "hover:border-primary/40"
              }`}
            >
              <button
                type="button"
                className="w-full flex items-center justify-between gap-4 p-4 text-left"
                onClick={() => setOpenIndex((prev) => (prev === i ? null : i))}
              >
                <span className="font-display text-base md:text-lg font-semibold text-foreground">
                  {faq.q}
                </span>
                <IconChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    isOpen ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 text-muted-foreground leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
