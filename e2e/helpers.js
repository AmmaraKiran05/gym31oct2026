import { expect } from '@playwright/test'

export const PASSWORD = 'Str0ngPass99'
export const uniqueEmail = (project, tag) =>
  `e2e-${tag}-${project}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}@test.pulsefit.local`

// Collects console errors/warnings and uncaught exceptions for a page.
export function watchConsole(page) {
  const messages = []
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') messages.push(`console.${m.type()}: ${m.text()}`)
  })
  page.on('pageerror', (e) => messages.push(`pageerror: ${e.message}`))
  return messages
}

// Signs up through the API (shares cookies with the page) — fast setup for logged-in checks.
export async function signUpViaApi(page, email, extra = {}) {
  const res = await page.request.post('/api/auth/signup', {
    data: { email, password: PASSWORD, fullName: 'E2E Tester', weeklyGoalWorkouts: 3, weeklyGoalMinutes: 180, ...extra },
  })
  expect(res.status(), await res.text()).toBe(201)
  return (await res.json()).user
}

export async function expectNoHorizontalScroll(page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(scrollWidth, `page is ${scrollWidth}px wide in a ${innerWidth}px viewport`).toBeLessThanOrEqual(innerWidth)
}

// The visible copy of a control (desktop sidebar vs mobile top bar render separate buttons).
export const visible = (locator) => locator.locator('visible=true').first()
