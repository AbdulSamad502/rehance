// Template-based "drafting copilot". No language model: text is assembled from recorded data,
// so every sentence can be traced back to something the clinician or patient entered.
import type { DB } from '../data/seed'
import { getExercise } from '../data/catalog'
import type { Patient } from '../types'
import { adherence, motionsOf, packageSummary, therapistName } from './derive'
import { fmtDate } from './utils'

export const DRAFT_KINDS = ['SOAP note', 'Assessment summary', 'Treatment session summary', 'Reassessment summary', 'Progress report', 'Discharge summary'] as const
export type DraftKind = (typeof DRAFT_KINDS)[number]

function facts(db: DB, p: Patient) {
  const sessions = db.sessions.filter((s) => s.patientId === p.id).sort((a, b) => a.no - b.no)
  const last = sessions[sessions.length - 1]
  const first = sessions[0]
  const ms = motionsOf(db, p.id).filter((m) => m.status === 'approved')
  const lastM = ms[ms.length - 1]
  const baseM = ms.find((m) => m.movementId === lastM?.movementId && m.side === lastM?.side)
  const goals = db.goals.filter((g) => g.patientId === p.id)
  const plan = db.plans.find((x) => x.patientId === p.id)
  const ad = adherence(db, p.id, 7)
  const assess = db.assessments.filter((a) => a.patientId === p.id && a.status === 'final').sort((a, b) => b.date.localeCompare(a.date))[0]
  const outcomes = db.outcomes.filter((o) => o.patientId === p.id).sort((a, b) => a.date.localeCompare(b.date))
  const measure = outcomes.length ? outcomes[outcomes.length - 1].measure : null
  const mSeries = outcomes.filter((o) => o.measure === measure)
  return { sessions, last, first, lastM, baseM, goals, plan, ad, assess, measure, mSeries, ms }
}

export function draftFor(kind: DraftKind, db: DB, p: Patient): string {
  const f = facts(db, p)
  const th = therapistName(db, p.therapistId)
  const romLine = f.lastM
    ? `${f.lastM.movementLabel} (${f.lastM.side}) ${f.lastM.headline}${f.lastM.unit}${f.baseM && f.baseM.id !== f.lastM.id ? `, from ${f.baseM.headline}${f.lastM.unit} at baseline` : ''} (AI estimate, therapist-approved).`
    : 'No approved motion-analysis measurement on record.'
  const painLine = f.last ? `Pain ${f.last.painBefore}/10 before and ${f.last.painAfter}/10 after treatment${f.first && f.first !== f.last ? ` (was ${f.first.painBefore}/10 at session 1)` : ''}.` : 'No pain scores recorded.'
  const goalLine = f.goals.length ? f.goals.map((g) => `${g.text} (${g.progress}%)`).join('; ') : 'No goals recorded.'
  const outLine = f.measure && f.mSeries.length ? `${f.measure}: ${f.mSeries[0].score} → ${f.mSeries[f.mSeries.length - 1].score}.` : 'No outcome measures recorded.'
  const hx = p.history

  switch (kind) {
    case 'SOAP note':
      return `SOAP NOTE: ${p.name} (${p.code}) · ${fmtDate(new Date().toISOString().slice(0, 10))}\n\nS: ${f.last?.subjective ?? 'Subjective information not yet recorded.'} ${painLine}\nO: ${f.last?.objective ?? 'No objective findings recorded.'} ${romLine}\nA: ${p.condition}. ${f.goals.length ? `Goal progress: ${goalLine}` : ''} Home-exercise adherence ${f.ad === null ? 'not applicable' : f.ad + '% over the last 7 days'}.\nP: ${f.last?.nextPlan ?? 'Continue current plan.'} ${f.plan ? `Frequency: ${f.plan.frequency}. Precautions: ${f.plan.precautions}` : ''}\n\n[Draft assembled from recorded data. Requires review and approval by ${th}.]`
    case 'Assessment summary':
      return `ASSESSMENT SUMMARY: ${p.name} (${p.code})\n\nPresenting condition: ${p.condition} (${p.episodeTitle}). Referred by ${p.referral}.\nRelevant history: ${hx.surgeries !== 'None' ? 'Surgery: ' + hx.surgeries + '. ' : ''}${hx.hypertension ? 'Hypertension. ' : ''}${hx.diabetes.has ? `Diabetes (${hx.diabetes.type ?? 'type not stated'}). ` : ''}${hx.cardiac.has ? `Cardiac: ${hx.cardiac.condition}. ` : ''}${hx.stroke.has ? `Stroke (${hx.stroke.side} side). ` : ''}Medication: ${hx.medications}. Allergies: ${hx.allergies}.\nPrecautions: ${hx.redFlags !== 'None identified' ? hx.redFlags + '. ' : ''}${hx.contraindications !== 'None' ? hx.contraindications + '.' : 'None recorded.'}\nLatest finalised assessment: ${f.assess ? `${f.assess.kind}${f.assess.region ? ' (' + f.assess.region + ')' : ''}, ${fmtDate(f.assess.date)}` : 'none'}.\nMeasured: ${romLine}\nGoals: ${goalLine}\n\n[Draft assembled from recorded data. Requires clinician review.]`
    case 'Treatment session summary':
      return f.last
        ? `SESSION #${f.last.no} SUMMARY: ${p.name} · ${fmtDate(f.last.date)}\n\nTreatment: ${f.last.treatment.join(', ')}. Dosage: ${f.last.dosage}.\nResponse: ${painLine} Tolerance ${f.last.tolerance.toLowerCase()}; adverse response: ${f.last.adverse.toLowerCase()}.\nFindings: ${f.last.objective}\nNext session: ${f.last.nextPlan}\n\n[Draft. Requires approval before sharing with the patient.]`
        : 'No session has been documented yet. Document a session first.'
    case 'Reassessment summary':
      return `REASSESSMENT SUMMARY: ${p.name} (${p.code}) · ${fmtDate(new Date().toISOString().slice(0, 10))}\n\nMeasured change: ${romLine} ${painLine} ${outLine}\nSessions attended: ${f.sessions.length}. Adherence (7 days): ${f.ad ?? 'n/a'}%.\nGoal review: ${goalLine}\nSuggested clinician considerations: ${f.ad !== null && f.ad < 50 ? 'address low home-exercise adherence; ' : ''}${f.goals.some((g) => g.progress >= 80) ? 'consider progressing goals that are nearly achieved; ' : ''}update the plan as clinically appropriate.\n\n[Draft. Conclusions are the clinician's responsibility.]`
    case 'Progress report':
      return `PROGRESS REPORT: ${p.name} (${p.code})\nPeriod: ${f.first ? fmtDate(f.first.date) : fmtDate(p.episodeStart)} to ${fmtDate(new Date().toISOString().slice(0, 10))}\n\n1. Clinical measurements\n   • ${romLine}\n   • ${painLine}\n   • ${outLine}\n2. Attendance and adherence\n   • ${f.sessions.length} sessions documented; home-exercise adherence ${f.ad ?? 'n/a'}% this week.\n3. Goals\n   • ${f.goals.map((g) => `${g.text}: ${g.progress}%`).join('\n   • ') || 'None recorded'}\n4. Plan\n   • ${f.plan?.summary ?? 'No plan recorded.'}\n\n[Draft progress report. Measured values are separated from observations; review before release.]`
    case 'Discharge summary': {
      const hep = db.assignments.filter((a) => a.patientId === p.id && a.status === 'Active').map((a) => getExercise(a.exerciseId)?.name).filter(Boolean)
      const pkg = packageSummary(db, p.id)
      return `DISCHARGE SUMMARY: ${p.name} (${p.code})\n\nCondition: ${p.condition}. Treated by ${th} from ${fmtDate(p.episodeStart)}; ${f.sessions.length} sessions documented${pkg.pkg ? ` (${pkg.used}/${pkg.sessionsTotal} package sessions used)` : ''}.\nFinal measurements: ${romLine} ${painLine} ${outLine}\nGoals at discharge: ${goalLine}\nHome exercise recommendations: ${hep.length ? hep.join(', ') : 'to be specified'}.\nFollow-up: return if symptoms recur or worsen; routine review in 4 to 6 weeks if needed.\n\n[Draft. Requires clinician completion and signature.]`
    }
  }
}

export function recordSearch(db: DB, p: Patient, q: string) {
  const needle = q.toLowerCase().trim()
  if (!needle) return []
  const out: { type: string; when: string; text: string }[] = []
  db.sessions.filter((s) => s.patientId === p.id).forEach((s) => {
    const hay = [s.subjective, s.objective, s.notes, s.nextPlan, s.dosage, s.treatment.join(' ')].join(' ')
    if (hay.toLowerCase().includes(needle)) out.push({ type: `Session #${s.no}`, when: fmtDate(s.date), text: hay.slice(0, 160) })
  })
  db.assessments.filter((a) => a.patientId === p.id).forEach((a) => {
    const hay = Object.values(a.data).join(' ')
    if (hay.toLowerCase().includes(needle)) out.push({ type: `${a.kind} assessment`, when: fmtDate(a.date), text: hay.slice(0, 160) })
  })
  db.motions.filter((m) => m.patientId === p.id).forEach((m) => {
    const hay = [m.movementLabel, m.annotation ?? '', m.observations.join(' ')].join(' ')
    if (hay.toLowerCase().includes(needle)) out.push({ type: 'Motion analysis', when: fmtDate(m.at), text: `${m.movementLabel}: ${m.headline}${m.unit}. ${m.annotation ?? ''}` })
  })
  const h = JSON.stringify(p.history).toLowerCase()
  if (h.includes(needle)) out.push({ type: 'Medical history', when: fmtDate(p.history.updatedAt), text: `Mentions "${q}" in recorded history.` })
  return out.slice(0, 10)
}

export function missingDocumentation(db: DB, p: Patient): string[] {
  const out: string[] = []
  const finals = db.assessments.filter((a) => a.patientId === p.id && a.status === 'final')
  if (!finals.length) out.push('No finalised assessment on record')
  if (db.assessments.some((a) => a.patientId === p.id && a.status === 'draft')) out.push('An assessment is still a draft')
  if (!db.plans.some((x) => x.patientId === p.id)) out.push('No treatment plan')
  if (!db.goals.some((g) => g.patientId === p.id)) out.push('No rehabilitation goals set')
  const s = db.sessions.filter((x) => x.patientId === p.id)
  if (s.some((x) => !x.nextPlan)) out.push('A session note has no next-session plan')
  if (p.history.allergies === 'No known allergies' && p.history.source === 'Registration desk') out.push('Medical history not yet taken from the patient')
  if (!db.outcomes.some((o) => o.patientId === p.id)) out.push('No outcome measure recorded')
  if (!db.motions.some((m) => m.patientId === p.id && m.status === 'approved')) out.push('No approved motion-analysis baseline')
  return out
}

export const RECORD_QUERIES = ['Summarise medical history', 'Summarise treatment history', 'Compare measurements', 'Summarise clinical timeline', 'Previous motion results'] as const
export type RecordQuery = (typeof RECORD_QUERIES)[number]

/** Read-only answers assembled from the record (the "record assistant"). */
export function recordAnswer(q: RecordQuery, db: DB, p: Patient): string {
  const f = facts(db, p)
  const h = p.history
  switch (q) {
    case 'Summarise medical history': {
      const conds = [h.diabetes.has && `diabetes${h.diabetes.type ? ` (${h.diabetes.type})` : ''}`, h.hypertension && 'hypertension', h.cardiac.has && `cardiac condition (${h.cardiac.condition ?? 'unspecified'})`, h.stroke.has && `stroke (${h.stroke.side ?? ''} side, ${h.stroke.date ?? ''})`].filter(Boolean)
      return `${p.name}, ${p.age}y ${p.sex}. ${conds.length ? 'Known: ' + conds.join(', ') + '. ' : 'No chronic conditions recorded. '}Surgeries: ${h.surgeries}. Injuries: ${h.injuries}. Medication: ${h.medications}. Allergies: ${h.allergies}. Imaging: ${h.imaging}. Red flags: ${h.redFlags}. Contraindications: ${h.contraindications}. (Source: ${h.source}, updated ${fmtDate(h.updatedAt)}.)`
    }
    case 'Summarise treatment history': {
      if (!f.sessions.length) return 'No treatment sessions have been documented yet.'
      const modes = [...new Set(f.sessions.flatMap((s) => s.treatment))]
      return `${f.sessions.length} sessions from ${fmtDate(f.first!.date)} to ${fmtDate(f.last!.date)}. Interventions used: ${modes.join(', ')}. Pain before treatment moved from ${f.first!.painBefore}/10 to ${f.last!.painBefore}/10. Latest finding: ${f.last!.objective} Latest plan: ${f.last!.nextPlan}`
    }
    case 'Compare measurements': {
      const lines: string[] = []
      if (f.baseM && f.lastM && f.baseM.id !== f.lastM.id) lines.push(`${f.lastM.movementLabel} (${f.lastM.side}): ${f.baseM.headline}${f.lastM.unit} at baseline → ${f.lastM.headline}${f.lastM.unit} now (${f.lastM.headline - f.baseM.headline >= 0 ? '+' : ''}${Math.round((f.lastM.headline - f.baseM.headline) * 10) / 10}${f.lastM.unit}).`)
      if (f.mSeries.length >= 2) lines.push(`${f.measure}: ${f.mSeries[0].score} → ${f.mSeries[f.mSeries.length - 1].score}.`)
      if (f.sessions.length >= 2) lines.push(`Pain before treatment: ${f.first!.painBefore} → ${f.last!.painBefore}.`)
      return lines.length ? lines.join('\n') : 'Not enough repeated measurements to compare yet.'
    }
    case 'Summarise clinical timeline': {
      const ev = [
        ...f.sessions.map((s) => ({ d: s.date, t: `Session #${s.no}: ${s.objective}` })),
        ...db.assessments.filter((a) => a.patientId === p.id).map((a) => ({ d: a.date, t: `${a.kind} assessment (${a.status})` })),
        ...db.motions.filter((m) => m.patientId === p.id).map((m) => ({ d: m.at.slice(0, 10), t: `Motion analysis ${m.movementLabel} ${m.headline}${m.unit} (${m.status})` })),
      ].sort((a, b) => a.d.localeCompare(b.d))
      return ev.length ? ev.map((e) => `${fmtDate(e.d)}: ${e.t}`).join('\n') : 'No clinical events recorded.'
    }
    default: {
      const ms = db.motions.filter((m) => m.patientId === p.id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5)
      return ms.length ? ms.map((m) => `${fmtDate(m.at)}: ${m.movementLabel} (${m.side}) ${m.headline}${m.unit}, ${m.reps.length} reps, quality ${m.quality}%, ${m.status}`).join('\n') : 'No motion analyses on file.'
    }
  }
}