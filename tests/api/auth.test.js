import { afterAll, describe, expect, it } from 'vitest'
import { PASSWORD, cleanup, client, newUser, trackUser, uniqueEmail } from '../helpers.js'

afterAll(cleanup)

const signup = (c, body) =>
  c.post('/api/auth/signup').send({ fullName: 'Vitest User', password: PASSWORD, ...body })

describe('POST /api/auth/signup', () => {
  it('creates an account, returns the public user and sets an httpOnly session cookie', async () => {
    const c = client()
    const email = uniqueEmail('signup')
    const res = await signup(c, { email: `  ${email.toUpperCase()} `, weeklyGoalWorkouts: 5, weeklyGoalMinutes: 240 })
    expect(res.status).toBe(201)
    trackUser(res.body.user.id)
    expect(res.body.user).toMatchObject({ email, fullName: 'Vitest User', weeklyGoalWorkouts: 5, weeklyGoalMinutes: 240 })
    expect(res.body.user).not.toHaveProperty('password_hash')
    expect(JSON.stringify(res.body)).not.toContain('$2')
    const cookies = res.headers['set-cookie'].join('\n')
    expect(cookies).toMatch(/pf_session=[^;]+; Path=\/; HttpOnly; SameSite=Lax/)
    expect(cookies).toMatch(/pf_auth=1/)
  })

  it('uses default goals when none are given', async () => {
    const res = await signup(client(), { email: uniqueEmail('defaults') })
    expect(res.status).toBe(201)
    trackUser(res.body.user.id)
    expect(res.body.user).toMatchObject({ weeklyGoalWorkouts: 4, weeklyGoalMinutes: 180 })
  })

  it('blocks a duplicate email, even with different capitalisation', async () => {
    const { email } = await newUser()
    const res = await signup(client(), { email: email.toUpperCase() })
    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/already exists/i)
  })

  it.each([
    ['empty', '', /choose a password/i],
    ['too short', 'ab1', /at least 8/i],
    ['letters only', 'abcdefghij', /letter and one number/i],
    ['numbers only', '1234567890', /letter and one number/i],
    ['very common', 'Password123', /too common/i],
    ['too long', `a1${'x'.repeat(80)}`, /at most 72/i],
  ])('blocks a weak password (%s)', async (_label, password, message) => {
    const res = await signup(client(), { email: uniqueEmail('weak'), password })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(message)
  })

  it.each([
    ['missing name', { fullName: '' }, /name/i],
    ['bad email', { email: 'not-an-email' }, /email/i],
    ['goal too high', { weeklyGoalWorkouts: 99 }, /between 1 and 14/],
    ['goal not a number', { weeklyGoalMinutes: 'lots' }, /between 10 and 3000/],
  ])('rejects invalid input (%s)', async (_label, body, message) => {
    const res = await signup(client(), { email: uniqueEmail('invalid'), ...body })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(message)
  })

  it('rejects malformed JSON with a 400', async () => {
    const res = await client().post('/api/auth/signup').set('Content-Type', 'application/json').send('{"email":')
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/valid JSON/i)
  })
})

describe('POST /api/auth/login and /logout, GET /api/auth/me', () => {
  it('logs in with the right password and /me returns the user', async () => {
    const { email, user } = await newUser()
    const c = client()
    const login = await c.post('/api/auth/login').send({ email, password: PASSWORD })
    expect(login.status).toBe(200)
    expect(login.body.user.id).toBe(user.id)
    const me = await c.get('/api/auth/me')
    expect(me.status).toBe(200)
    expect(me.body.user).toMatchObject({ id: user.id, email })
  })

  it('fails with the wrong password or an unknown email (same message)', async () => {
    const { email } = await newUser()
    const wrong = await client().post('/api/auth/login').send({ email, password: 'Wrong12345' })
    const unknown = await client().post('/api/auth/login').send({ email: uniqueEmail('ghost'), password: PASSWORD })
    expect(wrong.status).toBe(401)
    expect(unknown.status).toBe(401)
    expect(wrong.body.error).toBe(unknown.body.error)
    expect(wrong.headers['set-cookie']).toBeUndefined()
  })

  it('requires both email and password', async () => {
    const res = await client().post('/api/auth/login').send({ email: '' })
    expect(res.status).toBe(400)
  })

  it('/me returns 401 when logged out', async () => {
    const res = await client().get('/api/auth/me')
    expect(res.status).toBe(401)
    expect(res.body.user).toBeNull()
  })

  it('/me returns 401 and clears cookies for a forged token', async () => {
    const c = client()
    const res = await c.get('/api/auth/me').set('Cookie', 'pf_session=not.a.real.token; pf_auth=1')
    expect(res.status).toBe(401)
    expect(res.headers['set-cookie'].join('\n')).toMatch(/pf_session=; .*Max-Age=0/)
  })

  it('logout clears the cookie and ends the session', async () => {
    const u = await newUser()
    expect((await u.get('/api/auth/me')).status).toBe(200)
    const out = await u.post('/api/auth/logout')
    expect(out.status).toBe(200)
    const cookies = out.headers['set-cookie'].join('\n')
    expect(cookies).toMatch(/pf_session=; Path=\/; HttpOnly; SameSite=Lax; Max-Age=0/)
    expect(cookies).toMatch(/pf_auth=; .*Max-Age=0/)
    expect((await u.get('/api/auth/me')).status).toBe(401)
    expect((await u.get('/api/workouts')).status).toBe(401)
  })

  it('rejects the wrong HTTP method with 405', async () => {
    expect((await client().get('/api/auth/login')).status).toBe(405)
    expect((await client().delete('/api/auth/me')).status).toBe(405)
  })
})
