import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWeatherStore } from '../../stores/weather'
import type { CurrentWeather, HourlyForecast, Location } from '../../types/weather'

describe('Weather Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default Chicago location', () => {
    const store = useWeatherStore()

    expect(store.currentLocation).toEqual({
      lat: 41.8781,
      lng: -87.6298,
      name: 'Chicago, IL'
    })
    expect(store.currentWeather).toBeNull()
    expect(store.hourlyForecast).toEqual([])
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('sets location correctly', () => {
    const store = useWeatherStore()
    const newLocation: Location = {
      lat: 40.7128,
      lng: -74.0060,
      name: 'New York, NY'
    }

    store.setLocation(newLocation)
    expect(store.currentLocation).toEqual(newLocation)
  })

  it('sets current weather correctly', () => {
    const store = useWeatherStore()
    const weather: CurrentWeather = {
      temperature: 75,
      feelsLike: 78,
      humidity: 60,
      pressure: 1013,
      windSpeed: 10,
      windDirection: 180,
      visibility: 10,
      uvIndex: 3,
      description: 'partly cloudy',
      icon: '02d',
      timestamp: 1234567890
    }

    store.setCurrentWeather(weather)
    expect(store.currentWeather).toEqual(weather)
  })

  it('sets hourly forecast correctly', () => {
    const store = useWeatherStore()
    const forecast: HourlyForecast[] = [
      {
        timestamp: 1234567890,
        temperature: 72,
        feelsLike: 75,
        humidity: 65,
        precipitationProbability: 20,
        precipitationIntensity: 0,
        windSpeed: 8,
        windDirection: 180,
        description: 'partly cloudy',
        icon: '02d'
      }
    ]

    store.setHourlyForecast(forecast)
    expect(store.hourlyForecast).toEqual(forecast)
  })

  it('manages loading state correctly', () => {
    const store = useWeatherStore()

    expect(store.isLoading).toBe(false)

    store.setLoading(true)
    expect(store.isLoading).toBe(true)

    store.setLoading(false)
    expect(store.isLoading).toBe(false)
  })

  it('manages error state correctly', () => {
    const store = useWeatherStore()

    expect(store.error).toBeNull()

    store.setError('API Error')
    expect(store.error).toBe('API Error')

    store.setError(null)
    expect(store.error).toBeNull()
  })
})