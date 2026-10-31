import bcrypt from 'bcryptjs'
import { db } from '../_lib/db.js'
import { HttpError, body, route } from '../_lib/http.js'
import { publicUser, startSession } from '../_lib/auth.js'

// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('pulsefit-timing-guard', 10)

export default route({
  async POST(req, res) {
    const b = body(req)
    const email = String(b.email ?? '').trim().toLowerCase()
    const password = String(b.password ?? '')
    if (!email || !password) throw new HttpError(400, 'Enter your email and password.')

    const [user] = await db()`
      SELECT id, email, password_hash, full_name, weekly_goal_workouts, weekly_goal_minutes, created_at
      FROM users WHERE email = ${email}`
    const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH)
    if (!user || !ok) throw new HttpError(401, 'That email and password don’t match. Give it another try.')

    await startSession(res, user.id)
    res.status(200).json({ user: publicUser(user) })
  },
})
