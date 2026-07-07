import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { hash01 } from '../lib/dates'
import { getDotTexture } from '../lib/starTexture'

export default function BackgroundStars({
  count = 900,
  depth = -40,
  spread = 280,
  size = 1.6,
  opacity = 0.8,
  phase = 0,
}) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (hash01(`x${phase}:${i}`) - 0.5) * spread
      positions[i * 3 + 1] = (hash01(`y${phase}:${i}`) - 0.5) * spread * 0.62
      positions[i * 3 + 2] = depth + (hash01(`z${phase}:${i}`) - 0.5) * 24
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [count, depth, spread, phase])

  const material = useRef()
  useFrame(({ clock }) => {
    if (material.current) {
      material.current.opacity =
        opacity * (0.78 + 0.22 * Math.sin(clock.elapsedTime * 0.7 + phase))
    }
  })

  return (
    <points geometry={geometry}>
      <pointsMaterial
        ref={material}
        map={getDotTexture()}
        color="#cdd8ff"
        size={size}
        sizeAttenuation
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
