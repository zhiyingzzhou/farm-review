function normalizeBase(base: string): string {
  if (!base) return '/'
  if (!base.startsWith('/')) base = `/${base}`
  if (base !== '/' && base.endsWith('/')) return base.slice(0, -1)
  return base
}

export const buildTarget = (import.meta.env.VITE_BUILD_TARGET || '').toLowerCase()
export const isPublicSite = buildTarget === 'site' || import.meta.env.MODE === 'site'
export const routerMode = (import.meta.env.VITE_ROUTER_MODE || '').toLowerCase()
const rawBaseUrl = import.meta.env.BASE_URL || '/'
export const routerBasename = rawBaseUrl.startsWith('/') ? normalizeBase(rawBaseUrl) : '/'
