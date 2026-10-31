# PulseFit — Test Report

_Pre-deployment test pass · 24 October 2026 · run on Windows 11, Node 17.8, local PostgreSQL 16_

## Result

| | Total | Passed | Failed |
|---|---:|---:|---:|
| Backend + unit tests (Vitest + Supertest) | 106 | 106 | 0 |
| Browser tests (Playwright: desktop Chrome **and** iPhone-size 375 px) | 22 | 22 | 0 |
| **All tests** | **128** | **128** | **0** |

Production build (`npm run build`): **0 errors, 0 warnings.**

Run everything with one command:

```
npm run test:all
```

| Command | What it runs |
|---|---|
| `npm test` | 106 backend/API + logic tests (~15 s) |
| `npm run test:e2e` | production build, then 22 browser tests on desktop Chrome and a 375 px iPhone screen (~3–4 min) |
| `npm run test:all` | both of the above |
| `npm run lighthouse` | Lighthouse on the public pages (needs `node scripts/test-stack.js` running) |

### Your real data is never touched
- All tests run against a **separate database, `pulsefit_test`**, created automatically on the same local PostgreSQL. Your real `pulsefit` database isn't used.
- Every test signs up its own throwaway users (`vitest-…@test.pulsefit.local`, `e2e-…@test.pulsefit.local`) and deletes them afterwards.
- Checked after the runs: the test database has 0 leftover users, and the real database still has only `test@pulsefit.com` and its 1 workout.
- Browser tests run against a production build served with the real `/api` handlers (`scripts/test-stack.js`), as close to Vercel as possible locally.

---

## What is covered

### API (every route, success and failure)
- **Sign up:** works, sets an httpOnly cookie, and never returns the password hash. It also checks:
  - email is normalised to lowercase;
  - duplicate emails are blocked, even with different capitalisation;
  - empty, short, letters-only, numbers-only, very common and over-long passwords are blocked;
  - bad name, bad email, out-of-range goals and malformed JSON get a 400.
- **Login / logout / me:**
  - The right password logs in. A wrong password and an unknown email give the same message.
  - Logout clears both cookies and ends the session.
  - `/me` returns the user when logged in, and **401 when logged out**. It also returns 401 for a forged token.
  - Wrong HTTP methods get a 405.
- **`/api/stats`:** members, completed workouts and classes this week are whole numbers, and they go up by exactly 1 when a member joins or a workout is completed.
- **`/api/exercises`:** returns all 30 with the right fields. Each of the 6 muscle-group filters returns exactly 5 of that group, and an unknown group gets a 400.
- **`/api/workouts` + `/api/sets`, the full lifecycle:**
  1. Adding the first exercise creates today's workout, with one row per set.
  2. Adding more exercises renames it ("Chest & Back Session"). A duplicate gives 409, an unknown exercise 404, bad input 400.
  3. Exercises can be removed. Start records the start time, and ticking the first set starts the workout automatically.
  4. Sets can be ticked and unticked. Reset unticks everything.
  5. Finishing saves the duration. After that, sets and reset are locked, and finishing twice is harmless.
  6. "Go again" copies the exercises into a fresh workout.
- **Security:**
  - Every protected route returns 401 without a login.
  - Forged, expired and deleted-user tokens are rejected.
  - **User B cannot see, tick, untick, start, finish, reset, copy or remove anything in user A's workout, and vice versa.** A's finished workout never appears in B's stats.

### Streak and stats logic (fake dates)
These were tested twice: as pure functions, and through the real `/api/dashboard` route with workouts inserted on fake dates.

| Situation | Expected streak | Result |
|---|---|---|
| No workouts | 0 | ✅ |
| 3 days in a row (incl. across a month boundary) | 3 | ✅ |
| A missed day | resets (today = 1, best kept) | ✅ |
| Today + yesterday | 2 | ✅ |
| Yesterday only (not trained yet today) | still alive (2) | ✅ |
| Last workout 2+ days ago | 0 | ✅ |
| 2 workouts on the same day | counts as 1 day | ✅ |
| Planned / in-progress workouts | don't count | ✅ |
| Leap year, New Year | correct | ✅ |

- **Weekly chart:** always exactly 7 days, oldest first, ending today, with correct totals. The "vs previous 7 days" figure is `null` (never NaN or Infinity) when there's no earlier data.
- **Progress rings:** 13 edge cases, including a goal of 0, negative values, NaN, `undefined`, text values, Infinity and going over the goal. The ring is always between 0% and 100% and never NaN.

### Browser (desktop Chrome + 375 px iPhone screen)
- **Landing page:**
  - "PulseFit" appears in the navbar, the headline area, the tab title and the footer.
  - The counters really animate from 0 up to the live database values.
  - "Start Your Workout" goes to sign-up when logged out.
- **The full journey, in one continuous run:**
  1. Sign up and land on the Dashboard ("No workout yet today").
  2. In the Library, every muscle-group filter shows exactly its 5 cards.
  3. Add 2 exercises. The Dashboard shows "Chest Session · 2 exercises · 7 sets".
  4. Click Start, and the rest timer counts down from 90 s.
  5. Tick all 7 sets. The finish dialog and confetti appear.
  6. The Dashboard shows a 1-day streak, today's bar in the chart, and rings at 33% of goal and 0 of 2 goals.
  7. **After a page refresh, everything is still there.**
  8. Log out, and Dashboard, Library and Live all redirect to login.
  9. Log back in: you return to the page you wanted, with the same data.
- **Quality, on every page, logged in and out, in both dark and light themes:**
  - no console errors or warnings;
  - no sideways scrolling at 375 px;
  - **0 accessibility violations** (axe-core, WCAG 2.1 A/AA, including colour contrast);
  - every button and link has a readable name, and every image has alt text.
- **Keyboard:**
  - Tab reaches "Start Your Workout", it shows a visible focus ring, and Enter opens it.
  - Log in using only the keyboard, then tick a set with Space.

---

## Bugs found and how each was fixed

| # | Bug | Found by | Fix |
|---|---|---|---|
| 1 | **Login silently failed on a production build served over plain http.** Cookies were marked `Secure` whenever `NODE_ENV=production`, so the browser dropped them and every request after sign-up returned 401. | Browser tests | Cookies are marked `Secure` only when running on Vercel, which is always HTTPS (`api/_lib/auth.js`). |
| 2 | **Landing counters stuck at "0" on phones.** On a 375×635 screen the stats sit at the bottom edge, inside the counter's "−40 px" trigger margin, so they never started unless you scrolled a precise amount. | Browser tests (mobile) | Counters now start when half the number is visible (`AnimatedCounter` in `src/components/ui.jsx`). |
| 3 | **Screen readers mis-announced form fields.** Each `<label>` wrapped the hint text and the "Show password" button, so the password field was read as "Password 8+ characters… Show password". | Browser tests | Each label now names only its input (`htmlFor`), and hints are linked with `aria-describedby`. No visual change (`src/pages/Auth.jsx`). |
| 4 | **Accessibility violation on Classes:** the flame "Intensity" icons used `aria-label` on a plain `<span>`, which isn't allowed. | axe-core | Added `role="img"` so the label is valid (`src/pages/Classes.jsx`). |
| 5 | **`/api/auth/me` returned 200 when logged out** (the spec says 401). | API tests | It now returns 401. A small non-secret `pf_auth` hint cookie lets the app skip that call for visitors who were never logged in, so they don't see a 401 in the console. |
| 6 | **Weak passwords were accepted** (e.g. `aaaaaaaa`, `12345678`). | API tests | New rule: 8–72 characters with at least one letter and one number, and very common passwords are rejected. The sign-up hint text was updated to match. |
| 7 | **Console warnings from the charts library** (`defaultProps` warnings from Recharts 2.12). | Console check | Upgraded Recharts to 2.15. |
| 8 | **Malformed JSON got an HTML error page** instead of a friendly JSON message. | API tests | The local server now answers `400 {"error":"Request body must be valid JSON."}`, matching the handlers. |
| 9 | **Progress rings could show NaN or a broken ring** if a goal was 0 or a value was missing. | Unit tests | New `ringFraction` / `percentOfGoal` helpers clamp to 0–100% and turn bad input into 0 (`src/lib/progress.js`). |
| 10 | **Test database setup failed when PostgreSQL was already running:** the helper skipped creating a missing database. | Test setup | It now always creates the database if it's missing (`scripts/_localdb.js`). |
| 11 | **Landing page slow on phones** (Lighthouse Performance 47 on mobile). | Lighthouse | See the next section. No visual change. |

---

## Lighthouse

Lighthouse can't log in, so it was run on the public pages: Landing, Login and Sign up. Each score is the **median of 3 runs** against the production build.

### Before → after

| Page | Performance (mobile) | Performance (desktop) | Accessibility | Best Practices | SEO |
|---|---|---|---|---|---|
| Landing | 47 → **86** (91 calibrated*) | **98** | 100 → 100 | 100 → 100 | 100 → 100 |
| Login | 51 → **92** (92 calibrated*) | **98** | 100 → 100 | 100 → 100 | 100 → 100 |
| Sign up | 55 → **90** (91 calibrated*) | **97** | 100 → 100 | 100 → 100 | 100 → 100 |

\* **About the mobile numbers.** Lighthouse warned during these runs: *"The tested device appears to have a slower CPU than Lighthouse expects."*
- This computer's CPU benchmark scored **641**. Lighthouse's default mobile test assumes a fast desktop (around 1,300+) and then slows it down 4× to imitate a phone.
- Lighthouse's own throttling guide puts a 641 machine in the "mid-tier mobile" range, which needs no extra CPU slowdown. The **calibrated** column uses that setting (1×, with slow-4G network simulation still on).
- The landing page's raw mobile score varied between 82 and 90 across runs on this machine.
- Desktop scores, which need no calibration, are 97–98.

### What was changed for performance (no visual changes)
1. **Each screen's code now loads only when it's opened.** The landing page's JavaScript dropped from about 230 KB to about 108 KB (gzipped). Dashboard, Library, Live Workout and the rest, plus the charts and confetti libraries, download only when needed.
2. **Google Fonts no longer block the first paint.** They load in parallel, and text stays visible while they arrive.
3. **The two giant background glows** used a 90 px CSS blur, which took seconds to paint on slower devices. They are now soft radial gradients that look the same.
4. **Animated counters** update their digits directly instead of re-rendering React 60 times a second.
5. **Entrance and hover animations** use GPU-accelerated transforms instead of per-frame JavaScript. They look and move exactly the same.
6. **The headline shimmer** starts 2.5 s after load instead of competing with first paint.
7. Framer Motion now uses its lighter "LazyMotion" runtime.

---

## Please check by hand

1. **A real iPhone in Safari.** Mobile tests used Chromium at iPhone size. Safari (WebKit) wasn't available on this Windows machine. Try sign-up, the rest timer, ticking sets, the confetti and the bottom navigation.
2. **PageSpeed Insights after deploying.** Run https://pagespeed.web.dev on the live Vercel URL to get mobile scores from Google's calibrated machines.
3. **Look at the light theme yourself.** It passes contrast checks automatically, but it's worth a quick visual pass on each screen.
4. **Screen reader spot-check.** VoiceOver (iPhone) or NVDA (Windows) on login, sign-up and Live Workout.
5. **Around midnight.** "Today", the streak and the weekly chart use your device's time zone. Finishing a workout just before or after midnight should land on the right day.
6. **On Neon before going live:** run `npm run db:setup` once with your Neon `DATABASE_URL` to create the tables and sample data there.

### Known limitations (not bugs, but worth knowing)
- No password reset and no limit on repeated login attempts yet. Consider adding both before real users sign up.
- The **Classes, Progress and Profile badges** screens still use sample data, as planned. Class bookings aren't saved yet.
- Lighthouse can only test pages that don't need a login.
