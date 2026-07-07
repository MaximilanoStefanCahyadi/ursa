import { Line } from '@react-three/drei'

export default function ConstellationLines({ lines }) {
  return (
    <group>
      {lines.map((l, i) => (
        <Line
          key={i}
          points={[
            [l.a.x, l.a.y, -0.5],
            [l.b.x, l.b.y, -0.5],
          ]}
          color={l.color}
          lineWidth={l.kind === 'category' ? 1.4 : 1}
          transparent
          opacity={l.kind === 'category' ? 0.5 : 0.18}
          dashed={l.kind === 'affinity'}
          dashSize={1.1}
          gapSize={0.9}
        />
      ))}
    </group>
  )
}
