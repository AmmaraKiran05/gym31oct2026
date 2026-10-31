import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { expectNoHorizontalScroll, PASSWORD, signUpViaApi, uniqueEmail, watchConsole } from './helpers.js'

const PUBLIC_PAGES = ['/', '/#/login', '/#/signup', '/#/classes', '/#/progress', '/#/nope']
const PRIVATE_PAGES = ['/#/dashboard', '/#/workouts', '/#/live', '/#/profile']

async function settle(page) {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1600) // let entrance animations and counters finish
}

async function axe(page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  return results.violations.map((v) => `${v.id}: ${v.help} — ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)
}

for (const theme of ['dark', 'light']) {
  test.describe(`quality checks (${theme} theme)`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('pulsefit-theme', t), theme)
    })

    test('public pages: clean console, no sideways scroll, no accessibility violations', async ({ page }) => {
      for (const path of PUBLIC_PAGES) {
        const problems = watchConsole(page)
        await page.goto(path)
        await settle(page)
        expect(problems, `console on ${path}`).toEqual([])
        await expectNoHorizontalScroll(page)
        expect(await axe(page), `axe on ${path}`).toEqual([])
      }
    })

    test('logged-in pages: clean console, no sideways scroll, no accessibility violations', async ({ page }, testInfo) => {
      await signUpViaApi(page, uniqueEmail(testInfo.project.name, `quality-${theme}`))
      // give the Live page something to show
      const ex = await (await page.request.get('/api/exercises?muscle_group=Core')).json()
      await page.request.post('/api/workouts', { data: { exerciseId: ex.exercises[0].id } })

      for (const path of PRIVATE_PAGES) {
        const problems = watchConsole(page)
        await page.goto(path)
        await settle(page)
        expect(problems, `console on ${path}`).toEqual([])
        await expectNoHorizontalScroll(page)
        expect(await axe(page), `axe on ${path}`).toEqual([])
      }
    })
  })
}

test('every button and link has a readable name; images have alt text', async ({ page }, testInfo) => {
  await signUpViaApi(page, uniqueEmail(testInfo.project.name, 'names'))
  for (const path of ['/', ...PRIVATE_PAGES, '/#/classes', '/#/progress']) {
    await page.goto(path)
    await settle(page)
    const unnamed = await page.evaluate(() =>
      [...document.querySelectorAll('button, a[href], [role="button"], [role="tab"], [role="radio"], [role="switch"]')]
        .filter((el) => el.getClientRects().length)
        .filter((el) => !(el.getAttribute('aria-label') || el.textContent.trim() || el.getAttribute('title')))
        .map((el) => el.outerHTML.slice(0, 120)),
    )
    expect(unnamed, `unnamed controls on ${path}`).toEqual([])
    const noAlt = await page.evaluate(() => [...document.querySelectorAll('img:not([alt])')].map((i) => i.src))
    expect(noAlt, `images without alt on ${path}`).toEqual([])
  }
})

test.describe('keyboard', () => {
  test('tab to "Start Your Workout" and press Enter', async ({ page }) => {
    await page.goto('/')
    await settle(page)
    let found = false
    for (let i = 0; i < 25 && !found; i++) {
      await page.keyboard.press('Tab')
      found = await page.evaluate(() => document.activeElement?.textContent?.includes('Start Your Workout'))
    }
    expect(found, 'Start Your Workout is reachable with Tab').toBe(true)
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle)
    expect(outline, 'focused element shows a focus ring').not.toBe('none')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#\/signup$/)
  })

  test('log in with only the keyboard, then tick a set with Space', async ({ page }, testInfo) => {
    const email = uniqueEmail(testInfo.project.name, 'keyboard')
    await signUpViaApi(page, email)
    const ex = await (await page.request.get('/api/exercises?muscle_group=Arms')).json()
    await page.request.post('/api/workouts', { data: { exerciseId: ex.exercises[0].id } })
    await page.request.post('/api/auth/logout')

    await page.goto('/#/login')
    await settle(page)
    await page.getByLabel('Email').focus()
    await page.keyboard.type(email)
    await page.keyboard.press('Tab')
    await page.keyboard.type(PASSWORD)
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#\/dashboard$/)

    await page.goto('/#/live')
    // aria-label changes to "... set 1, done" once ticked, so match both forms
    const firstSet = page.getByRole('button', { name: /set 1(, done)?$/ }).first()
    await firstSet.focus()
    await page.keyboard.press('Space')
    await expect(firstSet).toHaveAttribute('aria-pressed', 'true')
    await expect(firstSet).toBeFocused()
  })
})
