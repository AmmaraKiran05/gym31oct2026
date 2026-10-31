import { useEffect, useId, useRef } from 'react'
import { animate, m, useInView } from 'framer-motion'
import { Moon, Sun, Quote, Loader2, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'
import { quoteOfTheDay } from '../data/mock.js'
import { ringFraction, safeNumber } from '../lib/progress.js'

export const fadeUp = {
  hidden: { opacity: 0, transform: 'translateY(18px)' },
  show: { opacity: 1, transform: 'translateY(0px)', transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

export function Page({ children, className = '' }) {
  return (
    <m.main
      variants={stagger}
      initial="hidden"
      animate="show"
      className={`mx-auto w-full max-w-6xl px-4 pb-8 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10 ${className}`}
    >
      {children}
    </m.main>
  )
}

export function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <m.header variants={fadeUp} className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:mb-8">
      <div>
        {eyebrow && <p className="label mb-2">{eyebrow}</p>}
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-muted">{subtitle}</p>}
      </div>
      {action}
    </m.header>
  )
}

export function GlassCard({ children, className = '', hover = false, ...rest }) {
  return (
    <m.div
      variants={fadeUp}
      whileHover={hover ? { transform: 'translateY(-4px)', transition: { type: 'spring', stiffness: 300, damping: 20 } } : undefined}
      className={`glass relative overflow-hidden p-5 sm:p-6 ${hover ? 'transition-shadow hover:shadow-glow' : ''} ${className}`}
      {...rest}
    >
      {children}
    </m.div>
  )
}

export function AnimatedCounter({ value, decimals = 0, duration = 1.6, suffix = '', prefix = '', className = '' }) {
  const ref = useRef(null)
  // Start once half the number is visible. (A negative margin here left counters stuck at 0
  // when they sat near the bottom edge of a phone screen.)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const numRef = useRef(null)
  const format = (v) => v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

  useEffect(() => {
    if (!inView) return
    // Write digits straight to the DOM each frame instead of re-rendering React 60×/second.
    const controls = animate(0, safeNumber(value), {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (numRef.current) numRef.current.textContent = format(v)
      },
    })
    return () => controls.stop()
  }, [inView, value, duration]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      <span ref={numRef}>{format(0)}</span>
      {suffix}
    </span>
  )
}

export function ProgressRing({ value, max = 100, size = 120, stroke = 10, color = 'var(--g1)', color2 = 'var(--g2)', children, delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = ringFraction(value, max)
  const gid = `ring${useId().replace(/:/g, '')}`

  return (
    <div ref={ref} className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: color }} />
            <stop offset="1" style={{ stopColor: color2 }} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-fg/[0.08]" />
        <m.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: inView ? c * (1 - pct) : c }}
          transition={{ duration: 1.4, delay, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: 'drop-shadow(0 0 6px rgb(var(--glow-a) / 0.45))' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

export function ThemeToggle({ className = '' }) {
  const { isDark, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className={`relative grid h-10 w-10 place-items-center rounded-2xl border border-line/10 bg-fg/[0.04] text-fg transition hover:bg-fg/[0.08] ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <m.span key={isDark ? 'moon' : 'sun'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}>
        {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
      </m.span>
    </button>
  )
}

export function QuoteCard({ className = '' }) {
  const q = quoteOfTheDay()
  return (
    <GlassCard className={className}>
      <Quote className="absolute -right-2 -top-2 h-24 w-24 text-accent/10" />
      <p className="label">Quote of the day</p>
      <blockquote className="mt-3 font-display text-lg font-medium leading-snug sm:text-xl">“{q.text}”</blockquote>
      <p className="mt-3 text-sm text-muted">— {q.author}</p>
    </GlassCard>
  )
}

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass flex flex-col items-center px-6 py-14 text-center"
    >
      <div className="grid h-16 w-16 place-items-center rounded-3xl bg-accent/10 text-accent">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="mt-5 text-xl font-bold">{title}</h3>
      <p className="mt-2 max-w-sm text-muted">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </m.div>
  )
}

export function DifficultyBadge({ level }) {
  const n = { Beginner: 1, Intermediate: 2, Advanced: 3 }[level] ?? 1
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-fg/[0.05] px-2.5 py-1 text-xs font-medium text-muted">
      <span className="flex items-end gap-[2px]" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`w-[3px] rounded-full ${i <= n ? 'bg-accent' : 'bg-fg/15'}`}
            style={{ height: 4 + i * 3 }}
          />
        ))}
      </span>
      {level}
    </span>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded-2xl ${className}`} aria-hidden="true" />
}

export function SkeletonCard({ className = '', lines = 3 }) {
  return (
    <div className={`glass p-5 sm:p-6 ${className}`} aria-hidden="true">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-8 w-2/3" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className="mt-3 h-4" />
      ))}
    </div>
  )
}

export function Spinner({ className = 'h-4 w-4' }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />
}

// Friendly full-card message when the API or database can't be reached.
export function ConnectionError({ error, onRetry }) {
  const dbDown = error?.code === 'DB_UNREACHABLE' || error?.status === 503
  const serverDown = error?.code === 'NETWORK'
  return (
    <EmptyState
      icon={dbDown || serverDown ? WifiOff : AlertTriangle}
      title={dbDown ? 'Can’t reach the database' : serverDown ? 'Can’t reach PulseFit' : 'Something went sideways'}
      message={error?.message || 'Please try again in a moment.'}
      action={
        onRetry && (
          <button className="btn-primary" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        )
      }
    />
  )
}
