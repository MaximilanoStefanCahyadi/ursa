import { parseDates, hash01 } from './dates'

// vertical band centers assigned to project categories in order of first appearance
const BANDS = [11, -12, 2, -20, 17, -6]
const PALETTE = ['#8ed6ff', '#f5c86b', '#c9a2ff', '#8be9b6', '#ff9e9e', '#ffd6a5']

export const EXPERIENCE = 'Experience'
const EXPERIENCE_COLOR = '#ecd9a8'
const EXPERIENCE_BAND = 24

const normTech = (t) => String(t).toLowerCase().split(/\s+/)[0]

export function computeSky(data) {
  const projects = data.projects || []
  const experience = data.experience || []

  const parsedProjects = projects.map((p) => ({ item: p, ...parseDates(p.dates) }))
  const parsedExperience = experience.map((e) => ({ item: e, ...parseDates(e.dates) }))

  // one shared time axis so both layers agree on where a year lives
  const years = [...parsedProjects, ...parsedExperience].map((p) => p.start).filter(Boolean)
  const min = Math.min(...years)
  const max = Math.max(...years)
  // 0..1 position on the time axis; centered when everything shares one year
  const tpos = (year) => (max === min ? 0.5 : (year - min) / (max - min))

  const placeNodes = (parsed, getBand, getColor, kind, spreadStep) => {
    const byYear = new Map()
    for (const p of parsed) {
      if (!byYear.has(p.start)) byYear.set(p.start, [])
      byYear.get(p.start).push(p)
    }
    return parsed.map((p) => {
      const group = byYear.get(p.start)
      const gi = group.indexOf(p)
      const baseX = (tpos(p.start) - 0.5) * 56
      const spread = (gi - (group.length - 1) / 2) * spreadStep
      const jx = (hash01(p.item.id) - 0.5) * 9
      const jy = (hash01(p.item.id + ':y') - 0.5) * 7
      return {
        ...p.item,
        kind,
        category: getBand(p.item),
        start: p.start,
        end: p.end,
        ongoing: p.ongoing || p.item.status === 'ongoing',
        color: getColor(p.item),
        x: baseX + spread + jx,
        y:
          kind === 'experience'
            ? EXPERIENCE_BAND + jy * 0.6
            : BANDS[getBand.index(p.item) % BANDS.length] + jy,
        size: (kind === 'experience' ? 0.85 : 1) + hash01(p.item.id + ':s') * 0.5,
      }
    })
  }

  const categories = []
  const catIndex = (item) => {
    const cat = item.category || 'Other'
    if (!categories.includes(cat)) categories.push(cat)
    return categories.indexOf(cat)
  }
  const projectBand = (item) => item.category || 'Other'
  projectBand.index = catIndex
  const experienceBand = () => EXPERIENCE
  experienceBand.index = () => 0

  const projectNodes = placeNodes(
    parsedProjects,
    projectBand,
    (item) => PALETTE[catIndex(item) % PALETTE.length],
    'project',
    15,
  )
  const experienceNodes = placeNodes(
    parsedExperience,
    experienceBand,
    () => EXPERIENCE_COLOR,
    'experience',
    12,
  )

  // constellation lines: same-category stars connected in chronological order
  const lines = []
  const chain = (stars, color, kind) => {
    const sorted = [...stars].sort((a, b) => a.start - b.start || a.x - b.x)
    for (let i = 0; i < sorted.length - 1; i++) {
      lines.push({ a: sorted[i], b: sorted[i + 1], color, kind })
    }
  }
  for (const cat of categories) {
    const stars = projectNodes.filter((n) => n.category === cat)
    chain(stars, stars[0].color, 'category')
  }

  // affinity lines: cross-category projects sharing >= 2 technologies
  for (let i = 0; i < projectNodes.length; i++) {
    for (let j = i + 1; j < projectNodes.length; j++) {
      if (projectNodes[i].category === projectNodes[j].category) continue
      const a = new Set((projectNodes[i].techStack || []).map(normTech))
      const shared = new Set(
        (projectNodes[j].techStack || []).map(normTech).filter((t) => a.has(t)),
      )
      if (shared.size >= 2) {
        lines.push({ a: projectNodes[i], b: projectNodes[j], color: '#9db4d8', kind: 'affinity' })
      }
    }
  }

  const experienceLines = []
  if (experienceNodes.length > 1) {
    const sorted = [...experienceNodes].sort((a, b) => a.start - b.start || a.x - b.x)
    for (let i = 0; i < sorted.length - 1; i++) {
      experienceLines.push({ a: sorted[i], b: sorted[i + 1], color: EXPERIENCE_COLOR, kind: 'experience' })
    }
  }

  const centroidLabel = (stars, category, color, lift = 4.6) => ({
    category,
    color,
    x: stars.reduce((s, n) => s + n.x, 0) / stars.length,
    y: stars.reduce((s, n) => s + n.y, 0) / stars.length + lift,
  })

  const clusters = categories.map((cat) => {
    const stars = projectNodes.filter((n) => n.category === cat)
    return centroidLabel(stars, cat, stars[0].color)
  })
  const experienceCluster = experienceNodes.length
    ? centroidLabel(experienceNodes, EXPERIENCE, EXPERIENCE_COLOR, 3.3)
    : null

  const yearTicks = [...new Set(years)]
    .sort((a, b) => a - b)
    .map((y) => ({ year: y, x: (tpos(y) - 0.5) * 56 }))

  return {
    projectNodes,
    experienceNodes,
    projectLines: lines,
    experienceLines,
    clusters,
    experienceCluster,
    categories,
    years: [...new Set(years)].sort((a, b) => a - b),
    yearTicks,
  }
}

// does a node survive the current filter?
export function nodeMatches(node, filter) {
  const catOk = filter.category === 'all' || node.category === filter.category
  const yearOk =
    filter.year === 'all' ||
    (node.start <= filter.year && (node.ongoing || (node.end ?? node.start) >= filter.year))
  return catOk && yearOk
}
