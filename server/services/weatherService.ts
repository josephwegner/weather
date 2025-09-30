import axios from 'axios'

export interface WeatherConfig {
  apiKey: string
  baseUrl: string
  openWeatherApiKey?: string
}

export interface Location {
  lat: string
  lng: string
}

export type RadarLayerType = 'precipitation' | 'clouds' | 'temperature' | 'wind'

export interface RadarFrame {
  timestamp: number
  layers: Partial<Record<RadarLayerType, string>>
}

export class WeatherService {
  private config: WeatherConfig

  constructor(config: WeatherConfig) {
    this.config = config
  }

  async getCurrentWeather(location: Location) {
    const locationString = `${location.lat},${location.lng}`

    const response = await axios.get(`${this.config.baseUrl}/${locationString}/today`, {
      params: {
        key: this.config.apiKey,
        unitGroup: 'us',
        include: 'current',
        contentType: 'json'
      }
    })

    return response.data
  }

  async getHourlyForecast(location: Location, date: string) {
    const locationString = `${location.lat},${location.lng}`

    const response = await axios.get(`${this.config.baseUrl}/${locationString}/${date}`, {
      params: {
        key: this.config.apiKey,
        unitGroup: 'us',
        include: 'hours',
        contentType: 'json'
      }
    })

    return response.data
  }

  async getDailyForecast(location: Location, startDate: string, endDate: string) {
    const locationString = `${location.lat},${location.lng}`

    const response = await axios.get(
      `${this.config.baseUrl}/${locationString}/${startDate}/${endDate}`,
      {
        params: {
          key: this.config.apiKey,
          unitGroup: 'us',
          include: 'days',
          contentType: 'json'
        }
      }
    )

    return response.data
  }

  async getRadarFrames(
    location: Location,
    layerTypes: string[] = ['precipitation']
  ): Promise<{ frames: RadarFrame[] }> {
    // Validate layer types
    const validLayers: RadarLayerType[] = ['precipitation', 'clouds', 'temperature', 'wind']
    const layers = layerTypes.filter((layer): layer is RadarLayerType =>
      validLayers.includes(layer as RadarLayerType)
    )

    if (layers.length === 0) {
      layers.push('precipitation') // Default to precipitation if no valid layers
    }

    // For now, return mock radar frames
    // In production, this would integrate with OpenWeatherMap's map tiles API
    const frames: RadarFrame[] = []
    const now = Math.floor(Date.now() / 1000)

    // Generate 8 frames covering the last 2 hours (15-minute intervals)
    for (let i = 7; i >= 0; i--) {
      const timestamp = now - i * 15 * 60 // 15 minutes ago
      const layerUrls: Partial<Record<RadarLayerType, string>> = {}

      for (const layerType of layers) {
        // OpenWeatherMap map tile URL structure
        const layerMap: Record<RadarLayerType, string> = {
          precipitation: 'precipitation_new',
          clouds: 'clouds_new',
          temperature: 'temp_new',
          wind: 'wind_new'
        }

        const openWeatherLayer = layerMap[layerType]
        const apiKey = this.config.openWeatherApiKey || process.env.OPENWEATHER_API_KEY || 'demo'

        // Use our server as a proxy to handle CORS issues
        layerUrls[layerType] = `/api/weather/radar/tile/${openWeatherLayer}/{z}/{x}/{y}`
      }

      frames.push({
        timestamp,
        layers: layerUrls
      })
    }

    return { frames }
  }

  async getRadarTileUrl(layer: string, z: string, x: string, y: string): Promise<string> {
    const apiKey = this.config.openWeatherApiKey || process.env.OPENWEATHER_API_KEY || 'demo'
    return `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${apiKey}`
  }
}
