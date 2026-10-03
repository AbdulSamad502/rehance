// Scripted recovery companion. It explains and navigates; it never diagnoses or prescribes.
import type { DB } from '../data/seed'
import { getExercise } from '../data/catalog'
import type { Patient } from '../types'
import { nextAppt, todaysTasks, therapistName } from './derive'
import { fmtDate, fmtTime } from './utils'

export interface CompanionReply { text: string; escalate?: boolean; chips?: string[] }

export const COMPANION_CHIPS = ['Explain my exercises', 'When is my next appointment?', 'What do my results mean?', 'I have pain or a new symptom', 'Help me use the app']

export function companionReply(input: string, db: DB, p: Patient): CompanionReply {
  const q = input.toLowerCase()
  const first = p.name.split(' ')[0]
  const urgent = ['chest pain', 'breath', 'faint', 'cannot move', "can't move", 'numb', 'fever', 'very swollen', 'calf']
  if (urgent.some((u) => q.includes(u))) {
    return { text: `I'm not able to assess symptoms, ${first}. What you describe may need prompt medical attention. Please call your clinic on +91 20 4000 1100 or go to the nearest emergency department. I'm alerting your therapist too.`, escalate: true }
  }
  if (/(pain|hurt|swell|ache|symptom|worse|bad)/.test(q)) {
    return { text: `I'm sorry you're not feeling well, ${first}. I can't judge what is causing it, but your therapist can. You can submit a symptom check-in so ${therapistName(db, p.therapistId)} sees it, and I'll let them know now. If it gets severe or you feel unwell, please contact the clinic.`, escalate: true, chips: ['Open symptom check-in'] }
  }
  if (/(exercise|programme|program|routine|workout|today)/.test(q)) {
    const t = todaysTasks(db, p.id)
    if (!t.length) return { text: "Your therapist hasn't assigned exercises yet. They'll appear in the Exercises tab after your assessment." }
    const lines = t.map(({ a, done }) => { const ex = getExercise(a.exerciseId)!; return `${done ? '✅' : '▫️'} ${ex.name}: ${a.sets} sets of ${a.reps}. ${ex.instructions.split('.')[0]}.` })
    return { text: `Here's your programme for today:\n${lines.join('\n')}\n\nOpen any exercise to watch the demo or use camera tracking.`, chips: ['Open my exercises'] }
  }
  if (/(appointment|visit|session|when|next|clinic)/.test(q)) {
    const n = nextAppt(db, p.id)
    return n ? { text: `Your next appointment is a ${n.type} on ${fmtDate(n.date, { weekday: 'long', day: 'numeric', month: 'long' })} at ${fmtTime(n.time)} with ${therapistName(db, n.therapistId)} (${n.mode === 'Online' ? 'online' : p.location}). You can confirm or request a change in the Visits tab.`, chips: ['Open appointments'] } : { text: 'You have no upcoming appointments. You can request one in the Visits tab.', chips: ['Open appointments'] }
  }
  if (/(result|progress|mean|angle|degree|recover|goal|better)/.test(q)) {
    return { text: `Your Progress tab shows measurements your therapist has approved, like how far your joint bends, next to your goal. A rising number toward the goal means your movement is improving. I can explain what a number means, but only your therapist can say when you've recovered.`, chips: ['Open my progress'] }
  }
  if (/(help|how|use|app|where)/.test(q)) {
    return { text: 'Home shows today at a glance. Exercises lists your programme and offers camera tracking. Visits is for appointments. Progress shows approved results. More has check-ins, payments, reports and messages with your clinic.' }
  }
  if (/(remind|later)/.test(q)) return { text: `Sure ${first}. I'll remind you about your exercises this evening. (Reminders are simulated in the prototype.)` }
  return { text: `I can help with your exercises, appointments, understanding your progress, or finding things in the app. For anything clinical, I'll pass it to your therapist.`, chips: COMPANION_CHIPS.slice(0, 3) }
}
