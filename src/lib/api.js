import { useCallback, useEffect, useRef, useState } from 'react'

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
const SERVER_DOWN = 'We can’t reach the PulseFit server. Make sure “npm run dev” is running, then try again.'

// All database access goes through /api — the frontend never sees a connection string.
export async function api(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Timezone': TIME_ZONE },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(SERVER_DOWN, 0, 'NETWORK')
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    /* empty or non-JSON body */
  }

  if (!res.ok) {
    if (!data && res.status >= 500) throw new ApiError(SERVER_DOWN, res.status, 'NETWORK')
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status, data?.code)
  }
  return data
}

// Fetch-on-mount helper: { data, error, loading, reload, setData }
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const alive = useRef(true)

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await api(path)
      if (alive.current) setState({ data, error: null, loading: false })
    } catch (error) {
      if (alive.current) setState((s) => ({ ...s, error, loading: false }))
    }
  }, [path])

  useEffect(() => {
    alive.current = true
    reload()
    return () => {
      alive.current = false
    }
  }, [reload])

  const setData = useCallback((fn) => setState((s) => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn })), [])
  return { ...state, reload, setData }
}
