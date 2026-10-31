import { Component } from 'react'
import { RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('PulseFit crashed:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="glass max-w-md p-8 text-center">
          <p className="text-5xl">😮‍💨</p>
          <h1 className="mt-4 text-2xl font-bold">We dropped the bar.</h1>
          <p className="mt-2 text-muted">
            Something went wrong on our side. Your progress is safe — give it another rep.
          </p>
          <button className="btn-primary mt-6" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" /> Reload PulseFit
          </button>
        </div>
      </div>
    )
  }
}
