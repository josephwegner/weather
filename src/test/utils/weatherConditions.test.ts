import { describe, it, expect } from 'vitest'
import {
  getWeatherCondition,
  getWeatherColor,
  getWeatherCategory,
  getConditionLabel
} from '../../utils/weatherConditions'

describe('Weather Conditions Utility', () => {
  describe('getWeatherCategory', () => {
    it('maps icons2 values directly to categories', () => {
      expect(getWeatherCategory('clear-day')).toBe('clear-day')
      expect(getWeatherCategory('clear-night')).toBe('clear-night')
      expect(getWeatherCategory('partly-cloudy-day')).toBe('partly-cloudy-day')
      expect(getWeatherCategory('partly-cloudy-night')).toBe('partly-cloudy-night')
      expect(getWeatherCategory('cloudy')).toBe('cloudy')
      expect(getWeatherCategory('fog')).toBe('fog')
      expect(getWeatherCategory('wind')).toBe('wind')
      expect(getWeatherCategory('rain')).toBe('rain')
      expect(getWeatherCategory('showers-day')).toBe('showers-day')
      expect(getWeatherCategory('showers-night')).toBe('showers-night')
      expect(getWeatherCategory('snow')).toBe('snow')
      expect(getWeatherCategory('snow-showers-day')).toBe('snow-showers-day')
      expect(getWeatherCategory('snow-showers-night')).toBe('snow-showers-night')
      expect(getWeatherCategory('thunder-rain')).toBe('thunder-rain')
      expect(getWeatherCategory('thunder-showers-day')).toBe('thunder-showers-day')
      expect(getWeatherCategory('thunder-showers-night')).toBe('thunder-showers-night')
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
      expect(getWeatherColor('clear-day')).toBe('#ffd568')
      expect(getWeatherColor('clear-night')).toBe('#60a5fa')
      expect(getWeatherColor('partly-cloudy-day')).toBe('#94a3b8')
      expect(getWeatherColor('rain')).toBe('#1e40af')
      expect(getWeatherColor('showers-day')).toBe('#3b82f6')
      expect(getWeatherColor('thunder-rain')).toBe('#7c3aed')
      expect(getWeatherColor('thunder-showers-day')).toBe('#8b5cf6')
      expect(getWeatherColor('snow')).toBe('#e2e8f0')
      expect(getWeatherColor('snow-showers-day')).toBe('#cbd5e1')
    })

    it('returns cloudy color for unknown icons', () => {
      expect(getWeatherColor('unknown')).toBe('#475569')
    })

    it('handles null and undefined input gracefully', () => {
      expect(getWeatherColor(null as any)).toBe('#475569')
      expect(getWeatherColor(undefined as any)).toBe('#475569')
      expect(getWeatherColor('' as any)).toBe('#475569')
    })
  })

  describe('getWeatherCondition', () => {
    it('returns complete condition object for clear sky', () => {
      const condition = getWeatherCondition('clear-day')
      expect(condition.category).toBe('clear-day')
      expect(condition.color).toBe('#ffd568')
      expect(condition.iconClass).toBe('wi-day-sunny')
    })

    it('returns complete condition object for rain', () => {
      const condition = getWeatherCondition('rain')
      expect(condition.category).toBe('rain')
      expect(condition.color).toBe('#1e40af')
      expect(condition.iconClass).toBe('wi-rain')
    })

    it('returns complete condition object for showers-day', () => {
      const condition = getWeatherCondition('showers-day')
      expect(condition.category).toBe('showers-day')
      expect(condition.color).toBe('#3b82f6')
      expect(condition.iconClass).toBe('wi-day-showers')
    })

    it('returns complete condition object for thunder variants', () => {
      expect(getWeatherCondition('thunder-rain').iconClass).toBe('wi-thunderstorm')
      expect(getWeatherCondition('thunder-showers-day').iconClass).toBe('wi-day-thunderstorm')
      expect(getWeatherCondition('thunder-showers-night').iconClass).toBe(
        'wi-night-alt-thunderstorm'
      )
    })

    it('returns default condition for unknown icon', () => {
      const condition = getWeatherCondition('xyz')
      expect(condition.category).toBe('cloudy')
      expect(condition.color).toBe('#475569')
    })

    it('handles null and undefined input gracefully', () => {
      const nullCondition = getWeatherCondition(null as any)
      expect(nullCondition.category).toBe('cloudy')
      expect(nullCondition.color).toBe('#475569')

      const undefinedCondition = getWeatherCondition(undefined as any)
      expect(undefinedCondition.category).toBe('cloudy')
      expect(undefinedCondition.color).toBe('#475569')

      const emptyCondition = getWeatherCondition('')
      expect(emptyCondition.category).toBe('cloudy')
      expect(emptyCondition.color).toBe('#475569')
    })
  })

  describe('getConditionLabel', () => {
    it('translates single condition IDs', () => {
      expect(getConditionLabel('type_21', 'rain')).toBe('Rain')
      expect(getConditionLabel('type_43', 'clear-day')).toBe('Clear')
      expect(getConditionLabel('type_42', 'partly-cloudy-day')).toBe('Partially Cloudy')
    })

    it('translates multiple comma-separated condition IDs', () => {
      expect(getConditionLabel('type_21,type_41', 'rain')).toBe('Rain, Overcast')
    })

    it('returns empty string for empty/null input', () => {
      expect(getConditionLabel('', 'cloudy')).toBe('')
      expect(getConditionLabel(null as any, 'cloudy')).toBe('')
    })
  })
})
