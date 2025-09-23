import { describe, it, expect, beforeEach, vi } from 'vitest'
import { cacheService } from '../../services/cacheService'
import type { CurrentWeather, HourlyForecast, Location } from '../../types/weather'

describe('Cache Service', () => {
  const testLocation: Location = {
    lat: 41.8781,
    lng: -87.6298,
    name: 'Chicago, IL'
  }

  const testWeather: CurrentWeather = {
    temperature: 75,
    feelsLike: 78,
    humidity: 60,
    pressure: 1013,
    windSpeed: 10,
    windDirection: 180,
    visibility: 10,
    uvIndex: 3,
    description: 'partly cloudy',
    icon: '02d',
    timestamp: 1234567890
  }

  const testForecast: HourlyForecast[] = [
    {
      timestamp: 1234567890,
      temperature: 72,
      feelsLike: 75,
      humidity: 65,
      precipitationProbability: 20,
      precipitationIntensity: 0,
      windSpeed: 8,
      windDirection: 180,
      description: 'partly cloudy',
      icon: '02d'
    }
  ]

  beforeEach(() => {
    cacheService.clear()
  })

  describe('Current Weather Cache', () => {
    it('stores and retrieves current weather', () => {
      cacheService.setCurrentWeather(testLocation, testWeather)
      const retrieved = cacheService.getCurrentWeather(testLocation)

      expect(retrieved).toEqual(testWeather)
    })

    it('returns null for non-existent location', () => {
      const otherLocation: Location = {
        lat: 40.7128,
        lng: -74.0060,
        name: 'New York, NY'
      }

      const retrieved = cacheService.getCurrentWeather(otherLocation)
      expect(retrieved).toBeNull()
    })

    it('expires old entries', () => {
      // Mock Date.now to simulate time passing
      const originalNow = Date.now
      const mockNow = vi.fn()
      Date.now = mockNow

      mockNow.mockReturnValue(1000000)
      cacheService.setCurrentWeather(testLocation, testWeather)

      // Move time forward past expiration (10+ minutes)
      mockNow.mockReturnValue(1000000 + 11 * 60 * 1000)
      const retrieved = cacheService.getCurrentWeather(testLocation)

      expect(retrieved).toBeNull()

      // Restore original Date.now
      Date.now = originalNow
    })
  })

  describe('Hourly Forecast Cache', () => {
    it('stores and retrieves hourly forecast', () => {
      cacheService.setHourlyForecast(testLocation, testForecast)
      const retrieved = cacheService.getHourlyForecast(testLocation)

      expect(retrieved).toEqual(testForecast)
    })

    it('returns null for non-existent location', () => {
      const otherLocation: Location = {
        lat: 40.7128,
        lng: -74.0060,
        name: 'New York, NY'
      }

      const retrieved = cacheService.getHourlyForecast(otherLocation)
      expect(retrieved).toBeNull()
    })
  })

  describe('Cache Management', () => {
    it('clears all cache data', () => {
      cacheService.setCurrentWeather(testLocation, testWeather)
      cacheService.setHourlyForecast(testLocation, testForecast)

      cacheService.clear()

      expect(cacheService.getCurrentWeather(testLocation)).toBeNull()
      expect(cacheService.getHourlyForecast(testLocation)).toBeNull()
    })

    it('provides cache statistics', () => {
      cacheService.setCurrentWeather(testLocation, testWeather)
      cacheService.setHourlyForecast(testLocation, testForecast)

      const stats = cacheService.getCacheStats()

      expect(stats.currentWeather.total).toBe(1)
      expect(stats.currentWeather.fresh).toBe(1)
      expect(stats.hourlyForecast.total).toBe(1)
      expect(stats.hourlyForecast.fresh).toBe(1)
    })
  })
})