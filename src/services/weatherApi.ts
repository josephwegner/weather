import axios from 'axios'
import type { Location, CurrentWeather, HourlyForecast, DailyForecast } from '../types/weather'
import { cacheService } from './cacheService'
import { getMockScenario, mockScenarios } from './mockData'

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || ''
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/3.0/onecall'

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
    if (!OPENWEATHER_API_KEY) {
      throw new Error('OpenWeatherMap API key not configured')
    }

    this.log('Making API call to OpenWeatherMap')
    const response = await axios.get(OPENWEATHER_BASE_URL, {
      params: {
        lat: location.lat,
        lon: location.lng,
        appid: OPENWEATHER_API_KEY,
        units: 'imperial',
        exclude: 'minutely,alerts'
      }
    })

    const current = response.data.current
    const weatherData: CurrentWeather = {
      temperature: Math.round(current.temp),
      feelsLike: Math.round(current.feels_like),
      humidity: current.humidity,
      pressure: current.pressure,
      windSpeed: Math.round(current.wind_speed),
      windDirection: current.wind_deg,
      visibility: Math.round(current.visibility / 1000),
      uvIndex: current.uvi,
      description: current.weather[0].description,
      icon: current.weather[0].icon,
      timestamp: current.dt
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
    if (!OPENWEATHER_API_KEY) {
      throw new Error('OpenWeatherMap API key not configured')
    }

    this.log('Making API call for hourly forecast for day:', date)
    const response = await axios.get(OPENWEATHER_BASE_URL, {
      params: {
        lat: location.lat,
        lon: location.lng,
        appid: OPENWEATHER_API_KEY,
        units: 'imperial',
        exclude: 'current,minutely,daily,alerts'
      }
    })

    // Filter to only include hours for the requested date in the location's local timezone
    // OpenWeatherMap API returns timestamps in UTC, but we want to filter by local date
    const targetDate = new Date(date + 'T00:00:00')
    const localMidnight = targetDate.getTime()
    const localNextMidnight = localMidnight + 86400000 // +24 hours

    // Get timezone offset for the target date (in minutes)
    const timezoneOffsetMs = targetDate.getTimezoneOffset() * 60000

    // Convert local midnight times to UTC for comparison with API timestamps
    const utcMidnightMs = localMidnight + timezoneOffsetMs
    const utcNextMidnightMs = localNextMidnight + timezoneOffsetMs

    const hourlyDataForDay: HourlyForecast[] = response.data.hourly
      /*.filter((hour: any) => {
        const hourMs = hour.dt * 1000 // API timestamp in UTC milliseconds
        return hourMs >= utcMidnightMs && hourMs < utcNextMidnightMs
      })*/
      .map((hour: any): HourlyForecast => ({
        timestamp: hour.dt,
        temperature: Math.round(hour.temp),
        feelsLike: Math.round(hour.feels_like),
        humidity: hour.humidity,
        precipitationProbability: Math.round((hour.pop || 0) * 100),
        precipitationIntensity: hour.rain?.['1h'] || hour.snow?.['1h'] || 0,
        windSpeed: Math.round(hour.wind_speed),
        windDirection: hour.wind_deg,
        description: hour.weather[0].description,
        icon: hour.weather[0].icon
      }))

    console.log('hourly data for day', hourlyDataForDay, response.data)

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
    if (!OPENWEATHER_API_KEY) {
      throw new Error('OpenWeatherMap API key not configured')
    }

    this.log('Making API call for daily forecast')
    const response = await axios.get(OPENWEATHER_BASE_URL, {
      params: {
        lat: location.lat,
        lon: location.lng,
        appid: OPENWEATHER_API_KEY,
        units: 'imperial',
        exclude: 'current,minutely,hourly,alerts'
      }
    })

    const dailyData: DailyForecast[] = response.data.daily.slice(0, 7).map((day: any): DailyForecast => ({
      date: new Date(day.dt * 1000).toISOString().split('T')[0],
      timestamp: day.dt,
      temperatureHigh: Math.round(day.temp.max),
      temperatureLow: Math.round(day.temp.min),
      precipitationProbability: Math.round((day.pop || 0) * 100),
      precipitationIntensity: day.rain?.['1h'] || day.snow?.['1h'] || 0,
      windSpeed: Math.round(day.wind_speed),
      windDirection: day.wind_deg,
      humidity: day.humidity,
      uvIndex: day.uvi,
      description: day.weather[0].description,
      icon: day.weather[0].icon
    }))

    // Cache the result
    cacheService.setDailyForecast(location, dailyData)
    this.log('Daily forecast cached')

    return dailyData
  }
}