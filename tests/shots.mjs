import { chromium } from 'playwright'
const dir = process.argv[2]
const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ headless: true }))
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
await page.goto('http://localhost:5173')
await page.waitForSelector('.sky-canvas canvas')
await page.waitForTimeout(1500)
await page.screenshot({ path: dir + '/sky.png' })
const pos = await page.evaluate(async () => {
  const { computeSky } = await import('/src/lib/layout.js')
  const data = (await import('/src/data/projects.json')).default
  const n = computeSky(data.projects).nodes.find((n) => n.id === 'anzen-smart-door')
  const hh = Math.tan((55 * Math.PI) / 360), hw = hh * (innerWidth / innerHeight)
  return { x: Math.round(((n.x / (hw * 58)) + 1) / 2 * innerWidth), y: Math.round((1 - n.y / (hh * 58)) / 2 * innerHeight) }
})
await page.mouse.click(pos.x, pos.y)
await page.waitForSelector('.placard')
await page.waitForTimeout(600)
await page.screenshot({ path: dir + '/placard.png' })
await browser.close()
console.log('done')
