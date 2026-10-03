import type { MotionCategory } from '../../../types'
import type { JointId } from './types'

export interface MovementDef {
  id: string
  label: string
  category: MotionCategory
  region: string
  emoji: string
  view: 'side' | 'front'
  fullBody: boolean
  sideMode: 'select' | 'both' | 'none'
  joint?: JointId
  kind: 'rom' | 'squat' | 'sts' | 'balance' | 'gait' | 'posture-front' | 'posture-side'
  metricLabel: string
  unit: string
  rep?: { low: number; high: number }
  target: number
  lowerBetter?: boolean
  normal: [number, number]
  seconds?: number // fixed-length captures (posture)
  how: string[]
  cue: string
  camera: string
}

export const MOVEMENTS: MovementDef[] = [
  {
    id: 'knee-flex', label: 'Knee flexion / extension', category: 'rom', region: 'Knee', emoji: '🦵',
    view: 'side', fullBody: true, sideMode: 'select', joint: 'knee', kind: 'rom',
    metricLabel: 'Peak knee flexion', unit: '°', rep: { low: 15, high: 40 }, target: 120, normal: [0, 135],
    how: ['Stand side-on to the camera, holding a chair for balance.', 'Bend the knee to bring your heel toward your buttock, then straighten.', 'Repeat slowly 5 times.'],
    cue: 'Bend your knee as far as comfortable, then straighten fully.',
    camera: 'Place the camera at hip height, about 2.5 m away, with your whole leg in view.',
  },
  {
    id: 'shoulder-flex', label: 'Shoulder flexion', category: 'rom', region: 'Shoulder', emoji: '💪',
    view: 'side', fullBody: false, sideMode: 'select', joint: 'shoulder', kind: 'rom',
    metricLabel: 'Peak shoulder flexion', unit: '°', rep: { low: 25, high: 70 }, target: 170, normal: [0, 180],
    how: ['Stand side-on to the camera with your arm by your side.', 'Raise the straight arm forward and up as high as you can.', 'Lower slowly. Repeat 5 times.'],
    cue: 'Lift your arm forward and up, keeping the elbow straight.',
    camera: 'Place the camera at chest height, about 2 m away, showing hip to hand.',
  },
  {
    id: 'shoulder-abd', label: 'Shoulder abduction', category: 'rom', region: 'Shoulder', emoji: '🙆',
    view: 'front', fullBody: false, sideMode: 'select', joint: 'shoulder', kind: 'rom',
    metricLabel: 'Peak shoulder abduction', unit: '°', rep: { low: 25, high: 70 }, target: 170, normal: [0, 180],
    how: ['Face the camera with arms by your sides.', 'Raise the straight arm out to the side and overhead.', 'Lower slowly. Repeat 5 times.'],
    cue: 'Lift your arm out to the side and up.',
    camera: 'Place the camera at chest height, about 2 m away, facing you.',
  },
  {
    id: 'elbow-flex', label: 'Elbow flexion / extension', category: 'rom', region: 'Elbow', emoji: '🦾',
    view: 'side', fullBody: false, sideMode: 'select', joint: 'elbow', kind: 'rom',
    metricLabel: 'Peak elbow flexion', unit: '°', rep: { low: 25, high: 60 }, target: 145, normal: [0, 150],
    how: ['Stand side-on with your arm by your side.', 'Bend the elbow to bring your hand toward your shoulder.', 'Straighten fully. Repeat 5 times.'],
    cue: 'Curl your hand toward your shoulder, then straighten.',
    camera: 'Camera at chest height, about 2 m away, showing shoulder to hand.',
  },
  {
    id: 'hip-flex', label: 'Hip flexion (standing march)', category: 'rom', region: 'Hip', emoji: '🚶',
    view: 'side', fullBody: true, sideMode: 'select', joint: 'hip', kind: 'rom',
    metricLabel: 'Peak hip flexion', unit: '°', rep: { low: 12, high: 30 }, target: 80, normal: [0, 120],
    how: ['Stand side-on to the camera, holding a chair if needed.', 'Lift the knee up toward your chest, then lower.', 'Repeat 5 times.'],
    cue: 'Lift your knee up toward your chest.',
    camera: 'Camera at hip height, about 2.5 m away, full body in view.',
  },
  {
    id: 'trunk-flex', label: 'Trunk (lumbar) flexion', category: 'rom', region: 'Lumbar spine', emoji: '🧘',
    view: 'side', fullBody: false, sideMode: 'select', joint: 'trunk', kind: 'rom',
    metricLabel: 'Peak forward bend (trunk angle)', unit: '°', rep: { low: 10, high: 30 }, target: 60, normal: [0, 80],
    how: ['Stand side-on to the camera, feet hip-width apart, knees straight.', 'Bend forward from the waist as far as is comfortable, arms hanging.', 'Return slowly to upright. Repeat 5 times.'],
    cue: 'Bend forward from the waist, then stand back up slowly.',
    camera: 'Camera at waist height, about 2.5 m away, showing head to hips side-on.',
  },  {
    id: 'squat', label: 'Bodyweight squat', category: 'functional', region: 'Lower limb', emoji: '🏋️',
    view: 'side', fullBody: true, sideMode: 'both', joint: 'knee', kind: 'squat',
    metricLabel: 'Squat depth (knee flexion)', unit: '°', rep: { low: 20, high: 50 }, target: 90, normal: [70, 120],
    how: ['Stand side-on, feet shoulder-width apart.', 'Sit your hips back and down as if into a chair, then stand.', 'Repeat 5 times at a steady pace.'],
    cue: 'Sit back and down, then drive up through your heels.',
    camera: 'Camera at hip height, about 3 m away, full body in view.',
  },
  {
    id: 'sit-to-stand', label: 'Sit-to-stand', category: 'functional', region: 'Lower limb', emoji: '🪑',
    view: 'side', fullBody: true, sideMode: 'both', joint: 'knee', kind: 'sts',
    metricLabel: 'Average time per stand', unit: 's', rep: { low: 25, high: 65 }, target: 2.4, lowerBetter: true, normal: [1.5, 3],
    how: ['Sit on a chair, arms crossed over your chest, side-on to the camera.', 'Stand up fully, then sit back down.', 'Repeat 5 times as fast as is safe.'],
    cue: 'Stand up fully, then sit down with control.',
    camera: 'Camera at hip height, about 3 m away, chair and full body in view.',
  },
  {
    id: 'single-leg', label: 'Single-leg balance', category: 'functional', region: 'Balance', emoji: '⚖️',
    view: 'front', fullBody: true, sideMode: 'none', kind: 'balance',
    metricLabel: 'Longest single-leg hold', unit: 's', target: 10, normal: [10, 60],
    how: ['Face the camera, standing near a wall or chair for safety.', 'Lift one foot off the floor and balance for as long as you can.', 'Capture stops automatically after 30 s.'],
    cue: 'Lift one foot and stay steady.',
    camera: 'Camera at waist height, about 3 m away, facing you, full body in view.',
    seconds: 30,
  },
  {
    id: 'gait', label: 'Walking (gait)', category: 'gait', region: 'Gait', emoji: '👣',
    view: 'side', fullBody: true, sideMode: 'none', kind: 'gait',
    metricLabel: 'Cadence', unit: 'steps/min', target: 100, normal: [90, 120],
    how: ['Stand side-on to the camera, 4 m away.', 'Walk across the view at your normal pace, turn and walk back.', 'Capture 15 to 20 steps.'],
    cue: 'Walk naturally across the view.',
    camera: 'Place the camera at hip height with about 4 m of clear walkway across the view.',
  },
  {
    id: 'posture-front', label: 'Standing posture (front)', category: 'posture', region: 'Posture', emoji: '🧍',
    view: 'front', fullBody: true, sideMode: 'none', kind: 'posture-front',
    metricLabel: 'Alignment score', unit: '/100', target: 85, normal: [85, 100],
    how: ['Face the camera, feet hip-width apart, arms relaxed.', 'Stand tall and look straight ahead.', 'Hold still for 5 seconds.'],
    cue: 'Stand tall and relaxed.',
    camera: 'Camera at chest height, about 3 m away, level and facing you, full body in view.',
    seconds: 5,
  },
  {
    id: 'posture-side', label: 'Standing posture (side)', category: 'posture', region: 'Posture', emoji: '🧍‍♂️',
    view: 'side', fullBody: true, sideMode: 'none', kind: 'posture-side',
    metricLabel: 'Alignment score', unit: '/100', target: 85, normal: [85, 100],
    how: ['Stand side-on to the camera, arms relaxed.', 'Stand tall and look straight ahead.', 'Hold still for 5 seconds.'],
    cue: 'Stand tall and relaxed.',
    camera: 'Camera at chest height, about 3 m away, level, side-on, full body in view.',
    seconds: 5,
  },
]

export const getMovement = (id: string) => MOVEMENTS.find((m) => m.id === id)

export const CATEGORIES: { id: MotionCategory; label: string; blurb: string; emoji: string }[] = [
  { id: 'rom', label: 'Range of Motion', blurb: 'Joint angles and repetitions', emoji: '📐' },
  { id: 'posture', label: 'Posture', blurb: 'Alignment and tilt indicators', emoji: '🧍' },
  { id: 'gait', label: 'Gait', blurb: 'Cadence, step timing, rhythm', emoji: '👣' },
  { id: 'functional', label: 'Functional', blurb: 'Squat, sit-to-stand, balance', emoji: '🏋️' },
]
