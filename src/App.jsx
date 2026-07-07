import { useMemo, useState } from 'react'
import data from './data/projects.json'
import { computeSky } from './lib/layout'
import SkyCanvas from './scene/SkyCanvas'
import Placard from './ui/Placard'
import Hud from './ui/Hud'

export default function App() {
  const sky = useMemo(() => computeSky(data.projects), [])
  const [selected, setSelected] = useState(null)

  return (
    <div className="app">
      <SkyCanvas sky={sky} onSelect={setSelected} />
      <Hud legend={sky.clusters} />
      {selected && <Placard project={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
