import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { apiRouter } from './routes/api.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOOPBACK_HOST = process.env.ACR_HOST || '127.0.0.1'

let serverInstance: ReturnType<typeof express.application.listen> | null = null

export async function startServer(port: number): Promise<void> {
  // If server is already running, return
  if (serverInstance) {
    return
  }

  const app = express()

  // Middleware
  app.use(
    cors({
      origin: (origin, callback) => {
        // 允许 CLI / curl 等无 Origin 的请求
        if (!origin) return callback(null, true)
        // 仅允许本机来源的浏览器访问
        try {
          const { hostname } = new URL(origin)
          if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return callback(null, true)
          }
        } catch {
          // ignore
        }
        return callback(null, false)
      },
    })
  )
  app.use(express.json({ limit: '50mb' }))

  // API routes
  app.use('/api', apiRouter)

  // Serve static files for production
  const distPath = path.join(__dirname, '..', 'web')
  app.use(express.static(distPath))

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    // Try to serve from dist first
    const indexPath = path.join(distPath, 'index.html')
    
    // For development, redirect to Vite dev server
    if (process.env.NODE_ENV === 'development') {
      res.redirect(`http://127.0.0.1:5173${req.path}`)
      return
    }

    res.sendFile(indexPath, (err) => {
      if (err) {
        // If built files don't exist, show a helpful message
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>FARM Review</title>
            <style>
              body {
                font-family: system-ui, sans-serif;
                background: #0f172a;
                color: #f1f5f9;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
              }
              .container {
                text-align: center;
                padding: 2rem;
              }
              h1 { color: #d946ef; }
              a { color: #0ea5e9; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🤖 FARM Review</h1>
              <p>Web UI is being served. Access <a href="/api/config">/api/config</a> for API.</p>
              <p>To build the web UI, run: <code>npm run build:web</code></p>
            </div>
          </body>
          </html>
        `)
      }
    })
  })

  return new Promise((resolve, reject) => {
    try {
      serverInstance = app.listen(port, LOOPBACK_HOST, () => {
        resolve()
      })
      
      serverInstance.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`Port ${port} is already in use`))
        } else {
          reject(err)
        }
      })
    } catch (error) {
      reject(error)
    }
  })
}

export function stopServer(): void {
  if (serverInstance) {
    serverInstance.close()
    serverInstance = null
  }
}
