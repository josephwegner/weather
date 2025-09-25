import { describe, it, expect } from 'vitest'
import { getMockScenario, mockScenarios } from '../../services/mockData'

describe('Mock Data Service', () => {
  it('returns all available scenarios', () => {
    expect(mockScenarios).toHaveLength(6)
    expect(mockScenarios[0].id).toBe('normal-chicago')
    expect(mockScenarios[1].id).toBe('extreme-heat')
    expect(mockScenarios[2].id).toBe('extreme-cold')
    expect(mockScenarios[3].id).toBe('hurricane')
    expect(mockScenarios[4].id).toBe('diverse-weather')
    expect(mockScenarios[5].id).toBe('missing-data')
  })

  it('gets specific scenario by ID', () => {
    const scenario = getMockScenario('extreme-heat')

    expect(scenario).toBeDefined()
    expect(scenario?.id).toBe('extreme-heat')
    expect(scenario?.name).toBe('Extreme Heat Wave')
    expect(scenario?.currentWeather.temperature).toBe(118)
    expect(scenario?.location.name).toBe('Las Vegas, NV')
  })

  it('returns null for non-existent scenario ID', () => {
    const scenario = getMockScenario('non-existent')
    expect(scenario).toBeNull()
  })

  describe('Scenario Data Integrity', () => {
    it('normal-chicago has complete data', () => {
      const scenario = getMockScenario('normal-chicago')!

      expect(scenario.currentWeather.temperature).toBeDefined()
      expect(scenario.currentWeather.description).toBeDefined()
      expect(scenario.hourlyForecast).toHaveLength(24)
      expect(scenario.location.name).toBe('Chicago, IL')
    })

    it('extreme-cold has sub-zero temperatures', () => {
      const scenario = getMockScenario('extreme-cold')!

      expect(scenario.currentWeather.temperature).toBeLessThan(0)
      expect(scenario.currentWeather.feelsLike).toBeLessThan(scenario.currentWeather.temperature)
      expect(scenario.location.name).toBe('Fairbanks, AK')
    })

    it('hurricane has extreme conditions', () => {
      const scenario = getMockScenario('hurricane')!

      expect(scenario.currentWeather.windSpeed).toBeGreaterThan(70)
      expect(scenario.currentWeather.pressure).toBeLessThan(1000)
      expect(scenario.hourlyForecast.every((hour) => hour.precipitationProbability === 100)).toBe(
        true
      )
    })

    it('missing-data has incomplete fields', () => {
      const scenario = getMockScenario('missing-data')!

      expect(scenario.currentWeather.pressure).toBe(0)
      expect(scenario.currentWeather.visibility).toBe(0)
      expect(scenario.currentWeather.icon).toBe('')
      expect(scenario.hourlyForecast.some((hour) => hour.description === '')).toBe(true)
    })
  })
})
