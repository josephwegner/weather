import axios from 'axios'

export interface WeatherConfig {
  apiKey: string
  baseUrl: string
}

export interface Location {
  lat: string
  lng: string
}

export interface RadarTileParams {
  element: string
  z: number
  x: number
  y: number
  time: string
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

  async getRadarTile(params: RadarTileParams): Promise<{ data: Buffer; contentType: string }> {
    const response = await axios.get(
      `https://maps.visualcrossing.com/VisualCrossingWebServices/rest/api/v1/map/tile/${params.element}/${params.z}/${params.x}/${params.y}.webp`,
      {
        params: {
          apikey: this.config.apiKey,
          time: params.time,
          unitGroup: 'us',
          strict: 'false'
        },
        responseType: 'arraybuffer'
      }
    )

    return {
      data: response.data,
      contentType: response.headers['content-type'] || 'image/webp'
    }
  }
}
