import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { LazyMotion, domMax } from 'framer-motion'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { WorkoutProvider } from './context/WorkoutContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Lighter framer-motion runtime: m.* components + the features we use (incl. layout animations) */}
    <LazyMotion features={domMax} strict>
    <HashRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <WorkoutProvider>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </WorkoutProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </HashRouter>
    </LazyMotion>
  </React.StrictMode>,
)
