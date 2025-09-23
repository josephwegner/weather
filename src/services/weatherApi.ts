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

  async getHourlyForecast(location: Location): Promise<HourlyForecast[]> {
    this.log('getHourlyForecast called', { location, mode: this.devConfig.mode })

    // Handle mock mode
    if (this.devConfig.mode === 'mock') {
      const scenarioId = this.devConfig.mockScenarioId || 'normal-chicago'
      const scenario = getMockScenario(scenarioId)
      if (scenario) {
        this.log('Returning mock hourly forecast for scenario:', scenarioId)
        return scenario.hourlyForecast
      }
    }

    // Handle offline mode
    if (this.devConfig.mode === 'offline') {
      const cached = cacheService.getHourlyForecast(location)
      if (cached) {
        this.log('Returning cached hourly forecast (offline mode)')
        return cached
      }
      throw new Error('No cached hourly forecast available in offline mode')
    }

    // Check cache first in cache-first mode
    if (this.devConfig.mode === 'cache-first') {
      const cached = cacheService.getHourlyForecast(location)
      if (cached) {
        this.log('Returning cached hourly forecast')
        return cached
      }
    }

    // Make API call
    if (!OPENWEATHER_API_KEY) {
      throw new Error('OpenWeatherMap API key not configured')
    }

    this.log('Making API call for hourly forecast')
    const response = await axios.get(OPENWEATHER_BASE_URL, {
      params: {
        lat: location.lat,
        lon: location.lng,
        appid: OPENWEATHER_API_KEY,
        units: 'imperial',
        exclude: 'current,minutely,daily,alerts'
      }
    })

    const hourlyData: HourlyForecast[] = response.data.hourly.slice(0, 48).map((hour: any): HourlyForecast => ({
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

    // Cache the result
    cacheService.setHourlyForecast(location, hourlyData)
    this.log('Hourly forecast cached')

    return hourlyData
  }

  async getDailyForecast(location: Location): Promise<DailyForecast[]> {
    if (!OPENWEATHER_API_KEY) {
      throw new Error('OpenWeatherMap API key not configured')
    }

    const response = await axios.get(OPENWEATHER_BASE_URL, {
      params: {
        lat: location.lat,
        lon: location.lng,
        appid: OPENWEATHER_API_KEY,
        units: 'imperial',
        exclude: 'current,minutely,hourly,alerts'
      }
    })

    return response.data.daily.slice(0, 10).map((day: any): DailyForecast => ({
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
  }
}