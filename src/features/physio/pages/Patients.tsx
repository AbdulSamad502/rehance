import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Copy, Search, Send, UserPlus } from 'lucide-react'
import { Badge, Button, Card, Chip, Empty, Field, Input, PageHeader, Select, Sheet, SimBadge, Textarea, Toggle, toast } from '../../../components/ui'
import { adherence, nextAppt, therapistName } from '../../../lib/derive'
import { fmtDate, fmtTime } from '../../../lib/utils'
import { useStore } from '../../../store'
import { PatientChip, statusTone } from '../shared'

const PACKAGES = [
  { name: 'Consultation only', fees: 800, sessions: 1 },
  { name: 'Starter: 6 sessions', fees: 7200, sessions: 6 },
  { name: 'Standard: 10 sessions', fees: 12000, sessions: 10 },
  { name: 'Extended: 16 sessions', fees: 24000, sessions: 16 },
]

export default function Patients() {
  const db = useStore()
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'discharged' | 'invited'>('all')
  const [created, setCreated] = useState<{ id: string; name: string; code: string } | null>(null)
  const open = sp.get('new') === '1'

  const list = useMemo(() => db.patients.filter((p) => {
    const hit = (p.name + p.code + p.condition + p.phone).toLowerCase().includes(q.toLowerCase())
    const f = filter === 'all' || (filter === 'invited' ? p.invite.status === 'sent' : p.status === filter)
    return hit && f
  }), [db.patients, q, filter])

  return (
    <div className="fade-up">
      <PageHeader title="Patients" subtitle={`${db.patients.length} registered · ${db.patients.filter((p) => p.status === 'active').length} active`} actions={<Button icon={<UserPlus size={16} />} onClick={() => setSp({ new: '1' })}>Register</Button>} />

      <div className="mb-3 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3.5 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, ID, phone or condition" className="pl-10" />
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {([['all', 'All'], ['active', 'Active'], ['invited', 'Invite pending'], ['inactive', 'Inactive'], ['discharged', 'Discharged']] as const).map(([id, label]) => <Chip key={id} active={filter === id} onClick={() => setFilter(id)}>{label}</Chip>)}
        </div>
      </div>

      {list.length === 0 ? <Empty icon="🔎" title="No patients found" body="Try another search or filter." /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((p) => {
            const na = nextAppt(db, p.id)
            const ad = adherence(db, p.id, 7)
            return (
              <Card key={p.id} onClick={() => nav(`/physio/patients/${p.id}`)}>
                <PatientChip p={p} to={false} right={<Badge tone={statusTone(p.status)}>{p.status}</Badge>} />
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3 text-xs text-muted">
                  <span>Therapist: <b className="text-ink">{therapistName(db, p.therapistId).replace('Dr. ', '')}</b></span>
                  {na && <span>Next: <b className="text-ink">{fmtDate(na.date)} {fmtTime(na.time)}</b></span>}
                  {ad !== null && <span>Adherence: <b className={ad < 40 ? 'text-bad' : ad < 70 ? 'text-warn' : 'text-ok'}>{ad}%</b></span>}
                  {p.invite.status === 'sent' && <Badge tone="amber">Invite sent · {p.invite.code}</Badge>}
                  {p.invite.status === 'accepted' && <Badge tone="teal">On the app</Badge>}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <RegisterSheet open={open} onClose={() => setSp({})} onDone={(r) => { setSp({}); setCreated(r) }} />

      <Sheet open={!!created} onClose={() => setCreated(null)} title="Patient registered">
        {created && (
          <div className="space-y-4 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-2xl">✅</div>
            <div>
              <div className="text-lg font-extrabold">{created.name}</div>
              {created.code ? (
                <>
                  <p className="mt-1 text-sm text-muted">An invite was sent to the patient's phone. They download GearPhys and join with this code:</p>
                  <div className="my-3 inline-flex items-center gap-2 rounded-2xl bg-brand-50 px-5 py-3 text-3xl font-extrabold tracking-widest text-brand-700">{created.code}
                    <button aria-label="Copy" onClick={() => { void navigator.clipboard?.writeText(created.code); toast('Invite code copied') }}><Copy size={18} /></button>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted"><SimBadge label="SMS simulated" /> No real message is sent in the prototype</div>
                </>
              ) : <p className="mt-1 text-sm text-muted">No app invite was sent. You can send one later from the patient profile.</p>}
            </div>
            <div className="grid gap-2">
              <Button onClick={() => nav(`/physio/patients/${created.id}`)}>Open profile</Button>
              {created.code && <Button variant="secondary" onClick={() => nav('/patient')}>Switch to patient app to join</Button>}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}

function RegisterSheet({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (r: { id: string; name: string; code: string }) => void }) {
  const staff = useStore((s) => s.staff)
  const add = useStore((s) => s.addPatient)
  const blank = { name: '', age: '', dob: '', sex: 'Female', phone: '', email: '', address: '', emergency: '', referral: '', therapistId: 's1', location: 'GearPhys Pune (Main)', condition: '', region: 'Knee', side: 'NA', pkg: 1, invite: true, remarks: '' }
  const [f, setF] = useState(blank)
  const set = (k: keyof typeof blank, v: string | number | boolean) => setF((x) => ({ ...x, [k]: v }))
  const ageFromDob = f.dob ? Math.max(0, Math.floor((Date.now() - new Date(f.dob).getTime()) / 31557600000)) : 0
  const age = ageFromDob || Number(f.age)
  const valid = f.name.trim().length > 2 && age > 0 && f.phone.trim().length >= 8

  const submit = () => {
    const pk = PACKAGES[f.pkg]
    const p = add({
      name: f.name.trim(), age, dob: f.dob || undefined, sex: f.sex as 'Female' | 'Male' | 'Other', phone: f.phone, email: f.email, address: f.address,
      emergency: f.emergency, referral: f.referral || 'Self-referred', therapistId: f.therapistId, location: f.location, status: 'active',
      condition: f.condition || 'Initial assessment pending', region: f.region, side: f.side as 'Left' | 'Right' | 'Both' | 'NA',
      episodeTitle: f.condition ? `${f.condition} rehabilitation` : 'New rehabilitation episode', adminRemarks: f.remarks,
      pkg: { name: pk.name, fees: pk.fees, sessions: pk.sessions }, sendInvite: f.invite,
    })
    setF(blank)
    toast('Patient registered')
    onDone({ id: p.id, name: p.name, code: p.invite.code })
  }

  return (
    <Sheet open={open} onClose={onClose} title="Register a new patient" wide>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name *" className="sm:col-span-2"><Input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Anita Deshmukh" /></Field>
        <Field label="Date of birth" hint={ageFromDob ? `Age ${ageFromDob}` : 'Enter this or the age'}><Input type="date" value={f.dob} onChange={(e) => set('dob', e.target.value)} /></Field>
        <Field label="Age *"><Input type="number" inputMode="numeric" value={ageFromDob || f.age} disabled={!!ageFromDob} onChange={(e) => set('age', e.target.value)} /></Field>
        <Field label="Sex"><Select value={f.sex} onChange={(e) => set('sex', e.target.value)}><option>Female</option><option>Male</option><option>Other</option></Select></Field>
        <Field label="Mobile *"><Input type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98XXX XXXXX" /></Field>
        <Field label="Email"><Input type="email" value={f.email} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Address" className="sm:col-span-2"><Input value={f.address} onChange={(e) => set('address', e.target.value)} /></Field>
        <Field label="Emergency contact" className="sm:col-span-2"><Input value={f.emergency} onChange={(e) => set('emergency', e.target.value)} placeholder="Name, relation, phone" /></Field>
        <Field label="Referring doctor / source"><Input value={f.referral} onChange={(e) => set('referral', e.target.value)} placeholder="e.g. Dr. S. Gupta (GP)" /></Field>
        <Field label="Treating physiotherapist"><Select value={f.therapistId} onChange={(e) => set('therapistId', e.target.value)}>{staff.filter((s) => s.role.includes('Physio')).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
        <Field label="Clinic location"><Select value={f.location} onChange={(e) => set('location', e.target.value)}><option>GearPhys Pune (Main)</option><option>GearPhys Thane</option></Select></Field>
        <Field label="Main complaint / condition"><Input value={f.condition} onChange={(e) => set('condition', e.target.value)} placeholder="e.g. Neck pain" /></Field>
        <Field label="Body region"><Select value={f.region} onChange={(e) => set('region', e.target.value)}>{['Knee', 'Shoulder', 'Hip', 'Lumbar', 'Cervical', 'Ankle', 'Elbow', 'Neuro', 'Balance'].map((r) => <option key={r}>{r}</option>)}</Select></Field>
        <Field label="Affected side"><Select value={f.side} onChange={(e) => set('side', e.target.value)}><option value="NA">Not applicable</option><option>Left</option><option>Right</option><option>Both</option></Select></Field>
        <Field label="Treatment package"><Select value={f.pkg} onChange={(e) => set('pkg', Number(e.target.value))}>{PACKAGES.map((p, i) => <option key={p.name} value={i}>{p.name} (₹{p.fees.toLocaleString('en-IN')})</option>)}</Select></Field>
        <Field label="Administrative remarks" className="sm:col-span-2"><Textarea value={f.remarks} onChange={(e) => set('remarks', e.target.value)} className="!min-h-[60px]" /></Field>
      </div>
      <div className="mt-4 rounded-2xl bg-brand-50 p-3.5">
        <Toggle checked={f.invite} onChange={(v) => set('invite', v)} label={<span className="inline-flex items-center gap-1.5 font-semibold"><Send size={14} /> Send the GearPhys app invite now</span>} />
        <p className="mt-1 pl-[54px] text-xs text-muted">The patient receives a code to join the app and see their appointments and exercises.</p>
      </div>
      <p className="mt-3 text-xs text-muted">Clinical details (medical history, assessment) are added later by the treating physiotherapist.</p>
      <Button full size="lg" className="mt-4" disabled={!valid} onClick={submit} icon={<UserPlus size={18} />}>Register patient</Button>
    </Sheet>
  )
}
