import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Send } from 'lucide-react'
import { Button, Input, Segmented, SimBadge } from '../../../components/ui'
import { companionReply, COMPANION_CHIPS } from '../../../lib/companion'
import { cn, fmtDateTime } from '../../../lib/utils'
import { useStore } from '../../../store'
import { Screen, usePatient } from '../ui'

interface Bubble { id: number; from: 'me' | 'bot'; text: string; chips?: string[] }

export default function Messages() {
  const db = useStore()
  const nav = useNavigate()
  const p = usePatient()
  const [mode, setMode] = useState<'Clinic' | 'Companion'>('Clinic')
  const [text, setText] = useState('')
  const [bot, setBot] = useState<Bubble[]>([{ id: 0, from: 'bot', text: `Hi ${p.name.split(' ')[0]}! I'm your recovery companion. I can explain your exercises, appointments and results. I can't diagnose or change your treatment.`, chips: COMPANION_CHIPS }])
  const [typing, setTyping] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  const msgs = db.messages.filter((m) => m.patientId === p.id)
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs.length, bot.length, typing, mode])

  const askBot = (q: string) => {
    if (/open symptom check-in/i.test(q)) return nav('/patient/checkin')
    if (/open my exercises/i.test(q)) return nav('/patient/exercises')
    if (/open appointments/i.test(q)) return nav('/patient/appointments')
    if (/open my progress/i.test(q)) return nav('/patient/progress')
    setBot((b) => [...b, { id: b.length + 1, from: 'me', text: q }])
    setTyping(true)
    setTimeout(() => {
      const r = companionReply(q, db, p)
      if (r.escalate) db.sendMessage(p.id, 'patient', `[Via companion] ${q}`)
      setBot((b) => [...b, { id: b.length + 1, from: 'bot', text: r.text, chips: r.chips }])
      setTyping(false)
    }, 700)
  }

  return (
    <div className="flex h-[calc(100dvh-8.2rem)] flex-col md:h-[calc(100dvh-4.6rem)]">
      <div className="space-y-2 bg-white px-4 pb-3 pt-3">
        <div className="flex items-center justify-between"><h1 className="text-xl font-extrabold">Messages</h1>{mode === 'Companion' && <SimBadge label="Scripted, no AI model" />}</div>
        <Segmented options={['Clinic', 'Companion'] as const} value={mode} onChange={setMode} />
      </div>
      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
        {mode === 'Clinic' ? (
          <>
            {msgs.length === 0 && <p className="py-8 text-center text-sm text-muted">Send a non-urgent message to your clinic. For urgent problems please call.</p>}
            {msgs.map((m) => (
              <div key={m.id} className={cn('max-w-[85%] rounded-2xl px-3.5 py-2 text-sm', m.from === 'patient' ? 'ml-auto bg-brand-600 text-white' : 'bg-white ring-1 ring-line')}>{m.text}<div className={cn('mt-0.5 text-[10px]', m.from === 'patient' ? 'text-white/70' : 'text-slate-400')}>{fmtDateTime(m.at)}</div></div>
            ))}
          </>
        ) : (
          <>
            {bot.map((b) => (
              <div key={b.id} className={cn('flex gap-2', b.from === 'me' && 'justify-end')}>
                {b.from === 'bot' && <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal-500 to-brand-500 text-white"><Bot size={16} /></div>}
                <div className="max-w-[82%]"><div className={cn('whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm', b.from === 'me' ? 'bg-brand-600 text-white' : 'bg-white ring-1 ring-line')}>{b.text}</div>
                  {b.chips && <div className="mt-1.5 flex flex-wrap gap-1.5">{b.chips.map((c) => <button key={c} onClick={() => askBot(c)} className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">{c}</button>)}</div>}
                </div>
              </div>
            ))}
            {typing && <div className="flex gap-1 pl-10"><span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" /><span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:.15s]" /><span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:.3s]" /></div>}
          </>
        )}
        <div ref={end} />
      </div>
      <form className="flex shrink-0 items-center gap-2 border-t border-line bg-white p-3" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; if (mode === 'Clinic') db.sendMessage(p.id, 'patient', text.trim()); else askBot(text.trim()); setText('') }}>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={mode === 'Clinic' ? 'Message your clinic' : 'Ask the companion'} />
        <Button type="submit" icon={<Send size={16} />} aria-label="Send" disabled={!text.trim()} />
      </form>
    </div>
  )
}

export { Screen }
