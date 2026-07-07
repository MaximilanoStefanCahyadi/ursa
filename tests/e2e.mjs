// Phase 1 end-to-end smoke test for the constellation sky.
// Run with the dev server up:  node tests/e2e.mjs [baseUrl]
import { chromium } from 'playwright'

const BASE = process.argv[2] || 'http://localhost:5173'
const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

// screen-space star positions, computed from the same layout module the app uses
async function starPositions(page) {
  return page.evaluate(async () => {
    const { computeSky } = await import('/src/lib/layout.js')
    const data = (await import('/src/data/projects.json')).default
    const sky = computeSky(data.projects)
    const fov = 55
    const z = 58
    const hh = Math.tan((fov * Math.PI) / 360)
    const hw = hh * (innerWidth / innerHeight)
    return Object.fromEntries(
      sky.nodes.map((n) => [
        n.id,
        {
          x: Math.round(((n.x / (hw * z)) + 1) / 2 * innerWidth),
          y: Math.round((1 - n.y / (hh * z)) / 2 * innerHeight),
          title: n.title,
        },
      ]),
    )
  })
}

const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ headless: true }))
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
await page.goto(BASE)
await page.waitForSelector('.sky-canvas canvas')
await page.waitForTimeout(1200) // let the camera settle

const stars = await starPositions(page)
const anzen = stars['anzen-smart-door']
const research = stars['attention-recovery-research']

// 1. hover shows the star's name
await page.mouse.move(anzen.x, anzen.y, { steps: 5 })
await page.waitForTimeout(400)
const tooltip = await page.locator('.star-tooltip').textContent().catch(() => null)
check('hover tooltip shows project name', tooltip?.includes('Anzen') ?? false, String(tooltip))

// 2. click opens the museum placard with correct content
await page.mouse.click(anzen.x, anzen.y)
await page.waitForSelector('.placard', { timeout: 3000 })
const title = await page.locator('.placard h2').textContent()
check('placard opens with title', title === 'Anzen Smart Door Lock System', title)
check('placard shows live badge', (await page.locator('.status-badge.live').count()) === 1)
check('placard shows screenshot', (await page.locator('.placard-frame img').count()) === 1)
check('placard tech chips', (await page.locator('.tech-chip').count()) === 11)
check('placard live link only (no empty github)', (await page.locator('.placard-links a').count()) === 1)

// 3. escape closes it
await page.keyboard.press('Escape')
await page.waitForTimeout(300)
check('escape closes placard', (await page.locator('.placard').count()) === 0)

// 4. ongoing project: pulsing badge + graceful missing-image fallback
await page.mouse.click(research.x, research.y)
await page.waitForSelector('.placard', { timeout: 3000 })
check(
  'ongoing project shows in-progress badge',
  (await page.locator('.status-badge.ongoing').count()) === 1 &&
    (await page.locator('.pulse-star').count()) === 1,
)
await page.waitForTimeout(600) // allow img error to fire
check('missing screenshot falls back gracefully', (await page.locator('.placard-noimg').count()) === 1)
await page.locator('.placard-close').click()
await page.waitForTimeout(300)

// 5. drag pans the sky (cluster labels shift)
const labelX = () => page.locator('.cluster-label').first().evaluate((el) => el.getBoundingClientRect().left)
const beforePan = await labelX()
await page.mouse.move(640, 500)
await page.mouse.down()
await page.mouse.move(840, 500, { steps: 12 })
await page.mouse.up()
await page.waitForTimeout(500)
const afterPan = await labelX()
check('drag pans the sky', Math.abs(afterPan - beforePan) > 40, `moved ${Math.round(afterPan - beforePan)}px`)

// 6. inertia: sky keeps gliding briefly after release
await page.waitForTimeout(50)
const glideA = await labelX()
await page.waitForTimeout(350)
const glideB = await labelX()
check('release inertia keeps gliding', Math.abs(glideB - glideA) > 2, `glided ${Math.round(glideB - glideA)}px`)

// 7. wheel zooms (cluster label gap grows)
const gap = () =>
  page.evaluate(() => {
    const l = [...document.querySelectorAll('.cluster-label')]
    return Math.abs(l[0].getBoundingClientRect().left - l[1].getBoundingClientRect().left)
  })
const beforeZoom = await gap()
await page.mouse.move(640, 400)
await page.mouse.wheel(0, -600)
await page.waitForTimeout(700)
const afterZoom = await gap()
check('wheel zooms in', afterZoom > beforeZoom * 1.15, `${Math.round(beforeZoom)} -> ${Math.round(afterZoom)}px`)

// 8. no console errors during the whole run
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
check('no page errors', errors.length === 0, errors.join('; '))

await browser.close()
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
