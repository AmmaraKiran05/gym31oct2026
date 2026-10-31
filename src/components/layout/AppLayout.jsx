import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { m } from 'framer-motion'
import { Flame, LogIn, LogOut } from 'lucide-react'
import Logo from '../Logo.jsx'
import { ThemeToggle } from '../ui.jsx'
import { navItems } from './nav.js'
import { useAuth, firstName, initials } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'

export { LogoutButton }

function Sidebar() {
  const { user } = useAuth()
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line/[0.06] bg-surface/40 px-4 py-6 backdrop-blur-xl lg:flex">
      <Link to="/" className="px-3">
        <Logo />
      </Link>

      <nav className="mt-10 flex flex-1 flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="group relative">
            {({ isActive }) => (
              <span
                className={`relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors ${
                  isActive ? 'text-fg' : 'text-muted hover:text-fg'
                }`}
              >
                {isActive && (
                  <m.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-2xl border border-accent/20 bg-accent/10"
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                )}
                <Icon className={`relative h-5 w-5 ${isActive ? 'text-accent' : ''}`} />
                <span className="relative">{label}</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {user ? (
        <>
          <div className="glass !rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 animate-beat text-orange-400" />
              <p className="font-display text-lg font-bold">Weekly goal</p>
            </div>
            <p className="mt-1 text-xs text-muted">
              {user.weeklyGoalWorkouts} workouts · {user.weeklyGoalMinutes} active minutes
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2 px-1">
            <Link to="/profile" className="flex min-w-0 flex-1 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-pulse font-display text-sm font-bold text-ink-950">
                {initials(user)}
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-sm font-semibold">{user.fullName}</span>
                <span className="block truncate text-xs text-muted">{user.email}</span>
              </span>
            </Link>
            <ThemeToggle />
          </div>
          <LogoutButton className="mt-3 w-full" withLabel />
        </>
      ) : (
        <div className="space-y-2">
          <Link to="/login" className="btn-primary w-full">
            <LogIn className="h-4 w-4" /> Log in
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/signup" className="btn-ghost flex-1">
              Sign up
            </Link>
            <ThemeToggle />
          </div>
        </div>
      )}
    </aside>
  )
}

function LogoutButton({ className = '', withLabel = false }) {
  const { logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const onClick = async () => {
    try {
      await logout()
      toast({ type: 'info', title: 'Logged out', message: 'See you at your next session. 👋' })
    } catch {
      toast({ type: 'error', title: 'Couldn’t reach the server', message: 'You’ve been logged out on this device.' })
    }
    navigate('/')
  }
  return withLabel ? (
    <button onClick={onClick} className={`btn-ghost !py-2.5 ${className}`}>
      <LogOut className="h-4 w-4" /> Log out
    </button>
  ) : (
    <button
      onClick={onClick}
      className={`grid h-10 w-10 place-items-center rounded-2xl border border-line/10 bg-fg/[0.04] text-fg transition hover:bg-fg/[0.08] ${className}`}
      aria-label="Log out"
      title="Log out"
    >
      <LogOut className="h-[18px] w-[18px]" />
    </button>
  )
}

function MobileTopBar() {
  const { user } = useAuth()
  return (
    <header className="sticky top-0 z-40 border-b border-line/[0.06] bg-bg/70 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-between">
        <Link to="/">
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <LogoutButton />
              <Link
                to="/profile"
                className="flex h-10 items-center gap-2 rounded-2xl bg-pulse pl-1 pr-3 font-display text-sm font-bold text-ink-950"
                aria-label={`Profile: ${user.fullName}`}
              >
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-ink-950/15">{initials(user)}</span>
                <span className="max-w-[5.5rem] truncate">{firstName(user)}</span>
              </Link>
            </>
          ) : (
            <Link to="/login" className="btn-primary !px-4 !py-2.5">
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

function BottomNav() {
  const items = navItems.filter((i) => i.to !== '/profile')
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line/[0.06] bg-bg/80 backdrop-blur-xl lg:hidden">
      <ul className="mx-auto flex max-w-md items-end justify-around px-2 pt-2">
        {items.map(({ to, short, icon: Icon, featured }) => (
          <li key={to} className="flex-1">
            <NavLink to={to} className="flex flex-col items-center gap-1 pb-2">
              {({ isActive }) =>
                featured ? (
                  <>
                    <span className="-mt-7 grid h-14 w-14 place-items-center rounded-full bg-pulse text-ink-950 shadow-glow ring-4 ring-bg">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className={`text-[11px] font-medium ${isActive ? 'text-fg' : 'text-muted'}`}>{short}</span>
                  </>
                ) : (
                  <>
                    <span className="relative grid h-8 w-12 place-items-center">
                      {isActive && (
                        <m.span
                          layoutId="bottom-active"
                          className="absolute inset-0 rounded-full bg-accent/15"
                          transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                        />
                      )}
                      <Icon className={`relative h-5 w-5 ${isActive ? 'text-accent' : 'text-muted'}`} />
                    </span>
                    <span className={`text-[11px] font-medium ${isActive ? 'text-fg' : 'text-muted'}`}>{short}</span>
                  </>
                )
              }
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-8 pt-4 text-sm text-muted sm:px-6 lg:px-10 lg:pb-10">
      <div className="flex flex-col items-start justify-between gap-3 border-t border-line/[0.06] pt-6 sm:flex-row sm:items-center">
        <Logo size="sm" />
        <p>© {new Date().getFullYear()} PulseFit. Train smarter. Get stronger.</p>
      </div>
    </footer>
  )
}

export default function AppLayout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="min-h-dvh pb-24 lg:pb-0 lg:pl-64">
      <Sidebar />
      <MobileTopBar />
      <Outlet />
      <Footer />
      <BottomNav />
    </div>
  )
}
