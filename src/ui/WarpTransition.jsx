import { useEffect, useRef } from 'react'

const DURATION = 1450 // ms

// hyperspace star-streak transition; calls onDone as it hits full black
export default function WarpTransition({ onDone }) {
  const canvasRef = useRef()
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const resize = () => {
      canvas.width = innerWidth
      canvas.height = innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const stars = Array.from({ length: 320 }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: 40 + Math.random() * Math.max(innerWidth, innerHeight) * 0.5,
      hue: 210 + Math.random() * 60,
    }))

    let raf
    let fired = false
    const t0 = performance.now()
    const frame = (now) => {
      const t = Math.min((now - t0) / DURATION, 1)
      const cx = canvas.width / 2
      const cy = canvas.height / 2
      // accelerating pull toward the viewer
      const speed = Math.pow(t, 2.6) * Math.max(canvas.width, canvas.height)
      ctx.fillStyle = `rgba(3, 4, 10, ${0.25 + t * 0.55})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.globalCompositeOperation = 'lighter'
      for (const s of stars) {
        const r0 = s.dist + speed * 0.25
        const r1 = s.dist + speed
        const x0 = cx + Math.cos(s.angle) * r0
        const y0 = cy + Math.sin(s.angle) * r0
        const x1 = cx + Math.cos(s.angle) * r1
        const y1 = cy + Math.sin(s.angle) * r1
        ctx.strokeStyle = `hsla(${s.hue}, 80%, ${70 + t * 20}%, ${0.5 + t * 0.4})`
        ctx.lineWidth = 1 + t * 1.6
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
        ctx.stroke()
      }
      ctx.globalCompositeOperation = 'source-over'
      if (t >= 1) {
        ctx.fillStyle = '#02030a'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        if (!fired) {
          fired = true
          doneRef.current()
        }
        return
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="warp-canvas" />
}
