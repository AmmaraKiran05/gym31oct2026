import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import { Page, Skeleton, SkeletonCard } from './components/ui.jsx'
import Landing from './pages/Landing.jsx'
// Login/sign-up are tiny and on the first-visit path, so they ship with the landing page.
import { Login, Signup } from './pages/Auth.jsx'

// Every other screen loads on first visit, so the landing page doesn't download charts, confetti, etc.
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Library = lazy(() => import('./pages/Library.jsx'))
const LiveWorkout = lazy(() => import('./pages/LiveWorkout.jsx'))
const Progress = lazy(() => import('./pages/Progress.jsx'))
const Classes = lazy(() => import('./pages/Classes.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

function PageFallback() {
  return (
    <Page>
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mt-3 h-10 w-72 max-w-full" />
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <SkeletonCard className="lg:col-span-2" lines={4} />
        <SkeletonCard lines={3} />
      </div>
    </Page>
  )
}

const guard = (el) => <RequireAuth>{el}</RequireAuth>
const lazyPage = (el) => <Suspense fallback={<PageFallback />}>{el}</Suspense>

export default function App() {
  return (
    <div className="ambient min-h-dvh">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={guard(lazyPage(<Dashboard />))} />
          <Route path="/workouts" element={guard(lazyPage(<Library />))} />
          <Route path="/live" element={guard(lazyPage(<LiveWorkout />))} />
          <Route path="/profile" element={guard(lazyPage(<Profile />))} />
          <Route path="/progress" element={lazyPage(<Progress />)} />
          <Route path="/classes" element={lazyPage(<Classes />)} />
          <Route path="*" element={lazyPage(<NotFound />)} />
        </Route>
      </Routes>
    </div>
  )
}
