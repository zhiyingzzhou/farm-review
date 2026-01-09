import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import DocLayout from './components/DocLayout'
import { isPublicSite } from './env'

const HomePage = lazy(() => import('./pages/HomePage'))
const ConfigPage = lazy(() => import('./pages/ConfigPage'))
const ReviewPage = lazy(() => import('./pages/ReviewPage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const DocsPage = lazy(() => import('./pages/DocsPage'))
const LocalOnlyPage = lazy(() => import('./pages/LocalOnlyPage'))

const QuickStart = lazy(() => import('./pages/docs/QuickStart'))
const Configuration = lazy(() => import('./pages/docs/Configuration'))
const CLICommands = lazy(() => import('./pages/docs/CLICommands'))
const AIModels = lazy(() => import('./pages/docs/AIModels'))
const CICDIntegration = lazy(() => import('./pages/docs/CICDIntegration'))
const Deployment = lazy(() => import('./pages/docs/Deployment'))
const FAQ = lazy(() => import('./pages/docs/FAQ'))

function RouteFallback() {
  return (
    <div className="container py-12">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route
            path="config"
            element={isPublicSite ? <LocalOnlyPage type="config" /> : <ConfigPage />}
          />
          <Route
            path="review/:id"
            element={isPublicSite ? <LocalOnlyPage type="review" /> : <ReviewPage />}
          />
          <Route
            path="history"
            element={isPublicSite ? <LocalOnlyPage type="history" /> : <HistoryPage />}
          />

          <Route path="docs" element={<DocLayout />}>
            <Route index element={<DocsPage />} />
            <Route path="quick-start" element={<QuickStart />} />
            <Route path="config" element={<Configuration />} />
            <Route path="cli" element={<CLICommands />} />
            <Route path="models" element={<AIModels />} />
            <Route path="ci-cd" element={<CICDIntegration />} />
            <Route path="deploy" element={<Deployment />} />
            <Route path="faq" element={<FAQ />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
