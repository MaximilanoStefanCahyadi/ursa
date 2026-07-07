export default function Hud({ legend }) {
  return (
    <>
      <header className="hud-title">
        <h1>ursa</h1>
        <p>an outer-space museum of projects</p>
      </header>
      <div className="hud-legend">
        {legend.map((c) => (
          <div key={c.category} className="legend-item">
            <span
              className="legend-dot"
              style={{ background: c.color, boxShadow: `0 0 8px ${c.color}` }}
            />
            {c.category}
          </div>
        ))}
      </div>
      <footer className="hud-hint">
        drag to pan · scroll to zoom · click a star to open its exhibit
      </footer>
    </>
  )
}
