import { useId, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { m } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Flame, Timer, AlertTriangle } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import { Spinner, ThemeToggle, fadeUp, stagger } from '../components/ui.jsx'
import { useAuth, firstName } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

function AuthShell({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 lg:px-10">
        <Link to="/" aria-label="PulseFit home">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <div className="grid-bg pointer-events-none fixed inset-0 -z-10" />
      <m.main
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10"
      >
        <m.p variants={fadeUp} className="label">
          {eyebrow}
        </m.p>
        <m.h1 variants={fadeUp} className="mt-2 text-4xl font-bold tracking-tighter sm:text-5xl">
          {title}
        </m.h1>
        <m.p variants={fadeUp} className="mt-3 text-muted">
          {subtitle}
        </m.p>
        <m.div variants={fadeUp} className="glass relative mt-8 overflow-hidden p-6 sm:p-7">
          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-pulse opacity-20 blur-3xl" />
          <div className="relative">{children}</div>
        </m.div>
        <m.p variants={fadeUp} className="mt-6 text-center text-sm text-muted">
          {footer}
        </m.p>
      </m.main>
    </div>
  )
}

// The label names only the input; the hint is linked as a description, and any
// extra controls (like "Show password") sit outside the label.
function Field({ label, hint, children }) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm font-medium">
        <label htmlFor={id}>{label}</label>
        {hint && (
          <span id={hintId} className="text-xs font-normal text-muted">
            {hint}
          </span>
        )}
      </div>
      {children({ id, 'aria-describedby': hintId })}
    </div>
  )
}

function PasswordInput({ value, onChange, autoComplete, ...fieldProps }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        {...fieldProps}
        className="input pr-12"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        minLength={autoComplete === 'new-password' ? 8 : undefined}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted hover:text-fg"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  )
}

function FormError({ message }) {
  if (!message) return null
  return (
    <m.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      role="alert"
      className="flex items-start gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-fg"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
      {message}
    </m.p>
  )
}

export function Login() {
  const { user, login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const dest = location.state?.from || '/dashboard'

  if (user && !busy) return <Navigate to={dest} replace />

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const u = await login(email, password)
      toast({ title: `Welcome back, ${firstName(u)}!`, message: 'Let’s get after it.' })
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title={
        <>
          Log in to <span className="text-pulse">PulseFit</span>
        </>
      }
      subtitle="Pick up right where you left off."
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="font-semibold text-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <Field label="Email">
          {(f) => <input {...f} className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />}
        </Field>
        <Field label="Password">
          {(f) => <PasswordInput {...f} value={password} onChange={setPassword} autoComplete="current-password" />}
        </Field>
        <button className="btn-primary w-full !py-3.5 text-base" disabled={busy}>
          {busy ? <Spinner /> : <ArrowRight className="h-5 w-5" />} {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthShell>
  )
}

const WORKOUT_GOALS = [2, 3, 4, 5, 6]

export function Signup() {
  const { user, signup } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', weeklyGoalWorkouts: 4, weeklyGoalMinutes: 180 })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

  if (user && !busy) return <Navigate to="/dashboard" replace />

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const u = await signup(form)
      toast({ title: `You’re in, ${firstName(u)}! 🎉`, message: 'Add a few exercises from the Library to build today’s workout.' })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Join PulseFit"
      title={
        <>
          Start your <span className="text-pulse">streak.</span>
        </>
      }
      subtitle="Create your free account and set the goals you want to crush each week."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <Field label="Your name">
          {(f) => <input {...f} className="input" value={form.fullName} onChange={(e) => set('fullName')(e.target.value)} autoComplete="name" required maxLength={80} />}
        </Field>
        <Field label="Email">
          {(f) => <input {...f} className="input" type="email" value={form.email} onChange={(e) => set('email')(e.target.value)} autoComplete="email" required />}
        </Field>
        <Field label="Password" hint="8+ characters, with a letter and a number">
          {(f) => <PasswordInput {...f} value={form.password} onChange={set('password')} autoComplete="new-password" />}
        </Field>

        <div className="rounded-2xl border border-line/10 bg-fg/[0.03] p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Flame className="h-4 w-4 text-orange-400" /> Workouts per week
          </p>
          <div className="mt-3 grid grid-cols-5 gap-2" role="radiogroup" aria-label="Workouts per week">
            {WORKOUT_GOALS.map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={form.weeklyGoalWorkouts === n}
                onClick={() => set('weeklyGoalWorkouts')(n)}
                className={`chip justify-center !px-0 font-display text-base ${form.weeklyGoalWorkouts === n ? 'chip-active' : ''}`}
              >
                {n}
              </button>
            ))}
          </div>

          <p className="mt-5 flex items-center justify-between text-sm font-semibold">
            <span className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-accent" /> Active minutes per week
            </span>
            <span className="font-display text-lg tabular-nums">{form.weeklyGoalMinutes}</span>
          </p>
          <input
            type="range"
            min={60}
            max={600}
            step={15}
            value={form.weeklyGoalMinutes}
            onChange={(e) => set('weeklyGoalMinutes')(Number(e.target.value))}
            className="mt-3 w-full accent-[rgb(var(--accent))]"
            aria-label="Active minutes per week"
          />
        </div>

        <button className="btn-primary w-full !py-3.5 text-base" disabled={busy}>
          {busy ? <Spinner /> : <ArrowRight className="h-5 w-5" />} {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  )
}
