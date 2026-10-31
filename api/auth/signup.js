import bcrypt from 'bcryptjs'
import { db } from '../_lib/db.js'
import { HttpError, body, route } from '../_lib/http.js'
import { publicUser, startSession } from '../_lib/auth.js'
import { passwordProblem } from '../_lib/validate.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function goal(value, fallback, min, max, label) {
  if (value === undefined || value === null || value === '') return fallback
  const n = Number(value)
  if (!Number.isInteger(n) || n < min || n > max) throw new HttpError(400, `${label} must be between ${min} and ${max}.`)
  return n
}

export default route({
  async POST(req, res) {
    const b = body(req)
    const email = String(b.email ?? '').trim().toLowerCase()
    const password = String(b.password ?? '')
    const fullName = String(b.fullName ?? '').trim()

    if (!fullName || fullName.length > 80) throw new HttpError(400, 'Please tell us your name (up to 80 characters).')
    if (!EMAIL_RE.test(email) || email.length > 254) throw new HttpError(400, 'That email address doesn’t look right.')
    const weak = passwordProblem(password)
    if (weak) throw new HttpError(400, weak)
    const goalWorkouts = goal(b.weeklyGoalWorkouts, 4, 1, 14, 'Weekly workouts goal')
    const goalMinutes = goal(b.weeklyGoalMinutes, 180, 10, 3000, 'Weekly minutes goal')

    const hash = await bcrypt.hash(password, 10)
    let user
    try {
      ;[user] = await db()`
        INSERT INTO users (email, password_hash, full_name, weekly_goal_workouts, weekly_goal_minutes)
        VALUES (${email}, ${hash}, ${fullName}, ${goalWorkouts}, ${goalMinutes})
        RETURNING id, email, full_name, weekly_goal_workouts, weekly_goal_minutes, created_at`
    } catch (err) {
      if (err?.code === '23505') throw new HttpError(409, 'An account with that email already exists. Try logging in instead.')
      throw err
    }

    await startSession(res, user.id)
    res.status(201).json({ user: publicUser(user) })
  },
})
