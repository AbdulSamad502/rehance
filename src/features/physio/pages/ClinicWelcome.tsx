import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeCheck, Building2, KeyRound, Stethoscope } from 'lucide-react'
import { Badge, Button, Card, Field, Input, Logo, Select, Sheet, SimBadge, Tabs, toast } from '../../../components/ui'
import { useStore } from '../../../store'
import type { PhysioRole, Staff } from '../../../types'

type Tab = 'signin' | 'clinic' | 'pro'

export default function ClinicWelcome() {
  const nav = useNavigate()
  const setRole = useStore((s) => s.setPhysioRole)
  const setClinic = useStore((s) => s.setClinic)
  const addStaff = useStore((s) => s.addStaff)
  const addAudit = useStore((s) => s.addAudit)
  const [tab, setTab] = useState<Tab>('signin')
  const [forgot, setForgot] = useState(false)
  const [done, setDone] = useState<null | { title: string; body: string }>(null)
  const [clinic, setClinicForm] = useState({ name: '', address: '', city: '', phone: '', owner: '', email: '', locations: '1' })
  const [pro, setPro] = useState({ name: '', role: 'Physiotherapist' as Staff['role'], qualification: '', speciality: '', licence: '', clinic: 'GearPhys Pune (Main)', phone: '' })

  const enter = (role: PhysioRole) => { setRole(role); nav('/physio') }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 px-4 py-8 text-white">
      <div className="mx-auto max-w-md">
        <Logo light size={40} />
        <h1 className="mt-8 text-2xl font-extrabold">Clinic workspace</h1>
        <p className="mt-1 text-sm text-white/75">Sign in, register your clinic, or create a professional account. Authentication and credential checks are simulated in this prototype.</p>

        <Card className="mt-5 !p-5 text-ink">
          <Tabs className="mb-4" tabs={[{ id: 'signin', label: 'Sign in' }, { id: 'clinic', label: 'Register clinic' }, { id: 'pro', label: 'Professional account' }]} value={tab} onChange={(t) => { setTab(t); setDone(null) }} />

          {done ? (
            <div className="space-y-3 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600"><BadgeCheck size={28} /></div>
              <div className="text-lg font-extrabold">{done.title}</div>
              <p className="text-sm text-muted">{done.body}</p>
              <div className="flex items-center justify-center gap-2 text-xs"><SimBadge label="Verification simulated" /></div>
              <Button full onClick={() => (tab === 'clinic' ? enter('owner') : enter('physio'))}>Continue to workspace</Button>
            </div>
          ) : tab === 'signin' ? (
            <div className="space-y-3">
              <Field label="Email"><Input type="email" placeholder="you@clinic.com" /></Field>
              <Field label="Password"><Input type="password" placeholder="••••••••" /></Field>
              <p className="text-xs text-muted">Prototype: choose a demo account to continue.</p>
              <div className="grid gap-2">
                <Button full variant="primary" icon={<Stethoscope size={16} />} onClick={() => enter('physio')}>Physiotherapist (Dr. Mohammed Abdul Rasheed)</Button>
                <Button full variant="soft" icon={<Building2 size={16} />} onClick={() => enter('owner')}>Clinic owner (Rohit Kulkarni)</Button>
                <Button full variant="soft" icon={<KeyRound size={16} />} onClick={() => enter('receptionist')}>Receptionist (Meera Nair)</Button>
              </div>
              <button className="w-full text-center text-sm font-semibold text-brand-600" onClick={() => setForgot(true)}>Forgot password?</button>
            </div>
          ) : tab === 'clinic' ? (
            <div className="space-y-3">
              <Field label="Clinic name"><Input value={clinic.name} onChange={(e) => setClinicForm({ ...clinic, name: e.target.value })} placeholder="e.g. Motion Physio Care" /></Field>
              <Field label="Address"><Input value={clinic.address} onChange={(e) => setClinicForm({ ...clinic, address: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="City"><Input value={clinic.city} onChange={(e) => setClinicForm({ ...clinic, city: e.target.value })} /></Field>
                <Field label="Locations"><Select value={clinic.locations} onChange={(e) => setClinicForm({ ...clinic, locations: e.target.value })}>{['1', '2', '3', '4+'].map((l) => <option key={l}>{l}</option>)}</Select></Field>
              </div>
              <Field label="Clinic phone"><Input value={clinic.phone} onChange={(e) => setClinicForm({ ...clinic, phone: e.target.value })} /></Field>
              <Field label="Owner name"><Input value={clinic.owner} onChange={(e) => setClinicForm({ ...clinic, owner: e.target.value })} /></Field>
              <Field label="Owner email"><Input type="email" value={clinic.email} onChange={(e) => setClinicForm({ ...clinic, email: e.target.value })} /></Field>
              <Button full size="lg" disabled={!clinic.name || !clinic.owner} onClick={() => { setClinic(clinic.name); addAudit(`Registered clinic "${clinic.name}"`, clinic.owner); setDone({ title: 'Clinic registered', body: `${clinic.name} was created. You can now add staff, set opening hours and register patients.` }) }}>Register clinic</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Field label="Full name"><Input value={pro.name} onChange={(e) => setPro({ ...pro, name: e.target.value })} /></Field>
              <Field label="Professional role"><Select value={pro.role} onChange={(e) => setPro({ ...pro, role: e.target.value as Staff['role'] })}>{['Physiotherapist', 'Senior Physiotherapist', 'Orthopaedic Doctor'].map((r) => <option key={r}>{r}</option>)}</Select></Field>
              <Field label="Qualifications"><Input value={pro.qualification} onChange={(e) => setPro({ ...pro, qualification: e.target.value })} placeholder="e.g. BPT, MPT (Ortho)" /></Field>
              <Field label="Specialisation"><Input value={pro.speciality} onChange={(e) => setPro({ ...pro, speciality: e.target.value })} /></Field>
              <Field label="Registration / licence number"><Input value={pro.licence} onChange={(e) => setPro({ ...pro, licence: e.target.value })} /></Field>
              <Field label="Clinic association"><Select value={pro.clinic} onChange={(e) => setPro({ ...pro, clinic: e.target.value })}><option>GearPhys Pune (Main)</option><option>GearPhys Thane</option></Select></Field>
              <Field label="Phone"><Input value={pro.phone} onChange={(e) => setPro({ ...pro, phone: e.target.value })} /></Field>
              <div className="rounded-xl border border-dashed border-line p-3 text-xs text-muted">Credential documents upload <SimBadge /> The clinic verifies licence details before clinical access is enabled.</div>
              <Button full size="lg" disabled={!pro.name || !pro.licence} onClick={() => { addStaff({ name: pro.name, role: pro.role, speciality: `${pro.speciality || 'General'} (${pro.qualification || 'qualifications pending'})`, phone: pro.phone, hours: 'To be set' }); setDone({ title: 'Account submitted', body: `${pro.name} was added to ${pro.clinic} and is awaiting credential verification. Your clinical signature will appear on records you finalise.` }) }}>Submit for verification</Button>
            </div>
          )}
        </Card>
        <button onClick={() => nav('/physio')} className="mt-4 w-full text-center text-sm font-semibold text-white/80 hover:text-white">Skip and explore the workspace →</button>
        <div className="mt-3 flex justify-center"><Badge tone="gray">Prototype · simulated data</Badge></div>
      </div>

      <Sheet open={forgot} onClose={() => setForgot(false)} title="Recover your account">
        <div className="space-y-3"><Field label="Work email"><Input type="email" /></Field><Button full onClick={() => { toast('Recovery link sent (simulated)', 'info'); setForgot(false) }}>Send recovery link</Button></div>
      </Sheet>
    </div>
  )
}
