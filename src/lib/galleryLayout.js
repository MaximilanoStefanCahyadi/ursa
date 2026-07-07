// rotunda gallery: one wall per project, entered project's painting dead ahead
export function computeGallery(projects, enteredId) {
  const ordered = [...projects]
  const idx = ordered.findIndex((p) => p.id === enteredId)
  if (idx > 0) {
    const [entered] = ordered.splice(idx, 1)
    ordered.unshift(entered)
  }
  const n = Math.max(ordered.length, 3)
  // walls must be wide enough for a framed painting plus breathing room
  const radius = Math.max(8.5, 5.8 / (2 * Math.sin(Math.PI / n)))
  const apothem = radius * Math.cos(Math.PI / n)
  const height = 5.4

  const paintings = ordered.map((project, i) => {
    const angle = Math.PI + (i * 2 * Math.PI) / n // face 0 sits at -z
    const dx = Math.sin(angle)
    const dz = Math.cos(angle)
    return {
      project,
      position: [dx * apothem, 2.1, dz * apothem],
      rotationY: angle + Math.PI, // local +z points back toward the room center
    }
  })

  return {
    paintings,
    sides: n,
    radius,
    apothem,
    height,
    // cylinder theta offset so wall 0's center faces the spawn direction
    thetaStart: Math.PI - Math.PI / n,
    walkRadius: apothem - 1.5,
  }
}
