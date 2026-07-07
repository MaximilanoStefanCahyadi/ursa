import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'

const EYE = 1.7
const SPEED = 4.2

// WASD + pointer-lock look; while locked, clicks raycast from the crosshair.
// `registry.current` maps project id -> { mesh, project } (filled by Painting).
export default function PlayerControls({ walkRadius, registry, onInspect, onAim, uiOpen }) {
  const { camera, gl } = useThree()
  const keys = useRef({})
  const vel = useRef(new THREE.Vector3())
  const aimed = useRef(null)
  const controlsRef = useRef()
  const uiOpenRef = useRef(uiOpen)
  uiOpenRef.current = uiOpen

  useEffect(() => {
    camera.position.set(0, EYE, 0)
    camera.rotation.set(0, 0, 0) // face -z (the entered painting); R3F leaves the camera looking at the origin, i.e. straight down

    const locked = () => document.pointerLockElement === gl.domElement
    const tryLock = () => {
      if (locked() || uiOpenRef.current) return
      try {
        // three's controls.lock() discards the promise; catch rejections ourselves
        gl.domElement.requestPointerLock()?.catch?.(() => {})
      } catch {
        /* pointer lock unavailable — click-to-inspect fallback still works */
      }
    }

    // camera cursor by default: the Enter Gallery click's user activation
    // is still fresh (the warp runs ~1.5s), so locking here is permitted
    tryLock()

    const down = (e) => {
      keys.current[e.code] = true
      // Shift toggles between camera (locked) and mouse cursor
      if (e.key === 'Shift' && !e.repeat) {
        if (locked()) document.exitPointerLock()
        else tryLock()
      }
    }
    const up = (e) => (keys.current[e.code] = false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)

    const onClick = () => {
      if (locked()) {
        // camera mode: the crosshair is the pointer
        if (aimed.current) onInspect(aimed.current)
        return
      }
      // mouse-cursor mode: clicking the room re-enters camera mode; if the
      // lock is denied (browser policy) fall back to inspecting the aim
      tryLock()
      setTimeout(() => {
        if (!locked() && !uiOpenRef.current && aimed.current) onInspect(aimed.current)
      }, 220)
    }
    gl.domElement.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      gl.domElement.removeEventListener('click', onClick)
    }
  }, [camera, gl, onInspect])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const k = keys.current
    const forward = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0)
    const strafe = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0)

    const dir = new THREE.Vector3()
    camera.getWorldDirection(dir)
    dir.y = 0
    if (dir.lengthSq() < 1e-6) dir.set(0, 0, -1) // looking straight up/down
    dir.normalize()
    const right = new THREE.Vector3().crossVectors(dir, camera.up)

    const accel = new THREE.Vector3()
      .addScaledVector(dir, forward)
      .addScaledVector(right, strafe)
    if (accel.lengthSq() > 0) accel.normalize().multiplyScalar(SPEED)

    const damp = Math.exp(-8 * dt)
    vel.current.multiplyScalar(damp).addScaledVector(accel, 1 - damp)

    camera.position.addScaledVector(vel.current, dt * 2.2)
    camera.position.y = EYE
    // stay inside the rotunda
    const r = Math.hypot(camera.position.x, camera.position.z)
    if (r > walkRadius) {
      camera.position.x *= walkRadius / r
      camera.position.z *= walkRadius / r
    }

    // crosshair aim: painting whose center passes nearest the view ray.
    // miss distance (not raw angle) so aiming stays forgiving up close.
    const entries = Object.values(registry.current)
    const look = new THREE.Vector3()
    camera.getWorldDirection(look)
    let best = null
    let bestMiss = 1.7 // ~painting half-diagonal, world units
    for (const { mesh, project } of entries) {
      const to = mesh.getWorldPosition(new THREE.Vector3()).sub(camera.position)
      const distance = to.length()
      if (distance < 0.8 || distance > 15) continue
      const angle = to.normalize().angleTo(look)
      if (angle > 1.1) continue // behind or far off to the side
      const miss = Math.sin(angle) * distance
      if (miss < bestMiss) {
        bestMiss = miss
        best = project
      }
    }
    if ((best ? best.id : null) !== (aimed.current ? aimed.current.id : null)) {
      aimed.current = best
      onAim(best)
    }

    // debug handle for e2e tests
    window.__ursaCam = [camera.position.x, camera.position.y, camera.position.z]
  })

  // selector pointing at nothing disables drei's auto-lock-on-canvas-click;
  // locking is decided in onClick above so aimed clicks inspect instead
  return <PointerLockControls ref={controlsRef} makeDefault selector="#ursa-manual-lock" />
}
