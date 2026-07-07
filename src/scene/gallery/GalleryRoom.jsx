import { useMemo, useRef, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { computeGallery } from '../../lib/galleryLayout'
import Painting from './Painting'
import PlayerControls from './PlayerControls'

function PaintingSpot({ entry, apothem, height }) {
  const target = useMemo(() => {
    const t = new THREE.Object3D()
    t.position.set(entry.position[0] * 0.98, entry.position[1], entry.position[2] * 0.98)
    return t
  }, [entry])

  const len = Math.hypot(entry.position[0], entry.position[2])
  const inner = (apothem - 3.4) / len

  return (
    <>
      <spotLight
        position={[entry.position[0] * inner, height - 0.5, entry.position[2] * inner]}
        target={target}
        angle={0.52}
        penumbra={0.65}
        intensity={60}
        distance={14}
        decay={2}
        color="#ffe7c2"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
      <primitive object={target} />
    </>
  )
}

export default function GalleryRoom({ projects, enteredId, onInspect, onAim, uiOpen }) {
  const layout = useMemo(() => computeGallery(projects, enteredId), [projects, enteredId])
  const registry = useRef({})

  const register = useCallback((project, mesh) => {
    mesh.userData.projectId = project.id
    registry.current[project.id] = { mesh, project }
    return () => {
      delete registry.current[project.id]
    }
  }, [])

  const { radius, apothem, height, sides, thetaStart } = layout

  return (
    <div className="gallery-canvas">
      <Canvas
        shadows
        camera={{ fov: 70, near: 0.1, far: 120, position: [0, 1.7, 0] }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.12
        }}
      >
        <color attach="background" args={['#04050c']} />
        <fog attach="fog" args={['#04050c', 8, 38]} />
        <ambientLight intensity={0.3} />
        <pointLight position={[0, height - 0.8, 0]} intensity={26} distance={radius * 2.4} decay={2} color="#b9c6ff" />

        {/* rotunda walls */}
        <mesh position={[0, height / 2, 0]} receiveShadow>
          <cylinderGeometry args={[radius, radius, height, sides, 1, true, thetaStart, Math.PI * 2]} />
          <meshStandardMaterial color="#12141f" roughness={0.92} metalness={0.05} side={THREE.BackSide} />
        </mesh>
        {/* ceiling */}
        <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[radius + 0.5, sides]} />
          <meshStandardMaterial color="#07080f" roughness={0.95} />
        </mesh>
        {/* reflective floor */}
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[radius + 0.5, 64]} />
          <MeshReflectorMaterial
            resolution={512}
            blur={[280, 90]}
            mixBlur={0.9}
            mixStrength={2.2}
            depthScale={0.6}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.2}
            roughness={0.7}
            metalness={0.35}
            color="#101322"
            mirror={0.55}
          />
        </mesh>

        {layout.paintings.map((entry) => (
          <group key={entry.project.id}>
            <Painting entry={entry} register={register} />
            <PaintingSpot entry={entry} apothem={apothem} height={height} />
          </group>
        ))}

        <PlayerControls
          walkRadius={layout.walkRadius}
          registry={registry}
          onInspect={onInspect}
          onAim={onAim}
          uiOpen={uiOpen}
        />
      </Canvas>
    </div>
  )
}
