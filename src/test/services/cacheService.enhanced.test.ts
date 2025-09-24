import { describe, it, expect, beforeEach, vi } from 'vitest'
import { cacheService } from '../../services/cacheService'
import type { DailyForecast, HourlyForecast } from '../../types/weather'
import { TEST_LOCATIONS } from '../constants'

describe('Enhanced Cache Service - Daily and Date-based Hourly', () => {
  beforeEach(() => {
    cacheService.clear()
  })

  describe('Daily Forecast Cache', () => {
    const testDailyForecast: DailyForecast[] = [
      {
        date: '2022-01-01',
        timestamp: 1640995200,
        temperatureHigh: 80,
        temperatureLow: 60,
        precipitationProbability: 20,
        precipitationIntensity: 0,
        windSpeed: 12,
        windDirection: 200,
        humidity: 65,
        uvIndex: 6,
        description: 'cloudy',
        icon: '04d'
      },
      {
        date: '2022-01-02',
        timestamp: 1641081600,
        temperatureHigh: 75,
        temperatureLow: 55,
        precipitationProbability: 10,
        precipitationIntensity: 0,
        windSpeed: 8,
        windDirection: 180,
        humidity: 60,
        uvIndex: 5,
        description: 'sunny',
        icon: '01d'
      }
    ]

    it('stores and retrieves daily forecast', () => {
      cacheService.setDailyForecast(TEST_LOCATIONS.CHICAGO, testDailyForecast)
      const retrieved = cacheService.getDailyForecast(TEST_LOCATIONS.CHICAGO)

      expect(retrieved).toEqual(testDailyForecast)
    })

    it('returns null for non-existent location', () => {
      const retrieved = cacheService.getDailyForecast(TEST_LOCATIONS.NEW_YORK)
      expect(retrieved).toBeNull()
    })

    it('expires old daily forecast entries', () => {
      const originalNow = Date.now
      const mockNow = vi.fn()
      Date.now = mockNow

      mockNow.mockReturnValue(1000000)
      cacheService.setDailyForecast(TEST_LOCATIONS.CHICAGO, testDailyForecast)

      // Move time forward past expiration (10+ minutes)
      mockNow.mockReturnValue(1000000 + 11 * 60 * 1000)
      const retrieved = cacheService.getDailyForecast(TEST_LOCATIONS.CHICAGO)

      expect(retrieved).toBeNull()

      Date.now = originalNow
    })
  })

  describe('Hourly Forecast by Date Cache', () => {
    const testDate = '2022-01-02'
    const testHourlyForecast: HourlyForecast[] = Array.from({ length: 24 }, (_, i) => ({
      timestamp: 1641081600 + i * 3600, // Jan 2, hourly
      temperature: 70 + i,
      feelsLike: 72 + i,
      humidity: 65,
      precipitationProbability: 10,
      precipitationIntensity: 0,
      windSpeed: 10,
      windDirection: 180,
      description: 'sunny',
      icon: '01d'
    }))

    it('stores and retrieves hourly forecast for specific date', () => {
      cacheService.setHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, testDate, testHourlyForecast)
      const retrieved = cacheService.getHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, testDate)

      expect(retrieved).toEqual(testHourlyForecast)
    })

    it('returns null for non-existent location and date combination', () => {
      cacheService.setHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, testDate, testHourlyForecast)

      // Different location
      expect(cacheService.getHourlyForecastForDay(TEST_LOCATIONS.NEW_YORK, testDate)).toBeNull()

      // Different date
      expect(cacheService.getHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, '2022-01-03')).toBeNull()
    })

    it('can store multiple dates for same location', () => {
      const date1 = '2022-01-01'
      const date2 = '2022-01-02'
      const forecast1 = testHourlyForecast.slice(0, 12)
      const forecast2 = testHourlyForecast.slice(12, 24)

      cacheService.setHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, date1, forecast1)
      cacheService.setHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, date2, forecast2)

      expect(cacheService.getHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, date1)).toEqual(forecast1)
      expect(cacheService.getHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, date2)).toEqual(forecast2)
    })

    it('can store same date for multiple locations', () => {
      const chicagoForecast = testHourlyForecast.slice(0, 12)
      const nyForecast = testHourlyForecast.slice(12, 24)

      cacheService.setHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, testDate, chicagoForecast)
      cacheService.setHourlyForecastForDay(TEST_LOCATIONS.NEW_YORK, testDate, nyForecast)

      expect(cacheService.getHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, testDate)).toEqual(chicagoForecast)
      expect(cacheService.getHourlyForecastForDay(TEST_LOCATIONS.NEW_YORK, testDate)).toEqual(nyForecast)
    })

    it('expires old hourly forecast entries by date', () => {
      const originalNow = Date.now
      const mockNow = vi.fn()
      Date.now = mockNow

      mockNow.mockReturnValue(1000000)
      cacheService.setHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, testDate, testHourlyForecast)

      // Move time forward past expiration
      mockNow.mockReturnValue(1000000 + 11 * 60 * 1000)
      const retrieved = cacheService.getHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, testDate)

      expect(retrieved).toBeNull()

      Date.now = originalNow
    })
  })

  describe('Enhanced Cache Statistics', () => {
    it('includes daily forecast and date-based hourly forecast stats', () => {
      const dailyForecast: DailyForecast[] = [{
        date: '2022-01-01',
        timestamp: 1640995200,
        temperatureHigh: 80,
        temperatureLow: 60,
        precipitationProbability: 20,
        precipitationIntensity: 0,
        windSpeed: 12,
        windDirection: 200,
        humidity: 65,
        uvIndex: 6,
        description: 'cloudy',
        icon: '04d'
      }]

      const hourlyForecast: HourlyForecast[] = Array.from({ length: 24 }, (_, i) => ({
        timestamp: 1641081600 + i * 3600,
        temperature: 70,
        feelsLike: 72,
        humidity: 65,
        precipitationProbability: 10,
        precipitationIntensity: 0,
        windSpeed: 10,
        windDirection: 180,
        description: 'sunny',
        icon: '01d'
      }))

      cacheService.setDailyForecast(TEST_LOCATIONS.CHICAGO, dailyForecast)
      cacheService.setHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, '2022-01-01', hourlyForecast)
      cacheService.setHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, '2022-01-02', hourlyForecast)

      const stats = cacheService.getCacheStats()

      expect(stats.dailyForecast.total).toBe(1)
      expect(stats.dailyForecast.fresh).toBe(1)
      expect(stats.hourlyForecastByDate.total).toBe(2) // Two dates cached
      expect(stats.hourlyForecastByDate.fresh).toBe(2)
    })
  })

  describe('Cache Clearing', () => {
    it('clears all cache data including new date-based caches', () => {
      const dailyForecast: DailyForecast[] = [{
        date: '2022-01-01',
        timestamp: 1640995200,
        temperatureHigh: 80,
        temperatureLow: 60,
        precipitationProbability: 20,
        precipitationIntensity: 0,
        windSpeed: 12,
        windDirection: 200,
        humidity: 65,
        uvIndex: 6,
        description: 'cloudy',
        icon: '04d'
      }]

      const hourlyForecast: HourlyForecast[] = Array.from({ length: 24 }, () => ({
        timestamp: 1641081600,
        temperature: 70,
        feelsLike: 72,
        humidity: 65,
        precipitationProbability: 10,
        precipitationIntensity: 0,
        windSpeed: 10,
        windDirection: 180,
        description: 'sunny',
        icon: '01d'
      }))

      cacheService.setDailyForecast(TEST_LOCATIONS.CHICAGO, dailyForecast)
      cacheService.setHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, '2022-01-01', hourlyForecast)

      cacheService.clear()

      expect(cacheService.getDailyForecast(TEST_LOCATIONS.CHICAGO)).toBeNull()
      expect(cacheService.getHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, '2022-01-01')).toBeNull()
    })
  })
})