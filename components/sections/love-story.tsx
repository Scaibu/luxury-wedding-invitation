import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import {
  Eyebrow,
  GoldDivider,
  HeartMark,
  SectionShell,
  Sparkles,
} from '@/components/decor'
import { storyChapters } from '@/lib/wedding-config'

const TOTAL = storyChapters.length

const TUNING = {
  mobile: { scaleStep: 0.035, peek: 10, imageZoom: 1.32 },
  desktop: { scaleStep: 0.05, peek: 16, imageZoom: 1.6 },
} as const

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max)
}

type DeckMetrics = {
  desktop: boolean
  vh: number
  panel: number
  distance: number
}

function useDeckMetrics(container: RefObject<HTMLDivElement | null>): DeckMetrics {
  const [metrics, setMetrics] = useState<DeckMetrics>({
    desktop: false,
    vh: 0,
    panel: 0,
    distance: 0,
  })

  useEffect(() => {
    const node = container.current
    if (!node) return

    let frame = 0
    const read = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const el = container.current
        if (!el) return
        const vh = window.innerHeight
        const height = el.offsetHeight
        const next: DeckMetrics = {
          desktop: window.innerWidth >= 1024,
          vh,
          panel: height / TOTAL,
          distance: Math.max(height - vh, 1),
        }
        setMetrics((prev) =>
          prev.desktop === next.desktop &&
          prev.vh === next.vh &&
          prev.panel === next.panel &&
          prev.distance === next.distance
            ? prev
            : next,
        )
      })
    }

    read()

    const observer = new ResizeObserver(read)
    observer.observe(node)
    window.addEventListener('resize', read)
    window.addEventListener('orientationchange', read)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', read)
      window.removeEventListener('orientationchange', read)
    }
  }, [container])

  return metrics
}

function useDeckPin(progress: MotionValue<number>, m: DeckMetrics, index = 0) {
  return useTransform(progress, (p) => {
    if (!m.distance || !m.panel) return 0
    const scrolled = p * m.distance
    const offset = index * m.panel
    return clamp(scrolled - offset, 0, Math.max(m.distance - offset, 0))
  })
}

function StackedPanel({
  index,
  image,
  label,
  progress,
  active,
  metrics,
}: {
  index: number
  image: string
  label: string
  progress: MotionValue<number>
  active: number
  metrics: DeckMetrics
}) {
  const reduceMotion = false
  const pin = useDeckPin(progress, metrics, index)

  const { scaleStep, peek, imageZoom } = metrics.desktop
    ? TUNING.desktop
    : TUNING.mobile

  const start = index / TOTAL
  const step = 1 / TOTAL
  const enterFrom = Math.max(start - step, 0)

  const targetScale = 1 - (TOTAL - 1 - index) * scaleStep
  const scale = useTransform(
    progress,
    [start, 1],
    reduceMotion ? [targetScale, targetScale] : [1, targetScale],
    { clamp: true },
  )

  const y = useTransform(pin, (p) => p + index * peek)

  const imageScale = useTransform(
    progress,
    [enterFrom, start],
    reduceMotion || index === 0 ? [1, 1] : [imageZoom, 1],
    { clamp: true },
  )

  const filter = useTransform(
    progress,
    [start, Math.min(start + step, 1)],
    index === TOTAL - 1 ? ['brightness(1)', 'brightness(1)'] : ['brightness(1)', 'brightness(0.92)'],
  )

  const isActive = index === active
  const near = Math.abs(index - active) <= 1

  return (
    <div className="flex h-[100dvh] items-center justify-center px-4 pb-16 pt-52 sm:pt-56 lg:pb-24 lg:pt-32">
      <motion.div
        style={{
          y,
          scale,
          filter,
          zIndex: index,
          transformTemplate: ({ y, scale }: { y: string; scale: string }) =>
            `translate3d(0, ${y}, 0) scale(${scale})`,
          willChange: 'transform, filter',
        }}
        className="relative w-full max-w-[300px] origin-top sm:max-w-[340px] lg:max-w-[370px]"
      >
        <div className="relative rounded-[26px] border border-accent/40 bg-card p-3 shadow-[0_36px_80px_-38px_oklch(0.45_0.08_240/0.55)]">
          <div className="relative aspect-[4/5] max-h-[46dvh] w-full overflow-hidden rounded-[18px] bg-card lg:max-h-[52dvh]">
            <motion.div
              style={{
                scale: imageScale,
                transformTemplate: ({ scale }: { scale: string }) =>
                  `translate3d(0, 0, 0) scale(${scale})`,
                willChange: 'transform',
              }}
              className="absolute inset-0"
            >
              <img
                src={image || '/placeholder.svg'}
                alt={label}
                className="absolute inset-0 h-full w-full object-cover object-center"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </motion.div>
          </div>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-[10px] rounded-[20px] border border-accent/25"
          />
        </div>

        <motion.div
          animate={{
            opacity: isActive ? 1 : near ? 0.35 : 0,
            y: isActive ? 0 : 6,
          }}
          transition={{ duration: 0.35 }}
          className="pointer-events-none absolute -bottom-10 inset-x-0 text-center"
        >
          <span className="inline-block rounded-full border border-accent/40 bg-card/90 px-3.5 py-1 text-[0.62rem] font-medium tracking-[0.24em] text-accent-foreground backdrop-blur-sm">
            {storyChapters[index]?.when ?? `Chapter 0${index + 1}`}
          </span>
        </motion.div>
      </motion.div>
    </div>
  )
}

function HeartTimeline({
  progress,
  active,
  metrics,
}: {
  progress: MotionValue<number>
  active: number
  metrics: DeckMetrics
}) {
  const pin = useDeckPin(progress, metrics)
  const y = useTransform(pin, (p) => p)

  const lineProgress = useTransform(
    progress,
    [0, (TOTAL - 1) / TOTAL],
    [0, 100],
    { clamp: true },
  )

  return (
    <div className="relative hidden h-[100dvh] items-center lg:flex">
      <motion.aside
        aria-label="Story chapters"
        style={{
          y,
          transformTemplate: ({ y }: { y: string }) =>
            `translate3d(0, ${y}, 0)`,
          willChange: 'transform',
        }}
        className="relative my-auto w-full max-w-sm"
      >
        <div className="relative flex flex-col justify-center gap-7 rounded-3xl border border-accent/40 bg-card/85 p-8 shadow-[0_30px_70px_-30px_oklch(0.45_0.08_240/0.45)] backdrop-blur-md">
          <span
            aria-hidden="true"
            className="absolute bottom-10 left-[49px] top-10 w-px bg-accent/30"
          />
          <motion.span
            aria-hidden="true"
            style={{
              height: useTransform(lineProgress, (v) => `${v}%`),
              maxHeight: 'calc(100% - 5rem)',
              transformTemplate: () => 'translate3d(0, 0, 0)',
            }}
            className="absolute left-[49px] top-10 w-px bg-accent shadow-[0_0_8px_oklch(0.86_0.09_85)]"
          />

          {storyChapters.map((c, i) => {
            const reached = i <= active
            const isCur = i === active
            return (
              <div
                key={c.label}
                className="relative flex items-center gap-4 transition-transform duration-300"
                style={{
                  transform: isCur ? 'translateX(4px)' : 'translateX(0)',
                }}
              >
                <HeartMark filled={reached} active={isCur} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className={`text-[0.6rem] font-medium tracking-[0.28em] uppercase transition-colors duration-300 ${
                        reached
                          ? 'text-accent-foreground'
                          : 'text-muted-foreground/60'
                      }`}
                    >
                      {c.when}
                    </p>
                    <span
                      className={`text-[0.55rem] font-medium tracking-[0.2em] transition-opacity duration-300 ${
                        isCur
                          ? 'text-accent-foreground opacity-90'
                          : 'opacity-0'
                      }`}
                    >
                      Now Playing
                    </span>
                  </div>
                  <p
                    className={`mt-0.5 truncate font-serif text-base transition-colors duration-300 ${
                      isCur
                        ? 'font-medium italic text-foreground'
                        : reached
                          ? 'text-foreground/80'
                          : 'text-muted-foreground/65'
                    }`}
                  >
                    {c.label}
                  </p>
                  <motion.p
                    initial={false}
                    animate={{
                      opacity: isCur ? 1 : 0,
                      height: isCur ? 'auto' : 0,
                      marginTop: isCur ? 4 : 0,
                    }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="overflow-hidden font-serif text-xs italic leading-snug text-muted-foreground"
                  >
                    &ldquo;{c.note}&rdquo;
                  </motion.p>
                </div>
              </div>
            )
          })}
        </div>
      </motion.aside>
    </div>
  )
}

function HeartRailMobile({
  progress,
  active,
}: {
  progress: MotionValue<number>
  active: number
}) {
  const line = useTransform(
    progress,
    [0, (TOTAL - 1) / TOTAL],
    [0, 100],
    { clamp: true },
  )

  return (
    <div className="mt-5 flex justify-center px-4 lg:hidden">
      <div className="relative flex items-center gap-4 rounded-full border border-accent/40 bg-card/90 px-4 py-2 shadow-sm backdrop-blur-md">
        <span
          aria-hidden="true"
          className="absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-accent/25"
        />
        <motion.span
          aria-hidden="true"
          style={{
            width: useTransform(line, (v) => `calc(${v}% * 0.72)`),
          }}
          className="absolute left-6 top-1/2 h-px -translate-y-1/2 bg-accent shadow-[0_0_6px_oklch(0.86_0.09_85)]"
        />

        {storyChapters.map((c, i) => {
          const reached = i <= active
          const isCur = i === active
          return (
            <div key={c.label} className="relative z-10 flex items-center">
              <span
                className={`relative flex size-5 items-center justify-center rounded-full border transition-all duration-300 ${
                  isCur
                    ? 'scale-125 border-accent bg-accent/20 shadow-[0_0_0_3px_oklch(0.86_0.09_85/0.25)]'
                    : reached
                      ? 'border-accent/80 bg-card'
                      : 'border-accent/30 bg-card/60'
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className={`size-2.5 transition-colors ${
                    reached ? 'text-accent' : 'text-muted-foreground/30'
                  }`}
                  fill={reached ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StoryHeading({
  progress,
  active,
  metrics,
}: {
  progress: MotionValue<number>
  active: number
  metrics: DeckMetrics
}) {
  const y = useDeckPin(progress, metrics)

  return (
    <motion.div
      style={{
        y,
        transformTemplate: ({ y }: { y: string }) =>
          `translate3d(0, ${y}, 0)`,
        willChange: 'transform',
      }}
      className="pointer-events-none absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-background via-background to-transparent pb-10 pt-4 text-center"
    >
      <Eyebrow>A little about us</Eyebrow>
      <h2 className="mt-3 font-serif text-4xl font-light italic text-foreground sm:text-5xl">
        Our Story
      </h2>
      <GoldDivider className="mt-5" />
      <HeartRailMobile progress={progress} active={active} />
    </motion.div>
  )
}

export function LoveStory() {
  const container = useRef<HTMLDivElement | null>(null)
  const metrics = useDeckMetrics(container)
  const reduceMotion = false

  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  })

  const [active, setActive] = useState(0)

  const sync = useCallback(
    (p: number) => {
      if (!metrics.panel) return
      const scrolled = p * metrics.distance
      const next = clamp(Math.round(scrolled / metrics.panel), 0, TOTAL - 1)
      setActive((prev) => (prev === next ? prev : next))
    },
    [metrics.panel, metrics.distance],
  )

  useMotionValueEvent(scrollYProgress, 'change', sync)

  useEffect(() => {
    sync(scrollYProgress.get())
  }, [sync, scrollYProgress])

  return (
    <SectionShell
      id="story"
      className="overflow-visible !py-0"
      background={<Sparkles count={reduceMotion ? 0 : 10} />}
    >
      <div
        ref={container}
        className="relative"
        style={{ height: `${TOTAL * 100}vh` }}
      >
        <StoryHeading
          progress={scrollYProgress}
          active={active}
          metrics={metrics}
        />

        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-start lg:gap-10">
          <div className="relative">
            <Sparkles count={reduceMotion ? 0 : 10} className="opacity-60" />
            {storyChapters.map((c, i) => (
              <StackedPanel
                key={c.label}
                index={i}
                image={c.image}
                label={c.label}
                progress={scrollYProgress}
                active={active}
                metrics={metrics}
              />
            ))}
          </div>

          <HeartTimeline
            progress={scrollYProgress}
            active={active}
            metrics={metrics}
          />
        </div>
      </div>
    </SectionShell>
  )
}
