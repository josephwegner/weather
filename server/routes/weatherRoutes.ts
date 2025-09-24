import { Router, Request, Response } from 'express'
import { WeatherService } from '../services/weatherService.js'

export function createWeatherRoutes(weatherService: WeatherService): Router {
  const router = Router()

  router.get('/current/:lat/:lng', async (req: Request, res: Response) => {
    try {
      const { lat, lng } = req.params

      const data = await weatherService.getCurrentWeather({ lat, lng })
      res.json(data)
    } catch (error) {
      console.error('Error fetching current weather:', error)
      res.status(500).json({ error: 'Failed to fetch weather data' })
    }
  })

  router.get('/hourly/:lat/:lng/:date', async (req: Request, res: Response) => {
    try {
      const { lat, lng, date } = req.params

      const data = await weatherService.getHourlyForecast({ lat, lng }, date)
      res.json(data)
    } catch (error) {
      console.error('Error fetching hourly forecast:', error)
      res.status(500).json({ error: 'Failed to fetch hourly forecast data' })
    }
  })

  router.get('/daily/:lat/:lng/:startDate/:endDate', async (req: Request, res: Response) => {
    try {
      const { lat, lng, startDate, endDate } = req.params

      const data = await weatherService.getDailyForecast({ lat, lng }, startDate, endDate)
      res.json(data)
    } catch (error) {
      console.error('Error fetching daily forecast:', error)
      res.status(500).json({ error: 'Failed to fetch daily forecast data' })
    }
  })

  return router
}
