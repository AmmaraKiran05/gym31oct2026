import { expect, test } from '@playwright/test'
import { PASSWORD, uniqueEmail, visible, watchConsole } from './helpers.js'

const GROUPS = ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']

test('full journey: sign up → library → live workout → dashboard → refresh → logout', async ({ page }, testInfo) => {
  test.setTimeout(240_000)
  const problems = watchConsole(page)
  const email = uniqueEmail(testInfo.project.name, 'journey')

  await test.step('sign up and land on the dashboard', async () => {
    await page.goto('/')
    await page.getByRole('link', { name: /Start Your Workout/ }).first().click()
    await page.getByLabel('Your name').fill('Jamie Journey')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
    await page.getByRole('radio', { name: '3' }).click()
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page).toHaveURL(/#\/dashboard$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Jamie')
    await expect(page.getByText('No workout yet today.')).toBeVisible()
  })

  await test.step('library: every muscle-group filter shows the right cards', async () => {
    await visible(page.getByRole('link', { name: /Workouts|Library/ })).click()
    await expect(page).toHaveURL(/#\/workouts$/)
    await expect(page.locator('article')).toHaveCount(30)
    for (const group of GROUPS) {
      await page.getByRole('tab', { name: new RegExp(`^${group}`) }).click()
      await expect(page.locator('article')).toHaveCount(5)
      const labels = await page.locator('article').evaluateAll((cards) => cards.map((c) => c.querySelector('span').textContent))
      expect(labels, `${group} filter`).toEqual(Array(5).fill(group))
    }
    await page.getByRole('tab', { name: /^All/ }).click()
    await expect(page.locator('article')).toHaveCount(30)
  })

  await test.step("add 2 exercises to today's workout", async () => {
    await page.getByRole('tab', { name: /^Chest/ }).click()
    for (const name of ['Barbell Bench Press', 'Incline Dumbbell Press']) {
      const card = page.locator('article').filter({ hasText: name })
      await card.getByRole('button', { name: 'Add to today’s workout' }).click()
      await expect(card.getByRole('button', { name: 'In today’s workout' })).toBeVisible()
    }
    await expect(page.getByText('Added to today’s workout').first()).toBeVisible()
  })

  await test.step('dashboard shows the workout; click Start', async () => {
    await visible(page.getByRole('link', { name: /Dashboard|Home/ })).click()
    await expect(page.getByRole('heading', { name: 'Chest Session' })).toBeVisible()
    await expect(page.getByText('2 exercises · 7 sets')).toBeVisible()
    await page.getByRole('link', { name: 'Start', exact: true }).click()
    await expect(page).toHaveURL(/#\/live$/)
  })

  const setButtons = page.getByRole('button', { name: /set \d/ })

  await test.step('live workout: rest timer counts down', async () => {
    await expect(setButtons).toHaveCount(7)
    await setButtons.first().click()
    // The digits cross-fade, so two copies can briefly exist; the lowest one is the current value.
    const timer = page.locator('main').getByText(/^\d:\d\d$/)
    await expect(timer.first()).toBeVisible()
    const secs = (t) => Number(t.split(':')[0]) * 60 + Number(t.split(':')[1])
    const read = async () => Math.min(...(await timer.allInnerTexts()).map(secs))
    const first = await read()
    await page.waitForTimeout(2200)
    const later = await read()
    expect(first).toBeLessThanOrEqual(90) // bench press rests 90s
    expect(first).toBeGreaterThan(80)
    expect(later, `${first}s -> ${later}s`).toBeLessThan(first)
  })

  await test.step('tick every set, finish, confetti appears', async () => {
    for (let i = 1; i < 7; i++) {
      await setButtons.nth(i).click()
      await expect(setButtons.nth(i)).toHaveAttribute('aria-pressed', 'true')
    }
    await expect(page.getByRole('dialog')).toContainText('Workout crushed!')
    await expect(page.locator('body > canvas')).toHaveCount(1) // canvas-confetti's drawing surface
    await page.getByRole('button', { name: 'Back to dashboard' }).click()
    await expect(page).toHaveURL(/#\/dashboard$/)
  })

  const checkDashboard = async () => {
    await expect(page.getByText('Done for today')).toBeVisible()
    const streak = page.locator('div.glass').filter({ has: page.getByText('Streak', { exact: true }) })
    await streak.scrollIntoViewIfNeeded() // counters animate when they come into view
    await expect(streak).toContainText(/Streak\s*1\s*day in a row/)
    await expect(page.getByText('33% of goal')).toBeVisible() // 1 of 3 workouts
    await expect(page.getByText('0 of 2 weekly goals')).toBeVisible()
    const chart = page.getByRole('img', { name: /Active minutes per day/ })
    const label = await chart.getAttribute('aria-label')
    const minutes = label.split(', ').map((p) => Number(p.split(' ').at(-1)))
    expect(minutes).toHaveLength(7)
    expect(minutes.at(-1), label).toBeGreaterThanOrEqual(1) // today's bar has the workout
    await expect(page.locator('.recharts-bar-rectangle path').last()).toBeVisible()
  }

  await test.step('dashboard updates: streak, chart and rings', checkDashboard)

  await test.step('refresh: data is still there', async () => {
    await page.reload()
    await checkDashboard()
    await page.goto('/#/live')
    await expect(page.getByText('Today’s workout is done ✅')).toBeVisible()
  })

  await test.step('logout, then protected pages redirect to login', async () => {
    await visible(page.getByRole('button', { name: 'Log out' })).click()
    await expect(page).toHaveURL(/#\/$/)
    for (const path of ['/dashboard', '/workouts', '/live']) {
      await page.goto(`/#${path}`)
      await expect(page).toHaveURL(/#\/login$/)
    }
  })

  await test.step('log back in: returns to the page you wanted, same data', async () => {
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page).toHaveURL(/#\/live$/) // the protected page that sent us to login
    await expect(page.getByText('Today’s workout is done ✅')).toBeVisible()
    await visible(page.getByRole('link', { name: /Dashboard|Home/ })).click()
    await checkDashboard()
  })

  expect(problems).toEqual([])
})
