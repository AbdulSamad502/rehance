// Core pose types shared by the real MediaPipe tracker and the simulated source.

export interface LM {
  x: number // normalised image coords 0..1
  y: number
  z: number
  v: number // visibility 0..1
}

export interface Pose {
  lm: LM[] // 33 image-space landmarks
  world: LM[] // 33 metric landmarks (hip-centred, metres)
  t: number // ms timestamp
}

// MediaPipe BlazePose landmark indices
export const J = {
  NOSE: 0,
  L_EAR: 7, R_EAR: 8,
  L_SHO: 11, R_SHO: 12,
  L_ELB: 13, R_ELB: 14,
  L_WRI: 15, R_WRI: 16,
  L_HIP: 23, R_HIP: 24,
  L_KNE: 25, R_KNE: 26,
  L_ANK: 27, R_ANK: 28,
  L_HEEL: 29, R_HEEL: 30,
  L_FOOT: 31, R_FOOT: 32,
} as const

export const LM_NAMES: Record<number, string> = {
  0: 'head', 7: 'left ear', 8: 'right ear',
  11: 'left shoulder', 12: 'right shoulder', 13: 'left elbow', 14: 'right elbow',
  15: 'left wrist', 16: 'right wrist', 23: 'left hip', 24: 'right hip',
  25: 'left knee', 26: 'right knee', 27: 'left ankle', 28: 'right ankle',
}

export type Side = 'L' | 'R'
export type LimbJoint = 'knee' | 'hip' | 'elbow' | 'shoulder'
export type JointId = LimbJoint | 'trunk'
export type SideChoice = 'Left' | 'Right' | 'Both' | 'NA'

export const BONES: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
  [27, 29], [29, 31], [27, 31], [28, 30], [30, 32], [28, 32],
]
