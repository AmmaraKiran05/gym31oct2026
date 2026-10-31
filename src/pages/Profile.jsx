import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { m } from 'framer-motion'
import { Dumbbell, Flame, Trophy, Sunrise, CalendarDays, Timer, Zap, Shield, Heart, Lock, Crown, MapPin, Moon, Bell, LogOut } from 'lucide-react'
import { AnimatedCounter, GlassCard, Page, PageHeader, ThemeToggle, fadeUp, stagger } from '../components/ui.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useAuth, initials } from '../context/AuthContext.jsx'
import { achievements, user as sampleProfile } from '../data/mock.js'

const icons = { dumbbell: Dumbbell, flame: Flame, trophy: Trophy, sunrise: Sunrise, calendar: CalendarDays, timer: Timer, zap: Zap, shield: Shield, heart: Heart }

function Switch({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition-colors ${checked ? 'bg-pulse' : 'bg-fg/15'}`}
    >
      <m.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow ${checked ? 'right-1' : 'left-1'}`}
      />
    </button>
  )
}

export default function Profile() {
  const { isDark } = useTheme()
  const toast = useToast()
  const navigate = useNavigate()
  const { user: me, logout } = useAuth()
  // Identity comes from the account; level, stats and badges are still sample data.
  const user = {
    ...sampleProfile,
    name: me.fullName,
    initials: initials(me),
    handle: me.email,
    memberSince: new Date(me.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  }
  const [reminders, setReminders] = useState(true)
  const unlocked = achievements.filter((a) => a.unlocked).length
  const xpPct = (user.xp / user.xpNext) * 100

  return (
    <Page>
      <PageHeader eyebrow="Profile" title="Your PulseFit" />

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-pulse opacity-20 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative h-28 w-28 shrink-0">
              <m.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-[2rem] bg-[conic-gradient(from_0deg,var(--g1),var(--g2),var(--g1))] p-[3px]"
              />
              <div className="absolute inset-[3px] grid place-items-center rounded-[1.85rem] bg-surface font-display text-4xl font-bold">
                <span className="text-pulse">{user.initials}</span>
              </div>
              <span className="absolute -bottom-2 -right-2 grid h-10 w-10 place-items-center rounded-2xl bg-ink-950 font-display text-sm font-bold text-white ring-4 ring-bg">
                {user.level}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-3xl font-bold">{user.name}</h2>
              <p className="text-muted">{user.handle}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-3 py-1 font-semibold text-amber-950">
                  <Crown className="h-4 w-4" /> {user.membership}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-fg/[0.06] px-3 py-1 text-muted">
                  <MapPin className="h-4 w-4" /> {user.homeGym}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-fg/[0.06] px-3 py-1 text-muted">
                  Since {user.memberSince}
                </span>
              </div>
            </div>
          </div>

          <div className="relative mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">Level {user.level}</span>
              <span className="text-muted tabular-nums">
                {user.xp.toLocaleString()} / {user.xpNext.toLocaleString()} XP
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-fg/[0.07]">
              <m.div
                className="h-full rounded-full bg-pulse"
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                style={{ boxShadow: '0 0 14px rgb(var(--glow-a) / 0.6)' }}
              />
            </div>
            <p className="mt-2 text-xs text-muted">{(user.xpNext - user.xp).toLocaleString()} XP to Level {user.level + 1}</p>
          </div>

          <dl className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Workouts', value: user.stats.workouts },
              { label: 'Hours', value: user.stats.hours },
              { label: 'Classes', value: user.stats.classes },
              { label: 'PRs', value: user.stats.prs },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-fg/[0.05] p-3 text-center">
                <dd className="font-display text-2xl font-bold">
                  <AnimatedCounter value={s.value} />
                </dd>
                <dt className="text-xs text-muted">{s.label}</dt>
              </div>
            ))}
          </dl>
        </GlassCard>

        <GlassCard>
          <p className="label">Settings</p>
          <ul className="mt-4 divide-y divide-line/[0.06]">
            <li className="flex items-center justify-between py-3">
              <span className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-muted" /> {isDark ? 'Dark' : 'Light'} mode
              </span>
              <ThemeToggle />
            </li>
            <li className="flex items-center justify-between py-3">
              <span className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted" /> Workout reminders
              </span>
              <Switch
                checked={reminders}
                label="Workout reminders"
                onChange={(v) => {
                  setReminders(v)
                  toast({ type: 'info', title: v ? 'Reminders on' : 'Reminders off', message: v ? 'We’ll nudge you at 6:00 pm.' : 'No more nudges. You’ve got this.' })
                }}
              />
            </li>
            <li className="py-3">
              <button
                className="flex w-full items-center gap-3 text-rose-400"
                onClick={async () => {
                  await logout().catch(() => {})
                  toast({ type: 'info', title: 'Logged out', message: 'See you at your next session. 👋' })
                  navigate('/')
                }}
              >
                <LogOut className="h-5 w-5" /> Sign out
              </button>
            </li>
          </ul>
        </GlassCard>
      </div>

      <m.section variants={fadeUp} className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Achievements</h2>
          <p className="text-sm text-muted">
            {unlocked} of {achievements.length} unlocked
          </p>
        </div>
        <m.div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
        >
          {achievements.map((a) => {
            const Icon = icons[a.icon] ?? Trophy
            return (
              <m.div
                key={a.id}
                variants={fadeUp}
                whileHover={{ transform: 'translateY(-5px) scale(1.02)' }}
                className={`glass flex flex-col items-center p-4 text-center ${a.unlocked ? 'hover:shadow-glow' : ''}`}
              >
                <div
                  className={`relative grid h-16 w-16 place-items-center rounded-full ${
                    a.unlocked ? 'bg-pulse text-ink-950 shadow-glow' : 'bg-fg/[0.06] text-muted'
                  }`}
                >
                  <Icon className="h-7 w-7" />
                  {!a.unlocked && (
                    <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-surface ring-2 ring-bg">
                      <Lock className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <p className="mt-3 font-display text-sm font-bold leading-tight">{a.name}</p>
                <p className="mt-1 text-xs text-muted">{a.desc}</p>
                {!a.unlocked && (
                  <div className="mt-3 w-full">
                    <div className="h-1.5 overflow-hidden rounded-full bg-fg/[0.07]">
                      <div className="h-full rounded-full bg-pulse" style={{ width: `${a.progress * 100}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] text-muted">{Math.round(a.progress * 100)}%</p>
                  </div>
                )}
              </m.div>
            )
          })}
        </m.div>
      </m.section>
    </Page>
  )
}
