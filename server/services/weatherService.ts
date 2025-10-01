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

export type RadarLayerType =
  | 'precipitation_intensity'
  | 'accumulated_rain'
  | 'accumulated_snow'
  | 'wind_speed'
  | 'pressure'
  | 'temperature'
  | 'humidity'
  | 'cloudiness'

export interface WeatherMapsLayer {
  code: string
  name: string
  units: string
  type: RadarLayerType
}

export interface RadarFrame {
  timestamp: number
  layers: Partial<Record<RadarLayerType, string>>
  isPrediction?: boolean
}

// Weather Maps 2.0 layer mappings
const WEATHER_MAPS_LAYERS: Record<RadarLayerType, WeatherMapsLayer> = {
  precipitation_intensity: {
    code: 'PR0',
    name: 'Precipitation Intensity',
    units: 'mm/s',
    type: 'precipitation_intensity'
  },
  accumulated_rain: {
    code: 'PARAIN',
    name: 'Accumulated Rain',
    units: 'mm',
    type: 'accumulated_rain'
  },
  accumulated_snow: {
    code: 'PASNOW',
    name: 'Accumulated Snow',
    units: 'mm',
    type: 'accumulated_snow'
  },
  wind_speed: {
    code: 'WNDUV',
    name: 'Wind Speed',
    units: 'm/s',
    type: 'wind_speed'
  },
  pressure: {
    code: 'PA0',
    name: 'Pressure',
    units: 'hPa',
    type: 'pressure'
  },
  temperature: {
    code: 'TA2',
    name: 'Air Temperature',
    units: '°C',
    type: 'temperature'
  },
  humidity: {
    code: 'HRD0',
    name: 'Humidity',
    units: '%',
    type: 'humidity'
  },
  cloudiness: {
    code: 'CL',
    name: 'Cloudiness',
    units: '%',
    type: 'cloudiness'
  }
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
    layerType: string = 'precipitation_intensity'
  ): Promise<{ frames: RadarFrame[] }> {
    // Validate layer type
    const validLayerType = layerType as RadarLayerType
    if (!WEATHER_MAPS_LAYERS[validLayerType]) {
      throw new Error(`Invalid layer type: ${layerType}`)
    }

    const layerConfig = WEATHER_MAPS_LAYERS[validLayerType]
    const apiKey = this.config.openWeatherApiKey || process.env.OPENWEATHER_API_KEY || 'demo'

    const frames: RadarFrame[] = []
    const now = Math.floor(Date.now() / 1000)

    // Generate 12 frames total in 15-minute intervals:
    // - 4 frames for past hour: -60m, -45m, -30m, -15m
    // - 8 frames for next 2 hours: +0m, +15m, +30m, +45m, +60m, +75m, +90m, +105m

    // Past hour (4 frames: -60m, -45m, -30m, -15m)
    for (let i = 3; i >= 0; i--) {
      const timestamp = now - (i + 1) * 15 * 60 // 15 minutes ago
      const layers: Partial<Record<RadarLayerType, string>> = {}

      // Weather Maps 2.0 URL structure: /maps/2.0/weather/{layer}/{timestamp}/{z}/{x}/{y}?appid={API key}
      layers[validLayerType] =
        `https://maps.openweathermap.org/maps/2.0/weather/${layerConfig.code}/${timestamp}/{z}/{x}/{y}?appid=${apiKey}`

      frames.push({
        timestamp,
        layers,
        isPrediction: false
      })
    }

    // Future 2 hours (8 frames: 0m, +15m, +30m, ..., +105m)
    for (let i = 0; i < 8; i++) {
      const timestamp = now + i * 15 * 60 // Starting from now, then 15 minutes intervals
      const layers: Partial<Record<RadarLayerType, string>> = {}

      layers[validLayerType] =
        `https://maps.openweathermap.org/maps/2.0/weather/${layerConfig.code}/${timestamp}/{z}/{x}/{y}?appid=${apiKey}`

      frames.push({
        timestamp,
        layers,
        isPrediction: true
      })
    }

    return { frames }
  }

  async getRadarTileUrl(layer: string, z: string, x: string, y: string): Promise<string> {
    const apiKey = this.config.openWeatherApiKey || process.env.OPENWEATHER_API_KEY || 'demo'

    // Support both old and new layer formats
    const layerMap: Record<string, string> = {
      // Legacy format
      precipitation_new: 'precipitation_new',
      clouds_new: 'clouds_new',
      temp_new: 'temp_new',
      wind_new: 'wind_new',
      // Weather Maps 2.0 codes - map to available legacy layers for now
      PR0: 'precipitation_new',
      PARAIN: 'precipitation_new',
      PASNOW: 'precipitation_new',
      WNDUV: 'wind_new',
      PA0: 'pressure_new',
      TA2: 'temp_new',
      HRD0: 'clouds_new',
      CL: 'clouds_new'
    }

    const mappedLayer = layerMap[layer] || layer
    return `https://tile.openweathermap.org/map/${mappedLayer}/${z}/${x}/${y}.png?appid=${apiKey}`
  }
}
