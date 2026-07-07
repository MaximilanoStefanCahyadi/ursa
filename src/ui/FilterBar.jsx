import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EXPERIENCE } from '../lib/layout'

const panelVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 420, damping: 30, staggerChildren: 0.035 },
  },
  exit: { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.15 } },
}

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
}

function Chip({ selected, onClick, children, color }) {
  return (
    <motion.button
      className={`filter-chip${selected ? ' selected' : ''}`}
      onClick={onClick}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      style={selected && color ? { borderColor: color, color } : undefined}
    >
      {children}
    </motion.button>
  )
}

export default function FilterBar({
  sky,
  filter,
  setFilter,
  showExperience,
  setShowExperience,
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef()

  useEffect(() => {
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [])

  const categories = [...sky.categories, ...(showExperience ? [EXPERIENCE] : [])]
  const colorOf = (cat) =>
    cat === EXPERIENCE
      ? sky.experienceCluster?.color
      : sky.clusters.find((c) => c.category === cat)?.color

  const summary = [
    filter.category === 'all' ? 'all constellations' : filter.category,
    filter.year === 'all' ? 'all years' : String(filter.year),
  ].join(' · ')

  const toggleExperience = () => {
    const next = !showExperience
    setShowExperience(next)
    if (!next && filter.category === EXPERIENCE) setFilter({ ...filter, category: 'all' })
  }

  return (
    <div className="filter-bar" ref={rootRef}>
      <motion.button
        className={`filter-toggle${open ? ' open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.96 }}
      >
        <span className="filter-icon">✦</span> {summary}
        <motion.span className="filter-caret" animate={{ rotate: open ? 180 : 0 }}>
          ▾
        </motion.span>
      </motion.button>
      <motion.button
        className={`layer-toggle${showExperience ? ' on' : ''}`}
        onClick={toggleExperience}
        whileTap={{ scale: 0.96 }}
      >
        ☾ experience layer
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="filter-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div className="filter-section" variants={rowVariants}>
              <span className="filter-label">constellation</span>
              <div className="filter-chips">
                <Chip
                  selected={filter.category === 'all'}
                  onClick={() => setFilter({ ...filter, category: 'all' })}
                >
                  All
                </Chip>
                {categories.map((cat) => (
                  <Chip
                    key={cat}
                    selected={filter.category === cat}
                    color={colorOf(cat)}
                    onClick={() => setFilter({ ...filter, category: cat })}
                  >
                    {cat}
                  </Chip>
                ))}
              </div>
            </motion.div>
            <motion.div className="filter-section" variants={rowVariants}>
              <span className="filter-label">period</span>
              <div className="filter-chips">
                <Chip
                  selected={filter.year === 'all'}
                  onClick={() => setFilter({ ...filter, year: 'all' })}
                >
                  All
                </Chip>
                {sky.years.map((y) => (
                  <Chip
                    key={y}
                    selected={filter.year === y}
                    onClick={() => setFilter({ ...filter, year: y })}
                  >
                    {y}
                  </Chip>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
