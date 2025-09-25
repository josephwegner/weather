import { describe, it, expect } from 'vitest'
import {
  getWeatherCondition,
  getWeatherColor,
  getWeatherCategory
} from '../../utils/weatherConditions'

describe('Weather Conditions Utility', () => {
  describe('getWeatherCategory', () => {
    it('maps clear sky icons to clear category', () => {
      expect(getWeatherCategory('01d')).toBe('clear')
      expect(getWeatherCategory('01n')).toBe('clear')
    })

    it('maps cloud icons to cloudy category', () => {
      expect(getWeatherCategory('02d')).toBe('cloudy')
      expect(getWeatherCategory('02n')).toBe('cloudy')
      expect(getWeatherCategory('03d')).toBe('cloudy')
      expect(getWeatherCategory('03n')).toBe('cloudy')
      expect(getWeatherCategory('04d')).toBe('cloudy')
      expect(getWeatherCategory('04n')).toBe('cloudy')
      expect(getWeatherCategory('50d')).toBe('cloudy')
      expect(getWeatherCategory('50n')).toBe('cloudy')
    })

    it('maps rain icons to rain category', () => {
      expect(getWeatherCategory('09d')).toBe('rain')
      expect(getWeatherCategory('09n')).toBe('rain')
      expect(getWeatherCategory('10d')).toBe('rain')
      expect(getWeatherCategory('10n')).toBe('rain')
    })

    it('maps thunderstorm icons to storm category', () => {
      expect(getWeatherCategory('11d')).toBe('storm')
      expect(getWeatherCategory('11n')).toBe('storm')
    })

    it('maps snow icons to snow category', () => {
      expect(getWeatherCategory('13d')).toBe('snow')
      expect(getWeatherCategory('13n')).toBe('snow')
    })

    it('defaults to cloudy for unknown icons', () => {
      expect(getWeatherCategory('99x')).toBe('cloudy')
      expect(getWeatherCategory('')).toBe('cloudy')
      expect(getWeatherCategory('invalid')).toBe('cloudy')
    })

    it('handles null and undefined input gracefully', () => {
      expect(getWeatherCategory(null as any)).toBe('cloudy')
      expect(getWeatherCategory(undefined as any)).toBe('cloudy')
      expect(getWeatherCategory(123 as any)).toBe('cloudy')
    })
  })

  describe('getWeatherColor', () => {
    it('returns correct colors for each category', () => {
      expect(getWeatherColor('01d')).toBe('#f59e0b') // clear
      expect(getWeatherColor('02d')).toBe('#6b7280') // cloudy
      expect(getWeatherColor('09d')).toBe('#4a90e2') // rain
      expect(getWeatherColor('11d')).toBe('#8b5cf6') // storm
      expect(getWeatherColor('13d')).toBe('#e2e8f0') // snow
    })

    it('returns cloudy color for unknown icons', () => {
      expect(getWeatherColor('unknown')).toBe('#6b7280')
    })

    it('handles null and undefined input gracefully', () => {
      expect(getWeatherColor(null as any)).toBe('#6b7280')
      expect(getWeatherColor(undefined as any)).toBe('#6b7280')
      expect(getWeatherColor('' as any)).toBe('#6b7280')
    })
  })

  describe('getWeatherCondition', () => {
    it('returns complete condition object for clear sky', () => {
      const condition = getWeatherCondition('01d')
      expect(condition.category).toBe('clear')
      expect(condition.color).toBe('#f59e0b')
    })

    it('returns complete condition object for rain', () => {
      const condition = getWeatherCondition('10n')
      expect(condition.category).toBe('rain')
      expect(condition.color).toBe('#4a90e2')
    })

    it('returns default condition for unknown icon', () => {
      const condition = getWeatherCondition('xyz')
      expect(condition.category).toBe('cloudy')
      expect(condition.color).toBe('#6b7280')
    })

    it('handles null and undefined input gracefully', () => {
      const nullCondition = getWeatherCondition(null as any)
      expect(nullCondition.category).toBe('cloudy')
      expect(nullCondition.color).toBe('#6b7280')

      const undefinedCondition = getWeatherCondition(undefined as any)
      expect(undefinedCondition.category).toBe('cloudy')
      expect(undefinedCondition.color).toBe('#6b7280')

      const emptyCondition = getWeatherCondition('')
      expect(emptyCondition.category).toBe('cloudy')
      expect(emptyCondition.color).toBe('#6b7280')
    })
  })
})
