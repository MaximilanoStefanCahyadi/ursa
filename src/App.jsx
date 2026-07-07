import { useMemo, useState } from 'react'
import data from './data/projects.json'
import { computeSky } from './lib/layout'
import SkyCanvas from './scene/SkyCanvas'
import Placard from './ui/Placard'
import Hud from './ui/Hud'
import FilterBar from './ui/FilterBar'

export default function App() {
  const sky = useMemo(() => computeSky(data), [])
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState({ category: 'all', year: 'all' })
  const [showExperience, setShowExperience] = useState(false)

  return (
    <div className="app">
      <SkyCanvas
        sky={sky}
        onSelect={setSelected}
        filter={filter}
        showExperience={showExperience}
      />
      <Hud sky={sky} showExperience={showExperience} />
      <FilterBar
        sky={sky}
        filter={filter}
        setFilter={setFilter}
        showExperience={showExperience}
        setShowExperience={setShowExperience}
      />
      {selected && <Placard project={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
