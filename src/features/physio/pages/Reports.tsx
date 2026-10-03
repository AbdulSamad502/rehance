import { useMemo, useState } from 'react'
import { Download, FileText, Printer } from 'lucide-react'
import { summaryRows } from '../../../components/ConfigForm'
import { Badge, Button, Card, Notice, PageHeader, SectionTitle, Select } from '../../../components/ui'
import { ADMIN_REPORTS, CLINICAL_REPORTS, OUTCOMES } from '../../../data/catalog'
import type { DB } from '../../../data/seed'
import { CLINICAL, GENERAL, NEURO, orthoTemplate } from '../../../data/templates'
import { canSee } from '../../../lib/access'
import { draftFor } from '../../../lib/copilot'
import { packageSummary, therapistName } from '../../../lib/derive'
import { addDays, fmtDate, fmtDateTime, fmtTime, inr, todayISO } from '../../../lib/utils'
import { useStore, type Store } from '../../../store'
import type { Patient } from '../../../types'

interface Sec { title: string; rows?: [string, string][]; text?: string; table?: { head: string[]; rows: string[][] } }
interface Report { title: string; subtitle: string; status: string; sections: Sec[] }

function clinical(kind: string, db: DB, p: Patient): Report {
  const th = therapistName(db, p.therapistId)
  const finals = db.assessments.filter((a) => a.patientId === p.id && a.status === 'final').sort((a, b) => a.date.localeCompare(b.date))
  const latestOf = (k: string) => [...finals].reverse().find((a) => a.kind === k)
  const tplOf = (a: { kind: string; region?: string }) => (a.kind === 'general' ? GENERAL : a.kind === 'clinical' ? CLINICAL : a.kind === 'neuro' ? NEURO : orthoTemplate(a.region ?? 'Knee'))
  const reviewed = `Reviewed and signed by ${th}`
  const base: Report = { title: kind, subtitle: `${p.name} · ${p.code} · ${p.age}y ${p.sex}`, status: reviewed, sections: [] }
  const assess = (a?: { kind: string; region?: string; data: Record<string, string>; date: string }): Sec[] =>
    a ? [{ title: `${tplOf(a).title} (${fmtDate(a.date)})`, rows: summaryRows(tplOf(a), a.data) }] : [{ title: 'Not available', text: 'No finalised chart of this type exists for the patient.' }]

  switch (kind) {
    case 'Initial assessment report': return { ...base, sections: [{ title: 'Patient', rows: [['Condition', p.condition], ['Referral', p.referral], ['Episode', p.episodeTitle]] }, ...assess(finals[0]), { title: 'Goals', rows: db.goals.filter((g) => g.patientId === p.id).map((g) => [g.kind, `${g.text} (target ${g.target})`] as [string, string]) }] }
    case 'General physiotherapy assessment': return { ...base, sections: assess(latestOf('general')) }
    case 'Orthopaedic assessment report': return { ...base, sections: assess(latestOf('ortho')) }
    case 'Neurological assessment report': return { ...base, sections: assess(latestOf('neuro')) }
    case 'Medical history summary': {
      const h = p.history
      return { ...base, sections: [{ title: 'Conditions', rows: [['Diabetes', h.diabetes.has ? `${h.diabetes.type ?? ''} ${h.diabetes.duration ?? ''}. ${h.diabetes.precautions ?? ''}` : 'No'], ['Cardiac', h.cardiac.has ? `${h.cardiac.condition}. ${h.cardiac.precautions ?? ''}` : 'No'], ['Stroke', h.stroke.has ? `${h.stroke.date}, ${h.stroke.side}. ${h.stroke.residual ?? ''}` : 'No'], ['Hypertension', h.hypertension ? 'Yes' : 'No']] }, { title: 'Other history', rows: [['Surgeries', h.surgeries], ['Injuries', h.injuries], ['Medication', h.medications], ['Allergies', h.allergies], ['Imaging', h.imaging], ['Red flags', h.redFlags], ['Contraindications', h.contraindications]] }, { title: 'Source', text: `${h.source}, updated ${fmtDate(h.updatedAt)}` }] }
    }
    case 'Treatment plan': {
      const pl = db.plans.find((x) => x.patientId === p.id)
      return { ...base, sections: pl ? [{ title: 'Plan', rows: [['Summary', pl.summary], ['Frequency', pl.frequency], ['Duration', pl.sessionDuration], ['Modes', pl.modes.join(', ')], ['Precautions', pl.precautions], ['Reassess every', pl.reassessEvery], ['Review date', pl.reviewDate]] }] : [{ title: 'Not available', text: 'No treatment plan recorded.' }] }
    }
    case 'Treatment session report': {
      const s = [...db.sessions.filter((x) => x.patientId === p.id)].sort((a, b) => b.no - a.no)[0]
      return { ...base, sections: s ? [{ title: `Session #${s.no} · ${fmtDate(s.date)}`, rows: [['Pain before / after', `${s.painBefore} / ${s.painAfter}`], ['Subjective', s.subjective], ['Objective', s.objective], ['Treatment', s.treatment.join(', ')], ['Dosage', s.dosage], ['Tolerance', s.tolerance], ['Adverse response', s.adverse], ['Next plan', s.nextPlan]] }] : [{ title: 'Not available', text: 'No session documented.' }] }
    }
    case 'AI Motion Analysis report': {
      const ms = db.motions.filter((m) => m.patientId === p.id && m.status === 'approved').sort((a, b) => a.at.localeCompare(b.at))
      return { ...base, sections: [{ title: 'Approved analyses', table: { head: ['Date', 'Movement', 'Side', 'Result', 'Manual', 'Quality', 'Source'], rows: ms.map((m) => [fmtDate(m.at), m.movementLabel, m.side, `${m.headline}${m.unit}`, m.manualValue !== undefined ? `${m.manualValue}${m.unit}` : '–', `${m.quality}%`, m.source]) } }, { title: 'Method note', text: 'Estimates from 2D camera pose tracking, reviewed and approved by the treating therapist. Not a diagnosis.' }] }
    }
    case 'Progress report': return { ...base, status: 'Draft assembled from records: pending signature', sections: [{ title: 'Summary', text: draftFor('Progress report', db, p) }] }
    case 'Reassessment report': return { ...base, status: 'Draft assembled from records: pending signature', sections: [{ title: 'Summary', text: draftFor('Reassessment summary', db, p) }] }
    case 'Discharge summary': return { ...base, status: p.status === 'discharged' ? reviewed : 'Draft: patient not yet discharged', sections: [{ title: 'Summary', text: draftFor('Discharge summary', db, p) }] }
    case 'Outcome measure report': {
      const o = db.outcomes.filter((x) => x.patientId === p.id).sort((a, b) => a.date.localeCompare(b.date))
      return { ...base, sections: [{ title: 'Scores', table: { head: ['Measure', 'Date', 'Score', 'Interpretation'], rows: o.map((x) => { const m = OUTCOMES.find((q) => q.id === x.measure); return [x.measure, fmtDate(x.date), `${x.score}${m?.unit === 's' ? ' s' : ''}`, m?.higherBetter ? 'Higher is better' : 'Lower is better'] }) } }] }
    }
    case 'Clinical timeline': {
      const ev = [
        ...db.sessions.filter((s) => s.patientId === p.id).map((s) => [fmtDate(s.date), `Session #${s.no}`, s.objective] as string[]),
        ...db.assessments.filter((a) => a.patientId === p.id).map((a) => [fmtDate(a.date), `${a.kind} assessment`, a.status] as string[]),
        ...db.motions.filter((m) => m.patientId === p.id).map((m) => [fmtDate(m.at), 'Motion analysis', `${m.movementLabel} ${m.headline}${m.unit} (${m.status})`] as string[]),
      ]
      return { ...base, sections: [{ title: 'Chronology', table: { head: ['Date', 'Event', 'Detail'], rows: ev } }] }
    }
    default: return { ...base, sections: [{ title: 'Patient clinical summary', text: draftFor('Assessment summary', db, p) }, { title: 'Goals', rows: db.goals.filter((g) => g.patientId === p.id).map((g) => [g.kind, `${g.text}: ${g.progress}%`] as [string, string]) }] }
  }
}

function admin(kind: string, db: Store): Report {
  const today = todayISO()
  const days = kind.startsWith('Daily') ? 0 : kind.startsWith('Weekly') ? 7 : 30
  const from = addDays(today, -days)
  const appts = db.appointments.filter((a) => a.date >= from && a.date <= (days === 0 ? today : today))
  const name = (id: string) => db.patients.find((p) => p.id === id)?.name ?? ''
  const base = { title: kind, subtitle: `${db.ui.clinic} · ${days === 0 ? fmtDate(today) : `${fmtDate(from)} to ${fmtDate(today)}`}`, status: `Generated ${fmtDateTime(new Date().toISOString())}` }
  switch (kind) {
    case 'Daily appointment report': case 'Weekly appointment report': case 'Monthly appointment report':
      return { ...base, sections: [{ title: 'Summary', rows: [['Total', String(appts.length)], ['Completed', String(appts.filter((a) => a.status === 'Completed').length)], ['No-show', String(appts.filter((a) => a.status === 'No-show').length)], ['Cancelled', String(appts.filter((a) => a.status === 'Cancelled').length)]] }, { title: 'Appointments', table: { head: ['Date', 'Time', 'Patient', 'Therapist', 'Type', 'Status'], rows: appts.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map((a) => [fmtDate(a.date), fmtTime(a.time), name(a.patientId), therapistName(db, a.therapistId), a.type, a.status]) } }] }
    case 'Attendance report': {
      const rows = db.patients.map((p) => { const a = db.appointments.filter((x) => x.patientId === p.id && x.date >= addDays(today, -30) && x.date <= today); const pres = a.filter((x) => x.attendance === 'present' || x.status === 'Completed').length; const abs = a.filter((x) => x.status === 'No-show').length; return [p.name, String(pres), String(abs), pres + abs ? `${Math.round((pres / (pres + abs)) * 100)}%` : '–'] })
      return { ...base, sections: [{ title: 'Last 30 days', table: { head: ['Patient', 'Present', 'Absent', 'Regularity'], rows } }] }
    }
    case 'Patient registration report': return { ...base, sections: [{ title: 'Registrations', table: { head: ['Patient', 'ID', 'Registered', 'Referral', 'Therapist', 'App'], rows: [...db.patients].sort((a, b) => b.registeredAt.localeCompare(a.registeredAt)).map((p) => [p.name, p.code, fmtDate(p.registeredAt), p.referral, therapistName(db, p.therapistId), p.invite.status]) } }] }
    case 'Outstanding payment report': return { ...base, sections: [{ title: 'Balances', table: { head: ['Patient', 'Package', 'Total', 'Paid', 'Outstanding'], rows: db.patients.map((p) => ({ p, s: packageSummary(db, p.id) })).filter((x) => x.s.outstanding > 0).map(({ p, s }) => [p.name, s.pkg?.name ?? '', inr(s.total), inr(s.paid), inr(s.outstanding)]) } }] }
    case 'Revenue and collections report': {
      const pays = db.payments.filter((p) => p.date >= addDays(today, -30))
      return { ...base, sections: [{ title: 'By method (30 days)', rows: ['Cash', 'UPI', 'Card', 'Bank transfer', 'Other'].map((m) => [m, inr(pays.filter((p) => p.method === m).reduce((s, p) => s + p.amount, 0))] as [string, string]) }, { title: 'Transactions', table: { head: ['Date', 'Patient', 'Method', 'Receipt', 'Amount'], rows: pays.sort((a, b) => b.date.localeCompare(a.date)).map((p) => [fmtDate(p.date), name(p.patientId), p.method, p.receiptNo, inr(p.amount)]) } }] }
    }
    case 'Therapist workload report': return { ...base, sections: [{ title: 'Last 30 days', table: { head: ['Therapist', 'Completed', 'Scheduled', 'No-show'], rows: db.staff.filter((s) => s.role.includes('Physio')).map((t) => { const a = db.appointments.filter((x) => x.therapistId === t.id && x.date >= addDays(today, -30)); return [t.name, String(a.filter((x) => x.status === 'Completed').length), String(a.filter((x) => ['Scheduled', 'Confirmed'].includes(x.status)).length), String(a.filter((x) => x.status === 'No-show').length)] }) } }] }
    case 'Session package report': return { ...base, sections: [{ title: 'Packages', table: { head: ['Patient', 'Package', 'Used', 'Remaining'], rows: db.patients.map((p) => ({ p, s: packageSummary(db, p.id) })).filter((x) => x.s.pkg).map(({ p, s }) => [p.name, s.pkg!.name, `${s.used}/${s.sessionsTotal}`, String(s.remaining)]) } }] }
    case 'Cancellation and no-show report': return { ...base, sections: [{ title: 'Events', table: { head: ['Date', 'Patient', 'Status', 'Remark'], rows: db.appointments.filter((a) => ['Cancelled', 'No-show'].includes(a.status)).sort((a, b) => b.date.localeCompare(a.date)).map((a) => [fmtDate(a.date), name(a.patientId), a.status, a.absenceRemark ?? '–']) } }] }
    default: {
      const t = db.staff.filter((s) => s.role.includes('Physio')).length
      const cap = t * 8 * 60 * 5
      const used = db.appointments.filter((a) => a.date >= addDays(today, -7) && a.date <= today && !['Cancelled', 'Rescheduled'].includes(a.status)).reduce((s, a) => s + a.duration, 0)
      return { ...base, sections: [{ title: 'Last 7 days', rows: [['Therapists', String(t)], ['Booked minutes', String(used)], ['Capacity (8h x 5d)', String(cap)], ['Utilisation', `${Math.round((used / cap) * 100)}%`]] }] }
    }
  }
}

export default function Reports() {
  const db = useStore()
  const clinicalOk = canSee(db.ui.physioRole, 'clinical')
  const [sel, setSel] = useState<{ kind: string; type: 'clinical' | 'admin' } | null>(null)
  const [pid, setPid] = useState('p1')
  const p = db.patients.find((x) => x.id === pid)!
  const report = useMemo(() => (sel ? (sel.type === 'clinical' ? clinical(sel.kind, db, p) : admin(sel.kind, db)) : null), [sel, db, p])

  const csv = () => {
    const t = report?.sections.find((s) => s.table)?.table
    if (!t) return
    const body = [t.head, ...t.rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([body], { type: 'text/csv' }))
    a.download = `${report!.title.replace(/\s+/g, '-').toLowerCase()}.csv`
    a.click()
  }

  if (sel && report) {
    return (
      <div className="fade-up">
        <div className="no-print mb-4 flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setSel(null)}>← All reports</Button>
          {sel.type === 'clinical' && <Select value={pid} onChange={(e) => setPid(e.target.value)} className="!h-9 !w-auto !rounded-lg text-[13px]">{db.patients.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>}
          <div className="ml-auto flex gap-2"><Button size="sm" variant="secondary" icon={<Download size={15} />} onClick={csv}>CSV</Button><Button size="sm" icon={<Printer size={15} />} onClick={() => window.print()}>Print / PDF</Button></div>
        </div>
        <Card className="print-area mx-auto max-w-3xl !p-6 sm:!p-8">
          <div className="mb-5 flex items-start justify-between border-b border-line pb-4">
            <div><div className="text-lg font-extrabold text-brand-700">GearPhys</div><div className="text-xs text-muted">{db.ui.clinic}</div></div>
            <div className="text-right text-xs text-muted">{fmtDate(todayISO(), { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
          <h1 className="text-2xl font-extrabold">{report.title}</h1>
          <p className="text-sm text-muted">{report.subtitle}</p>
          <div className="mt-2"><Badge tone={report.status.startsWith('Draft') ? 'amber' : 'green'}>{report.status}</Badge></div>
          <div className="mt-6 space-y-6">
            {report.sections.map((s) => (
              <section key={s.title}>
                <h2 className="mb-2 text-[13px] font-extrabold uppercase tracking-wider text-brand-700">{s.title}</h2>
                {s.rows && (s.rows.length ? <dl className="divide-y divide-line/70">{s.rows.map(([k, v]) => <div key={k} className="flex gap-4 py-1.5 text-sm"><dt className="w-1/3 shrink-0 text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl> : <p className="text-sm text-muted">No data.</p>)}
                {s.text && <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{s.text}</pre>}
                {s.table && (s.table.rows.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-line text-xs uppercase text-muted">{s.table.head.map((h) => <th key={h} className="py-1.5 pr-3 font-semibold">{h}</th>)}</tr></thead><tbody>{s.table.rows.map((r, i) => <tr key={i} className="border-b border-line/60">{r.map((c, j) => <td key={j} className="py-1.5 pr-3">{c}</td>)}</tr>)}</tbody></table></div> : <p className="text-sm text-muted">No records.</p>)}
              </section>
            ))}
          </div>
          <p className="mt-8 border-t border-line pt-3 text-[11px] text-muted">Prototype report generated from simulated data. AI-assisted content is a draft until approved by an authorised professional.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="fade-up space-y-6">
      <PageHeader title="Reports" subtitle="Clinical and administrative reports with print and export" />
      {clinicalOk ? (
        <div>
          <SectionTitle title="Clinical reports" />
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {CLINICAL_REPORTS.map((r) => (
              <Card key={r} onClick={() => setSel({ kind: r, type: 'clinical' })} className="flex items-center gap-3 !p-3.5"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><FileText size={18} /></div><span className="text-sm font-bold">{r}</span></Card>
            ))}
          </div>
        </div>
      ) : <Notice tone="amber" title="Clinical reports are restricted for this role">Switch to Physiotherapist to see clinical reports.</Notice>}
      <div>
        <SectionTitle title="Administrative reports" />
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {ADMIN_REPORTS.map((r) => (
            <Card key={r} onClick={() => setSel({ kind: r, type: 'admin' })} className="flex items-center gap-3 !p-3.5"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600"><FileText size={18} /></div><span className="text-sm font-bold">{r}</span></Card>
          ))}
        </div>
      </div>
    </div>
  )
}
