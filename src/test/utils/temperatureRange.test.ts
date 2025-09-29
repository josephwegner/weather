import { describe, it, expect } from 'vitest'
import { calculateTemperatureRangePositions } from '../../utils/temperatureRange'
import type { DailyForecast } from '../../types/weather'

describe('Temperature Range Utilities', () => {
  const sampleDailyForecasts: DailyForecast[] = [
    {
      date: '2022-01-01',
      timestamp: 1641038400,
      temperatureHigh: 75,
      temperatureLow: 55,
      precipitationProbability: 20,
      precipitationIntensity: 0,
      windSpeed: 10,
      windDirection: 180,
      humidity: 60,
      uvIndex: 5,
      description: 'sunny',
      icon: '01d'
    },
    {
      date: '2022-01-02',
      timestamp: 1641124800,
      temperatureHigh: 82,
      temperatureLow: 62,
      precipitationProbability: 15,
      precipitationIntensity: 0,
      windSpeed: 8,
      windDirection: 200,
      humidity: 55,
      uvIndex: 6,
      description: 'sunny',
      icon: '01d'
    },
    {
      date: '2022-01-03',
      timestamp: 1641211200,
      temperatureHigh: 68,
      temperatureLow: 48,
      precipitationProbability: 40,
      precipitationIntensity: 0.1,
      windSpeed: 12,
      windDirection: 150,
      humidity: 75,
      uvIndex: 3,
      description: 'cloudy',
      icon: '04d'
    }
  ]

  describe('calculateTemperatureRangePositions', () => {
    it('calculates relative positions correctly across multiple days', () => {
      const result = calculateTemperatureRangePositions(sampleDailyForecasts)

      // Global temp range: 48-82 (34 degree span)
      // Day 1: 55-75, Low: (55-48)/34 ≈ 0.206, High: (75-48)/34 ≈ 0.794
      // Day 2: 62-82, Low: (62-48)/34 ≈ 0.412, High: (82-48)/34 = 1.0
      // Day 3: 48-68, Low: (48-48)/34 = 0.0, High: (68-48)/34 ≈ 0.588

      expect(result['2022-01-01'].lowPosition).toBeCloseTo(0.206, 2)
      expect(result['2022-01-01'].highPosition).toBeCloseTo(0.794, 2)
      expect(result['2022-01-01'].rangeWidth).toBeCloseTo(0.588, 2) // (75-55)/34

      expect(result['2022-01-02'].lowPosition).toBeCloseTo(0.412, 2)
      expect(result['2022-01-02'].highPosition).toBeCloseTo(1.0, 2)
      expect(result['2022-01-02'].rangeWidth).toBeCloseTo(0.588, 2) // (82-62)/34

      expect(result['2022-01-03'].lowPosition).toBeCloseTo(0.0, 2)
      expect(result['2022-01-03'].highPosition).toBeCloseTo(0.588, 2)
      expect(result['2022-01-03'].rangeWidth).toBeCloseTo(0.588, 2) // (68-48)/34
    })

    it('handles equal temperatures across all days', () => {
      const equalTempForecasts: DailyForecast[] = [
        { ...sampleDailyForecasts[0], temperatureHigh: 60, temperatureLow: 60 },
        { ...sampleDailyForecasts[1], temperatureHigh: 60, temperatureLow: 60 },
        { ...sampleDailyForecasts[2], temperatureHigh: 60, temperatureLow: 60 }
      ]

      const result = calculateTemperatureRangePositions(equalTempForecasts)

      // When all temps are equal (both high/low and across all days), range should be 0
      Object.values(result).forEach((range) => {
        expect(range.lowPosition).toBe(0)
        expect(range.highPosition).toBe(0)
        expect(range.rangeWidth).toBe(0)
      })
    })

    it('handles single day forecast', () => {
      const singleDay = [sampleDailyForecasts[0]]
      const result = calculateTemperatureRangePositions(singleDay)

      // With only one day, positions should be 0 and 1 for the full range
      expect(result['2022-01-01'].lowPosition).toBe(0)
      expect(result['2022-01-01'].highPosition).toBe(1)
      expect(result['2022-01-01'].rangeWidth).toBe(1)
    })

    it('handles empty array', () => {
      const result = calculateTemperatureRangePositions([])
      expect(result).toEqual({})
    })

    it('handles days with same high and low temperature', () => {
      const sameTempDay: DailyForecast[] = [
        { ...sampleDailyForecasts[0], temperatureHigh: 65, temperatureLow: 65 },
        sampleDailyForecasts[1] // High: 82, Low: 62
      ]

      const result = calculateTemperatureRangePositions(sameTempDay)

      // Global range: 62-82 (20 degrees)
      // Day 1: 65-65, Position: (65-62)/20 = 3/20 = 0.15
      // Day with same high/low should have rangeWidth of 0
      expect(result['2022-01-01'].rangeWidth).toBe(0)
      expect(result['2022-01-01'].lowPosition).toBeCloseTo(0.15, 2) // (65-62)/(82-62)
      expect(result['2022-01-01'].highPosition).toBeCloseTo(0.15, 2)
    })

    it('provides minimum range width for visual representation', () => {
      const result = calculateTemperatureRangePositions(sampleDailyForecasts)

      // All ranges should have visual width for rounded container
      Object.values(result).forEach((range) => {
        expect(range.rangeWidth).toBeGreaterThan(0)
      })
    })

    it('calculates correct global temperature extremes', () => {
      const result = calculateTemperatureRangePositions(sampleDailyForecasts)

      // The calculation should use global min (48) and max (82)
      // Day with min temp (48) should have lowPosition = 0
      // Day with max temp (82) should have highPosition = 1
      expect(result['2022-01-03'].lowPosition).toBe(0) // 48 is global min
      expect(result['2022-01-02'].highPosition).toBe(1) // 82 is global max
    })
  })
})
