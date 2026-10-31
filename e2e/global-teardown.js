// Removes every user the browser tests created (test database only; workouts and sets cascade).
import pg from 'pg'
import { testDatabaseUrl } from '../scripts/_testdb.js'

export default async function teardown() {
  const client = new pg.Client({ connectionString: testDatabaseUrl() })
  await client.connect()
  try {
    const { rowCount } = await client.query(`DELETE FROM users WHERE email LIKE 'e2e-%@test.pulsefit.local'`)
    console.log(`[e2e] cleaned up ${rowCount} test user(s)`)
  } finally {
    await client.end()
  }
}
