import type { PhysioRole } from '../types'

export type Area = 'clinical' | 'motion' | 'billing' | 'admin' | 'schedule' | 'patients'
export type Level = 'full' | 'view' | 'none'

// Mirrors section 5 of the feature plan (who can see and modify what).
const MATRIX: Record<PhysioRole, Record<Area, Level>> = {
  owner: { clinical: 'view', motion: 'view', billing: 'full', admin: 'full', schedule: 'full', patients: 'full' },
  receptionist: { clinical: 'none', motion: 'none', billing: 'full', admin: 'view', schedule: 'full', patients: 'full' },
  physio: { clinical: 'full', motion: 'full', billing: 'view', admin: 'none', schedule: 'full', patients: 'full' },
}

export const levelOf = (role: PhysioRole, area: Area): Level => MATRIX[role][area]
export const canEdit = (role: PhysioRole, area: Area) => MATRIX[role][area] === 'full'
export const canSee = (role: PhysioRole, area: Area) => MATRIX[role][area] !== 'none'

export const ROLE_LABEL: Record<PhysioRole, string> = {
  owner: 'Clinic Owner',
  receptionist: 'Receptionist',
  physio: 'Physiotherapist',
}
