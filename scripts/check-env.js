// Makes sure .env exists with JWT_SECRET and DATABASE_URL before anything talks to the database.
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const ENV_PATH = new URL('../.env', import.meta.url)

let text = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, 'utf8') : ''
const read = (key) => text.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim().replace(/^["']|["']$/g, '')

if (!read('JWT_SECRET')) {
  const secret = randomBytes(48).toString('base64url')
  text = /^JWT_SECRET=.*$/m.test(text)
    ? text.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${secret}`)
    : `${text.trimEnd()}${text.trim() ? '\n' : ''}JWT_SECRET=${secret}\n`
  writeFileSync(ENV_PATH, text)
  console.log('✔ Generated a strong JWT_SECRET and saved it to .env')
}

if (!read('DATABASE_URL')) {
  if (!/^DATABASE_URL=/m.test(text)) {
    text = `DATABASE_URL=\n${text}`
    writeFileSync(ENV_PATH, text)
  }
  console.error(`
✖ DATABASE_URL is missing from .env

  For a local database on this computer, use:
    DATABASE_URL=postgresql://postgres:choose-a-password@127.0.0.1:5433/pulsefit

  For Neon, here's where to find it:
    1. Go to https://console.neon.tech and open your project (create a free one if needed).
    2. Click the "Connect" button on the Project Dashboard.
    3. Leave "Pooled connection" ON, pick the "Connection string" view, and click "Show password".
    4. Copy the string that starts with  postgresql://  and ends with  ?sslmode=require
    5. Paste it into pulsefit/.env so the line reads:
         DATABASE_URL=postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require

  Then run:  npm run db:setup
`)
  process.exit(1)
}
