import { db } from './_lib/db.js'
import { HttpError, body, intParam, route } from './_lib/http.js'
import { requireUser } from './_lib/auth.js'

export default route({
  // { setId, completed } — tick or untick one set. Ticking the first set starts the workout clock.
  async PATCH(req, res) {
    const user = await requireUser(req)
    const b = body(req)
    const setId = intParam(b.setId, 'setId')
    if (typeof b.completed !== 'boolean') throw new HttpError(400, 'completed must be true or false.')
    const completed = b.completed

    const rows = await db()`
      WITH target AS (
        SELECT ws.id, w.id AS workout_id
        FROM workout_sets ws
        JOIN workout_exercises we ON we.id = ws.workout_exercise_id
        JOIN workouts w ON w.id = we.workout_id
        WHERE ws.id = ${setId} AND w.user_id = ${user.id} AND w.status <> 'completed'
      ),
      updated AS (
        UPDATE workout_sets
        SET completed = ${completed}::boolean,
            completed_at = CASE WHEN ${completed}::boolean THEN now() ELSE NULL END
        WHERE id IN (SELECT id FROM target)
        RETURNING id, set_number, completed
      ),
      started AS (
        UPDATE workouts
        SET status = 'in_progress', started_at = COALESCE(started_at, now())
        WHERE id IN (SELECT workout_id FROM target) AND status = 'planned' AND ${completed}::boolean
        RETURNING id, started_at
      )
      SELECT u.id, u.set_number, u.completed, t.workout_id,
             (SELECT started_at FROM started) AS started_at
      FROM updated u CROSS JOIN target t`

    if (!rows.length) {
      const [owned] = await db()`
        SELECT w.status FROM workout_sets ws
        JOIN workout_exercises we ON we.id = ws.workout_exercise_id
        JOIN workouts w ON w.id = we.workout_id
        WHERE ws.id = ${setId} AND w.user_id = ${user.id}`
      if (owned) throw new HttpError(409, 'This workout is already finished, so its sets are locked.')
      throw new HttpError(404, 'We couldn’t find that set.')
    }

    const r = rows[0]
    res.status(200).json({
      set: { id: r.id, setNumber: r.set_number, completed: r.completed },
      workoutId: r.workout_id,
      startedAt: r.started_at,
    })
  },
})
