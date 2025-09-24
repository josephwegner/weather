import axios from 'axios'
import type { Location, CurrentWeather, HourlyForecast, DailyForecast } from '../types/weather'
import { cacheService } from './cacheService'
import { getMockScenario, mockScenarios } from './mockData'

const VISUAL_CROSSING_API_KEY = import.meta.env.VITE_VISUAL_CROSSING_API_KEY || ''
const VISUAL_CROSSING_BASE_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline'

export type DevMode = 'production' | 'cache-first' | 'mock' | 'offline'

export interface DevModeConfig {
  mode: DevMode
  mockScenarioId?: string
  enableLogging?: boolean
}

export class WeatherApiService {
  private devConfig: DevModeConfig = {
    mode: import.meta.env.DEV ? 'cache-first' : 'production',
    enableLogging: import.meta.env.DEV
  }

  setDevMode(config: Partial<DevModeConfig>): void {
    this.devConfig = { ...this.devConfig, ...config }
  }

  getAvailableScenarios() {
    return mockScenarios.map(scenario => ({
      id: scenario.id,
      name: scenario.name,
      description: scenario.description
    }))
  }

  private log(...args: any[]): void {
    if (this.devConfig.enableLogging) {
      console.log('[WeatherAPI]', ...args)
    }
  }

  private mapVisualCrossingIcon(vcIcon: string): string {
    // Map Visual Crossing icons to OpenWeatherMap-compatible icons
    const iconMap: Record<string, string> = {
      'clear-day': '01d',
      'clear-night': '01n',
      'partly-cloudy-day': '02d',
      'partly-cloudy-night': '02n',
      'cloudy': '04d',
      'fog': '50d',
      'wind': '50d',
      'rain': '10d',
      'sleet': '13d',
      'snow': '13d',
      'hail': '13d',
      'thunderstorm': '11d'
    }
    return iconMap[vcIcon] || '01d'
  }

  async getCurrentWeather(location: Location): Promise<CurrentWeather> {
    this.log('getCurrentWeather called', { location, mode: this.devConfig.mode })

    // Handle mock mode
    if (this.devConfig.mode === 'mock') {
      const scenarioId = this.devConfig.mockScenarioId || 'normal-chicago'
      const scenario = getMockScenario(scenarioId)
      if (scenario) {
        this.log('Returning mock data for scenario:', scenarioId)
        return scenario.currentWeather
      }
    }

    // Handle offline mode
    if (this.devConfig.mode === 'offline') {
      const cached = cacheService.getCurrentWeather(location)
      if (cached) {
        this.log('Returning cached data (offline mode)')
        return cached
      }
      throw new Error('No cached data available in offline mode')
    }

    // Check cache first in cache-first mode
    if (this.devConfig.mode === 'cache-first') {
      const cached = cacheService.getCurrentWeather(location)
      if (cached) {
        this.log('Returning cached data')
        return cached
      }
    }

    // Make API call
    if (!VISUAL_CROSSING_API_KEY) {
      throw new Error('Visual Crossing API key not configured')
    }

    this.log('Making API call to Visual Crossing')
    const locationString = `${location.lat},${location.lng}`
    const response = await axios.get(`${VISUAL_CROSSING_BASE_URL}/${locationString}/today`, {
      params: {
        key: VISUAL_CROSSING_API_KEY,
        unitGroup: 'us',
        include: 'current',
        contentType: 'json'
      }
    })

    const currentConditions = response.data.currentConditions
    const weatherData: CurrentWeather = {
      temperature: Math.round(currentConditions.temp),
      feelsLike: Math.round(currentConditions.feelslike),
      humidity: currentConditions.humidity,
      pressure: Math.round(currentConditions.pressure),
      windSpeed: Math.round(currentConditions.windspeed),
      windDirection: currentConditions.winddir,
      visibility: Math.round(currentConditions.visibility),
      uvIndex: currentConditions.uvindex || 0,
      description: currentConditions.conditions.toLowerCase(),
      icon: this.mapVisualCrossingIcon(currentConditions.icon),
      timestamp: Math.floor(new Date(currentConditions.datetime).getTime() / 1000)
    }

    // Cache the result
    cacheService.setCurrentWeather(location, weatherData)
    this.log('API response cached')

    return weatherData
  }


  async getHourlyForecastForDay(location: Location, date: string): Promise<HourlyForecast[]> {
    this.log('getHourlyForecastForDay called', { location, date, mode: this.devConfig.mode })

    // Handle mock mode
    if (this.devConfig.mode === 'mock') {
      const scenarioId = this.devConfig.mockScenarioId || 'normal-chicago'
      const scenario = getMockScenario(scenarioId)
      if (scenario) {
        this.log('Returning mock hourly forecast for day:', scenarioId)
        // Generate 24 hours of mock data for the requested date
        const targetDateMs = new Date(date + 'T00:00:00Z').getTime()
        const baseTimestamp = Math.floor(targetDateMs / 1000)

        return Array.from({ length: 24 }, (_, i) => {
          const baseHour = scenario.hourlyForecast[i % scenario.hourlyForecast.length]
          return {
            ...baseHour,
            timestamp: baseTimestamp + i * 3600
          }
        })
      }
    }

    // Handle offline mode
    if (this.devConfig.mode === 'offline') {
      const cached = cacheService.getHourlyForecastForDay(location, date)
      if (cached) {
        this.log('Returning cached hourly forecast for day (offline mode)')
        return cached
      }
      throw new Error('No cached hourly forecast available for this date in offline mode')
    }

    // Check cache first in cache-first mode
    if (this.devConfig.mode === 'cache-first') {
      const cached = cacheService.getHourlyForecastForDay(location, date)
      if (cached) {
        this.log('Returning cached hourly forecast for day')
        return cached
      }
    }

    // Make API call
    if (!VISUAL_CROSSING_API_KEY) {
      throw new Error('Visual Crossing API key not configured')
    }

    this.log('Making API call for hourly forecast for day:', date)
    const locationString = `${location.lat},${location.lng}`
    const response = await axios.get(`${VISUAL_CROSSING_BASE_URL}/${locationString}/${date}`, {
      params: {
        key: VISUAL_CROSSING_API_KEY,
        unitGroup: 'us',
        include: 'hours',
        contentType: 'json'
      }
    })

    // Visual Crossing returns a single day with hours array
    const dayData = response.data.days[0]
    if (!dayData || !dayData.hours) {
      return []
    }

    const hourlyDataForDay: HourlyForecast[] = dayData.hours.map((hour: any): HourlyForecast => {
      // Combine date and time to create full timestamp
      const dateTimeString = `${date}T${hour.datetime}`
      const timestamp = Math.floor(new Date(dateTimeString).getTime() / 1000)

      return {
        timestamp,
        temperature: Math.round(hour.temp),
        feelsLike: Math.round(hour.feelslike),
        humidity: hour.humidity,
        precipitationProbability: Math.round(hour.precipprob || 0),
        precipitationIntensity: hour.precip || 0,
        windSpeed: Math.round(hour.windspeed),
        windDirection: hour.winddir,
        description: hour.conditions.toLowerCase(),
        icon: this.mapVisualCrossingIcon(hour.icon)
      }
    })

    // Cache the result
    cacheService.setHourlyForecastForDay(location, date, hourlyDataForDay)
    this.log('Hourly forecast for day cached')

    return hourlyDataForDay
  }

  async getDailyForecast(location: Location): Promise<DailyForecast[]> {
    this.log('getDailyForecast called', { location, mode: this.devConfig.mode })

    // Handle mock mode
    if (this.devConfig.mode === 'mock') {
      const scenarioId = this.devConfig.mockScenarioId || 'normal-chicago'
      const scenario = getMockScenario(scenarioId)
      if (scenario) {
        this.log('Returning mock daily forecast for scenario:', scenarioId)
        return scenario.dailyForecast
      }
    }

    // Handle offline mode
    if (this.devConfig.mode === 'offline') {
      const cached = cacheService.getDailyForecast(location)
      if (cached) {
        this.log('Returning cached daily forecast (offline mode)')
        return cached
      }
      throw new Error('No cached daily forecast available in offline mode')
    }

    // Check cache first in cache-first mode
    if (this.devConfig.mode === 'cache-first') {
      const cached = cacheService.getDailyForecast(location)
      if (cached) {
        this.log('Returning cached daily forecast')
        return cached
      }
    }

    // Make API call
    if (!VISUAL_CROSSING_API_KEY) {
      throw new Error('Visual Crossing API key not configured')
    }

    this.log('Making API call for daily forecast')
    const locationString = `${location.lat},${location.lng}`
    const response = await axios.get(`${VISUAL_CROSSING_BASE_URL}/${locationString}/next7days`, {
      params: {
        key: VISUAL_CROSSING_API_KEY,
        unitGroup: 'us',
        include: 'days',
        contentType: 'json'
      }
    })

    const dailyData: DailyForecast[] = response.data.days.slice(0, 7).map((day: any): DailyForecast => ({
      date: day.datetime,
      timestamp: Math.floor(new Date(day.datetime).getTime() / 1000),
      temperatureHigh: Math.round(day.tempmax),
      temperatureLow: Math.round(day.tempmin),
      precipitationProbability: Math.round((day.precipprob || 0)),
      precipitationIntensity: day.precip || 0,
      windSpeed: Math.round(day.windspeed),
      windDirection: day.winddir,
      humidity: day.humidity,
      uvIndex: day.uvindex || 0,
      description: day.conditions.toLowerCase(),
      icon: this.mapVisualCrossingIcon(day.icon)
    }))

    // Cache the result
    cacheService.setDailyForecast(location, dailyData)
    this.log('Daily forecast cached')

    return dailyData
  }
}