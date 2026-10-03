import type { MovementDef } from './movements'
import type { LM, Pose, SideChoice } from './types'

/**
 * A parametric stick-figure used to (a) unit-test the analysis pipeline with known angles and
 * (b) provide a clearly-labelled "Simulated demo" source when no camera is available.
 * Model axes (metres): x = forward, y = up, z = subject's left.
 */
export interface SimParams {
  kneeL: number; kneeR: number
  hipL: number; hipR: number
  shoL: number; shoR: number
  elbL: number; elbR: number
  lean: number
  sway: number
  plane: 'sagittal' | 'frontal'
  shoTilt: number
  pelTilt: number
  headShift: number
}

export const SIM_DEFAULT: SimParams = {
  kneeL: 0, kneeR: 0, hipL: 0, hipR: 0, shoL: 0, shoR: 0, elbL: 0, elbR: 0,
  lean: 0, sway: 0, plane: 'sagittal', shoTilt: 0, pelTilt: 0, headShift: 0,
}

type V = [number, number, number]
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const mul = (a: V, k: number): V => [a[0] * k, a[1] * k, a[2] * k]
const rad = (d: number) => (d * Math.PI) / 180
const dir = (deg: number, f: V): V => add(mul([0, -1, 0], Math.cos(rad(deg))), mul(f, Math.sin(rad(deg))))

const HIPW = 0.1, SHOW = 0.19, TORSO = 0.5, THIGH = 0.43, SHIN = 0.43, UARM = 0.3, FARM = 0.26
const SCALE = 0.457 // frame-heights per metre

export function buildPose(p: SimParams, view: 'side' | 'front', tMs: number, aspect = 4 / 3): Pose {
  const F: V = [1, 0, 0]
  const armF = (sgn: number): V => (p.plane === 'sagittal' ? F : [0, 0, sgn])
  const lean = rad(p.lean)
  const trunkUp: V = [Math.sin(lean), Math.cos(lean), 0]

  const hipC: V = [p.sway, 0, 0]
  // positive tilt = subject's left side lower
  const hipL = add(hipC, [0, -HIPW * Math.tan(rad(p.pelTilt)), HIPW])
  const hipR = add(hipC, [0, HIPW * Math.tan(rad(p.pelTilt)), -HIPW])
  const shoMid = add(hipC, mul(trunkUp, TORSO))
  const shoL = add(shoMid, [0, -SHOW * Math.tan(rad(p.shoTilt)), SHOW])
  const shoR = add(shoMid, [0, SHOW * Math.tan(rad(p.shoTilt)), -SHOW])

  const knee = (hip: V, phi: number) => add(hip, mul(dir(phi, F), THIGH))
  const ankle = (k: V, phi: number, kap: number) => add(k, mul(dir(phi - kap, F), SHIN))
  const kneeL = knee(hipL, p.hipL), kneeR = knee(hipR, p.hipR)
  const ankL = ankle(kneeL, p.hipL, p.kneeL), ankR = ankle(kneeR, p.hipR, p.kneeR)

  const elbow = (s: V, sg: number, f: V) => add(s, mul(dir(sg, f), UARM))
  const wrist = (e: V, sg: number, el: number, f: V) => add(e, mul(dir(sg + el, f), FARM))
  const elbL = elbow(shoL, p.shoL, armF(1)), elbR = elbow(shoR, p.shoR, armF(-1))
  const wriL = wrist(elbL, p.shoL, p.elbL, armF(1)), wriR = wrist(elbR, p.shoR, p.elbR, armF(-1))

  const neck = add(shoMid, mul(trunkUp, 0.1))
  const headOff: V = view === 'front' ? [0, 0, p.headShift] : [p.headShift, 0, 0]
  const head = add(add(neck, mul(trunkUp, 0.12)), headOff)
  const nose = add(head, [0.09, 0, 0])
  const earL = add(head, [-0.02, 0, 0.08]), earR = add(head, [-0.02, 0, -0.08])

  const heel = (a: V): V => add(a, [-0.05, -0.04, 0])
  const toe = (a: V): V => add(a, [0.15, -0.05, 0])

  const pts: Record<number, V> = {
    0: nose, 7: earL, 8: earR,
    11: shoL, 12: shoR, 13: elbL, 14: elbR, 15: wriL, 16: wriR,
    23: hipL, 24: hipR, 25: kneeL, 26: kneeR, 27: ankL, 28: ankR,
    29: heel(ankL), 30: heel(ankR), 31: toe(ankL), 32: toe(ankR),
  }
  // fill the rest (face/hand points) so we always return 33 landmarks
  for (let i = 0; i < 33; i++) {
    if (!pts[i]) pts[i] = i < 11 ? head : i < 23 ? (i % 2 ? wriR : wriL) : ankL
  }

  const floor = Math.min(ankL[1], ankR[1]) - 0.06
  const hipMid = add(hipC, [0, 0, 0])
  const lm: LM[] = []
  const world: LM[] = []
  for (let i = 0; i < 33; i++) {
    const q = pts[i]
    const yUp = q[1] - floor
    const horiz = view === 'side' ? q[0] : q[2]
    lm.push({
      x: 0.5 + (horiz * SCALE) / aspect,
      y: 0.94 - yUp * SCALE,
      z: 0,
      v: 0.98,
    })
    world.push({ x: q[0] - hipMid[0], y: -(q[1] - hipMid[1]), z: q[2] - hipMid[2], v: 0.98 })
  }
  return { lm, world, t: tMs }
}

const wave = (t: number, period: number) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / period) // 0..1..0
const tremor = (t: number, a = 0.8) => a * Math.sin(t * 7.3) * Math.cos(t * 3.1)

/** Time-varying parameters that mimic a patient performing each movement. */
export function simDriver(def: MovementDef, side: SideChoice, tSec: number): SimParams {
  const p: SimParams = { ...SIM_DEFAULT }
  const R = side !== 'Left'
  const L = side === 'Left'
  const n = tremor(tSec)
  switch (def.id) {
    case 'knee-flex': {
      const k = 4 + wave(tSec, 3.2) * 108 + n
      if (R) p.kneeR = k
      if (L) p.kneeL = k
      break
    }
    case 'hip-flex': {
      const k = wave(tSec, 3) * 82 + n
      if (R) { p.hipR = k; p.kneeR = k * 0.9 }
      if (L) { p.hipL = k; p.kneeL = k * 0.9 }
      break
    }
    case 'shoulder-flex':
    case 'shoulder-abd': {
      p.plane = def.id === 'shoulder-abd' ? 'frontal' : 'sagittal'
      const a = wave(tSec, 3.4) * 158 + n
      if (R) p.shoR = a
      if (L) p.shoL = a
      break
    }
    case 'elbow-flex': {
      const a = wave(tSec, 2.8) * 138 + n
      if (R) p.elbR = a
      if (L) p.elbL = a
      break
    }
    case 'trunk-flex': {
      p.lean = wave(tSec, 3.6) * 62 + n
      break
    }
    case 'squat': {
      const w = wave(tSec, 3.6)
      p.kneeL = p.kneeR = w * 96 + n
      p.hipL = p.hipR = w * 84
      p.lean = w * 24
      break
    }
    case 'sit-to-stand': {
      const w = 0.5 + 0.5 * Math.cos((2 * Math.PI * tSec) / 3.6) // starts seated
      p.kneeL = p.kneeR = w * 90 + n
      p.hipL = p.hipR = w * 88
      p.lean = w * 18
      break
    }
    case 'single-leg': {
      const c = tSec % 24
      const up = (c > 2 && c < 12.5) || (c > 15 && c < 18)
      if (up) { p.hipR = 62; p.kneeR = 85 }
      p.sway = up ? 0.012 * Math.sin(tSec * 2.1) : 0
      break
    }
    case 'gait': {
      const ph = tSec * 2 * Math.PI * 0.9
      p.hipL = 26 * Math.sin(ph)
      p.hipR = -26 * Math.sin(ph)
      p.kneeL = 34 * Math.max(0, Math.sin(ph + 1.6))
      p.kneeR = 34 * Math.max(0, -Math.sin(ph - 1.6))
      p.lean = 3
      break
    }
    case 'posture-front':
      p.shoTilt = 2.6 + n * 0.1; p.pelTilt = 1.4; p.headShift = 0.025; p.lean = 1
      break
    case 'posture-side':
      p.headShift = 0.06 + n * 0.002; p.lean = 4
      break
  }
  return p
}
