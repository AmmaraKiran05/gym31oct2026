import { SignJWT } from 'jose'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanup, client, exerciseIdByName, newUser } from '../helpers.js'

afterAll(cleanup)

describe('protected routes need a login', () => {
  it.each([
    ['GET', '/api/dashboard'],
    ['GET', '/api/exercises'],
    ['GET', '/api/workouts'],
    ['POST', '/api/workouts'],
    ['PATCH', '/api/workouts'],
    ['DELETE', '/api/workouts?exerciseId=1'],
    ['PATCH', '/api/sets'],
    ['GET', '/api/auth/me'],
  ])('%s %s -> 401', async (method, url) => {
    const res = await client()[method.toLowerCase()](url).send({ exerciseId: 1, workoutId: 1, setId: 1, completed: true, action: 'start' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBeTruthy()
  })

  it('rejects a token signed with the wrong secret', async () => {
    const forged = await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject('1').setExpirationTime('1h')
      .sign(new TextEncoder().encode('not-the-real-secret-not-the-real-secret'))
    const res = await client().get('/api/workouts').set('Cookie', `pf_session=${forged}`)
    expect(res.status).toBe(401)
  })

  it('rejects a valid token for a user that no longer exists', async () => {
    const token = await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject('987654321').setExpirationTime('1h')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET))
    const res = await client().get('/api/dashboard').set('Cookie', `pf_session=${token}`)
    expect(res.status).toBe(401)
  })

  it('rejects an expired token', async () => {
    const token = await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject('1')
      .setIssuedAt(Math.floor(Date.now() / 1000) - 7200).setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
      .sign(new TextEncoder().encode(process.env.JWT_SECRET))
    expect((await client().get('/api/workouts').set('Cookie', `pf_session=${token}`)).status).toBe(401)
  })
})

describe("user A cannot see or change user B's data", () => {
  let a
  let b
  let aWorkout
  let squat

  beforeAll(async () => {
    a = await newUser({ fullName: 'Alice' })
    b = await newUser({ fullName: 'Bob' })
    squat = await exerciseIdByName('Back Squat')
    aWorkout = (await a.post('/api/workouts').send({ exerciseId: squat.id })).body.workout
    await a.patch('/api/sets').send({ setId: aWorkout.exercises[0].sets[0].id, completed: true })
  })

  const aState = async () => (await a.get('/api/workouts')).body.workout

  it("B's workout and dashboard don't include A's workout", async () => {
    expect((await b.get('/api/workouts')).body.workout).toBeNull()
    const dash = (await b.get('/api/dashboard')).body
    expect(dash.workout).toBeNull()
    expect(dash.activityTotal).toBe(0)
  })

  it("B cannot tick or untick A's sets", async () => {
    const [s1, s2] = aWorkout.exercises[0].sets
    expect((await b.patch('/api/sets').send({ setId: s1.id, completed: false })).status).toBe(404)
    expect((await b.patch('/api/sets').send({ setId: s2.id, completed: true })).status).toBe(404)
    const sets = (await aState()).exercises[0].sets
    expect(sets[0].completed).toBe(true)
    expect(sets[1].completed).toBe(false)
  })

  it.each(['start', 'finish', 'reset', 'repeat'])("B cannot '%s' A's workout", async (action) => {
    const res = await b.patch('/api/workouts').send({ workoutId: aWorkout.id, action })
    expect(res.status).toBe(404)
    const now = await aState()
    expect(now.id).toBe(aWorkout.id)
    expect(now.status).toBe('in_progress')
  })

  it("B cannot remove exercises from A's workout", async () => {
    expect((await b.delete(`/api/workouts?exerciseId=${squat.id}`)).status).toBe(404)
    expect((await aState()).exercises).toHaveLength(1)
  })

  it("B adding the same exercise creates B's own workout, not a change to A's", async () => {
    const res = await b.post('/api/workouts').send({ exerciseId: squat.id })
    expect(res.status).toBe(201)
    expect(res.body.workout.id).not.toBe(aWorkout.id)
    expect((await aState()).exercises).toHaveLength(1)
    // ...and A still can't touch B's sets either
    const bSet = res.body.workout.exercises[0].sets[0]
    expect((await a.patch('/api/sets').send({ setId: bSet.id, completed: true })).status).toBe(404)
  })

  it("a finished workout by A never shows in B's stats", async () => {
    for (const s of aWorkout.exercises[0].sets) await a.patch('/api/sets').send({ setId: s.id, completed: true })
    await a.patch('/api/workouts').send({ workoutId: aWorkout.id, action: 'finish' })
    const dash = (await b.get('/api/dashboard')).body
    expect(dash.streak.current).toBe(0)
    expect(dash.week.workouts).toBe(0)
  })
})
