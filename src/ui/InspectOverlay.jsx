import { useEffect } from 'react'

// full-screen museum overlay: story, fun facts, tech, links (Phase 3 inspect)
export default function InspectOverlay({ project, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!project) return null
  const { links = {} } = project

  return (
    <div className="inspect-backdrop" onClick={onClose}>
      <article className="inspect" onClick={(e) => e.stopPropagation()}>
        <button className="placard-close" onClick={onClose} aria-label="Close inspect view">
          ×
        </button>
        <div className="inspect-columns">
          <div className="inspect-art">
            <img
              src={project.screenshot}
              alt={`Screenshot of ${project.title}`}
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </div>
          <div className="inspect-body">
            <div className="placard-plaque">
              <h2>{project.title}</h2>
              <div className="placard-meta">
                <span className="placard-dates">{project.dates}</span>
                <span className={`status-badge ${project.status}`}>
                  {project.status === 'ongoing' ? (
                    <>
                      <span className="pulse-star">✦</span> in progress
                    </>
                  ) : (
                    <>● live</>
                  )}
                </span>
              </div>
            </div>
            {project.shortDescription && <p className="placard-desc">{project.shortDescription}</p>}
            {project.story && <p className="placard-story">{project.story}</p>}
            {project.funFacts?.length > 0 && (
              <div className="inspect-facts">
                <h3>fun facts</h3>
                <ul>
                  {project.funFacts.map((f) => (
                    <li key={f}>
                      <span className="fact-star">✦</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {project.techStack?.length > 0 && (
              <div className="placard-tech">
                {project.techStack.map((t) => (
                  <span key={t} className="tech-chip">
                    {t}
                  </span>
                ))}
              </div>
            )}
            {(links.github || links.live) && (
              <div className="placard-links">
                {links.live && (
                  <a href={links.live} target="_blank" rel="noreferrer">
                    Visit live ↗
                  </a>
                )}
                {links.github && (
                  <a href={links.github} target="_blank" rel="noreferrer">
                    GitHub ↗
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  )
}
