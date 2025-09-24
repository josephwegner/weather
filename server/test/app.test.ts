import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../app.js'
import { WeatherService } from '../services/weatherService.js'

describe('App Factory', () => {
  let mockWeatherService: WeatherService

  beforeEach(() => {
    mockWeatherService = {
      getCurrentWeather: vi.fn(),
      getHourlyForecast: vi.fn(),
      getDailyForecast: vi.fn()
    } as any
  })

  describe('createApp', () => {
    it('should create app with weather routes', async () => {
      const app = createApp({
        weatherService: mockWeatherService,
        enableCors: true
      })

      vi.mocked(mockWeatherService.getCurrentWeather).mockResolvedValueOnce({
        currentConditions: { temp: 75 }
      })

      await request(app).get('/api/weather/current/41.8781/-87.6298').expect(200)

      expect(mockWeatherService.getCurrentWeather).toHaveBeenCalled()
    })

    it('should handle CORS when enabled', async () => {
      const app = createApp({
        weatherService: mockWeatherService,
        enableCors: true
      })

      const response = await request(app)
        .options('/api/weather/current/41.8781/-87.6298')
        .expect(204)

      expect(response.headers['access-control-allow-origin']).toBe('*')
    })

    it('should not enable CORS when disabled', async () => {
      const app = createApp({
        weatherService: mockWeatherService,
        enableCors: false
      })

      const response = await request(app).options('/api/weather/current/41.8781/-87.6298')

      expect(response.headers['access-control-allow-origin']).toBeUndefined()
    })

    it('should handle JSON requests', async () => {
      const app = createApp({
        weatherService: mockWeatherService
      })

      // Create a POST endpoint for testing JSON handling
      app.post('/test-json', (req, res) => {
        res.json({ received: req.body })
      })

      const testData = { test: 'data' }

      const response = await request(app).post('/test-json').send(testData).expect(200)

      expect(response.body.received).toEqual(testData)
    })

    it('should return 404 for unknown routes when no static path provided', async () => {
      const app = createApp({
        weatherService: mockWeatherService
      })

      await request(app).get('/unknown-route').expect(404)
    })
  })

  describe('with static files', () => {
    it('should create app without static path', () => {
      const app = createApp({
        weatherService: mockWeatherService
      })

      expect(app).toBeDefined()
    })

    // Note: Testing static file serving would require actual files
    // This is typically handled in integration tests with real file system
  })
})
