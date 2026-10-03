import { useEffect, useRef, useState } from 'react'
import type { MovementDef } from '../engine/movements'
import { PoseSmoother } from '../engine/oneEuro'
import { drawPose, type Focus } from '../engine/draw'
import { buildPose, simDriver } from '../engine/sim'
import { PoseTracker, type DelegateKind, type ModelKind } from '../engine/tracker'
import type { Pose, SideChoice } from '../engine/types'

export type StageSource =
  | { kind: 'webcam'; deviceId?: string; facing?: 'user' | 'environment' }
  | { kind: 'file'; url: string }
  | { kind: 'sim'; def: MovementDef; side: SideChoice; speed?: number }

export interface StageStatus {
  phase: 'idle' | 'loading-model' | 'starting-camera' | 'running' | 'error'
  message?: string
  fps: number
  infMs: number
  delegate?: string
  size?: { w: number; h: number }
}

interface Props {
  source: StageSource
  active: boolean
  mirror?: boolean
  model?: ModelKind
  delegate?: DelegateKind
  focus?: Focus[]
  dim?: boolean
  onPose: (pose: Pose | null, tMs: number, size: { w: number; h: number }) => void
  onStatus?: (s: StageStatus) => void
  onEnded?: () => void
  className?: string
  children?: React.ReactNode
}

/** Renders a camera / video / simulated source with a live skeleton overlay and reports poses upward. */
export function PoseStage(props: Props) {
  const { source, active, mirror = true, model = 'lite', delegate = 'GPU', focus, className, children } = props
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<StageStatus>({ phase: 'idle', fps: 0, infMs: 0 })
  const [size, setSize] = useState({ w: 640, h: 480 })
  const [modelReady, setModelReady] = useState(source.kind === 'sim')

  // Latest props in refs so the animation loop never restarts
  const cb = useRef(props)
  cb.current = props
  const activeRef = useRef(active)
  activeRef.current = active
  const focusRef = useRef(focus)
  focusRef.current = focus
  const trackerRef = useRef<PoseTracker | null>(null)
  const statusRef = useRef(status)

  const push = (s: Partial<StageStatus>) => {
    statusRef.current = { ...statusRef.current, ...s }
    setStatus(statusRef.current)
    cb.current.onStatus?.(statusRef.current)
  }

  const srcKey = source.kind === 'webcam' ? `cam:${source.deviceId ?? ''}:${source.facing ?? 'user'}` : source.kind === 'file' ? `file:${source.url}` : `sim:${source.def.id}:${source.side}`

  // ---- Load the model (not needed for the simulated source)
  useEffect(() => {
    if (source.kind === 'sim') { trackerRef.current = null; setModelReady(true); return }
    let dead = false
    setModelReady(false)
    push({ phase: 'loading-model', message: 'Loading AI model…' })
    PoseTracker.get(model, delegate)
      .then((t) => { if (!dead) { trackerRef.current = t; setModelReady(true); push({ delegate: t.delegate, message: undefined }) } })
      .catch((e) => { if (!dead) push({ phase: 'error', message: `Could not load the pose model (${e instanceof Error ? e.message : e}).` }) })
    return () => { dead = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source.kind, model, delegate])

  // ---- Media source + main loop
  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf = 0
    let dead = false
    let stream: MediaStream | null = null
    let lastVideoTime = -1
    let frames = 0
    let fpsT = performance.now()
    let infAvg = 0
    let lastPose: Pose | null = null
    const smoother = new PoseSmoother()
    const t0 = performance.now()

    const setup = async () => {
      if (source.kind === 'webcam' && video) {
        push({ phase: 'starting-camera', message: 'Starting camera…' })
        try {
          if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser does not support camera access (needs https or localhost).')
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: source.deviceId ? { exact: source.deviceId } : undefined, width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: source.deviceId ? undefined : { ideal: source.facing ?? 'user' } },
            audio: false,
          })
          if (dead) { stream.getTracks().forEach((t) => t.stop()); return }
          video.srcObject = stream
          await video.play()
        } catch (e) {
          const name = e instanceof DOMException ? e.name : ''
          push({
            phase: 'error',
            message: name === 'NotAllowedError' ? 'Camera access was blocked. Allow the camera in your browser address bar and try again.'
              : name === 'NotFoundError' ? 'No camera was found on this device.'
              : e instanceof Error ? e.message : 'Could not start the camera.',
          })
          return
        }
      } else if (source.kind === 'file' && video) {
        video.srcObject = null
        video.src = source.url
        video.muted = true
        video.playsInline = true
        try { await video.play() } catch { /* user gesture may be required */ }
      }
      if (!dead) push({ phase: 'running', message: undefined })
    }

    const tick = () => {
      if (dead) return
      const now = performance.now()
      let w = size.w, h = size.h

      if (source.kind === 'sim') {
        w = 640; h = 480
        if (canvas.width !== w) { canvas.width = w; canvas.height = h; setSize({ w, h }) }
        if (activeRef.current) {
          const tMs = now - t0
          const raw = buildPose(simDriver(source.def, source.side, (tMs / 1000) * (source.speed ?? 1)), source.def.view, tMs, w / h)
          lastPose = smoother.apply(raw)
          cb.current.onPose(lastPose, tMs, { w, h })
          frames++
        }
      } else if (video && video.readyState >= 2 && video.videoWidth) {
        w = video.videoWidth; h = video.videoHeight
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; setSize({ w, h }) }
        const tracker = trackerRef.current
        if (tracker && activeRef.current && video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime
          const tMs = source.kind === 'file' ? video.currentTime * 1000 : now
          const a = performance.now()
          let pose: Pose | null = null
          try { pose = tracker.detect(video, source.kind === 'file' ? Math.round(now) : now) } catch { pose = null }
          infAvg = infAvg * 0.9 + (performance.now() - a) * 0.1
          if (pose) pose = smoother.apply({ ...pose, t: tMs })
          lastPose = pose
          cb.current.onPose(pose, tMs, { w, h })
          frames++
        }
      }

      drawPose(ctx, lastPose, canvas.width, canvas.height, {
        mirror: source.kind === 'webcam' ? (source.facing === 'environment' ? false : cb.current.mirror ?? true) : source.kind === 'sim' ? false : false,
        focus: focusRef.current,
        dim: cb.current.dim,
      })

      if (now - fpsT > 1000) {
        const fps = Math.round((frames * 1000) / (now - fpsT))
        frames = 0
        fpsT = now
        if (statusRef.current.phase === 'running' || source.kind === 'sim') push({ fps, infMs: Math.round(infAvg), size: { w, h } })
      }
      raf = requestAnimationFrame(tick)
    }

    void setup()
    raf = requestAnimationFrame(tick)
    const onEnded = () => cb.current.onEnded?.()
    video?.addEventListener('ended', onEnded)
    return () => {
      dead = true
      cancelAnimationFrame(raf)
      video?.removeEventListener('ended', onEnded)
      stream?.getTracks().forEach((t) => t.stop())
      if (video) { video.pause(); video.srcObject = null; if (source.kind !== 'file') video.removeAttribute('src') }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcKey])

  const mirrorVideo = source.kind === 'webcam' && mirror && source.facing !== 'environment'

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-[#0b1b2b] ${className ?? ''}`} style={{ aspectRatio: `${size.w} / ${size.h}` }}>
      {source.kind === 'sim' && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#1b3a5a_0%,#0b1b2b_70%)]">
          <div className="absolute inset-x-0 bottom-[6%] h-px bg-white/20" />
          <div className="absolute inset-0 opacity-[.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:32px_32px]" />
        </div>
      )}
      <video
        ref={videoRef}
        playsInline
        muted
        className={`absolute inset-0 h-full w-full object-contain ${source.kind === 'sim' ? 'hidden' : ''}`}
        style={{ transform: mirrorVideo ? 'scaleX(-1)' : undefined }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-contain" />
      {source.kind === 'sim' && (
        <div className="absolute left-3 top-3 rounded-full bg-amber-400/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-950">
          Simulated skeleton (demo)
        </div>
      )}
      {(status.phase !== 'running' || !modelReady) && source.kind !== 'sim' && (
        <div className="absolute inset-0 grid place-items-center bg-[#0b1b2b]/85 p-6 text-center text-white">
          {status.phase === 'error' ? (
            <div className="max-w-xs">
              <div className="mb-2 text-3xl">📷</div>
              <p className="text-sm leading-relaxed">{status.message}</p>
            </div>
          ) : (
            <div>
              <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-white/20 border-t-teal-400" />
              <p className="text-sm text-white/80">{status.phase === 'running' && !modelReady ? 'Loading AI model… the first run takes a few seconds' : status.message ?? 'Preparing…'}</p>
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
