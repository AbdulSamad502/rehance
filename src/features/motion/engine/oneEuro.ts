// One-Euro filter (Casiez et al. 2012): low jitter when still, low lag when moving.

class LowPass {
  private y: number | null = null
  filter(x: number, alpha: number) {
    this.y = this.y === null ? x : alpha * x + (1 - alpha) * this.y
    return this.y
  }
  last() { return this.y }
}

const alphaFor = (cutoff: number, dt: number) => {
  const tau = 1 / (2 * Math.PI * cutoff)
  return 1 / (1 + tau / dt)
}

export class OneEuro {
  private x = new LowPass()
  private dx = new LowPass()
  private lastT: number | null = null
  private minCutoff: number
  private beta: number
  private dCutoff: number
  constructor(minCutoff = 1.4, beta = 0.03, dCutoff = 1) {
    this.minCutoff = minCutoff
    this.beta = beta
    this.dCutoff = dCutoff
  }

  filter(value: number, tSec: number) {
    if (this.lastT === null) {
      this.lastT = tSec
      this.x.filter(value, 1)
      this.dx.filter(0, 1)
      return value
    }
    const dt = Math.max(tSec - this.lastT, 1e-3)
    this.lastT = tSec
    const prev = this.x.last() ?? value
    const rate = (value - prev) / dt
    const edx = this.dx.filter(rate, alphaFor(this.dCutoff, dt))
    const cutoff = this.minCutoff + this.beta * Math.abs(edx)
    return this.x.filter(value, alphaFor(cutoff, dt))
  }
}

/** Smooths every coordinate of a 33-point pose. */
export class PoseSmoother {
  private f: OneEuro[] = []
  private fw: OneEuro[] = []
  constructor() {
    for (let i = 0; i < 33 * 3; i++) {
      this.f.push(new OneEuro())
      this.fw.push(new OneEuro(1.2, 0.02))
    }
  }
  apply<T extends { lm: { x: number; y: number; z: number; v: number }[]; world: { x: number; y: number; z: number; v: number }[]; t: number }>(p: T): T {
    const ts = p.t / 1000
    const lm = p.lm.map((q, i) => ({
      x: this.f[i * 3].filter(q.x, ts),
      y: this.f[i * 3 + 1].filter(q.y, ts),
      z: this.f[i * 3 + 2].filter(q.z, ts),
      v: q.v,
    }))
    const world = p.world.map((q, i) => ({
      x: this.fw[i * 3].filter(q.x, ts),
      y: this.fw[i * 3 + 1].filter(q.y, ts),
      z: this.fw[i * 3 + 2].filter(q.z, ts),
      v: q.v,
    }))
    return { ...p, lm, world }
  }
}
