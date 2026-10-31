// Express app that serves the /api/*.js handlers exactly like Vercel does.
// /api/auth/login -> api/auth/login.js  (files and folders starting with "_" are private, like on Vercel)
import express from 'express'
import { existsSync, statSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const API_DIR = resolve(fileURLToPath(new URL('../api', import.meta.url)))

function resolveRoute(urlPath) {
  const rel = urlPath.replace(/^\/api\/?/, '').replace(/\/+$/, '')
  const parts = rel ? rel.split('/') : []
  if (parts.some((p) => !p || p.startsWith('_') || p.startsWith('.'))) return null
  const base = join(API_DIR, ...parts)
  if (!base.startsWith(API_DIR + sep) && base !== API_DIR) return null
  for (const file of [`${base}.js`, join(base, 'index.js')]) {
    if (existsSync(file)) return file
  }
  return null
}

export function createApp({ hotReload = false } = {}) {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '1mb' }))

  app.all('/api/*', async (req, res) => {
    const file = resolveRoute(req.path)
    if (!file) return res.status(404).json({ error: `No API route for ${req.path}` })
    try {
      // In dev, cache-bust on file change so route edits apply without restarting.
      const href = pathToFileURL(file).href + (hotReload ? `?v=${statSync(file).mtimeMs}` : '')
      const mod = await import(href)
      await mod.default(req, res)
    } catch (err) {
      console.error(`[api] ${req.method} ${req.path} crashed:`, err)
      if (!res.headersSent) res.status(500).json({ error: 'Something went wrong on our side.' })
    }
  })

  // Malformed JSON bodies: answer like the handlers do instead of Express's HTML error page.
  app.use((err, req, res, next) => {
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body must be valid JSON.' })
    next(err)
  })

  return app
}
