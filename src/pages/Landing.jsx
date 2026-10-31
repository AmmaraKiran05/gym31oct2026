import { Link } from 'react-router-dom'
import { m } from 'framer-motion'
import { ArrowRight, Dumbbell, Flame, Timer, Trophy, CalendarDays, Sparkles, Play, TrendingUp } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import { AnimatedCounter, ProgressRing, Skeleton, ThemeToggle, QuoteCard, fadeUp, stagger } from '../components/ui.jsx'
import { Footer, LogoutButton } from '../components/layout/AppLayout.jsx'
import { useAuth, firstName, initials } from '../context/AuthContext.jsx'
import { useApi } from '../lib/api.js'

const features = [
  { icon: Dumbbell, title: 'Smart workout library', text: 'Coach-built exercises, filterable by muscle group and difficulty.' },
  { icon: Timer, title: 'Live workout mode', text: 'Tick off sets, auto-start rest timers, and finish with a celebration.' },
  { icon: TrendingUp, title: 'Progress that pops', text: 'Strength curves, volume trends and PRs that show how far you’ve come.' },
  { icon: CalendarDays, title: 'Book classes fast', text: 'Yoga, HIIT, Spin and Boxing — see spots left and reserve in one tap.' },
  { icon: Flame, title: 'Streaks & motivation', text: 'Daily quotes, streak flames and badges that keep you showing up.' },
  { icon: Trophy, title: 'Achievements', text: 'Unlock trophies for milestones, from your first rep to a 30-day streak.' },
]

function NavBar() {
  const { user } = useAuth()
  return (
    <header className="sticky top-0 z-50 border-b border-line/[0.06] bg-bg/60 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-10">
        <Link to="/" aria-label="PulseFit home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
          <a href="#features" className="hover:text-fg">Features</a>
          <Link to="/classes" className="hover:text-fg">Classes</Link>
          <Link to="/progress" className="hover:text-fg">Progress</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <span className="hidden items-center gap-2 text-sm font-semibold sm:inline-flex">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-pulse font-display text-xs font-bold text-ink-950">
                  {initials(user)}
                </span>
                {firstName(user)}
              </span>
              <LogoutButton />
              <Link to="/dashboard" className="btn-primary !px-4 !py-2.5">
                Open app
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost !px-4 !py-2.5">
                Log in
              </Link>
              <Link to="/signup" className="btn-primary hidden !px-4 !py-2.5 sm:inline-flex">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[360px]">
      <div
        className="absolute -inset-10 opacity-40"
        style={{
          background:
            'radial-gradient(closest-side at 40% 45%, color-mix(in srgb, var(--g1) 70%, transparent), transparent), radial-gradient(closest-side at 60% 60%, color-mix(in srgb, var(--g2) 60%, transparent), transparent)',
        }}
      />

      {/* phone */}
      <m.div
        initial={{ opacity: 0, transform: 'translateY(40px) rotate(-4deg)' }}
        animate={{ opacity: 1, transform: 'translateY(0px) rotate(-3deg)' }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="glass absolute inset-x-6 inset-y-0 !rounded-[2.5rem] p-5"
      >
        <div className="mx-auto mb-5 h-1.5 w-16 rounded-full bg-fg/15" />
        <p className="label">Today</p>
        <p className="mt-1 font-display text-xl font-bold">Upper Body Power</p>
        <div className="mt-5 grid place-items-center">
          <ProgressRing value={72} size={150} stroke={12} delay={0.6}>
            <div>
              <p className="font-display text-3xl font-bold">
                <AnimatedCounter value={72} suffix="%" />
              </p>
              <p className="text-xs text-muted">complete</p>
            </div>
          </ProgressRing>
        </div>
        <div className="mt-5 space-y-2">
          {['Bench Press · 4×8', 'Barbell Row · 4×8', 'Incline DB · 3×10'].map((t, i) => (
            <div key={t} className="flex items-center justify-between rounded-2xl bg-fg/[0.05] px-3 py-2.5 text-sm">
              <span>{t}</span>
              <span className={`h-5 w-5 rounded-full ${i < 2 ? 'bg-pulse' : 'border border-line/20'}`} />
            </div>
          ))}
        </div>
      </m.div>

      {/* floating chips */}
      <m.div
        initial={{ opacity: 0, transform: 'translateX(30px)' }}
        animate={{ opacity: 1, transform: 'translateX(0px)' }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="absolute -right-2 top-16 sm:-right-10"
      >
        <div className="glass flex animate-float items-center gap-2 !rounded-2xl px-4 py-3 shadow-soft">
          <Flame className="h-5 w-5 animate-beat text-orange-400" />
          <div className="leading-tight">
            <p className="font-display font-bold">12 days</p>
            <p className="text-xs text-muted">streak</p>
          </div>
        </div>
      </m.div>
      <m.div
        initial={{ opacity: 0, transform: 'translateX(-30px)' }}
        animate={{ opacity: 1, transform: 'translateX(0px)' }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="absolute -left-2 bottom-20 sm:-left-12"
      >
        <div className="glass flex animate-float items-center gap-3 !rounded-2xl px-4 py-3 shadow-soft [animation-delay:-3s]">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400/15 text-amber-400">
            <Trophy className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-xs text-muted">New PR</p>
            <p className="font-display font-bold">Deadlift 170 kg</p>
          </div>
        </div>
      </m.div>
    </div>
  )
}

const statItems = [
  { key: 'members', label: 'Members' },
  { key: 'workoutsCompleted', label: 'Workouts completed' },
  { key: 'classesThisWeek', label: 'Classes this week' },
]

export default function Landing() {
  const { user } = useAuth()
  const stats = useApi('/stats')
  const startTo = user ? '/dashboard' : '/signup'

  return (
    <div className="min-h-dvh overflow-x-clip">
      <NavBar />

      {/* Hero */}
      <section className="relative">
        <div className="grid-bg absolute inset-0 -z-10" />
        <m.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:px-10 lg:pb-24 lg:pt-20"
        >
          <div>
            <m.span
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent"
            >
              <Sparkles className="h-3.5 w-3.5" /> New · Live Workout Mode
            </m.span>

            <m.h1
              variants={fadeUp}
              className="mt-6 text-[clamp(2.75rem,8vw,5.5rem)] font-bold leading-[0.95] tracking-tighter"
            >
              Train smarter.
              <br />
              <span
                className="text-pulse animate-shimmer bg-[length:200%_auto]"
                style={{ backgroundImage: 'linear-gradient(100deg, var(--g1), var(--g2), var(--g1))' }}
              >
                Get stronger.
              </span>
            </m.h1>

            <m.p variants={fadeUp} className="mt-6 max-w-lg text-lg text-muted">
              PulseFit is the gym app that plans your workouts, tracks every rep, books your classes and keeps your
              streak burning — all from your phone.
            </m.p>

            <m.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
              <Link to={startTo} className="btn-primary group !px-6 !py-4 text-base">
                <Play className="h-5 w-5 fill-current" />
                Start Your Workout
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/dashboard" className="btn-ghost !px-6 !py-4 text-base">
                See your dashboard
              </Link>
            </m.div>

            <m.dl variants={fadeUp} className="mt-12 grid grid-cols-3 gap-3 sm:gap-6">
              {statItems.map((s) => (
                <div key={s.key} className="border-l-2 border-accent/40 pl-3 sm:pl-4">
                  <dd className="font-display text-xl font-bold sm:text-3xl">
                    {stats.data ? (
                      <AnimatedCounter value={stats.data[s.key]} duration={2.2} />
                    ) : stats.error ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <Skeleton className="h-7 w-16 sm:h-9 sm:w-24" />
                    )}
                  </dd>
                  <dt className="mt-1 text-xs text-muted sm:text-sm">{s.label}</dt>
                </div>
              ))}
            </m.dl>
            {stats.error && (
              <p className="mt-3 text-xs text-muted">Live stats are taking a breather. {stats.error.message}</p>
            )}
          </div>

          <HeroVisual />
        </m.div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-10">
        <m.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
        >
          <m.p variants={fadeUp} className="label">Everything in one app</m.p>
          <m.h2 variants={fadeUp} className="mt-3 max-w-2xl text-3xl font-bold sm:text-5xl">
            Built for the way you <span className="text-pulse">actually train.</span>
          </m.h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <m.div
                key={title}
                variants={fadeUp}
                whileHover={{ transform: 'translateY(-6px)' }}
                className="glass group p-6 transition-shadow hover:shadow-glow"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-accent transition group-hover:bg-pulse group-hover:text-ink-950">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm text-muted">{text}</p>
              </m.div>
            ))}
          </div>
        </m.div>
      </section>

      {/* Quote + CTA */}
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-20 sm:px-6 lg:grid-cols-2 lg:px-10">
        <m.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
          <QuoteCard className="h-full" />
        </m.div>
        <m.div
          initial={{ opacity: 0, transform: 'translateY(20px)' }}
          whileInView={{ opacity: 1, transform: 'translateY(0px)' }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-pulse p-8 text-ink-950"
        >
          <Dumbbell className="absolute -bottom-6 -right-6 h-40 w-40 rotate-[-20deg] opacity-15" />
          <h3 className="text-3xl font-bold">Your next PR is one tap away.</h3>
          <p className="mt-2 max-w-sm font-medium opacity-80">Jump into today’s plan — PulseFit handles the timer.</p>
          <Link
            to={startTo}
            className="btn mt-6 bg-ink-950 !px-6 !py-4 text-base text-white hover:-translate-y-0.5 hover:bg-ink-900"
          >
            Start Your Workout <ArrowRight className="h-5 w-5" />
          </Link>
        </m.div>
      </section>

      <Footer />
    </div>
  )
}
