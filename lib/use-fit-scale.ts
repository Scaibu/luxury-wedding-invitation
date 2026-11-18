import { useEffect, useState } from 'react'

/**
 * Returns a 0.55–1 scale so a block designed for `designHeight` px still fits
 * on short viewports (phones with a visible browser toolbar, small windows).
 * Anything at least `designHeight` tall gets exactly 1, so tall screens and
 * desktop are untouched.
 */
export function useFitScale(designHeight: number) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const update = () => {
      const h = window.visualViewport?.height ?? window.innerHeight
      setScale(Math.min(1, Math.max(0.55, h / designHeight)))
    }
    update()
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)
    return () => {
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
    }
  }, [designHeight])

  return scale
}
