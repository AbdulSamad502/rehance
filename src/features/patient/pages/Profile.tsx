import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Avatar, Badge, Button, Card, Field, Input, KV, Toggle, toast } from '../../../components/ui'
import { therapistName } from '../../../lib/derive'
import { fmtDate } from '../../../lib/utils'
import { useStore } from '../../../store'
import { H, Screen, usePatient } from '../ui'

export default function Profile() {
  const db = useStore()
  const nav = useNavigate()
  const p = usePatient()
  const [f, setF] = useState({ phone: p.phone, email: p.email, emergency: p.emergency })
  const [priv, setPriv] = useState({ share: true, analytics: false, camera: true })
  return (
    <Screen title="Profile & settings">
      <Card className="flex items-center gap-3"><Avatar name={p.name} tint={p.tint} size={56} /><div><div className="text-base font-extrabold">{p.name}</div><div className="text-xs text-muted">{p.age} years · {p.sex}</div><Badge tone="teal">Patient ID {p.code}</Badge></div></Card>
      <Card><KV k="Clinic" v={p.location} /><KV k="Treating therapist" v={therapistName(db, p.therapistId)} /><KV k="Registered" v={fmtDate(p.registeredAt)} /><KV k="Consent" v="Given · data sharing with clinic" /></Card>
      <div>
        <H>Contact details</H>
        <Card className="space-y-3">
          <Field label="Mobile"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Email"><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Emergency contact"><Input value={f.emergency} onChange={(e) => setF({ ...f, emergency: e.target.value })} /></Field>
          <Button full onClick={() => { db.updatePatient(p.id, f); toast('Contact details saved') }}>Save</Button>
          <p className="text-xs text-muted">Clinical records can't be edited here. Use "My medical information" to submit updates for your therapist to review.</p>
        </Card>
      </div>
      <div>
        <H>Privacy</H>
        <Card className="space-y-3">
          <Toggle checked={priv.share} onChange={(v) => setPriv({ ...priv, share: v })} label="Share my progress with my clinic" />
          <Toggle checked={priv.camera} onChange={(v) => setPriv({ ...priv, camera: v })} label="Allow camera exercise tracking" />
          <Toggle checked={priv.analytics} onChange={(v) => setPriv({ ...priv, analytics: v })} label="Help improve GearPhys (anonymous usage)" />
        </Card>
      </div>
      <Button full variant="secondary" className="!text-bad" icon={<LogOut size={16} />} onClick={() => { db.setPatientId(null); nav('/patient') }}>Log out</Button>
    </Screen>
  )
}
