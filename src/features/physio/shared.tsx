import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, Badge, type Tone } from '../../components/ui'
import type { ApptStatus, Patient } from '../../types'

export const STATUS_TONE: Record<ApptStatus, Tone> = {
  Scheduled: 'gray', Confirmed: 'blue', 'Checked in': 'teal', 'In progress': 'purple',
  Completed: 'green', Cancelled: 'red', Rescheduled: 'amber', 'No-show': 'red',
}
export const StatusBadge = ({ status }: { status: ApptStatus }) => <Badge tone={STATUS_TONE[status]}>{status}</Badge>

export function PatientChip({ p, sub, to = true, right }: { p: Patient; sub?: ReactNode; to?: boolean; right?: ReactNode }) {
  const inner = (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={p.name} tint={p.tint} size={40} />
      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-ink">{p.name}</div>
        <div className="truncate text-xs text-muted">{sub ?? `${p.code} · ${p.condition}`}</div>
      </div>
      {right && <div className="ml-auto pl-2">{right}</div>}
    </div>
  )
  return to ? <Link to={`/physio/patients/${p.id}`} className="block rounded-xl transition hover:bg-brand-50/60">{inner}</Link> : inner
}

export const statusTone = (s: Patient['status']): Tone => (s === 'active' ? 'green' : s === 'discharged' ? 'gray' : 'amber')
