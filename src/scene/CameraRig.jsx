import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { dragState } from '../lib/dragState'

const MIN_Z = 14
const MAX_Z = 95
const PAN_X = 75
const PAN_Y = 48

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// drag to pan (with release inertia), wheel to zoom toward the cursor
export default function CameraRig() {
  const { camera, gl } = useThree()
  const target = useRef({ x: 0, y: 0, z: 58 })
  const vel = useRef({ x: 0, y: 0 })
  const drag = useRef(null)

  useEffect(() => {
    const el = gl.domElement
    const halfH = () => Math.tan((camera.fov * Math.PI) / 360)
    const worldPerPixel = (z) => (2 * halfH() * z) / el.clientHeight

    const onDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      drag.current = { x: e.clientX, y: e.clientY, t: performance.now() }
      dragState.dist = 0
      vel.current.x = 0
      vel.current.y = 0
    }
    const onMove = (e) => {
      if (!drag.current) return
      const now = performance.now()
      const dx = e.clientX - drag.current.x
      const dy = e.clientY - drag.current.y
      dragState.dist += Math.abs(dx) + Math.abs(dy)
      const wpp = worldPerPixel(target.current.z)
      target.current.x -= dx * wpp
      target.current.y += dy * wpp
      const dt = Math.max(now - drag.current.t, 1) / 1000
      vel.current.x = 0.7 * vel.current.x + 0.3 * ((-dx * wpp) / dt)
      vel.current.y = 0.7 * vel.current.y + 0.3 * ((dy * wpp) / dt)
      drag.current = { x: e.clientX, y: e.clientY, t: now }
    }
    const onUp = () => {
      drag.current = null
    }
    const onWheel = (e) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1
      const hh = halfH()
      const hw = hh * (rect.width / rect.height)
      const t = target.current
      // world point under the cursor stays fixed while zooming
      const wx = t.x + ndcX * hw * t.z
      const wy = t.y + ndcY * hh * t.z
      t.z = clamp(t.z * Math.exp(e.deltaY * 0.0011), MIN_Z, MAX_Z)
      t.x = wx - ndcX * hw * t.z
      t.y = wy - ndcY * hh * t.z
    }

    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      el.removeEventListener('wheel', onWheel)
    }
  }, [gl, camera])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const t = target.current
    if (!drag.current) {
      t.x += vel.current.x * dt
      t.y += vel.current.y * dt
      const decay = Math.exp(-3.2 * dt)
      vel.current.x *= decay
      vel.current.y *= decay
    }
    t.x = clamp(t.x, -PAN_X, PAN_X)
    t.y = clamp(t.y, -PAN_Y, PAN_Y)
    const k = 1 - Math.exp(-9 * dt)
    camera.position.x += (t.x - camera.position.x) * k
    camera.position.y += (t.y - camera.position.y) * k
    camera.position.z += (t.z - camera.position.z) * k
  })

  return null
}
