import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'

const BASE_OPACITY = { category: 0.5, affinity: 0.18, experience: 0.45 }

function FadingLine({ line, active, shown }) {
  const ref = useRef()
  const base = BASE_OPACITY[line.kind] ?? 0.4

  useFrame((_, dt) => {
    const obj = ref.current
    if (!obj) return
    const target = shown ? (active ? base : 0.03) : 0
    const k = 1 - Math.exp(-6 * Math.min(dt, 0.05))
    obj.material.opacity += (target - obj.material.opacity) * k
    obj.visible = obj.material.opacity > 0.01
  })

  return (
    <Line
      ref={ref}
      points={[
        [line.a.x, line.a.y, -0.5],
        [line.b.x, line.b.y, -0.5],
      ]}
      color={line.color}
      lineWidth={line.kind === 'affinity' ? 1 : 1.4}
      transparent
      opacity={base}
      dashed={line.kind === 'affinity'}
      dashSize={1.1}
      gapSize={0.9}
    />
  )
}

// a line stays lit only while both of its stars survive the filter
export default function ConstellationLines({ lines, matches, shown = true }) {
  return (
    <group>
      {lines.map((l, i) => (
        <FadingLine key={i} line={l} active={matches(l.a) && matches(l.b)} shown={shown} />
      ))}
    </group>
  )
}
