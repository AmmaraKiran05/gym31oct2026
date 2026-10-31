import { afterAll, describe, expect, it } from 'vitest'
import { addCompletedWorkout, cleanup, newUser, q, todayUTC } from '../helpers.js'

afterAll(cleanup)

// Each scenario gets its own user; workouts are inserted with fake dates relative to today (UTC).
async function dashboardWith(daysAgoList, goals = {}) {
  const u = await newUser(goals)
  for (const d of daysAgoList) await addCompletedWorkout(u.user.id, d.daysAgo ?? d, d.minutes ?? 30)
  const res = await u.get('/api/dashboard')
  expect(res.status).toBe(200)
  return { u, body: res.body }
}

describe('GET /api/dashboard — streak (fake dates)', () => {
  it('no workouts -> streak 0', async () => {
    const { body } = await dashboardWith([])
    expect(body.streak).toEqual({ current: 0, best: 0, trainedToday: false })
  })

  it('3 days in a row ending today -> streak 3', async () => {
    const { body } = await dashboardWith([0, 1, 2])
    expect(body.streak).toEqual({ current: 3, best: 3, trainedToday: true })
  })

  it('a missed day resets the streak', async () => {
    // today, (missed yesterday), 2 and 3 days ago
    const { body } = await dashboardWith([0, 2, 3])
    expect(body.streak.current).toBe(1)
    expect(body.streak.best).toBe(2)
  })

  it('missing both today and yesterday -> streak 0 (best kept)', async () => {
    const { body } = await dashboardWith([2, 3, 4])
    expect(body.streak.current).toBe(0)
    expect(body.streak.best).toBe(3)
  })

  it('a workout today plus yesterday -> streak 2', async () => {
    const { body } = await dashboardWith([0, 1])
    expect(body.streak).toEqual({ current: 2, best: 2, trainedToday: true })
  })

  it('yesterday only keeps the streak alive until midnight', async () => {
    const { body } = await dashboardWith([1, 2])
    expect(body.streak).toEqual({ current: 2, best: 2, trainedToday: false })
  })

  it('two workouts on the same day count as one streak day', async () => {
    const { body } = await dashboardWith([0, 0, 1])
    expect(body.streak.current).toBe(2)
  })

  it('planned and in-progress workouts do not count', async () => {
    const u = await newUser()
    await q(
      `INSERT INTO workouts (user_id, name, workout_date, status, duration_minutes)
       VALUES ($1, 'Planned', (now() AT TIME ZONE 'UTC')::date, 'planned', 50),
              ($1, 'Going', (now() AT TIME ZONE 'UTC')::date, 'in_progress', 50)`,
      [u.user.id],
    )
    const body = (await u.get('/api/dashboard')).body
    expect(body.streak.current).toBe(0)
    expect(body.activityTotal).toBe(0)
    expect(body.week.workouts).toBe(0)
  })
})

describe('GET /api/dashboard — weekly chart and rings', () => {
  it('chart has exactly the last 7 days, oldest first, ending today', async () => {
    const today = await todayUTC()
    const { body } = await dashboardWith([{ daysAgo: 0, minutes: 45 }, { daysAgo: 6, minutes: 20 }, { daysAgo: 7, minutes: 99 }])
    expect(body.today).toBe(today)
    expect(body.activity).toHaveLength(7)
    expect(body.activity.at(-1)).toMatchObject({ date: today, minutes: 45, workouts: 1 })
    expect(body.activity[0].minutes).toBe(20) // 6 days ago is the first bar; 7 days ago is outside
    const dates = body.activity.map((d) => Date.parse(d.date))
    dates.slice(1).forEach((d, i) => expect(d - dates[i]).toBe(86400000))
    expect(body.activityTotal).toBe(65)
    for (const d of body.activity) expect(d.day).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/)
  })

  it('compares with the previous 7 days', async () => {
    const { body } = await dashboardWith([{ daysAgo: 0, minutes: 60 }, { daysAgo: 8, minutes: 40 }])
    expect(body.activityChangePct).toBe(50)
  })

  it('no previous week -> change is null (not Infinity/NaN)', async () => {
    const { body } = await dashboardWith([{ daysAgo: 0, minutes: 60 }])
    expect(body.activityChangePct).toBeNull()
  })

  it('ring numbers: workouts, minutes and goals hit for this week', async () => {
    const { body } = await dashboardWith([{ daysAgo: 0, minutes: 25 }], { weeklyGoalWorkouts: 3, weeklyGoalMinutes: 90 })
    expect(body.week).toEqual({ workouts: 1, minutes: 25, goalWorkouts: 3, goalMinutes: 90, goalsHit: 0, goalsTotal: 2 })
  })

  it('going over a goal is reported as raw numbers and counts as a goal hit', async () => {
    const list = Array.from({ length: 5 }, () => ({ daysAgo: 0, minutes: 40 }))
    const { body } = await dashboardWith(list, { weeklyGoalWorkouts: 3, weeklyGoalMinutes: 90 })
    expect(body.week).toMatchObject({ workouts: 5, minutes: 200, goalsHit: 2, goalsTotal: 2 })
    expect(body.activity.at(-1)).toMatchObject({ minutes: 200, workouts: 5 })
  })

  it("includes today's workout and the next class", async () => {
    const { body } = await dashboardWith([])
    expect(body.workout).toBeNull()
    if (body.nextClass) {
      expect(body.nextClass).toMatchObject({ title: expect.any(String), coach: expect.any(String) })
      expect(Date.parse(body.nextClass.startTime)).toBeGreaterThan(Date.now())
    }
  })
})
