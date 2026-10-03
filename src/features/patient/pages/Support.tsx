import { useState } from 'react'
import { Phone } from 'lucide-react'
import { Badge, Button, Card, Chip, Field, Textarea, toast } from '../../../components/ui'
import { fmtDateTime } from '../../../lib/utils'
import { useStore } from '../../../store'
import { H, Screen, usePatient } from '../ui'

const TYPES = ['Treatment feedback', 'Exercise feedback', 'Technical problem', 'Question'] as const

export default function Support() {
  const db = useStore()
  const p = usePatient()
  const [t, setT] = useState<(typeof TYPES)[number]>('Treatment feedback')
  const [text, setText] = useState('')
  const mine = db.requests.filter((r) => r.patientId === p.id && r.kind === 'Support')
  return (
    <Screen title="Feedback & support">
      <Card className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-600"><Phone size={20} /></div><div className="flex-1"><div className="text-sm font-extrabold">Contact your clinic</div><div className="text-xs text-muted">{p.location} · +91 20 4000 1100</div></div><Button size="sm" variant="soft" onClick={() => toast('Calling is simulated in the prototype', 'info')}>Call</Button></Card>
      <Card className="space-y-3">
        <div className="text-sm font-extrabold">Send us a note</div>
        <div className="flex flex-wrap gap-1.5">{TYPES.map((x) => <Chip key={x} active={t === x} onClick={() => setT(x)}>{x}</Chip>)}</div>
        <Field><Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Tell us more…" /></Field>
        <Button full disabled={!text} onClick={() => { db.addRequest({ patientId: p.id, kind: 'Support', text: `${t}: ${text}` }); toast('Thank you. Your note was sent'); setText('') }}>Send</Button>
      </Card>
      {mine.length > 0 && <div><H>Your messages</H><div className="space-y-2">{mine.map((r) => <Card key={r.id} className="!p-3"><div className="flex items-center justify-between"><span className="text-xs text-muted">{fmtDateTime(r.at)}</span><Badge tone={r.status === 'open' ? 'amber' : 'green'}>{r.status === 'open' ? 'Received' : 'Answered'}</Badge></div><p className="mt-1 text-sm">{r.text}</p>{r.status === 'done' && <p className="mt-1 rounded-lg bg-teal-50 p-2 text-sm text-teal-900">Thanks for the feedback. The team has reviewed it.</p>}</Card>)}</div></div>}
      <div>
        <H>Common questions</H>
        <div className="space-y-2">
          {[['Is my video uploaded?', 'No. Camera exercise tracking runs on your phone and the video never leaves it.'], ['Can the app diagnose me?', 'No. It counts repetitions and gives movement tips. Only your therapist makes clinical decisions.'], ['What if I have severe pain?', 'Stop the exercise and contact your clinic. For emergencies call your local emergency number.']].map(([q, a]) => <Card key={q} className="!p-3"><div className="text-sm font-bold">{q}</div><p className="text-sm text-muted">{a}</p></Card>)}
        </div>
      </div>
    </Screen>
  )
}
