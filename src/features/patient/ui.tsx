import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useStore } from '../../store'

export function usePatient() {
  const id = useStore((s) => s.ui.patientId)
  const p = useStore((s) => s.patients.find((x) => x.id === id))
  return p!
}

export function Screen({ title, back = true, action, children, sub }: { title?: string; back?: boolean; action?: ReactNode; children: ReactNode; sub?: string }) {
  const nav = useNavigate()
  return (
    <div className="fade-up px-4 pb-8 pt-3">
      {title && (
        <div className="mb-3 flex items-center gap-2">
          {back && <button onClick={() => nav(-1)} aria-label="Back" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-brand-700 shadow-sm ring-1 ring-line active:scale-95"><ArrowLeft size={18} /></button>}
          <div className="min-w-0 flex-1"><h1 className="truncate text-xl font-extrabold tracking-tight">{title}</h1>{sub && <p className="text-xs text-muted">{sub}</p>}</div>
          {action}
        </div>
      )}
      <div className="space-y-3.5">{children}</div>
    </div>
  )
}

export const H = ({ children, right }: { children: ReactNode; right?: ReactNode }) => (
  <div className="mb-1.5 mt-2 flex items-center justify-between"><h2 className="text-[15px] font-extrabold">{children}</h2>{right}</div>
)
