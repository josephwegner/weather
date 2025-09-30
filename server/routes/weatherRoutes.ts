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

  router.get('/radar/:lat/:lng', async (req: Request, res: Response) => {
    try {
      const { lat, lng } = req.params
      const { layers } = req.query

      const layerTypes = typeof layers === 'string' ? layers.split(',') : ['precipitation']
      const data = await weatherService.getRadarFrames({ lat, lng }, layerTypes)
      res.json(data)
    } catch (error) {
      console.error('Error fetching radar data:', error)
      res.status(500).json({ error: 'Failed to fetch radar data' })
    }
  })

  // Proxy route for radar tiles to handle CORS
  router.get('/radar/tile/:layer/:z/:x/:y', async (req: Request, res: Response) => {
    try {
      const { layer, z, x, y } = req.params

      // Validate layer type
      const validLayers = ['precipitation_new', 'clouds_new', 'temp_new']
      if (!validLayers.includes(layer)) {
        return res.status(400).json({ error: 'Invalid layer type' })
      }

      const tileUrl = await weatherService.getRadarTileUrl(layer, z, x, y)

      // Redirect to the tile URL or proxy the request
      res.redirect(tileUrl)
    } catch (error) {
      console.error('Error fetching radar tile:', error)
      res.status(500).json({ error: 'Failed to fetch radar tile' })
    }
  })

  return router
}
