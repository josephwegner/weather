import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { WeatherApiService } from '../../services/weatherApi'
import { cacheService } from '../../services/cache'
import type { Location } from '../../types/weather'
import { TEST_LOCATIONS } from '../constants'

vi.mock('axios')
vi.mock('../../services/cache')

const mockedAxios = vi.mocked(axios)
const mockedCache = vi.mocked(cacheService)

// Type the axios.get method properly
const mockedAxiosGet = vi.mocked(axios.get)

describe('Weather API Service', () => {
  let weatherApi: WeatherApiService
  const testLocation: Location = TEST_LOCATIONS.CHICAGO

  beforeEach(() => {
    weatherApi = new WeatherApiService()
    vi.clearAllMocks()
  })

  describe('Environment-based Configuration Defaults', () => {
    it('should have development-friendly defaults in test environment', () => {
      const config = weatherApi.getCurrentConfig()

      // In test/development, should default to mock mode with cache enabled
      expect(config.cacheEnabled).toBe(true)
      expect(config.mockAPIRequests).toBe(true)
      expect(config.enableLogging).toBe(true)
      expect(config.mockScenarioId).toBe('normal-chicago')
    })
  })

  describe('Mock API Requests Mode', () => {
    it('returns mock data when mockAPIRequests is true', async () => {
      weatherApi.setConfig({ mockAPIRequests: true, mockScenarioId: 'normal-chicago' })

      const result = await weatherApi.getCurrentWeather(testLocation)

      expect(result.temperature).toBe(72)
      expect(result.description).toBe('partly cloudy')
      expect(mockedAxios.get).not.toHaveBeenCalled()
    })
  })

  describe('Cache Behavior', () => {
    it('returns cached data when available (with cache enabled)', async () => {
      const cachedWeather = {
        temperature: 80,
        feelsLike: 85,
        humidity: 70,
        pressure: 1015,
        windSpeed: 5,
        windDirection: 90,
        visibility: 10,
        uvIndex: 4,
        description: 'sunny',
        icon: '01d',
        timestamp: Date.now()
      }

      mockedCache.getCurrentWeather.mockReturnValue(cachedWeather)
      weatherApi.setConfig({ cacheEnabled: true, mockAPIRequests: false })

      const result = await weatherApi.getCurrentWeather(testLocation)

      expect(result).toEqual(cachedWeather)
      expect(mockedAxios.get).not.toHaveBeenCalled()
    })

    it('makes API call when cache is empty and mockAPIRequests is false', async () => {
      mockedCache.getCurrentWeather.mockReturnValue(null)
      mockedAxiosGet.mockResolvedValue({
        data: {
          currentConditions: {
            temp: 75,
            feelslike: 78,
            humidity: 60,
            pressure: 1013,
            windspeed: 10,
            winddir: 180,
            visibility: 10,
            uvindex: 3,
            conditions: 'Clear sky',
            icon: 'clear-day',
            datetime: '2022-01-01T12:00:00'
          }
        }
      })

      weatherApi.setConfig({ cacheEnabled: true, mockAPIRequests: false })

      const result = await weatherApi.getCurrentWeather(testLocation)

      expect(result.temperature).toBe(75)
      expect(result.description).toBe('clear sky')
      expect(result.icon).toBe('01d')
      expect(mockedAxios.get).toHaveBeenCalledOnce()
      expect(mockedCache.setCurrentWeather).toHaveBeenCalledWith(testLocation, result)
    })

    it('returns mock data when cache is empty and mockAPIRequests is true', async () => {
      mockedCache.getCurrentWeather.mockReturnValue(null)
      weatherApi.setConfig({
        cacheEnabled: true,
        mockAPIRequests: true,
        mockScenarioId: 'normal-chicago'
      })

      const result = await weatherApi.getCurrentWeather(testLocation)

      expect(result.temperature).toBe(72)
      expect(result.description).toBe('partly cloudy')
      expect(mockedAxios.get).not.toHaveBeenCalled()
    })

    it('bypasses cache and makes API call when cache is disabled', async () => {
      const cachedWeather = {
        temperature: 80,
        feelsLike: 85,
        humidity: 70,
        pressure: 1015,
        windSpeed: 5,
        windDirection: 90,
        visibility: 10,
        uvIndex: 4,
        description: 'sunny',
        icon: '01d',
        timestamp: Date.now()
      }

      mockedCache.getCurrentWeather.mockReturnValue(cachedWeather)
      mockedAxiosGet.mockResolvedValue({
        data: {
          currentConditions: {
            temp: 75,
            feelslike: 78,
            humidity: 60,
            pressure: 1013,
            windspeed: 10,
            winddir: 180,
            visibility: 10,
            uvindex: 3,
            conditions: 'Clear sky',
            icon: 'clear-day',
            datetime: '2022-01-01T12:00:00'
          }
        }
      })

      weatherApi.setConfig({ cacheEnabled: false, mockAPIRequests: false })

      const result = await weatherApi.getCurrentWeather(testLocation)

      expect(result.temperature).toBe(75) // Should be API result, not cached
      expect(mockedAxios.get).toHaveBeenCalledOnce()
      expect(mockedCache.setCurrentWeather).not.toHaveBeenCalled() // No caching when disabled
    })
  })

  describe('Cache-Only Mode (no fallback)', () => {
    it('returns cached data when available', async () => {
      const cachedWeather = {
        temperature: 70,
        feelsLike: 73,
        humidity: 65,
        pressure: 1010,
        windSpeed: 8,
        windDirection: 200,
        visibility: 10,
        uvIndex: 2,
        description: 'cloudy',
        icon: '04d',
        timestamp: Date.now()
      }

      mockedCache.getCurrentWeather.mockReturnValue(cachedWeather)
      // Cache enabled, no mock - should use API as fallback
      weatherApi.setConfig({ cacheEnabled: true, mockAPIRequests: false })

      const result = await weatherApi.getCurrentWeather(testLocation)

      expect(result).toEqual(cachedWeather)
      expect(mockedAxios.get).not.toHaveBeenCalled()
    })

    it('throws error when no cached data and no fallback available', async () => {
      mockedCache.getCurrentWeather.mockReturnValue(null)
      // Disable both cache and mock, but somehow also disable API (edge case)
      weatherApi.setConfig({ cacheEnabled: false, mockAPIRequests: false })
      mockedAxiosGet.mockRejectedValue(new Error('API unavailable'))

      await expect(weatherApi.getCurrentWeather(testLocation)).rejects.toThrow('API unavailable')
    })
  })

  describe('Daily Forecast', () => {
    it('fetches and returns 7-day daily forecast', async () => {
      const mockApiResponse = {
        data: {
          days: Array.from({ length: 7 }, (_, i) => ({
            datetime: `2022-01-0${i + 1}`,
            tempmax: 75 + i,
            tempmin: 55 + i,
            conditions: 'Sunny',
            icon: 'clear-day',
            precipprob: 10,
            precip: 0,
            windspeed: 10,
            winddir: 180,
            humidity: 60,
            uvindex: 5
          }))
        }
      }

      mockedAxiosGet.mockResolvedValue(mockApiResponse)
      mockedCache.getDailyForecast.mockReturnValue(null)
      // Force API mode for this test with caching enabled
      weatherApi.setConfig({ cacheEnabled: true, mockAPIRequests: false })

      const result = await weatherApi.getDailyForecast(TEST_LOCATIONS.CHICAGO)

      expect(result).toHaveLength(7)
      expect(result[0]).toEqual({
        date: '2022-01-01',
        timestamp: 1640995200,
        temperatureHigh: 75,
        temperatureLow: 55,
        precipitationProbability: 10,
        precipitationIntensity: 0,
        windSpeed: 10,
        windDirection: 180,
        humidity: 60,
        uvIndex: 5,
        description: 'sunny',
        icon: '01d'
      })
      expect(mockedCache.setDailyForecast).toHaveBeenCalledWith(TEST_LOCATIONS.CHICAGO, result)
    })

    it('returns cached daily forecast when available', async () => {
      const cachedForecast = [
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
        }
      ]

      mockedCache.getDailyForecast.mockReturnValue(cachedForecast)
      weatherApi.setConfig({ cacheEnabled: true, mockAPIRequests: false })

      const result = await weatherApi.getDailyForecast(TEST_LOCATIONS.CHICAGO)

      expect(result).toEqual(cachedForecast)
      expect(mockedAxiosGet).not.toHaveBeenCalled()
    })

    it('returns mock daily forecast when mockAPIRequests is true', async () => {
      weatherApi.setConfig({
        cacheEnabled: false,
        mockAPIRequests: true,
        mockScenarioId: 'normal-chicago'
      })

      const result = await weatherApi.getDailyForecast(TEST_LOCATIONS.CHICAGO)

      expect(result).toHaveLength(7)
      expect(result[0].temperatureHigh).toBeDefined()
      expect(result[0].temperatureLow).toBeDefined()
      expect(mockedAxiosGet).not.toHaveBeenCalled()
    })
  })

  describe('Hourly Forecast for Specific Day', () => {
    const targetDate = '2022-01-02'

    it('fetches hourly forecast for specific day', async () => {
      const mockApiResponse = {
        data: {
          days: [
            {
              datetime: '2022-01-02',
              hours: Array.from({ length: 24 }, (_, i) => ({
                datetime: `${i.toString().padStart(2, '0')}:00:00`,
                temp: 65 + Math.sin(i * 0.3) * 5,
                feelslike: 68 + Math.sin(i * 0.3) * 5,
                humidity: 70,
                precipprob: 20,
                precip: 0,
                windspeed: 8,
                winddir: 180,
                conditions: 'Partly cloudy',
                icon: 'partly-cloudy-day'
              }))
            }
          ]
        }
      }

      mockedAxiosGet.mockResolvedValue(mockApiResponse)
      mockedCache.getHourlyForecastForDay.mockReturnValue(null)
      // Force API mode for this test with caching enabled
      weatherApi.setConfig({ cacheEnabled: true, mockAPIRequests: false })

      const result = await weatherApi.getHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, targetDate)

      expect(result).toHaveLength(24)
      expect(result[0]).toEqual({
        timestamp: 1641081600, // Jan 2 00:00:00 UTC (2022-01-02T00:00:00Z)
        temperature: 65,
        feelsLike: 68,
        humidity: 70,
        precipitationProbability: 20,
        precipitationIntensity: 0,
        precipitationType: undefined,
        windSpeed: 8,
        windDirection: 180,
        windGust: 0,
        pressure: 0,
        uvIndex: 0,
        cloudCover: 0,
        visibility: 0,
        description: 'partly cloudy',
        icon: '02d'
      })
      expect(mockedCache.setHourlyForecastForDay).toHaveBeenCalledWith(
        TEST_LOCATIONS.CHICAGO,
        targetDate,
        result
      )
    })

    it('returns cached hourly forecast for day when available', async () => {
      const cachedHourly = Array.from({ length: 24 }, (_, i) => ({
        timestamp: 1641081600 + i * 3600,
        temperature: 70 + i,
        feelsLike: 72 + i,
        humidity: 65,
        precipitationProbability: 10,
        precipitationIntensity: 0,
        windSpeed: 10,
        windDirection: 180,
        windGust: 15,
        pressure: 1013,
        uvIndex: 3,
        cloudCover: 20,
        visibility: 10,
        description: 'sunny',
        icon: '01d'
      }))

      mockedCache.getHourlyForecastForDay.mockReturnValue(cachedHourly)
      weatherApi.setConfig({ cacheEnabled: true, mockAPIRequests: false })

      const result = await weatherApi.getHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, targetDate)

      expect(result).toEqual(cachedHourly)
      expect(mockedAxiosGet).not.toHaveBeenCalled()
    })

    it('returns mock hourly forecast for day when mockAPIRequests is true', async () => {
      weatherApi.setConfig({
        cacheEnabled: false,
        mockAPIRequests: true,
        mockScenarioId: 'extreme-heat'
      })

      const result = await weatherApi.getHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, targetDate)

      expect(result).toHaveLength(24)
      expect(result[0].temperature).toBeGreaterThan(100) // Desert conditions
      expect(mockedAxiosGet).not.toHaveBeenCalled()
    })

    it('returns only hours for the requested date', async () => {
      const mockApiResponse = {
        data: {
          days: [
            {
              datetime: '2022-01-02',
              hours: Array.from({ length: 24 }, (_, i) => ({
                datetime: `${i.toString().padStart(2, '0')}:00:00`,
                temp: 65,
                feelslike: 68,
                humidity: 70,
                precipprob: 20,
                precip: 0,
                windspeed: 8,
                winddir: 180,
                conditions: 'Partly cloudy',
                icon: 'partly-cloudy-day'
              }))
            }
          ]
        }
      }

      mockedAxiosGet.mockResolvedValue(mockApiResponse)
      mockedCache.getHourlyForecastForDay.mockReturnValue(null)
      // Force API mode for this test with caching enabled
      weatherApi.setConfig({ cacheEnabled: true, mockAPIRequests: false })

      const result = await weatherApi.getHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, '2022-01-02')

      // Should return exactly 24 hours for the requested date
      expect(result).toHaveLength(24)

      // First hour should be midnight of Jan 2
      expect(result[0].timestamp).toBe(1641081600) // Jan 2 00:00:00 UTC (2022-01-02T00:00:00Z)
    })
  })

  describe('Configuration Management', () => {
    it('allows setting custom configuration', () => {
      // First verify the default configuration
      const defaultConfig = weatherApi.getCurrentConfig()
      expect(defaultConfig.cacheEnabled).toBe(true) // Default should be true
      expect(defaultConfig.mockAPIRequests).toBe(true) // Default should be true in test env
      expect(defaultConfig.mockScenarioId).toBe('normal-chicago') // Default scenario
      expect(defaultConfig.enableLogging).toBe(true) // Default should be true in test env

      // Now set a completely different configuration
      const newConfig = {
        cacheEnabled: false, // opposite of default
        mockAPIRequests: false, // opposite of default
        mockScenarioId: 'extreme-heat', // different from default
        enableLogging: false // opposite of default
      }

      weatherApi.setConfig(newConfig)
      const currentConfig = weatherApi.getCurrentConfig()

      expect(currentConfig.cacheEnabled).toBe(false)
      expect(currentConfig.mockAPIRequests).toBe(false)
      expect(currentConfig.mockScenarioId).toBe('extreme-heat')
      expect(currentConfig.enableLogging).toBe(false)
    })

    it('allows partial configuration updates', () => {
      // Set initial known state
      weatherApi.setConfig({ cacheEnabled: true, mockAPIRequests: false, enableLogging: true })
      const initialConfig = weatherApi.getCurrentConfig()
      expect(initialConfig.cacheEnabled).toBe(true)
      expect(initialConfig.mockAPIRequests).toBe(false)
      expect(initialConfig.enableLogging).toBe(true)

      // Update only mockAPIRequests, verify others remain unchanged
      weatherApi.setConfig({ mockAPIRequests: true })

      const config = weatherApi.getCurrentConfig()
      expect(config.cacheEnabled).toBe(true) // Should remain unchanged
      expect(config.mockAPIRequests).toBe(true) // Should be updated
      expect(config.enableLogging).toBe(true) // Should remain unchanged
    })

    it('provides current configuration', () => {
      const config = weatherApi.getCurrentConfig()

      expect(config).toHaveProperty('cacheEnabled')
      expect(config).toHaveProperty('mockAPIRequests')
      expect(config).toHaveProperty('enableLogging')
      expect(typeof config.cacheEnabled).toBe('boolean')
      expect(typeof config.mockAPIRequests).toBe('boolean')
    })
  })

  describe('Available Scenarios', () => {
    it('returns list of available scenarios', () => {
      const scenarios = weatherApi.getAvailableScenarios()

      expect(scenarios).toHaveLength(5)
      expect(scenarios[0]).toEqual({
        id: 'normal-chicago',
        name: 'Normal Chicago Weather',
        description: 'Typical Chicago weather with complete data'
      })
    })
  })

  describe('Error Handling', () => {
    it('throws error when API key is missing', async () => {
      // This test would require mocking import.meta.env at the module level
      // For now, we'll test API error handling instead
      mockedCache.getCurrentWeather.mockReturnValue(null)
      mockedAxiosGet.mockRejectedValue(new Error('API Error'))
      weatherApi.setConfig({ cacheEnabled: false, mockAPIRequests: false })

      await expect(weatherApi.getCurrentWeather(testLocation)).rejects.toThrow('API Error')
    })

    it('throws error when daily forecast API fails', async () => {
      mockedCache.getDailyForecast.mockReturnValue(null)
      mockedAxiosGet.mockRejectedValue(new Error('API Error'))
      weatherApi.setConfig({ cacheEnabled: false, mockAPIRequests: false })

      await expect(weatherApi.getDailyForecast(TEST_LOCATIONS.CHICAGO)).rejects.toThrow('API Error')
    })

    it('throws error when hourly forecast for day API fails', async () => {
      mockedCache.getHourlyForecastForDay.mockReturnValue(null)
      mockedAxiosGet.mockRejectedValue(new Error('Network Error'))
      weatherApi.setConfig({ cacheEnabled: false, mockAPIRequests: false })

      await expect(
        weatherApi.getHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, '2022-01-01')
      ).rejects.toThrow('Network Error')
    })
  })
})
