export default function GalleryHud({ aimed, onExit }) {
  return (
    <>
      <button className="gallery-exit" onClick={onExit}>
        ← return to the sky
      </button>
      <div className="crosshair" aria-hidden="true">
        <span className={aimed ? 'aiming' : ''} />
      </div>
      <div className="gallery-hint">
        {aimed
          ? `click to inspect — ${aimed.title}`
          : 'click to look around · WASD to walk · Esc frees the cursor'}
      </div>
    </>
  )
}
