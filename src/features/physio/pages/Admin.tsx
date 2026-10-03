import { useRef, useState } from 'react'
import { Download, KeyRound, Megaphone, RotateCcw, Upload, UserPlus } from 'lucide-react'
import { Badge, Button, Card, Field, Input, KV, Notice, PageHeader, SectionTitle, Select, Sheet, SimBadge, Tabs, Textarea, Toggle, toast } from '../../../components/ui'
import { PERMISSIONS } from '../../../data/catalog'
import { CLINICAL, GENERAL, NEURO, ORTHO_REGIONS } from '../../../data/templates'
import { ROLE_LABEL } from '../../../lib/access'
import { fmtDateTime } from '../../../lib/utils'
import { STORE_KEY, useStore } from '../../../store'
import type { Staff } from '../../../types'

type Tab = 'staff' | 'permissions' | 'clinic' | 'comms' | 'templates' | 'audit' | 'data'

export default function Admin() {
  const [tab, setTab] = useState<Tab>('staff')
  const role = useStore((s) => s.ui.physioRole)
  return (
    <div className="fade-up">
      <PageHeader title="Clinic admin" subtitle="Staff, access, clinic settings, communications and audit" />
      {role !== 'owner' && <div className="mb-4"><Notice tone="blue">You can view this area. Only the clinic owner can change staff access and settings.</Notice></div>}
      <Tabs className="mb-4" tabs={[{ id: 'staff', label: 'Staff & roles' }, { id: 'permissions', label: 'Permissions' }, { id: 'clinic', label: 'Clinic settings' }, { id: 'comms', label: 'Announcements' }, { id: 'templates', label: 'Chart templates' }, { id: 'audit', label: 'Audit log' }, { id: 'data', label: 'Data & backup' }]} value={tab} onChange={setTab} />
      {tab === 'staff' && <StaffTab />}
      {tab === 'permissions' && <PermissionsTab />}
      {tab === 'clinic' && <ClinicTab />}
      {tab === 'comms' && <CommsTab />}
      {tab === 'templates' && <TemplatesTab />}
      {tab === 'audit' && <AuditTab />}
      {tab === 'data' && <DataTab />}
    </div>
  )
}

function StaffTab() {
  const db = useStore()
  const owner = db.ui.physioRole === 'owner'
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Staff | null>(null)
  const [f, setF] = useState({ name: '', role: 'Physiotherapist' as Staff['role'], speciality: '', phone: '', hours: 'Mon-Fri 9:00-17:00' })
  return (
    <div className="space-y-4">
      <div className="flex justify-end">{owner && <Button icon={<UserPlus size={16} />} onClick={() => setOpen(true)}>Add staff</Button>}</div>
      <div className="grid gap-3 md:grid-cols-2">
        {db.staff.map((s) => (
          <Card key={s.id} className={s.active ? '' : 'opacity-60'}>
            <div className="flex items-start justify-between gap-2">
              <div><div className="text-sm font-extrabold">{s.name}</div><div className="text-xs text-muted">{s.role} · {s.speciality}</div></div>
              <div className="flex flex-col items-end gap-1">{s.verified ? <Badge tone="green">Credentials verified</Badge> : s.role.includes('Physio') || s.role.includes('Doctor') ? <Badge tone="amber">Verification pending</Badge> : <Badge tone="gray">Non-clinical</Badge>}</div>
            </div>
            <div className="mt-2 text-xs text-muted">{s.phone} · {s.hours}</div>
            <div className="mt-3 flex items-center justify-between">
              <Toggle checked={s.active} onChange={(v) => owner && db.setStaffActive(s.id, v)} label={s.active ? 'Access active' : 'Access disabled'} />
              <Button size="sm" variant="ghost" icon={<KeyRound size={14} />} onClick={() => toast('Password reset email sent (simulated)', 'info')}>Reset password</Button>
            </div>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="soft" onClick={() => setEditing(s)}>Edit profile</Button>
              {owner && !s.verified && (s.role.includes('Physio') || s.role.includes('Doctor')) && <Button size="sm" variant="teal" onClick={() => { db.verifyStaff(s.id); toast(`${s.name}'s credentials verified (simulated check)`) }}>Verify credentials</Button>}
            </div>
          </Card>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted"><SimBadge /> Credential verification, sign-in and password recovery are simulated.</div>
      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Staff profile">
        {editing && (
          <div className="space-y-3">
            <Field label="Full name"><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Role"><Select value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value as Staff['role'] })}>{['Physiotherapist', 'Senior Physiotherapist', 'Receptionist', 'Clinic Admin', 'Orthopaedic Doctor'].map((r) => <option key={r}>{r}</option>)}</Select></Field>
            <Field label="Speciality / function"><Input value={editing.speciality} onChange={(e) => setEditing({ ...editing, speciality: e.target.value })} /></Field>
            <Field label="Phone"><Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></Field>
            <Field label="Clinical signature shown on finalised records"><Input value={`${editing.name}${editing.role.includes('Physio') || editing.role.includes('Doctor') ? `, ${editing.role}` : ''}`} disabled /></Field>
            <Button full disabled={!owner && editing.id !== 's1'} onClick={() => { db.updateStaff(editing.id, { name: editing.name, role: editing.role, speciality: editing.speciality, phone: editing.phone }); toast('Profile saved'); setEditing(null) }}>Save profile</Button>
            {!owner && editing.id !== 's1' && <p className="text-xs text-muted">Only the clinic owner can edit other staff profiles.</p>}
          </div>
        )}
      </Sheet>
      <Sheet open={open} onClose={() => setOpen(false)} title="Create staff account">
        <div className="space-y-3">
          <Field label="Full name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Role"><Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Staff['role'] })}>{['Physiotherapist', 'Senior Physiotherapist', 'Receptionist', 'Clinic Admin', 'Orthopaedic Doctor'].map((r) => <option key={r}>{r}</option>)}</Select></Field>
          <Field label="Speciality / function"><Input value={f.speciality} onChange={(e) => setF({ ...f, speciality: e.target.value })} /></Field>
          <Field label="Phone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Working hours"><Input value={f.hours} onChange={(e) => setF({ ...f, hours: e.target.value })} /></Field>
          <Button full disabled={!f.name} onClick={() => { db.addStaff(f); toast('Staff account created'); setOpen(false) }}>Create account</Button>
        </div>
      </Sheet>
    </div>
  )
}

function PermissionsTab() {
  return (
    <div className="space-y-3">
      <Notice tone="teal">Permissions follow the principle: clinic staff manage the clinic, physiotherapists manage clinical care, patients take part in their rehabilitation. Use the role switcher in the top bar to experience each view.</Notice>
      <Card pad={false} className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead><tr className="border-b border-line bg-surface text-xs uppercase text-muted"><th className="p-3">Information</th><th className="p-3">{ROLE_LABEL.owner}</th><th className="p-3">{ROLE_LABEL.receptionist}</th><th className="p-3">{ROLE_LABEL.physio}</th><th className="p-3">Patient</th></tr></thead>
          <tbody>{PERMISSIONS.map((r) => <tr key={r.area} className="border-b border-line/70"><td className="p-3 font-semibold">{r.area}</td><td className="p-3 text-slate-600">{r.owner}</td><td className="p-3 text-slate-600">{r.receptionist}</td><td className="p-3 text-slate-600">{r.physio}</td><td className="p-3 text-slate-600">{r.patient}</td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  )
}

function ClinicTab() {
  const db = useStore()
  const [f, setF] = useState({ name: 'GearPhys Pune (Main)', address: '14 Residency Road, Camp, Pune 411001', phone: '+91 20 4000 1100', hours: 'Mon-Sat 8:30 to 18:00' })
  const [rem, setRem] = useState({ appt: true, pay: true, exercise: true })
  const remind = (kind: 'appt' | 'pay') => {
    const n = kind === 'appt'
      ? db.appointments.filter((a) => a.date > new Date().toISOString().slice(0, 10) && ['Scheduled', 'Confirmed'].includes(a.status)).slice(0, 5)
      : db.patients.filter((p) => p.status === 'active').slice(0, 3)
    if (kind === 'appt') (n as typeof db.appointments).forEach((a) => db.addNotice({ audience: 'patient', patientId: a.patientId, kind: 'appointment', title: 'Appointment reminder', body: `You have a ${a.type} on ${a.date} at ${a.time}.` }))
    else (n as typeof db.patients).forEach((p) => db.addNotice({ audience: 'patient', patientId: p.id, kind: 'payment', title: 'Payment reminder', body: 'A balance is pending on your treatment package.' }))
    toast(`${n.length} ${kind === 'appt' ? 'appointment' : 'payment'} reminders sent (in-app only)`)
  }
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <SectionTitle title="Clinic profile" />
        <div className="space-y-3">
          <Field label="Clinic name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Address"><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
          <Field label="Phone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Operating hours"><Input value={f.hours} onChange={(e) => setF({ ...f, hours: e.target.value })} /></Field>
          <Button onClick={() => toast('Clinic profile saved')}>Save profile</Button>
        </div>
        <div className="mt-5 border-t border-line pt-4"><SectionTitle title="Locations" /><KV k="GearPhys Pune (Main)" v="Active" /><KV k="GearPhys Thane" v="Active" /></div>
      </Card>
      <Card>
        <SectionTitle title="Reminders" action={<SimBadge label="SMS/push simulated" />} />
        <div className="space-y-3">
          <Toggle checked={rem.appt} onChange={(v) => setRem({ ...rem, appt: v })} label="Appointment reminders (24 h before)" />
          <Toggle checked={rem.pay} onChange={(v) => setRem({ ...rem, pay: v })} label="Payment reminders (overdue balances)" />
          <Toggle checked={rem.exercise} onChange={(v) => setRem({ ...rem, exercise: v })} label="Daily exercise reminders" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" onClick={() => remind('appt')}>Send appointment reminders now</Button><Button variant="secondary" onClick={() => remind('pay')}>Send payment reminders now</Button></div>
        <p className="mt-2 text-xs text-muted">Reminders appear in the patient app notifications.</p>
      </Card>
    </div>
  )
}

function CommsTab() {
  const db = useStore()
  const [f, setF] = useState({ title: '', body: '' })
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <SectionTitle title="Publish announcement" />
        <div className="space-y-3">
          <Field label="Title"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="Message"><Textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field>
          <Button icon={<Megaphone size={16} />} disabled={!f.title} onClick={() => { db.addAnnouncement(f.title, f.body); setF({ title: '', body: '' }); toast('Announcement published to staff and patients') }}>Publish</Button>
        </div>
      </Card>
      <div className="space-y-2">
        {db.announcements.map((a) => <Card key={a.id} className="!p-3.5"><div className="text-sm font-bold">{a.title}</div><p className="text-[13px] text-muted">{a.body}</p><div className="mt-1 text-[11px] text-slate-400">{fmtDateTime(a.at)}</div></Card>)}
      </div>
    </div>
  )
}

function TemplatesTab() {
  const [off, setOff] = useState<string[]>([])
  const tpls = [GENERAL, CLINICAL, NEURO]
  return (
    <div className="space-y-4">
      <Notice tone="teal" title="Configurable protocols">Assessment charts are templates. The clinical lead chooses which sections each chart includes. <SimBadge label="Editing simulated" /></Notice>
      <div className="grid gap-3 md:grid-cols-2">
        {tpls.map((t) => (
          <Card key={t.id}>
            <div className="text-sm font-extrabold">{t.title}</div>
            <div className="text-xs text-muted">{t.sections.reduce((n, s) => n + s.fields.length, 0)} fields</div>
            <div className="mt-2 space-y-1.5">{t.sections.map((s) => <Toggle key={t.id + s.title} checked={!off.includes(t.id + s.title)} onChange={(v) => setOff((o) => (v ? o.filter((x) => x !== t.id + s.title) : [...o, t.id + s.title]))} label={<span className="text-[13px]">{s.title} <span className="text-muted">({s.fields.length})</span></span>} />)}</div>
          </Card>
        ))}
        <Card>
          <div className="text-sm font-extrabold">Orthopaedic charts</div>
          <div className="text-xs text-muted">{Object.keys(ORTHO_REGIONS).length} body regions with left/right, active/passive ROM</div>
          <div className="mt-2 flex flex-wrap gap-1">{Object.keys(ORTHO_REGIONS).map((r) => <Badge key={r} tone="blue">{r}</Badge>)}</div>
        </Card>
      </div>
    </div>
  )
}

function AuditTab() {
  const audit = useStore((s) => s.audit)
  return (
    <Card pad={false} className="divide-y divide-line">
      {audit.map((a) => <div key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2.5"><span className="text-sm">{a.action}</span><span className="text-xs text-muted">{a.who} · {fmtDateTime(a.at)}</span></div>)}
    </Card>
  )
}

function DataTab() {
  const db = useStore()
  const file = useRef<HTMLInputElement>(null)
  const exportJson = () => {
    const raw = localStorage.getItem(STORE_KEY) ?? '{}'
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([raw], { type: 'application/json' }))
    a.download = 'gearphys-demo-backup.json'
    a.click()
  }
  const importJson = async (f: File) => {
    try {
      const text = await f.text()
      JSON.parse(text)
      localStorage.setItem(STORE_KEY, text)
      await useStore.persist.rehydrate()
      toast('Backup restored')
    } catch { toast('That file is not a valid backup', 'warn') }
  }
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card>
        <SectionTitle title="Backup and recovery" action={<SimBadge label="Local only" />} />
        <p className="mb-3 text-sm text-muted">The prototype stores everything in this browser. Export a backup file and restore it later or on another device.</p>
        <div className="flex flex-wrap gap-2"><Button variant="secondary" icon={<Download size={16} />} onClick={exportJson}>Export backup</Button><Button variant="secondary" icon={<Upload size={16} />} onClick={() => file.current?.click()}>Restore backup</Button><input ref={file} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} /></div>
      </Card>
      <Card>
        <SectionTitle title="Reset demo" />
        <p className="mb-3 text-sm text-muted">Return all patients, appointments and results to the original sample data.</p>
        <Button variant="danger" icon={<RotateCcw size={16} />} onClick={() => { db.reset(); toast('Demo data reset') }}>Reset demo data</Button>
      </Card>
    </div>
  )
}
