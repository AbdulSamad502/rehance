import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send } from 'lucide-react'
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Sheet, Tabs, Textarea, toast } from '../../../components/ui'
import { fmtDateTime } from '../../../lib/utils'
import { useStore } from '../../../store'
import type { CheckIn } from '../../../types'
import { PatientChip } from '../shared'

export default function Inbox() {
  const db = useStore()
  const nav = useNavigate()
  const [tab, setTab] = useState<'checkins' | 'requests' | 'messages'>('checkins')
  const [reply, setReply] = useState<CheckIn | null>(null)
  const [text, setText] = useState('')
  const [thread, setThread] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const role = db.ui.physioRole
  const checkins = [...db.checkins].sort((a, b) => b.at.localeCompare(a.at))
  const pid = (id: string) => db.patients.find((p) => p.id === id)!
  const openReq = db.requests.filter((r) => r.status === 'open')
  const threads = [...new Set(db.messages.map((m) => m.patientId))]

  return (
    <div className="fade-up">
      <PageHeader title="Inbox" subtitle="Patient check-ins, requests and messages" />
      <Tabs className="mb-4" tabs={[...(role !== 'receptionist' ? [{ id: 'checkins' as const, label: 'Symptom check-ins', badge: db.checkins.filter((c) => !c.reviewed).length }] : []), { id: 'requests', label: 'Requests', badge: openReq.length }, { id: 'messages', label: 'Messages' }]} value={role === 'receptionist' && tab === 'checkins' ? 'requests' : tab} onChange={setTab} />

      {tab === 'checkins' && role !== 'receptionist' && (
        <div className="space-y-3">
          {checkins.length === 0 && <Empty icon="💬" title="No check-ins yet" />}
          {checkins.map((c) => (
            <Card key={c.id} className={c.reviewed ? '' : 'border-amber-200 bg-amber-50/30'}>
              <PatientChip p={pid(c.patientId)} sub={fmtDateTime(c.at)} right={<Badge tone={c.pain >= 7 ? 'red' : c.pain >= 4 ? 'amber' : 'green'}>Pain {c.pain}/10</Badge>} />
              <div className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                <div><span className="text-muted">Location:</span> {c.location}</div>
                <div><span className="text-muted">Swelling:</span> {c.swelling}</div>
                <div><span className="text-muted">Difficulty:</span> {c.difficulty}</div>
                <div><span className="text-muted">Exercises done:</span> {c.exercisesDone ? 'Yes' : 'No'}</div>
                {c.newSymptoms && <div className="sm:col-span-2"><span className="text-muted">New symptoms:</span> {c.newSymptoms}</div>}
                {c.remarks && <div className="sm:col-span-2"><span className="text-muted">Remarks:</span> {c.remarks}</div>}
              </div>
              {c.reviewed ? (c.reply && <p className="mt-3 rounded-xl bg-teal-50 p-3 text-sm"><b>Your reply:</b> {c.reply}</p>) : (
                <div className="mt-3 flex gap-2"><Button size="sm" onClick={() => { setReply(c); setText('') }}>Review and reply</Button><Button size="sm" variant="secondary" onClick={() => { db.reviewCheckIn(c.id); toast('Marked reviewed') }}>Mark reviewed</Button><Button size="sm" variant="ghost" onClick={() => nav(`/physio/patients/${c.patientId}?tab=plan`)}>Update plan</Button></div>
              )}
            </Card>
          ))}
        </div>
      )}

      {(tab === 'requests' || (role === 'receptionist' && tab === 'checkins')) && (
        <div className="space-y-3">
          {db.requests.length === 0 && <Empty icon="📥" title="No requests" />}
          {db.requests.map((r) => (
            <Card key={r.id} className={r.status === 'done' ? 'opacity-60' : ''}>
              <PatientChip p={pid(r.patientId)} sub={fmtDateTime(r.at)} right={<Badge tone={r.status === 'open' ? 'amber' : 'green'}>{r.kind}</Badge>} />
              <p className="mt-2 text-sm">{r.text}</p>
              {r.status === 'open' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.kind === 'History update' && role !== 'receptionist' && <Button size="sm" onClick={() => nav(`/physio/patients/${r.patientId}?tab=history`)}>Review in history</Button>}
                  {(r.kind === 'Reschedule' || r.kind === 'Appointment request' || r.kind === 'Cancellation') && <Button size="sm" onClick={() => nav(`/physio/schedule?book=${r.patientId}`)}>Open scheduling</Button>}
                  <Button size="sm" variant="secondary" onClick={() => { db.resolveRequest(r.id); toast('Request resolved') }}>Mark done</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === 'messages' && (
        <div className="space-y-3">
          {threads.map((t) => {
            const msgs = db.messages.filter((m) => m.patientId === t)
            const last = msgs[msgs.length - 1]
            return <Card key={t} onClick={() => setThread(t)}><PatientChip p={pid(t)} to={false} sub={`${last.from === 'patient' ? '' : 'You: '}${last.text}`} /></Card>
          })}
        </div>
      )}

      <Sheet open={!!reply} onClose={() => setReply(null)} title="Reply to check-in">
        {reply && (
          <div className="space-y-3">
            <p className="text-sm text-muted">Your reply is sent to the patient as a notification. Urgent symptoms should be redirected to appropriate medical care.</p>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Advice, reassurance, or request to call…" />
            <div className="flex flex-wrap gap-1.5">{['Please ice for 15 minutes and rest the joint today.', 'Thanks for letting us know. We will review this at your next session.', 'Please call the clinic today so we can assess this sooner.'].map((s) => <button key={s} onClick={() => setText(s)} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{s.slice(0, 32)}…</button>)}</div>
            <Button full disabled={!text} onClick={() => { db.reviewCheckIn(reply.id, text); toast('Reply sent'); setReply(null) }}>Send reply and mark reviewed</Button>
          </div>
        )}
      </Sheet>

      <Sheet open={!!thread} onClose={() => setThread(null)} title={thread ? pid(thread).name : ''}>
        {thread && (
          <div className="space-y-3">
            <div className="max-h-[50dvh] space-y-2 overflow-y-auto">
              {db.messages.filter((m) => m.patientId === thread).map((m) => (
                <div key={m.id} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.from === 'clinic' ? 'ml-auto bg-brand-600 text-white' : 'bg-slate-100'}`}>{m.text}<div className={`mt-0.5 text-[10px] ${m.from === 'clinic' ? 'text-white/70' : 'text-slate-400'}`}>{fmtDateTime(m.at)}</div></div>
              ))}
            </div>
            <Field><div className="flex gap-2"><Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type a message" /><Button icon={<Send size={16} />} disabled={!msg} onClick={() => { db.sendMessage(thread, 'clinic', msg); setMsg('') }} aria-label="Send" /></div></Field>
          </div>
        )}
      </Sheet>
    </div>
  )
}
