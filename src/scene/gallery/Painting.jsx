import { useEffect, useRef } from 'react'
import { usePaintingTexture } from '../../lib/paintingTexture'

const ART_W = 3.4
const ART_H = 2.26

export default function Painting({ entry, register }) {
  const { project, position, rotationY } = entry
  const hitRef = useRef()
  const texture = usePaintingTexture(project.screenshot, project.title, ART_W, ART_H)

  // register the hit mesh for the crosshair raycast while pointer-locked
  useEffect(() => {
    if (hitRef.current) return register(project, hitRef.current)
  }, [register, project])

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* frame */}
      <mesh position={[0, 0, 0.07]} castShadow receiveShadow>
        <boxGeometry args={[ART_W + 0.42, ART_H + 0.42, 0.14]} />
        <meshStandardMaterial color="#8a6d3b" metalness={0.65} roughness={0.35} />
      </mesh>
      {/* mat */}
      <mesh position={[0, 0, 0.145]}>
        <planeGeometry args={[ART_W + 0.16, ART_H + 0.16]} />
        <meshStandardMaterial color="#06070d" roughness={0.9} />
      </mesh>
      {/* artwork; keys force a fresh material when the map arrives (shader recompile) */}
      <mesh position={[0, 0, 0.16]}>
        <planeGeometry args={[ART_W, ART_H]} />
        {texture ? (
          <meshStandardMaterial
            key="art"
            map={texture}
            emissive="#ffffff"
            emissiveMap={texture}
            emissiveIntensity={0.4}
            roughness={0.55}
            metalness={0}
          />
        ) : (
          <meshStandardMaterial key="loading" color="#0c1020" roughness={0.9} />
        )}
      </mesh>
      {/* invisible anchor registered for the crosshair aim cone */}
      <mesh ref={hitRef} position={[0, 0, 0.2]} userData={{ projectId: project.id }}>
        <planeGeometry args={[ART_W + 0.6, ART_H + 0.6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
