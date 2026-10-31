import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, m } from 'framer-motion'
import { Search, Plus, Check, Timer, SearchX, Dumbbell, X } from 'lucide-react'
import { ConnectionError, DifficultyBadge, EmptyState, Page, PageHeader, Skeleton, Spinner, fadeUp } from '../components/ui.jsx'
import { estimateMinutes, useWorkout } from '../context/WorkoutContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { muscleGroups } from '../data/mock.js'
import { useApi } from '../lib/api.js'

const groupTint = {
  Chest: 'from-lime-400/25',
  Back: 'from-cyan-400/25',
  Legs: 'from-violet-400/25',
  Arms: 'from-orange-400/25',
  Core: 'from-rose-400/25',
  Cardio: 'from-sky-400/25',
}

function ExerciseCard({ ex }) {
  const { planIds, pending, addExercise, removeExercise } = useWorkout()
  const toast = useToast()
  const inPlan = planIds.has(ex.id)
  const busy = pending.has(ex.id)

  const onToggle = async () => {
    try {
      if (inPlan) {
        await removeExercise(ex.id)
        toast({ type: 'info', title: 'Removed from today', message: `${ex.name} is out of your workout.` })
      } else {
        await addExercise(ex.id)
        toast({ title: 'Added to today’s workout', message: `${ex.name} · ${ex.sets} sets × ${ex.reps}` })
      }
    } catch (err) {
      toast({ type: 'error', title: inPlan ? 'Couldn’t remove that' : 'Couldn’t add that', message: err.message })
    }
  }

  return (
    <m.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="glass group relative flex flex-col overflow-hidden p-5 transition-shadow hover:shadow-glow"
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${groupTint[ex.muscleGroup]} to-transparent opacity-70`} />
      <div className="relative flex items-start justify-between gap-3">
        <span className="rounded-full bg-fg/[0.07] px-2.5 py-1 text-xs font-semibold">{ex.muscleGroup}</span>
        <DifficultyBadge level={ex.difficulty} />
      </div>
      <h3 className="relative mt-4 text-lg font-bold leading-snug">{ex.name}</h3>
      <p className="relative mt-1 line-clamp-2 text-sm text-muted" title={ex.description}>
        {ex.description}
      </p>

      <dl className="relative mt-5 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-fg/[0.05] py-2.5">
          <dd className="font-display text-xl font-bold">{ex.sets}</dd>
          <dt className="text-[11px] uppercase tracking-wider text-muted">Sets</dt>
        </div>
        <div className="rounded-2xl bg-fg/[0.05] py-2.5">
          <dd className="font-display text-xl font-bold">{ex.reps}</dd>
          <dt className="text-[11px] uppercase tracking-wider text-muted">Reps</dt>
        </div>
        <div className="rounded-2xl bg-fg/[0.05] py-2.5">
          <dd className="font-display text-xl font-bold">{ex.restSeconds}s</dd>
          <dt className="text-[11px] uppercase tracking-wider text-muted">Rest</dt>
        </div>
      </dl>

      <button
        onClick={onToggle}
        disabled={busy}
        className={`relative mt-5 w-full ${inPlan ? 'btn bg-accent/15 text-accent hover:bg-accent/20' : 'btn-ghost'}`}
        aria-pressed={inPlan}
        title={inPlan ? 'Tap to remove from today’s workout' : undefined}
      >
        {busy ? <Spinner /> : inPlan ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {inPlan ? 'In today’s workout' : 'Add to today’s workout'}
      </button>
    </m.article>
  )
}

function LibrarySkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading exercises">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="glass p-5">
          <div className="flex justify-between">
            <Skeleton className="h-6 w-16 !rounded-full" />
            <Skeleton className="h-6 w-24 !rounded-full" />
          </div>
          <Skeleton className="mt-4 h-6 w-3/4" />
          <Skeleton className="mt-2 h-4" />
          <div className="mt-5 grid grid-cols-3 gap-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
          <Skeleton className="mt-5 h-11" />
        </div>
      ))}
    </div>
  )
}

export default function Library() {
  const [group, setGroup] = useState('All')
  const [query, setQuery] = useState('')
  const { openWorkout } = useWorkout()
  const { data, error, reload } = useApi('/exercises')
  const exercises = data?.exercises ?? []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return exercises.filter(
      (e) =>
        (group === 'All' || e.muscleGroup === group) &&
        (!q || e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)),
    )
  }, [exercises, group, query])

  const planCount = openWorkout?.exercises.length ?? 0

  return (
    <Page>
      <PageHeader
        eyebrow="Workout library"
        title="Find your next move"
        subtitle="Filter by muscle group, then add exercises to today’s workout."
        action={
          planCount > 0 && (
            <Link to="/live" className="btn-primary">
              <Timer className="h-4 w-4" /> Start workout · {planCount} ex · ~{estimateMinutes(openWorkout.exercises)} min
            </Link>
          )
        }
      />

      <m.div variants={fadeUp} className="sticky top-[calc(env(safe-area-inset-top)+4.25rem)] z-30 -mx-4 mb-6 bg-bg/70 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-3xl sm:px-3 lg:top-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises…"
            className="w-full rounded-2xl border border-line/10 bg-fg/[0.04] py-3 pl-12 pr-10 text-fg placeholder:text-muted focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Muscle group">
          {['All', ...muscleGroups].map((g) => (
            <button
              key={g}
              role="tab"
              aria-selected={group === g}
              onClick={() => setGroup(g)}
              className={`chip ${group === g ? 'chip-active' : ''}`}
            >
              {g}
              {data && (
                <span className={`text-xs ${group === g ? 'opacity-70' : 'opacity-60'}`}>
                  {g === 'All' ? exercises.length : exercises.filter((e) => e.muscleGroup === g).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </m.div>

      {!data ? (
        error ? (
          <ConnectionError error={error} onRetry={reload} />
        ) : (
          <LibrarySkeleton />
        )
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={exercises.length === 0 ? 'The library is empty' : 'No exercises match that'}
          message={
            exercises.length === 0
              ? 'Run “npm run db:setup” to load the starter exercises.'
              : `We couldn’t find “${query}” in ${group === 'All' ? 'the library' : group}. Try another word or muscle group.`
          }
          action={
            exercises.length > 0 && (
              <button
                className="btn-ghost"
                onClick={() => {
                  setQuery('')
                  setGroup('All')
                }}
              >
                <Dumbbell className="h-4 w-4" /> Show all exercises
              </button>
            )
          }
        />
      ) : (
        <m.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {filtered.map((ex) => (
              <ExerciseCard key={ex.id} ex={ex} />
            ))}
          </AnimatePresence>
        </m.div>
      )}
    </Page>
  )
}
