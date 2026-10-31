import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { ConnectionError, Page, SkeletonCard, Skeleton } from './ui.jsx'

export default function RequireAuth({ children }) {
  const { user, status, error, refresh } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
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
  if (status === 'error') {
    return (
      <Page>
        <ConnectionError error={error} onRetry={refresh} />
      </Page>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
