// Long-running local PostgreSQL for "npm run dev". Exits quietly when DATABASE_URL is a remote (Neon) URL.
import 'dotenv/config'
import { localDbConfig, startLocalDb } from './_localdb.js'

const cfg = localDbConfig()
if (!cfg) {
  console.log('[db] DATABASE_URL is a remote database — no local PostgreSQL needed.')
  process.exit(0)
}

const db = await startLocalDb(cfg)
console.log(
  db.started
    ? `[db] Local PostgreSQL ready on 127.0.0.1:${cfg.port} (database "${cfg.database}")`
    : `[db] Local PostgreSQL already running on 127.0.0.1:${cfg.port}`,
)

let stopping = false
async function shutdown() {
  if (stopping) return
  stopping = true
  await db.stop().catch(() => {})
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
process.on('SIGBREAK', shutdown)
setInterval(() => {}, 1 << 30) // keep the process (and the database) alive
