// Runs db/schema.sql then db/seed.sql against DATABASE_URL and prints row counts.
// Works with the local PostgreSQL (started automatically if needed) or a Neon URL.
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { localDbConfig, startLocalDb } from './_localdb.js'

const read = (f) => readFileSync(new URL(`../db/${f}`, import.meta.url), 'utf8')
const url = process.env.DATABASE_URL
const local = localDbConfig(url)

let pool
let localDb = null
if (local) {
  localDb = await startLocalDb(local)
  const { default: pg } = await import('pg')
  pool = new pg.Pool({ connectionString: url })
} else {
  const { Pool, neonConfig } = await import('@neondatabase/serverless')
  const { default: ws } = await import('ws')
  neonConfig.webSocketConstructor = ws
  pool = new Pool({ connectionString: url })
}

try {
  console.log(`→ Target: ${local ? `local PostgreSQL (127.0.0.1:${local.port}/${local.database})` : 'Neon'}`)
  console.log('→ Applying db/schema.sql')
  await pool.query(read('schema.sql'))
  console.log('→ Applying db/seed.sql')
  await pool.query(read('seed.sql'))

  const { rows } = await pool.query(`
    SELECT 'exercises' AS "table", count(*)::int AS rows FROM exercises
    UNION ALL SELECT 'classes', count(*)::int FROM classes
    UNION ALL SELECT 'users', count(*)::int FROM users
    UNION ALL SELECT 'workouts', count(*)::int FROM workouts`)
  console.log('\n✔ Database ready\n')
  console.table(rows)
} catch (err) {
  console.error('\n✖ Database setup failed:', err.message || err.code || err)
  if (/password authentication|ENOTFOUND|getaddrinfo|ECONNREFUSED|timeout/i.test(`${err.message} ${err.code}`)) {
    console.error('  Check that DATABASE_URL in .env is correct and the database is reachable.')
  }
  process.exitCode = 1
} finally {
  await pool.end()
  if (localDb?.started) await localDb.stop()
}
