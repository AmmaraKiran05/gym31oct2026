import { expect, test } from '@playwright/test'
import { visible, watchConsole } from './helpers.js'

test.describe('Landing page (logged out)', () => {
  test('loads with PulseFit branding everywhere and animated counters', async ({ page }) => {
    const problems = watchConsole(page)
    // Record every number each stat shows, from the very first frame, so the animation can't be missed.
    await page.addInitScript(() => {
      window.__counterValues = {}
      new MutationObserver(() => {
        document.querySelectorAll('dl > div').forEach((div) => {
          const label = div.querySelector('dt')?.textContent
          const value = div.querySelector('dd')?.textContent.trim()
          if (label && /^\d+$/.test(value)) (window.__counterValues[label] ??= []).push(Number(value))
        })
      }).observe(document, { subtree: true, childList: true, characterData: true })
    })
    await page.goto('/')

    await expect(page).toHaveTitle(/PulseFit/)
    await expect(page.locator('header').getByRole('link', { name: 'PulseFit home' })).toContainText('PulseFit')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Train smarter.')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Get stronger.')
    await expect(page.locator('footer')).toContainText('PulseFit')

    // Counters count up from 0 to the live /api/stats values once they scroll into view.
    const stats = await (await page.request.get('/api/stats')).json()
    const classes = page.locator('dl > div').filter({ hasText: 'Classes this week' }).locator('dd')
    // No scrolling: the stats must animate where they first appear, even at the bottom of a phone screen.
    await expect(classes).toHaveText(String(stats.classesThisWeek), { timeout: 8000 })
    const seen = await page.evaluate(() => window.__counterValues['Classes this week'] ?? [])
    expect(stats.classesThisWeek).toBeGreaterThan(0)
    expect(seen.length).toBeGreaterThan(3)
    expect(Math.min(...seen), `counter values seen while animating: ${[...new Set(seen)].join(',')}`).toBeLessThan(
      stats.classesThisWeek,
    )
    expect(seen.at(-1)).toBe(stats.classesThisWeek)
    await expect(page.locator('dl > div').filter({ hasText: 'Members' }).locator('dd')).toHaveText(String(stats.members))
    await expect(page.locator('dl > div').filter({ hasText: 'Workouts completed' }).locator('dd')).toHaveText(
      String(stats.workoutsCompleted),
    )

    expect(problems).toEqual([])
  })

  test('"Start Your Workout" goes to sign up when logged out', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /Start Your Workout/ }).first().click()
    await expect(page).toHaveURL(/#\/signup$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Start your streak.')
  })

  test('protected pages redirect to login when logged out', async ({ page }) => {
    for (const path of ['/dashboard', '/workouts', '/live', '/profile']) {
      await page.goto(`/#${path}`)
      await expect(page, `${path} should redirect`).toHaveURL(/#\/login$/)
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Log in to')
    }
    // public app pages still work without an account
    await page.goto('/#/classes')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('This week’s classes')
    await expect(visible(page.getByRole('link', { name: 'Log in' }))).toBeVisible()
  })
})
