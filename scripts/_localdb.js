// Runs a real PostgreSQL server from node_modules (embedded-postgres), with data kept in ./.localdb.
// Used only when DATABASE_URL points at this machine; a Neon URL skips all of this.
import { existsSync } from 'node:fs'
import net from 'node:net'
import { fileURLToPath } from 'node:url'

export const DATA_DIR = fileURLToPath(new URL('../.localdb', import.meta.url))

export function localDbConfig(url = process.env.DATABASE_URL) {
  let u
  try {
    u = new URL(url)
  } catch {
    return null
  }
  if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(u.hostname)) return null
  return {
    host: '127.0.0.1',
    port: Number(u.port) || 5432,
    user: decodeURIComponent(u.username) || 'postgres',
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, '') || 'postgres',
  }
}

function portOpen(port) {
  return new Promise((resolve) => {
    const s = net.connect({ host: '127.0.0.1', port })
    s.once('connect', () => (s.destroy(), resolve(true)))
    s.once('error', () => resolve(false))
  })
}

// Creates cfg.database if it doesn't exist yet (works whether or not we started the server).
async function ensureDatabase(cfg, log) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(cfg.database)) throw new Error(`Invalid database name: ${cfg.database}`)
  const { default: pg } = await import('pg')
  const client = new pg.Client({ ...cfg, database: 'postgres' })
  await client.connect()
  try {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [cfg.database])
    if (!rowCount) {
      await client.query(`CREATE DATABASE "${cfg.database}"`)
      log(`[db] Created database "${cfg.database}"`)
    }
  } finally {
    await client.end()
  }
}

// Starts the local server if it isn't already running, and makes sure cfg.database exists.
// Returns { stop, started }.
export async function startLocalDb(cfg, { log = console.log } = {}) {
  if (await portOpen(cfg.port)) {
    await ensureDatabase(cfg, log)
    return { started: false, stop: async () => {} }
  }

  const { default: EmbeddedPostgres } = await import('embedded-postgres')
  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: cfg.user,
    password: cfg.password,
    port: cfg.port,
    persistent: true,
    onLog: () => {},
    onError: (e) => log(`[db] ${String(e).trim()}`),
  })

  if (!existsSync(`${DATA_DIR}/PG_VERSION`)) {
    log('[db] First run: creating local PostgreSQL data folder (.localdb)…')
    await pg.initialise()
  }
  await pg.start()
  await ensureDatabase(cfg, log)

  return { started: true, stop: () => pg.stop() }
}
