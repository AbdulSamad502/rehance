import { viewRatio } from './angles'
import type { MovementDef } from './movements'
import { J, LM_NAMES, type Pose, type SideChoice } from './types'

/** Landmarks that must be visible for a movement + side selection. */
export function requiredLandmarks(def: MovementDef, side: SideChoice, pose?: Pose | null): number[] {
  const L = side !== 'Right'
  const R = side !== 'Left'
  const pick = (l: number[], r: number[]) => [...(L ? l : []), ...(R ? r : [])]
  if (def.kind === 'rom' && def.joint) {
    const set = {
      knee: [pick([J.L_HIP], [J.R_HIP]), pick([J.L_KNE], [J.R_KNE]), pick([J.L_ANK], [J.R_ANK])],
      hip: [pick([J.L_SHO], [J.R_SHO]), pick([J.L_HIP], [J.R_HIP]), pick([J.L_KNE], [J.R_KNE])],
      elbow: [pick([J.L_SHO], [J.R_SHO]), pick([J.L_ELB], [J.R_ELB]), pick([J.L_WRI], [J.R_WRI])],
      shoulder: [pick([J.L_HIP], [J.R_HIP]), pick([J.L_SHO], [J.R_SHO]), pick([J.L_ELB], [J.R_ELB])],
      trunk: [pick([J.L_SHO], [J.R_SHO]), pick([J.L_HIP], [J.R_HIP])],
    }[def.joint]
    return set.flat()
  }
  // Full-body movements. In side view only the leg facing the camera must be visible
  // (the far leg is usually occluded), so use whichever side is currently more visible.
  if (def.view === 'side') {
    const left = [J.L_SHO, J.L_HIP, J.L_KNE, J.L_ANK]
    const right = [J.R_SHO, J.R_HIP, J.R_KNE, J.R_ANK]
    if (!pose) return left
    const avg = (a: number[]) => a.reduce((s, i) => s + pose.lm[i].v, 0) / a.length
    return avg(left) >= avg(right) ? left : right
  }
  return [J.L_SHO, J.R_SHO, J.L_HIP, J.R_HIP, J.L_KNE, J.R_KNE, J.L_ANK, J.R_ANK]
}

export interface Positioning {
  ok: boolean
  score: number // 0..1
  issues: string[]
  good: string[]
}

const inFrame = (p: { x: number; y: number }) => p.x > 0.02 && p.x < 0.98 && p.y > 0.02 && p.y < 0.98

export function checkPositioning(pose: Pose | null, def: MovementDef, side: SideChoice, w: number, h: number): Positioning {
  if (!pose) return { ok: false, score: 0, issues: ['No person detected. Step into the camera view.'], good: [] }
  const req = requiredLandmarks(def, side, pose)
  const issues: string[] = []
  const good: string[] = []

  const hidden = req.filter((i) => pose.lm[i].v < 0.5)
  if (hidden.length) {
    const names = [...new Set(hidden.map((i) => LM_NAMES[i] ?? 'body'))].slice(0, 2).join(' and ')
    issues.push(`Can't see your ${names} clearly. Check lighting and clothing contrast.`)
  } else good.push('All key joints visible')

  const out = req.filter((i) => !inFrame(pose.lm[i]))
  if (out.length) issues.push('Part of your body is out of frame. Step back or re-aim the camera.')
  else good.push('Body inside the frame')

  const ys = req.map((i) => pose.lm[i].y)
  const span = Math.max(...ys) - Math.min(...ys)
  const [lo, hi] = def.fullBody ? [0.4, 0.93] : [0.2, 0.85]
  if (!out.length && !hidden.length) {
    if (span < lo) issues.push('Move closer to the camera.')
    else if (span > hi) issues.push('Step back a little so the whole movement fits.')
    else good.push('Distance looks right')
  }

  const ratio = viewRatio(pose, w, h)
  if (def.view === 'side' && ratio > 0.5) issues.push('Turn side-on to the camera.')
  else if (def.view === 'front' && ratio < 0.55) issues.push('Face the camera directly.')
  else good.push(def.view === 'side' ? 'Side-on view' : 'Front view')

  const total = issues.length + good.length
  return { ok: issues.length === 0, score: good.length / Math.max(total, 1), issues, good }
}

/** 0..1 quality of one frame for the given landmarks. */
export function frameQuality(pose: Pose, req: number[]): number {
  const v = req.reduce((s, i) => s + pose.lm[i].v, 0) / Math.max(req.length, 1)
  const framed = req.every((i) => inFrame(pose.lm[i])) ? 1 : 0.65
  return Math.max(0, Math.min(1, v * framed))
}
