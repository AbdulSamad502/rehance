import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronLeft, X } from 'lucide-react'
import { Button } from '../../components/ui'
import { cn } from '../../lib/utils'
import { useStore } from '../../store'

interface Step { title: string; text: string; route: string; as: 'physio' | 'patient' | 'none'; patient?: string | null }

// The investor story: one recovery loop across both portals.
export const TOUR: Step[] = [
  { title: 'The clinic day at a glance', text: 'The physio workspace merges front-desk operations and clinical care. Today\'s schedule, collections, alerts and the AI review queue are all on one screen.', route: '/physio', as: 'physio' },
  { title: 'Register a patient and send the app invite', text: 'Reception registers a patient and sends an invite code. Deepak Joshi was just registered. Open his profile to see the invite (code GP-4821).', route: '/physio/patients', as: 'physio' },
  { title: 'The patient joins the app', text: 'On the patient side, Deepak enters the invite code, verifies with a one-time code and gives consent. Use the "Join with invite code" option with GP-4821.', route: '/patient', as: 'patient', patient: null },
  { title: 'Priya\'s home exercises', text: 'Priya (post knee replacement) sees exactly what her therapist assigned. Heel slides, squats and sit-to-stands can be tracked by the camera.', route: '/patient/exercises', as: 'patient', patient: 'p1' },
  { title: 'Camera-guided exercise', text: 'Open "Heel slides", then Start with camera. The same pose engine counts reps and coaches form. No diagnosis, just guidance. Choose the simulated option if no camera is handy.', route: '/patient/exercises', as: 'patient', patient: 'p1' },
  { title: 'Results flow back to the physio', text: 'Back in the clinic, the physio sees Priya\'s symptom check-in, her exercise adherence and a home motion analysis waiting for review.', route: '/physio', as: 'physio' },
  { title: 'Real AI Motion Analysis', text: 'Start a new analysis: pick the patient and movement, check camera positioning, then capture. Joint angles, rep counts, symmetry and quality are computed live from the webcam.', route: '/physio/motion/new', as: 'physio' },
  { title: 'Review and approve', text: 'The therapist compares the AI estimate with their manual measurement, adds notes, and approves. Only approved results reach the patient.', route: '/physio/motion/review/m5', as: 'physio' },
  { title: 'The patient sees approved feedback', text: 'Priya\'s progress screen now shows her approved knee flexion in plain language, tracked against her goal.', route: '/patient/progress', as: 'patient', patient: 'p1' },
  { title: 'That is the loop', text: 'Clinic operations, clinical decisions and patient engagement, connected. Explore freely, or reset the demo from the home page.', route: '/', as: 'none' },
]

export default function Tour() {
  const nav = useNavigate()
  const open = useStore((s) => s.ui.tourOpen)
  const step = useStore((s) => s.ui.tourStep)
  const setTour = useStore((s) => s.setTour)
  const setPatientId = useStore((s) => s.setPatientId)
  const setPhysioRole = useStore((s) => s.setPhysioRole)
  if (!open) return null

  const s = TOUR[step]
  const last = step === TOUR.length - 1

  const go = (i: number) => {
    const t = TOUR[i]
    if (t.as === 'physio') setPhysioRole('physio')
    if (t.patient !== undefined) setPatientId(t.patient)
    setTour(true, i)
    nav(t.route)
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center p-3 sm:p-5 lg:justify-end">
      <div className="fade-up pointer-events-auto w-full max-w-md rounded-3xl border border-white/20 bg-brand-900/95 p-4 text-white shadow-2xl backdrop-blur-xl">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {TOUR.map((_, i) => <span key={i} className={cn('h-1.5 rounded-full transition-all', i === step ? 'w-6 bg-teal-400' : i < step ? 'w-1.5 bg-teal-400/60' : 'w-1.5 bg-white/25')} />)}
          </div>
          <button onClick={() => setTour(false)} aria-label="End tour" className="grid h-7 w-7 place-items-center rounded-full bg-white/10 hover:bg-white/20"><X size={14} /></button>
        </div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-teal-300">Step {step + 1} of {TOUR.length}</div>
        <div className="mt-0.5 text-base font-extrabold">{s.title}</div>
        <p className="mt-1 text-[13px] leading-relaxed text-white/80">{s.text}</p>
        <div className="mt-3 flex items-center gap-2">
          {step > 0 && <Button size="sm" variant="ghost" className="!text-white/80 hover:!bg-white/10" icon={<ChevronLeft size={16} />} onClick={() => go(step - 1)}>Back</Button>}
          <div className="flex-1" />
          {last ? <Button size="sm" variant="teal" onClick={() => setTour(false)}>Finish</Button>
            : <Button size="sm" variant="teal" onClick={() => go(step + 1)}>Next<ArrowRight size={16} /></Button>}
        </div>
      </div>
    </div>
  )
}
