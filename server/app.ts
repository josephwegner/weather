import express from 'express'
import cors from 'cors'
import { WeatherService } from './services/weatherService.js'
import { createWeatherRoutes } from './routes/weatherRoutes.js'

export interface AppConfig {
  weatherService: WeatherService
  staticPath?: string
  enableCors?: boolean
}

export function createApp(config: AppConfig) {
  const app = express()

  if (config.enableCors) {
    app.use(cors())
  }

  app.use(express.json())

  // Weather API routes
  app.use('/api/weather', createWeatherRoutes(config.weatherService))

  // Serve static files if path is provided
  if (config.staticPath) {
    app.use(express.static(config.staticPath))

    // Fallback to index.html for SPA routing
    app.use((req, res) => {
      res.sendFile(path.join(config.staticPath!, 'index.html'))
    })
  }

  return app
}
