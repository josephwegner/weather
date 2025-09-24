import { describe, it, expect, beforeEach, vi } from 'vitest'
import { cacheService } from '../../services/cacheService'
import type { CurrentWeather, HourlyForecast, DailyForecast, Location } from '../../types/weather'
import { TEST_LOCATIONS, TEST_WEATHER_DATA } from '../constants'

describe('Cache Service', () => {
  const testLocation: Location = TEST_LOCATIONS.CHICAGO

  const testWeather: CurrentWeather = TEST_WEATHER_DATA.CURRENT

  const testForecast: HourlyForecast[] = [TEST_WEATHER_DATA.HOURLY_SAMPLE]
  const testDailyForecast: DailyForecast[] = [TEST_WEATHER_DATA.DAILY_SAMPLE]

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
      const otherLocation: Location = TEST_LOCATIONS.NEW_YORK

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

  describe('Daily Forecast Cache', () => {
    it('stores and retrieves daily forecast', () => {
      cacheService.setDailyForecast(testLocation, testDailyForecast)
      const retrieved = cacheService.getDailyForecast(testLocation)

      expect(retrieved).toEqual(testDailyForecast)
    })

    it('returns null for non-existent location', () => {
      const otherLocation: Location = TEST_LOCATIONS.NEW_YORK

      const retrieved = cacheService.getDailyForecast(otherLocation)
      expect(retrieved).toBeNull()
    })
  })

  describe('Hourly Forecast by Date Cache', () => {
    const testDate = '2022-01-01'

    it('stores and retrieves hourly forecast for specific date', () => {
      cacheService.setHourlyForecastForDay(testLocation, testDate, testForecast)
      const retrieved = cacheService.getHourlyForecastForDay(testLocation, testDate)

      expect(retrieved).toEqual(testForecast)
    })

    it('returns null for non-existent date', () => {
      const retrieved = cacheService.getHourlyForecastForDay(testLocation, '2022-01-02')
      expect(retrieved).toBeNull()
    })
  })

  describe('Cache Management', () => {
    it('clears all cache data', () => {
      cacheService.setCurrentWeather(testLocation, testWeather)
      cacheService.setDailyForecast(testLocation, testDailyForecast)
      cacheService.setHourlyForecastForDay(testLocation, '2022-01-01', testForecast)

      cacheService.clear()

      expect(cacheService.getCurrentWeather(testLocation)).toBeNull()
      expect(cacheService.getDailyForecast(testLocation)).toBeNull()
      expect(cacheService.getHourlyForecastForDay(testLocation, '2022-01-01')).toBeNull()
    })

    it('provides cache statistics', () => {
      cacheService.setCurrentWeather(testLocation, testWeather)
      cacheService.setDailyForecast(testLocation, testDailyForecast)
      cacheService.setHourlyForecastForDay(testLocation, '2022-01-01', testForecast)

      const stats = cacheService.getCacheStats()

      expect(stats.currentWeather.total).toBe(1)
      expect(stats.currentWeather.fresh).toBe(1)
      expect(stats.dailyForecast.total).toBe(1)
      expect(stats.dailyForecast.fresh).toBe(1)
      expect(stats.hourlyForecastByDate.total).toBe(1)
      expect(stats.hourlyForecastByDate.fresh).toBe(1)
    })
  })
})