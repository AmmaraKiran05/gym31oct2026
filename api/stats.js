import { db } from './_lib/db.js'
import { route, timeZone } from './_lib/http.js'

// Public platform counters for the landing page (no per-user data).
export default route({
  async GET(req, res) {
    const tz = timeZone(req)
    const [row] = await db()`
      SELECT
        (SELECT count(*)::int FROM users) AS members,
        (SELECT count(*)::int FROM workouts WHERE status = 'completed') AS workouts_completed,
        (SELECT count(*)::int FROM classes
          WHERE (start_time AT TIME ZONE ${tz}) >= date_trunc('week', now() AT TIME ZONE ${tz})
            AND (start_time AT TIME ZONE ${tz}) <  date_trunc('week', now() AT TIME ZONE ${tz}) + interval '7 days'
        ) AS classes_this_week`
    res.setHeader('Cache-Control', 'public, max-age=30')
    res.status(200).json({
      members: row.members,
      workoutsCompleted: row.workouts_completed,
      classesThisWeek: row.classes_this_week,
    })
  },
})
