import { db } from './db.js'

// "Today's workout" = the user's most relevant workout dated today in their time zone:
// an open one (planned / in progress) first, otherwise the most recently completed one.
export async function findTodayWorkoutRow(userId, tz) {
  const [row] = await db()`
    SELECT id, name, workout_date::text AS workout_date, status, duration_minutes, started_at, completed_at
    FROM workouts
    WHERE user_id = ${userId} AND workout_date = (now() AT TIME ZONE ${tz})::date
    ORDER BY (status = 'completed'), id DESC
    LIMIT 1`
  return row ?? null
}

export async function loadWorkout(workoutRow) {
  if (!workoutRow) return null
  const rows = await db()`
    SELECT we.id AS workout_exercise_id, we.order_index,
           e.id AS exercise_id, e.name, e.muscle_group, e.reps, e.difficulty, e.rest_seconds, e.description,
           COALESCE(
             json_agg(json_build_object('id', ws.id, 'setNumber', ws.set_number, 'completed', ws.completed)
                      ORDER BY ws.set_number) FILTER (WHERE ws.id IS NOT NULL),
             '[]'::json) AS sets
    FROM workout_exercises we
    JOIN exercises e ON e.id = we.exercise_id
    LEFT JOIN workout_sets ws ON ws.workout_exercise_id = we.id
    WHERE we.workout_id = ${workoutRow.id}
    GROUP BY we.id, e.id
    ORDER BY we.order_index, we.id`

  return {
    id: workoutRow.id,
    name: workoutRow.name,
    date: workoutRow.workout_date,
    status: workoutRow.status,
    durationMinutes: workoutRow.duration_minutes,
    startedAt: workoutRow.started_at,
    completedAt: workoutRow.completed_at,
    exercises: rows.map((r) => ({
      workoutExerciseId: r.workout_exercise_id,
      exerciseId: r.exercise_id,
      name: r.name,
      muscleGroup: r.muscle_group,
      reps: r.reps,
      difficulty: r.difficulty,
      restSeconds: r.rest_seconds,
      description: r.description,
      sets: r.sets,
    })),
  }
}

export async function getTodayWorkout(userId, tz) {
  return loadWorkout(await findTodayWorkoutRow(userId, tz))
}

// Name a session after its muscle groups, e.g. "Chest & Back Session".
export async function renameFromGroups(workoutId) {
  const groups = await db()`
    SELECT e.muscle_group
    FROM workout_exercises we JOIN exercises e ON e.id = we.exercise_id
    WHERE we.workout_id = ${workoutId}
    GROUP BY e.muscle_group
    ORDER BY min(we.order_index)`
  const names = groups.map((g) => g.muscle_group)
  const name =
    names.length === 0 ? 'Today’s Workout' : names.length > 2 ? 'Full Body Session' : `${names.join(' & ')} Session`
  await db()`UPDATE workouts SET name = ${name} WHERE id = ${workoutId}`
}
