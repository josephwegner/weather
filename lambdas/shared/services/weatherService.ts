import axios from 'axios'

export interface WeatherConfig {
  apiKey: string
  baseUrl: string
}

export interface Location {
  lat: string
  lng: string
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
}
