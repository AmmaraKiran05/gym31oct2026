import { db } from './_lib/db.js'
import { HttpError, route } from './_lib/http.js'
import { requireUser } from './_lib/auth.js'

const GROUPS = ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']

export default route({
  async GET(req, res) {
    await requireUser(req)
    const group = req.query?.muscle_group
    if (group && !GROUPS.includes(group)) throw new HttpError(400, `muscle_group must be one of ${GROUPS.join(', ')}.`)

    const rows = group
      ? await db()`SELECT * FROM exercises WHERE muscle_group = ${group} ORDER BY name`
      : await db()`SELECT * FROM exercises
                   ORDER BY array_position(${GROUPS}::text[], muscle_group), name`

    res.status(200).json({
      exercises: rows.map((e) => ({
        id: e.id,
        name: e.name,
        muscleGroup: e.muscle_group,
        sets: e.sets,
        reps: e.reps,
        difficulty: e.difficulty,
        restSeconds: e.rest_seconds,
        description: e.description,
      })),
    })
  },
})
