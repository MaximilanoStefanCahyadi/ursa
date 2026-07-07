import { useEffect, useState } from 'react'

export default function GalleryHud({ aimed, onExit }) {
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    const sync = () => setLocked(!!document.pointerLockElement)
    document.addEventListener('pointerlockchange', sync)
    sync()
    return () => document.removeEventListener('pointerlockchange', sync)
  }, [])

  return (
    <>
      <button className="gallery-exit" onClick={onExit}>
        ← return to the sky
      </button>
      {locked && (
        <div className="crosshair" aria-hidden="true">
          <span className={aimed ? 'aiming' : ''} />
        </div>
      )}
      <div className="gallery-hint">
        {locked
          ? aimed
            ? `click to inspect — ${aimed.title}`
            : 'WASD to walk · aim a painting to inspect · Shift frees the cursor'
          : 'click or press Shift to look around · WASD to walk'}
      </div>
    </>
  )
}
