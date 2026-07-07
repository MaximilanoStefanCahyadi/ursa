import * as THREE from 'three'

let cached = null
let cachedDot = null

// soft round dot for background points (raw Points render as squares otherwise)
export function getDotTexture() {
  if (cachedDot) return cachedDot
  const size = 32
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  const half = size / 2
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.45, 'rgba(255,255,255,0.5)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  cachedDot = new THREE.CanvasTexture(c)
  return cachedDot
}

// radial glow + 4-point diffraction flare, tinted per star via material color
export function getStarTexture() {
  if (cached) return cached
  const size = 128
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  const half = size / 2

  const grad = ctx.createRadialGradient(half, half, 0, half, half, half)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.15, 'rgba(255,255,255,0.85)')
  grad.addColorStop(0.4, 'rgba(255,255,255,0.22)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  ctx.globalCompositeOperation = 'lighter'
  const flare = (angle) => {
    ctx.save()
    ctx.translate(half, half)
    ctx.rotate(angle)
    const g = ctx.createLinearGradient(-half, 0, half, 0)
    g.addColorStop(0, 'rgba(255,255,255,0)')
    g.addColorStop(0.5, 'rgba(255,255,255,0.9)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(-half * 0.95, -1.5, half * 1.9, 3)
    ctx.restore()
  }
  flare(0)
  flare(Math.PI / 2)

  cached = new THREE.CanvasTexture(c)
  return cached
}
