import { J, type JointId, type LimbJoint, type Pose, type Side } from './types'

type P3 = { x: number; y: number; z: number }

const RAD = 180 / Math.PI
const midpoint3 = (a: P3, b: P3): P3 => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 })
const sub = (a: P3, b: P3): P3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z })

/** Angle at b (degrees, 0..180) between segments b->a and b->c in 3D. */
export function angleAt(a: P3, b: P3, c: P3): number {
  const v1 = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
  const v2 = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z }
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z
  const n = Math.hypot(v1.x, v1.y, v1.z) * Math.hypot(v2.x, v2.y, v2.z)
  if (n < 1e-9) return 0
  return Math.acos(Math.max(-1, Math.min(1, dot / n))) * RAD
}

const IDX: Record<LimbJoint, Record<Side, [number, number, number]>> = {
  knee: { L: [J.L_HIP, J.L_KNE, J.L_ANK], R: [J.R_HIP, J.R_KNE, J.R_ANK] },
  hip: { L: [J.L_SHO, J.L_HIP, J.L_KNE], R: [J.R_SHO, J.R_HIP, J.R_KNE] },
  elbow: { L: [J.L_SHO, J.L_ELB, J.L_WRI], R: [J.R_SHO, J.R_ELB, J.R_WRI] },
  shoulder: { L: [J.L_HIP, J.L_SHO, J.L_ELB], R: [J.R_HIP, J.R_SHO, J.R_ELB] },
}

export const jointLandmarks = (joint: LimbJoint, side: Side) => IDX[joint][side]

export type AngleMode = '3d' | '2d'

/**
 * Clinical joint angle in degrees: 0 = neutral/straight, larger = more flexion
 * (for the shoulder: 0 = arm by the side, 180 = overhead).
 * mode "3d" uses MediaPipe world landmarks (less sensitive to camera angle);
 * mode "2d" uses image landmarks corrected for aspect ratio.
 */
export function jointAngle(pose: Pose, joint: JointId, side: Side, mode: AngleMode = '3d', w = 1, h = 1): number {
  if (joint === 'trunk') return Math.abs(trunkLean(pose, w, h)) // forward bend from vertical, image plane (side view)
  const [ia, ib, ic] = IDX[joint][side]
  const get = (i: number): P3 =>
    mode === '3d' ? pose.world[i] : { x: pose.lm[i].x * w, y: pose.lm[i].y * h, z: 0 }
  let a = get(ia)
  const b = get(ib)
  const c = get(ic)
  if (joint === 'shoulder' || joint === 'hip') {
    // Reference the trunk axis (hip-midpoint <-> shoulder-midpoint), not the same-side
    // hip/shoulder line, which is skewed because shoulders are wider than hips.
    const sm = midpoint3(get(J.L_SHO), get(J.R_SHO))
    const hm = midpoint3(get(J.L_HIP), get(J.R_HIP))
    const axis = joint === 'shoulder' ? sub(hm, sm) : sub(sm, hm)
    a = { x: b.x + axis.x, y: b.y + axis.y, z: b.z + axis.z }
  }
  const raw = angleAt(a, b, c)
  return joint === 'shoulder' ? raw : 180 - raw
}

export const jointVisibility = (pose: Pose, joint: JointId, side: Side) => {
  if (joint === 'trunk') return side === 'L' ? Math.min(pose.lm[J.L_SHO].v, pose.lm[J.L_HIP].v) : Math.min(pose.lm[J.R_SHO].v, pose.lm[J.R_HIP].v)
  const [a, b, c] = IDX[joint][side]
  return Math.min(pose.lm[a].v, pose.lm[b].v, pose.lm[c].v)
}

const px = (pose: Pose, i: number, w: number, h: number) => ({ x: pose.lm[i].x * w, y: pose.lm[i].y * h })
const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

export function torsoLength(pose: Pose, w: number, h: number) {
  const s = mid(px(pose, J.L_SHO, w, h), px(pose, J.R_SHO, w, h))
  const hp = mid(px(pose, J.L_HIP, w, h), px(pose, J.R_HIP, w, h))
  return Math.hypot(s.x - hp.x, s.y - hp.y)
}

/** Lean of the trunk from vertical in the image plane (deg). + = leaning toward image right. */
export function trunkLean(pose: Pose, w: number, h: number) {
  const s = mid(px(pose, J.L_SHO, w, h), px(pose, J.R_SHO, w, h))
  const hp = mid(px(pose, J.L_HIP, w, h), px(pose, J.R_HIP, w, h))
  return Math.atan2(s.x - hp.x, hp.y - s.y) * RAD
}

/** Tilt of a left/right landmark pair: + means the subject's LEFT side is lower. */
export function pairTilt(pose: Pose, left: number, right: number, w: number, h: number) {
  const l = px(pose, left, w, h)
  const r = px(pose, right, w, h)
  return Math.atan2(l.y - r.y, Math.abs(l.x - r.x) || 1e-6) * RAD
}

/** Ratio shoulder-width : torso-length. ~0.8+ when facing the camera, ~0.2 when side-on. */
export function viewRatio(pose: Pose, w: number, h: number) {
  const l = px(pose, J.L_SHO, w, h)
  const r = px(pose, J.R_SHO, w, h)
  const t = torsoLength(pose, w, h) || 1
  return Math.hypot(l.x - r.x, l.y - r.y) / t
}

export { mid as midpoint, px as pixelPoint }
