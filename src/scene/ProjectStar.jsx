import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { getStarTexture } from '../lib/starTexture'
import { dragState } from '../lib/dragState'

// a project or experience star; fades when filtered out or its layer is hidden
export default function ProjectStar({ node, onSelect, active = true, shown = true }) {
  const groupRef = useRef()
  const spriteRef = useRef()
  const alpha = useRef(shown ? 1 : 0)
  const [hovered, setHovered] = useState(false)
  const base = node.size * 5.4

  const interactive = active && shown

  useFrame(({ clock }, dt) => {
    const s = spriteRef.current
    if (!s) return
    const targetAlpha = shown ? (active ? 1 : 0.13) : 0
    const k = 1 - Math.exp(-6 * Math.min(dt, 0.05))
    alpha.current += (targetAlpha - alpha.current) * k
    groupRef.current.visible = alpha.current > 0.02

    let scale = base * (active ? 1 : 0.72)
    if (node.ongoing) scale *= 1 + 0.13 * Math.sin(clock.elapsedTime * 2.4)
    if (hovered && interactive) scale *= 1.35
    s.scale.x += (scale - s.scale.x) * 0.15
    s.scale.y = s.scale.x
    const pulse = node.ongoing ? 0.82 + 0.18 * Math.sin(clock.elapsedTime * 2.4) : 1
    s.material.opacity = alpha.current * pulse
  })

  return (
    <group ref={groupRef} position={[node.x, node.y, 0]}>
      <sprite ref={spriteRef} scale={[base, base, 1]}>
        <spriteMaterial
          map={getStarTexture()}
          color={node.color}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      {/* oversized invisible hit area */}
      <mesh
        onPointerOver={(e) => {
          if (!interactive) return
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = ''
        }}
        onClick={(e) => {
          if (!interactive) return
          e.stopPropagation()
          if (dragState.dist < 8) onSelect(node)
        }}
      >
        <circleGeometry args={[2.8, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {hovered && interactive && (
        <Html center position={[0, 3.1, 0]} style={{ pointerEvents: 'none' }} zIndexRange={[20, 10]}>
          <div className="star-tooltip">
            <span className="star-tooltip-name">{node.title}</span>
            <span className="star-tooltip-dates">{node.dates}</span>
          </div>
        </Html>
      )}
    </group>
  )
}
