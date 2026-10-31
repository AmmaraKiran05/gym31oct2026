import { LayoutDashboard, Dumbbell, Timer, TrendingUp, CalendarDays, User } from 'lucide-react'

export const navItems = [
  { to: '/dashboard', label: 'Dashboard', short: 'Home', icon: LayoutDashboard },
  { to: '/workouts', label: 'Workouts', short: 'Library', icon: Dumbbell },
  { to: '/live', label: 'Live Workout', short: 'Live', icon: Timer, featured: true },
  { to: '/progress', label: 'Progress', short: 'Progress', icon: TrendingUp },
  { to: '/classes', label: 'Classes', short: 'Classes', icon: CalendarDays },
  { to: '/profile', label: 'Profile', short: 'Profile', icon: User },
]
