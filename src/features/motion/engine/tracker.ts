import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import { asset } from '../../../lib/utils'
import type { LM, Pose } from './types'

export type ModelKind = 'lite' | 'full'
export type DelegateKind = 'GPU' | 'CPU'

const cache = new Map<string, Promise<PoseTracker>>()

/** Thin wrapper around MediaPipe Pose Landmarker. All model + WASM files are served locally. */
export class PoseTracker {
  private lastT = -1
  private lm: PoseLandmarker
  readonly delegate: DelegateKind
  readonly model: ModelKind

  private constructor(lm: PoseLandmarker, delegate: DelegateKind, model: ModelKind) {
    this.lm = lm
    this.delegate = delegate
    this.model = model
  }

  static get(model: ModelKind = 'lite', preferred: DelegateKind = 'GPU'): Promise<PoseTracker> {
    const key = `${model}:${preferred}`
    let p = cache.get(key)
    if (!p) {
      p = PoseTracker.create(model, preferred)
      p.catch(() => cache.delete(key))
      cache.set(key, p)
    }
    return p
  }

  private static async create(model: ModelKind, preferred: DelegateKind): Promise<PoseTracker> {
    const fileset = await FilesetResolver.forVisionTasks(asset('wasm'))
    const make = (delegate: DelegateKind) =>
      PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: asset(`models/pose_landmarker_${model}.task`), delegate },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })
    let tracker: PoseTracker
    try {
      tracker = new PoseTracker(await make(preferred), preferred, model)
      await new Promise((r) => setTimeout(r, 60)) // let the "loading" overlay paint before the blocking warm-up
      tracker.warmUp()
    } catch (e) {
      if (preferred !== 'GPU') throw e
      tracker = new PoseTracker(await make('CPU'), 'CPU', model)
      tracker.warmUp()
    }
    return tracker
  }

  /** The first GPU inference compiles shaders and can take seconds; do it up front on a blank frame. */
  private warmUp() {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 256
    c.getContext('2d')!.fillRect(0, 0, 256, 256)
    this.detect(c, 1)
  }

  detect(video: HTMLVideoElement | HTMLCanvasElement, tMs: number): Pose | null {
    // MediaPipe requires strictly increasing timestamps
    const ts = tMs <= this.lastT ? this.lastT + 1 : tMs
    this.lastT = ts
    const res = this.lm.detectForVideo(video, ts)
    if (!res.landmarks.length) return null
    const conv = (a: { x: number; y: number; z: number; visibility?: number }[]): LM[] =>
      a.map((p) => ({ x: p.x, y: p.y, z: p.z, v: p.visibility ?? 0 }))
    return { lm: conv(res.landmarks[0]), world: conv(res.worldLandmarks[0]), t: tMs }
  }
}
