import { useEffect, useState } from 'react'

export default function Placard({ project, onClose }) {
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    setImgFailed(false)
  }, [project])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!project) return null

  const { links = {} } = project
  const isExperience = project.kind === 'experience'
  const image = isExperience ? project.photo : project.screenshot

  return (
    <div className="placard-backdrop" onClick={onClose}>
      <article className="placard" onClick={(e) => e.stopPropagation()}>
        <button className="placard-close" onClick={onClose} aria-label="Close exhibit">
          ×
        </button>
        <div className="placard-frame">
          {!imgFailed && image ? (
            <img
              src={image}
              alt={isExperience ? project.title : `Screenshot of ${project.title}`}
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="placard-noimg">
              <span>✦</span>
              <p>exhibit image coming soon</p>
            </div>
          )}
        </div>
        <div className="placard-body">
          <div className="placard-plaque">
            <h2>{project.title}</h2>
            <div className="placard-meta">
              <span className="placard-dates">{project.dates}</span>
              {isExperience ? (
                <span className="status-badge experience">☾ experience</span>
              ) : (
                <span className={`status-badge ${project.status}`}>
                  {project.status === 'ongoing' ? (
                    <>
                      <span className="pulse-star">✦</span> in progress
                    </>
                  ) : (
                    <>● live</>
                  )}
                </span>
              )}
            </div>
          </div>
          {project.shortDescription && <p className="placard-desc">{project.shortDescription}</p>}
          {isExperience && project.description && (
            <p className="placard-desc">{project.description}</p>
          )}
          {project.story && <p className="placard-story">{project.story}</p>}
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
      </article>
    </div>
  )
}
