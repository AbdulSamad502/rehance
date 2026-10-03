import { useEffect, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { create } from 'zustand'
import { ArrowLeft, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { cn, initials } from '../lib/utils'

/* ---------- Brand ---------- */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a80d2" />
          <stop offset="1" stopColor="#14a3a8" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#lg)" />
      <circle cx="32" cy="32" r="19" fill="none" stroke="#fff" strokeWidth="7" strokeDasharray="5.2 5.2" opacity=".95" />
      <circle cx="32" cy="32" r="15" fill="#fff" />
      <circle cx="33" cy="22" r="3.2" fill="#1a68b5" />
      <path d="M33 26 L31 35 M31 35 L25 43 M31 35 L38 42 M33 28 L25 31 M33 28 L41 24" stroke="#1a68b5" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  )
}
export function Logo({ size = 34, light = false }: { size?: number; light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <div className="leading-none">
        <div className={cn('text-[17px] font-extrabold tracking-tight', light ? 'text-white' : 'text-brand-700')}>
          Gear<span className={light ? 'text-teal-100' : 'text-teal-600'}>Phys</span>
        </div>
        <div className={cn('mt-0.5 text-[9.5px] font-semibold uppercase tracking-[.16em]', light ? 'text-white/70' : 'text-muted')}>Recovery &amp; Motion</div>
      </div>
    </div>
  )
}

/* ---------- Layout atoms ---------- */
export function Card({ className, children, onClick, pad = true }: { className?: string; children: ReactNode; onClick?: () => void; pad?: boolean }) {
  // A div with button semantics, so cards can safely contain real buttons.
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick() } } : undefined}
      className={cn('block w-full rounded-2xl border border-line bg-white text-left shadow-[0_1px_2px_rgba(15,34,54,.04),0_6px_18px_-10px_rgba(15,34,54,.12)]', pad && 'p-4', onClick && 'cursor-pointer transition active:scale-[.99] hover:border-brand-200 focus-visible:outline-2 focus-visible:outline-brand-400', className)}
    >
      {children}
    </div>
  )
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft' | 'teal'
const btnStyles: Record<BtnVariant, string> = {
  primary: 'bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-[0_6px_16px_-6px_rgba(26,104,181,.7)] hover:brightness-110',
  teal: 'bg-gradient-to-br from-teal-600 to-teal-500 text-white shadow-[0_6px_16px_-6px_rgba(14,134,140,.7)] hover:brightness-110',
  secondary: 'bg-white text-brand-700 border border-brand-200 hover:bg-brand-50',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  ghost: 'text-brand-700 hover:bg-brand-50',
  danger: 'bg-bad text-white hover:brightness-110',
}
export function Button({ variant = 'primary', size = 'md', icon, full, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg'; icon?: ReactNode; full?: boolean }) {
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-9 px-3 text-[13px]' : size === 'lg' ? 'h-12 px-6 text-[15px]' : 'h-10 px-4 text-sm',
        btnStyles[variant], full ? 'w-full min-w-0' : 'shrink-0', className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}

const tones = {
  blue: 'bg-brand-50 text-brand-700 ring-brand-100',
  teal: 'bg-teal-50 text-teal-700 ring-teal-100',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  red: 'bg-red-50 text-red-700 ring-red-100',
  gray: 'bg-slate-100 text-slate-600 ring-slate-200',
  purple: 'bg-violet-50 text-violet-700 ring-violet-100',
}
export type Tone = keyof typeof tones
export function Badge({ tone = 'gray', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ring-1 ring-inset', tones[tone], className)}>{children}</span>
}
export const SimBadge = ({ label = 'Simulated' }: { label?: string }) => (
  <span className="inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800" title="This feature is simulated in the prototype">{label}</span>
)

export function Avatar({ name, tint = '#2a80d2', size = 40 }: { name: string; tint?: string; size?: number }) {
  return (
    <div className="grid shrink-0 place-items-center rounded-full font-bold text-white" style={{ width: size, height: size, background: `linear-gradient(135deg, ${tint}, ${tint}cc)`, fontSize: size * 0.38 }}>
      {initials(name)}
    </div>
  )
}

export function StatCard({ label, value, sub, icon, tone = 'blue', onClick }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode; tone?: Tone; onClick?: () => void }) {
  const toneBg: Record<Tone, string> = { blue: 'bg-brand-50 text-brand-600', teal: 'bg-teal-50 text-teal-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', red: 'bg-red-50 text-red-600', gray: 'bg-slate-100 text-slate-600', purple: 'bg-violet-50 text-violet-600' }
  return (
    <Card onClick={onClick} className="!p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase leading-tight tracking-wide text-muted">{label}</div>
          <div className="mt-1 text-2xl font-extrabold tracking-tight text-ink">{value}</div>
          {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
        </div>
        {icon && <div className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', toneBg[tone])}>{icon}</div>}
      </div>
    </Card>
  )
}

export function SectionTitle({ title, action, className }: { title: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-2.5 mt-1 flex items-center justify-between gap-2', className)}>
      <h3 className="text-[15px] font-bold text-ink">{title}</h3>
      {action}
    </div>
  )
}

export function PageHeader({ title, subtitle, back, actions }: { title: ReactNode; subtitle?: ReactNode; back?: () => void; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2">
        {back && (
          <button onClick={back} aria-label="Back" className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-white text-brand-700 active:scale-95">
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold tracking-tight text-ink sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { id: T; label: ReactNode; badge?: number }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cn('no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1', className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition', value === t.id ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-muted ring-1 ring-inset ring-line hover:text-brand-700')}
        >
          {t.label}
          {t.badge ? <span className={cn('grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px]', value === t.id ? 'bg-white/25' : 'bg-brand-100 text-brand-700')}>{t.badge}</span> : null}
        </button>
      ))}
    </div>
  )
}

export function Segmented<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex w-full rounded-xl bg-slate-100 p-1">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)} className={cn('flex-1 rounded-lg px-2 py-1.5 text-[13px] font-semibold transition', value === o ? 'bg-white text-brand-700 shadow-sm' : 'text-muted')}>
          {o}
        </button>
      ))}
    </div>
  )
}

export function ProgressBar({ value, tone = 'blue', className }: { value: number; tone?: 'blue' | 'teal' | 'green' | 'amber' | 'red'; className?: string }) {
  const c = { blue: 'bg-brand-500', teal: 'bg-teal-500', green: 'bg-ok', amber: 'bg-warn', red: 'bg-bad' }[tone]
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div className={cn('h-full rounded-full transition-all duration-700', c)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function Ring({ value, size = 64, stroke = 7, label, color = '#14a3a8' }: { value: number; size?: number; stroke?: number; label?: ReactNode; color?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e6eef7" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(100, value)) / 100)} style={{ transition: 'stroke-dashoffset .8s ease' }} />
      </svg>
      <div className="absolute text-center text-[13px] font-extrabold text-ink">{label ?? `${Math.round(value)}%`}</div>
    </div>
  )
}

export function Empty({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-white/60 px-6 py-10 text-center">
      <div className="mb-2 text-3xl">{icon ?? '🗂️'}</div>
      <div className="font-bold text-ink">{title}</div>
      {body && <p className="mt-1 max-w-xs text-sm text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function KV({ k, v }: { k: ReactNode; v: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/70 py-2 text-sm last:border-0">
      <span className="text-muted">{k}</span>
      <span className="max-w-[62%] text-right font-semibold text-ink">{v}</span>
    </div>
  )
}

export function Notice({ tone = 'blue', title, children }: { tone?: 'blue' | 'amber' | 'red' | 'green' | 'teal'; title?: ReactNode; children?: ReactNode }) {
  const map = { blue: 'border-brand-100 bg-brand-50 text-brand-800', amber: 'border-amber-200 bg-amber-50 text-amber-900', red: 'border-red-200 bg-red-50 text-red-900', green: 'border-emerald-200 bg-emerald-50 text-emerald-900', teal: 'border-teal-100 bg-teal-50 text-teal-800' }
  const Icon = tone === 'amber' || tone === 'red' ? TriangleAlert : tone === 'green' ? CheckCircle2 : Info
  return (
    <div className={cn('flex gap-2.5 rounded-xl border px-3 py-2.5 text-[13px] leading-snug', map[tone])}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div>{title && <div className="font-bold">{title}</div>}{children}</div>
    </div>
  )
}

/* ---------- Forms ---------- */
const inputCls = 'w-full rounded-xl border border-line bg-white px-3 text-[15px] text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-50'
export function Field({ label, hint, children, className }: { label?: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      {label && <span className="mb-1 block text-[12.5px] font-semibold text-slate-600">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}
export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cn(inputCls, 'h-11', className)} />
export const Select = ({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cn(inputCls, 'h-11 appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%277%27 fill=%27none%27%3E%3Cpath d=%27M1 1l5 5 5-5%27 stroke=%27%235b6e82%27 stroke-width=%271.8%27 stroke-linecap=%27round%27/%3E%3C/svg%3E")] bg-[length:12px] bg-[right_14px_center] bg-no-repeat pr-9', className)}>{children}</select>
export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cn(inputCls, 'min-h-[84px] py-2.5', className)} />

export function Scale({ value, onChange, max = 10 }: { value: number; onChange: (n: number) => void; max?: number }) {
  const color = value <= 3 ? '#1f9d6b' : value <= 6 ? '#d98e04' : '#d64545'
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-2xl font-extrabold" style={{ color }}>{value}</span>
        <span className="text-xs text-muted">{value <= 2 ? 'Minimal' : value <= 4 ? 'Mild' : value <= 6 ? 'Moderate' : value <= 8 ? 'Severe' : 'Worst'}</span>
      </div>
      <input type="range" min={0} max={max} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 accent-white [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-brand-600 [&::-webkit-slider-thumb]:shadow-lg" />
      <div className="mt-1 flex justify-between text-[10px] text-muted">{Array.from({ length: max + 1 }, (_, i) => <span key={i}>{i}</span>)}</div>
    </div>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="inline-flex items-center gap-2.5 text-sm font-medium text-ink">
      <span className={cn('relative h-6 w-11 rounded-full transition', checked ? 'bg-teal-500' : 'bg-slate-300')}>
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
      </span>
      {label}
    </button>
  )
}

export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn('rounded-full px-3 py-1.5 text-[13px] font-semibold ring-1 ring-inset transition', active ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-600 ring-line hover:ring-brand-300')}>
      {children}
    </button>
  )
}

/* ---------- Sheet (bottom sheet on mobile, dialog on desktop) ---------- */
export function Sheet({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]" onClick={onClose} />
      <div ref={ref} className={cn('sheet-up relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl', wide ? 'sm:max-w-2xl' : 'sm:max-w-md')}>
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="text-base font-extrabold text-ink">{title}</div>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600 active:scale-95"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4 safe-bottom">{children}</div>
      </div>
    </div>
  )
}

/* ---------- Toasts ---------- */
interface ToastItem { id: number; text: string; tone: 'ok' | 'info' | 'warn' }
const useToasts = create<{ items: ToastItem[] }>(() => ({ items: [] }))
let tid = 0
export function toast(text: string, tone: ToastItem['tone'] = 'ok') {
  const id = ++tid
  useToasts.setState((s) => ({ items: [...s.items, { id, text, tone }] }))
  setTimeout(() => useToasts.setState((s) => ({ items: s.items.filter((i) => i.id !== id) })), 3200)
}
export function Toaster() {
  const items = useToasts((s) => s.items)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[120] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="fade-up pointer-events-auto flex max-w-sm items-center gap-2 rounded-2xl bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-xl">
          {t.tone === 'ok' ? <CheckCircle2 size={16} className="text-teal-400" /> : t.tone === 'warn' ? <TriangleAlert size={16} className="text-amber-400" /> : <Info size={16} className="text-brand-300" />}
          {t.text}
        </div>
      ))}
    </div>
  )
}

export function Divider({ className }: { className?: string }) { return <div className={cn('my-3 h-px bg-line', className)} /> }
