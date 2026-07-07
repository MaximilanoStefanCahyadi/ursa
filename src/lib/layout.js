import { parseDates, hash01 } from './dates'

// vertical band centers assigned to categories in order of first appearance
const BANDS = [13, -14, 2, -24, 22, -5]
const PALETTE = ['#8ed6ff', '#f5c86b', '#c9a2ff', '#8be9b6', '#ff9e9e', '#ffd6a5']

const normTech = (t) => String(t).toLowerCase().split(/\s+/)[0]

export function computeSky(projects) {
  const parsed = projects.map((p) => ({ project: p, ...parseDates(p.dates) }))
  const years = parsed.map((p) => p.start).filter(Boolean)
  const min = Math.min(...years)
  const max = Math.max(...years)
  // 0..1 position on the time axis; centered when all projects share one year
  const tpos = (year) => (max === min ? 0.5 : (year - min) / (max - min))

  const byYear = new Map()
  for (const p of parsed) {
    if (!byYear.has(p.start)) byYear.set(p.start, [])
    byYear.get(p.start).push(p)
  }

  const categories = []
  const nodes = parsed.map((p) => {
    const cat = p.project.category || 'Other'
    if (!categories.includes(cat)) categories.push(cat)
    const ci = categories.indexOf(cat)
    const group = byYear.get(p.start)
    const gi = group.indexOf(p)
    // loose time mapping on x, organic category clusters on y (open sky map)
    const baseX = (tpos(p.start) - 0.5) * 56
    const spread = (gi - (group.length - 1) / 2) * 15
    const jx = (hash01(p.project.id) - 0.5) * 9
    const jy = (hash01(p.project.id + ':y') - 0.5) * 8
    return {
      ...p.project,
      category: cat,
      start: p.start,
      end: p.end,
      ongoing: p.ongoing,
      color: PALETTE[ci % PALETTE.length],
      x: baseX + spread + jx,
      y: BANDS[ci % BANDS.length] + jy,
      size: 1 + hash01(p.project.id + ':s') * 0.5,
    }
  })

  // constellation lines: same-category stars connected in chronological order
  const lines = []
  for (const cat of categories) {
    const stars = nodes
      .filter((n) => n.category === cat)
      .sort((a, b) => a.start - b.start || a.x - b.x)
    for (let i = 0; i < stars.length - 1; i++) {
      lines.push({ a: stars[i], b: stars[i + 1], color: stars[i].color, kind: 'category' })
    }
  }

  // affinity lines: cross-category projects sharing >= 2 technologies
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].category === nodes[j].category) continue
      const a = new Set((nodes[i].techStack || []).map(normTech))
      const shared = new Set((nodes[j].techStack || []).map(normTech).filter((t) => a.has(t)))
      if (shared.size >= 2) {
        lines.push({ a: nodes[i], b: nodes[j], color: '#9db4d8', kind: 'affinity' })
      }
    }
  }

  // constellation (category) label anchors at cluster centroid
  const clusters = categories.map((cat) => {
    const stars = nodes.filter((n) => n.category === cat)
    const cx = stars.reduce((s, n) => s + n.x, 0) / stars.length
    const cy = stars.reduce((s, n) => s + n.y, 0) / stars.length
    return { category: cat, x: cx, y: cy + 4.6, color: stars[0].color }
  })

  const yearTicks = [...byYear.keys()]
    .sort((a, b) => a - b)
    .map((y) => ({ year: y, x: (tpos(y) - 0.5) * 56 }))

  return { nodes, lines, clusters, yearTicks }
}
