import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { EmptyState, Page } from '../components/ui.jsx'

export default function NotFound() {
  return (
    <Page>
      <EmptyState
        icon={Compass}
        title="This page skipped leg day"
        message="We couldn’t find what you were looking for. Let’s get you back on track."
        action={
          <Link to="/dashboard" className="btn-primary">
            Back to dashboard
          </Link>
        }
      />
    </Page>
  )
}
