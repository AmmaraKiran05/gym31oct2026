// Local stand-in for Vercel during "npm run dev".
import 'dotenv/config'
import { createApp } from './app.js'

const PORT = Number(process.env.API_PORT) || 3001

createApp({ hotReload: true }).listen(PORT, '127.0.0.1', () => {
  console.log(`API ready on http://127.0.0.1:${PORT} (proxied at http://localhost:5173/api)`)
})
