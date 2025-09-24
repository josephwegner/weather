import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { WeatherService } from '../../services/weatherService.js'

const mockedAxios = vi.mocked(axios)

describe('WeatherService', () => {
  let weatherService: WeatherService
  const mockConfig = {
    apiKey: 'test-api-key',
    baseUrl: 'https://api.example.com'
  }

  beforeEach(() => {
    weatherService = new WeatherService(mockConfig)
    vi.clearAllMocks()
  })

  describe('getCurrentWeather', () => {
    it('should fetch current weather for a location', async () => {
      const mockResponse = {
        data: {
          currentConditions: {
            temp: 75,
            feelslike: 78,
            humidity: 65,
            conditions: 'Partly cloudy'
          }
        }
      }

      mockedAxios.get.mockResolvedValueOnce(mockResponse)

      const location = { lat: '41.8781', lng: '-87.6298' }
      const result = await weatherService.getCurrentWeather(location)

      expect(mockedAxios.get).toHaveBeenCalledWith(`${mockConfig.baseUrl}/41.8781,-87.6298/today`, {
        params: {
          key: mockConfig.apiKey,
          unitGroup: 'us',
          include: 'current',
          contentType: 'json'
        }
      })

      expect(result).toEqual(mockResponse.data)
    })

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('API Error')
      mockedAxios.get.mockRejectedValueOnce(mockError)

      const location = { lat: '41.8781', lng: '-87.6298' }

      await expect(weatherService.getCurrentWeather(location)).rejects.toThrow('API Error')
    })
  })

  describe('getHourlyForecast', () => {
    it('should fetch hourly forecast for a location and date', async () => {
      const mockResponse = {
        data: {
          days: [
            {
              hours: [
                { datetime: '00:00:00', temp: 70, conditions: 'Clear' },
                { datetime: '01:00:00', temp: 69, conditions: 'Clear' }
              ]
            }
          ]
        }
      }

      mockedAxios.get.mockResolvedValueOnce(mockResponse)

      const location = { lat: '41.8781', lng: '-87.6298' }
      const date = '2024-01-15'
      const result = await weatherService.getHourlyForecast(location, date)

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${mockConfig.baseUrl}/41.8781,-87.6298/2024-01-15`,
        {
          params: {
            key: mockConfig.apiKey,
            unitGroup: 'us',
            include: 'hours',
            contentType: 'json'
          }
        }
      )

      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('getDailyForecast', () => {
    it('should fetch daily forecast for a date range', async () => {
      const mockResponse = {
        data: {
          days: [
            { datetime: '2024-01-15', tempmax: 75, tempmin: 55, conditions: 'Partly cloudy' },
            { datetime: '2024-01-16', tempmax: 78, tempmin: 58, conditions: 'Sunny' }
          ]
        }
      }

      mockedAxios.get.mockResolvedValueOnce(mockResponse)

      const location = { lat: '41.8781', lng: '-87.6298' }
      const startDate = '2024-01-15'
      const endDate = '2024-01-21'
      const result = await weatherService.getDailyForecast(location, startDate, endDate)

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${mockConfig.baseUrl}/41.8781,-87.6298/2024-01-15/2024-01-21`,
        {
          params: {
            key: mockConfig.apiKey,
            unitGroup: 'us',
            include: 'days',
            contentType: 'json'
          }
        }
      )

      expect(result).toEqual(mockResponse.data)
    })

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error')
      mockedAxios.get.mockRejectedValueOnce(networkError)

      const location = { lat: '41.8781', lng: '-87.6298' }
      const startDate = '2024-01-15'
      const endDate = '2024-01-21'

      await expect(weatherService.getDailyForecast(location, startDate, endDate)).rejects.toThrow(
        'Network Error'
      )
    })
  })

  describe('constructor', () => {
    it('should create instance with provided config', () => {
      const config = { apiKey: 'test-key', baseUrl: 'https://test.com' }
      const service = new WeatherService(config)

      expect(service).toBeInstanceOf(WeatherService)
    })
  })
})
