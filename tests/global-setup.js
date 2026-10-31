// Runs once before all backend tests: start PostgreSQL if needed and reset the pulsefit_test schema + seed.
import { prepareTestDb } from '../scripts/_testdb.js'

export default async function setup() {
  const db = await prepareTestDb()
  return async () => {
    if (db.started) await db.stop()
  }
}
