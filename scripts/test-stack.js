// Production-like stack for browser tests and Lighthouse:
// built frontend (vite preview) + the real /api handlers, both pointed at the pulsefit_test database.
import 'dotenv/config'
import { preview } from 'vite'
import { prepareTestDb } from './_testdb.js'

const WEB_PORT = Number(process.env.E2E_WEB_PORT) || 4174
const API_PORT = Number(process.env.E2E_API_PORT) || 3002

const db = await prepareTestDb({ log: console.log })
process.env.DATABASE_URL = db.url // the API reads this lazily, after this point

const { createApp } = await import('../server/app.js')
const api = createApp().listen(API_PORT, '127.0.0.1')

const web = await preview({
  preview: {
    port: WEB_PORT,
    strictPort: true,
    host: '127.0.0.1',
    proxy: { '/api': `http://127.0.0.1:${API_PORT}` },
  },
})
console.log(`[test-stack] ready: http://127.0.0.1:${WEB_PORT} (api :${API_PORT}, db pulsefit_test)`)

let closing = false
async function shutdown() {
  if (closing) return
  closing = true
  api.close()
  await new Promise((r) => web.httpServer.close(r))
  if (db.started) await db.stop().catch(() => {})
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
process.on('SIGBREAK', shutdown)
