import type { TrendDelta } from './types'

export type MomentumState = 'accelerating' | 'decelerating' | 'stable' | 'reversing' | 'volatile'

export interface MomentumShiftResult {
  score: number
  warning?: string
}

export function calculateTrendVelocity(deltas: TrendDelta[]): number {
  if (deltas.length === 0) return 0

  const weightedSum = deltas.reduce((sum, delta) => {
    return sum + (delta.delta * delta.confidence)
  }, 0)

  return weightedSum / deltas.length
}

export function calculateTrendAcceleration(velocities: number[]): number {
  if (velocities.length < 2) return 0

  let accelerationSum = 0
  for (let i = 1; i < velocities.length; i++) {
    accelerationSum += velocities[i] - velocities[i - 1]
  }

  return accelerationSum / (velocities.length - 1)
}

export function classifyMomentumState(velocity: number, acceleration: number): MomentumState {
  const velocityMagnitude = Math.abs(velocity)
  const accelerationMagnitude = Math.abs(acceleration)

  // Volatility check (high velocity + high acceleration)
  if (velocityMagnitude > 0.2 && accelerationMagnitude > 0.15) {
    return 'volatile'
  }

  // Stable check (near-zero velocity and acceleration)
  if (velocityMagnitude < 0.05 && accelerationMagnitude < 0.01) {
    return 'stable'
  }

  // Reversing check (negative velocity with positive acceleration)
  if (velocity < 0 && acceleration > 0) {
    return 'reversing'
  }

  // Accelerating check (positive velocity with positive acceleration)
  if (velocity > 0 && acceleration > 0) {
    return 'accelerating'
  }

  // Decelerating check (positive velocity with negative acceleration)
  if (velocity > 0 && acceleration < 0) {
    return 'decelerating'
  }

  // Default to stable
  return 'stable'
}

export function scoreMomentumShift(previousState: MomentumState, currentState: MomentumState): MomentumShiftResult {
  let score = 0.5
  let warning: string | undefined

  // Positive transitions
  if (previousState === 'stable' && currentState === 'accelerating') {
    score = 0.7
  }

  // Reversal transitions (momentum shifts direction)
  if (previousState === 'accelerating' && currentState === 'reversing') {
    score = 0.3
    warning = 'Momentum reversal detected'
  }

  // Reversal from decelerating to reversing (risky)
  if (previousState === 'decelerating' && currentState === 'reversing') {
    score = 0.25
    warning = 'Momentum reversal from deceleration'
  }

  // Volatile states always warrant warning
  if (currentState === 'volatile') {
    score = Math.min(score, 0.55)
    warning = 'High volatility detected'
  }

  // Stable to stable (neutral)
  if (previousState === 'stable' && currentState === 'stable') {
    score = 0.5
  }

  // Accelerating to accelerating (positive continuation)
  if (previousState === 'accelerating' && currentState === 'accelerating') {
    score = 0.65
  }

  // Decelerating states (generally negative)
  if (currentState === 'decelerating') {
    score = Math.min(score, 0.4)
  }

  return {
    score,
    warning
  }
}
