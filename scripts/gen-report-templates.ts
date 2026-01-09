import fs from 'fs'
import path from 'path'

type TemplateSource = {
  markdown: string
  html: string
}

function readTemplates(rootDir: string): TemplateSource {
  const templatesDir = path.join(rootDir, 'src', 'cli', 'templates')
  const markdownPath = path.join(templatesDir, 'report.md.tpl')
  const htmlPath = path.join(templatesDir, 'report.html.tpl')

  return {
    markdown: fs.readFileSync(markdownPath, 'utf-8'),
    html: fs.readFileSync(htmlPath, 'utf-8'),
  }
}

function writeGenerated(rootDir: string, source: TemplateSource): void {
  const outDir = path.join(rootDir, 'src', 'cli', 'templates')
  const outPath = path.join(outDir, 'generated.ts')

  fs.mkdirSync(outDir, { recursive: true })

  const content = `/* eslint-disable */
// 此文件由 scripts/gen-report-templates.ts 自动生成，请勿手改。
export const REPORT_MARKDOWN_TEMPLATE = ${JSON.stringify(source.markdown)};
export const REPORT_HTML_TEMPLATE = ${JSON.stringify(source.html)};
`

  fs.writeFileSync(outPath, content, 'utf-8')
}

function main(): void {
  const rootDir = process.cwd()
  const templates = readTemplates(rootDir)
  writeGenerated(rootDir, templates)
}

main()

