import { useCallback, useMemo, useState } from 'react'
import data from './data/projects.json'
import { computeSky } from './lib/layout'
import SkyCanvas from './scene/SkyCanvas'
import GalleryRoom from './scene/gallery/GalleryRoom'
import Placard from './ui/Placard'
import Hud from './ui/Hud'
import FilterBar from './ui/FilterBar'
import WarpTransition from './ui/WarpTransition'
import InspectOverlay from './ui/InspectOverlay'
import GalleryHud from './ui/GalleryHud'

export default function App() {
  const sky = useMemo(() => computeSky(data), [])
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState({ category: 'all', year: 'all' })
  const [showExperience, setShowExperience] = useState(false)
  const [view, setView] = useState('sky') // 'sky' | 'warp' | 'gallery'
  const [galleryEntry, setGalleryEntry] = useState(null)
  const [inspected, setInspected] = useState(null)
  const [aimed, setAimed] = useState(null)

  const enterGallery = useCallback((project) => {
    setSelected(null)
    setGalleryEntry(project)
    setView('warp')
  }, [])

  const inspect = useCallback((project) => {
    document.exitPointerLock?.()
    setInspected(project)
  }, [])

  const exitGallery = useCallback(() => {
    document.exitPointerLock?.()
    setInspected(null)
    setAimed(null)
    setView('sky')
  }, [])

  return (
    <div className="app">
      {view !== 'gallery' && (
        <>
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
          {selected && (
            <Placard
              project={selected}
              onClose={() => setSelected(null)}
              onEnterGallery={enterGallery}
            />
          )}
        </>
      )}
      {view === 'warp' && <WarpTransition onDone={() => setView('gallery')} />}
      {view === 'gallery' && (
        <>
          <GalleryRoom
            projects={data.projects}
            enteredId={galleryEntry?.id}
            onInspect={inspect}
            onAim={setAimed}
            uiOpen={!!inspected}
          />
          <GalleryHud aimed={aimed} onExit={exitGallery} />
          {inspected && <InspectOverlay project={inspected} onClose={() => setInspected(null)} />}
        </>
      )}
    </div>
  )
}
