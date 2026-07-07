import { useEffect, useState } from 'react'
import * as THREE from 'three'

// placeholder canvas for exhibits whose screenshot is missing
function makePlaceholder(title) {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 680
  const ctx = c.getContext('2d')
  const grad = ctx.createLinearGradient(0, 0, 1024, 680)
  grad.addColorStop(0, '#0c1020')
  grad.addColorStop(1, '#151b33')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1024, 680)
  ctx.fillStyle = 'rgba(217, 180, 92, 0.9)'
  ctx.font = '90px Georgia'
  ctx.textAlign = 'center'
  ctx.fillText('✦', 512, 310)
  ctx.fillStyle = 'rgba(154, 166, 196, 0.85)'
  ctx.font = '30px Georgia'
  ctx.fillText('exhibit image coming soon', 512, 400)
  ctx.fillStyle = 'rgba(232, 236, 248, 0.5)'
  ctx.font = 'italic 24px Georgia'
  ctx.fillText(title, 512, 450)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// load a screenshot as a cover-cropped texture; never suspends, never throws
export function usePaintingTexture(url, title, width, height) {
  const [texture, setTexture] = useState(null)

  useEffect(() => {
    let live = true
    const loader = new THREE.TextureLoader()
    loader.load(
      url,
      (tex) => {
        if (!live) return
        tex.colorSpace = THREE.SRGBColorSpace
        // object-fit: cover
        const frameAspect = width / height
        const imgAspect = tex.image.width / tex.image.height
        if (imgAspect > frameAspect) {
          tex.repeat.set(frameAspect / imgAspect, 1)
          tex.offset.set((1 - frameAspect / imgAspect) / 2, 0)
        } else {
          tex.repeat.set(1, imgAspect / frameAspect)
          tex.offset.set(0, 1 - imgAspect / frameAspect) // keep the top edge, like the placard
        }
        setTexture(tex)
      },
      undefined,
      () => {
        if (live) setTexture(makePlaceholder(title))
      },
    )
    return () => {
      live = false
    }
  }, [url, title, width, height])

  return texture
}
