import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanup, exerciseIdByName, newUser } from '../helpers.js'

afterAll(cleanup)

describe('workout lifecycle: /api/workouts + /api/sets', () => {
  let u
  let bench
  let row
  let workout

  beforeAll(async () => {
    u = await newUser()
    bench = await exerciseIdByName('Barbell Bench Press')
    row = await exerciseIdByName('Bent-Over Barbell Row')
  })

  const allSets = (w) => w.exercises.flatMap((e) => e.sets)

  it('starts with no workout today', async () => {
    const res = await u.get('/api/workouts')
    expect(res.status).toBe(200)
    expect(res.body.workout).toBeNull()
  })

  it("adding an exercise creates today's workout with one row per set", async () => {
    const res = await u.post('/api/workouts').send({ exerciseId: bench.id })
    expect(res.status).toBe(201)
    workout = res.body.workout
    expect(workout).toMatchObject({ status: 'planned', name: 'Chest Session', startedAt: null, completedAt: null })
    expect(workout.exercises).toHaveLength(1)
    expect(workout.exercises[0]).toMatchObject({ exerciseId: bench.id, name: 'Barbell Bench Press', restSeconds: 90 })
    expect(workout.exercises[0].sets.map((s) => s.setNumber)).toEqual([1, 2, 3, 4])
    expect(allSets(workout).every((s) => s.completed === false)).toBe(true)
  })

  it('adds a second exercise to the same workout and renames it', async () => {
    const res = await u.post('/api/workouts').send({ exerciseId: row.id })
    expect(res.status).toBe(201)
    expect(res.body.workout.id).toBe(workout.id)
    expect(res.body.workout.name).toBe('Chest & Back Session')
    expect(res.body.workout.exercises.map((e) => e.exerciseId)).toEqual([bench.id, row.id])
    workout = res.body.workout
  })

  it('blocks adding the same exercise twice, unknown ids and bad input', async () => {
    expect((await u.post('/api/workouts').send({ exerciseId: bench.id })).status).toBe(409)
    expect((await u.post('/api/workouts').send({ exerciseId: 999999 })).status).toBe(404)
    expect((await u.post('/api/workouts').send({ exerciseId: 'abc' })).status).toBe(400)
    expect((await u.post('/api/workouts').send({})).status).toBe(400)
  })

  it('removes an exercise and keeps the rest', async () => {
    const res = await u.delete(`/api/workouts?exerciseId=${row.id}`)
    expect(res.status).toBe(200)
    expect(res.body.workout.exercises.map((e) => e.exerciseId)).toEqual([bench.id])
    expect(res.body.workout.name).toBe('Chest Session')
    expect((await u.delete(`/api/workouts?exerciseId=${row.id}`)).status).toBe(404)
    workout = (await u.post('/api/workouts').send({ exerciseId: row.id })).body.workout
  })

  it('GET returns the workout with its exercises and sets', async () => {
    const res = await u.get('/api/workouts')
    expect(res.body.workout.id).toBe(workout.id)
    expect(allSets(res.body.workout)).toHaveLength(8) // 4 bench + 4 rows
  })

  it('start marks it in progress and records the start time', async () => {
    const res = await u.patch('/api/workouts').send({ workoutId: workout.id, action: 'start' })
    expect(res.status).toBe(200)
    expect(res.body.workout.status).toBe('in_progress')
    expect(res.body.workout.startedAt).toBeTruthy()
  })

  it('ticks and unticks a set', async () => {
    const set = workout.exercises[0].sets[0]
    const tick = await u.patch('/api/sets').send({ setId: set.id, completed: true })
    expect(tick.status).toBe(200)
    expect(tick.body.set).toEqual({ id: set.id, setNumber: 1, completed: true })
    expect(tick.body.workoutId).toBe(workout.id)

    const untick = await u.patch('/api/sets').send({ setId: set.id, completed: false })
    expect(untick.body.set.completed).toBe(false)
    const fresh = (await u.get('/api/workouts')).body.workout
    expect(fresh.exercises[0].sets[0].completed).toBe(false)
  })

  it('validates set updates', async () => {
    const set = workout.exercises[0].sets[0]
    expect((await u.patch('/api/sets').send({ setId: set.id, completed: 'yes' })).status).toBe(400)
    expect((await u.patch('/api/sets').send({ completed: true })).status).toBe(400)
    expect((await u.patch('/api/sets').send({ setId: 99999999, completed: true })).status).toBe(404)
  })

  it('reset unticks every set and goes back to planned', async () => {
    await u.patch('/api/sets').send({ setId: workout.exercises[0].sets[1].id, completed: true })
    const res = await u.patch('/api/workouts').send({ workoutId: workout.id, action: 'reset' })
    expect(res.status).toBe(200)
    expect(res.body.workout.status).toBe('planned')
    expect(res.body.workout.startedAt).toBeNull()
    expect(allSets(res.body.workout).some((s) => s.completed)).toBe(false)
  })

  it('ticking the first set starts the workout automatically', async () => {
    const res = await u.patch('/api/sets').send({ setId: workout.exercises[0].sets[0].id, completed: true })
    expect(res.body.startedAt).toBeTruthy()
    expect((await u.get('/api/workouts')).body.workout.status).toBe('in_progress')
  })

  it('completes the workout after every set is ticked and saves a duration', async () => {
    for (const s of allSets(workout)) await u.patch('/api/sets').send({ setId: s.id, completed: true })
    const res = await u.patch('/api/workouts').send({ workoutId: workout.id, action: 'finish' })
    expect(res.status).toBe(200)
    expect(res.body.workout.status).toBe('completed')
    expect(res.body.workout.durationMinutes).toBeGreaterThanOrEqual(1)
    expect(res.body.workout.completedAt).toBeTruthy()
    expect(allSets(res.body.workout).every((s) => s.completed)).toBe(true)
  })

  it('locks a finished workout: sets and reset are refused, finishing again is harmless', async () => {
    const set = workout.exercises[0].sets[0]
    expect((await u.patch('/api/sets').send({ setId: set.id, completed: false })).status).toBe(409)
    expect((await u.patch('/api/workouts').send({ workoutId: workout.id, action: 'reset' })).status).toBe(409)
    expect((await u.patch('/api/workouts').send({ workoutId: workout.id, action: 'start' })).status).toBe(409)
    const again = await u.patch('/api/workouts').send({ workoutId: workout.id, action: 'finish' })
    expect(again.status).toBe(200)
    expect(again.body.workout.status).toBe('completed')
  })

  it('"go again" copies the exercises into a fresh planned workout', async () => {
    const res = await u.patch('/api/workouts').send({ workoutId: workout.id, action: 'repeat' })
    expect(res.status).toBe(201)
    const copy = res.body.workout
    expect(copy.id).not.toBe(workout.id)
    expect(copy.status).toBe('planned')
    expect(copy.exercises.map((e) => e.exerciseId)).toEqual([bench.id, row.id])
    expect(allSets(copy).every((s) => !s.completed)).toBe(true)
    expect((await u.get('/api/workouts')).body.workout.id).toBe(copy.id) // open workout comes first

    // Removing every exercise deletes the empty copy; today's finished workout shows again.
    await u.delete(`/api/workouts?exerciseId=${bench.id}`)
    const last = await u.delete(`/api/workouts?exerciseId=${row.id}`)
    expect(last.body.workout.id).toBe(workout.id)
    expect(last.body.workout.status).toBe('completed')
  })

  it('rejects unknown actions and bad ids', async () => {
    expect((await u.patch('/api/workouts').send({ workoutId: workout.id, action: 'explode' })).status).toBe(400)
    expect((await u.patch('/api/workouts').send({ workoutId: 'x', action: 'start' })).status).toBe(400)
    expect((await u.patch('/api/workouts').send({ workoutId: 99999999, action: 'start' })).status).toBe(404)
    expect((await u.put('/api/workouts').send({})).status).toBe(405)
  })
})
