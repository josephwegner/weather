import axios from 'axios'
import type { Location, CurrentWeather, HourlyForecast, DailyForecast } from '../types/weather'
import { cacheService } from './cache'
import { getMockScenario, mockScenarios } from './mockData'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface ApiModeConfig {
  cacheEnabled: boolean
  mockAPIRequests: boolean // true = mock data, false = real API calls

  // Development options
  mockScenarioId?: string
  enableLogging?: boolean
}

export class WeatherApiService {
  private config: ApiModeConfig

  constructor() {
    this.config = this.getDefaultConfig()
    if (import.meta.env.DEV) {
      this.exposeDevMethods()
    }
  }

  private getDefaultConfig(): ApiModeConfig {
    const isProduction = import.meta.env.PROD
    const useRealAPI = import.meta.env.VITE_USE_REAL_API === 'true'
    const disableCache = import.meta.env.VITE_DISABLE_CACHE === 'true'
    const mockScenario = import.meta.env.VITE_MOCK_SCENARIO || 'normal-chicago'

    return {
      cacheEnabled: !disableCache,
      mockAPIRequests: !isProduction && !useRealAPI,
      enableLogging: !isProduction,
      mockScenarioId: mockScenario
    }
  }

  private exposeDevMethods(): void {
    if (typeof window !== 'undefined') {
      ;(window as any).weatherApi = {
        useRealAPI: () => this.setConfig({ mockAPIRequests: false }),
        useMockAPI: () => this.setConfig({ mockAPIRequests: true }),
        toggleCache: () => this.setConfig({ cacheEnabled: !this.config.cacheEnabled }),
        clearCache: () => cacheService.clear(),
        setMockScenario: (id: string) => this.setConfig({ mockScenarioId: id }),
        getCurrentConfig: () => ({ ...this.config })
      }
    }
  }

  setConfig(config: Partial<ApiModeConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getCurrentConfig(): ApiModeConfig {
    return { ...this.config }
  }

  getAvailableScenarios() {
    return mockScenarios.map((scenario) => ({
      id: scenario.id,
      name: scenario.name,
      description: scenario.description
    }))
  }

  private log(...args: any[]): void {
    if (this.config.enableLogging) {
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
      cloudy: '04d',
      fog: '50d',
      wind: '50d',
      rain: '10d',
      sleet: '13d',
      snow: '13d',
      hail: '13d',
      thunderstorm: '11d'
    }
    return iconMap[vcIcon] || '01d'
  }

  async getCurrentWeather(location: Location): Promise<CurrentWeather> {
    this.log('getCurrentWeather called', { location, config: this.config })

    // 1. Check cache first (if enabled)
    if (this.config.cacheEnabled) {
      const cached = cacheService.getCurrentWeather(location)
      if (cached) {
        this.log('Returning cached data')
        return cached
      }
    }

    // 2. Cache empty or disabled - use configured source
    if (this.config.mockAPIRequests) {
      // Return mock data
      const scenarioId = this.config.mockScenarioId || 'normal-chicago'
      const scenario = getMockScenario(scenarioId)
      if (scenario) {
        this.log('Returning mock data for scenario:', scenarioId)
        return scenario.currentWeather
      }
      throw new Error(`Mock scenario '${scenarioId}' not found`)
    } else {
      // Make real API call
      this.log('Making API call to server')
      const response = await axios.get(
        `${API_BASE_URL}/weather/current/${location.lat}/${location.lng}`
      )

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

      // Cache the result (if caching enabled)
      if (this.config.cacheEnabled) {
        cacheService.setCurrentWeather(location, weatherData)
        this.log('API response cached')
      }

      return weatherData
    }
  }

  async getHourlyForecastForDay(location: Location, date: string): Promise<HourlyForecast[]> {
    this.log('getHourlyForecastForDay called', { location, date, config: this.config })

    // 1. Check cache first (if enabled)
    if (this.config.cacheEnabled) {
      const cached = cacheService.getHourlyForecastForDay(location, date)
      if (cached) {
        this.log('Returning cached hourly forecast for day')
        return cached
      }
    }

    // 2. Cache empty or disabled - use configured source
    if (this.config.mockAPIRequests) {
      // Return mock data
      const scenarioId = this.config.mockScenarioId || 'normal-chicago'
      const scenario = getMockScenario(scenarioId)
      if (scenario) {
        this.log('Returning mock hourly forecast for day:', scenarioId)
        // Generate 24 hours of mock data for the requested date (UTC)
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
      throw new Error(`Mock scenario '${scenarioId}' not found`)
    } else {
      // Make real API call
      this.log('Making API call to server for hourly forecast for day:', date)
      const response = await axios.get(
        `${API_BASE_URL}/weather/hourly/${location.lat}/${location.lng}/${date}`
      )

      // Visual Crossing returns a single day with hours array
      const dayData = response.data.days[0]
      if (!dayData || !dayData.hours) {
        return []
      }

      const hourlyDataForDay: HourlyForecast[] = dayData.hours.map((hour: any): HourlyForecast => {
        // Combine date and time to create full timestamp (force UTC interpretation)
        const dateTimeString = `${date}T${hour.datetime}Z`
        const timestamp = Math.floor(new Date(dateTimeString).getTime() / 1000)

        return {
          timestamp,
          temperature: Math.round(hour.temp),
          feelsLike: Math.round(hour.feelslike),
          humidity: hour.humidity,
          precipitationProbability: Math.round(hour.precipprob || 0),
          precipitationIntensity: hour.precip || 0,
          precipitationType: hour.preciptype,
          windSpeed: Math.round(hour.windspeed || 0),
          windDirection: hour.winddir || 0,
          windGust: Math.round(hour.windgust || 0),
          pressure: Math.round(hour.pressure || 0),
          uvIndex: hour.uvindex || 0,
          cloudCover: hour.cloudcover || 0,
          visibility: hour.visibility || 0,
          description: hour.conditions.toLowerCase(),
          icon: this.mapVisualCrossingIcon(hour.icon)
        }
      })

      // Cache the result (if caching enabled)
      if (this.config.cacheEnabled) {
        cacheService.setHourlyForecastForDay(location, date, hourlyDataForDay)
        this.log('Hourly forecast for day cached')
      }

      return hourlyDataForDay
    }
  }

  async getDailyForecast(location: Location): Promise<DailyForecast[]> {
    this.log('getDailyForecast called', { location, config: this.config })

    // 1. Check cache first (if enabled)
    if (this.config.cacheEnabled) {
      const cached = cacheService.getDailyForecast(location)
      if (cached) {
        this.log('Returning cached daily forecast')
        return cached
      }
    }

    // 2. Cache empty or disabled - use configured source
    if (this.config.mockAPIRequests) {
      // Return mock data
      const scenarioId = this.config.mockScenarioId || 'normal-chicago'
      const scenario = getMockScenario(scenarioId)
      if (scenario) {
        this.log('Returning mock daily forecast for scenario:', scenarioId)
        return scenario.dailyForecast
      }
      throw new Error(`Mock scenario '${scenarioId}' not found`)
    } else {
      // Make real API call
      this.log('Making API call to server for daily forecast')

      // Calculate date range: today through next 6 days (7 days total)
      const today = new Date()
      const endDate = new Date(today)
      endDate.setDate(today.getDate() + 6)

      const startDateStr = today.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      const response = await axios.get(
        `${API_BASE_URL}/weather/daily/${location.lat}/${location.lng}/${startDateStr}/${endDateStr}`
      )

      const dailyData: DailyForecast[] = response.data.days.slice(0, 7).map(
        (day: any): DailyForecast => ({
          date: day.datetime,
          timestamp: Math.floor(new Date(day.datetime).getTime() / 1000),
          temperatureHigh: Math.round(day.tempmax),
          temperatureLow: Math.round(day.tempmin),
          precipitationProbability: Math.round(day.precipprob || 0),
          precipitationIntensity: day.precip || 0,
          windSpeed: Math.round(day.windspeed),
          windDirection: day.winddir,
          humidity: day.humidity,
          uvIndex: day.uvindex || 0,
          description: day.conditions.toLowerCase(),
          icon: this.mapVisualCrossingIcon(day.icon)
        })
      )

      // Cache the result (if caching enabled)
      if (this.config.cacheEnabled) {
        cacheService.setDailyForecast(location, dailyData)
        this.log('Daily forecast cached')
      }

      return dailyData
    }
  }
}

// Create and export a singleton instance
export const weatherApiService = new WeatherApiService()
