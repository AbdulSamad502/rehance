import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const AXIS = { fontSize: 11, fill: '#5b6e82' }
const GRID = '#e8eff7'

export interface LineSpec { key: string; name: string; color: string; dashed?: boolean }

export function TrendChart({ data, xKey = 'x', lines, height = 200, yDomain, target, unit = '', area }: {
  data: Record<string, number | string | null>[]; xKey?: string; lines: LineSpec[]; height?: number; yDomain?: [number | 'auto', number | 'auto']; target?: number; unit?: string; area?: boolean
}) {
  const numeric = typeof data[0]?.[xKey] === 'number'
  const common = (
    <>
      <CartesianGrid stroke={GRID} vertical={false} />
      <XAxis
        dataKey={xKey} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={18}
        type={numeric ? 'number' : 'category'} domain={numeric ? [0, 'dataMax'] : undefined} tickCount={numeric ? 6 : undefined}
        tickFormatter={numeric ? (v) => `${Math.round(Number(v))}` : undefined}
      />
      <YAxis tick={AXIS} tickLine={false} axisLine={false} width={34} domain={yDomain ?? ['auto', 'auto']} />
      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e1e9f2', fontSize: 12, boxShadow: '0 8px 24px -8px rgba(15,34,54,.25)' }} formatter={(v) => `${v}${unit}`} />
      {target !== undefined && <ReferenceLine y={target} stroke="#14a3a8" strokeDasharray="5 4" label={{ value: `Goal ${target}${unit}`, position: 'insideTopRight', fill: '#0e868c', fontSize: 11 }} />}
    </>
  )
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {area ? (
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              {lines.map((l) => (
                <linearGradient key={l.key} id={`g-${l.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={l.color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={l.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            {common}
            {lines.map((l) => <Area key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2.5} fill={`url(#g-${l.key})`} dot={false} isAnimationActive={false} />)}
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            {common}
            {lines.map((l) => <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2.5} strokeDasharray={l.dashed ? '5 4' : undefined} dot={{ r: 3.5, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 5 }} connectNulls />)}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

export function Bars({ data, xKey = 'x', dataKey = 'v', color = '#2a80d2', height = 160, unit = '' }: { data: Record<string, number | string>[]; xKey?: string; dataKey?: string; color?: string; height?: number; unit?: string }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} width={34} />
          <Tooltip cursor={{ fill: 'rgba(42,128,210,.06)' }} contentStyle={{ borderRadius: 12, border: '1px solid #e1e9f2', fontSize: 12 }} formatter={(v) => `${v}${unit}`} />
          <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function Sparkline({ values, color = '#14a3a8', height = 36, width = 96 }: { values: number[]; color?: string; height?: number; width?: number }) {
  if (values.length < 2) return null
  const min = Math.min(...values), max = Math.max(...values)
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - 4 - ((v - min) / (max - min || 1)) * (height - 8)}`).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
