import { useState } from 'react'
import { ChevronDown, ClipboardPlus, Save } from 'lucide-react'
import { ConfigForm, ConfigSummary } from '../../../components/ConfigForm'
import { Badge, Button, Card, Chip, Empty, SectionTitle, Select, toast } from '../../../components/ui'
import { NEURO, CLINICAL, GENERAL, orthoTemplate, ORTHO_REGIONS, type Template } from '../../../data/templates'
import { fmtDate } from '../../../lib/utils'
import { ACTORS, useStore } from '../../../store'
import type { Assessment, AssessmentKind, Patient } from '../../../types'

const KINDS: { id: AssessmentKind; label: string }[] = [
  { id: 'general', label: 'General' }, { id: 'clinical', label: 'Clinical chart' }, { id: 'ortho', label: 'Orthopaedic' }, { id: 'neuro', label: 'Neurological' },
]
const tpl = (k: AssessmentKind, region?: string): Template => (k === 'general' ? GENERAL : k === 'clinical' ? CLINICAL : k === 'neuro' ? NEURO : orthoTemplate(region ?? 'Knee'))

export default function AssessTab({ p }: { p: Patient }) {
  const all = useStore((s) => s.assessments).filter((a) => a.patientId === p.id).sort((a, b) => b.date.localeCompare(a.date))
  const save = useStore((s) => s.saveAssessment)
  const role = useStore((s) => s.ui.physioRole)
  const staff = useStore((s) => s.staff)
  const [editing, setEditing] = useState<{ id?: string; kind: AssessmentKind; region?: string; data: Record<string, string> } | null>(null)
  const [open, setOpen] = useState<string | null>(all[0]?.id ?? null)
  const [newKind, setNewKind] = useState<AssessmentKind>('ortho')
  const [newRegion, setNewRegion] = useState(p.region in ORTHO_REGIONS ? p.region : 'Knee')
  const canEdit = role === 'physio'

  if (editing) {
    const t = tpl(editing.kind, editing.region)
    const persist = (status: 'draft' | 'final') => {
      const th = staff.find((s) => s.name === ACTORS[role])?.id ?? p.therapistId
      save({ id: editing.id, patientId: p.id, kind: editing.kind, region: editing.region, date: new Date().toISOString().slice(0, 10), therapistId: th, data: editing.data, status })
      toast(status === 'final' ? 'Assessment finalised and signed' : 'Draft saved')
      setEditing(null)
    }
    return (
      <div className="space-y-4">
        <Card className="flex flex-wrap items-center justify-between gap-2 !p-3.5">
          <div><div className="font-extrabold">{t.title}</div><div className="text-xs text-muted">{t.blurb}</div></div>
          <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
        </Card>
        <Card className="!p-3.5">
          <div className="mb-2 text-[12px] font-extrabold uppercase tracking-wider text-brand-700">Patient information</div>
          <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            <div><span className="text-muted">Patient:</span> <b>{p.name}</b> ({p.code}), {p.age}y {p.sex}</div>
            <div><span className="text-muted">Referral:</span> {p.referral}</div>
            <div><span className="text-muted">Primary complaint:</span> {p.condition}</div>
            <div><span className="text-muted">Date of assessment:</span> {fmtDate(new Date().toISOString().slice(0, 10), { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div><span className="text-muted">Treating therapist:</span> {staff.find((s) => s.id === p.therapistId)?.name}</div>
          </div>
        </Card>
        <Card><ConfigForm template={t} values={editing.data} onChange={(k, v) => setEditing((e) => (e ? { ...e, data: { ...e.data, [k]: v } } : e))} /></Card>
        <div className="sticky bottom-24 z-10 flex gap-2 rounded-2xl bg-white/90 p-2 shadow-lg ring-1 ring-line backdrop-blur lg:bottom-4">
          <Button full variant="secondary" icon={<Save size={16} />} onClick={() => persist('draft')}>Save draft</Button>
          <Button full variant="teal" onClick={() => persist('final')}>Finalise and sign</Button>
        </div>
      </div>
    )
  }

  const orthoBy = (region?: string) => all.filter((a) => a.kind === 'ortho' && a.region === region)
  const baseline = (a: Assessment) => {
    const same = orthoBy(a.region).sort((x, y) => x.date.localeCompare(y.date))
    return same.length > 1 && same[same.length - 1].id === a.id ? same[0] : null
  }

  return (
    <div className="space-y-4">
      {canEdit ? (
        <Card className="!p-3.5">
          <SectionTitle title="Start a new assessment" />
          <div className="mb-3 flex flex-wrap gap-1.5">{KINDS.map((k) => <Chip key={k.id} active={newKind === k.id} onClick={() => setNewKind(k.id)}>{k.label}</Chip>)}</div>
          <div className="flex flex-wrap items-end gap-2">
            {newKind === 'ortho' && <Select value={newRegion} onChange={(e) => setNewRegion(e.target.value)} className="!w-auto">{Object.keys(ORTHO_REGIONS).map((r) => <option key={r}>{r}</option>)}</Select>}
            <Button icon={<ClipboardPlus size={16} />} onClick={() => {
              const prior = all.find((a) => a.kind === newKind && (newKind !== 'ortho' || a.region === newRegion))
              setEditing({ kind: newKind, region: newKind === 'ortho' ? newRegion : undefined, data: {} })
              if (prior) toast('Baseline available: compare against the earlier chart below', 'info')
            }}>Open chart</Button>
          </div>
          <p className="mt-2 text-xs text-muted">Charts are configurable templates, so the clinical lead can adjust protocols without code changes.</p>
        </Card>
      ) : <Card className="!p-3.5 text-sm text-muted">Viewing as {role === 'owner' ? 'clinic owner' : 'staff'}: assessments are read-only. Switch to Physiotherapist to create or edit.</Card>}

      {all.length === 0 ? <Empty icon="📋" title="No assessments yet" body="Start with a general or region-specific chart." /> : all.map((a) => {
        const t = tpl(a.kind, a.region)
        const base = baseline(a)
        const isOpen = open === a.id
        return (
          <Card key={a.id} pad={false}>
            <button className="flex w-full items-center gap-3 p-4 text-left" onClick={() => setOpen(isOpen ? null : a.id)}>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-extrabold">{t.title}</div>
                <div className="text-xs text-muted">{fmtDate(a.date)} · {a.status === 'final' ? 'Signed by treating therapist' : 'Draft'}</div>
              </div>
              <Badge tone={a.status === 'final' ? 'green' : 'amber'}>{a.status}</Badge>
              <ChevronDown size={18} className={`transition ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="border-t border-line p-4">
                {base && a.kind === 'ortho' && (
                  <div className="mb-4 overflow-hidden rounded-xl border border-line">
                    <div className="bg-surface px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted">Baseline ({fmtDate(base.date)}) vs latest ({fmtDate(a.date)})</div>
                    <table className="w-full text-sm">
                      <tbody>
                        {Object.keys(a.data).filter((k) => k.startsWith('a_') && k.endsWith('_R') && base.data[k]).map((k) => {
                          const d = Number(a.data[k]) - Number(base.data[k])
                          return (<tr key={k} className="border-t border-line"><td className="px-3 py-1.5 text-muted">{k.slice(2, -2)} (right, active)</td><td className="px-3 py-1.5 text-right">{base.data[k]}° → <b>{a.data[k]}°</b></td><td className={`px-3 py-1.5 text-right font-bold ${d > 0 ? 'text-ok' : 'text-muted'}`}>{d > 0 ? '+' : ''}{d}°</td></tr>)
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                <ConfigSummary template={t} values={a.data} />
                {a.status === 'final' && <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">Signed by {staff.find((s) => s.id === a.therapistId)?.name}, {staff.find((s) => s.id === a.therapistId)?.role} · {fmtDate(a.date, { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                {canEdit && <Button className="mt-3" size="sm" variant="secondary" onClick={() => setEditing({ id: a.status === 'draft' ? a.id : undefined, kind: a.kind, region: a.region, data: { ...a.data } })}>{a.status === 'draft' ? 'Continue editing' : 'Start follow-up from this chart'}</Button>}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
