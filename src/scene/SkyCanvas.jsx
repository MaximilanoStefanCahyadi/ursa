import { Canvas } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import CameraRig from './CameraRig'
import BackgroundStars from './BackgroundStars'
import ProjectStar from './ProjectStar'
import ConstellationLines from './ConstellationLines'

export default function SkyCanvas({ sky, onSelect }) {
  return (
    <div className="sky-canvas">
      <Canvas
        camera={{ position: [0, 0, 58], fov: 55, near: 0.1, far: 500 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <CameraRig />
        <BackgroundStars count={1100} depth={-46} spread={320} size={1.4} opacity={0.7} phase={0} />
        <BackgroundStars count={320} depth={-22} spread={240} size={2.3} opacity={0.85} phase={3} />
        <ConstellationLines lines={sky.lines} />
        {sky.clusters.map((c) => (
          <Html
            key={c.category}
            transform
            position={[c.x, c.y, -1]}
            style={{ pointerEvents: 'none' }}
            zIndexRange={[10, 0]}
          >
            <div className="cluster-label" style={{ color: c.color }}>
              {c.category}
            </div>
          </Html>
        ))}
        {sky.yearTicks.map((t) => (
          <Html
            key={t.year}
            transform
            position={[t.x, -34, -2]}
            style={{ pointerEvents: 'none' }}
            zIndexRange={[10, 0]}
          >
            <div className="year-tick">{t.year}</div>
          </Html>
        ))}
        {sky.nodes.map((n) => (
          <ProjectStar key={n.id} node={n} onSelect={onSelect} />
        ))}
      </Canvas>
    </div>
  )
}
