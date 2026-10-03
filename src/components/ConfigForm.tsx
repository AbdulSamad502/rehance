import type { Field, Template } from '../data/templates'
import { cn } from '../lib/utils'
import { Field as FormField, Input, Scale, Select, Textarea } from './ui'

type Values = Record<string, string>

function Control({ f, v, set, readOnly }: { f: Field; v: Values; set: (k: string, val: string) => void; readOnly?: boolean }) {
  if (f.kind === 'text') return <FormField label={f.label} hint={f.hint}><Input value={v[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} disabled={readOnly} /></FormField>
  if (f.kind === 'area') return <FormField label={f.label} hint={f.hint}><Textarea value={v[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} disabled={readOnly} className="!min-h-[68px]" /></FormField>
  if (f.kind === 'select') return (
    <FormField label={f.label}>
      <Select value={v[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} disabled={readOnly}>
        <option value="">Select…</option>
        {f.options!.map((o) => <option key={o}>{o}</option>)}
      </Select>
    </FormField>
  )
  if (f.kind === 'scale') return (
    <FormField label={f.label}>
      <Scale value={Number(v[f.key] ?? 0)} onChange={(n) => !readOnly && set(f.key, String(n))} />
    </FormField>
  )
  if (f.kind === 'lr') return (
    <FormField label={f.label}>
      <div className="grid grid-cols-2 gap-2">
        {(['L', 'R'] as const).map((s) => (
          <div key={s} className="relative">
            <span className="absolute left-3 top-3 text-[11px] font-bold text-brand-600">{s === 'L' ? 'LEFT' : 'RIGHT'}</span>
            <Input inputMode="decimal" value={v[`${f.key}_${s}`] ?? ''} onChange={(e) => set(`${f.key}_${s}`, e.target.value)} disabled={readOnly} className="pl-14 text-right font-semibold" placeholder={f.unit} />
          </div>
        ))}
      </div>
    </FormField>
  )
  return (
    <div>
      <span className="mb-1 block text-[12.5px] font-semibold text-slate-600">{f.label}</span>
      <div className="divide-y divide-line rounded-xl border border-line bg-white">
        {f.tests!.map((t) => {
          const key = `test_${t}`
          return (
            <div key={t} className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="text-sm font-medium">{t}</span>
              <div className="flex gap-1">
                {['Positive', 'Negative', 'N/T'].map((o) => (
                  <button key={o} type="button" disabled={readOnly} onClick={() => set(key, o)} className={cn('rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset transition', v[key] === o ? (o === 'Positive' ? 'bg-red-500 text-white ring-red-500' : o === 'Negative' ? 'bg-emerald-500 text-white ring-emerald-500' : 'bg-slate-500 text-white ring-slate-500') : 'bg-white text-slate-500 ring-line')}>{o}</button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ConfigForm({ template, values, onChange, readOnly }: { template: Template; values: Values; onChange: (k: string, val: string) => void; readOnly?: boolean }) {
  return (
    <div className="space-y-6">
      {template.sections.map((s) => (
        <section key={s.title}>
          <h4 className="mb-3 text-[13px] font-extrabold uppercase tracking-wider text-brand-700">{s.title}</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {s.fields.map((f) => (
              <div key={f.key} className={cn(f.kind === 'area' || f.kind === 'tests' || f.kind === 'scale' ? 'sm:col-span-2' : '')}>
                <Control f={f} v={values} set={onChange} readOnly={readOnly} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/** Label/value pairs for everything that has been filled in. */
export function summaryRows(template: Template, values: Values): [string, string][] {
  const rows: [string, string][] = []
  for (const s of template.sections) {
    for (const f of s.fields) {
      if (f.kind === 'lr') {
        const l = values[`${f.key}_L`], r = values[`${f.key}_R`]
        if (l || r) rows.push([f.label, `L ${l || '–'} · R ${r || '–'}`])
      } else if (f.kind === 'tests') {
        const done = f.tests!.filter((t) => values[`test_${t}`]).map((t) => `${t}: ${values[`test_${t}`]}`)
        if (done.length) rows.push([f.label, done.join(', ')])
      } else if (values[f.key]) rows.push([f.label, f.kind === 'scale' ? `${values[f.key]}/10` : values[f.key]])
    }
  }
  return rows
}

/** Compact read-only view of whatever has been filled in. */
export function ConfigSummary({ template, values }: { template: Template; values: Values }) {
  const rows = summaryRows(template, values)
  if (!rows.length) return <p className="text-sm text-muted">Nothing recorded yet.</p>
  return (
    <dl className="divide-y divide-line/70">
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-4 py-1.5 text-sm"><dt className="w-2/5 shrink-0 text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>
      ))}
    </dl>
  )
}
