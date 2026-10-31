import { db } from './_lib/db.js'
import { route, timeZone } from './_lib/http.js'
import { requireUser } from './_lib/auth.js'
import { getTodayWorkout } from './_lib/workouts.js'
import { computeStreaks, goalsHit } from './_lib/stats.js'

export default route({
  async GET(req, res) {
    const user = await requireUser(req)
    const tz = timeZone(req)
    const sql = db()

    const [todayRow] = await sql`SELECT (now() AT TIME ZONE ${tz})::date::text AS today,
                                        date_trunc('week', now() AT TIME ZONE ${tz})::date::text AS week_start`
    const { today, week_start: weekStart } = todayRow

    const [activity, completedDates, week, lastWeek, nextClass, workout] = await Promise.all([
      sql`
        SELECT d::date::text AS date, to_char(d, 'Dy') AS day,
               COALESCE(sum(w.duration_minutes), 0)::int AS minutes,
               count(w.id)::int AS workouts
        FROM generate_series(${today}::date - 6, ${today}::date, interval '1 day') AS d
        LEFT JOIN workouts w
          ON w.user_id = ${user.id} AND w.status = 'completed' AND w.workout_date = d::date
        GROUP BY d ORDER BY d`,
      sql`
        SELECT DISTINCT workout_date::text AS date FROM workouts
        WHERE user_id = ${user.id} AND status = 'completed' AND workout_date > ${today}::date - 730`,
      sql`
        SELECT count(*)::int AS workouts, COALESCE(sum(duration_minutes), 0)::int AS minutes
        FROM workouts
        WHERE user_id = ${user.id} AND status = 'completed'
          AND workout_date BETWEEN ${weekStart}::date AND ${weekStart}::date + 6`,
      sql`
        SELECT COALESCE(sum(duration_minutes), 0)::int AS minutes FROM workouts
        WHERE user_id = ${user.id} AND status = 'completed'
          AND workout_date BETWEEN ${today}::date - 13 AND ${today}::date - 7`,
      sql`
        SELECT id, title, coach_name, start_time, duration_minutes
        FROM classes WHERE start_time > now() ORDER BY start_time LIMIT 1`,
      getTodayWorkout(user.id, tz),
    ])

    const { current, best } = computeStreaks(completedDates.map((r) => r.date), today)
    const goals = { workouts: user.weekly_goal_workouts, minutes: user.weekly_goal_minutes }
    const thisWeek = week[0]
    const last7 = activity.reduce((n, d) => n + d.minutes, 0)
    const prev7 = lastWeek[0].minutes

    res.status(200).json({
      today,
      workout,
      activity,
      activityTotal: last7,
      activityChangePct: prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : null,
      streak: { current, best, trainedToday: completedDates.some((r) => r.date === today) },
      week: {
        workouts: thisWeek.workouts,
        minutes: thisWeek.minutes,
        goalWorkouts: goals.workouts,
        goalMinutes: goals.minutes,
        goalsHit: goalsHit({ workouts: thisWeek.workouts, minutes: thisWeek.minutes, goalWorkouts: goals.workouts, goalMinutes: goals.minutes }),
        goalsTotal: 2,
      },
      nextClass: nextClass[0]
        ? {
            id: nextClass[0].id,
            title: nextClass[0].title,
            coach: nextClass[0].coach_name,
            startTime: nextClass[0].start_time,
            durationMinutes: nextClass[0].duration_minutes,
          }
        : null,
    })
  },
})
