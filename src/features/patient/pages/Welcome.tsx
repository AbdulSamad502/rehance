import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, KeyRound, Mail } from 'lucide-react'
import { Badge, Button, Card, Field, Input, Logo, Sheet, SimBadge, toast } from '../../../components/ui'
import { cn } from '../../../lib/utils'
import { useStore } from '../../../store'

type Step = 'intro' | 'join' | 'verify' | 'profile' | 'consent' | 'login'

export default function Welcome() {
  const nav = useNavigate()
  const patients = useStore((s) => s.patients)
  const setPatientId = useStore((s) => s.setPatientId)
  const accept = useStore((s) => s.acceptInvite)
  const updatePatient = useStore((s) => s.updatePatient)
  const [step, setStep] = useState<Step>('intro')
  const [code, setCode] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [consent, setConsent] = useState({ data: true, notify: true, camera: true })
  const [forgot, setForgot] = useState(false)
  const [prof, setProf] = useState({ phone: '', email: '', emergency: '' })
  const target = patients.find((p) => p.invite.code.toUpperCase() === code.trim().toUpperCase() && p.invite.status !== 'none')
  const joined = patients.filter((p) => p.invite.status === 'accepted')

  const enter = (id: string) => { setPatientId(id); nav('/patient/home') }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-brand-800 via-brand-700 to-brand-600 px-5 pb-8 pt-8 text-white">
      <div className="mx-auto max-w-md">
      <Logo light size={40} />

      {step === 'intro' && (
        <div className="fade-up mt-10">
          <h1 className="text-3xl font-extrabold leading-tight">Your recovery,<br />one step at a time.</h1>
          <p className="mt-2 text-[15px] text-white/80">Appointments, guided home exercises, and progress your physiotherapist can see.</p>
          <div className="mt-8 space-y-3">
            <Button full size="lg" variant="teal" icon={<KeyRound size={18} />} onClick={() => setStep('join')}>Join with invite code</Button>
            <Button full size="lg" variant="secondary" className="!border-white/30 !bg-white/10 !text-white" icon={<Mail size={18} />} onClick={() => setStep('login')}>I already have an account</Button>
          </div>
          <div className="mt-8">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60">Demo shortcuts <SimBadge label="skip sign-in" /></div>
            <div className="space-y-2">
              {joined.slice(0, 4).map((p) => (
                <button key={p.id} onClick={() => enter(p.id)} className="flex w-full items-center gap-3 rounded-2xl bg-white/10 p-3 text-left ring-1 ring-white/15 hover:bg-white/15">
                  <span className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold" style={{ background: p.tint }}>{p.name[0]}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{p.name}</span><span className="block truncate text-xs text-white/65">{p.condition}</span></span>
                  <ArrowRight size={16} className="text-white/60" />
                </button>
              ))}
            </div>
            {patients.some((p) => p.invite.status === 'sent') && (
              <p className="mt-3 rounded-xl bg-amber-400/20 p-3 text-xs text-amber-100">Invite pending for {patients.filter((p) => p.invite.status === 'sent').map((p) => `${p.name.split(' ')[0]} (code ${p.invite.code})`).join(', ')}. Try “Join with invite code”.</p>
            )}
          </div>
        </div>
      )}

      {step === 'join' && (
        <Card className="fade-up mt-10 !p-5 text-ink">
          <h2 className="text-lg font-extrabold">Enter your invite code</h2>
          <p className="mb-4 mt-1 text-sm text-muted">Your clinic sent this code by SMS when you were registered.</p>
          <Field label="Invite code"><Input autoFocus value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setError('') }} placeholder="GP-1234" className="text-center text-xl font-bold tracking-widest" /></Field>
          {target && <div className="mt-3 rounded-xl bg-teal-50 p-3 text-sm text-teal-900">Invitation for <b>{target.name}</b> from <b>{target.location}</b></div>}
          {error && <p className="mt-2 text-sm text-bad">{error}</p>}
          <Button full size="lg" className="mt-4" onClick={() => (target ? setStep('verify') : setError('That code was not recognised. Check with your clinic.'))} disabled={code.length < 4}>Continue</Button>
          <button className="mt-3 w-full text-center text-sm font-semibold text-brand-600" onClick={() => setStep('intro')}>Back</button>
        </Card>
      )}

      {step === 'verify' && target && (
        <Card className="fade-up mt-10 !p-5 text-ink">
          <h2 className="text-lg font-extrabold">Verify your phone</h2>
          <p className="mb-1 mt-1 text-sm text-muted">We sent a 4-digit code to {target.phone}.</p>
          <div className="mb-3 flex items-center gap-2 text-xs"><SimBadge label="Simulated OTP" /><span className="text-muted">Use <b>1234</b></span></div>
          <Input autoFocus inputMode="numeric" maxLength={4} value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError('') }} placeholder="• • • •" className="text-center text-2xl font-bold tracking-[.6em]" />
          {error && <p className="mt-2 text-sm text-bad">{error}</p>}
          <Button full size="lg" className="mt-4" onClick={() => { if (otp === '1234') { setProf({ phone: target.phone, email: target.email, emergency: target.emergency }); setStep('profile') } else setError('Incorrect code. Try 1234.') }} disabled={otp.length < 4}>Verify</Button>
        </Card>
      )}

      {step === 'profile' && target && (
        <Card className="fade-up mt-10 !p-5 text-ink">
          <h2 className="text-lg font-extrabold">Confirm your details</h2>
          <p className="mb-3 mt-1 text-sm text-muted">Your clinic registered these. Update anything that's out of date.</p>
          <div className="space-y-3">
            <Field label="Name"><Input value={target.name} disabled /></Field>
            <Field label="Mobile"><Input value={prof.phone} onChange={(e) => setProf({ ...prof, phone: e.target.value })} /></Field>
            <Field label="Email"><Input value={prof.email} onChange={(e) => setProf({ ...prof, email: e.target.value })} /></Field>
            <Field label="Emergency contact"><Input value={prof.emergency} onChange={(e) => setProf({ ...prof, emergency: e.target.value })} /></Field>
          </div>
          <Button full size="lg" className="mt-4" onClick={() => setStep('consent')}>Continue</Button>
        </Card>
      )}

      {step === 'consent' && target && (
        <Card className="fade-up mt-10 !p-5 text-ink">
          <h2 className="text-lg font-extrabold">Welcome, {target.name.split(' ')[0]}</h2>
          <p className="mb-3 mt-1 text-sm text-muted">Please review how GearPhys uses your information.</p>
          <div className="space-y-2">
            {([['data', 'Share my rehabilitation information with my treating clinic', true], ['notify', 'Send me appointment and exercise reminders', false], ['camera', 'Allow camera-based exercise tracking (video stays on my phone)', false]] as const).map(([k, label, req]) => (
              <button key={k} onClick={() => !req && setConsent({ ...consent, [k]: !consent[k] })} className={cn('flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm', consent[k] ? 'border-teal-300 bg-teal-50' : 'border-line')}>
                <span className={cn('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md', consent[k] ? 'bg-teal-500 text-white' : 'bg-slate-200')}>{consent[k] && <Check size={13} />}</span>
                <span>{label}{req && <Badge tone="gray" className="ml-1">Required</Badge>}</span>
              </button>
            ))}
          </div>
          <Button full size="lg" variant="teal" className="mt-4" onClick={() => { const p = accept(code); if (p) { updatePatient(p.id, prof); toast('Account created. Welcome to GearPhys!'); nav('/patient/home') } }}>Create my account</Button>
        </Card>
      )}

      {step === 'login' && (
        <Card className="fade-up mt-10 !p-5 text-ink">
          <h2 className="text-lg font-extrabold">Sign in</h2>
          <div className="mt-3 space-y-3">
            <Field label="Email or mobile"><Input placeholder="abdul.samad@example.com" /></Field>
            <Field label="Password"><Input type="password" placeholder="••••••••" /></Field>
          </div>
          <p className="mt-2 text-xs text-muted">Prototype: pick a demo account below. No real authentication.</p>
          <div className="mt-3 space-y-2">{joined.slice(0, 3).map((p) => <Button key={p.id} full variant="soft" onClick={() => enter(p.id)}>Sign in as {p.name}</Button>)}</div>
          <Button full variant="secondary" className="mt-3" onClick={() => toast('Google sign-in is simulated in the prototype', 'info')}>Continue with Google <SimBadge /></Button>
          <div className="mt-3 flex justify-between text-sm font-semibold text-brand-600"><button onClick={() => setForgot(true)}>Forgot password?</button><button onClick={() => setStep('intro')}>Back</button></div>
        </Card>
      )}

      <button onClick={() => nav('/')} className="mt-6 w-full text-center text-sm font-semibold text-white/70 hover:text-white">← Back to start</button>
      </div>

      <Sheet open={forgot} onClose={() => setForgot(false)} title="Recover your account">
        <div className="space-y-3"><Field label="Email or mobile"><Input /></Field><Button full onClick={() => { toast('Recovery link sent (simulated)', 'info'); setForgot(false) }}>Send recovery link</Button></div>
      </Sheet>
    </div>
  )
}
