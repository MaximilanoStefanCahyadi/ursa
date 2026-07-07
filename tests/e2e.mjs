// Phase 1 + 2 end-to-end smoke test for the constellation sky.
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
    const sky = computeSky(data)
    const fov = 55
    const z = 58
    const hh = Math.tan((fov * Math.PI) / 360)
    const hw = hh * (innerWidth / innerHeight)
    const project = (n) => ({
      x: Math.round(((n.x / (hw * z)) + 1) / 2 * innerWidth),
      y: Math.round((1 - n.y / (hh * z)) / 2 * innerHeight),
      title: n.title,
    })
    return Object.fromEntries(
      [...sky.projectNodes, ...sky.experienceNodes].map((n) => [n.id, project(n)]),
    )
  })
}

const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ headless: true }))
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(String(e)))
await page.goto(BASE)
await page.waitForSelector('.sky-canvas canvas')
await page.waitForTimeout(1200) // let the camera settle

const stars = await starPositions(page)
const anzen = stars['anzen-smart-door']
const research = stars['attention-recovery-research']
const ngomongaja = stars['ngomongaja']
const slc = stars['slc-lab-assistant']

// ---------- Phase 1 regressions ----------

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
check('placard shows live + github links', (await page.locator('.placard-links a').count()) === 2)

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

// 5. new project star (NgomongAja, 2026 – Present)
await page.mouse.click(ngomongaja.x, ngomongaja.y)
await page.waitForSelector('.placard', { timeout: 3000 })
check(
  'NgomongAja placard opens as ongoing',
  (await page.locator('.placard h2').textContent()) === 'NgomongAja' &&
    (await page.locator('.status-badge.ongoing').count()) === 1,
)
check('NgomongAja screenshot renders', (await page.locator('.placard-frame img').count()) === 1)
await page.keyboard.press('Escape')
await page.waitForTimeout(300)

// ---------- Phase 2: filter dropdown ----------

// 6. dropdown opens with constellation + period sections
await page.locator('.filter-toggle').click()
await page.waitForSelector('.filter-panel', { timeout: 2000 })
const chipTexts = await page.locator('.filter-chip').allTextContents()
check(
  'filter panel lists categories and years',
  chipTexts.includes('Machine Learning') && chipTexts.includes('2026') && chipTexts.includes('2024'),
  chipTexts.join(', '),
)

// framer-motion whileHover keeps chips "unstable" for Playwright's
// actionability check — click them directly in the DOM instead
const clickChip = (text) =>
  page
    .locator('.filter-chip', { hasText: text })
    .first()
    .evaluate((el) => el.click())

// 7. selecting a category dims other constellation labels
await clickChip('Machine Learning')
await page.waitForTimeout(700)
const iotDim = await page
  .locator('.cluster-label', { hasText: 'IoT' })
  .evaluate((el) => el.classList.contains('dim'))
const mlDim = await page
  .locator('.cluster-label', { hasText: 'Machine Learning' })
  .evaluate((el) => el.classList.contains('dim'))
check('category filter dims non-matching labels', iotDim && !mlDim)

// 8. dimmed star no longer opens a placard
await page.mouse.click(1150, 650) // empty sky: close the panel first so it can't swallow the click
await page.waitForTimeout(400)
await page.mouse.click(anzen.x, anzen.y)
await page.waitForTimeout(400)
check('dimmed star is not clickable', (await page.locator('.placard').count()) === 0)

// 9. reset to All restores
await page.locator('.filter-toggle').click()
await page.waitForSelector('.filter-panel')
await page.waitForTimeout(600) // let the entrance animation settle
await clickChip('All') // "All" constellation
await page.waitForTimeout(500)
const iotDimAfter = await page
  .locator('.cluster-label', { hasText: 'IoT' })
  .evaluate((el) => el.classList.contains('dim'))
check('reset filter undims labels', !iotDimAfter)
await page.mouse.click(640, 60) // close panel on empty sky
await page.waitForTimeout(300)

// ---------- Phase 2: experience layer ----------

// 10. toggle shows the experience constellation
check('experience label hidden before toggle', await page
  .locator('.cluster-label.experience')
  .evaluate((el) => el.classList.contains('hidden')))
await page.locator('.layer-toggle').click()
await page.waitForTimeout(800)
check('layer toggle turns on', await page.locator('.layer-toggle.on').count() === 1)
check('experience label appears', await page
  .locator('.cluster-label.experience')
  .evaluate((el) => !el.classList.contains('hidden')))
const legend = await page.locator('.legend-item').allTextContents()
check('legend gains Experience entry', legend.some((t) => t.includes('Experience')), legend.join(', '))

// 11. experience star opens an experience placard
await page.mouse.click(slc.x, slc.y)
await page.waitForSelector('.placard', { timeout: 3000 })
const expTitle = await page.locator('.placard h2').textContent()
check('experience placard opens', expTitle.includes('Laboratory Assistant'), expTitle)
check('experience badge shown', (await page.locator('.status-badge.experience').count()) === 1)
check('experience has no tech chips/links', (await page.locator('.tech-chip').count()) === 0 && (await page.locator('.placard-links a').count()) === 0)
check('experience placard has no Enter Gallery', (await page.locator('.enter-gallery').count()) === 0)
check('experience photo renders', (await page.locator('.placard-frame img').count()) === 1)
await page.keyboard.press('Escape')
await page.waitForTimeout(300)

// ---------- Phase 3: gallery ----------

// 12. project placards do get the gallery button
await page.locator('.layer-toggle').click() // layer off again
await page.waitForTimeout(400)
await page.mouse.click(anzen.x, anzen.y)
await page.waitForSelector('.placard', { timeout: 3000 })
check('project placard has Enter Gallery button', (await page.locator('.enter-gallery').count()) === 1)

// 13. warp transition plays, then the gallery room appears
await page.locator('.enter-gallery').click()
check('warp transition starts', (await page.waitForSelector('.warp-canvas', { timeout: 2000 }).then(() => true).catch(() => false)))
await page.waitForSelector('.gallery-canvas canvas', { timeout: 6000 })
check('gallery room renders', true)
check('sky is unmounted in gallery', (await page.locator('.sky-canvas').count()) === 0)
await page.waitForTimeout(1500) // textures + reflector warm-up

// 13b. camera cursor engages automatically; Shift toggles the mouse cursor
const isLocked = () => page.evaluate(() => !!document.pointerLockElement)
check('gallery auto-grabs the camera cursor', await isLocked())
await page.keyboard.press('Shift')
await page.waitForTimeout(300)
check('Shift frees the mouse cursor', !(await isLocked()))
await page.keyboard.press('Shift')
await page.waitForTimeout(400)
check('Shift re-grabs the camera cursor', await isLocked())

// 14. WASD walking moves the camera
const camBefore = await page.evaluate(() => window.__ursaCam)
await page.keyboard.down('w')
await page.waitForTimeout(700)
await page.keyboard.up('w')
await page.waitForTimeout(400)
const camAfter = await page.evaluate(() => window.__ursaCam)
const walked = Math.hypot(camAfter[0] - camBefore[0], camAfter[2] - camBefore[2])
check('WASD walks the camera', walked > 0.8, `moved ${walked.toFixed(2)} units`)

// 15. entered painting is dead ahead: crosshair aims at it
const aimHint = await page.locator('.gallery-hint').textContent()
check('crosshair aims at entered painting', aimHint.includes('Anzen'), aimHint)

// 16. click opens the full inspect overlay (locked or not, both paths converge)
await page.mouse.click(640, 400)
await page.waitForTimeout(500)
if ((await page.locator('.inspect').count()) === 0) {
  // first click only acquired pointer lock — click again through the crosshair
  await page.mouse.click(640, 400)
}
await page.waitForSelector('.inspect', { timeout: 3000 })
const inspectTitle = await page.locator('.inspect h2').textContent()
check('inspect overlay opens for aimed painting', inspectTitle === 'Anzen Smart Door Lock System', inspectTitle)
check('inspect shows fun facts', (await page.locator('.inspect-facts li').count()) === 4)
check('inspect shows story', (await page.locator('.inspect .placard-story').count()) === 1)
check('inspect shows tech chips', (await page.locator('.inspect .tech-chip').count()) === 11)
check('inspect shows live + github links', (await page.locator('.inspect .placard-links a').count()) === 2)

// 17. escape closes the overlay, exit returns to the sky
await page.keyboard.press('Escape')
await page.waitForTimeout(400)
check('escape closes inspect overlay', (await page.locator('.inspect').count()) === 0)
await page.locator('.gallery-exit').click()
await page.waitForSelector('.sky-canvas canvas', { timeout: 4000 })
check('return to the sky works', (await page.locator('.gallery-canvas').count()) === 0)
await page.waitForTimeout(1200) // let the sky camera settle again

// ---------- camera (kept last: pan/zoom invalidate star coords) ----------

const labelX = () => page.locator('.cluster-label').first().evaluate((el) => el.getBoundingClientRect().left)
const beforePan = await labelX()
await page.mouse.move(640, 500)
await page.mouse.down()
await page.mouse.move(840, 500, { steps: 12 })
await page.mouse.up()
await page.waitForTimeout(500)
const afterPan = await labelX()
check('drag pans the sky', Math.abs(afterPan - beforePan) > 40, `moved ${Math.round(afterPan - beforePan)}px`)

await page.waitForTimeout(50)
const glideA = await labelX()
await page.waitForTimeout(350)
const glideB = await labelX()
check('release inertia keeps gliding', Math.abs(glideB - glideA) > 2, `glided ${Math.round(glideB - glideA)}px`)

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

check('no page errors', pageErrors.length === 0, pageErrors.join('; '))

await browser.close()
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
