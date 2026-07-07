export function parseDates(dates) {
  const years = (String(dates).match(/\d{4}/g) || []).map(Number)
  const start = years.length ? years[0] : null
  const ongoing = /present/i.test(dates)
  const end = ongoing ? null : years[1] !== undefined ? years[1] : start
  return { start, end, ongoing }
}

// deterministic string hash -> [0, 1)
export function hash01(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}
