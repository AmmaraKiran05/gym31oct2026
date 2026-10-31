// Point every API handler at the separate test database before any test runs.
import 'dotenv/config'
import { testDatabaseUrl } from '../scripts/_testdb.js'

process.env.DATABASE_URL = testDatabaseUrl()
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  process.env.JWT_SECRET = 'vitest-only-secret-0123456789abcdefghijklmnopqrstuvwxyz'
}
