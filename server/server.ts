import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { WeatherService } from './services/weatherService.js'
import { createApp } from './app.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 3000 : 3001)
const VISUAL_CROSSING_API_KEY = process.env.VISUAL_CROSSING_API_KEY
const VISUAL_CROSSING_BASE_URL =
  'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline'

if (!VISUAL_CROSSING_API_KEY) {
  console.error('VISUAL_CROSSING_API_KEY environment variable is required')
  process.exit(1)
}

const weatherService = new WeatherService({
  apiKey: VISUAL_CROSSING_API_KEY,
  baseUrl: VISUAL_CROSSING_BASE_URL
})

const app = createApp({
  weatherService,
  staticPath: path.join(__dirname, '../../dist'),
  enableCors: true
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
