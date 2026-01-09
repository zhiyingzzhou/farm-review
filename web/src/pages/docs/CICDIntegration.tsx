export default function CICDIntegration() {
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
            ，并在仓库 Secrets 中配置{" "}
            <code className="px-2 py-1 cyber-chamfer-sm bg-muted/40 border border-border text-primary font-mono text-xs">
              OPENAI_API_KEY
            </code>{" "}
            等必要环境变量。
          </p>
          <div className="cyber-chamfer terminal-card overflow-hidden">
            <div className="pt-10 pb-6 px-6 font-mono text-xs">
              <pre className="text-foreground overflow-x-auto">
                <code>{`name: FARM Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0 # 获取完整的 git 历史，这对 diff 分析很重要

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Run FARM Review
        env:
          OPENAI_API_KEY: \${{ secrets.OPENAI_API_KEY }}
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        run: |
          mkdir -p ~/.farm-review
          cat > ~/.farm-review/config.json <<EOF
          {
            "defaultProvider": "openai",
            "providers": {
              "openai": {
                "enabled": true,
                "apiKey": "$OPENAI_API_KEY",
                "model": "gpt-4o"
              }
            },
            "server": { "autoOpen": false },
            "history": { "autoSave": false }
          }
          EOF
          BASE_SHA=\${{ github.event.pull_request.base.sha }}
          HEAD_SHA=\${{ github.event.pull_request.head.sha }}
          npx farm-review review --range "$BASE_SHA...$HEAD_SHA" --no-ui --comment -f markdown -o farm-review.md`}</code>
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
                <code>{`stages:
  - review

farm_review:
  stage: review
  image: node:18-alpine
  variables:
    OPENAI_API_KEY: $OPENAI_API_KEY
  script:
    - npm install -g farm-review
    - git fetch origin main
    - mkdir -p ~/.farm-review
    - |
      cat > ~/.farm-review/config.json <<EOF
      {
        "defaultProvider": "openai",
        "providers": {
          "openai": {
            "enabled": true,
            "apiKey": "$OPENAI_API_KEY",
            "model": "gpt-4o"
          }
        },
        "server": { "autoOpen": false },
        "history": { "autoSave": false }
      }
      EOF
    - farm review --range origin/main...HEAD --no-ui -f markdown -o farm-review.md
  only:
    - merge_requests
  artifacts:
    when: always
    paths:
      - farm-review.md`}</code>
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
                <code>{`pipeline {
    agent any
    environment {
        OPENAI_API_KEY = credentials('openai-api-key')
    }
    stages {
	        stage('FARM Review') {
	            steps {
	                sh 'npm install -g farm-review'
	                sh '''mkdir -p ~/.farm-review
cat > ~/.farm-review/config.json <<EOF
{
  "defaultProvider": "openai",
  "providers": {
    "openai": {
      "enabled": true,
      "apiKey": "'"$OPENAI_API_KEY"'",
      "model": "gpt-4o"
    }
  },
  "server": { "autoOpen": false },
  "history": { "autoSave": false }
}
EOF
farm review --range origin/main...HEAD --no-ui -f markdown -o farm-review.md'''
	            }
	        }
	    }
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
