import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, m } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Check, Pause, Play, RotateCcw, SkipForward, Trophy, Dumbbell, Timer, ListPlus, X, CheckCircle2, Layers } from 'lucide-react'
import { ConnectionError, EmptyState, GlassCard, Page, PageHeader, Skeleton, SkeletonCard, Spinner, fadeUp } from '../components/ui.jsx'
import { useWorkout } from '../context/WorkoutContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { api } from '../lib/api.js'

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`

function celebrate() {
  const colors = ['#C6FF3D', '#22E4F5', '#5CF2A0', '#FFFFFF']
  const end = Date.now() + 1800
  confetti({ particleCount: 140, spread: 100, startVelocity: 45, origin: { y: 0.6 }, colors })
  ;(function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors })
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}

function RestTimer({ rest, onPause, onAdjust, onSkip, nextLabel }) {
  const size = 260
  const stroke = 14
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = rest.total ? rest.remaining / rest.total : 0
  const active = rest.total > 0 && rest.remaining > 0

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 'min(260px, 70vw)', aspectRatio: '1' }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
          <defs>
            <linearGradient id="restGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" style={{ stopColor: 'var(--g1)' }} />
              <stop offset="1" style={{ stopColor: 'var(--g2)' }} />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-fg/[0.07]" />
          <m.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#restGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - pct) }}
            transition={{ duration: rest.running ? 1 : 0.4, ease: 'linear' }}
            style={{ filter: 'drop-shadow(0 0 10px rgb(var(--glow-a) / 0.5))' }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="label">{active ? 'Rest' : 'Ready'}</p>
            <AnimatePresence mode="popLayout" initial={false}>
              <m.p
                key={active ? rest.remaining : 'go'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="font-display text-6xl font-bold tabular-nums sm:text-7xl"
              >
                {active ? fmt(rest.remaining) : 'GO'}
              </m.p>
            </AnimatePresence>
            <p className="mt-1 max-w-[11rem] truncate text-sm text-muted">{active ? `Next: ${nextLabel}` : 'Tick a set to start rest'}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button className="btn-ghost !h-12 !w-14 !rounded-2xl !p-0 text-sm" onClick={() => onAdjust(-15)} disabled={!active} aria-label="Remove 15 seconds">
          −15
        </button>
        <button
          className="btn-primary !h-16 !w-16 !rounded-full !p-0"
          onClick={onPause}
          disabled={!active}
          aria-label={rest.running ? 'Pause rest timer' : 'Resume rest timer'}
        >
          {rest.running ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current" />}
        </button>
        <button className="btn-ghost !h-12 !w-14 !rounded-2xl !p-0 text-sm" onClick={() => onAdjust(15)} disabled={!active} aria-label="Add 15 seconds">
          +15
        </button>
      </div>
      <button className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg disabled:opacity-40" onClick={onSkip} disabled={!active}>
        <SkipForward className="h-4 w-4" /> Skip rest
      </button>
    </div>
  )
}

function CompleteModal({ workout, onClose, onAgain, againBusy }) {
  const sets = workout.exercises.reduce((n, e) => n + e.sets.length, 0)
  return (
    <m.div
      className="fixed inset-0 z-[90] grid place-items-center bg-ink-950/70 p-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="complete-title"
    >
      <m.div
        initial={{ scale: 0.8, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        className="glass relative w-full max-w-md p-8 text-center"
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-muted hover:text-fg" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        <m.div
          initial={{ rotate: -30, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.3 }}
          className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-pulse text-ink-950 shadow-glow"
        >
          <Trophy className="h-10 w-10" />
        </m.div>
        <h2 id="complete-title" className="mt-6 text-3xl font-bold">
          Workout <span className="text-pulse">crushed!</span>
        </h2>
        <p className="mt-2 text-muted">Saved to your history. Your future self says thanks.</p>
        <div className="mt-6 grid grid-cols-3 gap-2">
          {[
            { icon: Timer, label: 'Minutes', value: workout.durationMinutes ?? '—' },
            { icon: Layers, label: 'Sets', value: sets },
            { icon: Dumbbell, label: 'Exercises', value: workout.exercises.length },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl bg-fg/[0.05] py-3">
              <Icon className="mx-auto h-4 w-4 text-accent" />
              <p className="mt-1 font-display text-xl font-bold">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button className="btn-ghost flex-1" onClick={onAgain} disabled={againBusy}>
            {againBusy ? <Spinner /> : <RotateCcw className="h-4 w-4" />} Go again
          </button>
          <button className="btn-primary flex-1" onClick={onClose}>
            Back to dashboard
          </button>
        </div>
      </m.div>
    </m.div>
  )
}

function LiveSkeleton() {
  return (
    <Page>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-10 w-64 max-w-full" />
      <Skeleton className="mb-6 mt-8 h-2.5 !rounded-full" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="glass grid place-items-center p-8">
          <Skeleton className="aspect-square w-[min(260px,70vw)] !rounded-full" />
        </div>
        <div className="space-y-3">
          <SkeletonCard lines={1} />
          <SkeletonCard lines={1} />
          <SkeletonCard lines={1} />
        </div>
      </div>
    </Page>
  )
}

export default function LiveWorkout() {
  const { workout, setWorkout, error, load } = useWorkout()
  const toast = useToast()
  const navigate = useNavigate()

  const [rest, setRest] = useState({ remaining: 0, total: 0, running: false })
  const [now, setNow] = useState(Date.now())
  const [phase, setPhase] = useState('idle') // idle | finishing | finish-failed | celebrating
  const [busy, setBusy] = useState(null) // 'reset' | 'again'
  const inflight = useRef(new Set())
  const workoutRef = useRef(workout)
  workoutRef.current = workout
  const restStartedRef = useRef(false)

  // Always show fresh data when entering Live mode.
  useEffect(() => {
    load()
  }, [load])

  const exercises = workout?.exercises ?? []
  const totalSets = exercises.reduce((n, e) => n + e.sets.length, 0)
  const doneSets = exercises.reduce((n, e) => n + e.sets.filter((s) => s.completed).length, 0)
  const pct = totalSets ? doneSets / totalSets : 0
  const completed = workout?.status === 'completed'

  const currentIdx = useMemo(() => {
    const i = exercises.findIndex((e) => e.sets.some((s) => !s.completed))
    return i === -1 ? exercises.length - 1 : i
  }, [exercises])
  const current = exercises[currentIdx]

  // Elapsed clock comes from the server's started_at, so it survives a refresh.
  const startedAt = workout?.startedAt ? new Date(workout.startedAt).getTime() : null
  useEffect(() => {
    if (!startedAt || completed) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [startedAt, completed])
  const elapsed = startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0

  // Rest countdown
  useEffect(() => {
    if (!rest.running) return
    const t = setInterval(() => {
      setRest((r) => (r.remaining <= 1 ? { ...r, remaining: 0, running: false } : { ...r, remaining: r.remaining - 1 }))
    }, 1000)
    return () => clearInterval(t)
  }, [rest.running])

  useEffect(() => {
    if (rest.total > 0 && rest.remaining === 0 && restStartedRef.current && !completed) {
      restStartedRef.current = false
      toast({ type: 'info', title: 'Rest’s over 💪', message: 'Time for your next set.' })
      try {
        navigator.vibrate?.(200)
      } catch {
        /* unsupported */
      }
    }
  }, [rest.remaining]) // eslint-disable-line react-hooks/exhaustive-deps

  const patchSet = (workoutExerciseId, setId, value) =>
    setWorkout((w) =>
      w && {
        ...w,
        exercises: w.exercises.map((e) =>
          e.workoutExerciseId === workoutExerciseId
            ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, completed: value } : s)) }
            : e,
        ),
      },
    )

  const toggleSet = (ex, set) => {
    if (completed || phase === 'finishing') return
    const next = !set.completed

    // Optimistic: update the UI now, save in the background, roll back on failure.
    patchSet(ex.workoutExerciseId, set.id, next)
    if (next && !workout.startedAt) {
      setWorkout((w) => w && { ...w, status: 'in_progress', startedAt: new Date().toISOString() })
    }
    if (next && doneSets + 1 < totalSets && ex.restSeconds > 0) {
      restStartedRef.current = true
      setRest({ remaining: ex.restSeconds, total: ex.restSeconds, running: true })
    }

    const req = api('/sets', { method: 'PATCH', body: { setId: set.id, completed: next } })
      .then((d) => {
        if (d.startedAt) setWorkout((w) => w && { ...w, startedAt: d.startedAt })
      })
      .catch((err) => {
        patchSet(ex.workoutExerciseId, set.id, !next)
        toast({ type: 'error', title: 'That set didn’t save', message: err.message })
      })
      .finally(() => inflight.current.delete(req))
    inflight.current.add(req)
  }

  const finish = useCallback(async () => {
    setPhase('finishing')
    setRest({ remaining: 0, total: 0, running: false })
    await Promise.allSettled([...inflight.current]) // let pending set saves land first
    const w = workoutRef.current
    if (!w || !w.exercises.every((e) => e.sets.every((s) => s.completed))) {
      setPhase('idle') // a set failed to save and was rolled back
      return
    }
    try {
      const data = await api('/workouts', { method: 'PATCH', body: { workoutId: w.id, action: 'finish' } })
      setWorkout(data.workout)
      setPhase('celebrating')
      celebrate()
    } catch (err) {
      setPhase('finish-failed')
      toast({ type: 'error', title: 'Couldn’t save your finish', message: err.message })
    }
  }, [setWorkout, toast])

  useEffect(() => {
    if (totalSets > 0 && doneSets === totalSets && !completed && phase === 'idle') finish()
  }, [doneSets, totalSets, completed, phase, finish])

  const reset = async () => {
    setBusy('reset')
    try {
      const data = await api('/workouts', { method: 'PATCH', body: { workoutId: workout.id, action: 'reset' } })
      setWorkout(data.workout)
      setRest({ remaining: 0, total: 0, running: false })
      setPhase('idle')
      toast({ type: 'info', title: 'Workout reset', message: 'All sets unticked. Fresh start!' })
    } catch (err) {
      toast({ type: 'error', title: 'Couldn’t reset', message: err.message })
    } finally {
      setBusy(null)
    }
  }

  const goAgain = async () => {
    setBusy('again')
    try {
      const data = await api('/workouts', { method: 'PATCH', body: { workoutId: workout.id, action: 'repeat' } })
      setWorkout(data.workout)
      setPhase('idle')
      toast({ title: 'Round two loaded', message: 'Same exercises, fresh sets. Let’s go!' })
    } catch (err) {
      toast({ type: 'error', title: 'Couldn’t start another round', message: err.message })
    } finally {
      setBusy(null)
    }
  }

  if (workout === undefined) {
    return error ? (
      <Page>
        <PageHeader eyebrow="Live workout" title="Let’s get moving" />
        <ConnectionError error={error} onRetry={load} />
      </Page>
    ) : (
      <LiveSkeleton />
    )
  }

  if (!workout || exercises.length === 0) {
    return (
      <Page>
        <PageHeader eyebrow="Live workout" title="Nothing on the bar yet" />
        <EmptyState
          icon={ListPlus}
          title="No workout yet today."
          message="Pick one from the Library! Add a few exercises and we’ll build your session with rest timers."
          action={
            <Link to="/workouts" className="btn-primary">
              <Dumbbell className="h-4 w-4" /> Open Library
            </Link>
          }
        />
      </Page>
    )
  }

  // Already finished earlier today (and not the celebration we just played).
  if (completed && phase !== 'celebrating') {
    return (
      <Page>
        <PageHeader eyebrow="Live workout" title={workout.name} />
        <EmptyState
          icon={CheckCircle2}
          title="Today’s workout is done ✅"
          message={`You finished ${exercises.length} exercises and ${totalSets} sets in ${workout.durationMinutes} min. Rest up — or go for another round.`}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <button className="btn-ghost" onClick={goAgain} disabled={busy === 'again'}>
                {busy === 'again' ? <Spinner /> : <RotateCcw className="h-4 w-4" />} Go again
              </button>
              <Link to="/dashboard" className="btn-primary">
                Back to dashboard
              </Link>
            </div>
          }
        />
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Live workout"
        title={workout.name}
        subtitle={`${doneSets} of ${totalSets} sets done · ${fmt(completed ? (workout.durationMinutes ?? 0) * 60 : elapsed)} elapsed`}
        action={
          <div className="flex gap-2">
            {phase === 'finish-failed' && (
              <button className="btn-primary" onClick={finish}>
                <Trophy className="h-4 w-4" /> Save finish
              </button>
            )}
            {!completed && (
              <button className="btn-ghost" onClick={reset} disabled={busy === 'reset' || phase === 'finishing'}>
                {busy === 'reset' ? <Spinner /> : <RotateCcw className="h-4 w-4" />} Reset
              </button>
            )}
          </div>
        }
      />

      {/* overall progress */}
      <m.div variants={fadeUp} className="mb-6 h-2.5 overflow-hidden rounded-full bg-fg/[0.07]">
        <m.div
          className="h-full rounded-full bg-pulse"
          animate={{ width: `${pct * 100}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{ boxShadow: '0 0 16px rgb(var(--glow-a) / 0.6)' }}
        />
      </m.div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <GlassCard className="lg:sticky lg:top-8 lg:self-start">
          {phase === 'finishing' ? (
            <div className="grid min-h-[20rem] place-items-center text-center">
              <div>
                <Spinner className="mx-auto h-10 w-10 text-accent" />
                <p className="mt-4 font-display text-xl font-bold">Saving your workout…</p>
              </div>
            </div>
          ) : (
            <RestTimer
              rest={rest}
              nextLabel={current?.name ?? ''}
              onPause={() => setRest((r) => ({ ...r, running: !r.running }))}
              onAdjust={(d) =>
                setRest((r) => {
                  const remaining = Math.max(1, r.remaining + d)
                  return { ...r, remaining, total: Math.max(r.total, remaining) }
                })
              }
              onSkip={() => {
                restStartedRef.current = false
                setRest({ remaining: 0, total: 0, running: false })
              }}
            />
          )}
        </GlassCard>

        <div className="space-y-3">
          {exercises.map((ex, idx) => {
            const sets = ex.sets
            const exDone = sets.every((s) => s.completed)
            const isCurrent = idx === currentIdx && !completed
            return (
              <m.div
                key={ex.workoutExerciseId}
                variants={fadeUp}
                className={`glass p-4 transition-all sm:p-5 ${isCurrent ? 'shadow-glow' : ''} ${exDone ? 'opacity-70' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl font-display font-bold ${
                      exDone ? 'bg-pulse text-ink-950' : isCurrent ? 'bg-accent/15 text-accent' : 'bg-fg/[0.06]'
                    }`}
                  >
                    {exDone ? <Check className="h-5 w-5" /> : idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg font-bold">{ex.name}</p>
                    <p className="text-sm text-muted">
                      {sets.length} × {ex.reps} · {ex.restSeconds}s rest
                    </p>
                  </div>
                  {isCurrent && (
                    <span className="hidden rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent sm:inline">Now</span>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {sets.map((s) => (
                    <m.button
                      key={s.id}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleSet(ex, s)}
                      disabled={completed || phase === 'finishing'}
                      aria-pressed={s.completed}
                      aria-label={`${ex.name} set ${s.setNumber}${s.completed ? ', done' : ''}`}
                      className={`flex h-12 min-w-[3.5rem] flex-1 items-center justify-center gap-1.5 rounded-2xl border text-sm font-semibold transition-colors sm:flex-none sm:px-5 ${
                        s.completed
                          ? 'border-transparent bg-pulse text-ink-950'
                          : 'border-line/10 bg-fg/[0.04] text-muted hover:border-accent/40 hover:text-fg'
                      }`}
                    >
                      <AnimatePresence initial={false} mode="wait">
                        {s.completed ? (
                          <m.span key="c" initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                            <Check className="h-4 w-4" strokeWidth={3} />
                          </m.span>
                        ) : (
                          <m.span key="n" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            Set {s.setNumber}
                          </m.span>
                        )}
                      </AnimatePresence>
                    </m.button>
                  ))}
                </div>
              </m.div>
            )
          })}
        </div>
      </div>

      <AnimatePresence>
        {phase === 'celebrating' && completed && (
          <CompleteModal
            workout={workout}
            againBusy={busy === 'again'}
            onClose={() => navigate('/dashboard')}
            onAgain={goAgain}
          />
        )}
      </AnimatePresence>
    </Page>
  )
}
