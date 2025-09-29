import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWeatherStore } from '../../stores/weather'
import type { CurrentWeather, HourlyForecast, DailyForecast, Location } from '../../types/weather'
import { TEST_LOCATIONS, TEST_WEATHER_DATA } from '../constants'

describe('Weather Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default Chicago location', () => {
    const store = useWeatherStore()

    expect(store.currentLocation).toEqual(TEST_LOCATIONS.CHICAGO)
    expect(store.currentWeather).toBeNull()
    expect(store.hourlyForecast).toEqual([])
    expect(store.dailyForecast).toEqual([])
    expect(store.hourlyForecastByDate).toEqual({})
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('sets location correctly', () => {
    const store = useWeatherStore()
    const newLocation: Location = TEST_LOCATIONS.NEW_YORK

    store.setLocation(newLocation)
    expect(store.currentLocation).toEqual(newLocation)
  })

  it('sets current weather correctly', () => {
    const store = useWeatherStore()
    const weather: CurrentWeather = TEST_WEATHER_DATA.CURRENT

    store.setCurrentWeather(weather)
    expect(store.currentWeather).toEqual(weather)
  })

  it('sets hourly forecast correctly', () => {
    const store = useWeatherStore()
    const forecast: HourlyForecast[] = [TEST_WEATHER_DATA.HOURLY_SAMPLE]

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

  it('sets daily forecast correctly', () => {
    const store = useWeatherStore()
    const forecast: DailyForecast[] = [TEST_WEATHER_DATA.DAILY_SAMPLE]

    store.setDailyForecast(forecast)
    expect(store.dailyForecast).toEqual(forecast)
  })

  it('sets location and clears data correctly', () => {
    const store = useWeatherStore()
    const newLocation: Location = TEST_LOCATIONS.NEW_YORK

    // Set some data first
    store.setCurrentWeather(TEST_WEATHER_DATA.CURRENT)
    store.setHourlyForecast([TEST_WEATHER_DATA.HOURLY_SAMPLE])
    store.setDailyForecast([TEST_WEATHER_DATA.DAILY_SAMPLE])
    store.setError('Some error')

    // Change location and verify data is cleared
    store.setLocationAndClear(newLocation)

    expect(store.currentLocation).toEqual(newLocation)
    expect(store.currentWeather).toBeNull()
    expect(store.hourlyForecast).toEqual([])
    expect(store.dailyForecast).toEqual([])
    expect(store.hourlyForecastByDate).toEqual({})
    expect(store.error).toBeNull()
  })

  it('computes next7Days correctly', () => {
    const store = useWeatherStore()
    const mockDailyForecast: DailyForecast[] = Array.from({ length: 10 }, (_, i) => ({
      ...TEST_WEATHER_DATA.DAILY_SAMPLE,
      date: `2022-01-${String(i + 1).padStart(2, '0')}`
    }))

    store.setDailyForecast(mockDailyForecast)
    expect(store.next7Days).toHaveLength(7)
    expect(store.next7Days).toEqual(mockDailyForecast.slice(0, 7))
  })

  it('computes todaysForecast and tomorrowsForecast correctly', () => {
    const store = useWeatherStore()
    const mockDailyForecast: DailyForecast[] = [
      { ...TEST_WEATHER_DATA.DAILY_SAMPLE, date: '2022-01-01' },
      { ...TEST_WEATHER_DATA.DAILY_SAMPLE, date: '2022-01-02' }
    ]

    store.setDailyForecast(mockDailyForecast)
    expect(store.todaysForecast).toEqual(mockDailyForecast[0])
    expect(store.tomorrowsForecast).toEqual(mockDailyForecast[1])
  })

  it('returns null for todaysForecast when no data', () => {
    const store = useWeatherStore()
    expect(store.todaysForecast).toBeNull()
  })

  it('loads hourly forecast by date', async () => {
    const store = useWeatherStore()
    const mockHourlyData = [TEST_WEATHER_DATA.HOURLY_SAMPLE]

    // Mock the weatherApi service
    const mockGetHourlyForecastForDay = vi.fn().mockResolvedValue(mockHourlyData)
    store.weatherApiService.getHourlyForecastForDay = mockGetHourlyForecastForDay

    await store.loadHourlyForecastForDay('2022-01-01')

    expect(mockGetHourlyForecastForDay).toHaveBeenCalledWith(store.currentLocation, '2022-01-01')
    expect(store.hourlyForecastByDate['2022-01-01']).toEqual(mockHourlyData)
  })

  it('handles hourly forecast loading error', async () => {
    const store = useWeatherStore()
    const errorMessage = 'API Error'

    // Mock the weatherApi service to throw error
    const mockGetHourlyForecastForDay = vi.fn().mockRejectedValue(new Error(errorMessage))
    store.weatherApiService.getHourlyForecastForDay = mockGetHourlyForecastForDay

    // Expect the method to throw the error
    await expect(store.loadHourlyForecastForDay('2022-01-01')).rejects.toThrow('API Error')
  })

  it('loads daily forecast correctly', async () => {
    const store = useWeatherStore()
    const mockDailyData = [TEST_WEATHER_DATA.DAILY_SAMPLE]

    // Mock the weatherApi service
    const mockGetDailyForecast = vi.fn().mockResolvedValue(mockDailyData)
    store.weatherApiService.getDailyForecast = mockGetDailyForecast

    await store.loadDailyForecast()

    expect(mockGetDailyForecast).toHaveBeenCalledWith(store.currentLocation)
    expect(store.dailyForecast).toEqual(mockDailyData)
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('handles daily forecast loading error', async () => {
    const store = useWeatherStore()
    const errorMessage = 'API Error'

    // Mock the weatherApi service to throw error
    const mockGetDailyForecast = vi.fn().mockRejectedValue(new Error(errorMessage))
    store.weatherApiService.getDailyForecast = mockGetDailyForecast

    await store.loadDailyForecast()

    expect(store.error).toBe('Failed to load daily forecast')
    expect(store.isLoading).toBe(false)
  })

  describe('setLocationAndReload', () => {
    it('clears data, sets location, and reloads daily forecast', async () => {
      const store = useWeatherStore()
      const mockDailyData = [TEST_WEATHER_DATA.DAILY_SAMPLE]

      // Set initial data that should be cleared
      store.setCurrentWeather(TEST_WEATHER_DATA.CURRENT)
      store.setDailyForecast([TEST_WEATHER_DATA.DAILY_SAMPLE])

      // Mock the weatherApi service
      const mockGetDailyForecast = vi.fn().mockResolvedValue(mockDailyData)
      store.weatherApiService.getDailyForecast = mockGetDailyForecast

      const newLocation = { lat: 40.7128, lng: -74.006, name: 'New York, NY' }

      await store.setLocationAndReload(newLocation)

      // Verify location was set
      expect(store.currentLocation).toEqual(newLocation)

      // Verify daily forecast was loaded for new location
      expect(mockGetDailyForecast).toHaveBeenCalledWith(newLocation)
      expect(store.dailyForecast).toEqual(mockDailyData)
    })

    it('handles errors during daily forecast reload', async () => {
      const store = useWeatherStore()

      // Mock the weatherApi service to throw error
      const mockGetDailyForecast = vi.fn().mockRejectedValue(new Error('API Error'))
      store.weatherApiService.getDailyForecast = mockGetDailyForecast

      const newLocation = { lat: 40.7128, lng: -74.006, name: 'New York, NY' }

      await store.setLocationAndReload(newLocation)

      // Verify location was still set even with error
      expect(store.currentLocation).toEqual(newLocation)

      // Verify error was handled
      expect(store.error).toBe('Failed to load daily forecast')
    })

    it('clears all weather data when changing location', async () => {
      const store = useWeatherStore()

      // Set initial data
      store.setCurrentWeather(TEST_WEATHER_DATA.CURRENT)
      store.setDailyForecast([TEST_WEATHER_DATA.DAILY_SAMPLE])
      store.hourlyForecastByDate['2022-01-01'] = [TEST_WEATHER_DATA.HOURLY_SAMPLE]

      // Mock the weatherApi service
      const mockGetDailyForecast = vi.fn().mockResolvedValue([])
      store.weatherApiService.getDailyForecast = mockGetDailyForecast

      const newLocation = { lat: 40.7128, lng: -74.006, name: 'New York, NY' }

      await store.setLocationAndReload(newLocation)

      // Verify all weather data was cleared initially
      expect(store.currentWeather).toBeNull()
      expect(Object.keys(store.hourlyForecastByDate)).toHaveLength(0)
    })
  })
})
