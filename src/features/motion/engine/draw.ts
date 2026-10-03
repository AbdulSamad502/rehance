import { jointAngle, jointLandmarks, type AngleMode } from './angles'
import { BONES, type JointId, type Pose, type Side } from './types'

export interface Focus { joint: JointId; side: Side; mode?: AngleMode }

export interface DrawOpts {
  mirror: boolean
  focus?: Focus[]
  tint?: string
  dim?: boolean
}

const TEAL = '#35e0cf'
const AMBER = '#ffc247'

function pill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number) {
  ctx.font = `700 ${size}px Inter, system-ui, sans-serif`
  const w = ctx.measureText(text).width + size
  const h = size * 1.6
  ctx.fillStyle = 'rgba(15,34,54,.82)'
  ctx.beginPath()
  ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(53,224,207,.9)'
  ctx.lineWidth = Math.max(1.5, size / 10)
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y + 1)
}

export function drawPose(ctx: CanvasRenderingContext2D, pose: Pose | null, w: number, h: number, o: DrawOpts) {
  ctx.clearRect(0, 0, w, h)
  if (!pose) return
  const X = (x: number) => (o.mirror ? 1 - x : x) * w
  const Y = (y: number) => y * h
  const s = Math.max(w, h) / 640
  const color = o.tint ?? TEAL

  ctx.lineCap = 'round'
  // bones with soft glow
  ctx.shadowColor = color
  ctx.shadowBlur = 10 * s
  for (const [a, b] of BONES) {
    const pa = pose.lm[a], pb = pose.lm[b]
    const vis = Math.min(pa.v, pb.v)
    if (vis < 0.35) continue
    ctx.strokeStyle = vis > 0.6 ? color : AMBER
    ctx.globalAlpha = o.dim ? 0.5 : 0.95
    ctx.lineWidth = 4 * s
    ctx.beginPath()
    ctx.moveTo(X(pa.x), Y(pa.y))
    ctx.lineTo(X(pb.x), Y(pb.y))
    ctx.stroke()
  }
  ctx.shadowBlur = 0
  ctx.globalAlpha = 1
  // joints
  for (const i of [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) {
    const p = pose.lm[i]
    if (p.v < 0.35) continue
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(X(p.x), Y(p.y), (i === 0 ? 5 : 5.5) * s, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = p.v > 0.6 ? color : AMBER
    ctx.lineWidth = 2.5 * s
    ctx.stroke()
  }
  // focus joint arcs with live angle
  for (const f of o.focus ?? []) {
    if (f.joint === 'trunk') continue // trunk lean has no 3-point arc
    const [ia, ib, ic] = jointLandmarks(f.joint, f.side)
    const A = pose.lm[ia], B = pose.lm[ib], C = pose.lm[ic]
    if (Math.min(A.v, B.v, C.v) < 0.4) continue
    const bx = X(B.x), by = Y(B.y)
    const a1 = Math.atan2(Y(A.y) - by, X(A.x) - bx)
    const a2 = Math.atan2(Y(C.y) - by, X(C.x) - bx)
    let d = a2 - a1
    while (d > Math.PI) d -= 2 * Math.PI
    while (d < -Math.PI) d += 2 * Math.PI
    const r = 34 * s
    ctx.fillStyle = 'rgba(53,224,207,.28)'
    ctx.strokeStyle = color
    ctx.lineWidth = 3 * s
    ctx.beginPath()
    ctx.moveTo(bx, by)
    ctx.arc(bx, by, r, a1, a1 + d, d < 0)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    const deg = Math.round(jointAngle(pose, f.joint, f.side, f.mode ?? '3d', w, h))
    const mid = a1 + d / 2
    pill(ctx, `${deg}°`, bx + Math.cos(mid) * (r + 30 * s), by + Math.sin(mid) * (r + 30 * s), 15 * s)
  }
}
