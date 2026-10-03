import type { RepResult } from '../../../types'

/**
 * Hysteresis rep counter. A repetition starts when the signal rises above `low`,
 * counts only if it reaches `high`, and ends when it returns below `low`.
 */
export class RepCounter {
  reps: RepResult[] = []
  partial = 0
  private active = false
  private reached = false
  private startT = 0
  private peakT = 0
  private peak = -Infinity
  private min = Infinity

  private low: number
  private high: number
  private minDurationMs: number

  constructor(low: number, high: number, minDurationMs = 500) {
    this.low = low
    this.high = high
    this.minDurationMs = minDurationMs
  }

  get inRep() { return this.active }

  push(value: number, tMs: number) {
    if (!Number.isFinite(value)) return
    if (!this.active) {
      if (value > this.low) {
        this.active = true
        this.reached = false
        this.startT = tMs
        this.peak = value
        this.peakT = tMs
        this.min = value
      }
      return
    }
    if (value > this.peak) { this.peak = value; this.peakT = tMs }
    if (value < this.min) this.min = value
    if (value >= this.high) this.reached = true
    if (value <= this.low) {
      const dur = tMs - this.startT
      if (this.reached && dur >= this.minDurationMs) {
        this.reps.push({
          n: this.reps.length + 1,
          peak: this.peak,
          min: this.min,
          durationMs: dur,
          upMs: this.peakT - this.startT,
          downMs: tMs - this.peakT,
          startMs: this.startT,
        })
      } else if (dur >= this.minDurationMs) {
        this.partial++
      }
      this.active = false
    }
  }
}
