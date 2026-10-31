// Pure date math for the dashboard, kept separate so it can be tested with fake dates.

const DAY_MS = 86400000
const toDay = (iso) => Date.parse(`${iso}T00:00:00Z`)
const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10)

// dates: 'YYYY-MM-DD' strings with a completed workout (any order, duplicates ok); today: 'YYYY-MM-DD'.
// current = consecutive days ending today, or ending yesterday if today isn't done yet
//           (so the streak stays alive until midnight); best = longest run ever.
export function computeStreaks(dates, today) {
  const set = new Set(dates.filter(Boolean))
  let cursor = toDay(today)
  if (!set.has(today)) cursor -= DAY_MS
  let current = 0
  while (set.has(isoDay(cursor))) {
    current++
    cursor -= DAY_MS
  }

  let best = 0
  let run = 0
  let prev = null
  for (const d of [...set].sort()) {
    run = prev !== null && toDay(d) - toDay(prev) === DAY_MS ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return { current, best: Math.max(best, current) }
}

export function goalsHit({ workouts, minutes, goalWorkouts, goalMinutes }) {
  return (workouts >= goalWorkouts ? 1 : 0) + (minutes >= goalMinutes ? 1 : 0)
}
