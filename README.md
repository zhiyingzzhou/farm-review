# farm-review

farm-review 是一个面向 Git 仓库的本地代码审查 CLI：读取提交/范围的 diff，调用你配置的模型给出审查意见，并提供 Web 页面查看结果。

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

- 命令：`farm-review`（别名：`farm`）
- 运行环境：Node.js >= 18
- 配置文件：`~/.farm-review/config.json`

## 安装

```bash
npm i -g farm-review

# 或者直接运行（不安装）
npx farm-review --help
```

## 使用

### 1) 配置

```bash
farm config
# 或：npx farm-review config
```

默认会启动本地服务（端口 `3050`），并打开配置页面：`http://127.0.0.1:3050/config`。

### 2) 运行审查

```bash
# 交互式选择最近提交
farm review

# 指定提交
farm review --commits <sha1,sha2>

# 审查一个范围（适合分支对比 / PR）
farm review --range origin/main...HEAD
```

### 3) 查看与导出

```bash
farm history -l
farm export -i <review-id> -f markdown -o report.md
```

## 常用参数

- `--no-ui`：只输出结果（适合 CI）；会打印 `Review ID` 方便后续 `export`
- `--fail-on warning|critical`：发现达到阈值的问题时返回非 0 退出码
- `-f, --format markdown|html|json` + `-o, --output <path>`：审查后自动导出
- `--comment`：回写 GitHub PR 评论（需要 Token 与 PR 上下文）
- `--all-files` / `--batch-size`：分批审查全部文件（默认会按 `maxFilesPerReview` 裁剪）

完整参数以 `farm <command> --help` 为准。

## 命令参考

### `farm config`

打开配置页面，启动本地服务。

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-p, --port <port>` | 指定服务端口 | 3050 |
| `--no-open` | 不自动打开浏览器 | - |

### `farm review`

执行代码审查（默认交互选择提交，也可指定提交/范围）。

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-c, --commits <commits>` | 指定要审查的提交（逗号分隔） | 交互选择 |
| `--range <range>` | 审查一个 ref 范围（如 `origin/main...HEAD`） | - |
| `--base <ref>` | 审查基准 ref（与 `--head` 组合使用） | - |
| `--head <ref>` | 审查目标 ref | `HEAD` |
| `-p, --provider <provider>` | 指定服务商（openai/claude/gemini/azure/ollama/zhipu） | 默认配置 |
| `-n, --count <count>` | 交互选择时显示最近 N 次提交 | 10 |
| `--port <port>` | 指定结果查看服务端口 | 3050 |
| `--no-open` | 不自动打开浏览器 | - |
| `--no-ui` | 不启动结果查看服务（CI 推荐） | - |
| `--fail-on <level>` | 发现指定级别及以上问题时返回非零退出码（none/info/warning/critical） | none |
| `-f, --format <format>` | 自动导出报告格式（markdown/html/json） | - |
| `-o, --output <path>` | 自动导出到指定路径 | - |
| `--comment` | 回写 GitHub PR 评论（需要 Token 与 PR 上下文） | - |
| `--comment-mode <mode>` | 评论模式（create/update/create-or-update） | create-or-update |
| `--github-repo <repo>` | GitHub 仓库（owner/repo） | 自动识别 |
| `--github-pr <number>` | GitHub PR 编号 | 自动识别 |
| `--github-token <token>` | GitHub Token | 自动识别 |
| `--all-files` | 分批审查全部文件（不裁剪） | - |
| `--batch-size <number>` | 分批大小（默认使用 `maxFilesPerReview`） | - |

### `farm history`

查看/打开历史审查记录。

| 选项 | 说明 |
|------|------|
| `-l, --list` | 列出所有历史记录 |
| `-v, --view <id>` | 查看指定审查结果 |
| `-d, --delete <id>` | 删除指定审查结果 |
| `--port <port>` | 指定结果查看服务端口 |

### `farm export`

导出审查报告。

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-i, --id <id>` | 指定审查 ID | 交互选择 |
| `-f, --format <format>` | 导出格式（markdown/html/json） | markdown |
| `-o, --output <path>` | 输出文件路径 | 当前目录 |

## 配置说明

配置文件：`~/.farm-review/config.json`。首次运行会自动生成默认配置。

常用字段：

- `providers.*`：各服务商的 `apiKey`、`model`、`enabled` 等
- `review.language`：`zh`/`en`
- `review.ignorePatterns`：忽略文件规则（glob）
- `review.maxFilesPerReview`：单次审查最多文件数
- `review.customPrompt`：追加自定义提示词

## 支持的服务商

- OpenAI
- Anthropic Claude
- Google Gemini
- Azure OpenAI
- Ollama（本地）
- 智谱 GLM（OpenAI 兼容接口）

## 隐私提示

除 Ollama 这类本地模型外，审查时会把 diff 内容发送到对应服务商；请避免把密钥、证书、个人信息等敏感内容提交到仓库或出现在 diff 中。

## 官网 / 文档站点（可选）

项目内置一套纯静态的介绍页 + Docs（不依赖本地 `/api`），可单独部署到公网：

```bash
npm run build:site
# 输出目录：dist/site
```

静态托管需要 SPA fallback（把所有路径重写到 `index.html`）。下面这些平台已在仓库内补齐配置：

- Vercel：`vercel.json`（Build=`npm run build:site`，Output=`dist/site`，已含 rewrite）
- Netlify：`netlify.toml` + `public/_redirects`（Build=`npm run build:site`，Publish=`dist/site`）
- Cloudflare Pages：复用 `public/_redirects`（Build=`npm run build:site`，Output=`dist/site`）；可选 `wrangler.toml`
- GitHub Pages：`.github/workflows/deploy-site.yml`（使用 `npm run build:gh-pages`，URL 形如 `/#/docs`，无需 rewrite）

## License

MIT
