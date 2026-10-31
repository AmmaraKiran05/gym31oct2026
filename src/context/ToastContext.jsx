import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const styles = {
  success: { icon: CheckCircle2, ring: 'text-accent' },
  error: { icon: AlertTriangle, ring: 'text-rose-400' },
  info: { icon: Info, ring: 'text-cyan-400' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const toast = useCallback(
    ({ title, message, type = 'success', duration = 3200 }) => {
      const id = ++idRef.current
      setToasts((t) => [...t.slice(-2), { id, title, message, type }])
      setTimeout(() => dismiss(id), duration)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-[100] flex flex-col items-center gap-2 px-4 lg:items-end lg:pr-6"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const { icon: Icon, ring } = styles[t.type] ?? styles.info
            return (
              <m.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="glass pointer-events-auto flex w-full max-w-sm items-start gap-3 !rounded-2xl p-4 shadow-soft"
                role="status"
              >
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${ring}`} />
                <div className="min-w-0 flex-1">
                  <p className="font-display font-semibold leading-tight">{t.title}</p>
                  {t.message && <p className="mt-0.5 text-sm text-muted">{t.message}</p>}
                </div>
                <button onClick={() => dismiss(t.id)} className="text-muted hover:text-fg" aria-label="Dismiss">
                  <X className="h-4 w-4" />
                </button>
              </m.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
