import { SignJWT, jwtVerify } from 'jose'
import { db } from './db.js'
import { HttpError } from './http.js'

const COOKIE = 'pf_session'
// Non-secret, script-readable hint that a session cookie exists, so the app can skip
// calling /api/auth/me (and logging a 401) for visitors who were never logged in.
const HINT_COOKIE = 'pf_auth'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function secret() {
  const s = process.env.JWT_SECRET
  if (!s || s.length < 32) throw new HttpError(503, 'JWT_SECRET is missing or too short. Run "npm run dev" to generate one.')
  return new TextEncoder().encode(s)
}

// Vercel (production and preview deployments) is always HTTPS; locally it's plain http,
// where a Secure cookie would be silently dropped by the browser.
function cookieAttrs(maxAge, { httpOnly = true } = {}) {
  const secure = process.env.VERCEL ? '; Secure' : ''
  return `Path=/;${httpOnly ? ' HttpOnly;' : ''} SameSite=Lax; Max-Age=${maxAge}${secure}`
}

function readCookie(req, name) {
  const header = req.headers.cookie || ''
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return null
}

export async function startSession(res, userId) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret())
  res.setHeader('Set-Cookie', [
    `${COOKIE}=${token}; ${cookieAttrs(MAX_AGE)}`,
    `${HINT_COOKIE}=1; ${cookieAttrs(MAX_AGE, { httpOnly: false })}`,
  ])
}

export function endSession(res) {
  res.setHeader('Set-Cookie', [`${COOKIE}=; ${cookieAttrs(0)}`, `${HINT_COOKIE}=; ${cookieAttrs(0, { httpOnly: false })}`])
}

export const hasSessionCookies = (req) => /(?:^|;\s*)pf_(?:session|auth)=/.test(req.headers.cookie || '')

export async function sessionUserId(req) {
  const token = readCookie(req, COOKIE)
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] })
    const id = Number(payload.sub)
    return Number.isInteger(id) && id > 0 ? id : null
  } catch (err) {
    if (err instanceof HttpError) throw err
    return null // expired or tampered token
  }
}

export const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  fullName: u.full_name,
  weeklyGoalWorkouts: u.weekly_goal_workouts,
  weeklyGoalMinutes: u.weekly_goal_minutes,
  createdAt: u.created_at,
})

// Returns the logged-in user's row or null.
export async function currentUser(req) {
  const id = await sessionUserId(req)
  if (!id) return null
  const [user] = await db()`
    SELECT id, email, full_name, weekly_goal_workouts, weekly_goal_minutes, created_at
    FROM users WHERE id = ${id}`
  return user ?? null
}

export async function requireUser(req) {
  const user = await currentUser(req)
  if (!user) throw new HttpError(401, 'Please log in to continue.')
  return user
}
