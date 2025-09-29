import { describe, it, expect } from 'vitest'
import {
  getWeatherCondition,
  getWeatherColor,
  getWeatherCategory
} from '../../utils/weatherConditions'

describe('Weather Conditions Utility', () => {
  describe('getWeatherCategory', () => {
    it('maps clear sky icons to appropriate categories', () => {
      expect(getWeatherCategory('01d')).toBe('clear-day')
      expect(getWeatherCategory('01n')).toBe('clear-night')
    })

    it('maps cloud icons to appropriate categories', () => {
      expect(getWeatherCategory('02d')).toBe('few-clouds')
      expect(getWeatherCategory('02n')).toBe('few-clouds')
      expect(getWeatherCategory('03d')).toBe('scattered-clouds')
      expect(getWeatherCategory('03n')).toBe('scattered-clouds')
      expect(getWeatherCategory('04d')).toBe('broken-clouds')
      expect(getWeatherCategory('04n')).toBe('broken-clouds')
      expect(getWeatherCategory('50d')).toBe('mist')
      expect(getWeatherCategory('50n')).toBe('mist')
    })

    it('maps rain icons to appropriate categories', () => {
      expect(getWeatherCategory('09d')).toBe('light-rain')
      expect(getWeatherCategory('09n')).toBe('light-rain')
      expect(getWeatherCategory('10d')).toBe('heavy-rain')
      expect(getWeatherCategory('10n')).toBe('heavy-rain')
    })

    it('maps thunderstorm icons to thunderstorm category', () => {
      expect(getWeatherCategory('11d')).toBe('thunderstorm')
      expect(getWeatherCategory('11n')).toBe('thunderstorm')
    })

    it('maps snow icons to snow category', () => {
      expect(getWeatherCategory('13d')).toBe('snow')
      expect(getWeatherCategory('13n')).toBe('snow')
    })

    it('defaults to overcast-clouds for unknown icons', () => {
      expect(getWeatherCategory('99x')).toBe('overcast-clouds')
      expect(getWeatherCategory('')).toBe('overcast-clouds')
      expect(getWeatherCategory('invalid')).toBe('overcast-clouds')
    })

    it('handles null and undefined input gracefully', () => {
      expect(getWeatherCategory(null as any)).toBe('overcast-clouds')
      expect(getWeatherCategory(undefined as any)).toBe('overcast-clouds')
      expect(getWeatherCategory(123 as any)).toBe('overcast-clouds')
    })
  })

  describe('getWeatherColor', () => {
    it('returns correct colors for each category', () => {
      expect(getWeatherColor('01d')).toBe('#ffd568') // clear-day
      expect(getWeatherColor('01n')).toBe('#60a5fa') // clear-night
      expect(getWeatherColor('02d')).toBe('#94a3b8') // few-clouds
      expect(getWeatherColor('09d')).toBe('#3b82f6') // light-rain
      expect(getWeatherColor('10d')).toBe('#1e40af') // heavy-rain
      expect(getWeatherColor('11d')).toBe('#8b5cf6') // thunderstorm
      expect(getWeatherColor('13d')).toBe('#e2e8f0') // snow
    })

    it('returns overcast-clouds color for unknown icons', () => {
      expect(getWeatherColor('unknown')).toBe('#334155')
    })

    it('handles null and undefined input gracefully', () => {
      expect(getWeatherColor(null as any)).toBe('#334155')
      expect(getWeatherColor(undefined as any)).toBe('#334155')
      expect(getWeatherColor('' as any)).toBe('#334155')
    })
  })

  describe('getWeatherCondition', () => {
    it('returns complete condition object for clear sky', () => {
      const condition = getWeatherCondition('01d')
      expect(condition.category).toBe('clear-day')
      expect(condition.color).toBe('#ffd568')
    })

    it('returns complete condition object for rain', () => {
      const condition = getWeatherCondition('10n')
      expect(condition.category).toBe('heavy-rain')
      expect(condition.color).toBe('#1e40af')
    })

    it('returns default condition for unknown icon', () => {
      const condition = getWeatherCondition('xyz')
      expect(condition.category).toBe('overcast-clouds')
      expect(condition.color).toBe('#334155')
    })

    it('handles null and undefined input gracefully', () => {
      const nullCondition = getWeatherCondition(null as any)
      expect(nullCondition.category).toBe('overcast-clouds')
      expect(nullCondition.color).toBe('#334155')

      const undefinedCondition = getWeatherCondition(undefined as any)
      expect(undefinedCondition.category).toBe('overcast-clouds')
      expect(undefinedCondition.color).toBe('#334155')

      const emptyCondition = getWeatherCondition('')
      expect(emptyCondition.category).toBe('overcast-clouds')
      expect(emptyCondition.color).toBe('#334155')
    })
  })
})
