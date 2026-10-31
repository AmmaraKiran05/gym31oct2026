import { describe, expect, it } from 'vitest'
import { computeStreaks, goalsHit } from '../../api/_lib/stats.js'
import { percentOfGoal, ringFraction, safeNumber } from '../../src/lib/progress.js'
import { passwordProblem } from '../../api/_lib/validate.js'

const TODAY = '2026-03-02'

describe('computeStreaks (fake dates)', () => {
  it('no workouts -> 0', () => {
    expect(computeStreaks([], TODAY)).toEqual({ current: 0, best: 0 })
  })

  it('3 days in a row ending today -> 3 (across a month boundary)', () => {
    expect(computeStreaks(['2026-02-28', '2026-03-01', '2026-03-02'], TODAY)).toEqual({ current: 3, best: 3 })
  })

  it('a missed day resets the current streak', () => {
    expect(computeStreaks(['2026-02-26', '2026-02-27', '2026-02-28', '2026-03-02'], TODAY)).toEqual({ current: 1, best: 3 })
  })

  it('today plus yesterday -> 2', () => {
    expect(computeStreaks(['2026-03-01', '2026-03-02'], TODAY).current).toBe(2)
  })

  it('yesterday but not today yet -> still alive', () => {
    expect(computeStreaks(['2026-02-28', '2026-03-01'], TODAY).current).toBe(2)
  })

  it('last workout two days ago -> 0', () => {
    expect(computeStreaks(['2026-02-28'], TODAY).current).toBe(0)
  })

  it('ignores duplicates, order and empty values', () => {
    expect(computeStreaks(['2026-03-02', null, '2026-03-01', '2026-03-02', ''], TODAY)).toEqual({ current: 2, best: 2 })
  })

  it('handles leap years and year boundaries', () => {
    expect(computeStreaks(['2028-02-28', '2028-02-29', '2028-03-01'], '2028-03-01').current).toBe(3)
    expect(computeStreaks(['2025-12-31', '2026-01-01'], '2026-01-01').current).toBe(2)
  })
})

describe('goalsHit', () => {
  it('counts each weekly goal reached', () => {
    expect(goalsHit({ workouts: 0, minutes: 0, goalWorkouts: 3, goalMinutes: 90 })).toBe(0)
    expect(goalsHit({ workouts: 3, minutes: 10, goalWorkouts: 3, goalMinutes: 90 })).toBe(1)
    expect(goalsHit({ workouts: 9, minutes: 500, goalWorkouts: 3, goalMinutes: 90 })).toBe(2)
  })
})

describe('progress rings never exceed 100% or show NaN', () => {
  it.each([
    [0, 5, 0],
    [2, 5, 0.4],
    [5, 5, 1],
    [12, 5, 1],
    [5, 0, 0],
    [5, -3, 0],
    [-4, 5, 0],
    [NaN, 5, 0],
    [5, NaN, 0],
    [undefined, undefined, 0],
    [null, 10, 0],
    ['3', '6', 0.5],
    [Infinity, 5, 0],
  ])('ringFraction(%s, %s) = %s', (value, goal, expected) => {
    const f = ringFraction(value, goal)
    expect(f).toBe(expected)
    expect(Number.isFinite(f)).toBe(true)
    expect(f).toBeGreaterThanOrEqual(0)
    expect(f).toBeLessThanOrEqual(1)
  })

  it('percentOfGoal is a whole number from 0 to 100', () => {
    expect(percentOfGoal(200, 90)).toBe(100)
    expect(percentOfGoal(1, 3)).toBe(33)
    expect(percentOfGoal(0, 0)).toBe(0)
    expect(percentOfGoal(NaN, 3)).toBe(0)
  })

  it('safeNumber turns junk into 0', () => {
    expect(safeNumber('12')).toBe(12)
    expect(safeNumber(undefined)).toBe(0)
    expect(safeNumber(NaN)).toBe(0)
  })
})

describe('password rules', () => {
  it('accepts a decent password and the documented test password', () => {
    expect(passwordProblem('Test1234!')).toBeNull()
    expect(passwordProblem('correct horse 9')).toBeNull()
  })
})
