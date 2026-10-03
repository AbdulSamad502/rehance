import type { MotionResult } from '../../../types'
import { clamp, mean, round, std } from '../../../lib/utils'
import { jointAngle, jointVisibility, pairTilt, torsoLength, trunkLean, type AngleMode } from './angles'
import type { MovementDef } from './movements'
import { frameQuality, requiredLandmarks } from './quality'
import { RepCounter } from './repCounter'
import { J, type Pose, type Side, type SideChoice } from './types'

export type DraftResult = Omit<MotionResult, 'id' | 'patientId' | 'at' | 'status' | 'visibleToPatient' | 'source'>

export interface LiveState {
  angle: number | null
  angleL: number | null
  angleR: number | null
  reps: number
  partial: number
  quality: number // 0..1 smoothed
  issues: string[]
  elapsed: number // s
  holdSec: number
  steps: number
  moving: boolean
  done: boolean
  postureScore: number | null
  lastRep?: { peak: number; durationMs: number }
}

export interface Replay {
  w: number
  h: number
  times: number[]
  frames: Float32Array[] // 33 * (x, y, v)
}

interface Sample { t: number; p: number; l: number; r: number; q: number; aux: number }

const percentile = (a: number[], p: number) => {
  const v = a.filter(Number.isFinite).sort((x, y) => x - y)
  if (!v.length) return NaN
  return v[Math.min(v.length - 1, Math.floor((p / 100) * v.length))]
}

/** Detect step events from the signed ankle separation signal (torso-lengths). */
export function detectSteps(ts: number[], d: number[], prom = 0.35): { t: number; sign: 1 | -1 }[] {
  const s = d.map((_, i) => mean(d.slice(Math.max(0, i - 1), i + 2)))
  const ev: { t: number; sign: 1 | -1; mag: number }[] = []
  for (let i = 1; i < s.length - 1; i++) {
    if (s[i] >= s[i - 1] && s[i] > s[i + 1] && s[i] > prom) ev.push({ t: ts[i], sign: 1, mag: s[i] })
    else if (s[i] <= s[i - 1] && s[i] < s[i + 1] && s[i] < -prom) ev.push({ t: ts[i], sign: -1, mag: -s[i] })
  }
  const out: typeof ev = []
  for (const e of ev) {
    const last = out[out.length - 1]
    if (last && last.sign === e.sign) { if (e.mag > last.mag) out[out.length - 1] = e }
    else if (last && e.t - last.t < 250) continue
    else out.push(e)
  }
  return out.map(({ t, sign }) => ({ t, sign }))
}

export class MotionSession {
  private t0: number | null = null
  private counter: RepCounter | null
  private samples: Sample[] = []
  private qEma = 0
  private lost = 0
  private frames = 0
  private lastTick = 0
  private liveSteps = 0
  private replay: Replay
  private lastReplayT = -1e9

  // balance
  private holding = false
  private holdStart = 0
  private lastLift = 0
  private holds: number[] = []
  private sway: number[] = []
  private liftedSide: Side[] = []
  // posture
  private pm: { sTilt: number[]; pTilt: number[]; head: number[]; trunk: number[]; ear: number[]; incl: number[] } =
    { sTilt: [], pTilt: [], head: [], trunk: [], ear: [], incl: [] }

  readonly live: LiveState = {
    angle: null, angleL: null, angleR: null, reps: 0, partial: 0, quality: 0, issues: [],
    elapsed: 0, holdSec: 0, steps: 0, moving: false, done: false, postureScore: null,
  }

  readonly def: MovementDef
  readonly side: SideChoice
  private w: number
  private h: number
  private mode: AngleMode

  constructor(def: MovementDef, side: SideChoice, w: number, h: number, mode: AngleMode = '3d') {
    this.def = def
    this.side = side
    this.w = w
    this.h = h
    this.mode = mode
    this.counter = def.rep ? new RepCounter(def.rep.low, def.rep.high) : null
    this.replay = { w, h, times: [], frames: [] }
  }

  setSize(w: number, h: number) { this.w = w; this.h = h; this.replay.w = w; this.replay.h = h }

  push(pose: Pose | null, tMs: number): LiveState {
    if (this.t0 === null) this.t0 = tMs
    const t = tMs - this.t0
    this.live.elapsed = t / 1000
    this.frames++
    if (!pose) {
      this.lost++
      this.qEma = this.qEma * 0.9
      this.live.quality = this.qEma
      this.live.issues = ['No person detected']
      this.samples.push({ t, p: NaN, l: NaN, r: NaN, q: 0, aux: NaN })
      return this.live
    }

    const def = this.def
    const req = requiredLandmarks(def, this.side, pose)
    const q = frameQuality(pose, req)
    this.qEma = this.qEma * 0.85 + q * 0.15
    this.live.quality = this.qEma
    this.live.issues = q < 0.55 ? ['Tracking confidence is low. Check lighting and framing'] : []

    let p = NaN, l = NaN, r = NaN, aux = NaN

    if (def.kind === 'rom' || def.kind === 'squat' || def.kind === 'sts') {
      const joint = def.joint!
      const visL = jointVisibility(pose, joint, 'L') > 0.45
      const visR = jointVisibility(pose, joint, 'R') > 0.45
      if (visL) l = jointAngle(pose, joint, 'L', this.mode, this.w, this.h)
      if (visR) r = jointAngle(pose, joint, 'R', this.mode, this.w, this.h)
      if (joint === 'trunk' && (Number.isFinite(l) || Number.isFinite(r))) { const a = Number.isFinite(l) ? l : r; l = a; r = a } // one trunk, seen from either side
      if (def.kind === 'rom') p = this.side === 'Left' ? l : this.side === 'Right' ? r : mean([l, r].filter(Number.isFinite))
      else p = [l, r].filter(Number.isFinite).length ? mean([l, r].filter(Number.isFinite)) : NaN
      this.live.angleL = Number.isFinite(l) ? l : null
      this.live.angleR = Number.isFinite(r) ? r : null
      this.live.angle = Number.isFinite(p) ? p : null
      if (Number.isFinite(p) && q >= 0.4) {
        this.counter?.push(p, t)
        this.live.reps = this.counter?.reps.length ?? 0
        const lr = this.counter?.reps[this.live.reps - 1]
        this.live.lastRep = lr ? { peak: lr.peak, durationMs: lr.durationMs } : undefined
        this.live.partial = this.counter?.partial ?? 0
        this.live.moving = this.counter?.inRep ?? false
      }
      if (def.kind === 'squat' && def.view === 'front') {
        const kw = Math.abs(pose.lm[J.L_KNE].x - pose.lm[J.R_KNE].x)
        const aw = Math.abs(pose.lm[J.L_ANK].x - pose.lm[J.R_ANK].x) || 1e-6
        aux = kw / aw
      }
    } else if (def.kind === 'gait') {
      const tp = torsoLength(pose, this.w, this.h) || 1
      p = ((pose.lm[J.L_ANK].x - pose.lm[J.R_ANK].x) * this.w) / tp
      this.live.angle = p
    } else if (def.kind === 'balance') {
      const tp = torsoLength(pose, this.w, this.h) || 1
      const dy = ((pose.lm[J.L_ANK].y - pose.lm[J.R_ANK].y) * this.h) / tp
      p = dy
      const lifted = Math.abs(dy) > 0.18 && q > 0.45
      if (lifted) {
        if (!this.holding) { this.holding = true; this.holdStart = t }
        this.lastLift = t
        this.liftedSide.push(dy < 0 ? 'L' : 'R')
        const hx = (((pose.lm[J.L_HIP].x + pose.lm[J.R_HIP].x) / 2) * this.w) / tp
        this.sway.push(hx)
      } else if (this.holding && t - this.lastLift > 400) {
        this.holds.push((this.lastLift - this.holdStart) / 1000)
        this.holding = false
      }
      this.live.holdSec = this.holding ? (t - this.holdStart) / 1000 : 0
      this.live.moving = this.holding
    } else if (def.kind === 'posture-front' || def.kind === 'posture-side') {
      if (q > 0.55) {
        const tp = torsoLength(pose, this.w, this.h) || 1
        const shoMidX = (pose.lm[J.L_SHO].x + pose.lm[J.R_SHO].x) / 2
        const hipMidX = (pose.lm[J.L_HIP].x + pose.lm[J.R_HIP].x) / 2
        const earMidX = (pose.lm[J.L_EAR].x + pose.lm[J.R_EAR].x) / 2
        const lean = trunkLean(pose, this.w, this.h)
        if (def.kind === 'posture-front') {
          this.pm.sTilt.push(pairTilt(pose, J.L_SHO, J.R_SHO, this.w, this.h))
          this.pm.pTilt.push(pairTilt(pose, J.L_HIP, J.R_HIP, this.w, this.h))
          this.pm.head.push(((pose.lm[J.NOSE].x - shoMidX) * this.w * 100) / tp)
          this.pm.trunk.push(((shoMidX - hipMidX) * this.w * 100) / tp)
        } else {
          const facing = Math.sign(pose.lm[J.NOSE].x - earMidX) || 1
          this.pm.ear.push((facing * (earMidX - shoMidX) * this.w * 100) / tp)
          this.pm.incl.push(facing * lean)
        }
        this.live.postureScore = this.postureScore()
      }
    }

    if (def.kind === 'gait' && t - this.lastTick > 500) {
      this.lastTick = t
      const ts = this.samples.map((s) => s.t)
      const d = this.samples.map((s) => (Number.isFinite(s.p) ? s.p : 0))
      this.liveSteps = detectSteps(ts, d).length
    }
    this.live.steps = this.liveSteps

    this.samples.push({ t, p, l, r, q, aux })

    if (t - this.lastReplayT >= 50 && this.replay.frames.length < 2400) {
      this.lastReplayT = t
      const f = new Float32Array(33 * 3)
      for (let i = 0; i < 33; i++) { f[i * 3] = pose.lm[i].x; f[i * 3 + 1] = pose.lm[i].y; f[i * 3 + 2] = pose.lm[i].v }
      this.replay.times.push(t)
      this.replay.frames.push(f)
    }

    if (def.seconds && this.live.elapsed >= def.seconds) this.live.done = true
    return this.live
  }

  private postureScore(): number | null {
    const m = (a: number[]) => (a.length ? mean(a) : 0)
    if (this.def.kind === 'posture-front') {
      if (!this.pm.sTilt.length) return null
      return clamp(round(100 - 4 * Math.abs(m(this.pm.sTilt)) - 4 * Math.abs(m(this.pm.pTilt)) - 0.6 * Math.abs(m(this.pm.head)) - 0.6 * Math.abs(m(this.pm.trunk))), 0, 100)
    }
    if (!this.pm.ear.length) return null
    return clamp(round(100 - 1.2 * Math.max(0, m(this.pm.ear) - 8) - 2.5 * Math.abs(m(this.pm.incl))), 0, 100)
  }

  getReplay() { return this.replay }

  finish(): DraftResult {
    const def = this.def
    const durationSec = round(this.live.elapsed, 1)
    const quality = round(mean(this.samples.map((s) => s.q)) * 100)
    const warnings: string[] = []
    const observations: string[] = []
    const extra: DraftResult['extra'] = []
    let reps: DraftResult['reps'] = []
    let headline = 0
    let metricLabel = def.metricLabel
    let seriesLabel = ''
    let series: number[] = []
    let peakLeft: number | undefined
    let peakRight: number | undefined
    let symmetry: number | undefined
    let tempoSec: number | undefined
    let consistency: number | undefined

    const flag = (v: number, ok: number, watch: number): 'ok' | 'watch' | 'alert' => (v <= ok ? 'ok' : v <= watch ? 'watch' : 'alert')
    const bin = (vals: number[]) => {
      const out: number[] = []
      let i = 0
      while (i < this.samples.length) {
        const t0 = this.samples[i].t
        const acc: number[] = []
        while (i < this.samples.length && this.samples[i].t - t0 < 100) { if (Number.isFinite(vals[i])) acc.push(vals[i]); i++ }
        out.push(acc.length ? round(mean(acc), 1) : NaN)
      }
      return out.map((v, k) => (Number.isFinite(v) ? v : out[k - 1] ?? 0)).slice(0, 600)
    }

    if (def.kind === 'rom' || def.kind === 'squat' || def.kind === 'sts') {
      reps = this.counter?.reps ?? []
      const prim = this.samples.map((s) => s.p)
      const maxSig = Math.max(0, ...prim.filter(Number.isFinite))
      const peaks = reps.map((r) => r.peak)
      if (def.kind === 'sts') {
        // time per stand = full cycle (start of one rep to the start of the next), like a clinical chair-stand test
        const starts = reps.map((r) => r.startMs ?? 0)
        const gaps = starts.slice(1).map((s, i) => s - starts[i])
        headline = gaps.length ? mean(gaps) / 1000 : reps.length ? reps[0].durationMs / 1000 : 0
      } else headline = peaks.length ? Math.max(...peaks) : maxSig
      headline = round(headline, def.unit === 's' ? 1 : 0)
      series = bin(prim)
      seriesLabel = def.kind === 'sts' ? 'Knee flexion (°)' : `${def.region} angle (°)`

      if (reps.length) {
        tempoSec = round(mean(reps.map((r) => r.durationMs)) / 1000, 1)
        const into = mean(reps.map((r) => r.upMs)) / 1000
        const back = mean(reps.map((r) => r.downMs)) / 1000
        extra.push({ label: 'Repetitions counted', value: String(reps.length), flag: reps.length >= 3 ? 'ok' : 'watch' })
        extra.push({ label: 'Average rep time', value: `${tempoSec} s` })
        extra.push({ label: 'Into range / return', value: `${round(into, 1)} s / ${round(back, 1)} s` })
        if (reps.length >= 2) {
          const cv = std(peaks) / (mean(peaks) || 1)
          consistency = clamp(round(100 - cv * 400), 0, 100)
          extra.push({ label: 'Consistency', value: `${consistency}%`, flag: consistency >= 80 ? 'ok' : consistency >= 60 ? 'watch' : 'alert' })
        }
        extra.push({ label: 'Range across reps', value: `${round(Math.min(...peaks))}° to ${round(Math.max(...peaks))}°` })
      }

      const pl = def.joint === 'trunk' ? NaN : percentile(this.samples.map((s) => s.l), 95)
      const pr = def.joint === 'trunk' ? NaN : percentile(this.samples.map((s) => s.r), 95)
      if (Number.isFinite(pl)) peakLeft = round(pl)
      if (Number.isFinite(pr)) peakRight = round(pr)
      if (peakLeft !== undefined && peakRight !== undefined) {
        const hi = Math.max(peakLeft, peakRight)
        const lo = Math.min(peakLeft, peakRight)
        const bothMoved = def.sideMode === 'both' || lo >= 0.5 * hi
        if (bothMoved && hi > 0) {
          symmetry = round(100 * (1 - (hi - lo) / hi))
          extra.push({ label: 'Left / right peak', value: `${peakLeft}° / ${peakRight}°` })
          extra.push({ label: 'Symmetry', value: `${symmetry}%`, flag: symmetry >= 90 ? 'ok' : symmetry >= 80 ? 'watch' : 'alert' })
        }
      }

      if (def.kind === 'squat' && def.view === 'front') {
        const ratios = this.samples.map((s) => s.aux).filter(Number.isFinite)
        if (ratios.length) {
          const minRatio = Math.min(...ratios)
          extra.push({ label: 'Knee valgus indicator', value: minRatio < 0.85 ? 'Knees drift inward' : 'Knees tracking over feet', flag: minRatio < 0.85 ? 'watch' : 'ok' })
        }
      }

      // Observations (rule-based, not diagnostic)
      if (def.kind === 'sts') {
        if (reps.length) {
          observations.push(headline <= def.target ? `Average ${headline} s per stand is within the ${def.target} s reference.` : `Average ${headline} s per stand is slower than the ${def.target} s reference. Consider lower-limb strengthening.`)
        }
      } else if (headline > 0) {
        const gap = round(def.target - headline)
        if (gap <= 0) observations.push(`Reached the goal of ${def.target}${def.unit} (best ${headline}${def.unit}).`)
        else if (gap <= 10) observations.push(`Close to goal: ${gap}${def.unit} short of the ${def.target}${def.unit} target.`)
        else observations.push(`${gap}${def.unit} below the ${def.target}${def.unit} goal. Continue range-focused work.`)
        if (headline >= def.normal[0] && headline <= def.normal[1]) observations.push('Measured range is within the typical functional range.')
      }
      if (tempoSec !== undefined) {
        if (tempoSec < 1.5) observations.push(`Repetitions were fast (about ${tempoSec} s each). Slower, controlled reps are recommended.`)
        else if (tempoSec > 6) observations.push(`Repetitions were slow (about ${tempoSec} s each).`)
      }
      if (consistency !== undefined && consistency < 70) observations.push('Range varied noticeably between repetitions.')
      if (symmetry !== undefined && peakLeft !== undefined && peakRight !== undefined && symmetry < 85) {
        const weaker = peakLeft < peakRight ? 'left' : 'right'
        observations.push(`The ${weaker} side reached ${Math.min(peakLeft, peakRight)}° vs ${Math.max(peakLeft, peakRight)}° on the other side (${100 - symmetry}% difference).`)
      }
      if (!reps.length) warnings.push('No complete repetition detected. Start from the rest position and move through the full range.')
      else if (reps.length < 3) warnings.push('Fewer than 3 repetitions were captured. Repeat for a more reliable estimate.')
    } else if (def.kind === 'gait') {
      const ts = this.samples.map((s) => s.t)
      const d = this.samples.map((s) => (Number.isFinite(s.p) ? s.p : 0))
      const ev = detectSteps(ts, d)
      const stepT = ev.slice(1).map((e, i) => (e.t - ev[i].t) / 1000).filter((x) => x > 0.2 && x < 2)
      series = bin(d)
      seriesLabel = 'Ankle separation (torso lengths)'
      metricLabel = 'Cadence'
      if (stepT.length >= 3) {
        const mt = mean(stepT)
        headline = round(60 / mt)
        const odd = stepT.filter((_, i) => i % 2 === 0)
        const even = stepT.filter((_, i) => i % 2 === 1)
        const a = mean(odd), b = mean(even)
        symmetry = round(100 * (1 - Math.abs(a - b) / Math.max(a, b)))
        const cv = (std(stepT) / mt) * 100
        extra.push({ label: 'Steps detected', value: String(ev.length), flag: ev.length >= 8 ? 'ok' : 'watch' })
        extra.push({ label: 'Mean step time', value: `${round(mt, 2)} s` })
        extra.push({ label: 'Step-time symmetry', value: `${symmetry}%`, flag: symmetry >= 92 ? 'ok' : symmetry >= 85 ? 'watch' : 'alert' })
        extra.push({ label: 'Rhythm variability', value: `${round(cv, 1)}%`, flag: flag(cv, 6, 10) })
        tempoSec = round(mt, 2)
        consistency = clamp(round(100 - cv * 5), 0, 100)
        observations.push(headline >= def.normal[0] && headline <= def.normal[1] ? `Cadence of ${headline} steps/min is within the typical adult range (${def.normal[0]} to ${def.normal[1]}).` : `Cadence of ${headline} steps/min is outside the typical adult range (${def.normal[0]} to ${def.normal[1]}).`)
        if (symmetry < 90) observations.push('Alternating step times differ. Consider a closer visual gait assessment.')
        if (ev.length < 8) warnings.push('Fewer than 8 steps captured. Walk further across the view for a stable estimate.')
      } else {
        headline = 0
        warnings.push('Not enough steps detected. Walk side-on across the full view at a natural pace.')
      }
    } else if (def.kind === 'balance') {
      if (this.holding) this.holds.push((this.lastLift - this.holdStart) / 1000)
      const best = this.holds.length ? Math.max(...this.holds) : 0
      headline = round(best, 1)
      series = bin(this.samples.map((s) => s.p))
      seriesLabel = 'Foot height difference (torso lengths)'
      extra.push({ label: 'Holds recorded', value: String(this.holds.length) })
      if (this.holds.length) {
        const swayPct = std(this.sway) * 100
        const lifted = this.liftedSide.filter((s) => s === 'L').length >= this.liftedSide.length / 2 ? 'Left' : 'Right'
        extra.push({ label: 'Foot lifted', value: lifted })
        extra.push({ label: 'Postural sway', value: `${round(swayPct, 1)}% of torso`, flag: flag(swayPct, 4, 8) })
        observations.push(best >= def.target ? `Held ${round(best, 1)} s, meeting the ${def.target} s reference.` : `Held ${round(best, 1)} s, below the ${def.target} s reference.`)
      } else warnings.push('No single-leg hold detected. Lift one foot clearly off the floor.')
    } else {
      // Posture
      const m = (a: number[]) => (a.length ? mean(a) : 0)
      const score = this.postureScore()
      headline = score ?? 0
      seriesLabel = 'Alignment score'
      series = [headline]
      if (def.kind === 'posture-front') {
        const st = round(m(this.pm.sTilt), 1), pt = round(m(this.pm.pTilt), 1)
        const hd = round(m(this.pm.head), 1), tr = round(m(this.pm.trunk), 1)
        extra.push({ label: 'Shoulder tilt', value: `${Math.abs(st)}° (${st >= 0 ? 'left' : 'right'} lower)`, flag: flag(Math.abs(st), 2, 4) })
        extra.push({ label: 'Pelvic tilt', value: `${Math.abs(pt)}° (${pt >= 0 ? 'left' : 'right'} lower)`, flag: flag(Math.abs(pt), 2, 4) })
        extra.push({ label: 'Head offset', value: `${Math.abs(hd)}% of torso`, flag: flag(Math.abs(hd), 5, 10) })
        extra.push({ label: 'Trunk shift', value: `${Math.abs(tr)}% of torso`, flag: flag(Math.abs(tr), 5, 10) })
        if (Math.abs(st) > 2) observations.push(`Shoulder line tilts ${Math.abs(st)}° with the ${st >= 0 ? 'left' : 'right'} side lower.`)
        if (Math.abs(pt) > 2) observations.push(`Pelvic line tilts ${Math.abs(pt)}° with the ${pt >= 0 ? 'left' : 'right'} side lower.`)
        if (Math.abs(st) <= 2 && Math.abs(pt) <= 2) observations.push('Shoulder and pelvic levels are within 2° of horizontal.')
      } else {
        const ear = round(m(this.pm.ear), 1), inc = round(m(this.pm.incl), 1)
        extra.push({ label: 'Ear-to-shoulder offset', value: `${ear}% of torso`, flag: flag(ear, 8, 15) })
        extra.push({ label: 'Trunk inclination', value: `${inc}° forward`, flag: flag(Math.abs(inc), 3, 6) })
        if (ear > 8) observations.push(`Head sits ${ear}% of torso length ahead of the shoulders (forward-head indicator).`)
        else observations.push('Head and shoulders are stacked within the typical range.')
      }
      if (!this.pm.sTilt.length && !this.pm.ear.length) warnings.push('Not enough clear frames for posture. Hold still and keep your whole body in view.')
    }

    if (quality < 65) warnings.push('Tracking confidence was low for part of the capture. Consider repeating with better lighting or framing.')
    if (this.lost > this.frames * 0.2) warnings.push('The person was lost from view for more than 20% of the capture.')
    if (durationSec < 3 && def.kind !== 'posture-front' && def.kind !== 'posture-side') warnings.push('Very short capture. Longer captures give more reliable estimates.')

    return {
      category: def.category,
      movementId: def.id,
      movementLabel: def.label,
      region: def.region,
      side: this.side,
      durationSec,
      metricLabel,
      headline,
      unit: def.unit,
      target: def.target,
      reps,
      peakLeft,
      peakRight,
      symmetry,
      tempoSec,
      consistency,
      quality,
      extra,
      observations,
      warnings,
      series,
      seriesLabel,
    }
  }
}
