import { neon } from '@neondatabase/serverless'
import { HttpError } from './http.js'

let sql

const isNeon = (url) => {
  try {
    return new URL(url).hostname.endsWith('.neon.tech')
  } catch {
    return false
  }
}

// Same tagged-template API as neon(): sql`SELECT ... ${value}` -> rows. Used for a local PostgreSQL.
function pgSql(url) {
  let pool
  const getPool = async () => {
    if (!pool) {
      const { default: pg } = await import('pg')
      pool = new pg.Pool({ connectionString: url, max: 5 })
    }
    return pool
  }
  return async (strings, ...values) => {
    const text = strings.reduce((acc, part, i) => `${acc}$${i}${part}`)
    const { rows } = await (await getPool()).query(text, values)
    return rows
  }
}

// Lazily created so a missing DATABASE_URL becomes a friendly 503 instead of a crash on import.
export function db() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new HttpError(503, 'The database isn’t configured yet. Add DATABASE_URL to .env and restart the server.')
  }
  sql ??= isNeon(url) ? neon(url) : pgSql(url)
  return sql
}
