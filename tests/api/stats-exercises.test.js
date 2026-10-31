import { afterAll, describe, expect, it } from 'vitest'
import { addCompletedWorkout, cleanup, client, newUser } from '../helpers.js'

afterAll(cleanup)

const GROUPS = ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']

describe('GET /api/stats (public)', () => {
  it('returns members, workouts completed and classes this week as whole numbers', async () => {
    const res = await client().get('/api/stats')
    expect(res.status).toBe(200)
    for (const key of ['members', 'workoutsCompleted', 'classesThisWeek']) {
      expect(Number.isInteger(res.body[key])).toBe(true)
      expect(res.body[key]).toBeGreaterThanOrEqual(0)
    }
    expect(res.body.classesThisWeek).toBe(10) // seed re-dates all 10 classes to the current week
  })

  it('counts new members and completed workouts', async () => {
    const before = (await client().get('/api/stats')).body
    const u = await newUser()
    await addCompletedWorkout(u.user.id, 0)
    const after = (await client().get('/api/stats')).body
    expect(after.members).toBe(before.members + 1)
    expect(after.workoutsCompleted).toBe(before.workoutsCompleted + 1)
  })
})

describe('GET /api/exercises', () => {
  it('returns 401 without login', async () => {
    expect((await client().get('/api/exercises')).status).toBe(401)
  })

  it('returns all 30 exercises with the expected fields', async () => {
    const u = await newUser()
    const res = await u.get('/api/exercises')
    expect(res.status).toBe(200)
    expect(res.body.exercises).toHaveLength(30)
    for (const e of res.body.exercises) {
      expect(e).toEqual({
        id: expect.any(Number),
        name: expect.any(String),
        muscleGroup: expect.any(String),
        sets: expect.any(Number),
        reps: expect.any(String),
        difficulty: expect.stringMatching(/^(Beginner|Intermediate|Advanced)$/),
        restSeconds: expect.any(Number),
        description: expect.any(String),
      })
      expect(GROUPS).toContain(e.muscleGroup)
    }
    expect(new Set(res.body.exercises.map((e) => e.name)).size).toBe(30)
  })

  it.each(GROUPS)('filters by muscle group: %s (5 exercises)', async (group) => {
    const u = await newUser()
    const res = await u.get(`/api/exercises?muscle_group=${group}`)
    expect(res.status).toBe(200)
    expect(res.body.exercises).toHaveLength(5)
    expect(res.body.exercises.every((e) => e.muscleGroup === group)).toBe(true)
  })

  it('rejects an unknown muscle group', async () => {
    const u = await newUser()
    const res = await u.get('/api/exercises?muscle_group=Toes')
    expect(res.status).toBe(400)
  })
})
