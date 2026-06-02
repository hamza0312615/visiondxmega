import { describe, it, expect } from 'vitest'
import { calculateHours } from './src/pages/SleepAnalyzer.jsx'

describe('SleepAnalyzer calculateHours', () => {
  it('should calculate hours for same-day scenario correctly', () => {
    expect(calculateHours('08:00', '16:30')).toBe('8.5')
  })

  it('should calculate hours for cross-midnight scenario correctly', () => {
    expect(calculateHours('22:30', '06:30')).toBe('8.0')
    expect(calculateHours('23:00', '04:15')).toBe('5.3')
  })

  it('should calculate hours for exactly 24h/0h scenario correctly', () => {
    expect(calculateHours('22:00', '22:00')).toBe('0.0')
  })
})
