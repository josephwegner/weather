import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { WeatherService } from '../../services/weatherService.js'
import { createWeatherRoutes } from '../../routes/weatherRoutes.js'

describe('Weather Routes', () => {
  let app: express.Application
  let mockWeatherService: WeatherService

  beforeEach(() => {
    mockWeatherService = {
      getCurrentWeather: vi.fn(),
      getHourlyForecast: vi.fn(),
      getDailyForecast: vi.fn()
    } as any

    app = express()
    app.use(express.json())
    app.use('/api/weather', createWeatherRoutes(mockWeatherService))
  })

  describe('GET /api/weather/current/:lat/:lng', () => {
    it('should return current weather data', async () => {
      const mockWeatherData = {
        currentConditions: {
          temp: 75,
          feelslike: 78,
          humidity: 65,
          conditions: 'Partly cloudy'
        }
      }

      vi.mocked(mockWeatherService.getCurrentWeather).mockResolvedValueOnce(mockWeatherData)

      const response = await request(app).get('/api/weather/current/41.8781/-87.6298').expect(200)

      expect(response.body).toEqual(mockWeatherData)
      expect(mockWeatherService.getCurrentWeather).toHaveBeenCalledWith({
        lat: '41.8781',
        lng: '-87.6298'
      })
    })

    it('should handle service errors', async () => {
      vi.mocked(mockWeatherService.getCurrentWeather).mockRejectedValueOnce(new Error('API Error'))

      const response = await request(app).get('/api/weather/current/41.8781/-87.6298').expect(500)

      expect(response.body).toEqual({
        error: 'Failed to fetch weather data'
      })
    })
  })

  describe('GET /api/weather/hourly/:lat/:lng/:date', () => {
    it('should return hourly forecast data', async () => {
      const mockHourlyData = {
        days: [
          {
            hours: [
              { datetime: '00:00:00', temp: 70, conditions: 'Clear' },
              { datetime: '01:00:00', temp: 69, conditions: 'Clear' }
            ]
          }
        ]
      }

      vi.mocked(mockWeatherService.getHourlyForecast).mockResolvedValueOnce(mockHourlyData)

      const response = await request(app)
        .get('/api/weather/hourly/41.8781/-87.6298/2024-01-15')
        .expect(200)

      expect(response.body).toEqual(mockHourlyData)
      expect(mockWeatherService.getHourlyForecast).toHaveBeenCalledWith(
        { lat: '41.8781', lng: '-87.6298' },
        '2024-01-15'
      )
    })

    it('should handle service errors', async () => {
      vi.mocked(mockWeatherService.getHourlyForecast).mockRejectedValueOnce(
        new Error('Service Error')
      )

      const response = await request(app)
        .get('/api/weather/hourly/41.8781/-87.6298/2024-01-15')
        .expect(500)

      expect(response.body).toEqual({
        error: 'Failed to fetch hourly forecast data'
      })
    })
  })

  describe('GET /api/weather/daily/:lat/:lng/:startDate/:endDate', () => {
    it('should return daily forecast data', async () => {
      const mockDailyData = {
        days: [
          { datetime: '2024-01-15', tempmax: 75, tempmin: 55, conditions: 'Partly cloudy' },
          { datetime: '2024-01-16', tempmax: 78, tempmin: 58, conditions: 'Sunny' }
        ]
      }

      vi.mocked(mockWeatherService.getDailyForecast).mockResolvedValueOnce(mockDailyData)

      const response = await request(app)
        .get('/api/weather/daily/41.8781/-87.6298/2024-01-15/2024-01-21')
        .expect(200)

      expect(response.body).toEqual(mockDailyData)
      expect(mockWeatherService.getDailyForecast).toHaveBeenCalledWith(
        { lat: '41.8781', lng: '-87.6298' },
        '2024-01-15',
        '2024-01-21'
      )
    })

    it('should handle service errors', async () => {
      vi.mocked(mockWeatherService.getDailyForecast).mockRejectedValueOnce(
        new Error('Service Error')
      )

      const response = await request(app)
        .get('/api/weather/daily/41.8781/-87.6298/2024-01-15/2024-01-21')
        .expect(500)

      expect(response.body).toEqual({
        error: 'Failed to fetch daily forecast data'
      })
    })
  })
})
