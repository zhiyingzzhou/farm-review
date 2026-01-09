import { useMemo, useState } from 'react'

type ProviderKey = 'openai' | 'claude' | 'gemini' | 'azure' | 'ollama' | 'zhipu'

type EnvVar = {
  name: string
  github: string
  gitlab: string
  jenkins: string
}

type ProviderDefinition = {
  label: string
  defaultModel: string
  models: string[]
  env: EnvVar[]
}

function githubSecret(name: string): string {
  return '${{ secrets.' + name + ' }}'
}

function varRef(name: string): string {
  return '$' + name
}

function createProviderConfig(provider: ProviderKey, model: string): Record<string, unknown> {
  switch (provider) {
    case 'openai':
      return { enabled: true, apiKey: varRef('OPENAI_API_KEY'), model }
    case 'claude':
      return { enabled: true, apiKey: varRef('ANTHROPIC_API_KEY'), model }
    case 'gemini':
      return { enabled: true, apiKey: varRef('GEMINI_API_KEY'), model }
    case 'zhipu':
      return { enabled: true, apiKey: varRef('ZHIPU_API_KEY'), model }
    case 'azure':
      return {
        enabled: true,
        apiKey: varRef('AZURE_OPENAI_API_KEY'),
        baseUrl: varRef('AZURE_OPENAI_ENDPOINT'),
        model,
        deploymentName: varRef('AZURE_OPENAI_DEPLOYMENT'),
        apiVersion: varRef('AZURE_OPENAI_API_VERSION'),
      }
    case 'ollama':
      return { enabled: true, model, host: varRef('OLLAMA_HOST') }
  }
}

function createConfigJson(provider: ProviderKey, model: string): string {
  const config = {
    defaultProvider: provider,
    providers: {
      [provider]: createProviderConfig(provider, model),
    },
    server: { autoOpen: false },
    history: { autoSave: false },
  }

  return JSON.stringify(config, null, 2)
}

function indent(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces)
  return text
    .split('\n')
    .map(line => pad + line)
    .join('\n')
}

const PROVIDERS: Record<ProviderKey, ProviderDefinition> = {
  openai: {
    label: 'OpenAI',
    defaultModel: 'gpt-4o',
    models: [
      'gpt-5.2',
      'gpt-5.1',
      'gpt-5',
      'o4-mini',
      'o3',
      'o3-mini',
      'gpt-4.1',
      'gpt-4.1-mini',
      'gpt-4o',
      'gpt-4o-mini',
    ],
    env: [
      {
        name: 'OPENAI_API_KEY',
        github: githubSecret('OPENAI_API_KEY'),
        gitlab: '$OPENAI_API_KEY',
        jenkins: "credentials('OPENAI_API_KEY')",
      },
    ],
  },
  claude: {
    label: 'Anthropic Claude',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: [
      'claude-opus-4.5-20251124',
      'claude-sonnet-4.5-20250929',
      'claude-haiku-4.5-20251015',
      'claude-3.7-sonnet-20250224',
      'claude-3-5-sonnet-20241022',
    ],
    env: [
      {
        name: 'ANTHROPIC_API_KEY',
        github: githubSecret('ANTHROPIC_API_KEY'),
        gitlab: '$ANTHROPIC_API_KEY',
        jenkins: "credentials('ANTHROPIC_API_KEY')",
      },
    ],
  },
  gemini: {
    label: 'Google Gemini',
    defaultModel: 'gemini-2.5-flash',
    models: [
      'gemini-3-pro-preview',
      'gemini-3-flash-preview',
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.0-flash',
    ],
    env: [
      {
        name: 'GEMINI_API_KEY',
        github: githubSecret('GEMINI_API_KEY'),
        gitlab: '$GEMINI_API_KEY',
        jenkins: "credentials('GEMINI_API_KEY')",
      },
    ],
  },
  azure: {
    label: 'Azure OpenAI',
    defaultModel: 'gpt-4o',
    models: [
      'gpt-5.2',
      'gpt-5.1',
      'gpt-5',
      'o4-mini',
      'o3',
      'o3-mini',
      'gpt-4.1',
      'gpt-4o',
    ],
    env: [
      {
        name: 'AZURE_OPENAI_API_KEY',
        github: githubSecret('AZURE_OPENAI_API_KEY'),
        gitlab: '$AZURE_OPENAI_API_KEY',
        jenkins: "credentials('AZURE_OPENAI_API_KEY')",
      },
      {
        name: 'AZURE_OPENAI_ENDPOINT',
        github: githubSecret('AZURE_OPENAI_ENDPOINT'),
        gitlab: '$AZURE_OPENAI_ENDPOINT',
        jenkins: "credentials('AZURE_OPENAI_ENDPOINT')",
      },
      {
        name: 'AZURE_OPENAI_DEPLOYMENT',
        github: githubSecret('AZURE_OPENAI_DEPLOYMENT'),
        gitlab: '$AZURE_OPENAI_DEPLOYMENT',
        jenkins: "credentials('AZURE_OPENAI_DEPLOYMENT')",
      },
      {
        name: 'AZURE_OPENAI_API_VERSION',
        github: "'2024-10-21'",
        gitlab: "'2024-10-21'",
        jenkins: "'2024-10-21'",
      },
    ],
  },
  ollama: {
    label: 'Ollama (本地)',
    defaultModel: 'llama3.2',
    models: [
      'llama4-scout',
      'llama3.3',
      'llama3.2',
      'llama3.1',
      'qwen3',
      'qwen2.5-coder',
      'deepseek-r1',
      'deepseek-v3',
      'deepseek-coder-v2',
      'codellama',
      'mistral',
    ],
    env: [
      {
        name: 'OLLAMA_HOST',
        github: "'http://localhost:11434'",
        gitlab: "'http://localhost:11434'",
        jenkins: "'http://localhost:11434'",
      },
    ],
  },
  zhipu: {
    label: '智谱 GLM',
    defaultModel: 'glm-4.7',
    models: [
      'glm-4.7',
      'glm-4.6',
      'glm-zero-preview',
      'glm-4.5',
      'glm-4.5-air',
      'glm-4.5-flash',
    ],
    env: [
      {
        name: 'ZHIPU_API_KEY',
        github: githubSecret('ZHIPU_API_KEY'),
        gitlab: '$ZHIPU_API_KEY',
        jenkins: "credentials('ZHIPU_API_KEY')",
      },
    ],
  },
}

export default function CICDIntegration() {
  const [provider, setProvider] = useState<ProviderKey>('openai')
  const providerInfo = PROVIDERS[provider]
  const [model, setModel] = useState<string>(providerInfo.defaultModel)

  const envVars = providerInfo.env

  const configJson = useMemo(() => createConfigJson(provider, model), [provider, model])

  const githubActionsYaml = useMemo(() => {
    const envLines = [
      ...envVars.map(v => `          ${v.name}: ${v.github}`),
      '          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}',
    ]

    const lines = [
      'name: FARM Review',
      '',
      'on:',
      '  pull_request:',
      '    types: [opened, synchronize]',
      '',
      'jobs:',
      '  review:',
      '    runs-on: ubuntu-latest',
      '    permissions:',
      '      contents: read',
      '      pull-requests: write',
      '',
      '    steps:',
      '      - name: Checkout code',
      '        uses: actions/checkout@v3',
      '        with:',
      '          fetch-depth: 0 # 获取完整的 git 历史，这对 diff 分析很重要',
      '',
      '      - name: Setup Node.js',
      '        uses: actions/setup-node@v3',
      '        with:',
      "          node-version: '18'",
      '',
      '      - name: Run FARM Review',
      '        env:',
      ...envLines,
      '        run: |',
      '          mkdir -p ~/.farm-review',
      '          cat > ~/.farm-review/config.json <<EOF',
      indent(configJson, 10),
      '          EOF',
      '          BASE_SHA=${{ github.event.pull_request.base.sha }}',
      '          HEAD_SHA=${{ github.event.pull_request.head.sha }}',
      `          npx farm-review review --provider ${provider} --range "$BASE_SHA...$HEAD_SHA" --no-ui --comment -f markdown -o farm-review.md`,
    ]

    return lines.join('\n')
  }, [configJson, envVars, provider])

  const gitlabCiYaml = useMemo(() => {
    const variableLines = envVars.map(v => `    ${v.name}: ${v.gitlab}`)

    const lines = [
      'stages:',
      '  - review',
      '',
      'farm_review:',
      '  stage: review',
      '  image: node:18-alpine',
      '  variables:',
      ...variableLines,
      '  script:',
      '    - npm install -g farm-review',
      '    - git fetch origin main',
      '    - mkdir -p ~/.farm-review',
      '    - |',
      '      cat > ~/.farm-review/config.json <<EOF',
      indent(configJson, 6),
      '      EOF',
      `    - farm-review review --provider ${provider} --range origin/main...HEAD --no-ui -f markdown -o farm-review.md`,
      '  only:',
      '    - merge_requests',
      '  artifacts:',
      '    when: always',
      '    paths:',
      '      - farm-review.md',
    ]

    return lines.join('\n')
  }, [configJson, envVars, provider])

  const jenkinsPipeline = useMemo(() => {
    const envLines = envVars.map(v => `        ${v.name} = ${v.jenkins}`)

    const lines = [
      'pipeline {',
      '    agent any',
      '    environment {',
      ...envLines,
      '    }',
      '    stages {',
      "        stage('FARM Review') {",
      '            steps {',
      "                sh 'npm install -g farm-review'",
      "                sh '''mkdir -p ~/.farm-review",
      'cat > ~/.farm-review/config.json <<EOF',
      configJson,
      'EOF',
      `farm-review review --provider ${provider} --range origin/main...HEAD --no-ui -f markdown -o farm-review.md'''`,
      '            }',
      '        }',
      '    }',
      '}',
    ]

    return lines.join('\n')
  }, [configJson, envVars, provider])

  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wider flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 cyber-chamfer bg-secondary/10 border border-secondary/30 text-secondary neon-text-secondary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 0 0-15.5-6.4" />
              <path d="M3 4v6h6" />
              <path d="M3 12a9 9 0 0 0 15.5 6.4" />
              <path d="M21 20v-6h-6" />
            </svg>
          </span>
          CI/CD 集成指南
        </h1>
        <p className="text-muted-foreground">
          通过将 FARM Review 集成到你的 CI/CD 流水线，可以实现自动化的代码质量把关。
          当有新的 Pull Request 或 Merge Request 时，AI 机器人可以生成独立的报告链接（或配合 webhook 回写评论）。
        </p>
      </header>

      <section className="card">
        <div className="p-6 space-y-5">
          <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-foreground flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 cyber-chamfer bg-primary/10 border border-primary/30 text-primary neon-text">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M12 20h9" />
                <path d="M12 4h9" />
                <path d="M4 9h16" />
                <path d="M4 15h16" />
                <path d="M3 20c0-4 4-4 4-8s-4-4-4-8" />
              </svg>
            </span>
            选择模型（示例自动更新）
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">提供商</label>
              <select
                className="select"
                value={provider}
                onChange={(e) => {
                  const nextProvider = e.target.value as ProviderKey
                  setProvider(nextProvider)
                  setModel(PROVIDERS[nextProvider].defaultModel)
                }}
              >
                {Object.entries(PROVIDERS).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">模型</label>
              <select className="select" value={model} onChange={(e) => setModel(e.target.value)}>
                {providerInfo.models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              本页示例会根据你选择的模型自动切换环境变量名与{" "}
              <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs">
                config.json
              </code>{" "}
              内容。
            </p>
            <div className="flex flex-wrap gap-2">
              {envVars.map((v) => (
                <span
                  key={v.name}
                  className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs"
                >
                  {v.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="p-6 space-y-4">
          <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-foreground flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 cyber-chamfer bg-muted/40 border border-border">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-foreground"
                aria-hidden="true"
              >
                <path d="M9 19c-4 1.5-4-2.5-5-3" />
                <path d="M14 22v-3.2a2.8 2.8 0 0 0-.8-2.2c2.7-.3 5.5-1.3 5.5-6a4.7 4.7 0 0 0-1.2-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.3 1.2a11.5 11.5 0 0 0-6 0C5.8 3.9 4.8 4.2 4.8 4.2a4.3 4.3 0 0 0-.1 3.2A4.7 4.7 0 0 0 3.5 10.6c0 4.7 2.8 5.7 5.5 6a2.8 2.8 0 0 0-.8 2.1V22" />
              </svg>
            </span>
            GitHub Actions
          </h2>
          <p className="text-muted-foreground text-sm">
            将以下配置保存为{" "}
            <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs">
              .github/workflows/farm-review.yml
            </code>{" "}
            ，并在仓库 Secrets / Variables 中配置{" "}
            {envVars.map((v, idx) => (
              <span key={v.name}>
                <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs">
                  {v.name}
                </code>
                {idx < envVars.length - 1 ? '、' : ''}
              </span>
            ))}{' '}
            等必要环境变量。
          </p>
          <div className="cyber-chamfer terminal-card overflow-hidden">
            <div className="pt-10 pb-6 px-6 font-mono text-xs">
              <pre className="text-foreground overflow-x-auto">
                <code>{githubActionsYaml}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="p-6 space-y-4">
          <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-foreground flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 cyber-chamfer bg-muted/40 border border-border">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-foreground"
                aria-hidden="true"
              >
                <path d="M12 21 3 14l3-10h4l2 6 2-6h4l3 10-9 7Z" />
              </svg>
            </span>
            GitLab CI
          </h2>
          <p className="text-muted-foreground text-sm">
            在{" "}
            <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs">
              .gitlab-ci.yml
            </code>{" "}
            中添加如下 job。
          </p>
          <div className="cyber-chamfer terminal-card overflow-hidden">
            <div className="pt-10 pb-6 px-6 font-mono text-xs">
              <pre className="text-foreground overflow-x-auto">
                <code>{gitlabCiYaml}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="p-6 space-y-4">
          <h2 className="font-display text-xl font-semibold uppercase tracking-wider text-foreground flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 cyber-chamfer bg-muted/40 border border-border">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-foreground"
                aria-hidden="true"
              >
                <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6.8 6.8a2 2 0 0 0 2.8 2.8l6.8-6.8a4 4 0 0 0 5.4-5.4l-2.1 2.1-2.8-2.8 2.1-2.1Z" />
              </svg>
            </span>
            Jenkins Pipeline
          </h2>
          <div className="cyber-chamfer terminal-card overflow-hidden">
            <div className="pt-10 pb-6 px-6 font-mono text-xs">
              <pre className="text-foreground overflow-x-auto">
                <code>{jenkinsPipeline}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
