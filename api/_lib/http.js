// Shared request plumbing for every /api handler (works on Vercel and the local Express server).

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const DB_DOWN = 'We can’t reach the PulseFit database right now. Make sure it’s running (npm run dev starts it) and DATABASE_URL is correct, then try again.'

function isDbUnreachable(err) {
  const text = `${err?.message ?? ''} ${err?.code ?? ''} ${err?.cause?.message ?? ''} ${err?.cause?.code ?? ''}`
  return /fetch failed|ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|getaddrinfo|Error connecting to database|password authentication failed|socket/i.test(text)
}

// route({ GET: async (req, res) => ..., POST: ... })
export function route(handlers) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store')
    const fn = handlers[req.method]
    if (!fn) {
      res.setHeader('Allow', Object.keys(handlers).join(', '))
      return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
    try {
      await fn(req, res)
    } catch (err) {
      if (err instanceof HttpError) return res.status(err.status).json({ error: err.message })
      if (isDbUnreachable(err)) {
        console.error('[api] database unreachable:', err.message)
        return res.status(503).json({ error: DB_DOWN, code: 'DB_UNREACHABLE' })
      }
      console.error(`[api] ${req.method} ${req.url} failed:`, err)
      return res.status(500).json({ error: 'Something went wrong on our side. Please try again.' })
    }
  }
}

export function body(req) {
  const b = req.body
  if (b && typeof b === 'object') return b
  if (typeof b === 'string' && b) {
    try {
      return JSON.parse(b)
    } catch {
      throw new HttpError(400, 'Request body must be valid JSON.')
    }
  }
  return {}
}

export function intParam(value, name) {
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, `${name} must be a positive whole number.`)
  return n
}

// The browser sends its IANA time zone so "today" and "this week" match the user's clock.
export function timeZone(req) {
  const tz = req.headers['x-timezone']
  if (typeof tz === 'string' && tz.length < 64) {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: tz })
      return tz
    } catch {
      /* fall through */
    }
  }
  return 'UTC'
}
