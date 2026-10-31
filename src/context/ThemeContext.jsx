import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)
const KEY = 'pulsefit-theme'

function readInitial() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* storage unavailable */
  }
  return 'dark'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitial)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#06080B' : '#F3F5EF')
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* storage unavailable */
    }
  }, [theme])

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])

  return <ThemeContext.Provider value={{ theme, toggle, isDark: theme === 'dark' }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
