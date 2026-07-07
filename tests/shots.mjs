// Capture visual states for review:  node tests/shots.mjs <outDir>
import { chromium } from 'playwright'

const dir = process.argv[2]
const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ headless: true }))
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
await page.goto('http://localhost:5173')
await page.waitForSelector('.sky-canvas canvas')
await page.waitForTimeout(1500)
await page.screenshot({ path: dir + '/sky.png' })

// filter panel open with a category selected (dimming visible)
await page.locator('.filter-toggle').click()
await page.waitForTimeout(700)
await page.locator('.filter-chip', { hasText: 'Machine Learning' }).first().evaluate((el) => el.click())
await page.waitForTimeout(900)
await page.screenshot({ path: dir + '/filtered.png' })
await page.locator('.filter-chip').first().evaluate((el) => el.click())
await page.mouse.click(1150, 650)
await page.waitForTimeout(500)

// experience layer on
await page.locator('.layer-toggle').click()
await page.waitForTimeout(1000)
await page.screenshot({ path: dir + '/experience.png' })

// experience placard
const slc = await page.evaluate(async () => {
  const { computeSky } = await import('/src/lib/layout.js')
  const data = (await import('/src/data/projects.json')).default
  const n = computeSky(data).experienceNodes.find((n) => n.id === 'slc-lab-assistant')
  const hh = Math.tan((55 * Math.PI) / 360), hw = hh * (innerWidth / innerHeight)
  return { x: Math.round(((n.x / (hw * 58)) + 1) / 2 * innerWidth), y: Math.round((1 - n.y / (hh * 58)) / 2 * innerHeight) }
})
await page.mouse.click(slc.x, slc.y)
await page.waitForSelector('.placard')
await page.waitForTimeout(600)
await page.screenshot({ path: dir + '/exp-placard.png' })
await browser.close()
console.log('done')
