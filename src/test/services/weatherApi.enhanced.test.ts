import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { WeatherApiService } from '../../services/weatherApi'
import { cacheService } from '../../services/cacheService'
import { TEST_LOCATIONS } from '../constants'

vi.mock('axios')
vi.mock('../../services/cacheService')

const mockedAxios = vi.mocked(axios)
const mockedCache = vi.mocked(cacheService)

describe('Weather API Service - Enhanced Daily/Hourly', () => {
  let weatherApi: WeatherApiService

  beforeEach(() => {
    weatherApi = new WeatherApiService()
    vi.clearAllMocks()
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

      mockedAxios.get.mockResolvedValue(mockApiResponse)
      mockedCache.getDailyForecast.mockReturnValue(null)

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
      weatherApi.setDevMode({ mode: 'cache-first' })

      const result = await weatherApi.getDailyForecast(TEST_LOCATIONS.CHICAGO)

      expect(result).toEqual(cachedForecast)
      expect(mockedAxios.get).not.toHaveBeenCalled()
    })

    it('returns mock daily forecast in mock mode', async () => {
      weatherApi.setDevMode({ mode: 'mock', mockScenarioId: 'normal-chicago' })

      const result = await weatherApi.getDailyForecast(TEST_LOCATIONS.CHICAGO)

      expect(result).toHaveLength(7)
      expect(result[0].temperatureHigh).toBeDefined()
      expect(result[0].temperatureLow).toBeDefined()
      expect(mockedAxios.get).not.toHaveBeenCalled()
    })
  })

  describe('Hourly Forecast for Specific Day', () => {
    const targetDate = '2022-01-02'

    it('fetches hourly forecast for specific day', async () => {
      const mockApiResponse = {
        data: {
          days: [{
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
          }]
        }
      }

      mockedAxios.get.mockResolvedValue(mockApiResponse)
      mockedCache.getHourlyForecastForDay.mockReturnValue(null)

      const result = await weatherApi.getHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, targetDate)

      expect(result).toHaveLength(24)
      expect(result[0]).toEqual({
        timestamp: 1641103200, // Jan 2 00:00:00 (2022-01-02T00:00:00)
        temperature: 65,
        feelsLike: 68,
        humidity: 70,
        precipitationProbability: 20,
        precipitationIntensity: 0,
        windSpeed: 8,
        windDirection: 180,
        description: 'partly cloudy',
        icon: '02d'
      })
      expect(mockedCache.setHourlyForecastForDay).toHaveBeenCalledWith(TEST_LOCATIONS.CHICAGO, targetDate, result)
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
        description: 'sunny',
        icon: '01d'
      }))

      mockedCache.getHourlyForecastForDay.mockReturnValue(cachedHourly)
      weatherApi.setDevMode({ mode: 'cache-first' })

      const result = await weatherApi.getHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, targetDate)

      expect(result).toEqual(cachedHourly)
      expect(mockedAxios.get).not.toHaveBeenCalled()
    })

    it('returns mock hourly forecast for day in mock mode', async () => {
      weatherApi.setDevMode({ mode: 'mock', mockScenarioId: 'extreme-heat' })

      const result = await weatherApi.getHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, targetDate)

      expect(result).toHaveLength(24)
      expect(result[0].temperature).toBeGreaterThan(100) // Desert conditions
      expect(mockedAxios.get).not.toHaveBeenCalled()
    })

    it('returns only hours for the requested date', async () => {
      const mockApiResponse = {
        data: {
          days: [{
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
          }]
        }
      }

      mockedAxios.get.mockResolvedValue(mockApiResponse)
      mockedCache.getHourlyForecastForDay.mockReturnValue(null)

      const result = await weatherApi.getHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, '2022-01-02')

      // Should return exactly 24 hours for the requested date
      expect(result).toHaveLength(24)

      // First hour should be midnight of Jan 2
      expect(result[0].timestamp).toBe(1641103200) // Jan 2 00:00:00 (2022-01-02T00:00:00)
    })
  })

  describe('Error Handling', () => {
    it('throws error when daily forecast API fails', async () => {
      mockedCache.getDailyForecast.mockReturnValue(null)
      mockedAxios.get.mockRejectedValue(new Error('API Error'))
      weatherApi.setDevMode({ mode: 'production' })

      await expect(weatherApi.getDailyForecast(TEST_LOCATIONS.CHICAGO)).rejects.toThrow('API Error')
    })

    it('throws error when hourly forecast for day API fails', async () => {
      mockedCache.getHourlyForecastForDay.mockReturnValue(null)
      mockedAxios.get.mockRejectedValue(new Error('Network Error'))
      weatherApi.setDevMode({ mode: 'production' })

      await expect(weatherApi.getHourlyForecastForDay(TEST_LOCATIONS.CHICAGO, '2022-01-01')).rejects.toThrow('Network Error')
    })
  })
})