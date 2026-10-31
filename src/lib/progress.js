// Fraction of a goal for progress rings: always a finite number from 0 to 1 (never NaN, never over 100%).
export function ringFraction(value, goal) {
  const v = Number(value)
  const g = Number(goal)
  if (!Number.isFinite(v) || !Number.isFinite(g) || g <= 0 || v <= 0) return 0
  return Math.min(v / g, 1)
}

// Whole-number percentage for labels like "80% of goal".
export const percentOfGoal = (value, goal) => Math.round(ringFraction(value, goal) * 100)

// Safe number for animated counters.
export const safeNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0)
