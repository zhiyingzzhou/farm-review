import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), 'VITE_')
  const processEnv = Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] => entry[0].startsWith('VITE_') && typeof entry[1] === 'string'
    )
  )
  const env = { ...fileEnv, ...processEnv }
  const buildTarget = (env.VITE_BUILD_TARGET || '').toLowerCase()
  const isSiteBuild = buildTarget === 'site' || mode === 'site'

  const base = resolveViteBase(env.VITE_BASE)

  return {
    plugins: [react()],
    root: '.',
    publicDir: 'public',
    base,
    build: {
      outDir: isSiteBuild ? 'dist/site' : 'dist/web',
      emptyOutDir: true,
      // ReviewPage 引入 diff-view 相关依赖较大，这里提高阈值避免无意义的构建告警噪音
      chunkSizeWarningLimit: 1200,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@web': path.resolve(__dirname, './web/src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3050',
          changeOrigin: true,
        },
      },
    },
  }
})

function resolveViteBase(raw?: string): string {
  const value = (raw || '').trim()
  if (!value) return '/'

  // 允许使用相对 base（如 GitHub Pages + HashRouter 场景的 './'）
  if (value === './' || value.startsWith('./') || value.startsWith('../')) return value

  // 允许绝对 URL
  if (/^https?:\/\//i.test(value)) return value.endsWith('/') ? value : `${value}/`

  let normalized = value.startsWith('/') ? value : `/${value}`
  if (!normalized.endsWith('/')) normalized += '/'
  return normalized
}
