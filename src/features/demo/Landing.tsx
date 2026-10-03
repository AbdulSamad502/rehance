import { useNavigate } from 'react-router-dom'
import { Activity, ArrowRight, CalendarCheck, HeartPulse, LayoutDashboard, Play, RotateCcw, ShieldCheck, Smartphone, Stethoscope, UserRound } from 'lucide-react'
import { Logo, toast } from '../../components/ui'
import { asset } from '../../lib/utils'
import { useStore } from '../../store'

const DEMO_PATIENT = 'p1'

export default function Landing() {
  const nav = useNavigate()
  const { reset, setPatientId, setTour, setPhysioRole } = useStore.getState()

  const openPhysio = () => { setPhysioRole('physio'); nav('/physio') }
  const openPatient = () => { setPatientId(DEMO_PATIENT); nav('/patient/home') }
  const startTour = () => { reset(); setPatientId(null); setPhysioRole('physio'); setTour(true, 0); nav('/physio') }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-brand-900 via-brand-800 to-brand-700 text-white">
      <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-5 pb-8 pt-5 sm:px-8">
        <header className="flex items-center justify-between">
          <Logo light size={38} />
          <span className="hidden rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/80 ring-1 ring-white/20 sm:inline">Interactive prototype</span>
        </header>

        {/* First screen: choose who you are */}
        <section className="flex flex-1 flex-col justify-center py-5 sm:py-8">
          <div className="fade-up mx-auto max-w-2xl text-center">
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-5xl">Welcome to GearPhys</h1>
            <p className="mt-2 text-sm text-white/80 sm:mt-3 sm:text-lg">Physiotherapy that measures every movement. Choose how you want to explore.</p>
          </div>

          <div className="fade-up mt-5 grid gap-3 sm:mt-8 sm:gap-4 md:grid-cols-2">
            <button onClick={openPhysio} className="group relative overflow-hidden rounded-3xl bg-white p-5 text-left text-ink shadow-2xl transition hover:-translate-y-1 focus-visible:outline-4 focus-visible:outline-teal-300 sm:p-7">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-50" />
              <div className="relative">
                <div className="flex items-center gap-4 sm:block">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 text-white shadow-lg sm:mb-4 sm:h-14 sm:w-14"><Stethoscope size={26} /></div>
                  <h2 className="text-xl font-extrabold leading-tight sm:text-2xl">Doctor / Physiotherapist</h2>
                </div>
                <p className="mt-2 text-sm text-muted">The clinic workspace: front desk and clinical care in one place.</p>
                <ul className="mt-4 hidden grid-cols-2 gap-x-3 gap-y-1.5 text-[13px] font-semibold text-brand-800 sm:grid">
                  {['Clinic dashboard', 'Patients & records', 'AI Motion Analysis', 'Schedule & attendance', 'Billing & reports', 'Assessments & plans'].map((t) => <li key={t} className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-teal-500" />{t}</li>)}
                </ul>
                <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-600">Open workspace <ArrowRight size={16} className="transition group-hover:translate-x-1" /></div>
              </div>
            </button>

            <button onClick={openPatient} className="group relative overflow-hidden rounded-3xl bg-white p-5 text-left text-ink shadow-2xl transition hover:-translate-y-1 focus-visible:outline-4 focus-visible:outline-teal-300 sm:p-7">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal-50" />
              <div className="relative">
                <div className="flex items-center gap-4 sm:block">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-600 to-teal-400 text-white shadow-lg sm:mb-4 sm:h-14 sm:w-14"><UserRound size={26} /></div>
                  <h2 className="text-xl font-extrabold leading-tight sm:text-2xl">Patient</h2>
                </div>
                <p className="mt-2 text-sm text-muted">The patient app: your recovery plan, exercises and progress.</p>
                <ul className="mt-4 hidden grid-cols-2 gap-x-3 gap-y-1.5 text-[13px] font-semibold text-teal-800 sm:grid">
                  {['Home dashboard', 'Camera-guided exercises', 'Progress charts', 'Appointments', 'Symptom check-in', 'Payments & reports'].map((t) => <li key={t} className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" />{t}</li>)}
                </ul>
                <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-teal-600">Open patient app <ArrowRight size={16} className="transition group-hover:translate-x-1" /></div>
              </div>
            </button>
          </div>

          <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
            <button onClick={startTour} className="inline-flex items-center gap-2 rounded-full bg-teal-500 px-5 py-2.5 font-bold text-white shadow-lg transition hover:bg-teal-400"><Play size={16} /> Take the guided tour</button>
            <button onClick={() => nav('/physio/welcome')} className="font-semibold text-white/80 underline-offset-4 hover:text-white hover:underline">Clinic sign-in or registration</button>
            <button onClick={() => { setPatientId(null); nav('/patient/welcome') }} className="font-semibold text-white/80 underline-offset-4 hover:text-white hover:underline">New patient? Join with invite code</button>
          </div>
        </section>

        {/* Below the fold */}
        <section className="grid gap-3 sm:grid-cols-3">
          {[
            { i: <Activity />, t: 'Measured, not guessed', d: 'Joint angles, rep counts, symmetry and posture from a standard webcam, reviewed and approved by the therapist.' },
            { i: <CalendarCheck />, t: 'One connected loop', d: 'The clinic invites the patient, the physio prescribes, the patient exercises, results flow back for review.' },
            { i: <ShieldCheck />, t: 'Clinician stays in control', d: 'AI output is an estimate until a professional approves it. Patients only see what is approved.' },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl bg-white/8 p-5 ring-1 ring-white/15 backdrop-blur [&_svg]:mb-3 [&_svg]:text-teal-300">
              {c.i}
              <div className="font-bold">{c.t}</div>
              <p className="mt-1 text-sm leading-relaxed text-white/70">{c.d}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid items-center gap-6 rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 md:grid-cols-2">
          <img src={asset('logo.jpg')} alt="GearPhys: Physiotherapy app, Recovery and Motion" className="w-full rounded-2xl bg-white shadow-xl" />
          <div className="space-y-3 text-sm text-white/80">
            <div className="flex items-center gap-2 font-bold text-white"><HeartPulse className="text-teal-300" size={18} /> Built for real clinic workflows</div>
            <p>From registration and billing to range-of-motion tracking and home exercise adherence, every screen is wired to the same data so you can see how a change in one place shows up in another.</p>
            <div className="flex flex-wrap gap-4 text-xs text-white/65">
              <span className="inline-flex items-center gap-1.5"><LayoutDashboard size={14} className="text-teal-300" /> Fictional data only</span>
              <span className="inline-flex items-center gap-1.5"><Smartphone size={14} className="text-teal-300" /> Works on phones</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-teal-300" /> Video stays on your device</span>
            </div>
          </div>
        </section>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-5 text-xs text-white/60">
          <span>Prototype for feedback. All patients, staff and results shown are fictional or simulated. Not a medical device.</span>
          <button className="inline-flex items-center gap-1.5 font-semibold text-white/80 hover:text-white" onClick={() => { reset(); toast('Demo data reset to the starting state') }}>
            <RotateCcw size={14} /> Reset demo data
          </button>
        </footer>
      </div>
    </div>
  )
}
