import { useState } from 'react'
import { CheckCircle2, Phone } from 'lucide-react'
import { Badge, Button, Card, Chip, Field, Notice, Scale, Segmented, Textarea, Toggle, toast } from '../../../components/ui'
import { fmtDateTime } from '../../../lib/utils'
import { useStore } from '../../../store'
import type { CheckIn as CheckInT } from '../../../types'
import { H, Screen, usePatient } from '../ui'

const LOCATIONS = ['Knee', 'Shoulder', 'Back', 'Neck', 'Hip', 'Ankle', 'Elbow', 'Other']
const URGENT = ['chest pain', 'breathless', 'cannot breathe', "can't breathe", 'fainted', 'calf', 'numb', 'fever', 'cannot bear weight', "can't walk", 'loss of bladder', 'weakness in both']

export default function CheckIn() {
  const p = usePatient()
  const db = useStore()
  const [f, setF] = useState({ pain: 3, loc: p.region === 'Neuro' || p.region === 'Balance' ? 'Other' : p.region, swelling: 'None' as CheckInT['swelling'], difficulty: 'Moderate' as CheckInT['difficulty'], done: true, symptoms: '', remarks: '' })
  const [sent, setSent] = useState(false)
  const urgent = f.pain >= 9 || f.swelling === 'Severe' || URGENT.some((u) => f.symptoms.toLowerCase().includes(u))
  const history = db.checkins.filter((c) => c.patientId === p.id).sort((a, b) => b.at.localeCompare(a.at))

  if (sent) return (
    <Screen>
      <div className="grid place-items-center pt-12 text-center"><CheckCircle2 size={64} className="text-ok" /><h1 className="mt-3 text-2xl font-extrabold">Check-in sent</h1><p className="mt-1 max-w-xs text-sm text-muted">Your therapist will review it. {urgent ? '' : 'You do not need to do anything else.'}</p>
        {urgent && <div className="mt-4 w-full text-left"><UrgentNotice /></div>}
        <Button className="mt-6" onClick={() => setSent(false)}>Done</Button></div>
    </Screen>
  )

  return (
    <Screen title="Symptom check-in" sub="Share how you're feeling between visits">
      <Card className="space-y-5">
        <Field label="Pain level right now"><Scale value={f.pain} onChange={(n) => setF({ ...f, pain: n })} /></Field>
        <Field label="Where is it?"><div className="flex flex-wrap gap-1.5">{LOCATIONS.map((l) => <Chip key={l} active={f.loc === l} onClick={() => setF({ ...f, loc: l })}>{l}</Chip>)}</div></Field>
        <Field label="Swelling"><Segmented options={['None', 'Mild', 'Moderate', 'Severe'] as const} value={f.swelling} onChange={(v) => setF({ ...f, swelling: v })} /></Field>
        <Field label="Exercise difficulty"><Segmented options={['Easy', 'Moderate', 'Hard'] as const} value={f.difficulty} onChange={(v) => setF({ ...f, difficulty: v })} /></Field>
        <Toggle checked={f.done} onChange={(v) => setF({ ...f, done: v })} label="I completed my exercises" />
        <Field label="New or unusual symptoms"><Textarea value={f.symptoms} onChange={(e) => setF({ ...f, symptoms: e.target.value })} placeholder="e.g. new numbness, night pain…" className="!min-h-[64px]" /></Field>
        <Field label="Anything else?"><Textarea value={f.remarks} onChange={(e) => setF({ ...f, remarks: e.target.value })} className="!min-h-[56px]" /></Field>
      </Card>
      {urgent && <UrgentNotice />}
      <Button full size="lg" variant="teal" onClick={() => {
        db.submitCheckIn({ patientId: p.id, pain: f.pain, location: f.loc, swelling: f.swelling, difficulty: f.difficulty, exercisesDone: f.done, newSymptoms: f.symptoms, remarks: f.remarks })
        toast('Sent to your therapist')
        setSent(true)
      }}>Send to my therapist</Button>
      <p className="text-center text-xs text-muted">Check-ins are not monitored around the clock. For emergencies call your local emergency number.</p>

      {history.length > 0 && (
        <div>
          <H>Previous check-ins</H>
          <div className="space-y-2">
            {history.slice(0, 4).map((c) => (
              <Card key={c.id} className="!p-3"><div className="flex items-center justify-between"><span className="text-sm font-bold">Pain {c.pain}/10 · {c.location}</span><Badge tone={c.reviewed ? 'green' : 'amber'}>{c.reviewed ? 'Reviewed' : 'Awaiting review'}</Badge></div><div className="text-xs text-muted">{fmtDateTime(c.at)}</div>{c.reply && <p className="mt-2 rounded-lg bg-teal-50 p-2 text-sm text-teal-900"><b>Therapist:</b> {c.reply}</p>}</Card>
            ))}
          </div>
        </div>
      )}
    </Screen>
  )
}

function UrgentNotice() {
  return (
    <Notice tone="red" title="This may need urgent medical attention">
      <p>These symptoms should not wait for a reply from the app. Please contact your clinic now or go to the nearest emergency department.</p>
      <div className="mt-2 flex items-center gap-1.5 font-bold"><Phone size={14} /> Clinic: +91 20 4000 1100</div>
    </Notice>
  )
}
