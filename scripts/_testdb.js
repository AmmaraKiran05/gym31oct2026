// A separate "pulsefit_test" database on the local PostgreSQL, so tests never touch real data.
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { localDbConfig, startLocalDb } from './_localdb.js'

export function testDatabaseUrl() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL
  const url = process.env.DATABASE_URL
  if (!url || !localDbConfig(url)) {
    throw new Error(
      'Tests need a local database. Set DATABASE_URL to the local PostgreSQL (see .env.example) or set TEST_DATABASE_URL.',
    )
  }
  const u = new URL(url)
  u.pathname = '/pulsefit_test'
  return u.toString()
}

// Starts PostgreSQL if needed, creates pulsefit_test, applies schema + seed. Returns { url, stop }.
export async function prepareTestDb({ log = () => {} } = {}) {
  const url = testDatabaseUrl()
  const cfg = localDbConfig(url)
  const server = cfg ? await startLocalDb(cfg, { log }) : { started: false, stop: async () => {} }

  const { default: pg } = await import('pg')
  const client = new pg.Client({ connectionString: url })
  await client.connect()
  try {
    for (const f of ['schema.sql', 'seed.sql']) {
      await client.query(readFileSync(new URL(`../db/${f}`, import.meta.url), 'utf8'))
    }
  } finally {
    await client.end()
  }
  return { url, stop: server.stop, started: server.started }
}
