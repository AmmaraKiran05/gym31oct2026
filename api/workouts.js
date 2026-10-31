import { db } from './_lib/db.js'
import { HttpError, body, intParam, route, timeZone } from './_lib/http.js'
import { requireUser } from './_lib/auth.js'
import { getTodayWorkout, loadWorkout, renameFromGroups } from './_lib/workouts.js'

async function openWorkoutToday(userId, tz) {
  const [w] = await db()`
    SELECT id FROM workouts
    WHERE user_id = ${userId} AND status <> 'completed' AND workout_date = (now() AT TIME ZONE ${tz})::date
    ORDER BY id DESC LIMIT 1`
  return w ?? null
}

async function ownedWorkout(userId, workoutId) {
  const [w] = await db()`SELECT id, status FROM workouts WHERE id = ${workoutId} AND user_id = ${userId}`
  if (!w) throw new HttpError(404, 'We couldn’t find that workout.')
  return w
}

async function workoutById(id) {
  const [row] = await db()`
    SELECT id, name, workout_date::text AS workout_date, status, duration_minutes, started_at, completed_at
    FROM workouts WHERE id = ${id}`
  return loadWorkout(row)
}

export default route({
  // Today's workout with exercises and sets (or null).
  async GET(req, res) {
    const user = await requireUser(req)
    res.status(200).json({ workout: await getTodayWorkout(user.id, timeZone(req)) })
  },

  // Add an exercise to today's open workout, creating the workout if needed.
  async POST(req, res) {
    const user = await requireUser(req)
    const tz = timeZone(req)
    const sql = db()
    const exerciseId = intParam(body(req).exerciseId, 'exerciseId')

    const [exercise] = await sql`SELECT id, name, sets FROM exercises WHERE id = ${exerciseId}`
    if (!exercise) throw new HttpError(404, 'That exercise no longer exists.')

    let workout = await openWorkoutToday(user.id, tz)
    if (!workout) {
      ;[workout] = await sql`
        INSERT INTO workouts (user_id, name, workout_date, status)
        VALUES (${user.id}, 'Today’s Workout', (now() AT TIME ZONE ${tz})::date, 'planned')
        RETURNING id`
    }

    const [we] = await sql`
      INSERT INTO workout_exercises (workout_id, exercise_id, order_index)
      SELECT ${workout.id}, ${exercise.id}, COALESCE(max(order_index) + 1, 0)
      FROM workout_exercises WHERE workout_id = ${workout.id}
      ON CONFLICT (workout_id, exercise_id) DO NOTHING
      RETURNING id`
    if (!we) throw new HttpError(409, `${exercise.name} is already in today’s workout.`)

    await sql`
      INSERT INTO workout_sets (workout_exercise_id, set_number)
      SELECT ${we.id}, n FROM generate_series(1, ${exercise.sets}::int) AS n
      ON CONFLICT DO NOTHING`
    await renameFromGroups(workout.id)

    res.status(201).json({ workout: await workoutById(workout.id) })
  },

  // Remove an exercise from today's open workout: DELETE /api/workouts?exerciseId=12
  async DELETE(req, res) {
    const user = await requireUser(req)
    const tz = timeZone(req)
    const sql = db()
    const exerciseId = intParam(req.query?.exerciseId, 'exerciseId')

    const workout = await openWorkoutToday(user.id, tz)
    if (!workout) throw new HttpError(404, 'There’s no open workout today to remove that from.')

    const removed = await sql`
      DELETE FROM workout_exercises WHERE workout_id = ${workout.id} AND exercise_id = ${exerciseId} RETURNING id`
    if (!removed.length) throw new HttpError(404, 'That exercise isn’t in today’s workout.')

    const [{ remaining }] = await sql`SELECT count(*)::int AS remaining FROM workout_exercises WHERE workout_id = ${workout.id}`
    if (remaining === 0) await sql`DELETE FROM workouts WHERE id = ${workout.id} AND user_id = ${user.id}`
    else await renameFromGroups(workout.id)

    res.status(200).json({ workout: await getTodayWorkout(user.id, tz) })
  },

  // { workoutId, action: 'start' | 'finish' | 'reset' | 'repeat' }
  async PATCH(req, res) {
    const user = await requireUser(req)
    const tz = timeZone(req)
    const sql = db()
    const b = body(req)
    const workoutId = intParam(b.workoutId, 'workoutId')
    const current = await ownedWorkout(user.id, workoutId)

    switch (b.action) {
      case 'start':
        if (current.status === 'completed') throw new HttpError(409, 'This workout is already finished.')
        await sql`
          UPDATE workouts SET status = 'in_progress', started_at = COALESCE(started_at, now())
          WHERE id = ${workoutId} AND user_id = ${user.id}`
        break

      case 'finish':
        // Idempotent: finishing twice keeps the first completion.
        await sql`
          UPDATE workouts
          SET status = 'completed',
              completed_at = now(),
              started_at = COALESCE(started_at, now()),
              duration_minutes = GREATEST(1, ROUND(EXTRACT(EPOCH FROM now() - COALESCE(started_at, now())) / 60))::int
          WHERE id = ${workoutId} AND user_id = ${user.id} AND status <> 'completed'`
        break

      case 'reset':
        if (current.status === 'completed') throw new HttpError(409, 'Finished workouts can’t be reset. Try “Go again” instead.')
        await sql`
          UPDATE workout_sets ws SET completed = false, completed_at = NULL
          FROM workout_exercises we
          WHERE we.id = ws.workout_exercise_id AND we.workout_id = ${workoutId}`
        await sql`
          UPDATE workouts SET status = 'planned', started_at = NULL
          WHERE id = ${workoutId} AND user_id = ${user.id}`
        break

      case 'repeat': {
        const open = await openWorkoutToday(user.id, tz)
        if (open) return res.status(200).json({ workout: await workoutById(open.id) })
        const [copy] = await sql`
          INSERT INTO workouts (user_id, name, workout_date, status)
          SELECT user_id, name, (now() AT TIME ZONE ${tz})::date, 'planned'
          FROM workouts WHERE id = ${workoutId} AND user_id = ${user.id}
          RETURNING id`
        await sql`
          INSERT INTO workout_exercises (workout_id, exercise_id, order_index)
          SELECT ${copy.id}, exercise_id, order_index FROM workout_exercises WHERE workout_id = ${workoutId}`
        await sql`
          INSERT INTO workout_sets (workout_exercise_id, set_number)
          SELECT we.id, n
          FROM workout_exercises we
          JOIN exercises e ON e.id = we.exercise_id
          CROSS JOIN LATERAL generate_series(1, e.sets) AS n
          WHERE we.workout_id = ${copy.id}`
        return res.status(201).json({ workout: await workoutById(copy.id) })
      }

      default:
        throw new HttpError(400, 'action must be one of: start, finish, reset, repeat.')
    }

    res.status(200).json({ workout: await workoutById(workoutId) })
  },
})
