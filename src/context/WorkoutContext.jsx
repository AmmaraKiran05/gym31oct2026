import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.js'
import { useAuth } from './AuthContext.jsx'

const WorkoutContext = createContext(null)

// Holds the logged-in user's workout for today, loaded from /api/workouts.
export function WorkoutProvider({ children }) {
  const { user } = useAuth()
  const [workout, setWorkout] = useState(undefined) // undefined = not loaded yet, null = none today
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(() => new Set()) // exercise ids being added/removed

  const load = useCallback(async () => {
    try {
      const data = await api('/workouts')
      setWorkout(data.workout)
      setError(null)
    } catch (err) {
      setError(err)
    }
  }, [])

  useEffect(() => {
    if (user) load()
    else {
      setWorkout(undefined)
      setError(null)
    }
  }, [user?.id, load]) // eslint-disable-line react-hooks/exhaustive-deps

  const withPending = useCallback(async (id, fn) => {
    setPending((p) => new Set(p).add(id))
    try {
      return await fn()
    } finally {
      setPending((p) => {
        const n = new Set(p)
        n.delete(id)
        return n
      })
    }
  }, [])

  const addExercise = useCallback(
    (exerciseId) =>
      withPending(exerciseId, async () => {
        const data = await api('/workouts', { method: 'POST', body: { exerciseId } })
        setWorkout(data.workout)
        return data.workout
      }),
    [withPending],
  )

  const removeExercise = useCallback(
    (exerciseId) =>
      withPending(exerciseId, async () => {
        const data = await api(`/workouts?exerciseId=${exerciseId}`, { method: 'DELETE' })
        setWorkout(data.workout)
        return data.workout
      }),
    [withPending],
  )

  const open = workout && workout.status !== 'completed' ? workout : null
  const planIds = useMemo(() => new Set(open?.exercises.map((e) => e.exerciseId) ?? []), [open])

  const value = { workout, setWorkout, error, load, addExercise, removeExercise, planIds, pending, openWorkout: open }
  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>
}

export const useWorkout = () => useContext(WorkoutContext)

// ~45 s of work per set plus the prescribed rest.
export const estimateMinutes = (exercises = []) =>
  Math.max(1, Math.round(exercises.reduce((n, e) => n + e.sets.length * (45 + e.restSeconds), 0) / 60))
