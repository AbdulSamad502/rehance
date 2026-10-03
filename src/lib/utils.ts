import clsx, { type ClassValue } from 'clsx'

export const cn = (...v: ClassValue[]) => clsx(v)

let counter = 0
export const uid = (p = 'id') => `${p}_${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 5)}`

const pad = (n: number) => String(n).padStart(2, '0')
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayISO = () => isoDate(new Date())
export const addDays = (iso: string, n: number) => {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return isoDate(d)
}
export const daysFromToday = (n: number) => addDays(todayISO(), n)

export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
  new Date(iso.length <= 10 ? iso + 'T12:00:00' : iso).toLocaleDateString('en-IN', opts)
export const fmtDateLong = (iso: string) =>
  fmtDate(iso, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
export const fmtTime = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'
  return `${((h + 11) % 12) + 1}:${pad(m)} ${ap}`
}
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

export const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase()

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
export const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0)
export const std = (a: number[]) => {
  if (a.length < 2) return 0
  const m = mean(a)
  return Math.sqrt(mean(a.map((v) => (v - m) ** 2)))
}
export const round = (v: number, d = 0) => {
  const f = 10 ** d
  return Math.round(v * f) / f
}

export const BASE = import.meta.env.BASE_URL
export const asset = (p: string) => BASE + p.replace(/^\//, '')
