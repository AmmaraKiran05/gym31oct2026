import request from 'supertest'
import pg from 'pg'
import { createApp } from '../server/app.js'

export const app = createApp()
export const TZ = 'UTC'
export const PASSWORD = 'Str0ngPass99'

// Direct database access for arranging fake data and cleaning up (test database only).
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3 })
export const q = async (text, params) => (await pool.query(text, params)).rows

let n = 0
export const uniqueEmail = (tag = 'user') =>
  `vitest-${tag}-${Date.now().toString(36)}-${process.pid}-${++n}@test.pulsefit.local`

// Small wrapper so every request carries the time zone header like the real app does.
export function client(agent = request.agent(app)) {
  const wrap = (method) => (url) => agent[method](url).set('X-Timezone', TZ)
  return { agent, get: wrap('get'), post: wrap('post'), patch: wrap('patch'), delete: wrap('delete'), put: wrap('put') }
}

const created = new Set()

// Signs up a fresh user and returns a logged-in client.
export async function newUser(overrides = {}) {
  const c = client()
  const email = overrides.email ?? uniqueEmail()
  const res = await c.post('/api/auth/signup').send({
    email,
    password: PASSWORD,
    fullName: 'Vitest User',
    weeklyGoalWorkouts: 3,
    weeklyGoalMinutes: 90,
    ...overrides,
  })
  if (res.status !== 201) throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.body)}`)
  created.add(res.body.user.id)
  return { ...c, user: res.body.user, email }
}

export const trackUser = (id) => created.add(id)

// Deletes every user this test file created (workouts, exercises-in-workouts and sets cascade).
export async function cleanup() {
  if (created.size) await pool.query('DELETE FROM users WHERE id = ANY($1::int[])', [[...created]])
  created.clear()
}

export async function todayUTC() {
  const [{ today }] = await q(`SELECT (now() AT TIME ZONE 'UTC')::date::text AS today`)
  return today
}

// Inserts a completed workout `daysAgo` days before today (UTC) for a user.
export async function addCompletedWorkout(userId, daysAgo, minutes = 30) {
  await q(
    `INSERT INTO workouts (user_id, name, workout_date, status, duration_minutes, started_at, completed_at)
     VALUES ($1, 'Fake Session', (now() AT TIME ZONE 'UTC')::date - $2::int, 'completed', $3, now(), now())`,
    [userId, daysAgo, minutes],
  )
}

export async function exerciseIdByName(name) {
  const [row] = await q('SELECT id, sets FROM exercises WHERE name = $1', [name])
  return row
}
