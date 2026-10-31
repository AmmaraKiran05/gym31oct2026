// Runs Lighthouse against the running test stack (scripts/test-stack.js) and prints median scores.
// Usage: node scripts/lighthouse.js [label] [--runs=3] [--desktop]
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const label = args.find((a) => !a.startsWith('--')) || 'run'
const runs = Number(args.find((a) => a.startsWith('--runs='))?.split('=')[1]) || 3
const desktop = args.includes('--desktop')
// --cpu=1 calibrates the mobile CPU slowdown for a slow test machine (see Lighthouse's throttling docs).
const cpu = args.find((a) => a.startsWith('--cpu='))?.split('=')[1]
const BASE = `http://127.0.0.1:${Number(process.env.E2E_WEB_PORT) || 4174}`
const pages = { Landing: '/', Login: '/#/login', 'Sign up': '/#/signup' }
const outDir = 'test-results/lighthouse'
mkdirSync(outDir, { recursive: true })

const CATS = { Performance: 'performance', Accessibility: 'accessibility', 'Best Practices': 'best-practices', SEO: 'seo' }
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]

const summary = {}
for (const [name, path] of Object.entries(pages)) {
  const scores = Object.fromEntries(Object.keys(CATS).map((k) => [k, []]))
  let failing = []
  for (let i = 1; i <= runs; i++) {
    const out = `${outDir}/${label}-${name.replace(/\s+/g, '').toLowerCase()}-${i}.json`
    execFileSync(
      process.execPath,
      [
        'node_modules/lighthouse/cli/index.js',
        BASE + path,
        `--chrome-path=${chromium.executablePath()}`,
        '--chrome-flags=--headless=new --no-sandbox',
        `--only-categories=${Object.values(CATS).join(',')}`,
        ...(desktop ? ['--preset=desktop'] : []),
        ...(cpu ? [`--throttling.cpuSlowdownMultiplier=${cpu}`] : []),
        '--output=json',
        `--output-path=${out}`,
        '--quiet',
      ],
      { stdio: 'inherit' },
    )
    const report = JSON.parse(readFileSync(out, 'utf8'))
    for (const [k, id] of Object.entries(CATS)) scores[k].push(Math.round(report.categories[id].score * 100))
    if (i === runs) {
      failing = Object.values(report.audits)
        .filter((a) => a.score !== null && a.score < 0.9 && !['informative', 'manual', 'notApplicable'].includes(a.scoreDisplayMode))
        .map((a) => `${a.id} (${Math.round(a.score * 100)})`)
    }
  }
  summary[name] = { ...Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, median(v)])), runs: scores.Performance.join('/'), failing }
}

console.log(`\nLighthouse ${desktop ? 'desktop' : `mobile${cpu ? ` (CPU slowdown ${cpu}x)` : ''}`} — median of ${runs} run(s)`)
console.table(Object.fromEntries(Object.entries(summary).map(([k, { failing, ...v }]) => [k, v])))
for (const [k, v] of Object.entries(summary)) console.log(`${k} audits below 90 (last run): ${v.failing.join(', ') || 'none'}`)
writeFileSync(`${outDir}/${label}-summary.json`, JSON.stringify(summary, null, 2))
