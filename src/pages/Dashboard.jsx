import { useState } from 'react'
import { Link } from 'react-router-dom'
import { m } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Play, Flame, Timer, Dumbbell, CalendarDays, ChevronRight, CheckCircle2, ListPlus } from 'lucide-react'
import { AnimatedCounter, ConnectionError, GlassCard, Page, PageHeader, ProgressRing, QuoteCard, Skeleton, SkeletonCard } from '../components/ui.jsx'
import { useAuth, firstName } from '../context/AuthContext.jsx'
import { estimateMinutes } from '../context/WorkoutContext.jsx'
import { useApi } from '../lib/api.js'
import { percentOfGoal } from '../lib/progress.js'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function ActivityTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="glass !rounded-xl px-3 py-2 text-sm shadow-soft">
      <p className="font-semibold">
        {new Date(`${d.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
      </p>
      {d.minutes ? (
        <p className="text-muted">
          <span className="font-semibold text-fg">{d.minutes} min</span> · {d.workouts} workout{d.workouts === 1 ? '' : 's'}
        </p>
      ) : (
        <p className="text-muted">Rest day</p>
      )}
    </div>
  )
}

function TodayCard({ workout }) {
  if (!workout || workout.exercises.length === 0) {
    return (
      <GlassCard className="lg:col-span-2">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-pulse opacity-20 blur-3xl" />
        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-accent/10 text-accent">
            <ListPlus className="h-8 w-8" />
          </span>
          <div className="flex-1">
            <p className="label">Today’s workout</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">No workout yet today.</h2>
            <p className="mt-1 text-muted">Pick one from the Library! Add a few exercises and we’ll build your session.</p>
          </div>
          <Link to="/workouts" className="btn-primary !px-6 !py-4 text-base">
            <Dumbbell className="h-5 w-5" /> Open Library
          </Link>
        </div>
      </GlassCard>
    )
  }

  const sets = workout.exercises.reduce((n, e) => n + e.sets.length, 0)
  const done = workout.exercises.reduce((n, e) => n + e.sets.filter((s) => s.completed).length, 0)
  const completed = workout.status === 'completed'

  return (
    <GlassCard className="lg:col-span-2" hover>
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-pulse opacity-20 blur-3xl" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="label">Today’s workout</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{workout.name}</h2>
          <p className="mt-1 text-muted">{[...new Set(workout.exercises.map((e) => e.muscleGroup))].join(' · ')}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-fg/[0.06] px-3 py-1.5">
              <Dumbbell className="h-4 w-4 text-accent" /> {workout.exercises.length} exercises · {sets} sets
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-fg/[0.06] px-3 py-1.5">
              <Timer className="h-4 w-4 text-accent" />{' '}
              {completed ? `${workout.durationMinutes} min` : `~${estimateMinutes(workout.exercises)} min`}
            </span>
            {!completed && done > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-fg/[0.06] px-3 py-1.5">
                <Flame className="h-4 w-4 text-orange-400" /> {done}/{sets} sets done
              </span>
            )}
          </div>
        </div>
        {completed ? (
          <span className="inline-flex items-center gap-2 self-start rounded-2xl bg-accent/15 px-5 py-3 font-semibold text-accent sm:self-auto">
            <CheckCircle2 className="h-5 w-5" /> Done for today
          </span>
        ) : (
          <Link to="/live" className="btn-primary !px-7 !py-4 text-base">
            <Play className="h-5 w-5 fill-current" /> {done > 0 ? 'Resume' : 'Start'}
          </Link>
        )}
      </div>
      <ul className="relative mt-6 grid gap-2 sm:grid-cols-2">
        {workout.exercises.slice(0, 6).map((e, i) => (
          <li key={e.workoutExerciseId} className="flex items-center gap-3 rounded-2xl bg-fg/[0.04] px-3 py-2.5 text-sm">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-fg/[0.06] font-display text-xs font-bold">{i + 1}</span>
            <span className="flex-1 truncate">{e.name}</span>
            <span className="text-muted">
              {e.sets.length}×{e.reps}
            </span>
          </li>
        ))}
      </ul>
    </GlassCard>
  )
}

function StreakCard({ streak, activity }) {
  return (
    <GlassCard hover className="flex flex-col">
      <div className="pointer-events-none absolute -bottom-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-orange-500/25 blur-3xl" />
      <p className="label">Streak</p>
      <div className="relative mt-3 flex items-center gap-3">
        <m.div
          animate={streak.current > 0 ? { scale: [1, 1.12, 1], rotate: [0, -4, 4, 0] } : undefined}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className={`grid h-16 w-16 place-items-center rounded-3xl text-white ${
            streak.current > 0
              ? 'bg-gradient-to-br from-orange-400 to-rose-500 shadow-[0_10px_40px_-10px_rgba(249,115,22,0.8)]'
              : 'bg-fg/10 text-muted'
          }`}
        >
          <Flame className="h-9 w-9 fill-white/30" />
        </m.div>
        <div>
          <p className="font-display text-5xl font-bold leading-none">
            <AnimatedCounter value={streak.current} />
          </p>
          <p className="text-sm text-muted">{streak.current === 1 ? 'day in a row' : 'days in a row'}</p>
        </div>
      </div>
      <div className="relative mt-auto flex justify-between pt-6">
        {activity.map((d) => {
          const done = d.workouts > 0
          return (
            <div key={d.date} className="flex flex-col items-center gap-1.5">
              <span
                className={`grid h-8 w-8 place-items-center rounded-full text-xs ${
                  done ? 'bg-gradient-to-br from-orange-400 to-rose-500 text-white' : 'bg-fg/[0.06] text-muted'
                }`}
              >
                {done ? <Flame className="h-4 w-4" /> : '·'}
              </span>
              <span className="text-[11px] text-muted">{d.day.slice(0, 1)}</span>
            </div>
          )
        })}
      </div>
      <p className="relative mt-4 text-xs text-muted">
        {streak.trainedToday ? 'Trained today — streak secured. 🔥' : streak.current > 0 ? 'Train today to keep it alive.' : 'Finish a workout to start a streak.'}
        {streak.best > 0 && ` Best: ${streak.best} day${streak.best === 1 ? '' : 's'}.`}
      </p>
    </GlassCard>
  )
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <SkeletonCard className="lg:col-span-2" lines={4} />
      <SkeletonCard lines={3} />
      <div className="glass p-6 lg:col-span-3">
        <Skeleton className="h-3 w-24" />
        <div className="mt-5 grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton className="h-24 w-24 !rounded-full sm:h-36 sm:w-36" />
              <Skeleton className="mt-3 h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
      <SkeletonCard className="lg:col-span-2" lines={6} />
      <SkeletonCard lines={3} />
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { data, error, loading, reload } = useApi('/dashboard')
  const [hovered, setHovered] = useState(null)

  const header = (subtitle) => (
    <PageHeader
      eyebrow={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      title={
        <>
          {greeting()}, <span className="text-pulse">{firstName(user)}</span>
        </>
      }
      subtitle={subtitle}
    />
  )

  if (!data) {
    return (
      <Page>
        {header(loading ? 'Loading your week…' : ' ')}
        {error ? <ConnectionError error={error} onRetry={reload} /> : <DashboardSkeleton />}
      </Page>
    )
  }

  const { workout, activity, activityTotal, activityChangePct, streak, week, nextClass } = data
  const left = week.goalWorkouts - week.workouts
  // Round the axis up to a multiple of 30 so the four ticks land on whole 10s.
  const yMax = Math.max(30, Math.ceil(Math.max(...activity.map((d) => d.minutes)) / 30) * 30)
  const rings = [
    { key: 'workouts', label: 'Workouts', value: week.workouts, goal: week.goalWorkouts, unit: '' },
    { key: 'minutes', label: 'Active min', value: week.minutes, goal: week.goalMinutes, unit: 'm' },
    { key: 'goals', label: 'Goals hit', value: week.goalsHit, goal: week.goalsTotal, unit: '' },
  ]

  return (
    <Page>
      {header(
        left > 0
          ? `You’re ${left} workout${left === 1 ? '' : 's'} away from this week’s goal. Let’s go.`
          : 'Weekly workout goal smashed. Keep that streak alive! 🔥',
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <TodayCard workout={workout} />
        <StreakCard streak={streak} activity={activity} />

        {/* Progress rings */}
        <GlassCard className="lg:col-span-3">
          <div className="flex items-center justify-between">
            <p className="label">This week</p>
            <Link to="/progress" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
              Progress <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-6">
            {rings.map((g, i) => (
              <div key={g.key} className="flex flex-col items-center text-center">
                <div className="hidden sm:block">
                  <ProgressRing value={g.value} max={g.goal} size={140} stroke={12} delay={i * 0.15}>
                    <div>
                      <p className="font-display text-2xl font-bold">
                        <AnimatedCounter value={g.value} suffix={g.unit} />
                      </p>
                      <p className="text-xs text-muted">
                        of {g.goal}
                        {g.unit}
                      </p>
                    </div>
                  </ProgressRing>
                </div>
                <div className="sm:hidden">
                  <ProgressRing value={g.value} max={g.goal} size={96} stroke={9} delay={i * 0.15}>
                    <p className="font-display text-lg font-bold">
                      <AnimatedCounter value={g.value} suffix={g.unit} />
                    </p>
                  </ProgressRing>
                </div>
                <p className="mt-3 text-sm font-semibold">{g.label}</p>
                <p className="text-xs text-muted">
                  {g.key === 'goals' ? `${g.value} of ${g.goal} weekly goals` : `${percentOfGoal(g.value, g.goal)}% of goal`}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Weekly activity */}
        <GlassCard className="lg:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="label">Weekly activity</p>
              <p className="mt-2 font-display text-3xl font-bold">
                <AnimatedCounter value={activityTotal} /> <span className="text-base font-medium text-muted">active minutes</span>
              </p>
            </div>
            <p className="text-sm text-muted">
              {activityChangePct === null ? (
                'Last 7 days'
              ) : (
                <>
                  <span className={`font-semibold ${activityChangePct >= 0 ? 'text-accent' : 'text-rose-400'}`}>
                    {activityChangePct >= 0 ? '+' : ''}
                    {activityChangePct}%
                  </span>{' '}
                  vs previous 7 days
                </>
              )}
            </p>
          </div>
          <div
            className="mt-6 h-56"
            role="img"
            aria-label={`Active minutes per day: ${activity.map((d) => `${d.day} ${d.minutes}`).join(', ')}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activity} margin={{ top: 8, right: 0, left: -24, bottom: 0 }} barCategoryGap="28%">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" style={{ stopColor: 'var(--g1)' }} />
                    <stop offset="1" style={{ stopColor: 'var(--g2)' }} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} width={48} domain={[0, yMax]} ticks={[0, yMax / 3, (2 * yMax) / 3, yMax]} />
                <Tooltip cursor={{ fill: 'rgb(var(--line) / 0.05)', radius: 8 }} content={<ActivityTooltip />} />
                <Bar
                  dataKey="minutes"
                  radius={[8, 8, 4, 4]}
                  animationDuration={1200}
                  animationEasing="ease-out"
                  onMouseEnter={(_, i) => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {activity.map((d, i) => (
                    <Cell key={d.date} fill="url(#barGrad)" fillOpacity={hovered === null || hovered === i ? 1 : 0.45} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {activityTotal === 0 && (
            <p className="-mt-2 text-center text-sm text-muted">No completed workouts in the last 7 days yet — your first one will light this up.</p>
          )}
        </GlassCard>

        <div className="grid gap-4">
          <QuoteCard />
          <GlassCard hover>
            <p className="label">Next class</p>
            {nextClass ? (
              <div className="mt-3 flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500/15 text-orange-400">
                  <CalendarDays className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg font-bold">{nextClass.title}</p>
                  <p className="text-sm text-muted">
                    {new Date(nextClass.startTime).toLocaleString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' })} ·{' '}
                    {nextClass.coach}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">No more classes this week. New schedule drops Monday.</p>
            )}
            <Link to="/classes" className="btn-ghost mt-4 w-full">
              Browse schedule <ChevronRight className="h-4 w-4" />
            </Link>
          </GlassCard>
        </div>
      </div>
    </Page>
  )
}
