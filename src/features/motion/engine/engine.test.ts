import { describe, expect, it } from 'vitest'
import { angleAt, jointAngle } from './angles'
import { getMovement } from './movements'
import { RepCounter } from './repCounter'
import { MotionSession } from './session'
import { buildPose, simDriver, SIM_DEFAULT } from './sim'
import type { SideChoice } from './types'

const W = 640, H = 480

function run(id: string, side: SideChoice, seconds: number, mode: '3d' | '2d' = '3d') {
  const def = getMovement(id)!
  const s = new MotionSession(def, side, W, H, mode)
  for (let t = 0; t <= seconds * 1000; t += 33) {
    s.push(buildPose(simDriver(def, side, t / 1000), def.view, t, W / H), t)
  }
  return s.finish()
}

describe('angle maths', () => {
  it('right angle', () => {
    expect(angleAt({ x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 })).toBeCloseTo(90, 5)
  })
  it('recovers commanded knee / hip / elbow / shoulder angles from a synthetic skeleton (3D and 2D)', () => {
    const p = buildPose({ ...SIM_DEFAULT, kneeR: 70, hipR: 40, elbR: 55, shoR: 100 }, 'side', 0)
    for (const mode of ['3d', '2d'] as const) {
      expect(jointAngle(p, 'knee', 'R', mode, W, H)).toBeCloseTo(70, 0)
      expect(jointAngle(p, 'hip', 'R', mode, W, H)).toBeCloseTo(40, 0)
      expect(jointAngle(p, 'elbow', 'R', mode, W, H)).toBeCloseTo(55, 0)
      expect(jointAngle(p, 'shoulder', 'R', mode, W, H)).toBeCloseTo(100, 0)
    }
  })
})

describe('rep counter', () => {
  it('counts only reps that reach the high threshold', () => {
    const rc = new RepCounter(15, 40)
    const wave = [0, 10, 20, 45, 20, 5, 0, 18, 25, 18, 0, 0, 30, 60, 30, 0]
    wave.forEach((v, i) => rc.push(v, i * 300))
    expect(rc.reps.length).toBe(2)
    expect(rc.partial).toBe(1)
  })
})

describe('motion session on simulated movements', () => {
  it('knee flexion: counts reps and recovers the peak angle', () => {
    const r = run('knee-flex', 'Right', 20)
    expect(r.reps.length).toBeGreaterThanOrEqual(5)
    expect(r.headline).toBeGreaterThan(108)
    expect(r.headline).toBeLessThan(118)
    expect(r.quality).toBeGreaterThan(90)
  })
  it('hip flexion', () => {
    const r = run('hip-flex', 'Right', 16)
    expect(r.reps.length).toBeGreaterThanOrEqual(4)
    expect(r.headline).toBeGreaterThan(78)
    expect(r.headline).toBeLessThan(88)
  })
  it('shoulder flexion and abduction', () => {
    for (const id of ['shoulder-flex', 'shoulder-abd']) {
      const r = run(id, 'Right', 18)
      expect(r.reps.length).toBeGreaterThanOrEqual(4)
      expect(r.headline).toBeGreaterThan(150)
      expect(r.headline).toBeLessThan(165)
    }
  })
  it('trunk (lumbar) flexion: recovers forward bend angle and reps', () => {
    const r = run('trunk-flex', 'Right', 20)
    expect(r.reps.length).toBeGreaterThanOrEqual(5)
    expect(r.headline).toBeGreaterThan(55)
    expect(r.headline).toBeLessThan(66)
    expect(r.symmetry).toBeUndefined()
  })
  it('squat: symmetric bilateral depth', () => {
    const r = run('squat', 'Both', 20)
    expect(r.reps.length).toBeGreaterThanOrEqual(5)
    expect(r.headline).toBeGreaterThan(90)
    expect(r.symmetry).toBeGreaterThan(97)
  })
  it('sit-to-stand: time per stand near the commanded 3.6 s', () => {
    const r = run('sit-to-stand', 'Both', 24)
    expect(r.reps.length).toBeGreaterThanOrEqual(4)
    expect(r.headline).toBeGreaterThan(3.3)
    expect(r.headline).toBeLessThan(3.9)
  })
  it('gait: cadence near the commanded 108 steps/min', () => {
    const r = run('gait', 'NA', 15)
    expect(r.headline).toBeGreaterThan(100)
    expect(r.headline).toBeLessThan(116)
  })
  it('single-leg balance: longest hold near the commanded 10.5 s', () => {
    const r = run('single-leg', 'NA', 30)
    expect(r.headline).toBeGreaterThan(9.5)
    expect(r.headline).toBeLessThan(11.5)
  })
  it('posture (front): detects a left-lower shoulder tilt of about 2.6 degrees', () => {
    const r = run('posture-front', 'NA', 5)
    const tilt = r.extra.find((e) => e.label === 'Shoulder tilt')!
    expect(tilt.value).toContain('left lower')
    expect(parseFloat(tilt.value)).toBeGreaterThan(2)
    expect(parseFloat(tilt.value)).toBeLessThan(3.2)
    expect(r.headline).toBeGreaterThan(60)
  })
  it('warns when nobody is in view', () => {
    const def = getMovement('knee-flex')!
    const s = new MotionSession(def, 'Right', W, H)
    for (let t = 0; t < 5000; t += 33) s.push(null, t)
    const r = s.finish()
    expect(r.reps.length).toBe(0)
    expect(r.warnings.length).toBeGreaterThan(0)
  })
})
